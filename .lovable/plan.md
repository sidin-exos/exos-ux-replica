

# Market Intelligence: Scheduled Reports, Save-to-Grounding, and Triggered Monitoring

## Summary

Three changes to the Market Intelligence module:

1. **Regular Reports** → Rename to "Scheduled Reports". Same ad-hoc query interface but with a schedule selector (daily/weekly/monthly). User configures a query + schedule, system saves the configuration. Actual cron execution is a future backend task — the UI collects and persists the schedule intent now.

2. **Save Intel Results** → After any query completes, user can "Save to Knowledge Base" and tag it with an industry slug, category slug, or specific scenario ID. Saved results get inserted into `market_insights` table (same table used for grounding in `sentinel-analysis`), making them automatically available for future AI analysis grounding.

3. **Triggered Notifications** → Rename badge to "Enterprise". User enters a monitoring instruction (text field describing what to watch for). The trigger definition is persisted. When the monitoring system runs (scheduled cron — future), it executes the query and evaluates if the trigger condition is met. If yes, it initiates a full report collection. The UI collects trigger configs now.

---

## Architecture

```text
CURRENT:
  IntelScenarioSelector: adhoc (active) | regular (disabled) | triggered (disabled)
  QueryBuilder → Perplexity API → IntelResults → done

PROPOSED:
  IntelScenarioSelector: adhoc (active) | scheduled (active) | triggered (Enterprise badge)

  [Ad-hoc]     → QueryBuilder → IntelResults → "Save to Knowledge Base" button
  [Scheduled]  → QueryBuilder + ScheduleConfig → saves to `saved_intel_configs` table
  [Triggered]  → TriggerConfig (instruction text + query params) → saves to `saved_intel_configs`

  Save flow:  IntelResults → SaveToKnowledgeBase dialog → pick industry/category/scenario → INSERT into market_insights
```

---

## Step 1: Database Migration

New table `saved_intel_configs` to store both scheduled reports and trigger monitors:

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | Auth user who created it |
| `config_type` | text | `'scheduled'` or `'triggered'` |
| `name` | text | User-given name for this config |
| `query_type` | text | supplier/commodity/etc |
| `query_text` | text | The query template |
| `recency_filter` | text | Optional |
| `domain_filter` | text[] | Optional |
| `context` | text | Optional additional context |
| `schedule_cron` | text | For scheduled: `'daily'`, `'weekly'`, `'monthly'` |
| `trigger_instruction` | text | For triggered: the monitoring instruction |
| `grounding_target` | jsonb | `{ industry_slug?, category_slug?, scenario_id? }` — where to save results |
| `is_active` | boolean | Default true |
| `last_run_at` | timestamptz | Last execution time |
| `created_at` | timestamptz | |

RLS: Users can CRUD their own configs (`user_id = auth.uid()`). Admins can read all.

---

## Step 2: Update Scenario Selector

- **"Regular Reports"** → rename to **"Scheduled Reports"**, remove "Coming Soon" badge, make selectable
- **"Triggered Notifications"** → change badge from "Coming Soon" to **"Enterprise"**, keep disabled
- Update descriptions to match new functionality

---

## Step 3: Save Intel Results to Knowledge Base

Add a "Save to Knowledge Base" button in `IntelResults.tsx`:

- Opens a dialog with:
  - **Industry selector** (dropdown from `industry_contexts` table)
  - **Category selector** (dropdown from `procurement_categories` table)
  - Optional: scenario ID text field
- On save: inserts into `market_insights` table with the query result mapped to the market_insights schema:
  - `content` = result summary
  - `citations` = result citations
  - `industry_slug` / `category_slug` from selectors
  - `confidence_score` = 0.8 (default for ad-hoc queries)
  - `key_trends`, `risk_signals`, `opportunities` = extracted from summary (simple heuristic) or empty arrays
- This makes the intel result immediately available for grounding in `sentinel-analysis` edge function

**Important**: `market_insights` currently has no INSERT RLS policy. We need an edge function or RPC to handle the insert with service role, since the table is admin-write-only by design.

**Approach**: Create an RPC `save_intel_to_knowledge_base(...)` with `SECURITY DEFINER` that validates the authenticated user exists and inserts the record. This keeps the table locked down while allowing authenticated users to contribute intelligence.

---

## Step 4: Scheduled Reports UI

When user selects "Scheduled Reports" scenario:
- Show the same `QueryBuilder` form
- Add a **schedule frequency** selector below it: Daily / Weekly / Monthly
- Add a **grounding target** section: pick industry + category where results should auto-save
- Add a **name** field for the configuration
- Submit saves to `saved_intel_configs` with `config_type = 'scheduled'`
- Show a list of user's saved scheduled configs below the form

**Note**: The actual cron execution (running queries on schedule) is a future backend task. The UI persists the intent. A placeholder message explains: "Scheduled execution is being rolled out. Your configuration is saved and will activate automatically."

---

## Step 5: Triggered Notifications UI (Enterprise)

When user clicks the "Triggered" card:
- Show an **Enterprise badge** overlay with description:
  - "Continuous monitoring with automated trigger detection. The system regularly checks your conditions and initiates full-scale intelligence collection when triggers are confirmed."
  - "Contact us to enable Enterprise features."
- The card is clickable but shows the enterprise gate instead of a form

---

## Step 6: Update MarketIntelligence Page

- When `selectedScenario === "scheduled"`, render a new `ScheduledReportsPanel` component instead of `QueryBuilder`
- When `selectedScenario === "triggered"`, render the Enterprise gate card
- Keep ad-hoc flow unchanged except for the new Save button in results

---

## Files Changed

| # | File | Action | Summary |
|---|---|---|---|
| 1 | Migration SQL | Create | `saved_intel_configs` table + RLS + `save_intel_to_knowledge_base` RPC |
| 2 | `src/components/intelligence/IntelScenarioSelector.tsx` | Edit | Rename labels, update badges, enable "scheduled" |
| 3 | `src/components/intelligence/IntelResults.tsx` | Edit | Add "Save to Knowledge Base" button + dialog |
| 4 | `src/components/intelligence/ScheduledReportsPanel.tsx` | Create | Form for creating scheduled report configs |
| 5 | `src/components/intelligence/SaveToKnowledgeBaseDialog.tsx` | Create | Dialog with industry/category selectors for saving |
| 6 | `src/hooks/useSavedIntelConfigs.ts` | Create | CRUD hook for `saved_intel_configs` table |
| 7 | `src/pages/MarketIntelligence.tsx` | Edit | Wire scheduled/triggered views based on selected scenario |

## What Does NOT Change
- `market-intelligence` edge function — no changes
- `sentinel-analysis` edge function — already reads from `market_insights`, saved results auto-ground
- `MarketInsightsAdmin` — admin KB management stays as-is
- `QueryBuilder` — reused as-is for both ad-hoc and scheduled flows

## Technical Notes
- The `save_intel_to_knowledge_base` RPC uses `SECURITY DEFINER` because `market_insights` has no user INSERT policy by design (admin-only writes). The RPC validates `auth.uid() IS NOT NULL` before inserting.
- Scheduled execution (cron) is deferred — the table stores configs for future `pg_cron` + `pg_net` integration that will call the `market-intelligence` edge function on schedule.
- Triggered monitoring follows the same pattern — stored config, future cron evaluates the trigger instruction against fresh search results.

