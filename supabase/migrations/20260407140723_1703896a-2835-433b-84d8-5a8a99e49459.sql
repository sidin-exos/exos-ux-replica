ALTER TABLE public.scenario_field_config 
  ADD COLUMN sort_order smallint NOT NULL DEFAULT 0;

-- Block 1 is always industryContext
UPDATE public.scenario_field_config SET sort_order = 1 WHERE block_id = 'industryContext';

-- Block 2 assignments (the main data/context field for each scenario)
UPDATE public.scenario_field_config SET sort_order = 2 WHERE block_id IN (
  'supplyChainTopology',
  'financialContext',
  'categoryProfile',
  'categoryOverview',
  'contractBrief',
  'productSpecification',
  'crisisDefinition',
  'historicalSpendData',
  'makeCosts',
  'marketBrief',
  'supplierProposal',
  'supplierIdentity',
  'projectBrief',
  'stakeholderRequirements',
  'rawBrief',
  'riskEnvironment',
  'riskRegister',
  'subscriptionDetails',
  'baselinePricing',
  'serviceDescription',
  'licenceDocument',
  'sowText',
  'specificationText',
  'rawSpendData',
  'dependencyProfile',
  'performanceMetrics',
  'supplierData',
  'assetDefinition',
  'performanceHistory'
);

-- Block 3 assignments (parameters/evaluation/constraints field)
UPDATE public.scenario_field_config SET sort_order = 3 WHERE block_id IN (
  'resilienceParameters',
  'assetFinancials',
  'riskIndicators',
  'strategicGoals',
  'regulatoryProvisions',
  'supplierQuote',
  'resourceConstraints',
  'scenarioAssumptions',
  'buyCosts',
  'intelligencePriorities',
  'alternativesLeverage',
  'researchPriorities',
  'stakeholderConstraints',
  'constraintsPriority',
  'complianceEvaluation',
  'existingControls',
  'matrixParameters',
  'optimisationParameters',
  'savingsClassification',
  'remedyStructure',
  'usageContext',
  'reviewScope',
  'specContext',
  'classificationParameters',
  'exitParameters',
  'scorecardDefinition',
  'vendorRequirements',
  'opexFinancials',
  'improvementGoals'
);

-- Safety net: any remaining rows get sort_order 2
UPDATE public.scenario_field_config SET sort_order = 2 WHERE sort_order = 0 AND block_id != 'industryContext';