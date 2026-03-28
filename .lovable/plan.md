

# Enriched AI Context Data Model — Implementation Plan

## Overview
Add rich JSONB columns to `industry_contexts` and `procurement_categories` tables, then update the Edge Function XML builders, TypeScript types, hooks, and frontend editors to consume the new data.

## Step 1: Database Migration (Schema Only)

Create `supabase/migrations/YYYYMMDD_enrich_context_tables.sql`:

```sql
-- industry_contexts: add enriched JSONB columns
ALTER TABLE public.industry_contexts
  ADD COLUMN IF NOT EXISTS constraints_v2 JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS kpis_v2 JSONB DEFAULT '[]';

-- procurement_categories: add all new columns
ALTER TABLE public.procurement_categories
  ADD COLUMN IF NOT EXISTS category_group TEXT,
  ADD COLUMN IF NOT EXISTS spend_type TEXT,
  ADD COLUMN IF NOT EXISTS kraljic_position TEXT,
  ADD COLUMN IF NOT EXISTS kraljic_rationale TEXT,
  ADD COLUMN IF NOT EXISTS price_volatility TEXT,
  ADD COLUMN IF NOT EXISTS market_structure TEXT,
  ADD COLUMN IF NOT EXISTS supply_concentration TEXT,
  ADD COLUMN IF NOT EXISTS key_cost_drivers JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS procurement_levers JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS negotiation_dynamics TEXT,
  ADD COLUMN IF NOT EXISTS should_cost_components TEXT,
  ADD COLUMN IF NOT EXISTS eu_regulatory_context TEXT,
  ADD COLUMN IF NOT EXISTS common_failure_modes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS exos_scenarios_primary JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS exos_scenarios_secondary JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS kpis_v2 JSONB DEFAULT '[]';
```

No data insertion, no TRUNCATE, no DELETE.

## Step 2: Update TypeScript Interfaces

**`src/lib/ai-context-templates.ts`** — extend interfaces:

```typescript
export interface ConstraintV2 {
  id?: string; tier?: string; label: string;
  eu_ref?: string; procurement_impact?: string; blocker?: boolean;
}
export interface KpiV2 {
  id?: string; label: string; direction?: string;
  exos_lever?: string; benchmark_signal?: string;
}
export interface IndustryContext {
  // ...existing fields...
  constraints_v2?: ConstraintV2[];
  kpis_v2?: KpiV2[];
}
export interface ProcurementCategory {
  // ...existing fields + all new TEXT/JSONB fields...
  category_group?: string; kraljic_position?: string; /* etc. */
  key_cost_drivers?: Array<{ driver: string; share_pct?: string }>;
  procurement_levers?: Array<{ lever: string; description?: string }>;
  common_failure_modes?: Array<{ mode: string; mitigation?: string }>;
  kpis_v2?: KpiV2[];
}
```

Also update `generateIndustryContextXML()` and `generateCategoryContextXML()` in the same file to emit enriched XML when v2 data is present, falling back to legacy arrays.

**`src/integrations/supabase/types.ts`** — cannot be edited manually; it auto-syncs from Supabase after migration runs.

## Step 3: Update Edge Function (`supabase/functions/sentinel-analysis/index.ts`)

1. **Extend `IndustryRow`** (line ~128) with `constraints_v2` and `kpis_v2` optional JSONB fields.
2. **Extend `CategoryRow`** (line ~136) with all new columns.
3. **Update SELECT queries** (line ~598-601) to fetch the new columns.
4. **Update `buildIndustryXML()`** (line ~143):
   - If `constraints_v2` is a non-empty array, render enriched XML with `<constraint tier="..." blocker="true" eu-ref="...">` attributes. Blockers get a `<!-- HARD GATE -->` comment.
   - If `kpis_v2` exists, render `<kpi direction="..." exos-lever="..." benchmark="...">`.
   - Fall back to legacy `constraints`/`kpis` text arrays when v2 is empty.
5. **Update `buildCategoryXML()`** (line ~162):
   - Add sections: `<kraljic-position>`, `<key-cost-drivers>`, `<procurement-levers>`, `<eu-regulatory-context>`, `<common-failure-modes>`, `<negotiation-dynamics>`, `<should-cost-components>`.
   - Add system instruction: blockers and high-volatility items are hard constraints.
   - Fall back gracefully when new fields are null/empty.

## Step 4: Update Hooks (`src/hooks/useContextData.ts`)

Update all four query functions to select the new columns alongside existing ones (e.g., `constraints_v2, kpis_v2` for industry; all new columns for categories).

## Step 5: Update Frontend Context Editors

**`IndustryContextEditor.tsx`**:
- When `constraints_v2` exists, render each constraint with a tier badge (`T1`/`T2`/`T3`) and a red "Blocker" badge when `blocker: true`.
- When `kpis_v2` exists, show direction arrow icon and `exos_lever` as a subtle tag.
- Graceful fallback: if v2 arrays are empty/null, show legacy flat list (current behavior).

**`CategoryContextEditor.tsx`**:
- Add read-only sections for Kraljic position (badge), price volatility, market structure, supply concentration.
- Show key cost drivers and procurement levers as collapsible lists.
- Show EU regulatory context as a highlighted callout.
- Show common failure modes with mitigation notes.
- All new sections hidden if data is null/empty.

**`ContextPreview.tsx`** — update to render the enriched XML structure in the preview panel.

## Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDD_enrich_context_tables.sql` | New migration |
| `src/lib/ai-context-templates.ts` | Extended interfaces + XML generators |
| `supabase/functions/sentinel-analysis/index.ts` | Extended types, SELECT, XML builders |
| `src/hooks/useContextData.ts` | Extended SELECT queries |
| `src/components/context/IndustryContextEditor.tsx` | V2 badges, blocker indicators |
| `src/components/context/CategoryContextEditor.tsx` | New enriched data sections |
| `src/components/context/ContextPreview.tsx` | Updated preview |
| `src/lib/sentinel/grounding.ts` | Pass-through new fields |

