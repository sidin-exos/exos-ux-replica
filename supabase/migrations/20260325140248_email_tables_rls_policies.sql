-- ============================================================
-- FIX: Add RLS policies to email infrastructure tables
-- ============================================================
-- All four email tables have RLS enabled but zero policies,
-- meaning any authenticated user can read all email logs,
-- unsubscribe tokens, and suppressed emails.
--
-- All legitimate access is via service_role (edge functions) or
-- SECURITY DEFINER functions, both of which bypass RLS.
-- Block all direct access; allow super_admin SELECT for monitoring.
-- ============================================================


-- email_send_log: super_admin can read, nobody else
CREATE POLICY "super_admin_read" ON public.email_send_log
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "no_direct_insert" ON public.email_send_log
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "no_direct_update" ON public.email_send_log
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY "no_direct_delete" ON public.email_send_log
  FOR DELETE TO authenticated USING (false);


-- email_unsubscribe_tokens: block all direct access
CREATE POLICY "no_direct_select" ON public.email_unsubscribe_tokens
  FOR SELECT TO authenticated USING (false);

CREATE POLICY "no_direct_insert" ON public.email_unsubscribe_tokens
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "no_direct_update" ON public.email_unsubscribe_tokens
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY "no_direct_delete" ON public.email_unsubscribe_tokens
  FOR DELETE TO authenticated USING (false);


-- suppressed_emails: block all direct access
CREATE POLICY "no_direct_select" ON public.suppressed_emails
  FOR SELECT TO authenticated USING (false);

CREATE POLICY "no_direct_insert" ON public.suppressed_emails
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "no_direct_update" ON public.suppressed_emails
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY "no_direct_delete" ON public.suppressed_emails
  FOR DELETE TO authenticated USING (false);


-- email_send_state: super_admin can read config, nobody modifies directly
CREATE POLICY "super_admin_read" ON public.email_send_state
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "no_direct_insert" ON public.email_send_state
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "no_direct_update" ON public.email_send_state
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY "no_direct_delete" ON public.email_send_state
  FOR DELETE TO authenticated USING (false);
