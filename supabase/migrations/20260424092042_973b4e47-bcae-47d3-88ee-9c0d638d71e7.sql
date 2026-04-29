ALTER TABLE public.procurement_categories
  ADD COLUMN IF NOT EXISTS category_hot_yaml text,
  ADD COLUMN IF NOT EXISTS category_cold_yaml text;

COMMENT ON COLUMN public.procurement_categories.category_hot_yaml IS 'v3 HOT tier: ~420 tokens always-loaded grounding block (spend type, kraljic, volatility, top cost drivers, primary scenarios, KPIs, regulatory anchors). Source: EXOS_Procurement_Category_Context_v3.';
COMMENT ON COLUMN public.procurement_categories.category_cold_yaml IS 'v3 COLD tier: ~700 tokens conditional grounding block, loaded only for risk/strategy scenarios (S17, S20, S22, S25, S26, S27). Source: EXOS_Procurement_Category_Context_v3.';