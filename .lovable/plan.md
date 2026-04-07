

# Phase 0: Engine Rebuild — Test Data Generation

## Summary

Three changes to the backend test data generation system. No UI, no auth, no RLS changes.

## Changes

### Task 1 — Create Shared Modules (2 new files, 2 comment updates)

**File 1: `supabase/functions/_shared/trick-library.ts`**
- Move lines 38-51 (types: `TrickDefinition`, `TrickTemplate`) and lines 186-493 (the `TRICK_LIBRARY` object + `selectRandomTrick` helper) from `generate-test-data/index.ts` into this new shared file
- Export: `TRICK_LIBRARY`, `TrickTemplate`, `TrickDefinition`, `TrickCategory` types, `selectRandomTrick()`

**File 2: `supabase/functions/_shared/industry-matrix.ts`**
- Move lines 141-183 (`COMPATIBILITY_MATRIX` + `CATEGORY_KPIS`) from `generate-test-data/index.ts` into this new shared file
- Export: `INDUSTRY_CATEGORY_MATRIX`, `CATEGORY_KPIS`, `validateIndustryCategoryPair()`, `getCompatibleCategories()`

**Update: `supabase/functions/generate-test-data/index.ts`**
- Remove the inlined trick library, matrix, and KPI definitions
- Import from the two new shared modules instead
- No logic changes — same behavior

**Update: `src/lib/trick-library.ts`**
- Add canonical source comment at top (no data changes)

**Update: `src/lib/ai-test-data-generator.ts`**
- Add canonical source comment at top of the local matrix (no data changes, keep the local copy functional for client-side use)

### Task 2 — Fix Block 2/3 Generation (edge function logic)

The core bug: `parseGeneratedData()` only keeps fields that appear in the `fields` array (from `getFieldGroups`). If `scenario_field_config` has no rows for a scenario, it falls back to `["industryContext"]` only — so Block 2/3 fields are silently dropped even if the AI generates them.

**Fix in `generate-test-data/index.ts`:**
- In `parseGeneratedData()`: when iterating, also include any keys present in the parsed AI response that are NOT in the `fields` list (preserve unexpected fields rather than dropping them)
- In `buildGenerationPrompt()` and `handleGenerateMode()`: reinforce in the system prompt that ALL blocks must be populated, and list Block 2 and Block 3 field names explicitly from `fieldConfigs` grouped by block number
- In `handleMessyMode()`: same fix — preserve all AI-generated keys

### Task 3 — Connect to DB Tables (edge function logic)

**In `generate-test-data/index.ts`:**
- Add DB queries to fetch from `procurement_categories` and `industry_contexts` tables (using the existing `supabase` client already created in the handler)
- When building the generation prompt, if `industry_contexts` has a matching row for the selected industry, inject its `context_template` and `key_drivers` into the system prompt instead of relying solely on the AI's general knowledge
- When building the generation prompt, if `procurement_categories` has a matching row, inject its `typical_kpis` and `risk_factors` to guide realistic data generation
- Fall back to the hardcoded `CATEGORY_KPIS` from the shared module if no DB rows exist

## Deployment
- Deploy `generate-test-data` edge function after all changes

## Files Changed
1. **NEW**: `supabase/functions/_shared/trick-library.ts`
2. **NEW**: `supabase/functions/_shared/industry-matrix.ts`
3. **EDIT**: `supabase/functions/generate-test-data/index.ts` (remove inlined data, import shared modules, fix parseGeneratedData, add DB queries)
4. **EDIT**: `src/lib/trick-library.ts` (comment only)
5. **EDIT**: `src/lib/ai-test-data-generator.ts` (comment only)

## Not Changed
- `src/lib/test-data-factory.ts` (Engine 1 — untouched)
- No UI components, pages, or routes
- No auth, RLS, or migration files
- No other edge functions

