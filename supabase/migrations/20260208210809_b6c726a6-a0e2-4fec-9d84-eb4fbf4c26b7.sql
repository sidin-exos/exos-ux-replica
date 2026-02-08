-- RLS Hardening Migration
-- Drops overly-permissive policies and creates least-privilege replacements

-- ============================================
-- 1. test_prompts: SELECT public, INSERT auth only
-- ============================================
DROP POLICY IF EXISTS "Test prompts are publicly accessible" ON public.test_prompts;

CREATE POLICY "test_prompts_select_public"
  ON public.test_prompts
  FOR SELECT
  USING (true);

CREATE POLICY "test_prompts_insert_authenticated"
  ON public.test_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 2. test_reports: SELECT public, INSERT auth only
-- ============================================
DROP POLICY IF EXISTS "Test reports are publicly accessible" ON public.test_reports;

CREATE POLICY "test_reports_select_public"
  ON public.test_reports
  FOR SELECT
  USING (true);

CREATE POLICY "test_reports_insert_authenticated"
  ON public.test_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 3. market_insights: SELECT only (edge fn handles writes)
-- ============================================
DROP POLICY IF EXISTS "Allow service role insert on market_insights" ON public.market_insights;
DROP POLICY IF EXISTS "Allow service role update on market_insights" ON public.market_insights;
-- "Market insights are publicly readable" SELECT policy remains

-- ============================================
-- 4. intel_queries: SELECT only (edge fn handles writes)
-- ============================================
DROP POLICY IF EXISTS "Allow public insert access to intel_queries" ON public.intel_queries;
DROP POLICY IF EXISTS "Allow public update access to intel_queries" ON public.intel_queries;
-- "Allow public read access to intel_queries" SELECT policy remains