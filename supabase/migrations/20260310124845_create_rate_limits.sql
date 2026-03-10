-- Rate limiting table for AI-calling edge functions
-- Tracks per-user request counts to prevent cost abuse

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  endpoint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups (user + endpoint + time window)
CREATE INDEX idx_rate_limits_lookup
  ON public.rate_limits (user_id, endpoint, created_at DESC);

-- RLS: no public access. Only service_role writes/reads.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies = only service_role can access

-- Cleanup function: delete rows older than 2 hours
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '2 hours';
$$;
