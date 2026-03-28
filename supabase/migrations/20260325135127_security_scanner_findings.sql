-- ============================================================
-- Security Scanner Fixes
-- ============================================================
-- FIX 1A: Guard is_super_admin column in guard_profile_update() trigger
-- FIX 1B: Defense-in-depth — tighten RLS WITH CHECK on profiles
-- FIX 2:  Restrict methodology tables SELECT to authenticated users
-- FIX 3:  Add SET search_path to log_methodology_change() (search-path injection)
-- FIX 4:  Document intentional WITH CHECK (true) on public form tables
-- ============================================================


-- ============================================================
-- FIX 1A: Guard is_super_admin in trigger
-- ============================================================
-- The existing trigger checks role changes but never checks is_super_admin.
-- Any authenticated user could set is_super_admin = true on their own row.
-- This fix adds an explicit block: only service_role can change is_super_admin.

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

    -- SECURITY FIX: Block is_super_admin self-escalation
    -- Only service_role can change this (already bypassed above)
    IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
        RAISE EXCEPTION 'Cannot modify super_admin status via profile update';
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


-- ============================================================
-- FIX 1B: Defense-in-depth — tighten RLS WITH CHECK on profiles
-- ============================================================
-- The existing WITH CHECK mirrors the USING clause, allowing any user
-- to write any column on their own row. This tightened version ensures
-- regular users cannot modify role or is_super_admin via RLS alone.

DROP POLICY IF EXISTS "update_own_or_admin_in_org" ON public.profiles;
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
        -- Super admins can do anything
        is_super_admin(auth.uid())
        OR (
            -- Regular users updating own row: role and is_super_admin must stay unchanged
            id = auth.uid()
            AND role IS NOT DISTINCT FROM (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
            AND is_super_admin IS NOT DISTINCT FROM (SELECT p.is_super_admin FROM profiles p WHERE p.id = auth.uid())
        )
        OR (
            -- Org admins managing their org
            organization_id = get_user_org_id(auth.uid())
            AND is_org_admin(auth.uid())
        )
    );


-- ============================================================
-- FIX 2: Restrict methodology tables to authenticated users
-- ============================================================
-- These tables had TO public USING (true), allowing anonymous reads
-- of AI system prompts, GDPR protocols, and proprietary methodology.

DROP POLICY IF EXISTS "methodology_config_select" ON public.methodology_config;
CREATE POLICY "methodology_config_select" ON public.methodology_config
  FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "coaching_cards_select" ON public.coaching_cards;
CREATE POLICY "coaching_cards_select" ON public.coaching_cards
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "scenario_field_config_select" ON public.scenario_field_config;
CREATE POLICY "scenario_field_config_select" ON public.scenario_field_config
  FOR SELECT TO authenticated USING (true);


-- ============================================================
-- FIX 3: Add SET search_path to log_methodology_change()
-- ============================================================
-- This SECURITY DEFINER function was missing SET search_path, making it
-- vulnerable to search-path injection if a malicious schema is prepended.
-- No logic changes — only the SET search_path directive is added.

CREATE OR REPLACE FUNCTION log_methodology_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_identifier TEXT;
  summary TEXT;
BEGIN
  IF TG_TABLE_NAME = 'coaching_cards' THEN
    record_identifier := COALESCE(NEW.scenario_slug, OLD.scenario_slug);
    summary := TG_OP || ' on ' || TG_TABLE_NAME || ' for ' || record_identifier;
  ELSIF TG_TABLE_NAME = 'scenario_field_config' THEN
    record_identifier := COALESCE(NEW.scenario_slug || '/' || NEW.block_id, OLD.scenario_slug || '/' || OLD.block_id);
    summary := TG_OP || ' on ' || TG_TABLE_NAME || ' for ' || record_identifier;
  ELSIF TG_TABLE_NAME = 'methodology_config' THEN
    record_identifier := COALESCE(NEW.key, OLD.key);
    summary := TG_OP || ' on ' || TG_TABLE_NAME || ' key=' || record_identifier;
  ELSE
    record_identifier := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
    summary := TG_OP || ' on ' || TG_TABLE_NAME;
  END IF;

  INSERT INTO public.methodology_change_log (
    table_name, record_id, operation, changed_by,
    old_data, new_data, change_summary
  ) VALUES (
    TG_TABLE_NAME,
    record_identifier,
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    summary
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;


-- ============================================================
-- FIX 4: Document intentional WITH CHECK (true) on public form tables
-- ============================================================
-- The following INSERT policies intentionally use WITH CHECK (true):
--
--   contact_submissions — "anyone_can_submit"
--     Allows unauthenticated users to submit the public contact form.
--     The table only accepts inserts; no UPDATE/DELETE policies exist.
--     Rate limiting is enforced at the edge function layer.
--
--   scenario_feedback — "anyone_can_submit"
--     Allows unauthenticated users to submit scenario feedback ratings.
--     The table only accepts inserts; no UPDATE/DELETE policies exist.
--
-- These are NOT security bugs — they are required for public form functionality.
