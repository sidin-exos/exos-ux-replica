-- ============================================================
-- Security Audit Fixes — #17 (admin RPC defense-in-depth),
-- #18 (profile NULL->org hijack + PII pin), M5 (funnel view RLS).
-- ============================================================
-- 1. SECURITY DEFINER wrappers around super-admin-only reads so a
--    regressed RLS policy on the underlying tables cannot leak
--    investor financials or methodology IP.
-- 2. guard_profile_update: block NULL -> org_id transitions by
--    non-super-admins (closes the residual hijack vector identified
--    in audit issue #18) and pin the email column to prevent
--    profile-row spoofing diverging from auth.users.email.
-- 3. Pin security_invoker = on on the funnel views so they always
--    enforce RLS on user_funnel_events even if the view owner is
--    elevated.
-- ============================================================


-- ============================================================
-- 1. SECURITY DEFINER read wrappers for super-admin tables
-- ============================================================
-- All four functions re-check public.is_super_admin(auth.uid())
-- before returning rows. EXECUTE is revoked from PUBLIC/anon and
-- granted only to `authenticated` — non-super-admins call the RPC,
-- get an exception, and never touch the underlying tables.

-- 1a. founder_metrics
CREATE OR REPLACE FUNCTION public.get_founder_metrics()
RETURNS SETOF public.founder_metrics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.founder_metrics;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_founder_metrics() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_founder_metrics() TO authenticated;


-- 1b. coaching_cards
CREATE OR REPLACE FUNCTION public.get_coaching_cards()
RETURNS SETOF public.coaching_cards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.coaching_cards ORDER BY scenario_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_coaching_cards() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_coaching_cards() TO authenticated;


-- 1c. methodology_config
CREATE OR REPLACE FUNCTION public.get_methodology_configs()
RETURNS SETOF public.methodology_config
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.methodology_config ORDER BY key;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_methodology_configs() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_methodology_configs() TO authenticated;


-- 1d. methodology_change_log (paginated). Returns the page rows plus
--     total count so the client can render pagination controls.
CREATE OR REPLACE FUNCTION public.get_methodology_change_log(
  p_offset INTEGER DEFAULT 0,
  p_limit  INTEGER DEFAULT 20
)
RETURNS TABLE (
  entry      public.methodology_change_log,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  _total BIGINT;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  -- Defensive bounds — prevent abuse of an arbitrarily large limit.
  IF p_limit IS NULL OR p_limit < 1 THEN p_limit := 20; END IF;
  IF p_limit > 200 THEN p_limit := 200; END IF;
  IF p_offset IS NULL OR p_offset < 0 THEN p_offset := 0; END IF;

  SELECT COUNT(*) INTO _total FROM public.methodology_change_log;

  RETURN QUERY
    SELECT mcl, _total
    FROM public.methodology_change_log AS mcl
    ORDER BY mcl.changed_at DESC
    OFFSET p_offset
    LIMIT  p_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_methodology_change_log(INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_methodology_change_log(INTEGER, INTEGER) TO authenticated;


-- ============================================================
-- 2. guard_profile_update — close NULL -> org hijack and pin email
-- ============================================================
-- Audit issue #18 noted that the WITH CHECK self-branch only
-- prevented org TRANSFERS (NON-NULL -> NON-NULL). A user with a
-- historic NULL organization_id (pre-default-org rollout) could
-- still self-assign into any UUID. We now block NULL -> any unless
-- the caller is service_role or a super_admin. We also pin
-- `email` to prevent the profile-mirrored email from diverging from
-- auth.users.email and confusing downstream code (e.g., email
-- routing, invitations).
CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    _admin_count INTEGER;
    _has_email_column BOOLEAN;
BEGIN
    -- Service_role bypass: auth.uid() is NULL in service_role context
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Super admin bypass: platform admins can manage any org / billing
    IF public.is_super_admin(auth.uid()) THEN
        RETURN NEW;
    END IF;

    -- Block is_super_admin self-escalation
    IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
        RAISE EXCEPTION 'Cannot modify super_admin status via profile update';
    END IF;

    -- Block 1: Prevent org changes including the NULL -> org path.
    -- Previously only NON-NULL -> NON-NULL was blocked; a historic
    -- profile with NULL organization_id could self-assign into any
    -- target org. Now any DISTINCT change requires super-admin /
    -- service_role.
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
        RAISE EXCEPTION 'Cannot change organization membership via profile update';
    END IF;

    -- Block 2: Only admins can change role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_org_admin(auth.uid()) THEN
            RAISE EXCEPTION 'Only admins can change roles';
        END IF;

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

    -- Block 3: Billing / subscription fields (from fix #1).
    IF auth.uid() = NEW.id AND (
        NEW.stripe_customer_id      IS DISTINCT FROM OLD.stripe_customer_id      OR
        NEW.stripe_subscription_id  IS DISTINCT FROM OLD.stripe_subscription_id  OR
        NEW.subscription_status     IS DISTINCT FROM OLD.subscription_status     OR
        NEW.subscription_price_id   IS DISTINCT FROM OLD.subscription_price_id   OR
        NEW.trial_ends_at           IS DISTINCT FROM OLD.trial_ends_at           OR
        NEW.current_period_end      IS DISTINCT FROM OLD.current_period_end
    ) THEN
        RAISE EXCEPTION 'Billing fields cannot be modified by user';
    END IF;

    -- Block 4: Pin `email` on profiles when the column exists.
    -- The canonical email lives in auth.users; the profiles copy is
    -- maintained by handle_new_user / service-role processes. A user
    -- editing their email here would diverge from auth.users.email
    -- and confuse invitation routing, billing lookups, and email
    -- suppression matching. We branch on column existence so this
    -- migration is safe on schemas where `email` is not (yet) on
    -- profiles.
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'profiles'
          AND column_name  = 'email'
    ) INTO _has_email_column;

    IF _has_email_column AND auth.uid() = NEW.id THEN
        -- Use to_jsonb() to read the column dynamically without a
        -- hard reference (which would fail if the column doesn't
        -- exist at function compile time).
        IF (to_jsonb(NEW) ->> 'email') IS DISTINCT FROM (to_jsonb(OLD) ->> 'email') THEN
            RAISE EXCEPTION 'Email cannot be changed via profile update';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


-- ============================================================
-- 3. security_invoker on funnel views (audit M5)
-- ============================================================
-- Views default to security_definer semantics in some Postgres
-- builds, which would let a caller bypass user_funnel_events' RLS
-- by querying the view directly. Pinning security_invoker = on
-- ensures the underlying SELECT runs with the caller's privileges
-- and is therefore RLS-checked.
ALTER VIEW public.v_funnel_overview      SET (security_invoker = on);
ALTER VIEW public.v_checkpoint_dropoff   SET (security_invoker = on);
ALTER VIEW public.v_user_journey         SET (security_invoker = on);
ALTER VIEW public.v_weekly_cohort_health SET (security_invoker = on);
