CREATE TABLE public.chat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL,
  conversation_messages jsonb,
  rating text NOT NULL CHECK (rating IN ('helpful', 'not_helpful')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit chat feedback"
  ON public.chat_feedback FOR INSERT
  WITH CHECK (true);