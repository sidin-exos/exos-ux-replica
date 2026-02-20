

# Refactor `make-vs-buy` Scenario -- Fix HR Bias

## Summary
Replace 5 hardcoded HR/outsourcing fields and `mainFocus` with 4 universal textareas that work for any Make vs. Buy dilemma (software, manufacturing, equipment, services). Keep `industryContext` and remove all `currency`/`number`/`select` fields that forced an HR-only framing.

## Changes

### 1. Update Scenario Schema (`src/lib/scenarios.ts`, lines 77-90)

**Remove (6 fields):**
- `MAIN_FOCUS_FIELD` (line 79)
- `internalSalary` (line 80)
- `recruitingCost` (line 81)
- `managementTime` (line 82)
- `agencyFee` (line 84)
- `officeItPerHead` (line 83) -- also HR-biased, not listed in task but should go
- `agencyOnboardingSpeed` (line 85)
- `knowledgeRetentionRisk` (line 86)
- `qualityBenchmark` (line 87)
- `peakLoadCapacity` (line 88)
- `strategicImportance` (line 89)

Effectively: remove ALL fields except `industryContext`.

**Keep:**
- `industryContext` (textarea, required)

**Add (4 new fields):**
1. `projectBrief` -- textarea, required. Label: "The Dilemma (Project Brief)"
2. `makeCosts` -- textarea, optional. Label: "Estimated Internal Costs (Make)"
3. `buyCosts` -- textarea, optional. Label: "Estimated External Costs (Buy)"
4. `strategicFactors` -- textarea, optional. Label: "Strategic Factors & Constraints"

**Final field order (5 fields):**
1. `industryContext`
2. `projectBrief` (required)
3. `makeCosts`
4. `buyCosts`
5. `strategicFactors`

### 2. Update Test Data Factory (`src/lib/test-data-factory.ts`, lines 59-71)

**Replace entire generator** with `randomChoice` arrays covering Software, Manufacturing, and Services contexts:

- `projectBrief`: 4 diverse dilemmas (build CRM vs buy Salesforce, manufacture in-house vs outsource to Asia, build internal logistics vs use 3PL, develop custom ERP module vs license SAP add-on)
- `makeCosts`: 4 realistic internal cost breakdowns
- `buyCosts`: 4 realistic vendor/external cost breakdowns
- `strategicFactors`: 4 strategic constraint descriptions

All values are plain strings -- no arrays, objects, or select types.

### Files Modified
- `src/lib/scenarios.ts` -- make-vs-buy field definitions
- `src/lib/test-data-factory.ts` -- make-vs-buy test data generator

### No Database or Edge Function Changes
All changes are frontend-only schema definitions and test data generators.
