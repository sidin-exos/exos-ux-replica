

<<<<<<< HEAD
# Analytics Dashboard Enhancements

## Summary of Changes

Six enhancements to the admin analytics dashboard: user satisfaction metrics, recent runs table, industry breakdown, raw data export, time-range filtering, and industry aggregation table.

## 1. Hook Changes (`src/hooks/useAnalyticsDashboard.ts`)

### New queries
- **test_prompts (expanded)**: Fetch `industry_slug, category_slug` in addition to existing fields
- **test_reports (expanded)**: Fetch `model, prompt_tokens, completion_tokens` in addition to existing fields
- **Recent 20 runs**: Derive from the already-fetched prompts + reports data (join client-side, sort by `created_at` desc, take 20)

### New derived data

| Return field | Source | Description |
|---|---|---|
| `satisfactionRate` | `scenario_feedback` | % of ratings ≥ 7 out of total feedback submissions (scale is 1-10) |
| `recentRuns[]` (20 items) | `test_prompts` + `test_reports` join | Each item: scenario_type, industry_slug, category_slug, success, processing_time_ms, total_tokens, model, prompt_tokens, completion_tokens, created_at |
| `industryBreakdown[]` | `test_prompts` + `test_reports` join | Same structure as scenarioBreakdown but grouped by `industry_slug` |
| `timeFilteredScenarioBreakdown` | Computed from prompts/reports filtered by time range | Same shape as `scenarioBreakdown` but filtered to selected period |
| `timeFilteredIndustryBreakdown` | Same but for industry | Industry aggregation filtered by time |

### Time range filtering
- Add a `timeRange` parameter to the hook (or handle filtering client-side since all data is already fetched)
- Actually: since all prompts/reports are already fetched, filtering will happen in the **component** via a `useState` for time range, and the hook will accept the range to produce filtered breakdowns
- Better approach: hook returns raw arrays; component filters + derives. But to keep it clean, add a `useMemo`-based approach: the hook takes a `timeRange` state and returns filtered breakdowns.

**Revised approach**: The hook already fetches all prompts/reports. Add a `timeRange` parameter. The hook will filter prompts by `created_at` before computing `scenarioBreakdown` and `industryBreakdown`. The component passes the selected range.

### Raw data export
- New function `exportRawData()` returned from the hook that builds an XLSX workbook with sheets: "Scenario Runs" (all prompts+reports joined), "Feedback" (all scenario_feedback), "Intel Queries", "Chat Feedback"
- Uses the already-imported `xlsx` library

## 2. Dashboard UI Changes (`src/pages/admin/AnalyticsDashboard.tsx`)

### Top StatCards row
- Add a 5th card: **"Satisfaction Rate"** showing `XX%` (percentage of ratings ≥ 7)

### Header area
- Add **"Export Raw Data"** button next to Refresh button — calls `exportRawData()`

### Time range selector
- Add a `Select` dropdown above the Usage & Performance tab content with options: "Last 24 hours", "Last 3 days", "Last 7 days" (default), "Last month", "All time"
- This filters `scenarioBreakdown`, `industryBreakdown`, the chart, and the recent runs

### Usage & Performance tab — new sections
1. **Recent 20 Scenario Runs** table after existing breakdown table:
   - Columns: Date, Scenario Type, Industry, Category, Success, Time (ms), Tokens, Model
   - Badge for success/fail, truncated industry/category names

2. **Industry Breakdown** table (new, after recent runs):
   - Same structure as Scenario Breakdown table but grouped by `industry_slug`
   - Columns: Industry, Runs, Success Rate, Avg Time (ms), Avg Tokens

### Feedback tab
- Fix rating chart to use 1-10 scale (currently hardcoded to 1-5)
- Add satisfaction rate StatCard alongside existing feedback stats

## 3. Technical Details

### Time range filter implementation
```typescript
// In component
const [timeRange, setTimeRange] = useState<string>("7d");

// Filter function
const getTimeFilterDate = (range: string): Date => {
  const now = new Date();
  switch(range) {
    case "24h": return new Date(now.getTime() - 24*60*60*1000);
    case "3d": return new Date(now.getTime() - 3*24*60*60*1000);
    case "7d": return new Date(now.getTime() - 7*24*60*60*1000);
    case "30d": return new Date(now.getTime() - 30*24*60*60*1000);
    default: return new Date(0); // all time
  }
};
```

### Export function
Uses `xlsx` (already in dependencies via `src/lib/report-export-excel.ts`) to build a multi-sheet workbook:
- Sheet "Scenario Runs": all prompts joined with reports
- Sheet "Scenario Feedback": all feedback rows
- Sheet "Intel Queries": all intel rows  
- Sheet "Chat Feedback": all chat rows

### Files modified
1. `src/hooks/useAnalyticsDashboard.ts` — expand queries, add industryBreakdown, recentRuns, satisfactionRate, exportRawData, accept timeRange param
2. `src/pages/admin/AnalyticsDashboard.tsx` — add time filter UI, recent runs table, industry table, satisfaction card, export button, fix rating scale

No new files. No migrations. No edge functions.
=======
# Upgrade AI Analysis Results to Structured Markdown

## New File: `src/components/ui/MarkdownRenderer.tsx`

Create a reusable Markdown renderer using `react-markdown` + `remark-gfm`:

- Accept `content: string` and optional `className` props
- Custom `components` prop styling with Tailwind:
  - `h1/h2/h3`: Enterprise typography (`text-2xl/xl/lg font-bold mt-6 mb-4`)
  - `table`: Wrapped in `overflow-x-auto` div, `w-full border-collapse my-6 text-sm`
  - `th`: `bg-muted/50 border border-border p-3 text-left font-semibold`
  - `td`: `border border-border p-3`
  - `ul/ol`: `list-disc/decimal pl-6 mb-4 space-y-2`
  - `strong`: `font-semibold text-foreground`
  - `p`: `mb-4 leading-relaxed`

## New Dependencies

Install `react-markdown` and `remark-gfm`.

## Edit: `src/components/scenarios/GenericScenarioWizard.tsx`

Replace lines 929-934:
```tsx
{analysisResult ? (
  <div className="bg-card rounded-lg p-4 border border-border max-h-[500px] overflow-y-auto">
    <MarkdownRenderer content={analysisResult} />
  </div>
) : (
```

Import `MarkdownRenderer` at top of file.
>>>>>>> 4554177 (Save plan in Lovable)

