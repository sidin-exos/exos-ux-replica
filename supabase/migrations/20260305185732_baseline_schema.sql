-- =============================================================================
-- EXOS Baseline Schema Migration
-- Extracted from production Lovable Cloud database: 2026-03-05
-- =============================================================================
--
-- This file recreates the EXACT production database state.
-- 15 tables, 1 view, 1 enum, 6 functions, 3 triggers, 32 RLS policies.
--
-- RUN THIS on a fresh Supabase project BEFORE any other migration.
-- =============================================================================


-- =========================================================
-- SECTION 1: CUSTOM TYPES
-- =========================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'user');


-- =========================================================
-- SECTION 2: TRIGGER FUNCTION (no table dependencies)
-- =========================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;


-- =========================================================
-- SECTION 3: TABLES
-- =========================================================

-- 3.1 industry_contexts (reference data)
CREATE TABLE public.industry_contexts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    constraints TEXT[] NOT NULL DEFAULT '{}'::text[],
    kpis TEXT[] NOT NULL DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2 procurement_categories (reference data)
CREATE TABLE public.procurement_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    characteristics TEXT NOT NULL,
    kpis TEXT[] NOT NULL DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3 validation_rules (system config)
CREATE TABLE public.validation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_type TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type = ANY (ARRAY['hallucination_indicator','unsafe_content','forbidden_pattern','required_section','required_keyword','token_integrity'])),
    pattern TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity = ANY (ARRAY['low','medium','high','critical'])),
    description TEXT NOT NULL,
    suggestion TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.4 user_roles (RBAC)
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- 3.5 founder_metrics (admin singleton)
CREATE TABLE public.founder_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mrr NUMERIC NOT NULL DEFAULT 0,
    active_users INTEGER NOT NULL DEFAULT 0,
    burn_rate NUMERIC NOT NULL DEFAULT 0,
    runway_months INTEGER NOT NULL DEFAULT 12,
    strategic_hypothesis TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.6 contact_submissions (public form)
CREATE TABLE public.contact_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.7 chat_feedback
CREATE TABLE public.chat_feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id TEXT NOT NULL,
    conversation_messages JSONB,
    rating TEXT NOT NULL CHECK (rating = ANY (ARRAY['helpful','not_helpful'])),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3.8 scenario_feedback (anonymous)
CREATE TABLE public.scenario_feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    feedback_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.9 intel_queries (market intelligence logs)
CREATE TABLE public.intel_queries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    query_type TEXT NOT NULL CHECK (query_type = ANY (ARRAY['supplier','commodity','industry','regulatory','m&a','risk'])),
    query_text TEXT NOT NULL,
    recency_filter TEXT CHECK (recency_filter = ANY (ARRAY['day','week','month','year'])),
    domain_filter TEXT[],
    summary TEXT,
    citations JSONB,
    raw_response JSONB,
    model_used TEXT,
    processing_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT
);

-- 3.10 market_insights (AI knowledge base)
CREATE TABLE public.market_insights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    industry_slug TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    industry_name TEXT NOT NULL,
    category_name TEXT NOT NULL,
    confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    key_trends TEXT[] DEFAULT '{}'::text[],
    risk_signals TEXT[] DEFAULT '{}'::text[],
    opportunities TEXT[] DEFAULT '{}'::text[],
    raw_response JSONB,
    model_used TEXT DEFAULT 'sonar-pro',
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 3.11 saved_intel_configs (per-user)
CREATE TABLE public.saved_intel_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    config_type TEXT NOT NULL CHECK (config_type = ANY (ARRAY['scheduled','triggered'])),
    name TEXT NOT NULL,
    query_type TEXT NOT NULL,
    query_text TEXT NOT NULL,
    recency_filter TEXT,
    domain_filter TEXT[],
    context TEXT,
    schedule_cron TEXT,
    trigger_instruction TEXT,
    grounding_target JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.12 shared_reports (public share links)
