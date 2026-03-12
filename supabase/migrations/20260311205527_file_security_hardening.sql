-- =============================================================================
-- EXOS File Management: Security Hardening
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Creates file_access_audit table for download/access logging
--   2. Adds super_admin bypass to user_files SELECT policy
--   3. Adds super_admin bypass to scenario_file_attachments SELECT policy
--   4. Adds super_admin bypass to storage SELECT policy
--   5. Adds CHECK constraint on storage_path format (path traversal prevention)
--
-- DEPENDS ON: 20260311120000_create_user_files.sql, 20260310130000_add_super_admin.sql
-- =============================================================================


-- =========================================================
-- PART 1: FILE ACCESS AUDIT TABLE
-- =========================================================

CREATE TABLE public.file_access_audit (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id         UUID REFERENCES public.user_files(id) ON DELETE SET NULL,
    accessed_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('upload', 'download', 'delete', 'denied')),
    status          TEXT NOT NULL CHECK (status IN ('success', 'denied', 'error')),
    error_message   TEXT,
    ip_address      TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.file_access_audit ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_file_audit_org_time ON public.file_access_audit (organization_id, created_at DESC);
CREATE INDEX idx_file_audit_file ON public.file_access_audit (file_id);
CREATE INDEX idx_file_audit_user ON public.file_access_audit (accessed_by);

COMMENT ON TABLE public.file_access_audit IS
    'Audit log for file access events. Written by Edge Functions via service_role. GDPR Article 32 compliance.';

-- No authenticated policies — only service_role can write (Edge Functions)
-- Org admins can read their org's audit logs
CREATE POLICY "select_admin_in_org"
    ON public.file_access_audit FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR (
            is_org_admin(auth.uid())
            AND organization_id = get_user_org_id(auth.uid())::text
        )
    );


-- =========================================================
-- PART 2: SUPER ADMIN BYPASS ON user_files SELECT
-- =========================================================

DROP POLICY IF EXISTS "select_own_or_admin_in_org" ON public.user_files;

CREATE POLICY "select_own_or_admin_in_org"
    ON public.user_files FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR (
            organization_id = get_user_org_id(auth.uid())
            AND (auth.uid() = user_id OR is_org_admin(auth.uid()))
        )
    );


-- =========================================================
-- PART 3: SUPER ADMIN BYPASS ON scenario_file_attachments SELECT
-- =========================================================

DROP POLICY IF EXISTS "select_own_or_admin_in_org" ON public.scenario_file_attachments;

CREATE POLICY "select_own_or_admin_in_org"
    ON public.scenario_file_attachments FOR SELECT TO authenticated
    USING (
        is_super_admin(auth.uid())
        OR (
            organization_id = get_user_org_id(auth.uid())
            AND (auth.uid() = user_id OR is_org_admin(auth.uid()))
        )
    );


-- =========================================================
-- PART 4: SUPER ADMIN BYPASS ON STORAGE SELECT
-- =========================================================

DROP POLICY IF EXISTS "user_select_own_org" ON storage.objects;

CREATE POLICY "user_select_own_org"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'user-files'
        AND (
            is_super_admin(auth.uid())
            OR (
                (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
                AND (
                    (storage.foldername(name))[2] = auth.uid()::text
                    OR is_org_admin(auth.uid())
                )
            )
        )
    );


-- =========================================================
-- PART 5: STORAGE PATH FORMAT CONSTRAINT (path traversal prevention)
-- =========================================================

ALTER TABLE public.user_files
    ADD CONSTRAINT chk_storage_path_format
    CHECK (storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[a-zA-Z0-9._-]+$');

COMMENT ON CONSTRAINT chk_storage_path_format ON public.user_files IS
    'Enforces {org_uuid}/{user_uuid}/{file_uuid}-{filename} format. Prevents path traversal attacks.';


-- =========================================================
-- VERIFICATION
-- =========================================================
--
-- 1. Audit table:
--    SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='file_access_audit';
--
-- 2. Super admin bypass on user_files:
--    SELECT policyname, qual FROM pg_policies WHERE tablename='user_files' AND policyname='select_own_or_admin_in_org';
--    Expected: qual should contain 'is_super_admin'
--
-- 3. Storage path constraint:
--    SELECT constraint_name FROM information_schema.table_constraints
--    WHERE table_name='user_files' AND constraint_type='CHECK' AND constraint_name='chk_storage_path_format';
