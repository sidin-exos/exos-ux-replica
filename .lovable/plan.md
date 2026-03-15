

# Fix: Dynamic Field Derivation from Block Guidance

## Problem
`SCENARIO_SCHEMAS` (lines 166-196) has stale field names. `parseGeneratedData()` filters AI output through these wrong field names, discarding most generated data (only `industryContext` survives).

## Solution
Delete `SCENARIO_SCHEMAS` and derive valid fields dynamically from `SCENARIO_BLOCK_GUIDANCE` (already imported).

### Changes in `supabase/functions/generate-test-data/index.ts`

**1. Delete** `SCENARIO_SCHEMAS` constant and `ScenarioSchema` interface (lines 68-71, 162-196)

**2. Delete** `getAllFields()` helper (lines 199-201)

**3. Add** dynamic field derivation helper:
```typescript
function getScenarioFields(scenarioType: string): string[] {
  const guidance = SCENARIO_BLOCK_GUIDANCE[scenarioType];
  if (!guidance) return ["industryContext"];
  return guidance.map(block => block.fieldId);
}
```

**4. Replace** all 4 usage sites:
- Line 636: `const fields = getAllFields(schema)` → `const fields = getScenarioFields(scenarioType)`
- Line 833-834: same replacement in `generateDraftMode()`
- Line 1059-1060: same replacement in `generateMessyData()`
- Line 673/950/1109: `parseGeneratedData` calls already receive `fields` — no change needed

Each site currently does:
```typescript
const schema = SCENARIO_SCHEMAS[scenarioType] || { required: ["industryContext"], optional: [] };
const fields = getAllFields(schema);
```
Replace with:
```typescript
const fields = getScenarioFields(scenarioType);
```

### Files
- `supabase/functions/generate-test-data/index.ts` — single file, delete ~40 lines, add ~5 lines

### After deployment
Re-deploy edge function, then test Draft Test Case on any scenario to verify all blocks populate.

