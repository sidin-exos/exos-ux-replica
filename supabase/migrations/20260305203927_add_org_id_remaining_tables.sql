-- =============================================================================
-- EXOS Multi-Tenancy: Migration 005
-- Add organization_id to intel_queries and shared_reports
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Adds organization_id to intel_queries (Q1 decision: org-scoped)
--   2. Adds organization_id to shared_reports (Q4 decision: ownership tracking)
--   3. Backfills existing rows to Default Organization
--
-- WHY:
--   intel_queries — Research queries are competitively sensitive. Security
--     report H-2 flagged public access as a vulnerability. Org-scoping
--     prevents Company A from seeing what Company B is researching.
--   shared_reports — Adding org_id for ownership tracking. The link-based
--     access model (128-bit share ID) is preserved — anyone with the link
--     can still view via the get_shared_report() RPC.
--
-- DEPENDS ON: 004 (organization infrastructure exists)
-- SAFE TO RUN: Yes — additive columns with backfill.
--
-- ROLLBACK:
--   ALTER TABLE intel_queries DROP COLUMN IF EXISTS organization_id;
--   ALTER TABLE shared_reports DROP COLUMN IF EXISTS organization_id;
-- =============================================================================


-- -----------------------------------------------
-- 1. intel_queries (1 row)
-- -----------------------------------------------

ALTER TABLE public.intel_queries
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.intel_queries
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE public.intel_queries
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX idx_intel_queries_org
    ON public.intel_queries (organization_id);


-- -----------------------------------------------
-- 2. shared_reports (6 rows)
-- -----------------------------------------------
-- org_id is for ownership tracking only.
-- get_shared_report() RPC does NOT check org_id — link access is preserved.

ALTER TABLE public.shared_reports
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.shared_reports
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE public.shared_reports
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX idx_shared_reports_org
    ON public.shared_reports (organization_id);
