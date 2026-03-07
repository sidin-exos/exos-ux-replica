-- =============================================================================
-- EXOS Multi-Tenancy: Migration 007
-- New org-scoped RLS policies + auto-set trigger + security fixes
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Creates auto_set_organization_id() trigger for automatic org assignment
--   2. Applies trigger to all 8 tables with organization_id
--   3. Creates 36 new org-scoped RLS policies for all 17 tables
--   4. Fixes bug §4.1: chat_feedback anonymous insert
--   5. Fixes bug §4.3: chat_feedback missing admin SELECT
--   6. Fixes bug: saved_intel_configs UPDATE without WITH CHECK
--   7. Fixes: get_evolutionary_directives privilege escalation
--   8. Updates create_shared_report to include organization_id
--   9. Re-applies grants for shared_reports
--
-- CRITICAL: Run immediately after 006 (drop policies). Between 006 and 007,
--   all tables have RLS enabled but no policies — only service_role has access.
--
-- DEPENDS ON: 005 (org_id on intel_queries, shared_reports), 006 (old policies dropped)
--
-- ROLLBACK: Drop all policies created here, drop triggers, drop function.
-- =============================================================================


-- =========================================================
-- PART 1: AUTO-SET TRIGGER FOR organization_id
-- =========================================================
-- This trigger automatically fills organization_id on INSERT so the
-- frontend doesn't need to know about it. Without this, every INSERT
-- from the frontend would fail because organization_id is NOT NULL
-- but the frontend code doesn't send it.
--
-- Logic:
--   1. If organization_id is already set (e.g., by service_role), keep it
--   2. If user is authenticated, look up their org from profiles
--   3. If anonymous or no profile, use Default Organization
--
-- PostgreSQL executes BEFORE INSERT triggers BEFORE evaluating WITH CHECK
-- policies, so the trigger sets the value, then the policy validates it.

CREATE OR REPLACE FUNCTION public.auto_set_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _org_id UUID;
BEGIN
    -- If already set (service_role or explicit), keep it
    IF NEW.organization_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- If authenticated, get org from profile
    IF auth.uid() IS NOT NULL THEN
        SELECT organization_id INTO _org_id
        FROM public.profiles
        WHERE id = auth.uid();

        IF _org_id IS NOT NULL THEN
            NEW.organization_id := _org_id;
            RETURN NEW;
        END IF;
    END IF;

    -- Fallback: Default Organization (anonymous or no profile yet)
    NEW.organization_id := '00000000-0000-0000-0000-000000000001';
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_set_organization_id() IS
    'Auto-fills organization_id on INSERT from user profile or default org.';

-- Apply to all 8 tables with organization_id
CREATE TRIGGER trg_auto_org_saved_intel_configs
    BEFORE INSERT ON public.saved_intel_configs
    FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER trg_auto_org_enterprise_trackers
    BEFORE INSERT ON public.enterprise_trackers
    FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER trg_auto_org_chat_feedback
    BEFORE INSERT ON public.chat_feedback
    FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER trg_auto_org_founder_metrics
    BEFORE INSERT ON public.founder_metrics
    FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER trg_auto_org_test_prompts
    BEFORE INSERT ON public.test_prompts
    FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER trg_auto_org_test_reports
    BEFORE INSERT ON public.test_reports
    FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER trg_auto_org_intel_queries
    BEFORE INSERT ON public.intel_queries
    FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER trg_auto_org_shared_reports
    BEFORE INSERT ON public.shared_reports
    FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();


-- =========================================================
-- PART 2: SECURITY DEFINER FUNCTION FIXES
-- =========================================================

-- 2a. Fix get_evolutionary_directives — privilege escalation
--     Currently: PUBLIC can execute, bypasses admin-only RLS on test_reports.
--     Fix: Revoke public access, add internal admin check.

