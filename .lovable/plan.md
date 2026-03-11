

# Restructure Executive Summary into Key Findings & Top Recommendations

## Changes — single file: `src/components/reports/pdf/PDFReportDocument.tsx`

### 1. Replace `extractKeyPoints` with `extractExecutiveSummary`

New function returns `{ findings: string[], recommendations: string[] }`:

- **Findings** (max 3): Lines containing `$`, `€`, `%`, or words like "found", "indicates", "presents", "analysis", "current", "total", "average", "estimated"
- **Recommendations** (max 3): Lines containing "target", "aim to", "recommend", "should", "negotiate", "consider", "implement", "prioritize", "pursue", "establish"
- **Fallback**: If either bucket is empty, split the first 6 clean sentences — first half → findings, second half → recommendations

### 2. Update component usage

Replace `const keyPoints = extractKeyPoints(...)` with `const { findings, recommendations } = extractExecutiveSummary(...)`.

### 3. Update Executive Summary layout (lines 434-448)

Replace the single bulleted list with two sub-sections inside `sectionContent`:

```text
┌─ Executive Summary ──────────────────────┐
│                                          │
│  Key Findings                            │
│  ● Finding 1                             │
│  ● Finding 2                             │
│  ● Finding 3                             │
│                                          │
│  Top Recommendations                     │
│  ● Recommendation 1                      │
│  ● Recommendation 2                      │
│  ● Recommendation 3                      │
│                                          │
└──────────────────────────────────────────┘
```

- Sub-headings use `analysisSubHeader` style
- Findings bullets use existing green `keyPointBullet` style
- Recommendations bullets use `warning` color for visual distinction
- 12px spacing between the two blocks

