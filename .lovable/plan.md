

# EXOS AI Output Schema Patch v1.1 — Implementation Plan

## Summary

This patch fixes the "Unknown field: Impact not specified → Provide missing data" rendering bug by tightening the AI prompt contract for `data_gaps` and adding client-side filtering/rendering changes across 7 files.

## Changes Overview

### 1. AI Prompt Contract — `supabase/functions/_shared/output-schemas.ts` (P0)

**Replace** line 175 (`- Add an entry to data_gaps for every field that is null due to missing user input.`) with the new strict quality rules block from the patch document (Rules 1-5: max 3 entries, must name specific field/impact/resolution, forbidden placeholder values, coaching tone).

**Update** `buildMarkdownFromEnvelope()` (lines 255-264):
- Add the `isValidDataGap()` filter before rendering
- Change rendering from `### Data Gaps` standalone section to inline `💡 To strengthen this analysis: [resolution]` format
- Only include valid gaps that pass the filter

### 2. Client-Side Filter — `src/lib/dashboard-data-parser.ts` (P0)

Add the `isValidDataGap()` filter function with `GENERIC_PHRASES` blocklist. Apply it to `parsed.data_gaps` before mapping to `dataQuality` fields (around line 280). Only populate `dataQuality` if valid gaps remain.

### 3. PDF Report — `src/components/reports/pdf/PDFReportDocument.tsx` (P0-P1)

- **Remove** the "LOW CONFIDENCE" watermark text. Replace with softer copy per the patch:
  - Low: `"This analysis is indicative — see improvement tips below"`
  - Medium: `"Good analysis — a few additions would sharpen the results"`
- No standalone "Data Gaps" section exists in the PDF (confirmed — it's only in the DataQuality dashboard visual), so no removal needed there.

### 4. Server-Side PDF — `supabase/functions/generate-pdf/dashboards.tsx`

Minor: update the `PDFDataQuality` dashboard's "Data gaps present" label to be more coaching-oriented. This is a soft improvement (P1).

### 5. Excel Export — `src/lib/report-export-excel.ts` (P1)

**Remove** the dedicated "Data Gaps" section (lines 718-728). Instead, null values in the scenario sheet get Excel cell comments with the matching `resolution` text from valid gaps.

### 6. Jira Export — `src/lib/report-export-jira.ts` (P2)

**Remove** the `[DATA GAP]` label pattern (lines 61-68). Replace with a single "To improve this analysis" block at the bottom of the ticket description, listing only valid gaps (max 3) in plain prose. Omit entirely if no valid gaps.

### 7. Confidence Badge Copy — `src/components/reports/pdf/PDFReportDocument.tsx` (P1)

Update the watermark/badge text:
- `"LOW CONFIDENCE"` → `"This analysis is indicative — see improvement tips below"`  
- Remove `"NOT FOR EXECUTIVE DISTRIBUTION"` if present
- Add medium confidence copy: `"Good analysis — a few additions would sharpen the results"`

## Files Modified

| File | Change |
|---|---|
| `supabase/functions/_shared/output-schemas.ts` | New data_gaps prompt rules + isValidDataGap filter + updated markdown builder |
| `src/lib/dashboard-data-parser.ts` | Filter data_gaps before mapping to dataQuality |
| `src/lib/report-export-excel.ts` | Remove Data Gaps sheet, add cell comments |
| `src/lib/report-export-jira.ts` | Replace [DATA GAP] with coaching block |
| `src/components/reports/pdf/PDFReportDocument.tsx` | Update confidence watermark copy |
| `src/components/reports/pdf/dashboardVisuals/PDFDataQuality.tsx` | Softer label text |
| `supabase/functions/generate-pdf/dashboards.tsx` | Softer label text |

## What Does NOT Change

- `ExosOutputParsed` type — `data_gaps[]` array stays as-is
- `DataGap` interface unchanged
- `confidence_level` logic unchanged
- `isStructuredOutput()` detection unchanged