CREATE OR REPLACE FUNCTION public.get_evolutionary_directives(limit_num integer DEFAULT 3)
RETURNS TABLE(target_scenario text, directive_text text, source_field_action text, occurrence_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Admin check: only org admins can access pipeline metadata
    IF NOT public.is_org_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    RETURN QUERY
    WITH extracted_redundant AS (
        SELECT
            jsonb_array_elements_text(shadow_log->'redundant_fields') AS field_name
        FROM public.test_reports
        WHERE shadow_log IS NOT NULL
          AND shadow_log ? 'redundant_fields'
          AND organization_id = public.get_user_org_id(auth.uid())
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

REVOKE EXECUTE ON FUNCTION public.get_evolutionary_directives(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_evolutionary_directives(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_evolutionary_directives(integer) TO authenticated;


-- 2b. Update create_shared_report to include organization_id
--     The function now auto-sets organization_id from the caller's profile.

CREATE OR REPLACE FUNCTION public.create_shared_report(p_payload jsonb, p_expires_at timestamp with time zone)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_share_id text;
    v_org_id uuid;
BEGIN
    -- Validate payload size (1MB limit)
    IF octet_length(p_payload::text) > 1048576 THEN
        RAISE EXCEPTION 'Payload too large (max 1MB)';
    END IF;

    -- Get caller's organization (NULL for anon — will use default)
    SELECT organization_id INTO v_org_id
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_org_id IS NULL THEN
        v_org_id := '00000000-0000-0000-0000-000000000001';
    END IF;

    -- Generate cryptographically secure share_id server-side
    v_share_id := encode(gen_random_bytes(16), 'hex');

    INSERT INTO public.shared_reports (share_id, payload, expires_at, organization_id)
    VALUES (v_share_id, p_payload, p_expires_at, v_org_id);

    RETURN v_share_id;
END;
$function$;


-- =========================================================
-- PART 3: NEW RLS POLICIES (36 total)
-- =========================================================


-- ---------------------------------------------------------
-- 3.1 saved_intel_configs (4 policies)
-- Pattern: user owns rows within their org, admin sees all in org
-- ---------------------------------------------------------

CREATE POLICY "select_own_or_admin_in_org"
    ON public.saved_intel_configs FOR SELECT TO authenticated
    USING (
        organization_id = get_user_org_id(auth.uid())
        AND (auth.uid() = user_id OR is_org_admin(auth.uid()))
    );

CREATE POLICY "insert_own_in_org"
    ON public.saved_intel_configs FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        -- organization_id auto-set by trigger, then validated here
        AND organization_id = get_user_org_id(auth.uid())
    );

-- FIX: Added WITH CHECK — prevents user_id transfer attack
CREATE POLICY "update_own_in_org"
    ON public.saved_intel_configs FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id
        AND organization_id = get_user_org_id(auth.uid())
    )
    WITH CHECK (
        auth.uid() = user_id
        AND organization_id = get_user_org_id(auth.uid())
    );

CREATE POLICY "delete_own_in_org"
    ON public.saved_intel_configs FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id
        AND organization_id = get_user_org_id(auth.uid())
    );


-- ---------------------------------------------------------
-- 3.2 enterprise_trackers (4 policies)
-- Same pattern as saved_intel_configs
-- ---------------------------------------------------------

CREATE POLICY "select_own_or_admin_in_org"
    ON public.enterprise_trackers FOR SELECT TO authenticated
    USING (
        organization_id = get_user_org_id(auth.uid())
        AND (auth.uid() = user_id OR is_org_admin(auth.uid()))
    );

CREATE POLICY "insert_own_in_org"
    ON public.enterprise_trackers FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND organization_id = get_user_org_id(auth.uid())
    );

CREATE POLICY "update_own_in_org"
    ON public.enterprise_trackers FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id
        AND organization_id = get_user_org_id(auth.uid())
    )
    WITH CHECK (
        auth.uid() = user_id
        AND organization_id = get_user_org_id(auth.uid())
    );

