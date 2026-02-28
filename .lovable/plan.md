

# Prevent Dashboard Splitting in PDF — Page-per-Pair Layout

## Problem

Currently, dashboards are rendered inside a single `<View>` on Page 1 alongside the Executive Summary. `@react-pdf/renderer` auto-splits content across pages, causing individual dashboard cards to be cut in half at page boundaries.

## Solution

Move dashboards out of Page 1 and render them on **dedicated dashboard pages**. When the count is even, place **2 dashboards per page**. When odd, place 2 per page with the last one alone on its own page. Each dashboard gets `break-inside: avoid` equivalent via `minPresenceAhead`.

## Implementation

### File: `src/components/reports/pdf/PDFDashboardVisuals.tsx`

Remove the single-View wrapper. Instead, export a component that returns an **array of `<Page>` elements**, each containing 1 or 2 dashboards. Each dashboard wrapped with `break="avoid"` style to prevent splitting.

- Pair dashboards: `[[d0, d1], [d2, d3], ...]` — last chunk may have 1 item
- Each pair gets its own `<Page size="A4">` with accent bar + footer
- Each dashboard `<View>` gets `{ minPresenceAhead: 1 }` to prevent orphaning

### File: `src/components/reports/pdf/PDFReportDocument.tsx`

- Remove the dashboard section from Page 1 (lines 376-385)
- After Page 1, render dashboard pages using the new paired layout from `PDFDashboardVisuals`
- Pass page styles, accent bar, and footer as props so dashboard pages match the report theme

## Files Changed

| # | File | Action | Summary |
|---|---|---|---|
| 1 | `src/components/reports/pdf/PDFDashboardVisuals.tsx` | Rewrite | Render dashboards in paired `<Page>` elements, 2-per-page when even, `break="avoid"` on each |
| 2 | `src/components/reports/pdf/PDFReportDocument.tsx` | Edit | Move dashboards out of Page 1, render as separate pages after executive summary |

