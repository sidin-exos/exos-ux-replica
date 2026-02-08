

# Recreate Full Database Schema + Redeploy Edge Functions

## Summary

Generate a single SQL migration that recreates all 7 tables, 3 database functions, 2 triggers, and all hardened RLS policies from scratch, plus redeploy all 4 edge functions to the new instance.

---

## SQL Migration -- Single Script

The migration consolidates all 7 existing migrations into one idempotent script:

### Tables (6 total)

1. **industry_contexts** -- Industry definitions with KPIs/constraints
2. **procurement_categories** -- Procurement category reference data
3. **test_prompts** -- Sentinel pipeline prompt archive
4. **test_reports** -- AI response logs (FK to test_prompts)
5. **shared_reports** -- Shareable report payloads with expiration
6. **intel_queries** -- Market intelligence query logs
7. **market_insights** -- AI-generated market intelligence

### Database Functions (3)

1. `update_updated_at_column()` -- Trigger function for timestamp management
2. `create_shared_report(text, jsonb, timestamptz)` -- Security definer upsert
3. `get_shared_report(text)` -- Security definer fetch with auto-cleanup

### Triggers (2)

1. `update_industry_contexts_updated_at` on industry_contexts
2. `update_procurement_categories_updated_at` on procurement_categories

### RLS Policies (Hardened)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| industry_contexts | public | denied | denied | denied |
| procurement_categories | public | denied | denied | denied |
| test_prompts | public | authenticated | denied | denied |
| test_reports | public | authenticated | denied | denied |
| market_insights | public | denied (service role only) | denied | denied |
| intel_queries | public | denied (service role only) | denied | denied |
| shared_reports | denied (all) | denied (all) | denied (all) | denied (all) |

shared_reports access is exclusively through security definer functions.

### Indexes (10)

- `idx_test_prompts_scenario`, `idx_test_prompts_created`
- `idx_test_reports_prompt`, `idx_test_reports_created`
- `idx_shared_reports_expires_at`
- `idx_intel_queries_type_created`, `idx_intel_queries_success`
- `idx_market_insights_combo`, `idx_market_insights_active` (partial), `idx_market_insights_created`
- `idx_unique_active_insight` (partial unique)

### Grants

- `REVOKE ALL ON shared_reports FROM anon, authenticated`
- `GRANT EXECUTE ON create_shared_report TO anon, authenticated`
- `GRANT EXECUTE ON get_shared_report TO anon, authenticated`

---

## Edge Functions (4) -- Redeploy

All 4 functions plus the shared utility will be redeployed:

1. **sentinel-analysis** -- AI procurement analysis pipeline (Gemini / Lovable AI Gateway with retry + fallback)
2. **market-intelligence** -- Perplexity-powered market intelligence queries
3. **generate-market-insights** -- Batch market insights generation with validation
4. **generate-test-data** -- AI test data generation with trick library

Config (all `verify_jwt = false`):
```text
[functions.market-intelligence]
verify_jwt = false

[functions.generate-market-insights]
verify_jwt = false

[functions.sentinel-analysis]
verify_jwt = false
```

---

## Required Secrets

Verify these secrets are configured on the new instance:

| Secret | Used By |
|--------|---------|
| PERPLEXITY_API_KEY | market-intelligence, generate-market-insights |
| GOOGLE_AI_STUDIO_KEY | sentinel-analysis (BYOK mode) |
| LOVABLE_API_KEY | sentinel-analysis (gateway fallback) |
| VITE_LANGCHAIN_API_KEY | _shared/langsmith.ts (tracing) |
| VITE_LANGCHAIN_PROJECT | _shared/langsmith.ts |
| VITE_LANGCHAIN_ENDPOINT | _shared/langsmith.ts |
| VITE_LANGCHAIN_TRACING_V2 | _shared/langsmith.ts |
| SUPABASE_URL | Auto-provided |
| SUPABASE_SERVICE_ROLE_KEY | Auto-provided |
| SUPABASE_ANON_KEY | Auto-provided |

---

## Implementation Steps

1. Run the consolidated SQL migration (creates all tables, functions, triggers, indexes, RLS policies, and grants)
2. Redeploy all 4 edge functions
3. Verify secrets are present on the new instance
4. Test end-to-end: run a Sentinel analysis and a market intelligence query to confirm writes succeed via service role

---

## Technical Notes

- The `market_insights` table uses a partial unique index (`idx_unique_active_insight`) instead of a table constraint, to allow multiple inactive rows per industry/category combination
- `shared_reports` uses `REVOKE ALL` + deny-all RLS policies, with access only through `SECURITY DEFINER` functions
- The `generate-test-data` function has no `verify_jwt` entry in config.toml (defaults handled by the platform)
- No data migration is included -- this is schema-only. If you need to preserve existing data, export it from the old instance first.