CREATE POLICY "delete_own_in_org"
    ON public.enterprise_trackers FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id
        AND organization_id = get_user_org_id(auth.uid())
    );


-- ---------------------------------------------------------
-- 3.3 chat_feedback (2 policies)
-- FIX §4.1: Anonymous insert now works (user_id IS NULL allowed)
-- FIX §4.3: Admin SELECT now exists, scoped to org
-- Trigger auto-sets organization_id for both anon and auth users
-- ---------------------------------------------------------

CREATE POLICY "insert_anon_or_authenticated"
    ON public.chat_feedback FOR INSERT TO public
    WITH CHECK (
        user_id IS NULL OR auth.uid() = user_id
    );

CREATE POLICY "select_admin_in_org"
    ON public.chat_feedback FOR SELECT TO authenticated
    USING (
        is_org_admin(auth.uid())
        AND organization_id = get_user_org_id(auth.uid())
    );


-- ---------------------------------------------------------
-- 3.4 founder_metrics (3 policies)
-- Org admin only, scoped to their org
-- ---------------------------------------------------------

CREATE POLICY "select_admin_in_org"
    ON public.founder_metrics FOR SELECT TO authenticated
    USING (
        is_org_admin(auth.uid())
        AND organization_id = get_user_org_id(auth.uid())
    );

CREATE POLICY "insert_admin_in_org"
    ON public.founder_metrics FOR INSERT TO authenticated
    WITH CHECK (
        is_org_admin(auth.uid())
        AND organization_id = get_user_org_id(auth.uid())
    );

CREATE POLICY "update_admin_in_org"
    ON public.founder_metrics FOR UPDATE TO authenticated
    USING (
        is_org_admin(auth.uid())
        AND organization_id = get_user_org_id(auth.uid())
    )
    WITH CHECK (
        is_org_admin(auth.uid())
        AND organization_id = get_user_org_id(auth.uid())
    );


-- ---------------------------------------------------------
-- 3.5 test_prompts (2 policies)
-- Org admin only, scoped to their org
-- ---------------------------------------------------------

CREATE POLICY "select_admin_in_org"
    ON public.test_prompts FOR SELECT TO authenticated
    USING (
        is_org_admin(auth.uid())
        AND organization_id = get_user_org_id(auth.uid())
    );

CREATE POLICY "insert_admin_in_org"
    ON public.test_prompts FOR INSERT TO authenticated
    WITH CHECK (
        is_org_admin(auth.uid())
        AND organization_id = get_user_org_id(auth.uid())
    );


-- ---------------------------------------------------------
-- 3.6 test_reports (2 policies)
-- Org admin only, scoped to their org
-- ---------------------------------------------------------

CREATE POLICY "select_admin_in_org"
    ON public.test_reports FOR SELECT TO authenticated
    USING (
        is_org_admin(auth.uid())
        AND organization_id = get_user_org_id(auth.uid())
    );

CREATE POLICY "insert_admin_in_org"
    ON public.test_reports FOR INSERT TO authenticated
    WITH CHECK (
        is_org_admin(auth.uid())
        AND organization_id = get_user_org_id(auth.uid())
    );


-- ---------------------------------------------------------
-- 3.7 intel_queries (1 policy)
-- FIX H-2: No longer public. Authenticated users see only their org's queries.
-- Writes happen via service_role in edge functions (bypass RLS).
-- ---------------------------------------------------------

CREATE POLICY "select_authenticated_in_org"
    ON public.intel_queries FOR SELECT TO authenticated
    USING (
        organization_id = get_user_org_id(auth.uid())
    );


-- ---------------------------------------------------------
-- 3.8 shared_reports (4 policies — fully locked, RPC-only)
-- Access only through create_shared_report() and get_shared_report() RPCs.
-- These are SECURITY DEFINER and bypass RLS entirely.
-- ---------------------------------------------------------

CREATE POLICY "no_direct_select"
    ON public.shared_reports FOR SELECT TO public
    USING (false);

