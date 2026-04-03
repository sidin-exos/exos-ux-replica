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
| Envelope types (source of truth) | `src/lib/sentinel/types.ts` (`ExosOutput` interface) |
| Deploy | `supabase functions deploy generate-excel --no-verify-jwt` |

**Same pattern as PDF export.** Frontend sends data to edge function, edge function generates XLSX binary, frontend downloads it.

---

## Data Flow — Schema v1.0 vs Legacy

The EXOS AI Output Schema v1.0 introduced a **Universal Envelope JSON format**. The parser uses a dual-path approach:

1. **Primary (v1.0)**: Extract JSON from `EXOS_OUTPUT_BEGIN` / `EXOS_OUTPUT_END` tokens → `ExosOutput` envelope containing `executive_summary`, `confidence_level`, `data_gaps`, `recommendations`, `analytical_payload`, and `export_metadata`.
2. **Fallback (@deprecated)**: Parse legacy `<dashboard-data>` XML block → `DashboardData` object. Retained for pre-schema reports.

### Source of Truth

| What | File |
|---|---|
| `ExosOutput` envelope types | `src/lib/sentinel/types.ts` |
| Frontend envelope parser | `src/lib/dashboard-data-parser.ts` |
| Edge function parser (Excel) | `supabase/functions/generate-excel/types.ts` ⚠️ *legacy-only — needs envelope support* |
| Schema specification | `docs/schema/EXOS_AI_Output_Schema_v1.md` |
| Implementation decisions | `docs/schema/EXOS_Schema_Implementation_Plan_v2.md` |

### Envelope Fields Available for Excel Export

| Envelope Field | Excel Usage |
|---|---|
| `executive_summary.executive_bullets[]` | Key points in Summary section |
| `executive_summary.recommendations[]` | Recommendations rows |
| `confidence_level` (HIGH/MEDIUM/LOW) | Confidence suffix in header row |
| `data_gaps[]` | Data gaps table section |
| `export_metadata.low_confidence_watermark` | "LOW CONFIDENCE" watermark row when `true` |
| `export_metadata.generated_at` | Report timestamp |
| `schema_version` | Guard — reject unknown versions |

---

## Current State — Single-Sheet "Report" Layout

The workbook consolidates all analysis data onto a **single worksheet named "Report"**, replacing the previous multi-tab structure. The layout uses:

- **Branded teal rows** as section headers (deep teal background `#1b4b47`, white Inter font 13pt bold)
- **Column widths**: A:35, B:60
- **3-row vertical spacing** between tables for clarity
- **Consistent striped-row formatting** (alternating pale teal `#dbf0ee` fill on even rows)
- **Status formatting**: Colored cells for status values (red/yellow/green for critical/pending/complete)
- **Frozen header row** and **auto-filter** where applicable
- **Key points**: Extracted from envelope `executive_bullets` (v1.0) or numbered recommendations from AI analysis (legacy)

### Section Order on the Report Sheet

1. Summary (report title, timestamps, confidence level, key points)
2. Analysis Inputs (form data key/value pairs)
3. Dashboard data tables (one section per active dashboard, separated by branded headers and spacing)

---

## Quick Reference: Change X → Edit Y

### Sheet Structure

| I want to... | Edit |
|---|---|
| Change the sheet name | `excel-document.ts` — find `wb.addWorksheet('Report')` |
| Change column headers | `excel-document.ts` — modify the object keys in each section's `.map()` call |
| Change column widths | `excel-document.ts` — `COLUMN_WIDTHS` map or direct column width assignments |
| Add a new data section | `excel-document.ts` — add a new block in the sheet generation logic |
| Remove a data section | `excel-document.ts` — delete the corresponding block |
| Change which data appears in cells | `excel-document.ts` — modify the field mappings in each section |

### Styling

