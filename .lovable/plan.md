

# PDF Report Refinements — Diagrams, Inputs, Limitations

## Issue 1: Dashboard diagram fonts too small

The shared theme (`theme.ts`) still has small font sizes (8-9pt) for dashboard visuals while the main report text was already bumped. All dashboard font sizes need a +15% increase.

**File: `src/components/reports/pdf/dashboardVisuals/theme.ts`**
- `dashboardTitle`: 13 → 15
- `dashboardSubtitle`: 9 → 10
- `barLabel`: 9 → 10
- `barValue`: 9 → 10
- `matrixCell`: 9 → 10
- `scoreCellText`: 8 → 9
- `tornadoLabel`: 9 → 10
- `tornadoValue`: 8 → 9
- `legendText`: 8 → 9
- `statLabel`: 8 → 9
- `statValue`: 12 → 14
- `listText`: 9 → 10
- `listMeta`: 8 → 9
- `quadrantLabel`: 8 → 9

**All 14 individual dashboard components** — update inline `fontSize` values (headerText 8→9, cellText 9→10, category labels 7→8, badge text 8→9, etc.)

## Issue 2: "Analysis Inputs" shows raw textarea dumps

Currently the code iterates over all `formData` entries and dumps full values including multi-paragraph industry context blocks. This is unacceptable for an executive report.

**File: `src/components/reports/pdf/PDFReportDocument.tsx`**
- Replace the current raw dump with a keyword extraction approach:
  - For short values (≤60 chars): show as-is (e.g., "Above Market", "96", "7")
  - For long values (>60 chars): extract first sentence only, truncated to 80 chars with "…"
- Rename section to "Analysis Parameters"
- Use a compact horizontal tag/pill layout instead of the current 2-column grid
- Each tag: label in muted text, value in a surface-colored pill

## Issue 3: "Analysis Limitations" is generic legal boilerplate

The current 4 bullet points are static legal disclaimers. The user wants structured feedback on data quality — which fields were provided, what's missing, confidence level.

**File: `src/components/reports/pdf/PDFReportDocument.tsx`**
- Rename to "Data Quality Assessment"
- Replace static disclaimers with dynamic content derived from `formData`:
  - Count fields provided vs total possible
  - Show coverage percentage (e.g., "6 of 8 parameters provided — 75% coverage")
  - List which key fields are missing (empty/absent keys)
  - Show a confidence indicator based on coverage: High (≥80%), Medium (50-79%), Low (<50%)
  - Add one brief note: "Provide additional parameters to improve analysis accuracy"

## Technical detail

No structural/routing changes. All edits are within PDF rendering components only. No new dependencies.

