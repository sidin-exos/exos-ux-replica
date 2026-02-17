

## Field Requirement Reduction — Implementation Plan

### Summary
Single file change: `src/lib/scenarios.ts`. Change `required: true` to `required: false` for ~124 fields across 24 scenarios. Three CEO-overridden fields remain mandatory per your corrections.

### CEO Overrides (fields that STAY `required: true`)
1. **TCO Analysis** `annualMaintenance` (line 280) -- maintenance often exceeds purchase price
2. **Software Licensing** `contractLength` (line 344) -- fundamental baseline for SaaS optimization
3. **Savings Calculation** `contractTerm` (line 576) -- savings meaningless without temporal scope

### Changes by Scenario (field ID -> `required: false`)

**1. Make vs Buy** (lines 78-89) — 10 req -> 4 req
- `recruitingCost` (line 81)
- `managementTime` (line 82)
- `officeItPerHead` (line 83)
- `agencyOnboardingSpeed` (line 85)
- `knowledgeRetentionRisk` (line 86)
- `strategicImportance` (line 89)

**2. Cost Breakdown** (lines 102-116) — 8 req -> 5 req
- `materialCost` (line 107)
- `laborCost` (line 108)
- `overheadCost` (line 109)

**3. Spend Analysis** (lines 128-133) — 4 req -> 3 req
- `timeframe` (line 132)

**4. Tail Spend** (lines 151-163) — 6 req -> 4 req
- `catalogAvailable` (line 156)
- `paymentTerms` (line 158)
- `approvalRequired` (line 163)

**5. Supplier Review** (lines 176-188) — 8 req -> 5 req
- `incidentCount` (line 181)
- `communicationScore` (line 182)
- `financialStability` (line 184)
- `priceVsMarket` (line 186)

**6. Disruption Management** (lines 201-213) — 8 req -> 5 req
- `altSuppliers` (line 206)
- `altProducts` (line 207)
- `switchingTime` (line 209)

**7. Risk Assessment** (lines 226-248) — 13 req -> 5 req
- `marketVolatility` (line 232)
- `regulatoryExposure` (line 233)
- `geopoliticalRisk` (line 234)
- `contractType` (line 237)
- `liabilityProtection` (line 238)
- `terminationRights` (line 239)
- `currentChallenges` (line 242)
- `supplierFinancialHealth` (line 243)
- `recoveryTime` (line 248)

**8. TCO Analysis** (lines 269-304) — 17 req -> 6 req (annualMaintenance stays required per CEO override)
- `installationCost` (line 276)
- `energyConsumption` (line 281)
- `vendorLockInRisk` (line 286)
- `proprietaryComponents` (line 287)
- `alternativeSuppliers` (line 288)
- `technologyObsolescence` (line 291)
- `marketPriceTrend` (line 292)
- `inflationAssumption` (line 295)
- `interestRate` (line 297)
- `residualValue` (line 299)
- `downtimeRisk` (line 303)
- `downtimeCostPerHour` (line 304)

**9. Software Licensing** (lines 326-359) — 18 req -> 7 req (contractLength stays required per CEO override)
- `powerUsers` (line 333)
- `regularUsers` (line 334)
- `occasionalUsers` (line 335)
- `implementationCost` (line 343)
- `longTermDiscount` (line 345)
- `annualEscalation` (line 346)
- `terminationClause` (line 348)
- `dataExportability` (line 350)
- `integrationDependency` (line 351)
- `switchingCostEstimate` (line 352)
- `alternativeProducts` (line 353)
- `vendorStability` (line 356)

**10. Risk Matrix** (lines 381-393) — 9 req -> 3 req
- `legalStatus` (line 384)
- `lawsuits` (line 385)
- `financialHealth` (line 387)
- `concentration` (line 388)
- `sanctionsRisk` (line 390)
- `cyberSecurity` (line 391)

**11. SOW Critic** (lines 408-420) — 7 req -> 3 req
- `deliverables` (line 412)
- `acceptanceCriteria` (line 413)
- `timeline` (line 414)
- `responsibilities` (line 415)
- `changeProcess` (line 418)

**12. SLA Definition** (lines 433-444) — 8 req -> 5 req
- `resolutionTime` (line 438)
- `allowedDowntime` (line 439)
- `escalationProcess` (line 442)

