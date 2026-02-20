

# Refactor `supplier-review` Scenario (AI Audit Results)

## Summary
Apply the AI Auditor's findings to the `supplier-review` scenario: remove 5 low-value rating fields that create friction, keep the 7 core performance fields, and add 2 new contextual fields for contract lifecycle and incident details.

## Changes

### 1. Update Scenario Schema (`src/lib/scenarios.ts`)

**Remove these 5 fields** from the `requiredFields` array:
- `socialResponsibility` (line 180)
- `financialStability` (line 179)
- `innovationScore` (line 178)
- `crisisSupport` (line 182)
- `incidentCount` (line 176)

**Keep these 7 fields** (unchanged):
- `industryContext` (required textarea)
- `mainFocus` (MAIN_FOCUS_FIELD constant)
- `qualityScore` (required number)
- `onTimeDelivery` (required percentage)
- `communicationScore` (optional number)
- `priceVsMarket` (optional select)
- `spendVolume` (required currency)

**Add 2 new fields** after the core fields:

- `contractStatus` -- text, optional. Label: "Contract Status & Expiration". Placeholder: "E.g., Expires in 3 months, Auto-renews next year..."
- `incidentLog` -- textarea, optional. Label: "Critical Incidents & Performance Issues". Placeholder: "Describe specific failures, downtime events, or SLA breaches..."

### 2. Update Test Data Factory (`src/lib/test-data-factory.ts`)

- Remove generators for 5 deleted fields (`socialResponsibility`, `financialStability`, `innovationScore`, `crisisSupport`, `incidentCount`).
- Add `randomChoice` arrays for `contractStatus` (e.g., "Expires Q3 2026", "Auto-renews in 6 months") and `incidentLog` (e.g., short failure descriptions, empty strings for "clean" suppliers).

### Field Diff Summary

```text
BEFORE (12 fields)                 AFTER (9 fields)
---------------------              ---------------------
industryContext  [KEEP]            industryContext
mainFocus        [KEEP]            mainFocus
qualityScore     [KEEP]            qualityScore
onTimeDelivery   [KEEP]            onTimeDelivery
incidentCount    [REMOVE]          communicationScore
communicationScore [KEEP]          priceVsMarket
innovationScore  [REMOVE]          spendVolume
financialStability [REMOVE]        contractStatus     [NEW]
socialResponsibility [REMOVE]      incidentLog        [NEW]
priceVsMarket    [KEEP]
crisisSupport    [REMOVE]
spendVolume      [KEEP]
```

### Files Modified
- `src/lib/scenarios.ts` -- scenario field definitions
- `src/lib/test-data-factory.ts` -- test data generator

### No Database Changes
All changes are frontend-only schema definitions and test data generators. No migration needed.
