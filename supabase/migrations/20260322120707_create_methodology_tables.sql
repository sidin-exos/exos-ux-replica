-- =============================================================================
-- EXOS Methodology Centralization: Create Methodology Tables
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Creates coaching_cards table (methodology coaching content, 29 rows)
--   2. Creates scenario_field_config table (per-scenario field definitions, ~87 rows)
--   3. Creates methodology_config table (global methodology key-value store, ~5 rows)
--   4. Creates methodology_change_log table (automatic audit trail)
--   5. Enables RLS on all 4 tables with appropriate policies
--   6. Creates indexes for common query patterns
--   7. Creates log_methodology_change() trigger function for audit trail
--   8. Reuses existing update_updated_at_column() for updated_at triggers
--
-- SECURITY MODEL:
--   - coaching_cards: publicly readable, super_admin writeable
--   - scenario_field_config: publicly readable, super_admin writeable
--   - methodology_config: publicly readable, super_admin writeable
--   - methodology_change_log: super_admin read only, written by triggers
--
-- DEPENDS ON:
--   - 20260305185732_baseline_schema (update_updated_at_column function)
--   - 20260310130000_add_super_admin (is_super_admin function)
-- =============================================================================


-- =====================
-- TABLE 1: coaching_cards
-- =====================

CREATE TABLE public.coaching_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_slug TEXT NOT NULL UNIQUE,
  scenario_id INTEGER NOT NULL UNIQUE,
  scenario_name TEXT NOT NULL,
  scenario_group TEXT NOT NULL CHECK (scenario_group IN ('A', 'B', 'C', 'D', 'E')),
  purpose TEXT NOT NULL,
  min_required TEXT NOT NULL,
  enhanced TEXT NOT NULL,
  common_failure TEXT NOT NULL,
  financial_impact TEXT NOT NULL,
  gdpr_guardrail TEXT NOT NULL,
  coaching_tips TEXT NOT NULL,
  example_prompt TEXT,
  trigger_phrases TEXT NOT NULL,
  navigation_guidance TEXT NOT NULL,
  confidence_dependency TEXT NOT NULL CHECK (confidence_dependency IN ('HIGH', 'MEDIUM-HIGH', 'MEDIUM')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coaching_cards_slug ON public.coaching_cards(scenario_slug);
CREATE INDEX idx_coaching_cards_scenario_id ON public.coaching_cards(scenario_id);


-- =====================
-- TABLE 2: scenario_field_config
-- =====================

CREATE TABLE public.scenario_field_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_slug TEXT NOT NULL REFERENCES public.coaching_cards(scenario_slug),
  scenario_id INTEGER NOT NULL,
  block_id TEXT NOT NULL,
  block_label TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  min_words INTEGER NOT NULL DEFAULT 30,
  expected_data_type TEXT NOT NULL CHECK (expected_data_type IN ('narrative', 'numeric', 'structured', 'document')),
  expected_keywords TEXT[] DEFAULT '{}',
  sub_prompts JSONB,
  deviation_type TEXT NOT NULL CHECK (deviation_type IN ('0', '1', '1H', '2')),
  block_guidance TEXT,
  optimal_guidance TEXT,
  minimum_guidance TEXT,
  degraded_guidance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scenario_slug, block_id)
);

CREATE INDEX idx_scenario_field_config_slug ON public.scenario_field_config(scenario_slug);


-- =====================
-- TABLE 3: methodology_config
-- =====================

CREATE TABLE public.methodology_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =====================
-- TABLE 4: methodology_change_log
-- =====================

CREATE TABLE public.methodology_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_data JSONB,
  new_data JSONB,
  change_summary TEXT
);

CREATE INDEX idx_methodology_change_log_table ON public.methodology_change_log(table_name);
CREATE INDEX idx_methodology_change_log_time ON public.methodology_change_log(changed_at DESC);


-- =====================
-- TRIGGER FUNCTION: log_methodology_change
-- =====================

CREATE OR REPLACE FUNCTION log_methodology_change()
RETURNS TRIGGER AS $$
DECLARE
  record_identifier TEXT;
  summary TEXT;
