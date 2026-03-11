

# Fix Visual Artifacts + Restructure Executive Summary + Strict Placeholders

## Task 1: Fix the "9" bug and disconnected lists

**Root cause of the "9"**: Every section header renders `<Image src={exosLogo} style={styles.sectionLogoImage} />`. When `@react-pdf/renderer` fails to resolve the Vite-imported PNG path at render time, it can emit a fallback glyph — in this case, "9". This appears before "Executive Summary", "Detailed Analysis", "Methodology", etc.

**Fix**: Remove all `<Image src={exosLogo} style={styles.sectionLogoImage} />` from section headers in `PDFReportDocument.tsx` (keep only the one in the page header/brand area which uses a larger size and seems to work). Replace with a small colored accent square `<View>` (like the dashboard icon pattern).

**Disconnected lists fix**: Replace the `<View style={keyPointItem}><View bullet/><Text/></View>` pattern with a single `<Text>` element per item: `<Text style={...}>{i+1}. {text}</Text>`. This prevents page-break splitting between number and text.

## Task 2: Restructure Executive Summary (Point 1)

Already partially done — `extractExecutiveSummary` exists and returns `{ findings, recommendations }`. Needs refinement:
- Tighten finding patterns: `$`, `€`, `%`, "margin", "baseline", "indicates"
- Tighten recommendation patterns: "Target:", "Aim to", "Develop", "Negotiate", "Propose"
- Render findings with standard text styling
- Render recommendations with a subtle warning-tinted background

## Task 3: Strict Visualization Placeholders (Point 2)

- Dashboard components already have no hardcoded defaults (confirmed via search)
- `extractDashboardData` already returns `null` on failure (confirmed in code)
- Improve `PDFNoDataPlaceholder` in `PDFDashboardVisuals.tsx`: increase `minHeight` to 150, add dashed border, center content vertically/horizontally

## Files changed

1. **`src/components/reports/pdf/PDFReportDocument.tsx`**
   - Remove `<Image src={exosLogo}>` from all section headers (lines 739, 771, 827, 894, 964, 996)
   - Replace with a small accent `<View>` square (8×8, primary color, borderRadius 2)
   - Flatten executive summary list items into single `<Text>` elements
   - Add recommendation-specific background tint styling
   - Remove `sectionLogoImage` style (no longer needed)

2. **`src/components/reports/pdf/PDFDashboardVisuals.tsx`**
   - Remove `<Image src={exosLogo}>` from dashboard page section headers (line 310)
   - Replace with accent square
   - Upgrade `PDFNoDataPlaceholder`: `minHeight: 150`, add `borderWidth: 1.5`, `borderStyle: "dashed"`, `borderColor: "#d1d5db"`
   - Remove logo image imports if no longer used

3. **Dashboard components** — no changes needed (no hardcoded defaults found)

