

# Task 4 — Update Response Parsing and Return Shape

## Summary

Update the `handleGenerateMode` return block (lines 818-838) to use the new `GenerateTestDataResponse` shape with `fieldValues`, `testNotes`, `expectedEvaluatorScore`, `methodologyEnriched`, and `generatedAt` as top-level keys instead of the current `data`/`metadata` structure.

## Changes — Single File

**`supabase/functions/generate-test-data/index.ts`**

### 1. Replace the return block (lines 818-838)

Change from:
```typescript
return { success: true, data, metadata: { ... } }
```

To:
```typescript
return {
  success: true,
  scenarioId: scenarioType,
  qualityTier,
  parameters,
  fieldValues: data,
  testNotes,
  expectedEvaluatorScore: expectedEvaluatorScore || "READY",
  methodologyEnriched: !!(categoryCtx || industryCtx),
  generatedAt: new Date().toISOString(),
  metadata: {
    trickValidation: trickScore,
    persona: selectedPersona.id,
    personaName: selectedPersona.name,
    requiredFieldCount: fieldGroups.required.length,
    optionalFieldCount: fieldGroups.optional.length,
    deviationType,
  }
};
```

Key changes:
- `data` renamed to `fieldValues` — keys are the `block_id` values from `scenario_field_config`
- `testNotes` and `expectedEvaluatorScore` promoted to top-level
- `methodologyEnriched` boolean added (true when DB category/industry data was found)
- `generatedAt` ISO timestamp added
- Remaining diagnostic info stays in `metadata` to avoid breaking logging

### 2. Update client type in `src/lib/ai-test-data-generator.ts`

Update `AIGeneratedTestData` interface and the `generateAITestData` function to read `fieldValues` instead of `data` from the response, with backward compatibility fallback:
```typescript
const fieldValues = responseData.fieldValues || responseData.data || {};
```

## Deployment
- Deploy `generate-test-data` after changes

## Not Changed
- `parseGeneratedData` function — unchanged
- Block mapping logic (lines 783-794) — unchanged, already maps block1/2/3 to field IDs
- No UI, auth, or migration changes

