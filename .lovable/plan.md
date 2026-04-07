
What I found

- I do not see a browser runtime error in the current snapshot/logs, which suggests this is not mainly a React crash.
- The stronger signal is contract drift: the approved S21 fix updated the frontend parser to understand the new EXOS structured envelope and Group D mapping, but the report/export stack still uses older parsing logic.

Likely root causes

1. Frontend and report/export parsers are out of sync
- `src/lib/dashboard-data-parser.ts` now supports structured EXOS output via `extractFromEnvelope()`.
- `supabase/functions/generate-pdf/types.ts` and `supabase/functions/generate-excel/types.ts` still only parse legacy `<dashboard-data>` blocks.
- Result: report generation paths cannot reliably read the new S21 structured output.

2. Export flows do not pass the structured envelope at all
- `GenericScenarioWizard` stores `structuredData` when navigating to `/report`.
- But `ReportExportButtons` and `PDFPreviewModal` only send `analysisResult` to the edge functions.
- So exports often receive markdown only, while the real dashboard data lives in `structuredData`.

3. Shared reports drop the structured payload
- `useShareableReport.ts` saves/loads `analysisResult`, but not `structuredData`.
- Shared reports therefore lose the exact structured data needed for dashboards and exports.

4. Scenario Comparison renderers are still coded for the old shape
- `ScenarioComparisonDashboard.tsx` expects hardcoded columns `A/B/C`.
- The S21 parser now creates scenario ids like `neg-0`, `neg-1`, `neg-2`, and summary rows shaped like `{criteria, description, risk, recommended}`.
- `PDFScenarioComparison` on both client/server also truncates to 2 scenarios with `slice(0, 2)`, while S21 now requires 3.
- This explains the “sample data shown” symptom and can also break report rendering logic/expectations.

Proposed fixes

P0
1. Unify parsing for report/export paths
- Make PDF/Excel generators prefer structured envelope parsing, not legacy XML-only parsing.
- Best fix: move the shared envelope-to-dashboard mapping into one reusable schema/parser module used by both frontend and edge functions.
- Minimum safe fix: port the same structured-envelope support from `src/lib/dashboard-data-parser.ts` into:
  - `supabase/functions/generate-pdf/types.ts`
  - `supabase/functions/generate-excel/types.ts`

2. Pass `structuredData` through the entire export pipeline
- Add `structuredData` to:
  - `ReportExportButtons` props
  - `PDFPreviewModal` props
  - `generate-pdf` payload/type
  - `generate-excel` payload/type
- In both edge functions, parse `structuredData` first; only fall back to `analysisResult` if absent.

P1
3. Persist `structuredData` in shared reports
- Extend `useShareableReport.ts` save/load shape to include:
  - `structuredData`
  - optionally `evaluationScore` / `evaluationConfidence` for parity
- This ensures shared report pages export the same data as the original report.

4. Refactor Scenario Comparison to be data-driven
- Update `src/components/reports/ScenarioComparisonDashboard.tsx`
  - render dynamic scenario columns from `data.scenarios`
  - stop reading fixed `row.A`, `row.B`, `row.C`
- Update:
  - `src/components/reports/pdf/dashboardVisuals/PDFScenarioComparison.tsx`
  - `supabase/functions/generate-pdf/dashboards.tsx`
  so they support all provided scenarios instead of slicing to 2.

P2
5. Add defensive guards so reports degrade gracefully instead of erroring
- If structured data is present but incomplete, show a placeholder card rather than attempting mismatched rendering.
- For S21 scenario comparison, derive report rows from `radarData`/scenario definitions when `summary` shape is not tabular.

Files I would update

- `src/components/reports/ReportExportButtons.tsx`
- `src/components/reports/pdf/PDFPreviewModal.tsx`
- `src/pages/GeneratedReport.tsx`
- `src/hooks/useShareableReport.ts`
- `src/components/reports/ScenarioComparisonDashboard.tsx`
- `src/components/reports/pdf/dashboardVisuals/PDFScenarioComparison.tsx`
- `supabase/functions/generate-pdf/types.ts`
- `supabase/functions/generate-excel/types.ts`
- `supabase/functions/generate-pdf/index.ts`
- `supabase/functions/generate-excel/index.ts`
- `supabase/functions/generate-pdf/dashboards.tsx`

Validation plan

- Test a fresh S21 report on `/report`
- Test PDF preview/download end to end
- Test Excel export end to end
- Test shared report link export path
- Verify Scenario Comparison renders real S21 scenarios instead of sample data
- Add parser tests for structured S21 envelopes in both frontend and edge-function report paths

Recommended implementation order

1. Fix parser parity in report edge functions
2. Pass `structuredData` through export payloads
3. Fix shared report persistence
4. Refactor Scenario Comparison renderers
5. Run end-to-end verification across normal + shared report flows

Bottom line

The most likely primary regression is not the S21 schema itself, but that only the frontend dashboard parser was updated while report/export code still relies on older parsing assumptions. I would fix the data contract first, then the scenario-comparison renderer assumptions.