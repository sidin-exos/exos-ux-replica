-- Tighten SELECT on user files to the uploader only.
-- Removes the super_admin and is_org_admin bypasses on both the user_files
-- table and the storage bucket, so /account shows only files the viewer
-- uploaded (matching the existing INSERT/DELETE policies).

drop policy if exists "select_own_or_admin_in_org" on public.user_files;

create policy "select_own_in_org"
    on public.user_files for select to authenticated
    using (
        auth.uid() = user_id
        and organization_id = get_user_org_id(auth.uid())
    );

drop policy if exists "user_select_own_org" on storage.objects;

create policy "user_select_own_files"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'user-files'
        and (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
        and (storage.foldername(name))[2] = auth.uid()::text
    );
