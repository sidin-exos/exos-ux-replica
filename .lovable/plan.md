

# Add TOC, Running Headers, and Footer Traceability

## Changes — single file: `src/components/reports/pdf/PDFReportDocument.tsx`

### 1. New styles in `buildDocStyles`

- `runningHeader`: `position: "absolute"`, `top: 0`, `left: 40`, `right: 40`, `paddingTop: 10`, `paddingBottom: 6`, `borderBottomWidth: 0.5`, `borderBottomColor: c.border`, `flexDirection: "row"`, `justifyContent: "space-between"`. Font: 8pt, color `c.textMuted`.
- `tocSection`, `tocRow`: Row layout with dotted leader and right-aligned page label. Font: 10pt for section names, muted color.
- Adjust `page` style: add `paddingTop: 50` for pages 2+ (use a separate `pageInner` style) to prevent running header overlap.

### 2. Table of Contents (Page 1, after Executive Summary)

Render conditionally when `selectedDashboards.length > 0` (proxy for >3 pages). List sections:
- Analysis Visualizations
- Detailed Analysis
- Data Quality Assessment
- Analysis Parameters

Each row: section name as `<Link src="#section-anchor">` on left, right-aligned label. Add `id` props to corresponding section `<View>` elements on later pages.

Note: `@react-pdf/renderer` `<Link>` supports `src="#id"` for internal anchors and `<View>` supports `id` prop for anchor targets.

### 3. Running Header (Pages 2+)

Add a `<View fixed style={styles.runningHeader}>` on each non-cover page:
- Left: `EXOS | {scenarioTitle} Analysis`
- Right: formatted date

The cover page (Page 1) does NOT get this header. The dashboard pages in `PDFDashboardVisuals.tsx` will also need the running header added — but since those pages are generated in a separate component, we'll add the header there too.

### 4. Footer Traceability

Generate a short report hash from `scenarioTitle + timestamp` (first 8 chars of a simple hash). Append `• Report ID: {hash}` to the footer on all pages. Applied in both the main document footer and `PDFDashboardVisuals.tsx` footer.

### 5. Files changed

- `src/components/reports/pdf/PDFReportDocument.tsx` — all main changes
- `src/components/reports/pdf/PDFDashboardVisuals.tsx` — add running header and report hash to dashboard pages

