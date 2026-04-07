

# Phase 0: Engine Rebuild — Status & Remaining Refinements

## Already Completed (Previous Session)

All three tasks from this instruction were implemented in the prior session:

1. **Shared modules** — `_shared/trick-library.ts` and `_shared/industry-matrix.ts` exist with correct exports; edge function imports from them; client files have canonical source comments.
2. **Block 2/3 fix** — `parseGeneratedData` preserves all AI keys; system prompts enforce multi-block generation.
3. **DB enrichment** — `fetchIndustryContext` and `fetchCategoryContext` query the DB; `buildDBContextBlock` injects context into prompts with hardcoded fallback.

## Minor Refinements (Optional)

The task specifies fetching additional columns that exist in `procurement_categories` but are not currently queried:
- `market_structure`
- `supply_concentration`
- `kpis_v2` (enriched JSONB format)

### Change: Expand `fetchCategoryContext` query

In `supabase/functions/generate-test-data/index.ts`, add `market_structure`, `supply_concentration`, and `kpis_v2` to the `.select()` call in `fetchCategoryContext`, and include them in `buildDBContextBlock` output when present.

### Not Changed
- No new `fetchMethodologyContext` wrapper — the current two-function approach is equivalent
- No columns added that don't exist in the schema (`typical_categories`, `regulatory_environment` are not on `industry_contexts`)
- No UI, auth, RLS, or Engine 1 changes

### Files
1. **EDIT**: `supabase/functions/generate-test-data/index.ts` — expand category query + context block
2. **DEPLOY**: `generate-test-data`

