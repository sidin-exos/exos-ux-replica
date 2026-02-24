
-- Fix: Make pipeline_iq_stats use SECURITY INVOKER so it respects the querying user's RLS
ALTER VIEW public.pipeline_iq_stats SET (security_invoker = on);
