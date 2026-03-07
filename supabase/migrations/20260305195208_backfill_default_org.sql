-- =============================================================================
-- EXOS Multi-Tenancy: Migration 003
-- Create default organization, backfill existing users
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Creates "Default Organization" with deterministic UUID
--   2. Creates profiles for any existing auth.users
--   3. Maps existing admin from user_roles to admin in profiles
--
-- NOTE ON NEW SUPABASE:
--   On the new Supabase, auth.users may be empty (no one has logged in yet).
--   That's fine — the INSERT...SELECT will match zero rows.
--   When Andrei logs in, the on_auth_user_created trigger (from 001) will
--   auto-create his profile. Then run the post-login script at the bottom
--   to assign him to the default org with admin role.
--
    -- DEPENDS ON: create_organizations_and_profiles, helper_functions
-- SAFE TO RUN: Yes — only inserts, no schema changes.
--
-- ROLLBACK:
--   DELETE FROM public.profiles;
--   DELETE FROM public.organizations WHERE id = '00000000-0000-0000-0000-000000000001';
-- =============================================================================


-- -----------------------------------------------
-- 1. Create default organization
-- -----------------------------------------------

INSERT INTO public.organizations (id, name, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default Organization',
    '{"is_default": true, "migrated_from": "pre-multi-tenancy"}'::jsonb
);

-- Note: on_org_created trigger fires but auth.uid() is NULL in SQL context,
-- so the UPDATE in handle_org_created matches zero rows. Safe.


-- -----------------------------------------------
-- 2. Create profiles for existing users
-- -----------------------------------------------
-- Maps existing user_roles admin entries to admin profiles.
-- All other users get 'user' role.

-- Admin users (from existing user_roles table)
INSERT INTO public.profiles (id, organization_id, role, display_name)
SELECT
    u.id,
    '00000000-0000-0000-0000-000000000001',
    'admin'::org_role,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email)
FROM auth.users u
WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u.id AND ur.role = 'admin'
)
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id)
ON CONFLICT (id) DO UPDATE SET
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin'::org_role;

-- Non-admin users
INSERT INTO public.profiles (id, organization_id, role, display_name)
SELECT
    u.id,
    '00000000-0000-0000-0000-000000000001',
    'user'::org_role,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email)
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u.id AND ur.role = 'admin'
)
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id);


-- -----------------------------------------------
-- POST-LOGIN SCRIPT (run AFTER Andrei's first login)
-- -----------------------------------------------
-- After Andrei logs in via Google OAuth on the new Supabase,
-- the on_auth_user_created trigger creates his profile with
-- organization_id = NULL. Run this to assign him:
--
--   UPDATE public.profiles
--   SET organization_id = '00000000-0000-0000-0000-000000000001',
--       role = 'admin'
--   WHERE id = (SELECT id FROM auth.users LIMIT 1);
--
--   INSERT INTO public.user_roles (user_id, role)
--   VALUES ((SELECT id FROM auth.users LIMIT 1), 'admin');
--
-- This sets him as admin in BOTH the new profiles system AND
-- the legacy user_roles table (needed until Phase 2 migrates
-- all RLS policies to use profiles instead of user_roles).