**13. Requirements Gathering** (lines 488-500) — 7 req -> 4 req
- `budget` (line 492)
- `userCount` (line 493)
- `dataSecurityLevel` (line 495)
- `urgency` (line 496)

**14. Volume Consolidation** (lines 515-527) — 7 req -> 3 req
- `skuOverlap` (line 519)
- `unitOfMeasure` (line 520)
- `paymentTerms` (line 522)
- `orderFrequency` (line 523)
- `reliabilityIndex` (line 524)

**15. Capex vs Opex** (lines 540-552) — 8 req -> 5 req
- `maintenanceCost` (line 546)
- `residualValue` (line 547)
- `wacc` (line 549)

**16. Savings Calculation** (lines 565-577) — 7 req -> 6 req (contractTerm stays required per CEO override)
- `inflationIndex` (line 571)

**17. SaaS Optimization** (lines 590-602) — 9 req -> 5 req
- `lastLoginDate` (line 595)
- `featureUsage` (line 596)
- `noticePeriod` (line 598)
- `autoRenewal` (line 599)

**18. Category Strategy** (lines 640-655) — 10 req -> 5 req
- `supplierCount` (line 645)
- `marketStructure` (line 646)
- `supplyRisk` (line 647)
- `businessImpact` (line 648)
- `currentStrategy` (line 649)
- `contractStatus` (line 652)

**19. Negotiation Preparation** (lines 676-693) — 12 req -> 7 req
- `relationshipHistory` (line 682)
- `buyingPower` (line 683)
- `marketAlternatives` (line 684)
- `switchingCost` (line 685)
- `mustHaves` (line 690)
- `timeline` (line 693)

**20. Procurement Project Planning** (lines 715-730) — 10 req -> 5 req
- `keyInputs` (line 721)
- `expectedOutputs` (line 722)
- `budgetConstraint` (line 723)
- `timelineConstraint` (line 724)
- `resourceConstraint` (line 725)
- `successCriteria` (line 728)

**21. Pre-flight Audit** (lines 744-754) — 7 req -> 4 req
- `plannedPurchase` (line 749)
- `existingRelationship` (line 751)
- `researchFocus` (line 752)

**22. Category Risk Evaluator** (lines 773-791) — 11 req -> 5 req
- `contractType` (line 780)
- `marketConcentration` (line 783)
- `marketTrends` (line 784)
- `priceVolatility` (line 785)
- `supplyRisk` (line 786)
- `regulatoryExposure` (line 788)
- `substitutability` (line 790)

**23. Supplier Dependency Planner** (lines 813-837) — 15 req -> 7 req
- `categoryTotalSpend` (line 819)
- `spendConcentration` (line 821)
- `revenueShare` (line 822)
- `uniqueCapabilities` (line 824)
- `contractTerms` (line 826)
- `dataPortability` (line 828)
- `integrationDepth` (line 829)
- `knowledgeDependency` (line 830)
- `alternativeSuppliers` (line 832)
- `switchingTimeEstimate` (line 833)

**24. Specification Optimizer** (lines 860-872) — 8 req -> 5 req
- `estimatedValue` (line 865)
- `specSource` (line 866)
- `competitiveMarket` (line 868)

**25. Black Swan Scenario** (lines 893-915) — 12 req -> 6 req
- `businessImpact` (line 899)
- `singleSourceItems` (line 901)
- `geographicConcentration` (line 902)
- `tierVisibility` (line 903)
- `inventoryBuffer` (line 904)
- `alternativesReady` (line 909)
- `responsePlaybook` (line 910)
- `acceptableDowntime` (line 914)

**26. Market Snapshot** (lines 939-949) — 3 req -> 2 req
- `timeframe` (line 949)

**No changes to:** Predictive Budgeting (already lean), RFP Generator (already lean), Contract Template Generator (already well-structured)

### Impact
- Total required fields: ~255 -> ~131 (49% reduction)
- Avg required per scenario: ~8.8 -> ~4.5
- Scenarios with 10+ required: 10 -> 0
- No DB migrations, no structural changes
- `DataRequirementsAlert` and `GenericScenarioWizard` already handle this correctly

### Risk Mitigation
Shadow logging pipeline (just deployed) monitors `missing_context` and `friction_score` to validate these changes with real data.