CREATE TABLE public.shared_reports (
    share_id TEXT NOT NULL PRIMARY KEY,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 3.13 test_prompts (pipeline testing)
CREATE TABLE public.test_prompts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_type TEXT NOT NULL,
    scenario_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    industry_slug TEXT,
    category_slug TEXT,
    system_prompt TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    grounding_context JSONB,
    anonymization_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.14 test_reports (pipeline testing)
CREATE TABLE public.test_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID NOT NULL REFERENCES public.test_prompts(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    raw_response TEXT NOT NULL,
    validation_result JSONB,
    deanonymized_response TEXT,
    processing_time_ms INTEGER,
    token_usage JSONB,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    shadow_log JSONB,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0
);

-- 3.15 enterprise_trackers
CREATE TABLE public.enterprise_trackers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    tracker_type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'setup',
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    file_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =========================================================
-- SECTION 4: FUNCTIONS (after tables — these reference tables)
-- =========================================================

-- 4.1 has_role (references user_roles)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

-- 4.2 create_shared_report (references shared_reports)
CREATE OR REPLACE FUNCTION public.create_shared_report(p_payload jsonb, p_expires_at timestamp with time zone)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_share_id text;
BEGIN
  IF octet_length(p_payload::text) > 1048576 THEN
    RAISE EXCEPTION 'Payload too large (max 1MB)';
  END IF;
  v_share_id := encode(gen_random_bytes(16), 'hex');
  INSERT INTO public.shared_reports (share_id, payload, expires_at)
  VALUES (v_share_id, p_payload, p_expires_at);
  RETURN v_share_id;
END;
$function$;

-- 4.3 get_shared_report (references shared_reports)
CREATE OR REPLACE FUNCTION public.get_shared_report(p_share_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_payload jsonb;
BEGIN
  DELETE FROM public.shared_reports
  WHERE share_id = p_share_id
    AND expires_at <= now();
  SELECT payload
    INTO v_payload
  FROM public.shared_reports
  WHERE share_id = p_share_id
    AND expires_at > now();
  RETURN v_payload;
END;
$function$;

-- 4.4 get_evolutionary_directives (references test_reports)
CREATE OR REPLACE FUNCTION public.get_evolutionary_directives(limit_num integer DEFAULT 3)
RETURNS TABLE(target_scenario text, directive_text text, source_field_action text, occurrence_count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH extracted_redundant AS (
    SELECT 
      jsonb_array_elements_text(shadow_log->'redundant_fields') AS field_name
    FROM public.test_reports 
    WHERE shadow_log IS NOT NULL
      AND shadow_log ? 'redundant_fields'
  ),
  redundant_counts AS (
    SELECT 
      'Global'::TEXT AS target_scenario,
      ('Consider removing field: [' || field_name || '] — it consistently provides no analytical value.')::TEXT AS directive_text,
      'REDUNDANT_HIDE'::TEXT AS source_field_action,
      COUNT(*)::INT AS occurrence_count
    FROM extracted_redundant
    GROUP BY field_name
  )
  SELECT * FROM redundant_counts
  ORDER BY occurrence_count DESC
  LIMIT limit_num;
$function$;

-- 4.5 save_intel_to_knowledge_base (references market_insights)
CREATE OR REPLACE FUNCTION public.save_intel_to_knowledge_base(
  p_content text,
  p_citations jsonb DEFAULT '[]'::jsonb,
  p_industry_slug text DEFAULT NULL::text,
  p_industry_name text DEFAULT NULL::text,
  p_category_slug text DEFAULT NULL::text,
  p_category_name text DEFAULT NULL::text,
  p_key_trends text[] DEFAULT '{}'::text[],
  p_risk_signals text[] DEFAULT '{}'::text[],
  p_opportunities text[] DEFAULT '{}'::text[],
  p_model_used text DEFAULT 'ad-hoc-query'::text,
  p_confidence_score numeric DEFAULT 0.8,
  p_processing_time_ms integer DEFAULT NULL::integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
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
$function$;


-- =========================================================
-- SECTION 5: INDEXES (non-PK, non-UNIQUE constraint)
-- =========================================================

CREATE INDEX idx_intel_queries_success ON public.intel_queries (success, created_at DESC);
CREATE INDEX idx_intel_queries_type_created ON public.intel_queries (query_type, created_at DESC);
CREATE INDEX idx_market_insights_active ON public.market_insights (is_active) WHERE (is_active = true);
CREATE INDEX idx_market_insights_combo ON public.market_insights (industry_slug, category_slug);
CREATE INDEX idx_market_insights_created ON public.market_insights (created_at DESC);
CREATE UNIQUE INDEX idx_unique_active_insight ON public.market_insights (industry_slug, category_slug) WHERE (is_active = true);
CREATE INDEX idx_shared_reports_expires_at ON public.shared_reports (expires_at);
CREATE INDEX idx_test_prompts_created ON public.test_prompts (created_at DESC);
CREATE INDEX idx_test_prompts_scenario ON public.test_prompts (scenario_type);
CREATE INDEX idx_test_reports_created ON public.test_reports (created_at DESC);
CREATE INDEX idx_test_reports_prompt ON public.test_reports (prompt_id);


-- =========================================================
-- SECTION 6: TRIGGERS
-- =========================================================

CREATE TRIGGER update_founder_metrics_updated_at
    BEFORE UPDATE ON public.founder_metrics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_industry_contexts_updated_at
    BEFORE UPDATE ON public.industry_contexts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procurement_categories_updated_at
    BEFORE UPDATE ON public.procurement_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =========================================================
-- SECTION 7: VIEW
-- =========================================================

CREATE VIEW public.pipeline_iq_stats
WITH (security_invoker = on)
AS
SELECT date(created_at) AS batch_date,
    count(*) AS total_runs,
    round((((count(
        CASE
            WHEN success THEN 1
            ELSE NULL::integer
        END))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 1) AS accuracy,
    round(avg(processing_time_ms)) AS avg_processing_time_ms
FROM test_reports
GROUP BY (date(created_at))
ORDER BY (date(created_at));


-- =========================================================
-- SECTION 8: ENABLE RLS ON ALL TABLES
-- =========================================================

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_intel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- SECTION 9: RLS POLICIES (32 total)
-- =========================================================

-- chat_feedback (1 policy)
CREATE POLICY "Authenticated users can insert own feedback"
    ON public.chat_feedback FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- contact_submissions (2 policies)
CREATE POLICY "Anyone can submit contact form"
    ON public.contact_submissions FOR INSERT TO public
    WITH CHECK (true);
CREATE POLICY "Admins can read contact submissions"
    ON public.contact_submissions FOR SELECT TO public
    USING (has_role(auth.uid(), 'admin'::app_role));

-- enterprise_trackers (5 policies)
CREATE POLICY "Users can select own trackers"
    ON public.enterprise_trackers FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all trackers"
    ON public.enterprise_trackers FOR SELECT TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own trackers"
    ON public.enterprise_trackers FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trackers"
    ON public.enterprise_trackers FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trackers"
    ON public.enterprise_trackers FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- founder_metrics (3 policies)
CREATE POLICY "Admins can select founder_metrics"
    ON public.founder_metrics FOR SELECT TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert founder_metrics"
    ON public.founder_metrics FOR INSERT TO authenticated
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update founder_metrics"
    ON public.founder_metrics FOR UPDATE TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role));

-- industry_contexts (1 policy)
CREATE POLICY "Industry contexts are publicly readable"
    ON public.industry_contexts FOR SELECT TO public
    USING (true);

-- intel_queries (1 policy)
CREATE POLICY "Allow public read access to intel_queries"
    ON public.intel_queries FOR SELECT TO public
    USING (true);

-- market_insights (1 policy)
CREATE POLICY "Market insights are publicly readable"
    ON public.market_insights FOR SELECT TO public
    USING (true);

-- procurement_categories (1 policy)
CREATE POLICY "Procurement categories are publicly readable"
    ON public.procurement_categories FOR SELECT TO public
    USING (true);

-- saved_intel_configs (5 policies)
CREATE POLICY "Users can select own configs"
    ON public.saved_intel_configs FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all configs"
    ON public.saved_intel_configs FOR SELECT TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own configs"
    ON public.saved_intel_configs FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own configs"
    ON public.saved_intel_configs FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own configs"
    ON public.saved_intel_configs FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- scenario_feedback (2 policies)
CREATE POLICY "Anyone can submit scenario feedback"
    ON public.scenario_feedback FOR INSERT TO public
    WITH CHECK (true);
CREATE POLICY "Admins can read scenario feedback"
    ON public.scenario_feedback FOR SELECT TO public
    USING (has_role(auth.uid(), 'admin'::app_role));

-- shared_reports (4 policies — fully locked, RPC-only)
CREATE POLICY "No direct select on shared_reports"
    ON public.shared_reports FOR SELECT TO public
    USING (false);
CREATE POLICY "No direct insert on shared_reports"
    ON public.shared_reports FOR INSERT TO public
    WITH CHECK (false);
CREATE POLICY "No direct update on shared_reports"
    ON public.shared_reports FOR UPDATE TO public
    USING (false);
CREATE POLICY "No direct delete on shared_reports"
    ON public.shared_reports FOR DELETE TO public
    USING (false);

-- test_prompts (2 policies)
CREATE POLICY "test_prompts_select_admin"
    ON public.test_prompts FOR SELECT TO public
    USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "test_prompts_insert_admin"
    ON public.test_prompts FOR INSERT TO public
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- test_reports (2 policies)
CREATE POLICY "test_reports_select_admin"
    ON public.test_reports FOR SELECT TO public
    USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "test_reports_insert_admin"
    ON public.test_reports FOR INSERT TO public
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_roles (1 policy)
CREATE POLICY "Admins can read roles"
    ON public.user_roles FOR SELECT TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role));

-- validation_rules (1 policy)
CREATE POLICY "Validation rules are publicly readable"
    ON public.validation_rules FOR SELECT TO public
    USING (true);


-- =========================================================
-- SECTION 10: GRANTS
-- =========================================================

REVOKE ALL ON public.shared_reports FROM anon;
REVOKE ALL ON public.shared_reports FROM authenticated;

GRANT SELECT ON public.pipeline_iq_stats TO anon;
GRANT SELECT ON public.pipeline_iq_stats TO authenticated;
GRANT SELECT ON public.pipeline_iq_stats TO service_role;

GRANT EXECUTE ON FUNCTION public.create_shared_report(jsonb, timestamptz) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_shared_report(jsonb, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_shared_report(text) TO anon, authenticated;