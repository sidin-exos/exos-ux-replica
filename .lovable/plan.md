

# Plan: Stricter Input Evaluation Metrics

## Current State (too lenient)

| Metric | Current | Problem |
|--------|---------|---------|
| Score penalties | CRITICAL -15, WARNING -5, INFO -1 | Users reach READY with multiple warnings |
| READY threshold | ≥ 75 | Too easy to hit |
| IMPROVABLE threshold | ≥ 40 | Weak data still scores IMPROVABLE |
| minWords (most blocks) | 15-30 | Allows 2-sentence inputs |
| Gibberish ratio | < 0.4 triggers WARNING | Too tolerant |
| Group A missing numbers | WARNING | Should be CRITICAL for numeric blocks |
| Group C no regulatory ref | INFO | Should be WARNING for compliance scenarios |
| Group D no alternatives | INFO | Should be WARNING for strategic scenarios |

## Proposed Changes

### 1. Scoring penalties (`index.ts` — `calculateScore`)
- CRITICAL: **-15 → -25**
- WARNING: **-5 → -10**
- INFO: **-1 → -3**

### 2. Status thresholds (`index.ts` — `deriveStatus`)
- READY: **≥ 75 → ≥ 85**
- IMPROVABLE: **≥ 40 → ≥ 55**
- INSUFFICIENT: **< 40 → < 55**

### 3. Confidence threshold (`index.ts` — `deriveConfidence`)
- LOW: **score < 50 → score < 65**

### 4. Raise minWords across all configs (`configs.ts`)
- Block 1 (industryContext): **15-20 → 30** (all scenarios)
- Block 2 (primary data): **30-40 → 50-60** (Groups A-D)
- Block 3 (parameters): **15-20 → 25** (where required)
- SOW/contract document blocks: **100 → 200**
- Type 2 tabular blocks: **30 → 50**

### 5. Upgrade severity levels (`group-checks.ts`)
- Group A: `GROUPA_CURRENCY_CONSISTENCY` **INFO → WARNING**, `GROUPA_TIMEFRAME_PRESENT` **INFO → WARNING**
- Group B: `GROUPB_STAKEHOLDER_REFERENCE` **INFO → WARNING**
- Group C: `GROUPC_REGULATORY_REFERENCE` **INFO → WARNING**
- Group D: `GROUPD_STRATEGIC_SPECIFICITY` **INFO → WARNING**, `GROUPD_ALTERNATIVES_PRESENT` **INFO → WARNING**, `GROUPD_TEMPORAL_HORIZON` **INFO → WARNING**

### 6. Stricter universal checks (`universal-checks.ts`)
- Gibberish known-word ratio: **< 0.4 → < 0.5** for WARNING
- Add new check: required blocks with `expectedDataType: "numeric"` that contain zero numbers → CRITICAL
- Boilerplate identical text: **WARNING → CRITICAL**

### 7. Stricter scenario checks (`scenario-checks.ts`)
- S3 tax rate missing: **WARNING → CRITICAL**
- S14 satisfaction missing: **WARNING → CRITICAL**
- S5 tabular missing: **WARNING → CRITICAL**
- S16 SOW short threshold: **< 100 words → < 200 words**

## Files Modified
- `src/lib/input-evaluator/index.ts` — scoring penalties, thresholds
- `src/lib/input-evaluator/configs.ts` — minWords increases
- `src/lib/input-evaluator/universal-checks.ts` — gibberish threshold, numeric block check, boilerplate severity
- `src/lib/input-evaluator/group-checks.ts` — severity upgrades
- `src/lib/input-evaluator/scenario-checks.ts` — severity upgrades

No UI changes, no DB changes.

