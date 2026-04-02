# Change Excel Export Design — Lovable Knowledge Reference

## Why This Document Exists

The EXOS Excel export is controlled by a single frontend file. Unlike the PDF system (which has dual rendering and requires edge function deployment), Excel changes take effect immediately on the next Lovable deploy. This document tells you exactly what to edit for every type of change.

---

## Architecture — Simple

| What | How |
|---|---|
| Where it runs | 100% frontend (browser). No edge functions. No server calls. |
| Main file | `src/lib/report-export-excel.ts` (302 lines — everything lives here) |
| UI trigger | `src/components/reports/ReportExportButtons.tsx` (button click) |
| Data parser | `src/lib/dashboard-data-parser.ts` (shared with dashboards and PDF) |
| Library | `exceljs` ^4.4.0 |
| Deploy | No edge function deploy needed. Lovable auto-deploys on push. |

**One file controls everything.** If you need to change anything about the Excel output, you edit `src/lib/report-export-excel.ts`. Period.

---

## Current State — No Styling

The workbook currently has **zero visual formatting**:
- No fill colors or background colors
- No custom fonts, no bold headers, no font sizes
- No borders
- No text alignment
- No conditional formatting
- No frozen panes or auto-filters
- All column widths are 20 (except Summary and Inputs sheets)

This is plain data-only output. All styling improvements are additive — you're not overwriting existing styles, you're adding them for the first time.

---

## Sheets in the Workbook (16 total)

| # | Sheet Name | Data Source | Lines |
|---|---|---|---|
| 1 | Summary | Report title, timestamps, key points extracted from analysis | 250–265 |
| 2 | Analysis Inputs | Form data key/value pairs | 268–282 |
| 3 | Action Checklist | `dashboardData.actionChecklist` | 74–85 |
| 4 | Decision Matrix | `dashboardData.decisionMatrix` | 87–103 |
| 5 | Cost Waterfall | `dashboardData.costWaterfall` | 105–114 |
| 6 | Timeline Roadmap | `dashboardData.timelineRoadmap` | 116–127 |
| 7 | Kraljic Matrix | `dashboardData.kraljicQuadrant` | 129–139 |
| 8 | TCO Comparison | `dashboardData.tcoComparison` | 141–146 |
| 9 | License Tiers | `dashboardData.licenseTier` | 148–159 |
| 10 | Sensitivity Analysis | `dashboardData.sensitivitySpider` | 161–172 |
| 11 | Risk Matrix | `dashboardData.riskMatrix` | 174–184 |
| 12 | Scenario Comparison | `dashboardData.scenarioComparison` | 186–191 |
| 13 | Supplier Scorecard | `dashboardData.supplierScorecard` | 193–203 |
| 14 | SOW Analysis | `dashboardData.sowAnalysis` | 205–214 |
| 15 | Negotiation Prep | `dashboardData.negotiationPrep` | 216–224 |
| 16 | Data Quality | `dashboardData.dataQuality` | 226–235 |

Dashboard sheets (3–16) only appear if the AI response contains data for that dashboard type.

---

## Quick Reference: Change X → Edit Y

### Sheet Structure

| I want to... | Edit |
|---|---|
| Change sheet names | `report-export-excel.ts` — find `wb.addWorksheet('SheetName')` for each sheet |
| Change column headers | `report-export-excel.ts` — modify the object keys in each sheet's `.map()` call inside `dashboardToSheets()` |
| Change column widths | `report-export-excel.ts` — line 48 (default `width: 20`), lines 260–261 (Summary), lines 276–277 (Inputs) |
| Add a new sheet | `report-export-excel.ts` — add a new block in `dashboardToSheets()` after line 235, or in `exportReportToExcel()` after line 295 |
| Remove a sheet | `report-export-excel.ts` — delete the corresponding block in `dashboardToSheets()` |
| Change which data appears in cells | `report-export-excel.ts` — modify the field mappings in each sheet's `.map()` |

### Styling (currently none — all additions)

| I want to... | How |
|---|---|
| Add bold header row | After each `addRowsToSheet()` call, access `ws.getRow(1)` and set `eachCell(cell => { cell.font = { bold: true } })` |
| Add header background color | `ws.getRow(1).eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } } })` |
| Add borders | Set `cell.border = { top: {style:'thin'}, bottom: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} }` |
| Freeze header row | `ws.views = [{ state: 'frozen', ySplit: 1 }]` |
| Add auto-filter | `ws.autoFilter = { from: 'A1', to: lastColumnLastRow }` |
| Change number format | `cell.numFmt = '#,##0.00'` for currency, `'0%'` for percentages |
| Set text alignment | `cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }` |
| Add conditional formatting | Use `ws.addConditionalFormatting()` — see ExcelJS docs |

### Other

| I want to... | Edit |
|---|---|
| Change the filename | `report-export-excel.ts` — line 299 (currently `EXOS_{title}_{date}.xlsx`) |
| Change export button text or style | `src/components/reports/ReportExportButtons.tsx` — lines 63–70 |
| Change what data the parser extracts from AI response | `src/lib/dashboard-data-parser.ts` — modify `DashboardData` interface. **Caution:** this file is shared with dashboard rendering and PDF export. Changes affect all three. |

---

## ExcelJS Styling Reference

All styling is done through cell properties. Here's a quick reference for common ExcelJS patterns:

```typescript
// Bold white text on dark header
cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Arial' };
cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };

// Thin borders
cell.border = {
  top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
};

// Currency format
cell.numFmt = '€#,##0.00';

// Percentage
cell.numFmt = '0.0%';

// Wrap text
cell.alignment = { wrapText: true, vertical: 'top' };
```

---

## Key Difference from PDF Export

| | PDF | Excel |
|---|---|---|
| Files to edit | Multiple (`src/` + `supabase/functions/generate-pdf/`) | **One file** (`report-export-excel.ts`) |
| Edge function needed | Yes — must deploy after changes | **No** — frontend only |
| Current styling | Extensive (colors, fonts, layout) | **None** — plain data |
| Library | `@react-pdf/renderer` | `exceljs` |
| Lovable can edit directly | Only frontend preview, not actual PDF | **Yes — everything** |

---

## Common Mistakes to Avoid

1. **Editing `dashboard-data-parser.ts` for Excel-only changes** — This parser is shared with dashboard rendering and PDF export. Only modify it if the data structure itself needs to change across all three outputs.
2. **Forgetting that dashboard sheets are conditional** — Sheets 3–16 only appear if the AI response contains that dashboard type. If a sheet is missing in the export, the issue is in the AI response, not the Excel code.
3. **Using column index instead of column key** — ExcelJS supports both, but the current code uses object keys. Stay consistent.