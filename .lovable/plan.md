

# Block 3 Verification — Analysis & Fix

## Findings

### Code Structure — PASS
The prompt (lines 632-757) correctly:
- Requests all 3 blocks in the system prompt output format
- Differentiates OPTIMAL/MINIMUM/DEGRADED/GIBBERISH in Layer 6
- Applies deviation type rules (1H omission for DEGRADED)
- Includes GDPR guardrail in all tiers
- Applies persona styles

### Block Mapping — BUG FOUND
The `fetchFieldConfigs` query (line 71-74) has **no ORDER BY clause**. The block1→block2→block3 positional mapping (lines 783-794) assumes array index 0=Block1, 1=Block2, 2=Block3, but Supabase/Postgres returns rows in non-deterministic order without an explicit sort.

This means:
- `block1` (industry context) could get mapped to `assetFinancials` instead of `industryContext`
- The prompt's Layer 2 labels blocks by array index, so the AI writes content for the wrong field
- This is a **data corruption bug**, not just a cosmetic issue

### DB Schema — No sort column
The `scenario_field_config` table has no `sort_order` or `order_index` column. Ordering must use an existing column.

### Viable Sort Key
Looking at the data:
- `rfp-generator`: `industryContext`, `rawBrief`, `complianceEvaluation`
- `capex-vs-opex`: `industryContext`, `financialContext`, `assetFinancials`
- `tco-analysis`: `industryContext`, `assetDefinition`, `opexFinancials`

Convention: Block 1 is always `industryContext`. We can sort by `is_required DESC, block_id ASC` as a heuristic, but this is fragile. The proper fix is adding an explicit `sort_order` column.

## Plan

### Task 1 — Add `sort_order` column via migration

Create `supabase/migrations/<timestamp>_add_sort_order_to_scenario_field_config.sql`:

```sql
ALTER TABLE public.scenario_field_config 
  ADD COLUMN sort_order smallint NOT NULL DEFAULT 0;

-- Set ordering for existing rows (Block1=1, Block2=2, Block3=3)
-- industryContext is always Block 1
UPDATE public.scenario_field_config SET sort_order = 1 WHERE block_id = 'industryContext';

-- Scenario-specific Block 2 and 3 assignments
UPDATE public.scenario_field_config SET sort_order = 2 WHERE block_id IN ('rawBrief', 'financialContext', 'assetDefinition');
UPDATE public.scenario_field_config SET sort_order = 3 WHERE block_id IN ('complianceEvaluation', 'assetFinancials', 'opexFinancials');

-- Catch any remaining unset rows (future scenarios)
UPDATE public.scenario_field_config SET sort_order = 2 WHERE sort_order = 0 AND block_id != 'industryContext';
```

### Task 2 — Fix the query ordering

In `supabase/functions/generate-test-data/index.ts`, line 74, add `.order("sort_order", { ascending: true })` before the semicolon:

```typescript
const { data, error } = await supabase
  .from("scenario_field_config")
  .select(FIELD_CONFIG_COLUMNS)
  .eq("scenario_slug", scenarioSlug)
  .order("sort_order", { ascending: true });
```

Also add `sort_order` to `FIELD_CONFIG_COLUMNS` (line 64).

### Task 3 — Verify all scenarios have 3 rows

Run a query to check all scenario slugs have exactly 3 field config rows. Log a warning in the edge function if a scenario has fewer than 3 configs.

### Task 4 — Deploy edge function

Deploy `generate-test-data` after changes.

## What This Fixes
- Block mapping becomes deterministic — block1 always maps to `industryContext`, block2 to the core data field, block3 to the parameters field
- ST-06 through ST-09 will produce correctly mapped content
- Quality tier differentiation (OPTIMAL vs DEGRADED vs GIBBERISH) already works in the prompt — the only issue was potential block shuffling

## Scope
- 1 new migration file
- 1 edge function file edited (2 lines changed)
- Deploy `generate-test-data`
- No UI, auth, or RLS changes

