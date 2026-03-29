-- =============================================================================
-- Fix file_access_audit.organization_id type: TEXT → UUID
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Removes any rows with non-UUID organization_id values (e.g., "unknown")
--   2. Changes organization_id column from TEXT to UUID
--   3. Adds FK constraint to organizations table
--   4. Updates the RLS policy to remove the ::text cast (types now match natively)
--
-- WHY:
--   The original TEXT type allowed invalid org IDs (e.g., "unknown" from
--   file-download denied-access logging) and had no FK constraint.
--   This fixes type safety and referential integrity.
--
-- DEPENDS ON: 20260311205527_file_security_hardening.sql
-- =============================================================================


-- 1. Remove rows with non-UUID organization_id values
DELETE FROM public.file_access_audit
WHERE organization_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';


-- 2. Drop the RLS policy BEFORE altering the column type (Postgres requires this)
DROP POLICY IF EXISTS "select_admin_in_org" ON public.file_access_audit;


-- 3. Change column type from TEXT to UUID
ALTER TABLE public.file_access_audit
    ALTER COLUMN organization_id TYPE UUID USING organization_id::uuid;


-- 4. Add FK constraint to organizations table
ALTER TABLE public.file_access_audit
    ADD CONSTRAINT fk_file_audit_org
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


-- 5. Re-create RLS policy without ::text cast (types now match natively)
CREATE POLICY "select_admin_in_org"
    ON public.file_access_audit FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR (
            is_org_admin(auth.uid())
            AND organization_id = get_user_org_id(auth.uid())
        )
    );


-- =============================================================================
-- VERIFICATION
-- =============================================================================
--
-- 1. Column type:
--    SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_name = 'file_access_audit' AND column_name = 'organization_id';
--    Expected: uuid
--
-- 2. FK constraint:
--    SELECT constraint_name FROM information_schema.table_constraints
--    WHERE table_name = 'file_access_audit' AND constraint_type = 'FOREIGN KEY';
--    Expected: fk_file_audit_org
--
-- 3. RLS policy (no ::text cast):
--    SELECT policyname, qual FROM pg_policies
--    WHERE tablename = 'file_access_audit' AND policyname = 'select_admin_in_org';
