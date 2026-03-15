/**
 * INPUT_EVALUATOR — Scenario evaluation configs
 * Constraint #4: Exported as Record<string, ScenarioEvalConfig> for future lazy-load splitting.
 */

import { ScenarioEvalConfig } from "./types";

/**
 * All 29 scenario configurations keyed by scenario string ID.
 * Each config maps to group, deviation type, block definitions, and financial impact text.
 */
export const SCENARIO_EVAL_CONFIGS: Record<string, ScenarioEvalConfig> = {
  // ═══ GROUP A — ANALYTICAL VALUE (S1–S8) ═══

  "tco-analysis": {
    scenarioId: "tco-analysis",
    group: "A",
    deviationType: 1,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "assetDefinition", label: "Asset or Service Definition", minWords: 50, expectedDataType: "mixed", required: true, expectedKeywords: ["asset", "lifecycle", "volume", "capex", "vendor"] },
      { fieldId: "opexFinancials", label: "OPEX & Financial Parameters", minWords: 50, expectedDataType: "numeric", required: true, expectedKeywords: ["wacc", "maintenance", "inflation", "currency"] },
    ],
    scenarioChecks: [],
    financialImpactGap: "Without lifecycle context, TCO models under-represent total cost by 30–60%.",
    gdprGuardrail: "Anonymise exact salary bands and internal cost-centre codes.",
  },

  "cost-breakdown": {
    scenarioId: "cost-breakdown",
    group: "A",
    deviationType: 1,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "productSpecification", label: "Product or Service Specification", minWords: 50, expectedDataType: "mixed", required: true, expectedKeywords: ["material", "weight", "manufacturing", "labour"] },
      { fieldId: "supplierQuote", label: "Supplier Quote & Benchmark", minWords: 30, expectedDataType: "numeric", required: true, expectedKeywords: ["price", "quote", "target", "margin"] },
    ],
    scenarioChecks: [],
    financialImpactGap: "Should-Cost modelling yields 8–14% additional price reduction — but only with material/labour splits.",
    gdprGuardrail: "Remove patent-pending formulations and proprietary engineering drawings.",
  },

  "capex-vs-opex": {
    scenarioId: "capex-vs-opex",
    group: "A",
    deviationType: "1H",
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "assetFinancials", label: "Asset Financial Parameters", minWords: 60, expectedDataType: "numeric", required: true, expectedKeywords: ["purchase", "lease", "lifespan", "depreciation", "maintenance", "residual"] },
      { fieldId: "financialContext", label: "Financial Context & Tax Inputs", minWords: 30, expectedDataType: "numeric", required: true, expectedKeywords: ["wacc", "tax", "ifrs", "currency"] },
    ],
    scenarioChecks: [],
    financialImpactGap: "A 5% WACC miscalculation on a €500k asset over 5 years = €25k+ misallocated capital.",
    gdprGuardrail: "Do not include internal hurdle rates that constitute commercially sensitive information.",
  },

  "savings-calculation": {
    scenarioId: "savings-calculation",
    group: "A",
    deviationType: 1,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "baselinePricing", label: "Baseline & New Pricing", minWords: 50, expectedDataType: "numeric", required: true, expectedKeywords: ["baseline", "price", "volume", "spend"] },
      { fieldId: "savingsClassification", label: "Savings Classification", minWords: 25, expectedDataType: "mixed", required: true, expectedKeywords: ["hard", "soft", "avoidance", "inflation"] },
    ],
    scenarioChecks: [],
    financialImpactGap: "~40% of reported savings are rejected by Finance due to categorisation errors.",
  },

  "spend-analysis-categorization": {
    scenarioId: "spend-analysis-categorization",
    group: "A",
    deviationType: 2,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "rawSpendData", label: "Spend Data", minWords: 50, expectedDataType: "tabular", required: true },
      { fieldId: "classificationParameters", label: "Classification Parameters", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "Unclassified tail spend hides 20–30% of addressable spend.",
    gdprGuardrail: "Replace supplier legal names with tokens (Supplier_001) before upload. Remove employee names from POs.",
  },

  "forecasting-budgeting": {
    scenarioId: "forecasting-budgeting",
    group: "A",
    deviationType: 1,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "historicalSpendData", label: "Historical Spend & Volume Drivers", minWords: 50, expectedDataType: "numeric", required: true, expectedKeywords: ["spend", "prior", "volume", "planning"] },
      { fieldId: "scenarioAssumptions", label: "Scenario Assumptions", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "A 5% CPI under-assumption on a €2M category = €100k unplanned spend.",
    gdprGuardrail: "Mask unreleased product launch dates and unannounced market expansion plans.",
  },

  "saas-optimization": {
    scenarioId: "saas-optimization",
    group: "A",
    deviationType: 1,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "subscriptionDetails", label: "Current SaaS Portfolio", minWords: 50, expectedDataType: "tabular", required: true },
      { fieldId: "optimisationParameters", label: "Optimisation Parameters", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "Average enterprise wastes 25% of SaaS spend on unused licences.",
    gdprGuardrail: "Do not include SSO architecture details or user-level activity logs.",
  },

  "specification-optimizer": {
    scenarioId: "specification-optimizer",
    group: "A",
    deviationType: 0,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "specificationText", label: "Current Specification", minWords: 50, expectedDataType: "narrative", required: true, expectedKeywords: ["material", "tolerance", "standard", "grade"] },
      { fieldId: "specContext", label: "Challenge Parameters", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "Over-specification is the single largest avoidable cost driver: 15–25% cost premium.",
  },

  // ═══ GROUP B — WORKFLOW & CONVENIENCE (S9–S15) ═══

  "rfp-generator": {
    scenarioId: "rfp-generator",
    group: "B",
    deviationType: 0,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: false },
      { fieldId: "rawBrief", label: "Procurement Requirement", minWords: 60, expectedDataType: "narrative", required: true },
      { fieldId: "complianceEvaluation", label: "Compliance & Evaluation Criteria", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "A reissued RFP delays award by 3–6 weeks.",
  },

  "sla-definition": {
    scenarioId: "sla-definition",
    group: "B",
    deviationType: 1,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "serviceDeliverables", label: "Service Deliverables & Uptime", minWords: 50, expectedDataType: "mixed", required: true, expectedKeywords: ["uptime", "delivery", "response", "availability"] },
      { fieldId: "escalationPenalties", label: "Escalation & Penalty Framework", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "An SLA without financial penalties is legally unenforceable.",
  },

  "contract-review": {
    scenarioId: "contract-review",
    group: "B",
    deviationType: 2,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "contractText", label: "Contract Text", minWords: 60, expectedDataType: "narrative", required: true },
      { fieldId: "reviewParameters", label: "Review Parameters", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "3.1% of annual contract value lost through commercial clause oversights.",
  },

  "negotiation-prep": {
    scenarioId: "negotiation-prep",
    group: "B",
    deviationType: 1,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "negotiationScope", label: "Negotiation Scope & Objectives", minWords: 50, expectedDataType: "mixed", required: true, expectedKeywords: ["target", "objective", "leverage", "position"] },
      { fieldId: "counterpartyProfile", label: "Counterparty Profile & BATNA", minWords: 25, expectedDataType: "narrative", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "70% of negotiations with structured prep outperform unstructured ones on final price.",
  },

  "business-requirements": {
    scenarioId: "business-requirements",
    group: "B",
    deviationType: 0,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "stakeholderRequirements", label: "Stakeholder Requirements", minWords: 60, expectedDataType: "narrative", required: true },
      { fieldId: "constraintsPriority", label: "Constraints & Priority Context", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    commonFailureMode: "Over-curated input. Include everything — even messy notes.",
  },

  "supplier-review": {
    scenarioId: "supplier-review",
    group: "B",
    deviationType: "1H",
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "performanceMetrics", label: "Performance Metrics", minWords: 50, expectedDataType: "numeric", required: true, expectedKeywords: ["delivery", "quality", "reject", "invoice", "satisfaction"] },
      { fieldId: "qualitativeAssessment", label: "Qualitative Assessment", minWords: 25, expectedDataType: "narrative", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "Structured supplier performance programmes achieve 23% better on-time delivery.",
    gdprGuardrail: "Mask specific names of internal stakeholders — use role-based attribution.",
  },

  "procurement-project-planning": {
    scenarioId: "procurement-project-planning",
    group: "B",
    deviationType: 0,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "projectBrief", label: "Project Scope & Milestones", minWords: 50, expectedDataType: "mixed", required: true, expectedKeywords: ["milestone", "timeline", "phase", "deadline"] },
      { fieldId: "stakeholderConstraints", label: "Stakeholders & Constraints", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "A 2-week slip on a go-live supporting €1M/month revenue = €500k exposure.",
  },

  // ═══ GROUP C — RELIABILITY & COMPLIANCE (S16–S20) ═══

  "sow-critic": {
    scenarioId: "sow-critic",
    group: "C",
    deviationType: 2,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "sowText", label: "Statement of Work Document", minWords: 200, expectedDataType: "narrative", required: true },
      { fieldId: "reviewScope", label: "Review Scope & Parameters", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "Scope dispute resolution averages €30–80k per incident.",
  },

  "risk-assessment": {
    scenarioId: "risk-assessment",
    group: "C",
    deviationType: 0,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "riskEnvironment", label: "Risk Environment & Known Hazards", minWords: 50, expectedDataType: "narrative", required: true, expectedKeywords: ["risk", "hazard", "dependency", "regulatory"] },
      { fieldId: "existingControls", label: "Existing Controls & Exposure", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "An unmitigated GDPR breach costs €10–20M or 4% of global turnover.",
  },

  "risk-matrix": {
    scenarioId: "risk-matrix",
    group: "C",
    deviationType: "1H",
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "riskRegister", label: "Risk Register", minWords: 60, expectedDataType: "tabular", required: true },
      { fieldId: "controlOwnership", label: "Controls & Ownership", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "A risk matrix without user-provided probability and impact inputs produces no decision value.",
  },

  "compliance-checker": {
    scenarioId: "compliance-checker",
    group: "C",
    deviationType: 2,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "documentText", label: "Document for Compliance Check", minWords: 60, expectedDataType: "narrative", required: true },
      { fieldId: "complianceFramework", label: "Compliance Framework", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "A missed regulatory requirement in a €5M+ contract can result in complete contract termination.",
  },

  "sustainability-assessment": {
    scenarioId: "sustainability-assessment",
    group: "C",
    deviationType: 0,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "supplyChainProfile", label: "Supply Chain Profile", minWords: 50, expectedDataType: "mixed", required: true, expectedKeywords: ["supplier", "carbon", "esg", "sustainability", "emission"] },
      { fieldId: "complianceTargets", label: "Compliance Targets", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "CSRD non-compliance risk: financial penalties + reputational damage.",
  },

  // ═══ GROUP D — STRATEGIC (S21–S27) ═══

  "supplier-market-analysis": {
    scenarioId: "supplier-market-analysis",
    group: "D",
    deviationType: 0,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "marketScope", label: "Market Scope & Requirements", minWords: 50, expectedDataType: "narrative", required: true },
      { fieldId: "currentSupplierBase", label: "Current Supplier Base", minWords: 25, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
  },

  "category-strategy": {
    scenarioId: "category-strategy",
    group: "D",
    deviationType: 1,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 20, expectedDataType: "narrative", required: true },
      { fieldId: "categoryOverview", label: "Category Profile & Supply Market", minWords: 40, expectedDataType: "mixed", required: true, expectedKeywords: ["spend", "supplier", "market", "trend"] },
      { fieldId: "strategicGoals", label: "Strategic Objectives", minWords: 20, expectedDataType: "narrative", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "Active category strategies reduce category spend by 6–15% over 3 years.",
    gdprGuardrail: "Scrub M&A plans and structural reorganisation announcements.",
  },

  "make-vs-buy": {
    scenarioId: "make-vs-buy",
    group: "D",
    deviationType: "1H",
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 20, expectedDataType: "narrative", required: true },
      { fieldId: "makeCosts", label: "Internal (Make) Cost & Capability", minWords: 40, expectedDataType: "numeric", required: true, expectedKeywords: ["cost", "capability", "labour", "overhead", "ip"] },
      { fieldId: "buyCosts", label: "External (Buy) Cost & Contract Risk", minWords: 30, expectedDataType: "numeric", required: true, expectedKeywords: ["quote", "vendor", "contract", "exit", "switching"] },
    ],
    scenarioChecks: [],
    financialImpactGap: "Hidden internal costs are underestimated by 30-50% when overhead is excluded.",
  },

  "volume-consolidation": {
    scenarioId: "volume-consolidation",
    group: "D",
    deviationType: 1,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 20, expectedDataType: "narrative", required: true },
      { fieldId: "consolidationScope", label: "Current Supplier Spend Distribution", minWords: 30, expectedDataType: "tabular", required: true },
      { fieldId: "consolidationParameters", label: "Consolidation Parameters", minWords: 15, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "Dual-source 70/30 split achieves 90% of volume discount benefits with full supply continuity.",
  },

  "supplier-dependency-planner": {
    scenarioId: "supplier-dependency-planner",
    group: "D",
    deviationType: 0,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 20, expectedDataType: "narrative", required: true },
      { fieldId: "dependencyProfile", label: "Dependency Profile", minWords: 30, expectedDataType: "narrative", required: true },
      { fieldId: "exitParameters", label: "Exit & De-risking Parameters", minWords: 15, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "Enterprise switching costs average 18–24 months + 25–40% of original contract value.",
  },

  "disruption-management": {
    scenarioId: "disruption-management",
    group: "D",
    deviationType: 0,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 15, expectedDataType: "narrative", required: true },
      { fieldId: "crisisDefinition", label: "Crisis Definition", minWords: 30, expectedDataType: "narrative", required: true, expectedKeywords: ["disruption", "cause", "affected", "severity"] },
      { fieldId: "resourceConstraints", label: "Resource & Constraint Status", minWords: 15, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "Average supply chain disruption costs $184M when managed reactively.",
  },

  "black-swan-scenario": {
    scenarioId: "black-swan-scenario",
    group: "D",
    deviationType: 1,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 20, expectedDataType: "narrative", required: true },
      { fieldId: "supplierProfile", label: "Supplier/Category Profile", minWords: 30, expectedDataType: "mixed", required: true },
      { fieldId: "bcpStatus", label: "BCP Status & Response Readiness", minWords: 15, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
    financialImpactGap: "85% of Fortune 500 companies experienced a supply chain disruption in the past 3 years.",
  },

  // ═══ GROUP E — INTELLIGENCE (S28–S29) ═══

  "market-snapshot": {
    scenarioId: "market-snapshot",
    group: "E",
    deviationType: 0,
    blocks: [
      { fieldId: "region", label: "Region", minWords: 1, expectedDataType: "narrative", required: true },
      { fieldId: "analysisScope", label: "Analysis Scope", minWords: 10, expectedDataType: "narrative", required: true },
      { fieldId: "successCriteria", label: "Success Criteria", minWords: 5, expectedDataType: "narrative", required: false },
    ],
    scenarioChecks: [],
  },

  "market-research": {
    scenarioId: "market-research",
    group: "E",
    deviationType: 0,
    blocks: [
      { fieldId: "industryContext", label: "Industry & Business Context", minWords: 15, expectedDataType: "narrative", required: true },
      { fieldId: "researchQuery", label: "Research Query", minWords: 20, expectedDataType: "narrative", required: true },
      { fieldId: "researchParameters", label: "Research Parameters", minWords: 10, expectedDataType: "mixed", required: false },
    ],
    scenarioChecks: [],
  },
};
