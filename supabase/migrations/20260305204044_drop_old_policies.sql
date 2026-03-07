-- =============================================================================
-- EXOS Multi-Tenancy: Migration 006
-- Drop all existing RLS policies (clean slate for org-scoped policies)
-- =============================================================================
--
-- WHAT THIS DOES:
--   Drops all 36 RLS policies (32 original + 4 temporary from Phase 1).
--
-- WHY:
--   Existing policies use auth.uid() = user_id and has_role(auth.uid(), 'admin')
--   which are single-tenant patterns. New policies need organization_id checks.
--   Since all policies are PERMISSIVE, keeping old alongside new would combine
--   with OR — an old policy saying "admin can see all" would bypass org isolation.
--   Clean drop + recreate is the only safe approach.
--
-- IMPORTANT:
--   Between this migration and 007, all tables have RLS ENABLED but NO POLICIES.
--   This means NO access for anon/authenticated — only service_role can read/write.
--   Run 006 and 007 together in the same supabase db push to avoid a gap.
--
-- DEPENDS ON: 005 (org_id columns must exist before new policies reference them)
-- ROLLBACK: Re-run baseline policies from 000_baseline_schema.sql sections 9-10.
-- =============================================================================


-- -----------------------------------------------
-- chat_feedback (1 policy)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert own feedback" ON public.chat_feedback;

-- -----------------------------------------------
-- contact_submissions (2 policies)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can read contact submissions" ON public.contact_submissions;

-- -----------------------------------------------
-- enterprise_trackers (5 policies)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Users can select own trackers" ON public.enterprise_trackers;
DROP POLICY IF EXISTS "Admins can read all trackers" ON public.enterprise_trackers;
DROP POLICY IF EXISTS "Users can insert own trackers" ON public.enterprise_trackers;
DROP POLICY IF EXISTS "Users can update own trackers" ON public.enterprise_trackers;
DROP POLICY IF EXISTS "Users can delete own trackers" ON public.enterprise_trackers;

-- -----------------------------------------------
-- founder_metrics (3 policies)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Admins can select founder_metrics" ON public.founder_metrics;
DROP POLICY IF EXISTS "Admins can insert founder_metrics" ON public.founder_metrics;
DROP POLICY IF EXISTS "Admins can update founder_metrics" ON public.founder_metrics;

-- -----------------------------------------------
-- industry_contexts (1 policy)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Industry contexts are publicly readable" ON public.industry_contexts;

-- -----------------------------------------------
-- intel_queries (1 policy)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to intel_queries" ON public.intel_queries;

-- -----------------------------------------------
-- market_insights (1 policy)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Market insights are publicly readable" ON public.market_insights;

-- -----------------------------------------------
-- procurement_categories (1 policy)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Procurement categories are publicly readable" ON public.procurement_categories;

-- -----------------------------------------------
-- saved_intel_configs (5 policies)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Users can select own configs" ON public.saved_intel_configs;
DROP POLICY IF EXISTS "Admins can read all configs" ON public.saved_intel_configs;
DROP POLICY IF EXISTS "Users can insert own configs" ON public.saved_intel_configs;
DROP POLICY IF EXISTS "Users can update own configs" ON public.saved_intel_configs;
DROP POLICY IF EXISTS "Users can delete own configs" ON public.saved_intel_configs;

-- -----------------------------------------------
-- scenario_feedback (2 policies)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit scenario feedback" ON public.scenario_feedback;
DROP POLICY IF EXISTS "Admins can read scenario feedback" ON public.scenario_feedback;

-- -----------------------------------------------
-- shared_reports (4 policies)
-- -----------------------------------------------
DROP POLICY IF EXISTS "No direct select on shared_reports" ON public.shared_reports;
DROP POLICY IF EXISTS "No direct insert on shared_reports" ON public.shared_reports;
DROP POLICY IF EXISTS "No direct update on shared_reports" ON public.shared_reports;
DROP POLICY IF EXISTS "No direct delete on shared_reports" ON public.shared_reports;

-- -----------------------------------------------
-- test_prompts (2 policies)
-- -----------------------------------------------
DROP POLICY IF EXISTS "test_prompts_select_admin" ON public.test_prompts;
DROP POLICY IF EXISTS "test_prompts_insert_admin" ON public.test_prompts;

-- -----------------------------------------------
-- test_reports (2 policies)
-- -----------------------------------------------
DROP POLICY IF EXISTS "test_reports_select_admin" ON public.test_reports;
DROP POLICY IF EXISTS "test_reports_insert_admin" ON public.test_reports;

-- -----------------------------------------------
-- user_roles (1 policy)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Admins can read roles" ON public.user_roles;

-- -----------------------------------------------
-- validation_rules (1 policy)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Validation rules are publicly readable" ON public.validation_rules;

-- -----------------------------------------------
-- organizations (2 temp policies from Phase 1)
-- -----------------------------------------------
DROP POLICY IF EXISTS "temp_org_select_authenticated" ON public.organizations;
DROP POLICY IF EXISTS "temp_org_insert_authenticated" ON public.organizations;

-- -----------------------------------------------
-- profiles (2 temp policies from Phase 1)
-- -----------------------------------------------
DROP POLICY IF EXISTS "temp_profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "temp_profiles_update_own" ON public.profiles;