# Change PDF Reports Design — Lovable Knowledge Reference

## Why This Document Exists

The EXOS PDF export system has **dual rendering**: the web report and the exported PDF are rendered by **separate codebases**. Editing frontend components alone does NOT change the exported PDF. This document tells you exactly what to edit and deploy for every type of report change.

---

## Critical Rule: The Dual Rendering Architecture

| What the user sees | Rendered by | Location |
|---|---|---|
| Web report in browser | Frontend React components | `src/components/reports/` |
| PDF preview in modal | Frontend PDF components | `src/components/reports/pdf/` |
| **Exported/downloaded PDF** | **Edge function (server-side)** | `supabase/functions/generate-pdf/` |
| Shared report via link | Frontend React components | `src/components/reports/` |
| Excel/Word exports | Frontend libraries | `src/lib/report-export-*.ts` |

**If a user asks to change the PDF design, you MUST edit files in BOTH locations and deploy the edge function. Editing only `src/` files will change the preview but NOT the actual downloaded PDF.**

---

## File Mirror Map

Every PDF-related frontend file has a server-side mirror in the edge function. When changing PDF design, **always edit both sides**:

| Frontend File (preview only) | Edge Function File (actual PDF) |
|---|---|
| `src/components/reports/pdf/PDFReportDocument.tsx` | `supabase/functions/generate-pdf/pdf-document.tsx` |
| `src/components/reports/pdf/PDFDashboardVisuals.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` |
| `src/components/reports/pdf/dashboardVisuals/theme.ts` | `supabase/functions/generate-pdf/theme.ts` |
| `src/components/reports/pdf/dashboardVisuals/PDFActionChecklist.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFActionChecklist` |
| `src/components/reports/pdf/dashboardVisuals/PDFCostWaterfall.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFCostWaterfall` |
| `src/components/reports/pdf/dashboardVisuals/PDFDataQuality.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFDataQuality` |
| `src/components/reports/pdf/dashboardVisuals/PDFDecisionMatrix.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFDecisionMatrix` |
| `src/components/reports/pdf/dashboardVisuals/PDFKraljicQuadrant.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFKraljicQuadrant` |
| `src/components/reports/pdf/dashboardVisuals/PDFLicenseTier.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFLicenseTier` |
| `src/components/reports/pdf/dashboardVisuals/PDFNegotiationPrep.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFNegotiationPrep` |
| `src/components/reports/pdf/dashboardVisuals/PDFRiskMatrix.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFRiskMatrix` |
| `src/components/reports/pdf/dashboardVisuals/PDFSOWAnalysis.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFSOWAnalysis` |
| `src/components/reports/pdf/dashboardVisuals/PDFScenarioComparison.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFScenarioComparison` |
| `src/components/reports/pdf/dashboardVisuals/PDFSensitivityTornado.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFSensitivityTornado` |
| `src/components/reports/pdf/dashboardVisuals/PDFSupplierScorecard.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFSupplierScorecard` |
| `src/components/reports/pdf/dashboardVisuals/PDFTCOComparison.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFTCOComparison` |
| `src/components/reports/pdf/dashboardVisuals/PDFTimelineRoadmap.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → `PDFTimelineRoadmap` |
| `src/lib/dashboard-data-parser.ts` | `supabase/functions/generate-pdf/types.ts` |
| `src/lib/dashboard-mappings.ts` | `supabase/functions/generate-pdf/types.ts` |

---

## Step-by-Step: How to Change PDF Design

### Step 1: Make the change in the frontend file
Edit the relevant file in `src/components/reports/pdf/` or `src/components/reports/`. This updates the web preview.

### Step 2: Mirror the EXACT same change in the edge function
Apply the identical change to the corresponding file in `supabase/functions/generate-pdf/`. Both sides use `@react-pdf/renderer` with the same `View`, `Text`, `Page` primitives, so the code structure is nearly identical.

### Step 3: Deploy the edge function
After editing any file in `supabase/functions/generate-pdf/`, run:

```bash
supabase functions deploy generate-pdf --no-verify-jwt
```

**This step is mandatory. Without it, the exported PDF will not reflect your changes.**

### Step 4: Test both outputs
1. Open a report in the browser → verify web view looks correct
2. Click "Export to PDF" → download and open → verify the PDF matches

---

## Quick Reference: Change X → Edit Y → Deploy Z

### Changes that do NOT require edge function deploy

| Change | Edit |
|---|---|
| Web report page layout, sidebar, sections | `src/pages/GeneratedReport.tsx` |
| Export buttons, share dialog | `src/components/reports/ReportExportButtons.tsx` |
| Web dashboard visual (on-screen only) | `src/components/reports/{DashboardName}Dashboard.tsx` |
| Excel export formatting | `src/lib/report-export-excel.ts` |
| Word export formatting | `src/lib/report-export-word.ts` |
| Jira markup format | `src/lib/report-export-jira.ts` |
| Dashboard names, descriptions, icons | `src/lib/dashboard-mappings.ts` |
| Share link expiry | `src/hooks/useShareableReport.ts` |

### Changes that REQUIRE edge function deploy

| Change | Edit (frontend) | Edit (edge function) | Deploy |
|---|---|---|---|
| PDF color palette (dark/light) | `src/components/reports/pdf/dashboardVisuals/theme.ts` | `supabase/functions/generate-pdf/theme.ts` + `pdf-document.tsx` (darkColors/lightColors) | `supabase functions deploy generate-pdf --no-verify-jwt` |
| PDF cover page design | `src/components/reports/pdf/PDFReportDocument.tsx` | `supabase/functions/generate-pdf/pdf-document.tsx` | `supabase functions deploy generate-pdf --no-verify-jwt` |
| PDF page structure / layout | `src/components/reports/pdf/PDFReportDocument.tsx` + `PDFDashboardVisuals.tsx` | `supabase/functions/generate-pdf/pdf-document.tsx` + `dashboards.tsx` | `supabase functions deploy generate-pdf --no-verify-jwt` |
| PDF logo | `src/components/reports/pdf/PDFReportDocument.tsx` | `supabase/functions/generate-pdf/pdf-document.tsx` (base64 EXOS_LOGO constant) | `supabase functions deploy generate-pdf --no-verify-jwt` |
| Specific dashboard in PDF (e.g. Action Checklist) | `src/components/reports/pdf/dashboardVisuals/PDFActionChecklist.tsx` | `supabase/functions/generate-pdf/dashboards.tsx` → find `PDFActionChecklist` component | `supabase functions deploy generate-pdf --no-verify-jwt` |
| PDF rate limit | N/A | `supabase/functions/generate-pdf/index.ts` | `supabase functions deploy generate-pdf --no-verify-jwt` |
| Dashboard data parsing logic | `src/lib/dashboard-data-parser.ts` | `supabase/functions/generate-pdf/types.ts` | `supabase functions deploy generate-pdf --no-verify-jwt` |

---

## Edge Function File Purposes

| File | What it controls |
|---|---|
| `supabase/functions/generate-pdf/index.ts` | HTTP handler, auth, rate limiting (20/hr), input validation, returns PDF binary. No visual design here. |
| `supabase/functions/generate-pdf/pdf-document.tsx` | **Main PDF layout**: cover page, executive summary extraction, section categorization, dashboard page arrangement, analysis text pages, parameters page. Contains base64 EXOS logo and dark/light color palettes. |
| `supabase/functions/generate-pdf/dashboards.tsx` | **All 14 dashboard PDF components**: ActionChecklist, CostWaterfall, DataQuality, DecisionMatrix, KraljicQuadrant, LicenseTier, NegotiationPrep, RiskMatrix, SOWAnalysis, ScenarioComparison, SensitivityTornado, SupplierScorecard, TCOComparison, TimelineRoadmap. Each is a self-contained `@react-pdf/renderer` component. |
| `supabase/functions/generate-pdf/theme.ts` | **PDF theme system**: color definitions, style factory functions for cards, bars, matrices, legends, headers. Controls ALL visual styling constants. |
| `supabase/functions/generate-pdf/types.ts` | Dashboard type definitions, `extractDashboardData()` parser, `stripDashboardData()` text cleaner. Data logic only, no visuals. |

## Shared Dependencies

The edge function also uses these shared modules from `supabase/functions/_shared/`:
- `auth.ts` — JWT authentication
- `rate-limit.ts` — rate limiting logic
- `validate.ts` — input validation
- `cors.ts` — CORS headers

**If you modify any `_shared/` module, redeploy ALL edge functions that use it, not just `generate-pdf`.**

---

## Common Mistakes to Avoid

1. **Editing only `src/` PDF files** — This changes the preview modal but NOT the downloaded PDF. Always mirror changes to the edge function.
2. **Forgetting to deploy** — After editing anything in `supabase/functions/generate-pdf/`, you must run `supabase functions deploy generate-pdf --no-verify-jwt`. Without this, the live PDF will still use the old code.
3. **Editing `_shared/` modules without redeploying dependent functions** — If you change `_shared/validate.ts`, you must redeploy every function that imports it.
4. **Assuming the preview matches the export** — The preview modal and the actual PDF download use different codebases. Always test both after changes.

---

## 14 Dashboard Types Reference

| # | Dashboard Type | Component Name | Description |
|---|---|---|---|
| 1 | Action Checklist | `PDFActionChecklist` | Priority/status task grid |
| 2 | Decision Matrix | `PDFDecisionMatrix` | Weighted scoring table |
| 3 | Cost Waterfall | `PDFCostWaterfall` | Stacked cost breakdown |
| 4 | Timeline Roadmap | `PDFTimelineRoadmap` | Gantt-style phases |
| 5 | Kraljic Quadrant | `PDFKraljicQuadrant` | 2x2 risk/impact matrix |
| 6 | TCO Comparison | `PDFTCOComparison` | Multi-year cost lines |
| 7 | License Tier | `PDFLicenseTier` | License distribution bars |
| 8 | Sensitivity Spider | `PDFSensitivityTornado` | Tornado/sensitivity chart |
| 9 | Risk Matrix | `PDFRiskMatrix` | Risk bubble chart |
| 10 | Scenario Comparison | `PDFScenarioComparison` | Side-by-side radar |
| 11 | Supplier Scorecard | `PDFSupplierScorecard` | Performance bars |
| 12 | SOW Analysis | `PDFSOWAnalysis` | Statement of work sections |
| 13 | Negotiation Prep | `PDFNegotiationPrep` | Sequence/steps |
| 14 | Data Quality | `PDFDataQuality` | Field coverage grid |

---

## Technology Stack for PDF Rendering

Both frontend and edge function use:
- `@react-pdf/renderer` — React-based PDF generation
- `View`, `Text`, `Page`, `Document`, `Image` primitives (NOT HTML/CSS — these are PDF-specific components)
- Styles defined via `StyleSheet.create()` — similar to React Native

**Important:** Standard HTML/CSS does not work in PDF rendering. All styling must use `@react-pdf/renderer` style objects.