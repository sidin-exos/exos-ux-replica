
-- 1. contact_submissions: super admin only
DROP POLICY IF EXISTS "select_any_admin" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can read contact submissions" ON public.contact_submissions;
CREATE POLICY "select_super_admin_only"
  ON public.contact_submissions FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 2. scenario_feedback: super admin only
DROP POLICY IF EXISTS "select_any_admin" ON public.scenario_feedback;
DROP POLICY IF EXISTS "Admins can read scenario feedback" ON public.scenario_feedback;
CREATE POLICY "select_super_admin_only"
  ON public.scenario_feedback FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 3. chat_feedback: enforce org membership on insert
DROP POLICY IF EXISTS "insert_anon_or_authenticated" ON public.chat_feedback;
CREATE POLICY "insert_authenticated_own_org"
  ON public.chat_feedback FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND organization_id = public.get_user_org_id(auth.uid())
  );
CREATE POLICY "insert_anonymous_default_org"
  ON public.chat_feedback FOR INSERT TO anon
  WITH CHECK (
    user_id IS NULL
    AND organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  );

-- 4. user_funnel_events: add INSERT policy
DROP POLICY IF EXISTS "Users insert own events" ON public.user_funnel_events;
CREATE POLICY "Users insert own events"
  ON public.user_funnel_events FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- 5. user-files storage: add UPDATE policy mirroring INSERT
DROP POLICY IF EXISTS "user_update_own_files" ON storage.objects;
CREATE POLICY "user_update_own_files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-files'
    AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-files'
    AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