| I want to... | Edit |
|---|---|
| Change header colors/fonts | `excel-document.ts` — `HEADER_FONT`, `HEADER_FILL`, `HEADER_BORDER` constants |
| Change data row styling | `excel-document.ts` — `applyDataStyles()` function |
| Change alternating row color | `excel-document.ts` — `PALE_TEAL_FILL` constant |
| Change Summary section special rows | `excel-document.ts` — `applySummaryStyles()` function |
| Change status color coding | `excel-document.ts` — `classifyStatus()` function + `STATUS_STYLES` |
| Change brand colors | `excel-document.ts` — `COLORS` constant at top of file |
| Add/remove frozen panes | `excel-document.ts` — `ws.views = [{ state: 'frozen', ySplit: 1 }]` in `applyDataStyles()` |
| Add/remove auto-filter | `excel-document.ts` — `ws.autoFilter = ...` in `applyDataStyles()` |

### Schema v1.0 Envelope

| I want to... | Edit |
|---|---|
| Change confidence header suffix | `excel-document.ts` — look for `confidence_level` usage in header row |
| Add/change data gaps section | `excel-document.ts` — data gaps table rendering block |
| Change watermark row | `excel-document.ts` — `low_confidence_watermark` conditional row |
| Change envelope field mappings | `excel-document.ts` — envelope extraction logic at top of `generateExcelBuffer()` |

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

## EXOS Output Schema v1.0 Integration

### Current State

The frontend (`src/lib/dashboard-data-parser.ts`) has been updated to parse the Universal Envelope JSON format first, falling back to legacy XML. The edge function (`generate-excel/types.ts`) **still uses legacy XML extraction only** — this is a known gap.

### How It Works (Frontend)

1. `extractDashboardData()` tries to find `EXOS_OUTPUT_BEGIN` / `EXOS_OUTPUT_END` tokens
2. If found, parses JSON as `ExosOutput` envelope → extracts `analytical_payload` as `DashboardData`
3. If not found, falls back to `<dashboard-data>` XML parsing (`@deprecated`)
4. Envelope metadata (`confidence_level`, `data_gaps`, `export_metadata`) is surfaced separately for rendering

### Known Gap — Edge Function

The edge function `supabase/functions/generate-excel/types.ts` still uses the legacy `<dashboard-data>` XML extraction. To fully support Schema v1.0:

1. Add `ExosOutput` envelope types to `generate-excel/types.ts` (mirror from `src/lib/sentinel/types.ts`)
2. Update `extractDashboardData()` to try envelope JSON first, XML fallback second
3. Pass envelope metadata to `excel-document.ts` for confidence suffix, watermark row, and data gaps section
4. Deploy: `supabase functions deploy generate-excel --no-verify-jwt`

### Reference Documents

- `docs/schema/EXOS_AI_Output_Schema_v1.md` — full schema specification
- `docs/schema/EXOS_Schema_Implementation_Plan_v2.md` — CTO-approved implementation decisions

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
| Rate limiting | 20 req/hour | 120 req/hour |
| Auth | JWT via `authenticateRequest()` | JWT via `authenticateRequest()` |
| Deploy needed | Yes | Yes |
| Current styling | Full Brand Book v2.0 | Full Brand Book v2.0 |
| Envelope support | ⚠️ Edge function pending | ⚠️ Edge function pending |

Both follow the identical edge function pattern with shared utilities from `supabase/functions/_shared/`.

---

## Common Mistakes to Avoid

1. **Editing `src/lib/report-export-excel.ts` instead of the edge function** — The client-side file is legacy. All Excel generation logic is in `supabase/functions/generate-excel/excel-document.ts`.
2. **Forgetting to deploy** — Unlike frontend changes, edge function changes require `supabase functions deploy generate-excel --no-verify-jwt`.
3. **Editing `types.ts` without checking PDF** — The types file is a copy of the PDF types. If you change dashboard data structures, update both `generate-pdf/types.ts` and `generate-excel/types.ts`, plus the frontend `dashboard-data-parser.ts`.
4. **Dashboard sections are conditional** — Data sections only appear if the AI response contains that dashboard type. Missing sections = AI didn't generate that data.
5. **Referencing `EXOS_Schema_Implementation_Plan_v1.md`** — The v1 draft was rejected. The correct file is `EXOS_Schema_Implementation_Plan_v2.md`.
6. **Forgetting envelope support in edge function** — The frontend parser already supports the v1.0 envelope. The edge function `types.ts` still needs updating to match. Adding new envelope fields on the frontend without mirroring to the edge function will cause silent data loss in exported Excel files.
