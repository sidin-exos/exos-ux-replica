

## ✅ COMPLETED: Test Data Generator — Full Field Coverage + Buyer Personas

**Deployed**: 2026-02-17

### What was done
1. Migrated `SCENARIO_SCHEMAS` from `Record<string, string[]>` to `Record<string, { required: string[]; optional: string[] }>`
2. Fixed `negotiation-prep` → `negotiation-preparation` ID mismatch (SCENARIO_SCHEMAS, TRICK_LIBRARY, HIGH_FRICTION_SCENARIOS)
3. Added 5 missing scenarios: `pre-flight-audit`, `category-risk-evaluator`, `supplier-dependency-planner`, `specification-optimizer`, `black-swan-scenario`
4. Updated 18 existing scenarios with ~90 missing fields
5. Added 4 Buyer Personas with `selectPersona()` random selection
6. Updated `handleGenerateMode`, `handleMessyMode`, full mode, and `buildGenerationPrompt` with persona + required/optional prompt injection
7. Added persona metadata to all response objects

### Impact
| Metric | Before | After |
|--------|--------|-------|
| Scenarios | 24 (1 wrong ID) | 29 (all correct) |
| Total fields | ~200 | ~350 |
| Required/optional split | None | Full |
| Buyer personas | 0 | 4 |
