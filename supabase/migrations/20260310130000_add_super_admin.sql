-- =============================================================================
-- EXOS: Add Super Admin (Platform-Level Admin)
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Adds is_super_admin column to profiles
--   2. Creates is_super_admin() helper function
--   3. Updates 9 SELECT RLS policies to allow super admin cross-org read
--   4. Updates profiles UPDATE policy for super admin cross-org management
--   5. Updates guard_profile_update() trigger for super admin bypass
--   6. Updates get_evolutionary_directives() for super admin access
--   7. Seeds initial super admins by email
--
-- DEPENDS ON: 20260306135605 (guard_profile_update_v2), 20260305204137 (policies)
-- =============================================================================


-- =========================================================
-- PART 1: COLUMN + HELPER FUNCTION
-- =========================================================

ALTER TABLE public.profiles
    ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_super_admin FROM public.profiles WHERE id = _user_id),
        false
    );
$$;

COMMENT ON FUNCTION public.is_super_admin(UUID) IS
    'Returns true if the user is a platform-level super admin.';


-- =========================================================
-- PART 2: UPDATE SELECT RLS POLICIES (9 policies)
-- =========================================================
-- Pattern: prepend is_super_admin(auth.uid()) OR to each USING clause.
-- Must DROP then CREATE because Postgres has no CREATE OR REPLACE POLICY.

-- 2.1 saved_intel_configs
DROP POLICY "select_own_or_admin_in_org" ON public.saved_intel_configs;
CREATE POLICY "select_own_or_admin_in_org"
    ON public.saved_intel_configs FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR (
            organization_id = get_user_org_id(auth.uid())
            AND (auth.uid() = user_id OR is_org_admin(auth.uid()))
        )
    );

-- 2.2 enterprise_trackers
DROP POLICY "select_own_or_admin_in_org" ON public.enterprise_trackers;
CREATE POLICY "select_own_or_admin_in_org"
    ON public.enterprise_trackers FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR (
            organization_id = get_user_org_id(auth.uid())
            AND (auth.uid() = user_id OR is_org_admin(auth.uid()))
        )
    );

-- 2.3 chat_feedback
DROP POLICY "select_admin_in_org" ON public.chat_feedback;
CREATE POLICY "select_admin_in_org"
    ON public.chat_feedback FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR (
            is_org_admin(auth.uid())
            AND organization_id = get_user_org_id(auth.uid())
        )
    );

-- 2.4 founder_metrics
DROP POLICY "select_admin_in_org" ON public.founder_metrics;
CREATE POLICY "select_admin_in_org"
    ON public.founder_metrics FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR (
            is_org_admin(auth.uid())
            AND organization_id = get_user_org_id(auth.uid())
        )
    );

-- 2.5 test_prompts
DROP POLICY "select_admin_in_org" ON public.test_prompts;
CREATE POLICY "select_admin_in_org"
    ON public.test_prompts FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR (
            is_org_admin(auth.uid())
            AND organization_id = get_user_org_id(auth.uid())
        )
    );

-- 2.6 test_reports
DROP POLICY "select_admin_in_org" ON public.test_reports;
CREATE POLICY "select_admin_in_org"
    ON public.test_reports FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR (
            is_org_admin(auth.uid())
            AND organization_id = get_user_org_id(auth.uid())
        )
    );

-- 2.7 intel_queries
DROP POLICY "select_authenticated_in_org" ON public.intel_queries;
CREATE POLICY "select_authenticated_in_org"
    ON public.intel_queries FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR organization_id = get_user_org_id(auth.uid())
    );

-- 2.8 organizations
DROP POLICY "select_own_org" ON public.organizations;
CREATE POLICY "select_own_org"
    ON public.organizations FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR id = get_user_org_id(auth.uid())
    );

-- 2.9 profiles
DROP POLICY "select_own_or_admin_in_org" ON public.profiles;
CREATE POLICY "select_own_or_admin_in_org"
    ON public.profiles FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR id = auth.uid()
        OR (
            organization_id = get_user_org_id(auth.uid())
            AND is_org_admin(auth.uid())
        )
    );


-- =========================================================
-- PART 3: UPDATE PROFILES UPDATE POLICY
-- =========================================================

