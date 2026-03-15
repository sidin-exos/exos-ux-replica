/**
 * Block Guidance Registry for Multi-Block Test Data Generation
 * 
 * Maps all 29 scenarios to per-field generation instructions,
 * quality tier behavioral prompts, and deviation type rules.
 * 
 * GDPR: All tiers enforce 100% synthetic data generation.
 */

// =============================================
// TYPES
// =============================================

export interface SubPrompt {
  label: string;
  isCritical?: boolean;
  dataType: string;
  realisticRange?: string;
}

export interface BlockGuidance {
  fieldId: string;
  label: string;
  guidance: string;
  subPrompts: SubPrompt[];
  isRequired: boolean;
  expectedDataType: 'narrative' | 'numeric' | 'structured' | 'document';
}

export type QualityTier = 'OPTIMAL' | 'MINIMUM' | 'DEGRADED' | 'GIBBERISH';

// =============================================
// GDPR GUARDRAIL (injected into every tier)
// =============================================

const GDPR_GUARDRAIL = `MANDATORY GDPR GUARDRAIL: ALL generated data must be 100% synthetic. No real EU citizen data, no real company names, no PII. Use fictional entity names with correct legal suffixes (GmbH, Ltd, S.A., B.V., S.r.l.). Use role-based references (e.g. 'Operations Lead', 'CPO') instead of personal names. Use Labour Rate Bands (A/B/C) instead of exact salaries. All financial figures must be fictional but realistic.`;

// =============================================
// QUALITY TIER INSTRUCTIONS
// =============================================

export const QUALITY_TIER_INSTRUCTIONS: Record<QualityTier, string> = {
  OPTIMAL: `DATA QUALITY TIER: OPTIMAL (Senior CPO Input)
${GDPR_GUARDRAIL}

INSTRUCTIONS:
- ALL blocks must be fully populated with specific, concrete values
- Every sub-prompt must be addressed with exact figures (not ranges)
- Use precise domain terminology and industry-specific KPIs
- Financial figures must be internally consistent (totals match line items)
- Include realistic EU regulatory references (GDPR, REACH, TUPE, IFRS 16)
- Block 1 (Context): 80-120 words, specific company profile with sector, size, geography
- Block 2 (Core Data): All sub-prompts filled with concrete EUR values and percentages
- Block 3 (Parameters): Detailed strategic context with measurable targets
- Expected Input Evaluator result: READY`,

  MINIMUM: `DATA QUALITY TIER: MINIMUM (Busy Buyer)
${GDPR_GUARDRAIL}

INSTRUCTIONS:
- Block 1 (Context): Brief, 30-40 words, mentions industry and category but lacks specifics
- Block 2 (Core Data): Minimum viable data — some sub-prompts filled with ranges instead of exact values, some left as "TBC" or "approximately"
- Block 3 (Parameters): Mostly empty or single-line responses
- Use casual language, abbreviations acceptable
- Some numbers given as ranges ("€40-60k") instead of exact values
- Missing some supporting details but core request is clear
- Expected Input Evaluator result: IMPROVABLE`,

  DEGRADED: `DATA QUALITY TIER: DEGRADED (Missing Critical Data)
${GDPR_GUARDRAIL}

INSTRUCTIONS:
- Block 1 (Context): Generic, 15-25 words, could apply to any industry
- Block 2 (Core Data): Qualitative descriptions only — NO specific numbers, percentages, or EUR values. Use phrases like "significant amount", "competitive rate", "industry standard"
- Block 3 (Parameters): Empty string ""
- For Type 1H scenarios: DELIBERATELY OMIT all fields marked as isCritical (e.g. WACC, tax rate, KPI percentages, legal entity specifics)
- Overall tone: vague, non-committal, uses filler phrases
- Expected Input Evaluator result: INSUFFICIENT`,

  GIBBERISH: `DATA QUALITY TIER: GIBBERISH (Invalid Input)
${GDPR_GUARDRAIL}

INSTRUCTIONS:
- Block 1 (Context): Random characters, keyboard mash, or completely irrelevant content (e.g. "asdf jkl; what is the weather in London?" or "hjkl 1234 test test")
- Block 2 (Core Data): Lorem ipsum, single repeated word, or copy-paste of unrelated text. May contain a real-looking number but in wrong context
- Block 3 (Parameters): Empty string ""
- The data should trigger UNIVERSAL_GIBBERISH detection in the Input Evaluator
- Do NOT make it subtly wrong — make it obviously garbage input
- Expected Input Evaluator result: INSUFFICIENT with gibberish flags`,
};

// =============================================
// DEVIATION TYPE RULES
// =============================================

export const DEVIATION_TYPE_RULES: Record<string, string> = {
  "0": `DEVIATION TYPE 0 — NARRATIVE INPUT
All blocks accept free-form narrative text. No structured sub-prompts required.
Generate natural-language descriptions appropriate to the persona.
Block lengths should feel organic — not every block needs equal weight.`,

  "1": `DEVIATION TYPE 1 — STRUCTURED WITH SUB-PROMPTS
Blocks contain structured sub-prompts (bullet points with specific data types).
Each sub-prompt should be addressed individually with the appropriate data type.
Numeric sub-prompts need specific values (not "see above" or "as discussed").
Text sub-prompts should be 1-3 sentences each.`,

  "1H": `DEVIATION TYPE 1H — HIGH-STAKES STRUCTURED
Same as Type 1, but contains CRITICAL fields marked with isCritical=true.
These fields (WACC, tax rate, KPI percentages, legal entity details) are essential for accurate financial modelling.
In OPTIMAL/MINIMUM tiers: these MUST be present with specific values.
In DEGRADED tier: these must be DELIBERATELY OMITTED to test the system's ability to detect missing critical inputs.`,

  "2": `DEVIATION TYPE 2 — DOCUMENT INPUT
At least one block expects a document-length input (SOW text, spend data table, licence agreement).
Document blocks should be 300-800 words of realistic synthetic content.
Spend data blocks should contain 10+ rows in tabular format.
SOW blocks should include numbered clauses, deliverables, and acceptance criteria.
Licence blocks should include metric definitions, true-up clauses, and pricing tiers.`,
};

