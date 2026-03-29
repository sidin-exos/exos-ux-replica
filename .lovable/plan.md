

# PDF Layout Restructure — Move Analysis Inputs & Methodology into Parameters Section

## What Changes

**Current structure (last page):**
1. Detailed Analysis sections
2. Methodology & Limitations (separate section)
3. Analysis Parameters (full table)

**Current Executive Summary page:**
- KPIs → Key Findings → Recommended Actions → **Analysis Inputs (first 6 params)** ← remove this

**New structure:**

**Executive Summary page:** KPIs → Key Findings → Recommended Actions (no inputs table)

**Last page:**
1. Detailed Analysis sections
2. **Analysis Parameters** section containing:
   - Full parameters table (all params, not just first 6)
   - Methodology & Limitations text (moved inside, after the table)
   - Input coverage + confidence badge
   - Audit trail

## Files to Edit

| File | Change |
|---|---|
| `src/components/reports/pdf/PDFReportDocument.tsx` | Remove "Analysis Inputs" block from Exec Summary page; move Methodology into Parameters section |
| `supabase/functions/generate-pdf/pdf-document.tsx` | Mirror identical changes |

## Detailed Changes (both files)

### 1. Remove Analysis Inputs from Executive Summary (lines ~873-894 frontend, ~1073-1094 edge)
Delete the entire `{inputEntries.length > 0 && (...)}` block that renders the "Analysis Inputs" table on the Executive Summary page. Also remove the `inputEntries` variable.

### 2. Restructure the Parameters + Methodology section
Replace the current separate Methodology and Parameters sections with a single combined "Analysis Parameters" section:

```text
Analysis Parameters (section title)
├── Parameters table (all entries)
├── Divider
├── Methodology & Limitations (sub-header, not section title)
│   ├── Methodology text
│   ├── Coverage + Confidence row
│   └── Audit trail
```

### 3. Update TOC
Remove the separate "Methodology & Limitations" TOC entry — it's now a subsection inside "Analysis Parameters".

### 4. Deploy
Deploy `generate-pdf` edge function after changes.

## Build Errors
The existing build errors in other edge functions (`generate-market-insights`, `generate-test-data`, `im-driver-propose`, `market-intelligence`, `sentinel-analysis`) are pre-existing and unrelated to this change. They will not be addressed in this task.

