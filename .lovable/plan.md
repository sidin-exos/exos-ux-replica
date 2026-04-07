

# S21 Negotiation Preparation — Dashboard Fix

## Problem
The S21 (Negotiation Preparation) dashboards show "Sample data shown — AI-generated data unavailable" because of field mismatches between the AI output schema and the `extractFromEnvelope()` mapping in `dashboard-data-parser.ts`. The AI returns `leverage_analysis` but the parser reads it incorrectly; `batna.strength` doesn't match `batna.batna_strength_pct`; and there's no `negotiation_scenarios[]` mapping.

## Changes (2 files only)

### 1. `supabase/functions/_shared/output-schemas.ts`

**Change 1a** — Replace the Group D schema (lines 134-143) to include explicit S21 `scenario_specific` structure with `batna` (including `batna_strength_pct`), `leverage_points[]` (with title/description/impact), and `negotiation_scenarios[]` (Conservative/Aggressive/Hybrid). The instruction text on line 142 will be updated to reference the new field names.

**Change 1b** — Append S21-specific AI instructions to `GROUP_AI_INSTRUCTIONS['D']` (line 76): deterministic `batna_strength_pct` calculation formula (0-100, capped at 95), `leverage_points[]` quality rules (min 2, max 6, no generic placeholders), and `negotiation_scenarios[]` rules (always 3 scenarios, exactly one recommended).

### 2. `src/lib/dashboard-data-parser.ts`

**Replace** the Group D negotiation mapping block (lines 250-264) to read the new field names:
- `batna.batna_strength_pct` instead of `batna.strength`
- `leverage_points[]` (with title/description) instead of `leverage_analysis[]` (with point/tactic)
- Add `negotiation_scenarios[]` mapping for the scenario comparison table
- Return `null` only when all three key fields are empty (correct fallback behavior)

The `NegotiationPrepData` interface and `DashboardData` type remain unchanged to avoid downstream component breakage — the new fields are mapped into the existing interface shape.

### Post-deploy

Deploy the `sentinel-analysis` edge function to pick up the schema change. No migration needed.

