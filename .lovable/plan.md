

# Implement Automated Test Plan Orchestrator

## Summary
Add a new `TestPlanOrchestrator` component to the Command Center tab in the Testing Pipeline page. It provides two workflows: (1) Generate a randomized draft test plan (N=15), and (2) Import an approved plan (N=10) and execute the full Generate-then-Analyze loop automatically for each item.

## Architecture Decision

**Option A: Separate component, embedded in Command Center tab** (Recommended)
- New `src/components/testing/TestPlanOrchestrator.tsx` component
- Placed below the existing `LaunchTestBatch` in the left column of Command Center
- Reuses existing `generateAITestData` and `supabase.functions.invoke('sentinel-analysis')` logic
- Clean separation: manual single-shot remains in `LaunchTestBatch`, orchestrated batches in `TestPlanOrchestrator`

**Option B: New dedicated tab**
- Adds a 4th tab to the pipeline page
- More visible, but fragments the Command Center workflow

Going with **Option A** -- keeps the workflow cohesive within the Command Center.

## Changes

### 1. New File: `src/components/testing/TestPlanOrchestrator.tsx`

**Plan Generation Section:**
- Button: "Generate Draft Plan (N=15)"
- Requires a `scenarioId` to be selected (passed as prop)
- Randomly selects 15 combinations of `{ persona, industrySlug, categorySlug }` from:
  - `BuyerPersona` values (5 personas from the PERSONAS constant)
  - `INDUSTRY_CATEGORY_COMPATIBILITY` keys for industries
  - Compatible categories per selected industry
- Generates array: `[{ scenarioId, persona, industrySlug, categorySlug }]`
- Displays the JSON in a read-only `<pre>` block with a "Copy to Clipboard" button and a "Download JSON" button
- Each entry also gets a random `entropyLevel` (1-3) for variety

**Plan Execution Section:**
- Textarea where user pastes the approved JSON array (filtered to ~10 items)
- "Run Automated Plan" button
- Execution loop (sequential to avoid rate limits):
  - For each item in the array:
    1. Call `generateAITestData({ scenarioType, persona, industry, category })`
    2. Call `supabase.functions.invoke('sentinel-analysis', { body: { ... enableTestLogging: true } })`
    3. Update progress: "Executing test 3 of 10..."
  - 1-second delay between items to avoid rate limiting
  - Errors are caught per-item (logged to a results array), loop continues
- After completion:
  - Show summary: "8/10 succeeded, 2 failed"
  - Invalidate `test-prompts` and `test-stats` queries
  - Display failed items with error messages

**UI State:**
- `idle | generating-plan | running` phase
- Progress bar with `currentIndex / totalItems` during execution
- Results array: `{ index, status: 'success' | 'error', error?: string }[]`

### 2. Update `src/pages/TestingPipeline.tsx`

- Import `TestPlanOrchestrator`
- Add it to the Command Center tab's left column (`lg:col-span-1`), below `LaunchTestBatch` and `TestSessionLog`
- Pass `scenarioId` and `model` as props

### 3. Type Addition in `src/lib/testing/types.ts`

Add a lightweight interface for the test plan item:

```typescript
export interface TestPlanItem {
  scenarioId: string;
  persona: BuyerPersona;
  industrySlug: string;
  categorySlug: string;
  entropyLevel: EntropyLevel;
}
```

## Technical Details

### Plan Generation Logic (pseudo-code)
```text
industries = Object.keys(INDUSTRY_CATEGORY_COMPATIBILITY)
personas = ['rushed-junior', 'methodical-manager', 'cfo-finance', 'frustrated-stakeholder', 'lost-user']

plan = []
for i in 0..14:
  industry = randomChoice(industries)
  category = randomChoice(INDUSTRY_CATEGORY_COMPATIBILITY[industry])
  persona = randomChoice(personas)
  entropy = randomChoice([1, 2, 3])
  plan.push({ scenarioId, persona, industrySlug: industry, categorySlug: category, entropyLevel: entropy })
```

### Execution Loop (pseudo-code)
```text
for each item in approvedPlan:
  try:
    testData = await generateAITestData({ scenarioType: item.scenarioId, persona: item.persona, industry: item.industrySlug, category: item.categorySlug })
    if !testData.success: record error, continue
    await supabase.functions.invoke('sentinel-analysis', { body: { scenarioType, scenarioData: testData.data, enableTestLogging: true, model, ... } })
    record success
  catch:
    record error
  await sleep(1000)  // rate-limit protection

invalidateQueries(['test-prompts', 'test-stats'])
```

### Error Handling
- Each item runs independently -- one failure does not stop the batch
- Failed items are collected and displayed in a summary card after completion
- Toast notification on completion with pass/fail counts

## Files Modified
- `src/lib/testing/types.ts` -- add `TestPlanItem` interface
- `src/components/testing/TestPlanOrchestrator.tsx` -- new component (Plan Generation + Plan Execution)
- `src/pages/TestingPipeline.tsx` -- import and place orchestrator in Command Center tab

## No Database or Edge Function Changes
This feature reuses existing `generate-test-data` and `sentinel-analysis` edge functions, and writes to existing `test_prompts` / `test_reports` tables via `enableTestLogging: true`.

