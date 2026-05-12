-- ============================================================
-- Security Audit Fix #1 — Billing / Subscription self-escalation
-- ============================================================
-- The hardened profiles UPDATE WITH CHECK (FIX 1B in
-- 20260325135127_security_scanner_findings.sql) pins only `role` and
-- `is_super_admin` to their previous values for self-edits. The later
-- migration 20260422085725 added Stripe / subscription columns to
-- `profiles` with no guard, allowing any authenticated user to run:
--
--   UPDATE profiles
--   SET subscription_status = 'active',
--       current_period_end  = '2099-01-01'
--   WHERE id = auth.uid();
--
-- and grant themselves paid features, or rewrite `stripe_customer_id`
-- to point at another customer (refund / billing-confusion fraud).
--
-- This migration:
--   1. Extends `guard_profile_update` with Block 4 — rejects DISTINCT
--      writes to any billing column from a non-super-admin self-edit.
--   2. Mirrors the pins in the profiles UPDATE policy WITH CHECK as
--      defense-in-depth.
-- ============================================================


-- ============================================================
-- Step 1: Extend guard_profile_update to block billing self-edits
-- ============================================================
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

    -- Super admin bypass: platform admins can manage any org / billing
    IF public.is_super_admin(auth.uid()) THEN
        RETURN NEW;
    END IF;

    -- Block is_super_admin self-escalation (from FIX 1A)
    IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
        RAISE EXCEPTION 'Cannot modify super_admin status via profile update';
    END IF;

    -- Block 1: Prevent org TRANSFERS (org A -> org B); allow initial assignment (NULL -> org)
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

    -- Block 4: Billing / subscription fields are managed by the
    -- stripe-webhook edge function (service_role) only. Regular users
    -- updating their own row cannot modify these columns.
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

    RETURN NEW;
END;
$$;


-- ============================================================
-- Step 2: Defense-in-depth — pin billing columns in policy WITH CHECK
-- ============================================================
-- Mirrors the trigger guard at the RLS layer. If the trigger is ever
-- accidentally dropped or bypassed, the policy still rejects the write.
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
            -- Regular users updating own row: role, is_super_admin,
            -- and ALL billing columns must stay unchanged
            id = auth.uid()
            AND role                   IS NOT DISTINCT FROM (SELECT p.role                   FROM profiles p WHERE p.id = auth.uid())
            AND is_super_admin         IS NOT DISTINCT FROM (SELECT p.is_super_admin         FROM profiles p WHERE p.id = auth.uid())
            AND stripe_customer_id     IS NOT DISTINCT FROM (SELECT p.stripe_customer_id     FROM profiles p WHERE p.id = auth.uid())
            AND stripe_subscription_id IS NOT DISTINCT FROM (SELECT p.stripe_subscription_id FROM profiles p WHERE p.id = auth.uid())
            AND subscription_status    IS NOT DISTINCT FROM (SELECT p.subscription_status    FROM profiles p WHERE p.id = auth.uid())
            AND subscription_price_id  IS NOT DISTINCT FROM (SELECT p.subscription_price_id  FROM profiles p WHERE p.id = auth.uid())
            AND trial_ends_at          IS NOT DISTINCT FROM (SELECT p.trial_ends_at          FROM profiles p WHERE p.id = auth.uid())
            AND current_period_end     IS NOT DISTINCT FROM (SELECT p.current_period_end     FROM profiles p WHERE p.id = auth.uid())
        )
        OR (
            -- Org admins managing their org (cannot change billing either —
            -- billing is per-user/profile and only writable by the Stripe
            -- webhook running with service_role)
            organization_id = get_user_org_id(auth.uid())
            AND is_org_admin(auth.uid())
        )
    );
