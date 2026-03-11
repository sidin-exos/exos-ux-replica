

# Break "Wall of Text" into Structured Visual Blocks

## Problem
The Detailed Analysis section (lines 494-541) renders all AI text in a single `sectionContent` `<View>`, creating ~1,200 words of continuous text.

## Approach
Parse the analysis text into categorized sections (Findings, Recommendations, Risks, Next Steps, General) using header/keyword detection, then render each with distinct visual styling.

## Changes — single file: `src/components/reports/pdf/PDFReportDocument.tsx`

### 1. New helper: `categorizeAnalysisSections`
Splits `analysisLines` into structured sections by detecting markdown headers and keyword patterns:
- **Findings**: Headers/content matching "finding", "analysis", "overview", "assessment", "current state"
- **Recommendations**: "recommend", "action", "strategy", "approach", "should"
- **Risks**: "risk", "challenge", "threat", "concern", "limitation"
- **Next Steps**: "next step", "implementation", "timeline", "roadmap", "action plan"
- **General**: Everything else (uncategorized paragraphs)

Returns `Array<{ type: 'findings' | 'recommendations' | 'risks' | 'nextSteps' | 'general', title: string, lines: string[] }>`.

### 2. New helper: `highlightMetrics`
Detects currency (`$`, `€`), percentages (`%`), and target phrases ("Aim to", "Target") in a line. Returns whether the line contains a metric for highlight-box treatment.

### 3. Visual styling per section type

```text
┌─ Findings ──────────────────────────────┐
│  Standard text, clear line spacing       │
│  [€2.5M] highlighted in accent box       │
└──────────────────────────────────────────┘
                 15px gap
┌─ Recommendations ───────────────────────┐
│ ▌ 1. First recommendation               │  ← 3px primary left border
│ ▌ 2. Second recommendation              │
└──────────────────────────────────────────┘
                 15px gap
┌─ Risks ─────────────────────────────────┐
│ ⚠ Risk Assessment                       │  ← destructive/warning bg tint
│   Risk item text                         │
└──────────────────────────────────────────┘
                 15px gap
┌─ Next Steps ────────────────────────────┐
│ ☐ Step one                              │  ← checklist format
│ ☐ Step two                              │
└──────────────────────────────────────────┘
```

New styles added to `buildDocStyles`:
- `sectionBlockFindings`: standard `sectionContent` base
- `sectionBlockRecommendations`: `borderLeftWidth: 3`, `borderLeftColor: c.primary`
- `sectionBlockRisks`: `backgroundColor: c.destructive + "10"`, warning symbol text prefix
- `sectionBlockNextSteps`: standard content with checklist bullet (`☐`)
- `metricHighlight`: inline `backgroundColor: c.primary + "15"`, `paddingHorizontal: 4`, `borderRadius: 2`, `color: c.primary`, `fontWeight: 700`
- All blocks: `marginBottom: 15`

### 4. Replace rendering block (lines 494-541)
Replace the single `sectionContent` loop with:
1. Call `categorizeAnalysisSections(analysisLines)`
2. Map over returned sections, rendering each with its type-specific `<View>` wrapper
3. Within each section: render header with `analysisSubHeader`, then lines — applying `metricHighlight` styling to lines containing financial figures
4. Recommendations use numbered list; Next Steps use `☐` prefix; Risks get `⚠` prefix on header

