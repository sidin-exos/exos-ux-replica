-- =============================================================================
-- EXOS File Management: User Files & Scenario Attachments
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Creates user_files table for file metadata
--   2. Creates scenario_file_attachments junction table
--   3. Applies auto_set_organization_id() trigger to both tables
--   4. Creates org-scoped RLS policies (3 per table = 6 total)
--   5. Creates user-files storage bucket (private, MIME-restricted)
--   6. Creates storage policies for org-scoped file access (3 policies)
--
-- SECURITY MODEL:
--   - Files are org-isolated: users can only access files within their org
--   - Storage path: {org_id}/{user_id}/{uuid}-{filename} = physical isolation
--   - SELECT: own files + admin sees all in org
--   - INSERT/DELETE: own files only
--   - No UPDATE: files are immutable
--
-- DEPENDS ON: 007 (auto_set_organization_id trigger, helper functions)
-- =============================================================================


-- =========================================================
-- PART 1: user_files TABLE
-- =========================================================

CREATE TABLE public.user_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    file_type       TEXT NOT NULL CHECK (file_type IN ('xlsx', 'docx', 'pdf')),
    mime_type       TEXT NOT NULL CHECK (mime_type IN (
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
    )),
    file_size       INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
    storage_path    TEXT NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_files_org ON public.user_files (organization_id);
CREATE INDEX idx_user_files_user ON public.user_files (user_id);

COMMENT ON TABLE public.user_files IS
    'Metadata for user-uploaded files (xlsx, docx, pdf). Actual files in user-files storage bucket.';


-- =========================================================
-- PART 2: scenario_file_attachments TABLE
-- =========================================================

CREATE TABLE public.scenario_file_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    file_id         UUID NOT NULL REFERENCES public.user_files(id) ON DELETE CASCADE,
    scenario_type   TEXT NOT NULL,
    scenario_run_id TEXT NOT NULL,
    attached_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(file_id, scenario_run_id)
);

ALTER TABLE public.scenario_file_attachments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_scenario_file_attachments_org ON public.scenario_file_attachments (organization_id);
CREATE INDEX idx_scenario_file_attachments_run ON public.scenario_file_attachments (scenario_run_id);

COMMENT ON TABLE public.scenario_file_attachments IS
    'Links user_files to scenario analysis runs for additional context.';


-- =========================================================
-- PART 3: AUTO-SET TRIGGERS
-- =========================================================

CREATE TRIGGER trg_auto_org_user_files
    BEFORE INSERT ON public.user_files
    FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();

CREATE TRIGGER trg_auto_org_scenario_file_attachments
    BEFORE INSERT ON public.scenario_file_attachments
    FOR EACH ROW EXECUTE FUNCTION public.auto_set_organization_id();


-- =========================================================
-- PART 4: RLS POLICIES — user_files (3 policies)
-- =========================================================

-- SELECT: own files + admin sees all in org
CREATE POLICY "select_own_or_admin_in_org"
    ON public.user_files FOR SELECT TO authenticated
    USING (
        organization_id = get_user_org_id(auth.uid())
        AND (auth.uid() = user_id OR is_org_admin(auth.uid()))
    );

-- INSERT: own files only, org validated against profile
CREATE POLICY "insert_own_in_org"
    ON public.user_files FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND organization_id = get_user_org_id(auth.uid())
    );

-- DELETE: own files only
CREATE POLICY "delete_own_in_org"
    ON public.user_files FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id
        AND organization_id = get_user_org_id(auth.uid())
    );


-- =========================================================
-- PART 5: RLS POLICIES — scenario_file_attachments (3 policies)
-- =========================================================

CREATE POLICY "select_own_or_admin_in_org"
    ON public.scenario_file_attachments FOR SELECT TO authenticated
    USING (
        organization_id = get_user_org_id(auth.uid())
        AND (auth.uid() = user_id OR is_org_admin(auth.uid()))
    );

CREATE POLICY "insert_own_in_org"
    ON public.scenario_file_attachments FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND organization_id = get_user_org_id(auth.uid())
    );

CREATE POLICY "delete_own_in_org"
    ON public.scenario_file_attachments FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id
        AND organization_id = get_user_org_id(auth.uid())
    );


-- =========================================================
-- PART 6: STORAGE BUCKET — user-files
-- =========================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-files',
    'user-files',
    false,
    10485760,
    ARRAY[
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
    ]
);


-- =========================================================
-- PART 7: STORAGE POLICIES — org-scoped access
-- =========================================================
-- Path structure: {org_id}/{user_id}/{uuid}-{filename}
-- storage.foldername() returns array of folder segments (1-indexed in Postgres)

-- Upload: user can insert into their own org/user folder only
CREATE POLICY "user_upload_own_folder"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'user-files'
        AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

-- Download: own files + admin sees all in org
CREATE POLICY "user_select_own_org"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'user-files'
        AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
        AND (
            (storage.foldername(name))[2] = auth.uid()::text
            OR is_org_admin(auth.uid())
        )
    );

-- Delete: own files only
CREATE POLICY "user_delete_own_files"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'user-files'
        AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
        AND (storage.foldername(name))[2] = auth.uid()::text
    );


-- =========================================================
-- VERIFICATION
-- =========================================================
--
-- 1. New tables:
--    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_files', 'scenario_file_attachments');
--    Expected: 2 rows
--
-- 2. New policies (6 table + 3 storage = 9):
--    SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('user_files', 'scenario_file_attachments');
--    Expected: 6 rows
--
-- 3. Storage bucket:
--    SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'user-files';
--    Expected: id='user-files', public=false, file_size_limit=10485760
--
-- 4. Triggers:
--    SELECT trigger_name FROM information_schema.triggers WHERE event_object_table IN ('user_files', 'scenario_file_attachments');
--    Expected: trg_auto_org_user_files, trg_auto_org_scenario_file_attachments
