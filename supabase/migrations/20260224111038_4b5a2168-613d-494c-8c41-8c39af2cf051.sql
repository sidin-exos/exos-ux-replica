
-- Table for scheduled reports and triggered monitoring configs
CREATE TABLE public.saved_intel_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  config_type text NOT NULL CHECK (config_type IN ('scheduled', 'triggered')),
  name text NOT NULL,
  query_type text NOT NULL,
  query_text text NOT NULL,
  recency_filter text,
  domain_filter text[],
  context text,
  schedule_cron text,
  trigger_instruction text,
  grounding_target jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_intel_configs ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own configs
CREATE POLICY "Users can select own configs"
  ON public.saved_intel_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configs"
  ON public.saved_intel_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configs"
  ON public.saved_intel_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own configs"
  ON public.saved_intel_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all configs
CREATE POLICY "Admins can read all configs"
  ON public.saved_intel_configs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RPC: Save intel result to knowledge base (market_insights)
-- Uses SECURITY DEFINER because market_insights has no user INSERT policy
CREATE OR REPLACE FUNCTION public.save_intel_to_knowledge_base(
  p_content text,
  p_citations jsonb DEFAULT '[]'::jsonb,
  p_industry_slug text DEFAULT NULL,
  p_industry_name text DEFAULT NULL,
  p_category_slug text DEFAULT NULL,
  p_category_name text DEFAULT NULL,
  p_key_trends text[] DEFAULT '{}'::text[],
  p_risk_signals text[] DEFAULT '{}'::text[],
  p_opportunities text[] DEFAULT '{}'::text[],
  p_model_used text DEFAULT 'ad-hoc-query',
  p_confidence_score numeric DEFAULT 0.8,
  p_processing_time_ms integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Validate caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate required fields
  IF p_industry_slug IS NULL OR p_category_slug IS NULL THEN
    RAISE EXCEPTION 'Industry and category are required';
  END IF;

  INSERT INTO public.market_insights (
    content, citations, industry_slug, industry_name,
    category_slug, category_name, key_trends, risk_signals,
    opportunities, model_used, confidence_score, processing_time_ms
  ) VALUES (
    p_content, p_citations, p_industry_slug, p_industry_name,
    p_category_slug, p_category_name, p_key_trends, p_risk_signals,
    p_opportunities, p_model_used, p_confidence_score, p_processing_time_ms
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
