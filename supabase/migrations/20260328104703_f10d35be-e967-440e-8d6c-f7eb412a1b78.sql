
-- Add enriched JSONB columns to industry_contexts
ALTER TABLE public.industry_contexts
  ADD COLUMN IF NOT EXISTS constraints_v2 JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS kpis_v2 JSONB DEFAULT '[]';

-- Add enriched columns to procurement_categories
ALTER TABLE public.procurement_categories
  ADD COLUMN IF NOT EXISTS category_group TEXT,
  ADD COLUMN IF NOT EXISTS spend_type TEXT,
  ADD COLUMN IF NOT EXISTS kraljic_position TEXT,
  ADD COLUMN IF NOT EXISTS kraljic_rationale TEXT,
  ADD COLUMN IF NOT EXISTS price_volatility TEXT,
  ADD COLUMN IF NOT EXISTS market_structure TEXT,
  ADD COLUMN IF NOT EXISTS supply_concentration TEXT,
  ADD COLUMN IF NOT EXISTS key_cost_drivers JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS procurement_levers JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS negotiation_dynamics TEXT,
  ADD COLUMN IF NOT EXISTS should_cost_components TEXT,
  ADD COLUMN IF NOT EXISTS eu_regulatory_context TEXT,
  ADD COLUMN IF NOT EXISTS common_failure_modes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS exos_scenarios_primary JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS exos_scenarios_secondary JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS kpis_v2 JSONB DEFAULT '[]';
