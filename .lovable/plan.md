

## Inflation Platform v2.0 — Price Driver Framework Implementation

### Overview
Complete replacement of the inflation platform from the old IM-1/2/3 tracker model to a driver-centric Price Driver Framework. A 6-step setup wizard, 4 new database tables, a new dashboard with status badges, and a scaffolded edge function.

---

### 1. Database Migration — 4 New Tables

Create migration file with:

- **`inflation_trackers`**: `id`, `organization_id`, `created_by` (FK auth.users), `goods_definition` (text), `driver_count_target` (int default 5), `is_active` (bool default true), `created_at`
- **`inflation_drivers`**: `id`, `tracker_id` (FK), `organization_id`, `driver_name`, `rationale`, `source` (text: ai_proposed/user_defined), `weight` (int nullable 1-100), `trigger_description` (text), `scan_cadence` (text default 'weekly'), `enrichment_cadence` (text default 'monthly'), `current_status` (text default 'stable', check: improving/stable/deteriorating), `context_summary` (text), `last_scanned_at`, `last_enriched_at`, `is_active` (bool default true), `created_at`
- **`inflation_event_scans`**: `id`, `driver_id` (FK), `organization_id`, `scan_date`, `event_detected` (bool), `confidence_level` (text: high/medium/low), `source_summary`, `source_urls` (text[]), `created_at`
- **`inflation_alerts`**: `id`, `driver_id` (FK), `organization_id`, `alert_source` (text: event_scan/enrichment), `alert_level` (text: watch/breach), `scan_id` (nullable FK to event_scans), `bridge_scenarios` (text[]), `acknowledged` (bool default false), `acknowledged_at`, `created_at`

RLS on all 4 tables using `get_user_org_id(auth.uid())`:
- SELECT: `organization_id = get_user_org_id(auth.uid())` or `is_super_admin(auth.uid())`
- INSERT: `organization_id = get_user_org_id(auth.uid())`
- UPDATE: same org check
- DELETE: same org check

Auto-set `organization_id` trigger on `inflation_trackers` and `inflation_drivers`.

### 2. Fix rate-limit.ts

Line 65: replace `supabase.rpc("cleanup_rate_limits").then(() => {}).catch(() => {});` with `void supabase.rpc("cleanup_rate_limits");`

### 3. New Hook — `src/hooks/useInflationTrackers.ts`

Queries `inflation_trackers` joined with `inflation_drivers`. Provides:
- `trackers` list with nested `drivers`
- `createTracker` mutation: inserts tracker row, then bulk-inserts accepted drivers
- Uses `useQuery` + `useMutation` with react-query

### 4. New Components

**`src/components/enterprise/InflationSetupWizard.tsx`** — 6-step wizard:
1. Goods Definition — textarea + privacy warning ("Do not enter supplier names or confidential data")
2. Driver Proposal — 5 mock driver cards (name + rationale), each with accept/reject toggle + "Add custom driver" button
3. Driver Review — summary of accepted drivers, ability to remove
4. Weight Assignment — optional 1-100 slider per driver, note that weights don't need to sum to 100
5. Trigger Definition — freetext per driver + privacy warning ("This description is sent to public AI. No confidential info.")
6. Review & Activate — summary, submit to database

**`src/components/enterprise/InflationTrackerCard.tsx`** — Dashboard card per tracker:
- Goods/service name, creation date, active driver count
- Collapsible driver list using `Collapsible` component

**`src/components/enterprise/InflationDriverCard.tsx`** — Per-driver card:
- Prominent status badge: Improving (green), Stable (yellow/amber), Deteriorating (red)
- Driver name, weight bar, context summary excerpt
- Last scan date + result

### 5. Rewrite `src/pages/enterprise/InflationPlatform.tsx`

- New header: "Inflation Monitor — Price Driver Framework"
- Methodology card explaining the driver-centric approach, the 3 statuses (Improving/Stable/Deteriorating)
- Tabs: Dashboard | New Tracker (6-step wizard) | Event Feed (empty state)
- Uses new `useInflationTrackers` hook instead of `useEnterpriseTrackers("inflation")`

### 6. Scaffold Edge Function — `supabase/functions/im-driver-propose/index.ts`

- Accepts `{ goods_definition, driver_count_target }` POST body
- Returns hardcoded mock: 5 driver objects `[{ name, rationale }]`
- CORS headers, JWT validation, rate limiting
- Ready for Perplexity Sonar Pro integration later

### What stays untouched
- `TrackerSetupWizard.tsx` and `TrackerList.tsx` — used by Risk Platform only
- `useEnterpriseTrackers.ts` — Risk Platform hook, unchanged
- `enterprise_trackers` table — Risk Platform data, unchanged

### Technical notes
- All new tables use `organization_id` scoping via existing `get_user_org_id()` function
- Driver status uses text enum with validation trigger (not CHECK constraint)
- Mock driver proposals are hardcoded in the wizard component; the edge function is scaffolded for future use
- No Perplexity API calls in this phase

