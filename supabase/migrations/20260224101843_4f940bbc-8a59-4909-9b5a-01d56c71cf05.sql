
-- Create validation_rules table for data-driven server-side validation
CREATE TABLE public.validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_type TEXT,  -- NULL = applies to ALL scenarios
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'hallucination_indicator', 'unsafe_content', 'forbidden_pattern',
    'required_section', 'required_keyword', 'token_integrity'
  )),
  pattern TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  suggestion TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;

-- Public read access (edge function uses service role, but consistent with market_insights pattern)
CREATE POLICY "Validation rules are publicly readable"
  ON public.validation_rules FOR SELECT USING (true);

-- Seed: 4 hallucination indicators (from current HALLUCINATION_INDICATORS)
INSERT INTO public.validation_rules (scenario_type, rule_type, pattern, severity, description, suggestion) VALUES
(NULL, 'hallucination_indicator', '\b(definitely|certainly|absolutely|100%)\s+will\b', 'medium', 'Overconfident prediction detected', 'Consider softening language to reflect uncertainty appropriately'),
(NULL, 'hallucination_indicator', '\b(I remember|As I recall|From my knowledge)\b', 'medium', 'False memory claim detected', 'Remove claims of personal memory or recall'),
(NULL, 'hallucination_indicator', '\[SUPPLIER_[A-Z]\d*\]\s+(?:is|was|has been)\s+(?:founded|established|created)\b', 'medium', 'Fabricating masked entity details', 'Do not invent details about masked entities'),
(NULL, 'hallucination_indicator', '\b(exact|precise)\s+(?:figure|number|amount)\b', 'medium', 'False precision claim detected', 'Avoid claiming exact figures without supporting data');

-- Seed: 3 unsafe content patterns (from current UNSAFE_PATTERNS)
INSERT INTO public.validation_rules (scenario_type, rule_type, pattern, severity, description, suggestion) VALUES
(NULL, 'unsafe_content', '\b(illegal|fraudulent|bribe|kickback)\b', 'critical', 'Potentially illegal activity referenced', 'Review and remove any content suggesting unethical or illegal actions'),
(NULL, 'unsafe_content', '\b(circumvent|bypass|ignore)\s+(?:compliance|regulations?|laws?)\b', 'critical', 'Suggestion to bypass compliance detected', 'Remove suggestions to circumvent regulations or laws'),
(NULL, 'unsafe_content', '\b(confidential|secret)\s+(?:information|data)\s+(?:leak|share|expose)\b', 'critical', 'Data leakage suggestion detected', 'Remove content suggesting leaking confidential information');

-- Seed: 3 scenario-specific rules
INSERT INTO public.validation_rules (scenario_type, rule_type, pattern, severity, description, suggestion) VALUES
('tco-analysis', 'required_keyword', 'total cost of ownership|TCO', 'high', 'TCO analysis must reference Total Cost of Ownership', 'Include explicit TCO terminology and breakdown'),
('cost-breakdown', 'required_section', 'cost breakdown|cost analysis|cost structure', 'high', 'Cost breakdown analysis must contain cost structure section', 'Include a dedicated cost breakdown or cost structure section'),
('risk-assessment', 'required_section', 'risk matrix|risk assessment|risk mitigation', 'high', 'Risk assessment must contain risk analysis section', 'Include a risk matrix or risk assessment section');