CREATE POLICY "no_direct_insert"
    ON public.shared_reports FOR INSERT TO public
    WITH CHECK (false);

CREATE POLICY "no_direct_update"
    ON public.shared_reports FOR UPDATE TO public
    USING (false);

CREATE POLICY "no_direct_delete"
    ON public.shared_reports FOR DELETE TO public
    USING (false);


-- ---------------------------------------------------------
-- 3.9 industry_contexts (1 policy)
-- Global reference data — unchanged from original
-- ---------------------------------------------------------

CREATE POLICY "publicly_readable"
    ON public.industry_contexts FOR SELECT TO public
    USING (true);


-- ---------------------------------------------------------
-- 3.10 procurement_categories (1 policy)
-- Global reference data — unchanged from original
-- ---------------------------------------------------------

CREATE POLICY "publicly_readable"
    ON public.procurement_categories FOR SELECT TO public
    USING (true);


-- ---------------------------------------------------------
-- 3.11 validation_rules (1 policy)
-- Global system config — unchanged from original
-- ---------------------------------------------------------

CREATE POLICY "publicly_readable"
    ON public.validation_rules FOR SELECT TO public
    USING (true);


-- ---------------------------------------------------------
-- 3.12 market_insights (1 policy)
-- Global knowledge base — unchanged from original (Q2: keep global)
-- ---------------------------------------------------------

CREATE POLICY "publicly_readable"
    ON public.market_insights FOR SELECT TO public
    USING (true);


-- ---------------------------------------------------------
-- 3.13 contact_submissions (2 policies)
-- Public INSERT (pre-auth form), any org admin can read
-- No org_id — platform-level submissions
-- ---------------------------------------------------------

CREATE POLICY "anyone_can_submit"
    ON public.contact_submissions FOR INSERT TO public
    WITH CHECK (true);

CREATE POLICY "select_any_admin"
    ON public.contact_submissions FOR SELECT TO authenticated
    USING (
        is_org_admin(auth.uid())
    );


