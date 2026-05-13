-- ============================================================
-- Security Audit Fix #16 — search_path on handle_new_user_funnel
-- ============================================================
-- The funnel trigger created in 20260403213936_create_user_funnel_events.sql
-- is declared SECURITY DEFINER but omits `SET search_path`. SECURITY
-- DEFINER functions run with the owner's privileges; if a malicious
-- schema is prepended to the session search path (via a separate
-- vulnerability or admin error), unqualified references like
-- `user_funnel_events` could resolve to attacker-controlled
-- relations. Pinning search_path closes that injection vector.
--
-- This migration only adds `SET search_path = public, pg_catalog`;
-- the function body is unchanged.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_funnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.user_funnel_events (user_id, event_name, checkpoint, properties, source)
  VALUES (NEW.id, 'user_signed_up', 'CP1', '{"plan":"free"}'::jsonb, 'trigger');
  RETURN NEW;
END;
$$;
