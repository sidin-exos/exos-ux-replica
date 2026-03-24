
-- Email infrastructure tables for transactional email system

-- 1. suppressed_emails - tracks bounced/complained/unsubscribed addresses
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'unsubscribe',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT suppressed_emails_email_key UNIQUE (email)
);

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

-- 2. email_unsubscribe_tokens - one token per email address
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_unsubscribe_tokens_email_key UNIQUE (email)
);

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

-- 3. email_send_log - audit trail for all email sends
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT,
  recipient_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

-- 4. email_send_state - single-row config for rate limiting and throughput
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  retry_after_until TIMESTAMPTZ,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

-- Insert default config row
INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Create enqueue_email RPC wrapper for pgmq
-- Since pgmq may not be available on external Supabase, we create a simple function
-- that inserts into email_send_log directly as a fallback
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into email_send_log as pending
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
