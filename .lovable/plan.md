

# Compact Page 1: Executive Summary + Table of Contents

## Problem
The cover page overflows — Executive Summary findings/recommendations text is too large, and spacing between sections is too generous, pushing the Table of Contents off page 1.

## Changes (both client-side and server-side PDF documents)

### Reduce spacing and font sizes on page 1 elements

**Style changes** (in `buildDocStyles`):
- `header.marginBottom`: 30 → 16, `header.paddingBottom`: 20 → 12
- `titleSection.marginBottom`: 30 → 14
- `reportTitle.fontSize`: 28 → 22, `reportTitle.marginBottom`: 8 → 4
- `reportSubtitle.fontSize`: 12 → 10
- `section.marginBottom`: 24 → 14
- `sectionHeader.marginBottom`: 12 → 6
- `sectionTitle.fontSize`: 16 → 13
- `sectionContent.padding`: 16 → 10
- `keyPointText.fontSize`: 12 → 9.5, `lineHeight`: 1.5 → 1.4
- `analysisSubHeader.fontSize`: 13 → 11, `marginTop`: 10 → 4, `marginBottom`: 6 → 3
- `tocSection.marginBottom`: 24 → 10
- `tocRow.paddingVertical`: 6 → 3
- `tocLabel.fontSize`: 10 → 9
- `tocPageHint.fontSize`: 9 → 8

**Inline spacing adjustments** (in the cover page JSX):
- Spacer between findings and recommendations: `height: 12` → `height: 6`
- Recommendations box `padding`: 10 → 6
- Recommendation items `marginBottom`: 6 → 3

### Files modified
1. `src/components/reports/pdf/PDFReportDocument.tsx` — client-side styles + JSX
2. `supabase/functions/generate-pdf/pdf-document.tsx` — server-side styles + JSX

No other files affected. Sizing changes are scoped to page 1 cover elements only — inner content pages keep their current sizing.

