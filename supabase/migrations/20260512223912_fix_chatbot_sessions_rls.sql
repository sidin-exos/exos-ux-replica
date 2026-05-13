-- ============================================================
-- Security Audit Fix #8 — chatbot_sessions cross-org INSERT/UPDATE
-- ============================================================
-- The original policies in 20260322121114 only checked `user_id =
-- auth.uid()` on INSERT and UPDATE. The auto_set_organization_id
-- trigger preserves any client-supplied `organization_id` if it is
-- already populated, so a user could:
--
--   INSERT INTO chatbot_sessions
--     (user_id, organization_id, bot_type, …)
--   VALUES
--     (auth.uid(), '<other-orgs-id>', 'guide', …);
--
-- and tag the row with another org's UUID, poisoning that org's
-- admin analytics view (the SELECT policy lets admins of an org
-- read every row carrying their organization_id).
--
-- This migration tightens the WITH CHECK clauses to require both
-- the user identity AND the organization scope to match the
-- caller's actual org via get_user_org_id(auth.uid()).
-- ============================================================

DROP POLICY IF EXISTS "insert_own_session" ON public.chatbot_sessions;
CREATE POLICY "insert_own_session" ON public.chatbot_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND organization_id = public.get_user_org_id(auth.uid())
  );

DROP POLICY IF EXISTS "update_own_session" ON public.chatbot_sessions;
CREATE POLICY "update_own_session" ON public.chatbot_sessions
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND organization_id = public.get_user_org_id(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    AND organization_id = public.get_user_org_id(auth.uid())
  );
