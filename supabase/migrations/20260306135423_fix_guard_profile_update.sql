-- =============================================================================
-- EXOS Multi-Tenancy: Migration 009
-- Fix guard_profile_update: allow initial org assignment (NULL → org)
-- =============================================================================
--
-- BUG: Block 1 rejected ALL organization_id changes, including initial
--   assignment from NULL to an org. This blocked admin setup for new users.
-- FIX: Only block transfers (org A → org B). Allow NULL → org.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _admin_count INTEGER;
BEGIN
    -- Block 1: Prevent org TRANSFERS (org A → org B) but allow initial assignment (NULL → org)
    IF OLD.organization_id IS NOT NULL 
       AND NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
        RAISE EXCEPTION 'Cannot change organization membership via profile update';
    END IF;

    -- Block 2: Only admins can change role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_org_admin(auth.uid()) THEN
            RAISE EXCEPTION 'Only admins can change roles';
        END IF;

        -- Block 3: Prevent ANY demotion that would leave org with zero admins
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