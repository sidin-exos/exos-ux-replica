

# Test Phase Analytics Dashboard — Implementation Plan

## Files to Create

### 1. `src/hooks/useAnalyticsDashboard.ts`

Custom hook using `useQueries` from `@tanstack/react-query` to run all Supabase queries in parallel:

| Index | Query Key | Table | What it fetches |
|-------|-----------|-------|-----------------|
| 0 | `analytics-profiles` | `profiles` | All rows: `id, created_at` — derive total users + monthly signups client-side |
| 1 | `analytics-orgs` | `organizations` | All rows: `id, created_at` — derive total orgs + monthly signups |
| 2 | `analytics-prompts` | `test_prompts` | All rows: `id, scenario_type, created_at` — count by scenario_type |
| 3 | `analytics-reports` | `test_reports` | All rows: `id, prompt_id, success, processing_time_ms, total_tokens, created_at` — success rate, avg time, avg tokens |
| 4 | `analytics-intel` | `intel_queries` | All rows: `id, query_type, success, processing_time_ms, created_at` — total, by type, success rate |
| 5 | `analytics-insights` | `market_insights` | Count only via `.select("id", { count: "exact", head: true })` |
| 6 | `analytics-scenario-feedback` | `scenario_feedback` | All rows: `id, scenario_id, rating, feedback_text, created_at` — rating distribution, latest 5 texts |
| 7 | `analytics-chat-feedback` | `chat_feedback` | All rows: `id, rating, created_at` — thumbs up/down counts |
| 8 | `analytics-files` | `user_files` | Count only via head request |
| 9 | `analytics-trackers` | `enterprise_trackers` | Count only via head request |

The hook returns a structured object with derived metrics:
- `totalUsers`, `totalOrgs`, `totalScenarios`, `totalIntelQueries`
- `scenarioBreakdown[]` — `{ type, count, successRate, avgTimeMs, avgTokens }`
- `intelBreakdown[]` — `{ type, count, successRate }`
- `userGrowth[]` / `orgGrowth[]` — `{ month: string, count: number }`
- `feedbackDistribution` — `{ [rating]: count }`
- `avgRating`, `latestFeedback[]`
- `chatThumbsUp`, `chatThumbsDown`
- `totalFiles`, `totalInsights`, `totalTrackers`
- `isLoading` (any query loading), `error` (first error found)

Scenario breakdown requires joining prompts + reports client-side by `prompt_id`.

### 2. `src/pages/admin/AnalyticsDashboard.tsx`

Layout mirrors FounderDashboard pattern (Header + container):

- **Header row**: "Test Phase Analytics" + `<Button>` with RefreshCw icon that calls `queryClient.invalidateQueries({ queryKey: ["analytics"] })` (all keys prefixed with `analytics-` will be matched by using `predicate` or by nesting under a common prefix).
  - Actually, use `queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string).startsWith("analytics-") })`.

- **Top StatCards (4-grid)**: Total Users, Total Orgs, Total Scenarios Run, Total Intel Queries — using the existing `StatCard` component from `src/components/dashboard/StatCard.tsx`.

- **Tabs** (4 tabs using Shadcn Tabs):
  - **Usage & Performance**: Recharts `BarChart` (scenario types vs count). Table with columns: Scenario Type, Runs, Success Rate, Avg Time (ms), Avg Tokens.
  - **Growth**: Recharts `LineChart` with two lines (users, orgs) by month.
  - **Feedback**: Bar chart for rating distribution (1-5). Chat thumbs up/down as two StatCards. Table of latest 5 feedback texts.
  - **Assets**: StatCards for files uploaded, market insights saved, active trackers.

- **Loading state**: Skeleton placeholders when `isLoading` is true.

### 3. `src/App.tsx` modifications

- Add import: `import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";`
- Add route before the catch-all:
  ```
  <Route path="/admin/analytics" element={<ProtectedRoute requireSuperAdmin><AnalyticsDashboard /></ProtectedRoute>} />
  ```

### 4. `src/pages/admin/FounderDashboard.tsx` modifications

- Add a `Link` or `Button` with `useNavigate` to `/admin/analytics` next to the "Command Center" title, labeled "View Analytics".
- Import `BarChart3` icon from lucide-react for the button.

## Technical Notes

- `shared_reports` is completely excluded (RLS blocks all SELECT).
- All queries use the existing `supabase` client; super_admin RLS grants read access.
- Monthly grouping done client-side by parsing `created_at` and bucketing into `YYYY-MM`.
- No new migrations, edge functions, or RPCs.

