

# Refactor `tco-analysis` Scenario -- Massive Form Simplification

## Summary
Replace 22 hyper-specific fields (currency, select, percentage types) with 3 universal textareas (CAPEX, OPEX, Risks) while keeping 3 core fields (`industryContext`, `assetDescription`, `ownershipPeriod`). This eliminates UX friction where 80%+ of fields are irrelevant depending on context (e.g., `dataPortability` for hardware, `energyConsumption` for software).

## Changes

### 1. Update Scenario Schema (`src/lib/scenarios.ts`, lines 254-290)

**Remove (22 fields):** All fields between `industryContext`/`assetDescription`/`ownershipPeriod` and the end of `requiredFields`, including `mainFocus`, all currency fields (`purchasePrice`, `installationCost`, `trainingCost`, `integrationCost`, `annualMaintenance`, `energyConsumption`, `consumablesCost`, `laborCost`, `insuranceCost`, `residualValue`, `decommissioningCost`, `dataMigrationCost`, `downtimeCostPerHour`), all select fields (`vendorLockInRisk`, `alternativeSuppliers`, `dataPortability`, `technologyObsolescence`, `marketPriceTrend`, `regulatoryChanges`, `currencyExposure`, `downtimeRisk`), and all percentage fields (`proprietaryComponents`, `inflationAssumption`, `interestRate`).

**Keep (3 fields):**
- `industryContext` (textarea, required)
- `assetDescription` (text, required)
- `ownershipPeriod` (number, required)

**Add (3 new fields):**
1. `capexBreakdown` -- textarea, required. Label: "Upfront Costs (CAPEX)"
2. `opexBreakdown` -- textarea, required. Label: "Recurring/Operating Costs (OPEX)"
3. `riskFactors` -- textarea, optional. Label: "Risks, Downtime & End-of-Life Costs"

**Final field order (6 fields):**
1. `industryContext`
2. `assetDescription`
3. `ownershipPeriod`
4. `capexBreakdown` (NEW, required)
5. `opexBreakdown` (NEW, required)
6. `riskFactors` (NEW, optional)

### 2. Update Test Data Factory (`src/lib/test-data-factory.ts`, lines 190-224)

Replace the entire generator block. Remove all 22 deleted field generators and add `randomChoice` arrays for the 3 new fields covering machinery, software, fleet, and warehouse contexts:

- `capexBreakdown`: 4 realistic CAPEX breakdowns (e.g., "Purchase price: $1.2M. Installation & commissioning: $85k. Initial training for 12 operators: $25k...")
- `opexBreakdown`: 4 realistic OPEX breakdowns (e.g., "Annual maintenance contract: $45k/yr. Energy consumption: ~$1.8k/mo. Consumables and spare parts: $12k/yr...")
- `riskFactors`: 4 risk/end-of-life descriptions (e.g., "High vendor lock-in -- proprietary tooling with no third-party alternatives. Downtime costs approximately $8k/hr...")

All values are plain strings.

### Files Modified
- `src/lib/scenarios.ts` -- tco-analysis field definitions (lines 254-290)
- `src/lib/test-data-factory.ts` -- tco-analysis test data generator (lines 190-224)

### No Database or Edge Function Changes
All changes are frontend-only schema definitions and test data generators.

