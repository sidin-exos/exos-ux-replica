

# Fix TOC Formatting and Wall-of-Text Structuring

## File: `src/components/reports/pdf/PDFReportDocument.tsx`

### Task 1: Fix TOC Formatting (lines 758-776)

The current TOC renders correctly as structured `<View>` rows with `<Link>` elements — it already uses `tocRow`, `tocLabel`, and `tocPageHint` styles. However, the `<Link>` component in `@react-pdf/renderer` requires a child `<Text>` element; passing a raw string may cause the "raw string dump" bug.

**Fix**: Wrap the link content in an explicit `<Text>` inside `<Link>`, and add a dotted leader line between label and arrow using a flex-grow `<View>` with dashed border.

Replace the TOC row rendering (lines 766-773):
- Each row: `<View tocRow>` → `<Link><Text tocLabel>{i+1}. {label}</Text></Link>` → `<View style={dottedLeader} />` → `<Text tocPageHint>→</Text>`
- Add `tocLeader` style: `{ flex: 1, borderBottomWidth: 1, borderBottomStyle: "dashed", borderBottomColor: c.border, marginHorizontal: 10, marginBottom: 3 }`

### Task 2: Restructure Wall of Text (lines 802-869)

The current `categorizeAnalysisSections` already groups lines by type and applies distinct block styles. The issue is that `wrap={false}` on the outer `<View>` can cause entire sections to be pushed to a new page as monolithic blocks, and the "Key Cost Drivers" pattern isn't detected.

**Fixes**:
1. Add `"driver"` / `"cost"` keywords to `sectionPatterns.findings` regex so "Key Cost Drivers" gets caught as findings-type with the appropriate styling.
2. Add new styles to `buildDocStyles`:
   - `blockCostDrivers`: `backgroundColor: "#f8fafc"` (light) / `c.surfaceLight` (dark), `padding: 12`, `borderRadius: 4`, `marginBottom: 12`
3. Add a new section type `"costDrivers"` to `SectionType` union and `sectionPatterns` with pattern: `/\b(cost\s*driver|key\s*cost|cost\s*factor|cost\s*breakdown)\b/i`
4. Map `costDrivers` type to `blockCostDrivers` style in the render switch.
5. Remove `wrap={false}` from outer section `<View>` so content flows naturally across pages instead of creating gaps.

### Styles to add in `buildDocStyles` (after line 303):
- `blockCostDrivers`: `{ backgroundColor: c.surfaceLight, padding: 12, borderRadius: 4, marginBottom: 12 }`
- `tocLeader`: `{ flex: 1, borderBottomWidth: 1, borderBottomColor: c.border + "60", marginHorizontal: 10, marginBottom: 3 }`

### Summary of line-level changes:
1. **Lines 106-127**: Add `tocLeader` style
2. **Lines 271-303**: Add `blockCostDrivers` style
3. **Lines 555-568**: Add `costDrivers` to `SectionType` and `sectionPatterns`
4. **Lines 766-773**: Fix TOC row to use `<Text>` inside `<Link>` + dotted leader
5. **Lines 805-815**: Add `costDrivers` to block style mapping, remove `wrap={false}`

