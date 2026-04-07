

# Fix Dashboard Data Flow — Full Consistency Pass

## Summary

Create a single canonical dashboard data extractor, replace duplicated extraction logic in PDF and Excel edge functions with imports from it, sync the frontend copy, and add `negotiation_sequence` to the AI schema. Then deploy all affected edge functions.

## Files (6 total)

### 1. NEW: `supabase/functions/_shared/dashboard-extractor.ts`
Create the full canonical extractor (~300 lines) as specified in the task instruction. Contains:
- `DashboardData` interface (all 14 dashboard types)
- Helper functions: `normaliseRisk`, `isValidGap`, color constants
- `extractFromEnvelope(rawString: string)` with group-aware extraction:
  - Universal: actionChecklist, dataQuality, costWaterfall
  - Group A: tcoComparison from `vendor_options`
  - Group B: supplierScorecard from `scorecard` with KPI-aggregate shape
  - Group C: riskMatrix (dual-path: `risk_register` + `risk_summary.risks[]`), sowAnalysis from `issues`/`missing_clauses`
  - Group D: negotiationPrep (correct `point`/`tactic` fields + `negotiation_sequence`), scenarioComparison, timelineRoadmap from `three_year_roadmap`, decisionMatrix from `qualitative_factors`

### 2. UPDATE: `supabase/functions/generate-pdf/types.ts`
- Add import: `import { extractFromEnvelope, DashboardData } from '../_shared/dashboard-extractor.ts';`
- Remove local `extractFromEnvelope` function (lines 255-381) and `ExosOutputLike` interface + `GENERIC_GAP_PHRASES` constant
- Keep: `extractDashboardData` (legacy XML), `DashboardType`, `dashboardConfigs`, `stripDashboardData`, `GeneratePdfPayload`, all per-dashboard type interfaces (they're used by PDF rendering components)

### 3. UPDATE: `supabase/functions/generate-excel/types.ts`
- Same pattern as PDF: add import, remove local `extractFromEnvelope` (lines 255-389), `ExosOutputLike`, `GENERIC_GAP_PHRASES`
- Keep: `extractDashboardData`, `GenerateExcelPayload`, `stripDashboardData`, all type definitions

### 4. UPDATE: `src/lib/dashboard-data-parser.ts`
- Replace existing `extractFromEnvelope(parsed: ExosOutput)` (lines 201-343) with a wrapper that JSON-serializes the parsed object and delegates to an internal `extractFromEnvelopeRaw(rawString)` function
- The `extractFromEnvelopeRaw` body is identical to the shared module's `extractFromEnvelope`
- Add helper functions (`normaliseRisk`, `isValidGap`, color constants) above the new function
- Add sync-copy JSDoc comment
- Keep: `isStructuredOutput`, `extractDashboardData` (legacy XML), `stripDashboardData`, all type interfaces

### 5. UPDATE: `supabase/functions/_shared/output-schemas.ts`
- Add `"negotiation_sequence": [{"step": null, "detail": null}]` to Group D schema (between `leverage_points` and `negotiation_scenarios` in the S21 section)
- Append negotiation_sequence instructions to `GROUP_AI_INSTRUCTIONS['D']`

### 6. VERIFY: `src/lib/dashboard-mappings.ts` (read-only)
Verified slug-to-group alignment against `SCENARIO_GROUP_REGISTRY`:
- `tco-analysis` → A, `make-vs-buy` → D, `supplier-review` → B, `negotiation-preparation` → D, `risk-assessment` → C, `sow-critic` → C, `software-licensing` → C, `category-strategy` → D — all match. No code changes needed.

## Deployment Order
1. Deploy `generate-pdf` and `generate-excel` edge functions
2. Deploy `sentinel-analysis` and `market-intelligence` (schema change)
3. Frontend deploys automatically

## What This Fixes
- PDF/Excel exports now use the same extraction logic as the frontend
- negotiationPrep populates with correct field names and sequence steps
- riskMatrix works via both `risk_register` and `risk_summary.risks[]` paths
- tcoComparison, decisionMatrix, timelineRoadmap, supplierScorecard, sowAnalysis, scenarioComparison all extract real data

## Known Remaining Gaps (not in scope)
- kraljicQuadrant, licenseTier, sensitivitySpider — require AI schema additions first