-- ---------------------------------------------------------
-- 3.14 scenario_feedback (2 policies)
-- Public INSERT (anonymous feedback), any org admin can read.
-- NOTE (Opus review #1): Could add optional org_id for authenticated
-- feedback. Deferred to future — no sensitive data in this table
-- (just scenario_id, rating, feedback_text). Not a security risk.
-- ---------------------------------------------------------

CREATE POLICY "anyone_can_submit"
    ON public.scenario_feedback FOR INSERT TO public
    WITH CHECK (true);

CREATE POLICY "select_any_admin"
    ON public.scenario_feedback FOR SELECT TO authenticated
    USING (
        is_org_admin(auth.uid())
    );


-- ---------------------------------------------------------
-- 3.15 user_roles (1 policy)
-- Legacy table — being replaced by profiles.
-- Read-only for org admins. Write via service_role only.
-- has_role() is SECURITY DEFINER and bypasses this policy.
-- ---------------------------------------------------------

CREATE POLICY "select_any_admin"
    ON public.user_roles FOR SELECT TO authenticated
    USING (
        is_org_admin(auth.uid())
    );


-- ---------------------------------------------------------
-- 3.16 organizations (3 policies)
-- Members see their own org, authenticated can create, admin can update
-- ---------------------------------------------------------

CREATE POLICY "select_own_org"
    ON public.organizations FOR SELECT TO authenticated
    USING (
        id = get_user_org_id(auth.uid())
    );

-- FIX (Opus review #2): Only users without an org can create one.
-- Prevents unlimited org creation. One user = one org for MVP.
CREATE POLICY "insert_if_no_org"
    ON public.organizations FOR INSERT TO authenticated
    WITH CHECK (
        get_user_org_id(auth.uid()) IS NULL
    );

CREATE POLICY "update_admin_own_org"
    ON public.organizations FOR UPDATE TO authenticated
    USING (
        id = get_user_org_id(auth.uid())
        AND is_org_admin(auth.uid())
    )
    WITH CHECK (
        id = get_user_org_id(auth.uid())
        AND is_org_admin(auth.uid())
    );


-- ---------------------------------------------------------
-- 3.17 profiles (2 policies + column guard trigger)
-- User sees own profile. Admin sees all in org.
-- FIX (Opus review #3): Column-level guard prevents:
--   - Anyone changing organization_id (only system triggers do this)
--   - Non-admins changing role
--   - Admin demoting themselves if they're the last admin
-- ---------------------------------------------------------

-- Column guard trigger — runs BEFORE UPDATE, blocks forbidden changes
CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _admin_count INTEGER;
BEGIN
    -- Block 1: Nobody can change organization_id via UPDATE
    -- Only handle_org_created trigger sets this on INSERT
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
        RAISE EXCEPTION 'Cannot change organization membership via profile update';
    END IF;

    -- Block 2: Only admins can change role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_org_admin(auth.uid()) THEN
            RAISE EXCEPTION 'Only admins can change roles';
        END IF;

        -- Block 3: Prevent ANY demotion that would leave org with zero admins
        -- FOR UPDATE locks the rows — prevents concurrent demotion race condition
        -- (two admins simultaneously demoting each other → 0 admins)
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

CREATE TRIGGER trg_guard_profile_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.guard_profile_update();

CREATE POLICY "select_own_or_admin_in_org"
    ON public.profiles FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR (
            organization_id = get_user_org_id(auth.uid())
            AND is_org_admin(auth.uid())
        )
    );

-- User can update own display_name.
-- Admin can update role of org members (guarded by trigger).
-- Trigger blocks org_id change and self-demotion.
CREATE POLICY "update_own_or_admin_in_org"
    ON public.profiles FOR UPDATE TO authenticated
    USING (
        id = auth.uid()
        OR (
            organization_id = get_user_org_id(auth.uid())
            AND is_org_admin(auth.uid())
        )
    )
    WITH CHECK (
        id = auth.uid()
        OR (
            organization_id = get_user_org_id(auth.uid())
            AND is_org_admin(auth.uid())
        )
    );


-- =========================================================
-- PART 4: RE-APPLY GRANTS
-- =========================================================
-- shared_reports: revoke direct access (RPC-only model)

REVOKE ALL ON public.shared_reports FROM anon;
REVOKE ALL ON public.shared_reports FROM authenticated;

-- Shared report RPCs
GRANT EXECUTE ON FUNCTION public.create_shared_report(jsonb, timestamptz) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_shared_report(jsonb, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_shared_report(text) TO anon, authenticated;

-- View access
GRANT SELECT ON public.pipeline_iq_stats TO anon;
GRANT SELECT ON public.pipeline_iq_stats TO authenticated;


-- =========================================================
-- VERIFICATION
-- =========================================================
--
-- 1. Policy count:
--    SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
--    Expected: 36
--
-- 2. Policies per table:
--    SELECT tablename, count(*) FROM pg_policies
--    WHERE schemaname = 'public' GROUP BY tablename ORDER BY tablename;
--
--    Expected:
--    chat_feedback: 2
--    contact_submissions: 2
--    enterprise_trackers: 4
--    founder_metrics: 3
--    industry_contexts: 1
--    intel_queries: 1
--    market_insights: 1
--    organizations: 3
--    procurement_categories: 1
--    profiles: 2
--    saved_intel_configs: 4
--    scenario_feedback: 2
--    shared_reports: 4
--    test_prompts: 2
--    test_reports: 2
--    user_roles: 1
--    validation_rules: 1
--
-- 3. Trigger count (expect 15 total: 3 original updated_at + 3 Phase 1 + 8 auto_org + 1 guard_profile):
--    SELECT count(*) FROM information_schema.triggers WHERE trigger_schema = 'public';
--
-- 4. Verify get_evolutionary_directives is restricted:
--    SELECT has_function_privilege('anon', 'get_evolutionary_directives(integer)', 'EXECUTE');
--    Expected: false