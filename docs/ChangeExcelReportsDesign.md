# Change Excel Export Design — Knowledge Reference

## Architecture

| What | How |
|---|---|
| Where it runs | **Server-side** — Supabase Edge Function (Deno runtime) |
| Edge function | `supabase/functions/generate-excel/` |
| Workbook logic | `supabase/functions/generate-excel/excel-document.ts` |
| Handler/routing | `supabase/functions/generate-excel/index.ts` |
| Types & data parser | `supabase/functions/generate-excel/types.ts` |
| UI trigger | `src/components/reports/ReportExportButtons.tsx` |
| Library | ExcelJS 4.4.0 (Node.js entry via esm.sh — NOT the browser bundle) |
| Deploy | `supabase functions deploy generate-excel --no-verify-jwt` |

**Same pattern as PDF export.** Frontend sends data to edge function, edge function generates XLSX binary, frontend downloads it.

---

## Current State — Full EXOS Brand Book v2.0 Styling

The workbook has complete visual formatting:
- **Header row**: Deep teal background (`#1b4b47`), white Inter font 13pt bold, bottom border in brand teal
- **Data rows**: Inter 13pt, thin borders, alternating pale teal (`#dbf0ee`) fill on even rows
- **Summary sheet**: Brand teal sub-header for Report Title, muted font for timestamps, bold field labels
- **Status formatting**: Colored cells for status values (red/yellow/green for critical/pending/complete)
- **Column widths**: Per-sheet presets in `COLUMN_WIDTHS` map
- **Frozen header row** and **auto-filter** on all sheets
- **Tab colors**: Deep teal (Summary), mid teal (Inputs), brand teal (dashboards)
- **Key points**: Extracted numbered recommendations from AI analysis (not headings)

---

## Sheets in the Workbook

| # | Sheet Name | Data Source |
|---|---|---|
| 1 | Summary | Report title, timestamps, key points extracted from analysis |
| 2 | Analysis Inputs | Form data key/value pairs |
| 3 | Action Checklist | `dashboardData.actionChecklist` |
| 4 | Decision Matrix | `dashboardData.decisionMatrix` |
| 5 | Cost Waterfall | `dashboardData.costWaterfall` |
| 6 | Timeline Roadmap | `dashboardData.timelineRoadmap` |
| 7 | Kraljic Matrix | `dashboardData.kraljicQuadrant` |
| 8 | TCO Comparison | `dashboardData.tcoComparison` |
| 9 | License Tiers | `dashboardData.licenseTier` |
| 10 | Sensitivity Analysis | `dashboardData.sensitivitySpider` |
| 11 | Risk Matrix | `dashboardData.riskMatrix` |
| 12 | Scenario Comparison | `dashboardData.scenarioComparison` |
| 13 | Supplier Scorecard | `dashboardData.supplierScorecard` |
| 14 | SOW Analysis | `dashboardData.sowAnalysis` |
| 15 | Negotiation Prep | `dashboardData.negotiationPrep` |
| 16 | Data Quality | `dashboardData.dataQuality` |

Dashboard sheets (3–16) only appear if the AI response contains data for that dashboard type.

---

## Quick Reference: Change X → Edit Y

### Sheet Structure

| I want to... | Edit |
|---|---|
| Change sheet names | `excel-document.ts` — find `wb.addWorksheet('SheetName')` or the name in `dashboardToSheets()` |
| Change column headers | `excel-document.ts` — modify the object keys in each sheet's `.map()` call inside `dashboardToSheets()` |
| Change column widths | `excel-document.ts` — `COLUMN_WIDTHS` map (per-sheet presets), or `NUMERIC_HEADERS` for default 16 vs 25 |
| Add a new sheet | `excel-document.ts` — add a new block in `dashboardToSheets()` |
| Remove a sheet | `excel-document.ts` — delete the corresponding block in `dashboardToSheets()` |
| Change which data appears in cells | `excel-document.ts` — modify the field mappings in each sheet's `.map()` |

### Styling

| I want to... | Edit |
|---|---|
| Change header colors/fonts | `excel-document.ts` — `HEADER_FONT`, `HEADER_FILL`, `HEADER_BORDER` constants |
| Change data row styling | `excel-document.ts` — `applyDataStyles()` function |
| Change alternating row color | `excel-document.ts` — `PALE_TEAL_FILL` constant |
| Change Summary sheet special rows | `excel-document.ts` — `applySummaryStyles()` function |
| Change status color coding | `excel-document.ts` — `classifyStatus()` function + `STATUS_STYLES` |
| Change brand colors | `excel-document.ts` — `COLORS` constant at top of file |
| Add/remove frozen panes | `excel-document.ts` — `ws.views = [{ state: 'frozen', ySplit: 1 }]` in `applyDataStyles()` |
| Add/remove auto-filter | `excel-document.ts` — `ws.autoFilter = ...` in `applyDataStyles()` |

### Key Points Extraction

| I want to... | Edit |
|---|---|
| Change how key points are extracted | `excel-document.ts` — `extractKeyPoints()` function |
| Change max number of key points | `excel-document.ts` — `.slice(0, 10)` in `extractKeyPoints()` |
| Change keyword matching | `excel-document.ts` — `keywords` array in `extractKeyPoints()` |

### Other

| I want to... | Edit |
|---|---|
| Change the filename | `excel-document.ts` — `generateExcelBuffer()` doesn't control filename. Filename is set in `index.ts` (server) and `ReportExportButtons.tsx` (client fallback) |
| Change export button text/style | `src/components/reports/ReportExportButtons.tsx` |
| Change rate limiting | `index.ts` — `checkRateLimit()` call (currently 120 req/hour) |
| Change input validation limits | `index.ts` — `requireString()` calls with `maxLength` |

---

## Deployment

After editing any file in `supabase/functions/generate-excel/`:

```bash
supabase functions deploy generate-excel --no-verify-jwt
```

The `--no-verify-jwt` flag is required because the function handles auth internally via `authenticateRequest()`.

Frontend changes (`ReportExportButtons.tsx`) deploy automatically via Lovable push.

---

## Architecture Comparison: PDF vs Excel

| | PDF | Excel |
|---|---|---|
| Edge function | `supabase/functions/generate-pdf/` | `supabase/functions/generate-excel/` |
| Workbook logic | `generate-pdf/pdf-document.tsx` | `generate-excel/excel-document.ts` |
| Library | `@react-pdf/renderer` | ExcelJS 4.4.0 (via esm.sh) |
| Rate limiting | 120 req/hour | 120 req/hour |
| Auth | JWT via `authenticateRequest()` | JWT via `authenticateRequest()` |
| Deploy needed | Yes | Yes |
| Current styling | Full Brand Book v2.0 | Full Brand Book v2.0 |

Both follow the identical edge function pattern with shared utilities from `supabase/functions/_shared/`.

---

## Common Mistakes to Avoid

1. **Editing `src/lib/report-export-excel.ts` instead of the edge function** — The client-side file is legacy. All Excel generation logic is in `supabase/functions/generate-excel/excel-document.ts`.
2. **Forgetting to deploy** — Unlike frontend changes, edge function changes require `supabase functions deploy generate-excel --no-verify-jwt`.
3. **Editing `types.ts` without checking PDF** — The types file is a copy of the PDF types. If you change dashboard data structures, update both `generate-pdf/types.ts` and `generate-excel/types.ts`, plus the frontend `dashboard-data-parser.ts`.
4. **Dashboard sheets are conditional** — Sheets 3–16 only appear if the AI response contains that dashboard type. Missing sheets = AI didn't generate that data.
