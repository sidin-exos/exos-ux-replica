-- =============================================================================
-- EXOS Multi-Tenancy: Migration 004
-- Add organization_id to tenant-scoped tables + fix missing FKs
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Adds organization_id column to 6 tenant-scoped tables
--   2. Backfills existing rows to default organization
--   3. Sets NOT NULL after backfill
--   4. Adds org-scoped indexes
--   5. Fixes missing FKs on saved_intel_configs.user_id and
--      enterprise_trackers.user_id
--
-- TABLES MODIFIED:
--   - saved_intel_configs  (0 rows, has user_id — adding org_id + FK fix)
--   - chat_feedback        (0 rows on new DB — adding org_id)
--   - founder_metrics      (1 row — adding org_id)
--   - test_prompts         (122 rows — adding org_id)
--   - test_reports         (128 rows — adding org_id)
--   - enterprise_trackers  (0 rows, has user_id — adding org_id + FK fix)
--
-- NOT MODIFIED (pending Q1-Q4 decisions):
--   - intel_queries        (Q1: org-scoped or public?)
--   - market_insights      (Q2: shared or tenant-scoped?)
--   - shared_reports       (Q4: org ownership or link-only?)
--
-- NOT MODIFIED (platform-global / anonymous):
--   - industry_contexts, procurement_categories, validation_rules
--   - contact_submissions, scenario_feedback
--   - user_roles (being replaced by profiles)
--
-- DEPENDS ON: backfill_default_org (default org must exist)
-- SAFE TO RUN: Yes — additive columns with backfill, no policy changes.
--
-- ROLLBACK:
--   ALTER TABLE saved_intel_configs
--     DROP CONSTRAINT IF EXISTS fk_saved_intel_configs_user_id,
--     DROP COLUMN IF EXISTS organization_id;
--   ALTER TABLE enterprise_trackers
--     DROP CONSTRAINT IF EXISTS fk_enterprise_trackers_user_id,
--     DROP COLUMN IF EXISTS organization_id;
--   ALTER TABLE chat_feedback DROP COLUMN IF EXISTS organization_id;
--   ALTER TABLE founder_metrics DROP COLUMN IF EXISTS organization_id;
--   ALTER TABLE test_prompts DROP COLUMN IF EXISTS organization_id;
--   ALTER TABLE test_reports DROP COLUMN IF EXISTS organization_id;
-- =============================================================================


-- -----------------------------------------------
-- 1. saved_intel_configs
-- -----------------------------------------------

-- Fix: add missing FK on user_id (flagged in code audit)
ALTER TABLE public.saved_intel_configs
    ADD CONSTRAINT fk_saved_intel_configs_user_id
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add organization_id
ALTER TABLE public.saved_intel_configs
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Backfill (0 rows currently — no-op, but pattern is correct for future)
UPDATE public.saved_intel_configs sic
SET organization_id = COALESCE(
    (SELECT p.organization_id FROM public.profiles p WHERE p.id = sic.user_id),
    '00000000-0000-0000-0000-000000000001'
)
WHERE organization_id IS NULL;

-- For any rows without a matching profile, use default org
UPDATE public.saved_intel_configs
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Set NOT NULL
ALTER TABLE public.saved_intel_configs
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX idx_saved_intel_configs_org
    ON public.saved_intel_configs (organization_id);


-- -----------------------------------------------
-- 2. enterprise_trackers
-- -----------------------------------------------

-- Fix: add missing FK on user_id (same issue as saved_intel_configs)
ALTER TABLE public.enterprise_trackers
    ADD CONSTRAINT fk_enterprise_trackers_user_id
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add organization_id
ALTER TABLE public.enterprise_trackers
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Backfill (0 rows — no-op)
UPDATE public.enterprise_trackers et
SET organization_id = COALESCE(
    (SELECT p.organization_id FROM public.profiles p WHERE p.id = et.user_id),
    '00000000-0000-0000-0000-000000000001'
)
WHERE organization_id IS NULL;

UPDATE public.enterprise_trackers
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE public.enterprise_trackers
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX idx_enterprise_trackers_org
    ON public.enterprise_trackers (organization_id);


-- -----------------------------------------------
-- 3. chat_feedback
-- -----------------------------------------------

ALTER TABLE public.chat_feedback
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Backfill: user_id is nullable, handle both cases
UPDATE public.chat_feedback cf
SET organization_id = COALESCE(
    (SELECT p.organization_id FROM public.profiles p WHERE p.id = cf.user_id),
    '00000000-0000-0000-0000-000000000001'
)
WHERE cf.user_id IS NOT NULL AND cf.organization_id IS NULL;

-- Anonymous feedback (user_id IS NULL) → default org
UPDATE public.chat_feedback
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE public.chat_feedback
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX idx_chat_feedback_org
    ON public.chat_feedback (organization_id);


-- -----------------------------------------------
-- 4. founder_metrics
-- -----------------------------------------------

ALTER TABLE public.founder_metrics
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.founder_metrics
SET organization_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.founder_metrics
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX idx_founder_metrics_org
    ON public.founder_metrics (organization_id);


-- -----------------------------------------------
-- 5. test_prompts
-- -----------------------------------------------

ALTER TABLE public.test_prompts
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.test_prompts
SET organization_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.test_prompts
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX idx_test_prompts_org
    ON public.test_prompts (organization_id);


-- -----------------------------------------------
-- 6. test_reports
-- -----------------------------------------------

ALTER TABLE public.test_reports
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.test_reports
SET organization_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.test_reports
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX idx_test_reports_org
    ON public.test_reports (organization_id);