// =============================================
// SCENARIO BLOCK GUIDANCE REGISTRY
// =============================================

export const SCENARIO_BLOCK_GUIDANCE: Record<string, BlockGuidance[]> = {
  // ===== 1. TCO ANALYSIS — TYPE 1 =====
  "tco-analysis": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Describe industry, organisation size, procurement category. Include regulatory/operational context. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "assetDefinition",
      label: "Asset or Service Definition",
      guidance: "Define the asset/service with lifecycle, volume, and CAPEX. All amounts in EUR.",
      subPrompts: [
        { label: "Asset or service name and description", dataType: "text" },
        { label: "Lifecycle duration (years)", dataType: "number", realisticRange: "3-15" },
        { label: "Annual volume or usage rate", dataType: "number", realisticRange: "100-100000" },
        { label: "Quoted CAPEX or contract value (€)", isCritical: true, dataType: "currency", realisticRange: "50000-5000000" },
        { label: "Primary vendor or supplier (anonymised)", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "opexFinancials",
      label: "OPEX & Financial Parameters",
      guidance: "OPEX breakdown by category and financial modelling inputs. All amounts in EUR.",
      subPrompts: [
        { label: "Maintenance annual cost (€)", dataType: "currency", realisticRange: "5000-500000" },
        { label: "Logistics annual cost (€)", dataType: "currency", realisticRange: "2000-200000" },
        { label: "Training annual cost (€)", dataType: "currency", realisticRange: "1000-50000" },
        { label: "Disposal cost (€)", dataType: "currency", realisticRange: "5000-100000" },
        { label: "WACC or internal discount rate (%)", isCritical: true, dataType: "percentage", realisticRange: "4-15" },
        { label: "Annual inflation assumption (%)", dataType: "percentage", realisticRange: "1-8" },
        { label: "Currency", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
  ],

  // ===== 2. COST BREAKDOWN — TYPE 1 =====
  "cost-breakdown": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, category, supplier geography, manufacturing/service delivery model. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "productSpecification",
      label: "Product or Service Specification",
      guidance: "Product description with material categories, weight/volume, manufacturing geography.",
      subPrompts: [
        { label: "Product/service name and description", dataType: "text" },
        { label: "Key material categories", dataType: "text" },
        { label: "Estimated weight or volume per unit", dataType: "text" },
        { label: "Manufacturing geography and labour intensity", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "supplierQuote",
      label: "Supplier Quote & Benchmark Reference",
      guidance: "Supplier pricing, target price, alternative quotes, estimated margin. All in EUR.",
      subPrompts: [
        { label: "Supplier's quoted price per unit (€)", isCritical: true, dataType: "currency", realisticRange: "10-50000" },
        { label: "Internal target price or budget (€)", dataType: "currency", realisticRange: "8-45000" },
        { label: "Alternative supplier quotes", dataType: "text" },
        { label: "Estimated supplier margin (%)", dataType: "percentage", realisticRange: "5-40" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
  ],

  // ===== 3. CAPEX VS OPEX — TYPE 1H =====
  "capex-vs-opex": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, asset class, business driver for make/lease/buy decision. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "assetFinancials",
      label: "Asset Financial Parameters",
      guidance: "Purchase price, lease cost, lifespan, depreciation, maintenance, residual value. All in EUR.",
      subPrompts: [
        { label: "Asset description", dataType: "text" },
        { label: "Purchase price — CAPEX option (€)", isCritical: true, dataType: "currency", realisticRange: "50000-2000000" },
        { label: "Annual lease or subscription cost — OPEX option (€)", isCritical: true, dataType: "currency", realisticRange: "10000-500000" },
        { label: "Asset financial lifespan (years)", dataType: "number", realisticRange: "3-15" },
        { label: "Depreciation method", dataType: "text" },
        { label: "Estimated annual maintenance and insurance (€)", dataType: "currency", realisticRange: "5000-200000" },
        { label: "Estimated residual/salvage value at end of life (€)", dataType: "currency", realisticRange: "0-500000" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "financialContext",
      label: "Financial Context & Tax Inputs",
      guidance: "WACC, tax rate, IFRS 16, off-balance-sheet preference. Critical for NPV accuracy.",
      subPrompts: [
        { label: "WACC or internal hurdle rate (%)", isCritical: true, dataType: "percentage", realisticRange: "4-15" },
        { label: "Corporate tax rate (%)", isCritical: true, dataType: "percentage", realisticRange: "15-35" },
        { label: "IFRS 16 applicability", dataType: "text" },
        { label: "Off-balance-sheet preference", dataType: "text" },
        { label: "Currency", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
  ],

  // ===== 4. SAVINGS CALCULATION — TYPE 1 =====
  "savings-calculation": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Category, supplier context, procurement event that generated the saving. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "baselinePricing",
      label: "Baseline & New Pricing",
      guidance: "Baseline price, new price, volume, measurement period. All in EUR.",
      subPrompts: [
        { label: "Baseline price per unit (€)", isCritical: true, dataType: "currency", realisticRange: "5-10000" },
        { label: "New negotiated price per unit (€)", isCritical: true, dataType: "currency", realisticRange: "4-9000" },
        { label: "Annual volume or quantity", dataType: "number", realisticRange: "100-500000" },
        { label: "Total annual spend at baseline (€)", dataType: "currency", realisticRange: "10000-5000000" },
        { label: "Currency", dataType: "text" },
        { label: "Measurement period", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "savingsClassification",
      label: "Savings Classification & Adjustments",
      guidance: "Savings category, inflation adjustment, maverick exclusion, finance sign-off.",
      subPrompts: [
        { label: "Savings category (Hard/Soft/Cost Avoidance)", dataType: "text" },
        { label: "Inflation adjustment applied (yes/no, index used)", dataType: "text" },
        { label: "Maverick spend excluded from baseline (€)", dataType: "currency", realisticRange: "0-500000" },
        { label: "Finance sign-off required (yes/no)", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
  ],

  // ===== 5. SPEND ANALYSIS — TYPE 2 =====
  "spend-analysis-categorization": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, organisation size, scope of spend analysis. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "rawSpendData",
      label: "Spend Data Upload",
      guidance: "Generate a synthetic spend data table with 10-15 rows. Use tabular format with columns: Supplier, Description, Amount (€), Date. Use anonymised supplier names (Supplier_001 etc).",
      subPrompts: [
        { label: "Supplier Name (anonymised)", dataType: "text" },
        { label: "Spend Amount (€)", dataType: "currency", realisticRange: "500-500000" },
        { label: "Date (Quarter)", dataType: "text" },
        { label: "Line Item Description", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "document",
    },
    {
      fieldId: "classificationParameters",
      label: "Classification Parameters",
      guidance: "Preferred taxonomy, problem categories, target output.",
      subPrompts: [
        { label: "Preferred taxonomy (UNSPSC/eCl@ss/Custom)", dataType: "text" },
        { label: "Known high-maverick-spend areas", dataType: "text" },
        { label: "Cost-centre or department codes", dataType: "text" },
        { label: "Target output priority", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 6. FORECASTING & BUDGETING — TYPE 1 =====
  "forecasting-budgeting": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Category, planning cycle context, macro factors. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "historicalSpendData",
      label: "Historical Spend & Volume Drivers",
      guidance: "2+ years of spend history, volume drivers, planning horizon. All in EUR.",
      subPrompts: [
        { label: "Category and current annual spend (€)", isCritical: true, dataType: "currency", realisticRange: "100000-10000000" },
        { label: "Prior year spend (€)", dataType: "currency", realisticRange: "90000-9500000" },
        { label: "Year before that (€)", dataType: "currency", realisticRange: "80000-9000000" },
        { label: "Key volume drivers (2-3 factors)", dataType: "text" },
        { label: "Planning horizon (1 year / 3 year)", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "scenarioAssumptions",
      label: "Scenario Assumptions (Three-Case Model)",
      guidance: "Base/upside/downside assumptions, commodity indices, currency.",
      subPrompts: [
        { label: "Base case inflation and volume change (%)", dataType: "percentage", realisticRange: "1-8" },
        { label: "Upside scenario driver and % uplift", dataType: "text" },
        { label: "Downside scenario risk and % impact", dataType: "text" },
        { label: "Commodity or price index (CPI/PPI/steel/energy)", dataType: "text" },
        { label: "Currency", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 7. SAAS OPTIMIZATION — TYPE 1 =====
  "saas-optimization": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, organisation size, scope of SaaS audit. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "subscriptionDetails",
      label: "Current SaaS Portfolio",
      guidance: "Generate 5-8 SaaS tools in tabular format: Tool | Licences Purchased | Licences Active | Annual Cost (€) | Renewal Date | Use Case.",
      subPrompts: [
        { label: "Tool Name", dataType: "text" },
        { label: "Licences Purchased", dataType: "number", realisticRange: "5-500" },
        { label: "Licences Active", dataType: "number", realisticRange: "3-450" },
        { label: "Annual Cost (€)", dataType: "currency", realisticRange: "2000-200000" },
        { label: "Renewal Date", dataType: "text" },
        { label: "Primary Use Case", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "document",
    },
    {
      fieldId: "optimisationParameters",
      label: "Optimisation Parameters",
      guidance: "Overlap analysis, auto-renewal flags, utilisation rates, optimisation target.",
      subPrompts: [
        { label: "Known overlapping tools", dataType: "text" },
        { label: "Auto-renewal clauses to flag", dataType: "text" },
        { label: "Feature utilisation rates", dataType: "text" },
        { label: "Optimisation target", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 8. SPECIFICATION OPTIMIZER — TYPE 0 =====
  "specification-optimizer": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, product category, stakeholder driving current specification. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "specificationText",
      label: "Current Specification",
      guidance: "Describe current specification in plain language with material, tolerances, standards.",
      subPrompts: [
        { label: "Material or grade currently specified", dataType: "text" },
        { label: "Performance tolerance required", dataType: "text" },
        { label: "Applicable standards (ISO, EN, ASTM)", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "specContext",
      label: "Challenge Parameters & Constraints",
      guidance: "Why spec was set, target cost reduction, approval authority, alternatives.",
      subPrompts: [
        { label: "Reason specification was set", dataType: "text" },
        { label: "Target cost reduction (% or €)", dataType: "text" },
        { label: "Stakeholders who must approve changes", dataType: "text" },
        { label: "Known alternative materials or grades", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 9. RFP GENERATOR — TYPE 0 =====
  "rfp-generator": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, organisation type, category being sourced. 60-100 words.",
      subPrompts: [],
      isRequired: false,
      expectedDataType: "narrative",
    },
    {
      fieldId: "rawBrief",
      label: "Procurement Requirement",
      guidance: "Business problem, scope of supply, delivery timeline, volume parameters. 100-200 words.",
      subPrompts: [
        { label: "Business problem being solved", dataType: "text" },
        { label: "Scope of supply (goods/services/both)", dataType: "text" },
        { label: "Required delivery or go-live timeline", dataType: "text" },
        { label: "Volume or scale parameters", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "complianceEvaluation",
      label: "Compliance & Evaluation Criteria",
      guidance: "Regulatory standards, evaluation weighting, contract structure.",
      subPrompts: [
        { label: "Mandatory regulatory standards (GDPR/ISO/SOC2)", dataType: "text" },
        { label: "Evaluation weighting (Price %/Quality %/Sustainability %)", dataType: "text" },
        { label: "Preferred contract structure", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 10. SLA DEFINITION — TYPE 1 =====
  "sla-definition": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, service type, relationship context. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "serviceDescription",
      label: "Service Performance Requirements",
      guidance: "Core deliverables, uptime %, failure definition, response/resolution times.",
      subPrompts: [
        { label: "Core service deliverables", dataType: "text" },
        { label: "Uptime/availability requirement (%)", isCritical: true, dataType: "percentage", realisticRange: "95-99.99" },
        { label: "Critical failure definition (P1/SEV1)", dataType: "text" },
        { label: "Response time to critical failure (hours)", dataType: "number", realisticRange: "0.25-4" },
        { label: "Resolution time to critical failure (hours)", dataType: "number", realisticRange: "1-24" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "remedyStructure",
      label: "Remedy & Escalation Structure",
      guidance: "Penalty tiers, escalation path, reporting frequency, peak demand periods.",
      subPrompts: [
        { label: "Tier 1 breach threshold and credit %", dataType: "text" },
        { label: "Tier 2 breach threshold and credit %", dataType: "text" },
        { label: "Tier 3 breach = right to terminate", dataType: "text" },
        { label: "Escalation path (Level 1/2/3 roles)", dataType: "text" },
        { label: "Measurement and reporting frequency", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 11. TAIL SPEND — TYPE 0 =====
  "tail-spend-sourcing": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry and internal department or cost centre. 60-80 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "purchaseRequirement",
      label: "Purchase Requirement",
      guidance: "Item/service name, quantity, delivery date and location.",
      subPrompts: [
        { label: "Item or service name", dataType: "text" },
        { label: "Quantity required", dataType: "number", realisticRange: "1-1000" },
        { label: "Required delivery date", dataType: "text" },
        { label: "Delivery location", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "qualityParameters",
      label: "Quality & Commercial Parameters",
      guidance: "Quality standard, budget ceiling, acceptance criteria, preferred supplier type.",
      subPrompts: [
        { label: "Quality standard or specification", dataType: "text" },
        { label: "Budget ceiling or target unit price (€)", dataType: "currency", realisticRange: "50-10000" },
        { label: "Acceptance criteria", dataType: "text" },
        { label: "Preferred supplier characteristics", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 12. CONTRACT TEMPLATE — TYPE 0 =====
  "contract-template": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, jurisdiction, commercial relationship type. 60-80 words.",
      subPrompts: [],
      isRequired: false,
      expectedDataType: "narrative",
    },
    {
      fieldId: "contractBrief",
      label: "Agreement Structure & Core Commercial Terms",
      guidance: "Agreement type, payment terms, liability cap, key deliverables.",
      subPrompts: [
        { label: "Agreement type (Supply/Services/NDA/Framework/Software Licence)", dataType: "text" },
        { label: "Payment terms", dataType: "text" },
        { label: "Liability cap", dataType: "text" },
        { label: "Key deliverables or subject matter", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "regulatoryProvisions",
      label: "Regulatory & Special Provisions",
      guidance: "GDPR DPA, TUPE, IP ownership, dispute resolution, auto-renewal.",
      subPrompts: [
        { label: "Regulatory clauses required", dataType: "text" },
        { label: "IP ownership provisions", dataType: "text" },
        { label: "Dispute resolution mechanism", dataType: "text" },
        { label: "Auto-renewal and notice period", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 13. REQUIREMENTS GATHERING — TYPE 0 =====
  "requirements-gathering": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, department, business problem. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "stakeholderRequirements",
      label: "Stakeholder Requirements",
      guidance: "Raw stakeholder requirements in any format — wishlists, meeting notes, bullet points. 100-200 words.",
      subPrompts: [
        { label: "Functional requirements", dataType: "text" },
        { label: "Non-functional requirements", dataType: "text" },
        { label: "Stakeholder priorities", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "constraintsPriority",
      label: "Constraints & Priority Context",
      guidance: "Budget, timeline, technical limitations, must-haves vs nice-to-haves.",
      subPrompts: [
        { label: "Budget ceiling", dataType: "currency", realisticRange: "50000-5000000" },
        { label: "Delivery timeline", dataType: "text" },
        { label: "Technical platform limitations", dataType: "text" },
        { label: "Regulatory requirements", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 14. SUPPLIER REVIEW — TYPE 1H =====
  "supplier-review": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, category managed by supplier, relationship history. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "performanceMetrics",
      label: "Performance Metrics (Last 12 Months)",
      guidance: "Quantitative KPIs — on-time delivery, quality, invoice accuracy, satisfaction, spend.",
      subPrompts: [
        { label: "On-time delivery rate (%)", isCritical: true, dataType: "percentage", realisticRange: "70-99" },
        { label: "Quality reject/defect rate (%)", isCritical: true, dataType: "percentage", realisticRange: "0.1-15" },
        { label: "Invoice accuracy rate (%)", dataType: "percentage", realisticRange: "85-99" },
        { label: "SLA compliance rate (%)", dataType: "percentage", realisticRange: "80-99" },
        { label: "Overall stakeholder satisfaction (1-5)", dataType: "number", realisticRange: "1-5" },
        { label: "Annual spend with supplier (€)", dataType: "currency", realisticRange: "50000-5000000" },
        { label: "Review period", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "qualitativeAssessment",
      label: "Qualitative Assessment & Strategic Context",
      guidance: "Stakeholder feedback, trend direction, volume changes, strategic intent.",
      subPrompts: [
        { label: "Key qualitative feedback (2-3 observations)", dataType: "text" },
        { label: "Trend direction (improving/stable/declining)", dataType: "text" },
        { label: "Planned volume changes", dataType: "text" },
        { label: "Strategic intent (develop/maintain/exit)", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 15. PROCUREMENT PROJECT PLANNING — TYPE 0 =====
  "procurement-project-planning": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, category or project type, business driver. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "projectBrief",
      label: "Project Scope & Milestones",
      guidance: "Project objective, key milestones, duration per phase, deadlines.",
      subPrompts: [
        { label: "Project objective (one sentence)", dataType: "text" },
        { label: "Key milestones and estimated durations", dataType: "text" },
        { label: "Total available timeline", dataType: "text" },
        { label: "Hard deadline if applicable", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "stakeholderConstraints",
      label: "Stakeholders, Approvals & Constraints",
      guidance: "Stakeholder roles, approval authority, regulatory gates, resource constraints.",
      subPrompts: [
        { label: "Key stakeholder roles", dataType: "text" },
        { label: "Approval authority and delegation levels", dataType: "text" },
        { label: "Regulatory approval gates", dataType: "text" },
        { label: "Known resource constraints", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 16. SOW CRITIC — TYPE 2 =====
  "sow-critic": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, engagement type, strategic importance of contract. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "sowText",
      label: "Statement of Work Document",
      guidance: "Generate a synthetic SOW document of 400-600 words with numbered clauses, deliverables, milestones, acceptance criteria, and payment schedule.",
      subPrompts: [
        { label: "Scope of services", dataType: "text" },
        { label: "Deliverables list (numbered)", dataType: "text" },
        { label: "Acceptance criteria per deliverable", dataType: "text" },
        { label: "Payment schedule / milestones", dataType: "text" },
        { label: "Change request procedure", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "document",
    },
    {
      fieldId: "reviewScope",
      label: "Review Scope & Parameters",
      guidance: "Engagement type, regulatory framework, priority review areas, counterparty type.",
      subPrompts: [
        { label: "Engagement type (Fixed-price/T&M/Milestone)", dataType: "text" },
        { label: "Governing regulatory framework", dataType: "text" },
        { label: "Priority review areas", dataType: "text" },
        { label: "Counterparty type", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 17. RISK ASSESSMENT — TYPE 0 =====
  "risk-assessment": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, category/project being assessed, regulatory environment. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "riskEnvironment",
      label: "Risk Environment & Known Hazards",
      guidance: "Project context, operational hazards, supplier dependencies, regulatory requirements, historical incidents.",
      subPrompts: [
        { label: "Known operational hazards", dataType: "text" },
        { label: "Critical supplier dependencies", dataType: "text" },
        { label: "Regulatory requirements in scope", dataType: "text" },
        { label: "Historical incidents or near-misses", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "existingControls",
      label: "Existing Controls & Financial Exposure",
      guidance: "Controls in place, financial exposure, BCP status, interdependencies.",
      subPrompts: [
        { label: "Existing controls (insurance/BCP/dual-sourcing)", dataType: "text" },
        { label: "Max financial exposure (€ range)", dataType: "currency", realisticRange: "100000-10000000" },
        { label: "BCP status (in place/partial/none)", dataType: "text" },
        { label: "Interdependencies", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 18. RISK MATRIX — TYPE 1H =====
  "risk-matrix": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, scope of risk register, risk appetite statement. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "riskRegister",
      label: "Risk Register — Structured Input",
      guidance: "Generate 5-8 risks in tabular format: Risk Name | Category | Probability (H/M/L) | Impact (H/M/L) | Current Control | Risk Owner Role.",
      subPrompts: [
        { label: "Risk Name", dataType: "text" },
        { label: "Category (Operational/Financial/Compliance/Strategic/Reputational)", isCritical: true, dataType: "text" },
        { label: "Probability (H/M/L)", isCritical: true, dataType: "text" },
        { label: "Impact (H/M/L)", isCritical: true, dataType: "text" },
        { label: "Current Control in Place", dataType: "text" },
        { label: "Risk Owner Role", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "matrixParameters",
      label: "Matrix Parameters & Targets",
      guidance: "Risk appetite, residual targets, review frequency, escalation threshold.",
      subPrompts: [
        { label: "Risk appetite statement", dataType: "text" },
        { label: "Target residual risk level", dataType: "text" },
        { label: "Review frequency", dataType: "text" },
        { label: "Board escalation threshold", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 19. SOFTWARE LICENSING — TYPE 2 =====
  "software-licensing": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, vendor name or software category, audit trigger. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "licenceDocument",
      label: "Licence Agreement Document",
      guidance: "Generate a synthetic software licence agreement summary of 300-500 words with metric definitions, pricing tiers, true-up clause, escalation provisions, and termination terms.",
      subPrompts: [
        { label: "Licence metric definition (named user/concurrent/CPU)", dataType: "text" },
        { label: "Pricing tiers and thresholds", dataType: "text" },
        { label: "True-up clause and frequency", dataType: "text" },
        { label: "Annual price escalation mechanism", dataType: "text" },
        { label: "Termination provisions and notice period", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "document",
    },
    {
      fieldId: "usageContext",
      label: "Usage Context & Compliance Gap",
      guidance: "Current licence metric, internal measurement, discrepancy, true-up date.",
      subPrompts: [
        { label: "Current licenced metric as per contract", dataType: "text" },
        { label: "Internal measurement methodology", dataType: "text" },
        { label: "Discrepancy between contract and internal", dataType: "text" },
        { label: "True-up date or review period", dataType: "text" },
        { label: "Last true-up invoice amount (€)", dataType: "currency", realisticRange: "5000-500000" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 20. CATEGORY RISK EVALUATOR — TYPE 1 =====
  "category-risk-evaluator": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry and category being evaluated (direct or indirect). 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "categoryProfile",
      label: "Category Profile & Supply Concentration",
      guidance: "Annual spend, supplier count, concentration %, supply geographies, regulatory exposure.",
      subPrompts: [
        { label: "Category name and annual spend (€)", isCritical: true, dataType: "currency", realisticRange: "200000-20000000" },
        { label: "Number of active suppliers", dataType: "number", realisticRange: "2-50" },
        { label: "Top supplier % of total category spend", dataType: "percentage", realisticRange: "20-80" },
        { label: "Second supplier % of spend", dataType: "percentage", realisticRange: "5-40" },
        { label: "Key supply geographies", dataType: "text" },
        { label: "Regulatory exposure", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "riskIndicators",
      label: "Risk Indicators & Strategic Context",
      guidance: "Disruption history, bottlenecks, ESG targets, strategic importance, demand forecast.",
      subPrompts: [
        { label: "Historical disruption events", dataType: "text" },
        { label: "Known supply chain bottlenecks", dataType: "text" },
        { label: "Sustainability/ESG targets", dataType: "text" },
        { label: "Strategic importance (Business-Critical/Important/Routine)", dataType: "text" },
        { label: "3-year demand forecast", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 21. NEGOTIATION PREPARATION — TYPE 0 =====
  "negotiation-preparation": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, category, supplier relationship history, negotiation context. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "supplierProposal",
      label: "Supplier Proposal & Your Position",
      guidance: "Supplier's current proposal and your target outcome. 100-150 words.",
      subPrompts: [
        { label: "Supplier's commercial terms and price position", dataType: "text" },
        { label: "Your target price, terms, or structure", dataType: "text" },
        { label: "Internal mandate (who has approved what)", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "alternativesLeverage",
      label: "Alternatives & Leverage Factors",
      guidance: "BATNA, volume leverage, supplier vulnerability.",
      subPrompts: [
        { label: "Realistic BATNA description", dataType: "text" },
        { label: "Volume leverage and alternative suppliers", dataType: "text" },
        { label: "Known supplier position (margin/capacity/threats)", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "narrative",
    },
  ],

  // ===== 22. CATEGORY STRATEGY — TYPE 0 =====
  "category-strategy": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, category, current Kraljic position. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "categoryOverview",
      label: "Category Profile & Supply Market",
      guidance: "Annual spend, supplier landscape, market structure, relationship quality.",
      subPrompts: [
        { label: "Annual spend and 3-year trend", dataType: "text" },
        { label: "Number of qualified suppliers and market structure", dataType: "text" },
        { label: "Current supplier relationship quality", dataType: "text" },
        { label: "Known supply market risks and opportunities", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "strategicGoals",
      label: "Strategic Objectives & Business Alignment",
      guidance: "3-year demand changes, sustainability targets, regulatory horizon, success definition.",
      subPrompts: [
        { label: "3-year demand forecast for category", dataType: "text" },
        { label: "Sustainability/ESG targets", dataType: "text" },
        { label: "Regulatory changes on the horizon", dataType: "text" },
        { label: "Measurable success definition for 3 years", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 23. MAKE VS BUY — TYPE 1H =====
  "make-vs-buy": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, product/service/process under evaluation, reason for assessment. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "makeCosts",
      label: "Internal (Make) Cost & Capability",
      guidance: "Fully-loaded internal cost, capability assessment, IP risk, build timeline. All in EUR.",
      subPrompts: [
        { label: "Description of internal option", dataType: "text" },
        { label: "Total internal annual cost — fully loaded (€)", isCritical: true, dataType: "currency", realisticRange: "100000-5000000" },
        { label: "Internal capability assessment", dataType: "text" },
        { label: "IP and confidentiality risk if outsourced", dataType: "text" },
        { label: "Time to build internal capability", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "buyCosts",
      label: "External (Buy) Cost & Contract Risk",
      guidance: "Vendor quote, transition cost, capability, contract flexibility, exit risk. All in EUR.",
      subPrompts: [
        { label: "External vendor quote (€ per year or per unit)", isCritical: true, dataType: "currency", realisticRange: "80000-4000000" },
        { label: "One-time integration and transition cost (€)", dataType: "currency", realisticRange: "10000-500000" },
        { label: "Vendor capability and track record", dataType: "text" },
        { label: "Contract flexibility (month-to-month/locked-in)", dataType: "text" },
        { label: "Exit risk and switching cost estimate (€)", dataType: "currency", realisticRange: "20000-1000000" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
  ],

  // ===== 24. VOLUME CONSOLIDATION — TYPE 1 =====
  "volume-consolidation": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, category being consolidated, reason for fragmentation. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "consolidationScope",
      label: "Current Supplier Spend Distribution",
      guidance: "Generate 3-5 suppliers in tabular format: Supplier Reference | Annual Spend (€) | % of Category | Primary Geography | Contract Expiry.",
      subPrompts: [
        { label: "Supplier Reference (anonymised)", dataType: "text" },
        { label: "Annual Spend (€)", isCritical: true, dataType: "currency", realisticRange: "50000-5000000" },
        { label: "% of Category Total", dataType: "percentage", realisticRange: "5-60" },
        { label: "Primary Geography", dataType: "text" },
        { label: "Contract Expiry Date", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "document",
    },
    {
      fieldId: "consolidationParameters",
      label: "Consolidation Parameters & Risk Appetite",
      guidance: "Target ratio, max concentration, capacity constraints, logistics cost, timeline.",
      subPrompts: [
        { label: "Target consolidation ratio", dataType: "text" },
        { label: "Maximum single-supplier concentration (%)", dataType: "percentage", realisticRange: "50-100" },
        { label: "Supplier capacity constraints by geography", dataType: "text" },
        { label: "Logistics cost differential between suppliers", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 25. SUPPLIER DEPENDENCY PLANNER — TYPE 0 =====
  "supplier-dependency-planner": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry, system/contract/relationship assessed, strategic driver. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "dependencyProfile",
      label: "Dependency Profile",
      guidance: "Key systems/contracts with lock-in risk, integration depth, termination provisions.",
      subPrompts: [
        { label: "Nature of integration or dependency", dataType: "text" },
        { label: "Contract termination provisions and notice period", dataType: "text" },
        { label: "Data or operational assets held by supplier", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "exitParameters",
      label: "Exit & De-risking Parameters",
      guidance: "Data portability, alternatives, switching cost, regulatory constraints.",
      subPrompts: [
        { label: "Data export capabilities", dataType: "text" },
        { label: "Realistic replacement options", dataType: "text" },
        { label: "Estimated switching cost (€)", dataType: "currency", realisticRange: "50000-2000000" },
        { label: "Regulatory data retention requirements", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 26. DISRUPTION MANAGEMENT — TYPE 0 =====
  "disruption-management": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry and category affected. Brief if live crisis. 40-80 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "crisisDefinition",
      label: "Crisis Definition",
      guidance: "What has happened, cause, affected categories, geographic scope, severity.",
      subPrompts: [
        { label: "Disruption description", dataType: "text" },
        { label: "Cause (supplier failure/port closure/geopolitical/cyberattack)", dataType: "text" },
        { label: "Affected product lines or categories", dataType: "text" },
        { label: "Geographic scope", dataType: "text" },
        { label: "Current severity (confirmed/high-probability/early signal)", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "resourceConstraints",
      label: "Resource & Constraint Status",
      guidance: "Inventory buffer, alternative suppliers, customer commitments at risk, financial reserves.",
      subPrompts: [
        { label: "Current inventory buffer (weeks)", dataType: "number", realisticRange: "0-12" },
        { label: "Alternative suppliers identified (yes/no)", dataType: "text" },
        { label: "Customer commitments at risk", dataType: "text" },
        { label: "Financial reserve for emergency sourcing (€ range)", dataType: "currency", realisticRange: "50000-2000000" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 27. BLACK SWAN SCENARIO — TYPE 1 =====
  "black-swan-scenario": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry and scope of supply chain stress-test. 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "supplyChainTopology",
      label: "Supply Chain Topology & Scenario",
      guidance: "Core nodes to stress-test, scenario type, severity, trigger event.",
      subPrompts: [
        { label: "Core supply chain nodes (anonymised)", dataType: "text" },
        { label: "Scenario type (Pandemic/Natural disaster/Embargo/Cyberattack/Financial collapse)", dataType: "text" },
        { label: "Scenario severity (Regional/National/Continental/Global)", dataType: "text" },
        { label: "Specific trigger event", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "resilienceParameters",
      label: "Resilience Parameters & Recovery Targets",
      guidance: "RTO, RPO, financial buffer, BCP status, insurance coverage.",
      subPrompts: [
        { label: "RTO — Recovery Time Objective", dataType: "text" },
        { label: "RPO — Recovery Point Objective", dataType: "text" },
        { label: "Financial liquidity buffer (weeks of OPEX)", dataType: "number", realisticRange: "2-24" },
        { label: "BCP status (none/partial/full)", dataType: "text" },
        { label: "Insurance coverage by risk type", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 28. MARKET SNAPSHOT — TYPE 0 =====
  "market-snapshot": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry and procurement context for market research. 60-80 words.",
      subPrompts: [],
      isRequired: false,
      expectedDataType: "narrative",
    },
    {
      fieldId: "marketBrief",
      label: "Market Intelligence Brief",
      guidance: "Specific market niche, geography, technology/material, time horizon. Be precise.",
      subPrompts: [
        { label: "Specific market niche description", dataType: "text" },
        { label: "Target geographic market", dataType: "text" },
        { label: "Technology, material, or service type", dataType: "text" },
        { label: "Time horizon (current/12-month/3-year)", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "intelligencePriorities",
      label: "Intelligence Priorities",
      guidance: "Top 3 intelligence signals relevant to decision.",
      subPrompts: [
        { label: "Priority 1 intelligence signal", dataType: "text" },
        { label: "Priority 2 intelligence signal", dataType: "text" },
        { label: "Priority 3 intelligence signal", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],

  // ===== 29. PRE-FLIGHT AUDIT — TYPE 1H =====
  "pre-flight-audit": [
    {
      fieldId: "industryContext",
      label: "Industry & Business Context",
      guidance: "Industry and purpose of due diligence (pre-qualification, renewal risk review). 80-120 words.",
      subPrompts: [],
      isRequired: true,
      expectedDataType: "narrative",
    },
    {
      fieldId: "supplierIdentity",
      label: "Supplier Identity & Scope",
      guidance: "Exact legal entity name, jurisdiction, category of supply, engagement value.",
      subPrompts: [
        { label: "Registered legal entity name (fictional, with correct suffix)", isCritical: true, dataType: "text" },
        { label: "Country of incorporation", dataType: "text" },
        { label: "Category of supply", dataType: "text" },
        { label: "Estimated engagement value (€)", dataType: "currency", realisticRange: "100000-10000000" },
        { label: "Website URL (fictional)", dataType: "text" },
      ],
      isRequired: true,
      expectedDataType: "structured",
    },
    {
      fieldId: "researchPriorities",
      label: "Research Priorities & Decision Context",
      guidance: "Due diligence priorities, decision timeline, risk tolerance.",
      subPrompts: [
        { label: "Priority research areas (financial health/litigation/sanctions/ESG)", dataType: "text" },
        { label: "Decision deadline", dataType: "text" },
        { label: "Risk tolerance (conservative/moderate/aggressive)", dataType: "text" },
        { label: "Known red flags or concerns", dataType: "text" },
      ],
      isRequired: false,
      expectedDataType: "structured",
    },
  ],
};

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Map UI dataQuality values to QualityTier
 */
export function mapDataQualityToTier(dataQuality: string): QualityTier {
  switch (dataQuality) {
    case 'excellent':
    case 'good':
      return 'OPTIMAL';
    case 'partial':
      return 'MINIMUM';
    case 'poor':
      return 'DEGRADED';
    default:
      return 'OPTIMAL';
  }
}

/**
 * Get the deviation type for a scenario from the guidance registry
 */
export function getDeviationType(scenarioId: string): string {
  // Map scenario IDs to their deviation types
  const deviationMap: Record<string, string> = {
    "tco-analysis": "1",
    "cost-breakdown": "1",
    "capex-vs-opex": "1H",
    "savings-calculation": "1",
    "spend-analysis-categorization": "2",
    "forecasting-budgeting": "1",
    "saas-optimization": "1",
    "specification-optimizer": "0",
    "rfp-generator": "0",
    "sla-definition": "1",
    "tail-spend-sourcing": "0",
    "contract-template": "0",
    "requirements-gathering": "0",
    "supplier-review": "1H",
    "procurement-project-planning": "0",
    "sow-critic": "2",
    "risk-assessment": "0",
    "risk-matrix": "1H",
    "software-licensing": "2",
    "category-risk-evaluator": "1",
    "negotiation-preparation": "0",
    "category-strategy": "0",
    "make-vs-buy": "1H",
    "volume-consolidation": "1",
    "supplier-dependency-planner": "0",
    "disruption-management": "0",
    "black-swan-scenario": "1",
    "market-snapshot": "0",
    "pre-flight-audit": "1H",
  };
  return deviationMap[scenarioId] || "0";
}

/**
 * Build per-block generation instructions from guidance registry
 */
export function buildBlockInstructions(
  scenarioId: string,
  qualityTier: QualityTier
): string {
  const blocks = SCENARIO_BLOCK_GUIDANCE[scenarioId];
  if (!blocks || blocks.length === 0) {
    return "Generate realistic content for all fields.";
  }

  const deviationType = getDeviationType(scenarioId);
  const isDegraded = qualityTier === 'DEGRADED';
  const is1H = deviationType === '1H';

  let instructions = `\nBLOCK-BY-BLOCK GENERATION INSTRUCTIONS:\n`;

  blocks.forEach((block, idx) => {
    instructions += `\n--- BLOCK ${idx + 1}: "${block.label}" (field: "${block.fieldId}") ---\n`;
    instructions += `Data Type: ${block.expectedDataType}\n`;
    instructions += `Required: ${block.isRequired ? 'YES' : 'NO'}\n`;
    instructions += `Guidance: ${block.guidance}\n`;

    if (block.subPrompts.length > 0) {
      instructions += `Sub-prompts to address:\n`;
      block.subPrompts.forEach(sp => {
        const criticalNote = sp.isCritical ? ' [CRITICAL]' : '';
        const rangeNote = sp.realisticRange ? ` (realistic range: ${sp.realisticRange})` : '';

        if (isDegraded && is1H && sp.isCritical) {
          instructions += `  • ${sp.label}${criticalNote}: DELIBERATELY OMIT THIS FIELD\n`;
        } else {
          instructions += `  • ${sp.label}${criticalNote} [${sp.dataType}]${rangeNote}\n`;
        }
      });
    }
  });

  instructions += `\n${DEVIATION_TYPE_RULES[deviationType] || DEVIATION_TYPE_RULES["0"]}\n`;
  instructions += `\n${QUALITY_TIER_INSTRUCTIONS[qualityTier]}\n`;

  return instructions;
}
