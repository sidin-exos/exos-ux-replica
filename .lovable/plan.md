

## Plan: Sync test-data-factory.ts Field IDs with Restructured Scenarios

The test-data-factory generators use old field IDs that no longer match the restructured scenarios in `scenarios.ts`. This will cause generated test data to fail to populate forms correctly.

### File: `src/lib/test-data-factory.ts`

#### Per-Scenario Field ID Remapping

| # | Scenario | Old Field IDs → New Field IDs |
|---|----------|-------------------------------|
| 1 | `tco-analysis` | `assetDescription` → `assetDefinition`, `ownershipPeriod` → remove (merged into assetDefinition), `capexBreakdown` → remove (merged into assetDefinition), `opexBreakdown` → `opexFinancials`, `riskFactors` → remove (merged into opexFinancials) |
| 2 | `cost-breakdown` | `productDescription` → `productSpecification`, `costComponents` → `supplierQuote` (if present, merge content) |
| 3 | `capex-vs-opex` | `assetDetails` → `assetFinancials`, `lifecycleCosts` → remove (merge into assetFinancials), `financialParameters` → `financialContext` |
| 4 | `savings-calculation` | `savingsScenario` → `baselinePricing`, `costAdjustments` → `savingsClassification`, `reportingRequirements` → remove (merge into savingsClassification) |
| 5 | `spend-analysis-categorization` | `rawSpendData` stays, add `classificationParameters`, remove `timeframe`/`businessGoal` (merge into classificationParameters) |
| 6 | `forecasting-budgeting` | `categoryContext` → remove, `historicalSpendData` stays, `knownFutureEvents` → merge into `scenarioAssumptions`, `budgetConstraints`/`forecastHorizon` → merge into scenarioAssumptions |
| 7 | `saas-optimization` | `subscriptionDetails` stays, `usageMetrics` → merge into subscriptionDetails, `redundancyContext` → `optimisationParameters` |
| 8 | `specification-optimizer` | `specificationText` stays, `specContext` stays, `optimizationGoals` → remove (merge into specContext) |
| 9 | `rfp-generator` | `rawBrief` stays, `budgetRange`/`evaluationPriorities`/`technicalRequirements`/`incumbentData`/`additionalInstructions` → merge into `complianceEvaluation` |
| 10 | `sla-definition` | `serviceDescription` stays, `performanceTargets` → merge into serviceDescription, `escalationAndPenalties` → `remedyStructure` |
| 11 | `tail-spend-sourcing` | `purchaseAmount`/`urgency`/`alternativesExist`/`vendorHistory`/`technicalSpecs` → consolidate into `purchaseRequirement` + `qualityParameters` |
| 12 | `contract-template` | `country` stays, `timeTier` stays, `contractBrief` stays, `contractType` stays, `contractValue`/`specialRequirements` → merge into contractBrief |
| 13 | `requirements-gathering` | `businessGoal` → `requirementBrief`, `technicalLandscape` → `technicalLandscape` (stays), `featureRequirements` → `constraintsSuccess` |
| 14 | `project-planning` | `projectBrief` stays as `projectBrief`, `constraintsAndResources` stays, `risksAndSuccess` stays |
| 15 | `supplier-review` | `qualityScore`/`onTimeDelivery`/`communicationScore`/`priceVsMarket`/`spendVolume`/`contractStatus`/`incidentLog` → consolidate into `supplierPerformance` + `contractSituation` |
| 16 | `risk-assessment` | `assessmentSubject` → merge into industryContext, `currentSituation` → `riskLandscape`, `contractContext`/`riskTolerance` → `mitigationContext` |
| 17 | `disruption-management` | `crisisDescription` → `crisisDefinition`, `impactAssessment` → merge into crisisDefinition, `alternativesContext` → `resourceConstraints` |
| 18 | `risk-matrix` | `supplierName`/`operationalRisks`/`commercialRisks` → `riskRegister` + `matrixParameters` |
| 19 | `software-licensing` | `softwareDetails`/`userMetrics`/`commercialTerms`/`strategicFactors` → `licenceDocument` + `usageContext` |
| 20 | `category-risk-evaluator` | `categoryAndTender`/`sowAndMarket`/`historicalRisks` → `categoryProfile` + `riskIndicators` |
| 21 | `negotiation-preparation` | `negotiationSubject`/`currentSpend`/`supplierName`/`relationshipHistory`/`batna`/`negotiationObjectives`/`mustHaves`/`timeline`/`spendBreakdown`/`leverageContext` → `supplierProposal` + `alternativesLeverage` |
| 22 | `category-strategy` | `categoryOverview` stays, `marketDynamics` → merge into categoryOverview, `strategicGoals` stays |
| 23 | `make-vs-buy` | `projectBrief` → merge into industryContext, `makeCosts` stays, `buyCosts` stays, `strategicFactors` → merge into makeCosts/buyCosts |
| 24 | `volume-consolidation` | `consolidationScope` stays, `logisticsTerms`/`growthForecast` → `consolidationParameters` |
| 25 | `supplier-dependency-planner` | `dependencyContext` → `dependencyProfile`, `lockInFactors` → merge into dependencyProfile, `diversificationGoals` → `exitParameters` |
| 26 | `sow-critic` | `sowText` → `sowDocument`, `reviewPriorities` → `reviewParameters` |
| 27 | `black-swan-scenario` | `assessmentScope` → `supplyChainTopology`, `riskPosture`/`scenarioSimulation` → merge into `supplyChainTopology` + `resilienceParameters` |
| 28 | `market-snapshot` | `region` stays, `analysisScope` → `marketBrief`, `successCriteria` → `intelligencePriorities`, `timeframe` stays |
| 29 | `pre-flight-audit` | `supplierIdentity` → `supplierLegalIdentity`, `researchScope`/`decisionContext` → `auditScope` |

#### Approach
For each generator, restructure the returned object to output exactly the field IDs defined in `scenarios.ts`. Existing realistic content will be preserved but reorganized — multi-field content merged into the correct 3-block structure using newline concatenation where appropriate. No new content generation needed; this is purely a structural sync.

### What Stays Untouched
- `industryContext` field — universal Block 1, unchanged across all generators
- `getRandomIndustryContext()` and all utility functions
- `generateTestData()` and `getSupportedScenarios()` exports
- `scenarios.ts` — no changes

