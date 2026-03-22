
-- chatbot_sessions table for tracking EXOS Guide and Scenario Assistant usage
CREATE TABLE public.chatbot_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  bot_type text NOT NULL CHECK (bot_type IN ('guide', 'scenario_assistant')),
  scenario_id text,
  message_count integer NOT NULL DEFAULT 0,
  fields_extracted integer NOT NULL DEFAULT 0,
  fields_applied boolean NOT NULL DEFAULT false,
  navigation_action text,
  error_count integer NOT NULL DEFAULT 0,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- RLS
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own sessions
CREATE POLICY "insert_own_session" ON public.chatbot_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own sessions
CREATE POLICY "update_own_session" ON public.chatbot_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Super admins and org admins can read
CREATE POLICY "select_admin" ON public.chatbot_sessions
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      public.is_org_admin(auth.uid())
      AND organization_id = public.get_user_org_id(auth.uid())
    )
  );

-- Auto-set organization_id trigger
CREATE TRIGGER set_chatbot_session_org
  BEFORE INSERT ON public.chatbot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_id();
