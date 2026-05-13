-- ============================================================
-- Security Audit Fix #2 — Lock down public.enqueue_email
-- ============================================================
-- enqueue_email was created in 20260324214501 as a SECURITY DEFINER
-- function with no auth check and no REVOKE. By default, PostgreSQL
-- grants EXECUTE on functions to PUBLIC, so any anonymous or
-- authenticated caller could:
--
--   select public.enqueue_email('any', jsonb_build_object(
--     'to',         'victim@example.com',
--     'label',      'reset_password',
--     'message_id', gen_random_uuid()
--   ));
--
-- and queue arbitrary outbound mail through our domain
-- (spam / phishing). The function is intended for server-side use
-- (service_role) only — no edge function or client should call it
-- with the user's JWT.
--
-- This migration:
--   1. Re-declares the function with an explicit auth.uid() IS NULL
--      check (service_role context) — defense-in-depth.
--   2. REVOKEs EXECUTE from PUBLIC, anon, authenticated.
--   3. GRANTs EXECUTE to service_role explicitly.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization: only the service_role (auth.uid() IS NULL) may
  -- enqueue mail. The function is invoked from server-side jobs and
  -- edge functions running with the service-role key, never with a
  -- user JWT.
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'enqueue_email is service_role only';
  END IF;

  INSERT INTO public.email_send_log (
    message_id,
    template_name,
    recipient_email,
    status,
    metadata
  ) VALUES (
    payload->>'message_id',
    payload->>'label',
    payload->>'to',
    'pending',
    payload
  );
END;
$$;

-- Strip the implicit PUBLIC grant and any role-level grants
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM authenticated;

-- Explicitly authorize the service role
GRANT  EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;
