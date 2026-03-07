-- =============================================================================
-- EXOS Multi-Tenancy: Migration 001
-- Create organizations table, profiles table, and signup triggers
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Creates 'org_role' enum (admin, manager, user)
--   2. Creates 'organizations' table
--   3. Creates 'profiles' table (auth.users → organizations with role)
--   4. Trigger: auto-create profile on user signup
--   5. Trigger: auto-assign admin when user creates an organization
--
-- DEPENDS ON: baseline_schema (app_role enum, update_updated_at_column)
-- SAFE TO RUN: Yes — purely additive. No existing tables modified.
--
-- ROLLBACK:
--   DROP TRIGGER IF EXISTS on_org_created ON public.organizations;
--   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--   DROP FUNCTION IF EXISTS public.handle_org_created();
--   DROP FUNCTION IF EXISTS public.handle_new_user();
--   DROP TABLE IF EXISTS public.profiles;
--   DROP TABLE IF EXISTS public.organizations;
--   DROP TYPE IF EXISTS public.org_role;
-- =============================================================================


-- -----------------------------------------------
-- 1. New role enum for multi-tenant RBAC
-- -----------------------------------------------
-- Existing 'app_role' has ('admin','user').
-- New enum adds 'manager'. Old enum stays until Phase 2.

CREATE TYPE public.org_role AS ENUM ('admin', 'manager', 'user');


-- -----------------------------------------------
-- 2. Organizations table
-- -----------------------------------------------

CREATE TABLE public.organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_organizations_name ON public.organizations (name);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Temporary policies — replaced with org-scoped policies in Phase 2
CREATE POLICY "temp_org_select_authenticated"
    ON public.organizations FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "temp_org_insert_authenticated"
    ON public.organizations FOR INSERT TO authenticated
    WITH CHECK (true);

COMMENT ON TABLE public.organizations IS
    'Multi-tenant organizations. Each org contains users and isolated data.';


-- -----------------------------------------------
-- 3. Profiles table
-- -----------------------------------------------
-- Links auth.users → organizations with a role.
-- PK = auth.users.id (one profile per user).
-- One user belongs to one org (single-tenancy per user for MVP).

CREATE TABLE public.profiles (
    id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id   UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    role              public.org_role NOT NULL DEFAULT 'user',
    display_name      TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_org_id ON public.profiles (organization_id);
CREATE INDEX idx_profiles_org_role ON public.profiles (organization_id, role);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Temporary policies — replaced in Phase 2
CREATE POLICY "temp_profiles_select_own"
    ON public.profiles FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "temp_profiles_update_own"
    ON public.profiles FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

COMMENT ON TABLE public.profiles IS
    'User profiles with org membership and role. PK = auth.users.id.';


-- -----------------------------------------------
-- 4. Auto-create profile on user signup
-- -----------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.email
        )
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
    'Auto-creates a profile when a new user signs up via auth.';


-- -----------------------------------------------
-- 5. Auto-assign admin on org creation
-- -----------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_org_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET organization_id = NEW.id,
        role = 'admin'
    WHERE id = auth.uid();

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_org_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_org_created();

COMMENT ON FUNCTION public.handle_org_created() IS
    'Auto-assigns creating user as admin of newly created organization.';