DROP POLICY "update_own_or_admin_in_org" ON public.profiles;
CREATE POLICY "update_own_or_admin_in_org"
    ON public.profiles FOR UPDATE TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR id = auth.uid()
        OR (
            organization_id = get_user_org_id(auth.uid())
            AND is_org_admin(auth.uid())
        )
    )
    WITH CHECK (
        is_super_admin(auth.uid())
        OR id = auth.uid()
        OR (
            organization_id = get_user_org_id(auth.uid())
            AND is_org_admin(auth.uid())
        )
    );


-- =========================================================
-- PART 4: UPDATE guard_profile_update() TRIGGER
-- =========================================================
-- Super admins bypass all guards (can manage any org's roles).

CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _admin_count INTEGER;
BEGIN
    -- Service_role bypass: auth.uid() is NULL in service_role context
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Super admin bypass: platform admins can manage any org
    IF public.is_super_admin(auth.uid()) THEN
        RETURN NEW;
    END IF;

    -- Block 1: Prevent org TRANSFERS (org A -> org B) but allow initial assignment (NULL -> org)
    IF OLD.organization_id IS NOT NULL
       AND NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
        RAISE EXCEPTION 'Cannot change organization membership via profile update';
    END IF;

    -- Block 2: Only admins can change role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_org_admin(auth.uid()) THEN
            RAISE EXCEPTION 'Only admins can change roles';
        END IF;

        -- Block 3: Prevent demotion that would leave org with zero admins
        IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
            SELECT count(*) INTO _admin_count
            FROM public.profiles
            WHERE organization_id = OLD.organization_id
              AND role = 'admin'
              AND id != OLD.id
            FOR UPDATE;

            IF _admin_count = 0 THEN
                RAISE EXCEPTION 'Cannot remove the last admin from an organization';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


-- =========================================================
-- PART 5: UPDATE get_evolutionary_directives()
-- =========================================================
-- Super admins see cross-org data; org admins see only their org.

CREATE OR REPLACE FUNCTION public.get_evolutionary_directives(limit_num integer DEFAULT 3)
RETURNS TABLE(target_scenario text, directive_text text, source_field_action text, occurrence_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Access check: super admin or org admin
    IF NOT public.is_super_admin(auth.uid()) AND NOT public.is_org_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    RETURN QUERY
    WITH extracted_redundant AS (
        SELECT
            jsonb_array_elements_text(shadow_log->'redundant_fields') AS field_name
        FROM public.test_reports
        WHERE shadow_log IS NOT NULL
          AND shadow_log ? 'redundant_fields'
          AND (
              public.is_super_admin(auth.uid())
              OR organization_id = public.get_user_org_id(auth.uid())
          )
    ),
    redundant_counts AS (
        SELECT
            'Global'::TEXT AS target_scenario,
            ('Consider removing field: [' || field_name || '] — it consistently provides no analytical value.')::TEXT AS directive_text,
            'REDUNDANT_HIDE'::TEXT AS source_field_action,
            COUNT(*)::INT AS occurrence_count
        FROM extracted_redundant
        GROUP BY field_name
    )
    SELECT * FROM redundant_counts
    ORDER BY occurrence_count DESC
    LIMIT limit_num;
END;
$function$;


-- =========================================================
-- PART 6: SEED INITIAL SUPER ADMINS
-- =========================================================

UPDATE public.profiles SET is_super_admin = true
WHERE id IN (
    SELECT id FROM auth.users
    WHERE email IN ('mateja.ivosevic97@gmail.com', 'andrei.sidin@gmail.com')
);


-- =========================================================
-- VERIFICATION
-- =========================================================
--
-- 1. Column exists:
--    SELECT column_name, data_type, column_default
--    FROM information_schema.columns
--    WHERE table_name = 'profiles' AND column_name = 'is_super_admin';
--
-- 2. Function exists:
--    SELECT routine_name FROM information_schema.routines
--    WHERE routine_name = 'is_super_admin';
--
-- 3. Policy count unchanged (36 — we DROP+CREATE, not add):
--    SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
--
-- 4. Super admins seeded:
--    SELECT id, is_super_admin FROM profiles WHERE is_super_admin = true;
