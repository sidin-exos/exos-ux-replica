-- Add realistic_range to sub_prompts JSONB in scenario_field_config
-- Source: block-guidance.ts SubPrompt.realisticRange values
-- These ranges guide AI test data generation with realistic value boundaries.

WITH range_data (scenario_slug, block_id, label, realistic_range) AS (VALUES
  -- tco-analysis
  ('tco-analysis'::text, 'assetDefinition'::text, 'Lifecycle duration (years)'::text, '3-15'::text),
  ('tco-analysis', 'assetDefinition', 'Annual volume or usage rate', '100-100000'),
  ('tco-analysis', 'assetDefinition', 'Quoted CAPEX or contract value (€)', '50000-5000000'),
  ('tco-analysis', 'opexFinancials', 'Maintenance annual cost (€)', '5000-500000'),
  ('tco-analysis', 'opexFinancials', 'Logistics annual cost (€)', '2000-200000'),
  ('tco-analysis', 'opexFinancials', 'Training annual cost (€)', '1000-50000'),
  ('tco-analysis', 'opexFinancials', 'Disposal cost (€)', '5000-100000'),
  ('tco-analysis', 'opexFinancials', 'WACC or internal discount rate (%)', '4-15'),
  ('tco-analysis', 'opexFinancials', 'Annual inflation assumption (%)', '1-8'),

  -- cost-breakdown
  ('cost-breakdown', 'supplierQuote', 'Supplier''s quoted price per unit (€)', '10-50000'),
  ('cost-breakdown', 'supplierQuote', 'Internal target price or budget (€)', '8-45000'),
  ('cost-breakdown', 'supplierQuote', 'Estimated supplier margin (%)', '5-40'),

  -- capex-vs-opex
  ('capex-vs-opex', 'assetFinancials', 'Purchase price — CAPEX option (€)', '50000-2000000'),
  ('capex-vs-opex', 'assetFinancials', 'Annual lease or subscription cost — OPEX option (€)', '10000-500000'),
  ('capex-vs-opex', 'assetFinancials', 'Asset financial lifespan (years)', '3-15'),
  ('capex-vs-opex', 'assetFinancials', 'Estimated annual maintenance and insurance (€)', '5000-200000'),
  ('capex-vs-opex', 'assetFinancials', 'Estimated residual/salvage value at end of life (€)', '0-500000'),
  ('capex-vs-opex', 'financialContext', 'WACC or internal hurdle rate (%)', '4-15'),
  ('capex-vs-opex', 'financialContext', 'Corporate tax rate (%)', '15-35'),

  -- savings-calculation
  ('savings-calculation', 'baselinePricing', 'Baseline price per unit (€)', '5-10000'),
  ('savings-calculation', 'baselinePricing', 'New negotiated price per unit (€)', '4-9000'),
  ('savings-calculation', 'baselinePricing', 'Annual volume or quantity', '100-500000'),
  ('savings-calculation', 'baselinePricing', 'Total annual spend at baseline (€)', '10000-5000000'),
  ('savings-calculation', 'savingsClassification', 'Maverick spend excluded from baseline (€)', '0-500000'),

  -- spend-analysis-categorization
  ('spend-analysis-categorization', 'rawSpendData', 'Spend Amount (€)', '500-500000'),

  -- forecasting-budgeting
  ('forecasting-budgeting', 'historicalSpendData', 'Category and current annual spend (€)', '100000-10000000'),
  ('forecasting-budgeting', 'historicalSpendData', 'Prior year spend (€)', '90000-9500000'),
  ('forecasting-budgeting', 'historicalSpendData', 'Year before that (€)', '80000-9000000'),
  ('forecasting-budgeting', 'scenarioAssumptions', 'Base case inflation and volume change (%)', '1-8'),

  -- saas-optimization
  ('saas-optimization', 'subscriptionDetails', 'Licences Purchased', '5-500'),
  ('saas-optimization', 'subscriptionDetails', 'Licences Active', '3-450'),
  ('saas-optimization', 'subscriptionDetails', 'Annual Cost (€)', '2000-200000'),

  -- sla-definition
  ('sla-definition', 'serviceDescription', 'Uptime/availability requirement (%)', '95-99.99'),
  ('sla-definition', 'serviceDescription', 'Response time to critical failure (hours)', '0.25-4'),
  ('sla-definition', 'serviceDescription', 'Resolution time to critical failure (hours)', '1-24'),

  -- tail-spend-sourcing
  ('tail-spend-sourcing', 'purchaseRequirement', 'Quantity required', '1-1000'),
  ('tail-spend-sourcing', 'qualityParameters', 'Budget ceiling or target unit price (€)', '50-10000'),

  -- requirements-gathering
  ('requirements-gathering', 'constraintsPriority', 'Budget ceiling', '50000-5000000'),

  -- supplier-review
  ('supplier-review', 'performanceMetrics', 'On-time delivery rate (%)', '70-99'),
  ('supplier-review', 'performanceMetrics', 'Quality reject/defect rate (%)', '0.1-15'),
  ('supplier-review', 'performanceMetrics', 'Invoice accuracy rate (%)', '85-99'),
  ('supplier-review', 'performanceMetrics', 'SLA compliance rate (%)', '80-99'),
  ('supplier-review', 'performanceMetrics', 'Overall stakeholder satisfaction (1-5)', '1-5'),
  ('supplier-review', 'performanceMetrics', 'Annual spend with supplier (€)', '50000-5000000'),

  -- risk-assessment
  ('risk-assessment', 'existingControls', 'Max financial exposure (€ range)', '100000-10000000'),

  -- software-licensing
  ('software-licensing', 'usageContext', 'Last true-up invoice amount (€)', '5000-500000'),

  -- category-risk-evaluator
  ('category-risk-evaluator', 'categoryProfile', 'Category name and annual spend (€)', '200000-20000000'),
  ('category-risk-evaluator', 'categoryProfile', 'Number of active suppliers', '2-50'),
  ('category-risk-evaluator', 'categoryProfile', 'Top supplier % of total category spend', '20-80'),
  ('category-risk-evaluator', 'categoryProfile', 'Second supplier % of spend', '5-40'),

  -- make-vs-buy
  ('make-vs-buy', 'makeCosts', 'Total internal annual cost — fully loaded (€)', '100000-5000000'),
  ('make-vs-buy', 'buyCosts', 'External vendor quote (€ per year or per unit)', '80000-4000000'),
  ('make-vs-buy', 'buyCosts', 'One-time integration and transition cost (€)', '10000-500000'),
  ('make-vs-buy', 'buyCosts', 'Exit risk and switching cost estimate (€)', '20000-1000000'),

  -- volume-consolidation
  ('volume-consolidation', 'consolidationScope', 'Annual Spend (€)', '50000-5000000'),
  ('volume-consolidation', 'consolidationParameters', 'Maximum single-supplier concentration (%)', '50-100'),

  -- supplier-dependency-planner
  ('supplier-dependency-planner', 'exitParameters', 'Estimated switching cost (€)', '50000-2000000'),

  -- disruption-management
  ('disruption-management', 'resourceConstraints', 'Current inventory buffer (weeks)', '0-12'),
  ('disruption-management', 'resourceConstraints', 'Financial reserve for emergency sourcing (€ range)', '50000-2000000'),

  -- black-swan-scenario
  ('black-swan-scenario', 'resilienceParameters', 'Financial liquidity buffer (weeks of OPEX)', '2-24'),

  -- pre-flight-audit
  ('pre-flight-audit', 'supplierIdentity', 'Estimated engagement value (€)', '100000-10000000')
)
UPDATE scenario_field_config sfc
SET sub_prompts = (
  SELECT jsonb_agg(
    CASE
      WHEN rd.realistic_range IS NOT NULL
      THEN elem || jsonb_build_object('realistic_range', rd.realistic_range)
      ELSE elem
    END
    ORDER BY ordinality
  )
  FROM jsonb_array_elements(sfc.sub_prompts) WITH ORDINALITY AS t(elem, ordinality)
  LEFT JOIN range_data rd
    ON rd.scenario_slug = sfc.scenario_slug
    AND rd.block_id = sfc.block_id
    AND rd.label = elem->>'label'
)
WHERE sfc.sub_prompts IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM range_data rd2
    WHERE rd2.scenario_slug = sfc.scenario_slug
    AND rd2.block_id = sfc.block_id
  );
