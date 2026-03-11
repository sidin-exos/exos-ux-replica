

# Implement Point 5 (Analysis Parameters) and Point 7 (Typographic Hierarchy)

## File: `src/components/reports/pdf/PDFReportDocument.tsx`

### Task 1: Typographic Hierarchy (Point 7)

Update existing styles in `buildDocStyles`:

| Style | Change |
|-------|--------|
| `reportTitle` (line 185-191) | Add `fontFamily: "Helvetica-Bold"`, `letterSpacing: 0.5` |
| `sectionTitle` (line 204-209) | Change to `fontFamily: "Helvetica-Bold"`, add `letterSpacing: 0.5` |
| `analysisHeader` (line 260-267) | Change to `fontFamily: "Helvetica-Bold"` |
| `analysisSubHeader` (line 268-275) | Change to `fontFamily: "Helvetica-Bold"` |
| `sectionBlockHeader` (line 318-324) | Change to `fontFamily: "Helvetica-Bold"` |
| `tocLabel` (line 114-119) | Change to `fontFamily: "Helvetica-Bold"` |
| `brandName` (line 151-157) | Change to `fontFamily: "Helvetica-Bold"` |
| `analysisTextHighlight` (line 249-259) | Change to `fontFamily: "Courier-Bold"` for financial figures |

### Task 2: Fix Analysis Parameters Layout (Point 5)

Add new styles:
- `parameterBlock`: `{ marginBottom: 10 }`
- `parameterLabel`: `{ fontSize: 9, color: c.textMuted, fontFamily: "Helvetica", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }`
- `parameterValue`: `{ fontSize: 10, color: c.text, fontFamily: "Helvetica-Bold", lineHeight: 1.4 }`

Rewrite the Analysis Parameters section (lines 1001-1031): Replace the chip-based `flexDirection: "row", flexWrap: "wrap"` layout with a vertical list. Remove the truncation logic (lines 1014-1018) so values render in full with natural text wrapping. Each parameter renders as:

```text
<View parameterBlock>
  <Text parameterLabel>INDUSTRY CONTEXT</Text>
  <Text parameterValue>Engineering services company providing design, project management, and construction...</Text>
</View>
```

