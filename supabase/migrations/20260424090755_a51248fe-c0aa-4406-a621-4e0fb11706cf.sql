ALTER TABLE public.industry_contexts
  ADD COLUMN IF NOT EXISTS industry_hot_yaml text,
  ADD COLUMN IF NOT EXISTS industry_cold_yaml text;

COMMENT ON COLUMN public.industry_contexts.industry_hot_yaml IS 'v2 HOT tier: ~380 tokens always-loaded grounding block (CRITICAL blockers + HIGH constraint labels + top 4 KPIs). Source: EXOS_Industry_Constraints_KPIs_v2.';
COMMENT ON COLUMN public.industry_contexts.industry_cold_yaml IS 'v2 COLD tier: ~1100 tokens conditional grounding block, loaded only for risk/compliance scenarios (S16, S17, S20, S22, S25, S26, S27, S29). Source: EXOS_Industry_Constraints_KPIs_v2.';