-- =============================================================================
-- EXOS Multi-Tenancy: Migration 010
-- Fix guard_profile_update: skip checks for service_role (auth.uid() IS NULL)
-- =============================================================================
--
-- BUG: Guard blocked role changes from SQL editor / service_role context
--   because auth.uid() is NULL → is_org_admin(NULL) = false → EXCEPTION.
--   Also blocked initial admin setup (chicken-and-egg: need admin to set admin).
-- FIX: Skip all guards when auth.uid() IS NULL (service_role is trusted).
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
    -- Service_role bypass: auth.uid() is NULL in service_role context (SQL editor, edge functions)
    -- Service_role is trusted — skip all guards
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

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