BEGIN
  IF TG_TABLE_NAME = 'coaching_cards' THEN
    record_identifier := COALESCE(NEW.scenario_slug, OLD.scenario_slug);
    summary := TG_OP || ' on ' || TG_TABLE_NAME || ' for ' || record_identifier;
  ELSIF TG_TABLE_NAME = 'scenario_field_config' THEN
    record_identifier := COALESCE(NEW.scenario_slug || '/' || NEW.block_id, OLD.scenario_slug || '/' || OLD.block_id);
    summary := TG_OP || ' on ' || TG_TABLE_NAME || ' for ' || record_identifier;
  ELSIF TG_TABLE_NAME = 'methodology_config' THEN
    record_identifier := COALESCE(NEW.key, OLD.key);
    summary := TG_OP || ' on ' || TG_TABLE_NAME || ' key=' || record_identifier;
  ELSE
    record_identifier := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
    summary := TG_OP || ' on ' || TG_TABLE_NAME;
  END IF;

  INSERT INTO public.methodology_change_log (
    table_name, record_id, operation, changed_by,
    old_data, new_data, change_summary
  ) VALUES (
    TG_TABLE_NAME,
    record_identifier,
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    summary
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================
-- TRIGGERS: Auto-log changes
-- =====================

CREATE TRIGGER trg_coaching_cards_log
  AFTER INSERT OR UPDATE OR DELETE ON public.coaching_cards
  FOR EACH ROW EXECUTE FUNCTION log_methodology_change();

CREATE TRIGGER trg_scenario_field_config_log
  AFTER INSERT OR UPDATE OR DELETE ON public.scenario_field_config
  FOR EACH ROW EXECUTE FUNCTION log_methodology_change();

CREATE TRIGGER trg_methodology_config_log
  AFTER INSERT OR UPDATE OR DELETE ON public.methodology_config
  FOR EACH ROW EXECUTE FUNCTION log_methodology_change();


-- =====================
-- TRIGGERS: Auto-update updated_at (reuse existing function)
-- =====================

CREATE TRIGGER trg_coaching_cards_updated
  BEFORE UPDATE ON public.coaching_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_scenario_field_config_updated
  BEFORE UPDATE ON public.scenario_field_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =====================
-- RLS: Enable on all tables
-- =====================

ALTER TABLE public.coaching_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_field_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methodology_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methodology_change_log ENABLE ROW LEVEL SECURITY;


-- =====================
-- RLS POLICIES: coaching_cards
-- =====================

CREATE POLICY "coaching_cards_select" ON public.coaching_cards
  FOR SELECT TO public USING (true);
CREATE POLICY "coaching_cards_update" ON public.coaching_cards
  FOR UPDATE USING (is_super_admin(auth.uid()));
CREATE POLICY "coaching_cards_insert" ON public.coaching_cards
  FOR INSERT WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "coaching_cards_delete" ON public.coaching_cards
  FOR DELETE USING (is_super_admin(auth.uid()));


-- =====================
-- RLS POLICIES: scenario_field_config
-- =====================

CREATE POLICY "scenario_field_config_select" ON public.scenario_field_config
  FOR SELECT TO public USING (true);
CREATE POLICY "scenario_field_config_update" ON public.scenario_field_config
  FOR UPDATE USING (is_super_admin(auth.uid()));
CREATE POLICY "scenario_field_config_insert" ON public.scenario_field_config
  FOR INSERT WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "scenario_field_config_delete" ON public.scenario_field_config
  FOR DELETE USING (is_super_admin(auth.uid()));


-- =====================
-- RLS POLICIES: methodology_config
-- =====================

CREATE POLICY "methodology_config_select" ON public.methodology_config
  FOR SELECT TO public USING (true);
CREATE POLICY "methodology_config_update" ON public.methodology_config
  FOR UPDATE USING (is_super_admin(auth.uid()));
CREATE POLICY "methodology_config_insert" ON public.methodology_config
  FOR INSERT WITH CHECK (is_super_admin(auth.uid()));


-- =====================
-- RLS POLICIES: methodology_change_log (super admin read only)
-- =====================

CREATE POLICY "methodology_change_log_select" ON public.methodology_change_log
  FOR SELECT USING (is_super_admin(auth.uid()));
