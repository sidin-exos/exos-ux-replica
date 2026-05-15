## Goal

Two changes to the AI test-data engine:

1. **Replace "insufficient data" generation with "wrong data"** (irrelevant for the requested scenario), and significantly reduce its frequency.
2. **Remove the buyer persona parameter** entirely — industry/category fit and information quality matter more.

---

## What "wrong data" means

Generated data is **well-formed and realistic** (so the input evaluator and downstream pipeline both run normally), but the content describes a **different procurement category / scenario** than the one the user is testing. This exercises:

- Input evaluator's ability to flag off-topic input
- Sentinel orchestrator's behaviour when industry/category context contradicts the body text
- Whether category methodology grounding still produces a coherent (or correctly degraded) report

The previous "DEGRADED → INSUFFICIENT" tier (vague/missing values) gave little signal because the input evaluator simply rejected it before any meaningful pipeline behaviour could be observed.

---

## Frequency change

Current draft-mode weighted `dataQuality` distribution:

```text
excellent 40 | good 40 | partial 15 | poor 5     → 80% OPTIMAL, 15% MINIMUM, 5% DEGRADED
```

New distribution (significantly reduce the low-quality path, replace `poor` with `irrelevant`):

```text
excellent 45 | good 45 | partial 8 | irrelevant 2  → 90% OPTIMAL, 8% MINIMUM, 2% IRRELEVANT
```

The `GIBBERISH` tier and the `messy` mode handler are kept as-is (separate stress-test path triggered manually).

---

## Persona removal

Persona is dropped from:

- Edge function request body, draft output, generate-mode prompt, metadata
- `ai-test-data-generator.ts` client (no more `pickRotatedPersona`)
- `LaunchTestBatch` UI (persona `Select` removed)
- `TestPlanOrchestrator` plan items (persona dropped from rows)
- `test-rotation-memory.ts` (persona buffer removed)
- `BuyerPersona` type kept only where historical DB rows still reference it (read-only legacy)

Industry + category remain the primary diversity drivers.

---

## Files to change

```text
supabase/functions/generate-test-data/index.ts
supabase/functions/generate-test-data/block-guidance.ts
src/lib/ai-test-data-generator.ts
src/lib/test-rotation-memory.ts
src/lib/testing/types.ts
src/components/testing/LaunchTestBatch.tsx
src/components/testing/TestPlanOrchestrator.tsx
src/components/scenarios/DraftedParametersCard.tsx   (hide persona row)
src/lib/drafted-parameters.ts                         (mark persona deprecated, keep type)
```

---

## Technical detail

### `block-guidance.ts`

- Add new `QualityTier = 'IRRELEVANT'` alongside existing tiers.
- `IRRELEVANT` instructions: pick a category from a *different* procurement domain than the requested one and write Block 1–3 for that other category, but keep the response shape valid. No gibberish, no missing fields. Expected evaluator result: `IMPROVABLE` or `INSUFFICIENT` depending on category contradiction strength.
- Update `mapDataQualityToTier`: `poor` → `IRRELEVANT` (was `DEGRADED`). `DEGRADED` removed from the public mapping but kept in the `QualityTier` union for backwards compatibility with any historical logs.

### `generate-test-data/index.ts`

- `DataQuality` union: replace `'poor'` with `'irrelevant'`.
- `pickWeighted` distribution updated as above.
- Strip `persona` / `personaName` from `DraftedParameters`, request validation, draft-mode return, generate-mode prompt, generate-mode metadata, and full-mode metadata.
- `BUYER_PERSONAS`, `selectPersona`, `PERSONA_STYLE_INSTRUCTIONS` deleted.
- Generate-mode prompt: replace persona block with an explicit reminder that *industry relevance and information quality* drive the test, plus the tier instruction (OPTIMAL / MINIMUM / IRRELEVANT).
- Messy mode keeps its own internal "frustrated" tone in the system prompt directly (no `selectedPersona` argument required).

### `ai-test-data-generator.ts`

- Drop `pickRotatedPersona` and the `persona` arg from `generateAITestData` / `generateTestDataHybrid`.
- Drop `persona` from the edge function invoke body.

### Rotation memory

- Remove `persona` buffer from `ROTATION_BUFFER`; drop the `pickRotatedPersona` export. Pair + trick rotation kept.

### UI

- `LaunchTestBatch.tsx`: remove the "Buyer Persona" `Select` and the `persona` state. Keep entropy + industry + category.
- `TestPlanOrchestrator.tsx`: remove `PERSONAS` array, persona randomisation, and the `persona` field from generated `TestPlanItem`s. Plan rows still rotate industry+category and entropy.
- `DraftedParametersCard.tsx`: hide the persona row when no persona is present (the field becomes legacy/optional).

### Type compatibility

- `BuyerPersona` left in `testing/types.ts` so existing DB rows / saved logs still type-check, but new generations no longer write it.
- `TestPlanItem.persona` becomes optional.

---

## Out of scope

- Database schema (no migration; legacy `persona_source` columns untouched).
- Static `test-data-factory.ts` generator (unchanged — it never used persona).
- `messy` and `GIBBERISH` paths beyond removing the persona argument.
- Input evaluator and sentinel-analysis (no changes; they will simply see industry-mismatched content for the 2% IRRELEVANT cases).