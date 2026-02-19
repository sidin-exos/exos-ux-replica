

## Enhance Testing Pipeline Page: Command Center

### Overview
Transform the current static diagram page into an interactive Command Center with two new sections below the diagram: a **Launch Test Batch** form and a **Refactoring Backlog** aggregation dashboard.

No database changes needed -- we reuse `test_prompts` and `test_reports` with existing JSONB columns. No new edge functions needed -- we connect to the existing `generate-test-data` function.

### Files to Create

#### 1. `src/components/testing/LaunchTestBatch.tsx`
A form card allowing admins to configure and trigger a test batch.

**Form fields:**
- **Scenario Type** -- Select dropdown populated from `scenarios` array in `src/lib/scenarios.ts` (only "available" ones)
- **Buyer Persona** -- Select dropdown with the 3 personas: `executive_sponsor`, `solo_procurement_hero`, `tactical_category_manager`
- **Entropy Level** -- Radio group or slider: L1 (Structured), L2 (Mixed), L3 (Raw Dump)
- **Industry / Category** -- Optional selects from the compatibility matrix in `ai-test-data-generator.ts`

**Submit action:** Calls `generateAITestData()` from `src/lib/ai-test-data-generator.ts` with mode `messy` (for L3) or `generate` (for L1/L2). Shows a toast on success/failure.

**Style:** Uses Shadcn `Card`, `Select`, `RadioGroup`, `Button` with `variant="hero"`. Consistent with existing enterprise aesthetic.

#### 2. `src/components/testing/RefactoringBacklog.tsx`
An aggregation dashboard that reads from `test_reports` and summarizes field-level verdicts.

**Data source:** Uses `useTestPrompts()` from `useTestDatabase.ts` hook. Parses `shadow_log` and `validation_result` JSONB columns to extract field evaluations (since evaluation verdicts are stored in the report's JSONB fields).

**UI sections:**

**Stats Row (4 cards):**
- Total Prompts, Total Reports, Success Rate, Avg Processing Time
- Reuses `useTestStats()` from existing hook

**Consensus Actions Table:**
- Groups findings by `field_name`
- Shows the dominant `FieldAction` across runs
- Highlights fields where >80% of runs agree with a colored badge: green (REDUNDANT_HIDE), amber (OPTIONAL_KEEP), red (CRITICAL_REQUIRE), blue (SCHEMA_GAP)
- "Suggested Change" alert row when consensus exceeds 80%

**Schema Gaps List:**
- Lists detected schema gaps sorted by frequency
- Shows which persona triggered the gap most often
- Each gap has a `PlusCircle` icon and the suggested field name

**Empty State:** When no test data exists, shows a friendly message pointing to the Launch form above.

#### 3. `src/components/testing/TestStatsCards.tsx`
Small component rendering the 4 stat cards (extracted for reuse). Uses `useTestStats()`.

### Files to Modify

#### `src/pages/TestingPipeline.tsx`
- Add a `Tabs` component (from Shadcn) with 2 tabs:
  - **Pipeline Diagram** -- Current diagram + export buttons + explanation cards (moved here)
  - **Command Center** -- Contains `LaunchTestBatch` + `RefactoringBacklog`
- Keep the header, title, and back-nav unchanged
- Import the new components

### Architecture Decisions

- **No new DB tables.** Field evaluations are read from the `shadow_log` JSONB column in `test_reports`. The `shadow_log` already contains server-side evaluation metadata (per the existing architecture). The aggregation logic parses this client-side.
- **No new edge functions.** The launch form reuses `generate-test-data` with existing modes.
- **Admin-only data.** Both `test_prompts` and `test_reports` have RLS restricted to admin role. The UI will gracefully show empty state for non-admin users (queries will return empty arrays).
- **Types from `src/lib/testing/types.ts`** are used for casting the parsed JSONB data (`FieldEvaluation`, `FieldAction`, `SchemaGap`).

### Technical Details

- Tab component: `@radix-ui/react-tabs` (already installed)
- Form components: `Select`, `RadioGroup`, `Button`, `Card` (all existing Shadcn)
- Icons: `SlidersHorizontal`, `Zap`, `PlusCircle`, `CheckCircle`, `AlertTriangle`, `XCircle`, `BarChart3`
- The consensus calculation is pure client-side: iterate reports, extract field evaluations from `shadow_log`, group by field name, count action occurrences, compute percentages
- Color coding matches the diagram's 4-outcome palette (green/amber/red/blue)

