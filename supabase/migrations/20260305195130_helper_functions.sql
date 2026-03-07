-- =============================================================================
-- EXOS Multi-Tenancy: Migration 002
-- Helper functions: get_user_org_id(), get_user_org_role(), is_org_admin()
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. get_user_org_id(user_id) — returns the user's organization_id
--   2. get_user_org_role(user_id) — returns the user's org_role
--   3. is_org_admin(user_id) — shorthand admin check
--
-- WHY SECURITY DEFINER:
--   Called from RLS policies. INVOKER would cause infinite recursion
--   on profiles table. DEFINER bypasses RLS to read profiles directly.
--   search_path = public prevents search-path injection.
--
-- DEPENDS ON: create_organizations_and_profiles (profiles table must exist)
-- SAFE TO RUN: Yes — creates new functions only.
--
-- ROLLBACK:
--   DROP FUNCTION IF EXISTS public.is_org_admin(uuid);
--   DROP FUNCTION IF EXISTS public.get_user_org_role(uuid);
--   DROP FUNCTION IF EXISTS public.get_user_org_id(uuid);
-- =============================================================================


-- -----------------------------------------------
-- 1. Get user's organization ID
-- -----------------------------------------------
-- Used in RLS: WHERE organization_id = get_user_org_id(auth.uid())

CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id
    FROM public.profiles
    WHERE id = _user_id;
$$;

COMMENT ON FUNCTION public.get_user_org_id(uuid) IS
    'Returns the organization_id for a user. Used in RLS policies.';


-- -----------------------------------------------
-- 2. Get user's role within their organization
-- -----------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_org_role(_user_id UUID)
RETURNS public.org_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.profiles
    WHERE id = _user_id;
$$;

COMMENT ON FUNCTION public.get_user_org_role(uuid) IS
    'Returns the org_role for a user. Used in RLS policies for RBAC.';


-- -----------------------------------------------
-- 3. Shorthand: is this user an org admin?
-- -----------------------------------------------

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = _user_id
        AND role = 'admin'
    );
$$;

COMMENT ON FUNCTION public.is_org_admin(uuid) IS
    'Returns true if user has admin role in their organization.';