

# Block 2 Results — DB Connectivity Verification

## ST-04: Enrichment on Known Category — FAIL (slug mismatch)

The edge function code is correct — it queries `procurement_categories` and `industry_contexts` using `.maybeSingle()` and builds context blocks properly. However, the slugs passed by the test UI (from the industry-category matrix) don't match the actual DB slugs:

| Source | Industry slug | Category slug |
|--------|--------------|---------------|
| Matrix (test UI) | `manufacturing` | `raw-materials` |
| DB (actual) | `industrial-manufacturing` | No exact match |

The DB has 30+ detailed category slugs like `capital-equipment-industrial-machinery`, `castings-forgings-machined-parts`, `electronic-components` — none matching the simplified matrix slugs like `raw-materials`, `components`, `mro`.

**Result**: `methodologyEnriched` will always be `false` for matrix-based slugs. The generation completes but never gets DB context enrichment.

## ST-05: Graceful Degradation — PASS

Both `fetchIndustryContext` and `fetchCategoryContext` use `.maybeSingle()` (lines 92, 119) and return `null` on missing data. The generation continues without DB context. No 500 errors.

## Fix Plan — Align Slugs

**Option A (recommended)**: Update `_shared/industry-matrix.ts` and `src/lib/ai-test-data-generator.ts` to use the real DB slugs. This requires:

1. **`supabase/functions/_shared/industry-matrix.ts`** — Replace the `INDUSTRY_CATEGORY_MATRIX` entries with actual DB slugs:
   - `manufacturing` → `industrial-manufacturing`
   - Map each simplified category to its real DB slug (e.g., `raw-materials` → a set of real slugs like `chemicals-specialty`, `castings-forgings-machined-parts`)
   - Or restructure: each industry maps to real category slugs that exist in `procurement_categories`

2. **`src/lib/ai-test-data-generator.ts`** — Update the local copy of `INDUSTRY_CATEGORY_COMPATIBILITY` to match

3. No DB migration needed — the data already exists

**Option B**: Add simplified alias slugs to the DB tables. This requires a migration to insert rows with the old-style slugs. More disruptive.

## Technical Detail

The edge function at lines 85-134 has two fetch functions:
- `fetchIndustryContext(supabase, industrySlug)` — queries `industry_contexts.slug`
- `fetchCategoryContext(supabase, categorySlug)` — queries `procurement_categories.slug`

Both are wired correctly. The only issue is the slug vocabulary mismatch between the hardcoded matrix and the actual DB content.

## Scope
- 2 files edited (`_shared/industry-matrix.ts`, `src/lib/ai-test-data-generator.ts`)
- No DB changes, no UI changes, no auth changes
- Deploy `generate-test-data` after

