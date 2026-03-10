import {
  Layers,
  Scale,
  ShoppingCart,
  ClipboardCheck,
  AlertTriangle,
  Shield,
  FileText,
  Clock,
  FileSpreadsheet,
  ListChecks,
  Building,
  Calculator,
  Cloud,
  Wallet,
  PieChart,
  Target,
  Handshake,
  FolderKanban,
  KeyRound,
  TrendingUp,
  LucideIcon,
  Radar,
  FileSearch,
  LogOut,
  Sparkles,
  Feather,
  Zap,
  ScrollText,
} from "lucide-react";

export interface ScenarioRequiredField {
  id: string;
  label: string;
  description: string;
  type: "text" | "number" | "percentage" | "select" | "currency" | "textarea";
  required: boolean;
  options?: string[]; // For select type
  placeholder?: string; // For textarea hints
}

// Legacy export kept for backward compatibility — no longer referenced by any scenario
export const MAIN_FOCUS_FIELD: ScenarioRequiredField = {
  id: "mainFocus",
  label: "Main Focus / Challenge",
  description: "What is your primary objective or challenge for this analysis?",
  type: "textarea",
  required: true,
  placeholder: "E.g., 'We need to reduce costs by 10% this year while maintaining quality. Management is pushing for quick wins. Our main concern is ensuring supply continuity during the transition...'"
};

export type StrategyPresetType = "riskAppetite" | "speedVsQuality" | "costVsRisk" | "skepticism";

export interface Scenario {
  id: string;
  title: string;
  description: string;
  previewDescription?: string;
  tags?: string[];
  icon: LucideIcon;
  status: "available" | "coming-soon";
  category: "analysis" | "planning" | "risk" | "documentation";
  requiredFields: ScenarioRequiredField[];
  outputs: string[];
  strategySelector?: StrategyPresetType;
  deviationType?: 0 | 1 | '1H' | 2;
  dataRequirements?: {
    title: string;
    sections: { heading: string; description: string }[];
  };
}

export const scenarios: Scenario[] = [
  // ═══════════════════════════════════════════════════════
  // GROUP A — ANALYTICAL VALUE
  // ═══════════════════════════════════════════════════════

  // ===== 1. TCO ANALYSIS — TYPE 1 =====
  {
    id: "tco-analysis",
    title: "Total Cost of Ownership",
    description: "Comprehensive lifecycle cost analysis for complex purchases including acquisition, operation, risks, and exit costs.",
    previewDescription: "Go beyond sticker price. This scenario builds a full lifecycle cost model — CAPEX, OPEX, maintenance, disposal, and hidden risks — then applies NPV discounting and sensitivity analysis to reveal which option truly costs less over 3–10 years. Ideal before any major asset purchase, outsourcing decision, or vendor renewal where long-term costs diverge from quoted prices.",
    icon: Calculator,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
    deviationType: 1,
    dataRequirements: {
      title: "What data prevents Value Leakage in TCO Analysis?",
      sections: [
        { heading: "Asset Description & Lifecycle Duration", description: "Provide a clear asset/service description, estimated lifecycle duration in years, and annual volume or usage rate. Without lifecycle context, TCO models under-represent total cost by 30–60%." },
        { heading: "Full OPEX Breakdown by Category", description: "List all ongoing cost categories: maintenance, training, logistics, disposal, energy. Include per-category currency amounts where possible. Missing OPEX splits are the primary cause of vendor selection reversals in Year 2." },
        { heading: "Financial Parameters (NPV/WACC)", description: "Provide discount rate (WACC), inflation/escalation assumptions, and current vs. proposed vendor quotes. NPV and lifecycle cost accuracy degrades significantly without these — output should be marked 'indicative only' if absent." },
        { heading: "GDPR Note", description: "Anonymise exact salary bands and internal cost-centre codes. Replace with generic 'Labour Rate Band A/B/C'. Do not paste HR system extracts (GDPR Art. 25 — data minimisation)." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, organisation size, and the procurement category", type: "textarea", required: true, placeholder: "Describe your industry, organisation size, and the procurement category. Include any relevant regulatory or operational context." },
      { id: "assetDefinition", label: "Asset or Service Definition", description: "Define the asset or service, lifecycle, volume, and CAPEX", type: "textarea", required: true, placeholder: "• Asset or service name and description\n• Lifecycle duration (years)\n• Annual volume or usage rate\n• Quoted CAPEX or contract value (€)\n• Primary vendor or supplier (anonymised if needed)" },
      { id: "opexFinancials", label: "OPEX & Financial Parameters", description: "OPEX breakdown by category and financial modelling inputs", type: "textarea", required: true, placeholder: "• OPEX categories and estimated annual costs — list each:\n  e.g. Maintenance €X / Logistics €Y / Training €Z / Disposal €W\n• WACC or internal discount rate (%)\n• Annual inflation assumption (%)\n• Currency" },
    ],
    outputs: [
      "TCO Waterfall Chart: Visual breakdown of all cost components",
      "NPV Comparison: Present value across ownership period",
      "Vendor Lock-in Score: Assessment with mitigation strategies",
      "Risk-adjusted TCO: Costs including probability-weighted risks",
      "Sensitivity Analysis: Impact of key variable changes",
      "Market Scenario Modeling: Best/worst case projections",
      "Break-even Analysis: When does ownership become cost-effective",
      "Decision Recommendation: AI-powered buy/lease/defer guidance",
    ],
  },

  // ===== 2. COST BREAKDOWN — TYPE 1 =====
  {
    id: "cost-breakdown",
    title: "Cost Breakdown",
    description: "Analyze cost drivers for goods and services, enabling detailed cost modelling and negotiation leverage.",
    previewDescription: "Deconstruct any supplier quote into its raw components — materials, labour, overhead, margin — and benchmark each against industry standards. The AI builds a Should-Cost model that exposes inflated line items and gives you concrete data points to challenge pricing in negotiations. Typically uncovers 8–14% in addressable cost reductions.",
    icon: PieChart,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
    deviationType: 1,
    dataRequirements: {
      title: "What data prevents Value Leakage in Cost Breakdown / Should-Cost analysis?",
      sections: [
        { heading: "Product Specification & BOM Structure", description: "Provide a summary of the product/service specification and Bill of Materials with material families. Without material and labour splits, the AI produces a high-level estimate that suppliers will credibly rebut." },
        { heading: "Labour & Overhead Estimates", description: "Include estimated labour content (% of cost) and overhead benchmarks for your sector. Industry studies show Should-Cost modelling yields 8–14% additional price reduction — but only with this data." },
        { heading: "Comparative Supplier Quotes", description: "Collect at least 2 supplier quotes to enable competitive benchmarking. Without comparatives, the AI cannot identify inflated margins or anchor negotiation positions." },
        { heading: "GDPR Note", description: "Remove patent-pending formulations, exact chemical compositions, or proprietary engineering drawings. Use material families (e.g. 'stainless steel grade 316') not exact proprietary alloy codes." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, category, and supplier geography", type: "textarea", required: true, placeholder: "Industry, category, and supplier geography. Include the manufacturing or service delivery model if known." },
      { id: "productSpecification", label: "Product or Service Specification", description: "Product description, material categories, manufacturing geography", type: "textarea", required: true, placeholder: "• Product / service name and description\n• Key material categories (e.g. stainless steel, injection-moulded polymer, SaaS software)\n• Estimated weight or volume per unit (if physical product)\n• Manufacturing geography and labour intensity (high / medium / low)" },
      { id: "supplierQuote", label: "Supplier Quote & Benchmark Reference", description: "Supplier pricing, your target, and known benchmarks", type: "textarea", required: true, placeholder: "• Supplier's quoted price per unit (€)\n• Your internal target price or budget (€)\n• Any known alternative quotes from other suppliers\n• Estimated margin the supplier is applying (if known)" },
    ],
    outputs: ["Cost Waterfall: Visual breakdown of cost components", "Should-Cost Model: Bottom-up cost estimate with benchmarks", "Negotiation Leverage Points: Areas where supplier costs may be inflated", "Sensitivity Analysis: Impact of key cost driver changes"],
  },

  // ===== 3. CAPEX VS OPEX — TYPE 1H =====
  {
    id: "capex-vs-opex",
    title: "Capex vs Opex (Lease/Buy)",
    description: "Financial comparison between purchasing assets versus leasing with NPV and cash flow analysis.",
    previewDescription: "Should you buy or lease? This scenario models both paths side-by-side using NPV, cash flow impact, tax treatment (including IFRS 16), and residual value assumptions. It produces a CFO-ready recommendation that accounts for flexibility value, balance-sheet impact, and the real cost of capital — not just the monthly payment comparison.",
    icon: Building,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
    deviationType: '1H',
    dataRequirements: {
      title: "What data prevents Value Leakage in CAPEX vs. OPEX analysis?",
      sections: [
        { heading: "Asset Description & Financial Lifespan", description: "Provide the asset description, financial lifespan, annual lease/subscription price, estimated purchase price, and preferred depreciation method (straight-line or declining)." },
        { heading: "Financial Parameters", description: "Include WACC/internal hurdle rate, corporate tax rate (jurisdiction), maintenance costs, and residual value estimates. Without these, NPV comparisons are unreliable and CFO recommendations lack credibility." },
        { heading: "Financial Impact", description: "A 5% WACC miscalculation on a €500k asset over 5 years = €25k+ in misallocated capital. Proper financial modelling prevents suboptimal lease vs. buy decisions." },
        { heading: "GDPR Note", description: "Do not include internal hurdle rates or corporate tax strategies that constitute commercially sensitive information. Use generic rate bands where possible." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, asset class, and business driver for the make/lease/buy decision", type: "textarea", required: true, placeholder: "Industry, asset class being evaluated, and the business driver for the make/lease/buy decision." },
      { id: "assetFinancials", label: "Asset Financial Parameters", description: "Purchase price, lease cost, lifespan, depreciation, maintenance, and residual value", type: "textarea", required: true, placeholder: "• Asset description\n• Purchase price — CAPEX option (€)\n• Annual lease or subscription cost — OPEX option (€)\n• Asset financial lifespan (years)\n• Depreciation method: straight-line or declining balance\n• Estimated annual maintenance and insurance (€)\n• Estimated residual / salvage value at end of life (€)" },
      { id: "financialContext", label: "Financial Context & Tax Inputs", description: "WACC, tax rate, IFRS 16 applicability, and currency", type: "textarea", required: true, placeholder: "• WACC or internal hurdle rate (%)\n• Corporate tax rate for this entity (%)\n• IFRS 16 applicability: yes / no / unsure\n• Off-balance-sheet preference: yes / no\n• Currency" },
    ],
    outputs: ["NPV Waterfall Graph: 5-year total cost comparison", "Flexibility Matrix: Upgrade options vs ownership", "CFO Recommendation: Cash flow preservation advice"],
  },

  // ===== 4. SAVINGS CALCULATION — TYPE 1 =====
  {
    id: "savings-calculation",
    title: "Savings Calculation",
    description: "Document and validate procurement savings with inflation adjustment and audit-ready reporting.",
    previewDescription: "Turn negotiation wins into Finance-approved numbers. This scenario classifies savings as hard, soft, or cost avoidance, applies inflation and FX adjustments, excludes maverick spend from baselines, and generates audit-ready documentation. Designed to survive CFO scrutiny — because ~40% of reported procurement savings are rejected due to categorisation errors.",
    icon: Calculator,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
    deviationType: 1,
    dataRequirements: {
      title: "What data prevents Value Leakage in Savings Calculations?",
      sections: [
        { heading: "Baseline Price & New Negotiated Price", description: "Provide historical baseline price (per unit or total spend), new negotiated price, estimated annual volume, and savings category (hard/soft/avoidance). Mixing hard and soft savings in a single figure causes Finance to invalidate the report." },
        { heading: "Inflation & FX Adjustments", description: "Include multi-year trend of baseline prices, inflation indices applied (CPI/PPI), maverick spend excluded from baseline, and currency/FX adjustments." },
        { heading: "Financial Impact", description: "CIPS: ~40% of reported savings are rejected by Finance due to categorisation errors. Correctly scoped savings reports protect headcount and budget allocations." },
        { heading: "GDPR Note", description: "Anonymise exact supplier contract rates. Use percentage deltas ('15% reduction') rather than absolute figures if sharing outside the team." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Category, supplier context, and the procurement event that generated the saving", type: "textarea", required: true, placeholder: "Category, supplier context, and the procurement event that generated the saving (renegotiation, competitive tender, specification change)." },
      { id: "baselinePricing", label: "Baseline & New Pricing", description: "Baseline price, new price, volume, and measurement period", type: "textarea", required: true, placeholder: "• Baseline price (per unit) (€)\n• New negotiated price (per unit) (€)\n• Annual volume or quantity\n• Total annual spend at baseline (€)\n• Currency\n• Measurement period (months / years)" },
      { id: "savingsClassification", label: "Savings Classification & Adjustments", description: "Savings category, inflation adjustment, maverick exclusion", type: "textarea", required: true, placeholder: "• Savings category: Hard Saving / Soft Saving / Cost Avoidance (select one and explain)\n• Inflation adjustment applied: yes / no — if yes, index used (CPI / PPI / commodity)\n• Maverick or off-contract spend excluded from baseline: yes / no — estimated amount if yes (€)\n• Finance sign-off required: yes / no" },
    ],
    outputs: ["Executive Summary: Hard vs Soft savings breakdown", "Progress Dashboard: Annual savings goal tracker", "Audit Report: PDF with inflation adjustment documentation"],
  },

  // ===== 5. SPEND ANALYSIS — TYPE 2 =====
  {
    id: "spend-analysis-categorization",
    title: "Spend Analysis & Categorization",
    description: "Turn messy accounting exports into a strategic procurement dashboard. Paste your top expenses, and AI will map them to standard procurement categories, identify 'tail spend', and spot consolidation opportunities.",
    previewDescription: "Upload raw spend data and the AI classifies it into standard procurement taxonomies (UNSPSC/eCl@ss), identifies tail spend hiding 20–30% of addressable savings, maps vendor fragmentation, and surfaces consolidation opportunities. Transforms unstructured accounting exports into a strategic procurement dashboard that reveals where money is actually going — and where it shouldn't be.",
    icon: PieChart,
    status: "available",
    category: "analysis",
    deviationType: 2,
    dataRequirements: {
      title: "What data prevents Value Leakage in Spend Analysis?",
      sections: [
        { heading: "Raw Spend Data with Descriptions", description: "Export CSV/Excel with supplier name, spend amount, date, and a free-text description of what was purchased. Without PO descriptions, AI classification accuracy drops below 60% and rogue buying remains invisible." },
        { heading: "Existing Category Mapping", description: "Even a partial category mapping or preferred taxonomy (UNSPSC, eCl@ss) dramatically improves classification accuracy. Cost-centre or department codes help identify maverick spend." },
        { heading: "Financial Impact", description: "Gartner: organisations with mature spend analytics achieve 6–10% annual cost reduction. Unclassified tail spend hides 20–30% of addressable spend — making savings opportunities invisible." },
        { heading: "GDPR Note", description: "Mandatory: replace supplier legal names with tokens (Supplier_001, Supplier_002) before upload. Individual employee names on POs must be removed (GDPR Art. 5(1)(c))." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, organisation size, and the scope of spend being analysed", type: "textarea", required: true, placeholder: "Industry, organisation size, and the scope of spend being analysed (all categories / specific department / specific supplier set)." },
      { id: "rawSpendData", label: "Spend Data Upload", description: "⚠ File upload recommended. Paste CSV/Excel data with Supplier, Amount, Date, Description columns", type: "textarea", required: true, placeholder: "⚠ STRUCTURAL DEVIATION — FILE UPLOAD RECOMMENDED\n\nPaste your spend data here or upload CSV/Excel.\nRequired columns: Supplier Name, Spend Amount, Date, Line Item Description\nOptional: Cost Centre, PO Number, Category (existing)\n\nSupplier | Description | Amount | Date\nSupplier_001 | Cloud hosting | 45000 | 2025-Q3\n..." },
      { id: "classificationParameters", label: "Classification Parameters", description: "Preferred taxonomy, problem categories, and target output", type: "textarea", required: false, placeholder: "• Preferred taxonomy: UNSPSC / eCl@ss / Custom internal\n• Known problem categories or high-maverick-spend areas\n• Cost-centre or department codes to include\n• Target output: consolidation opportunities / compliance gaps / savings potential (select priority)" },
    ],
    outputs: ["Spend Taxonomy & Categorization Breakdown", "Tail Spend Identification (High volume, low value)", "Vendor Consolidation Opportunities", "Quick Wins & Strategic Next Steps"],
  },

  // ===== 6. FORECASTING & BUDGETING — TYPE 1 =====
  {
    id: "forecasting-budgeting",
    title: "Predictive Budgeting & Forecasting",
    description: "Combines your internal historical spend with external Market Intelligence. AI detects hidden seasonality, applies real-time industry inflation trends, and generates Best/Base/Worst case budget scenarios.",
    previewDescription: "Feed in 2+ years of category spend and the AI detects hidden seasonality, overlays real-time commodity and inflation indices from Market Intelligence, and generates three-scenario budget forecasts (Base/Stress/Upside). Prevents the most common budgeting failure: flat-line extrapolation that ignores macro shifts. A 5% CPI under-assumption on a €2M category = €100k unplanned spend.",
    icon: TrendingUp,
    status: "available",
    category: "planning",
    strategySelector: "costVsRisk",
    deviationType: 1,
    dataRequirements: {
      title: "What data prevents Value Leakage in Forecasting & Budgeting?",
      sections: [
        { heading: "Category Spend History (2+ Years)", description: "Provide category spend history (minimum 2 years), key volume drivers, and planning horizon (1 or 3 year). Without trend data, the AI produces flat-line forecasts that ignore inflation and volume shifts." },
        { heading: "Macro Factors & Scenario Assumptions", description: "Include inflation, FX, energy macro factors to model, optimistic/pessimistic scenario assumptions, planned volume changes (new product launches, expansions), and commodity index benchmarks." },
        { heading: "Financial Impact", description: "A 5% CPI under-assumption on a €2M category budget = €100k unplanned spend. Multi-scenario modelling reduces that exposure by 70–80%." },
        { heading: "GDPR Note", description: "Mask unreleased product launch dates and unannounced market expansion plans (inside information under MAR if listed entity). Use 'Demand Scenario A/B/C'." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Category, planning cycle context, and macro factors", type: "textarea", required: true, placeholder: "Category, planning cycle context, and macro factors known to affect this category (commodity price exposure, FX risk, regulatory change)." },
      { id: "historicalSpendData", label: "Historical Spend & Volume Drivers", description: "2+ years of spend history, volume drivers, and planning horizon", type: "textarea", required: true, placeholder: "• Category and current annual spend (€)\n• Prior year spend (€)\n• Year before that (€) — 2 years minimum\n• Key volume drivers: list 2-3 internal factors (e.g. headcount growth, new product launch, geographic expansion)\n• Planning horizon: 1 year / 3 year" },
      { id: "scenarioAssumptions", label: "Scenario Assumptions (Three-Case Model)", description: "Base/upside/downside assumptions and commodity indices", type: "textarea", required: false, placeholder: "• Base case — inflation assumption (%) and expected volume change (%):\n• Upside scenario — key positive driver and estimated % uplift:\n• Downside scenario — key risk factor and estimated % impact:\n• Commodity or price index to apply (CPI / PPI / steel / energy / freight):\n• Currency" },
    ],
    outputs: [
      "Baseline Trend (Internal Data Extrapolation)",
      "Market Intelligence Overlay (External Inflation & Risks)",
      "Scenario 1: Base Case (Expected Spend)",
      "Scenario 2: Stress Test (Worst Case & Triggers)",
      "Actionable Budget Optimization Steps",
    ],
  },

  // ===== 7. SAAS OPTIMIZATION — TYPE 1 =====
  {
    id: "saas-optimization",
    title: "SaaS Optimization",
    description: "Identify unused licenses, duplicate tools, and right-sizing opportunities for software subscriptions.",
    previewDescription: "Audit your entire SaaS portfolio for waste. The AI cross-references licence counts against utilisation data, flags duplicate tools with overlapping features, identifies auto-renewal traps, and produces a prioritised 'kill list' of licences to remove. The average enterprise wastes 25% of SaaS spend on unused licences — this scenario finds and quantifies that waste.",
    icon: Cloud,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
    deviationType: 1,
    dataRequirements: {
      title: "What data prevents Value Leakage in SaaS Optimisation?",
      sections: [
        { heading: "Active SaaS Tools & Licence Counts", description: "List all active SaaS tools, licence count per tool, approximate annual contract value, and renewal dates. Without this baseline, the AI cannot identify unused licences or missed cancellation windows." },
        { heading: "Utilisation & Overlap Analysis", description: "Provide feature utilisation rates from admin portals, overlap matrix (which tools share features), active vs. provisioned users, and vendor auto-renewal clauses." },
        { heading: "Financial Impact", description: "Gartner: average enterprise wastes 25% of its SaaS spend on unused licences. A 5-person team on a €50k SaaS stack leaves ~€12.5k on the table annually." },
        { heading: "GDPR Note", description: "Do not include SSO architecture details, admin credentials, or user-level activity logs. Aggregate utilisation to tool level only (e.g. '42 of 60 licences active'). GDPR Art. 5(1)(b)." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, organisation size, and scope of SaaS audit", type: "textarea", required: true, placeholder: "Industry, organisation size, and the scope of SaaS audit (all tools / finance tools only / security tools only / specific vendor)." },
      { id: "subscriptionDetails", label: "Current SaaS Portfolio", description: "List each tool with licence counts, cost, and renewal dates", type: "textarea", required: true, placeholder: "List each tool on a new line using this format:\nTool Name | Licences Purchased | Licences Active | Annual Cost (€) | Renewal Date | Primary Use Case\n\nNOTE: list every in-scope tool, one per line" },
      { id: "optimisationParameters", label: "Optimisation Parameters", description: "Overlap, auto-renewal flags, utilisation rates, and optimisation target", type: "textarea", required: false, placeholder: "• Known overlapping tools or feature duplication (describe)\n• Auto-renewal clauses to flag (list tool names)\n• Feature utilisation rate if available from admin portals (tool: utilisation %)\n• Optimisation target: cost reduction / consolidation / compliance audit (select one)" },
    ],
    outputs: ["Kill List: Licenses to remove with user names", "Tier Mismatch Chart: Overpayment for unused features", "Duplicate Matrix: Comparison of overlapping services"],
  },

  // ===== 8. SPECIFICATION OPTIMIZER — TYPE 0 =====
  {
    id: "specification-optimizer",
    title: "Specification Optimizer",
    description: "Analyze technical specifications for 'gold plating' - excessive requirements that limit supplier options and unnecessarily inflate costs.",
    previewDescription: "Challenge over-engineered specifications that silently inflate costs and restrict your supplier base. The AI benchmarks your technical requirements against industry standards, identifies where tolerances or material grades exceed functional needs, and quantifies the cost premium of each over-specification. Typically uncovers 15–25% cost savings on over-specified components — the single largest avoidable cost driver in indirect spend.",
    icon: Sparkles,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in Specification Optimisation?",
      sections: [
        { heading: "Technical Specification & Tolerances", description: "Provide a summary of the specification or technical requirements, performance tolerances required, and material/grade currently specified. Without the spec summary, the AI cannot identify where over-specification exists." },
        { heading: "Specification Source & Cost Differentials", description: "Include industry-standard tolerance benchmarks, reason for current specification (legacy, stakeholder preference, regulatory), and cost differential between grades." },
        { heading: "Financial Impact", description: "CIPS: over-specification is the single largest avoidable cost driver in indirect and MRO spend. Even a 10% spec reduction on a €200k contract = €20k saved. Industry benchmark: 15–25% cost premium on over-specified components." },
        { heading: "GDPR Note", description: "Remove patent-pending IP, exact proprietary dimensions, and any source code or firmware versions that could identify unreleased products." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, product category, and the stakeholder driving the current specification", type: "textarea", required: true, placeholder: "Industry, product category, and the stakeholder driving the current specification (engineering, legal, historical practice)." },
      { id: "specificationText", label: "Current Specification", description: "Current specification in plain language with material, tolerances, and standards", type: "textarea", required: true, placeholder: "Describe the current specification or technical requirement in plain language. Include: the material or grade currently specified, the performance tolerance required, and any applicable standards (ISO, EN, ASTM). You do not need to share exact formulas or proprietary dimensions." },
      { id: "specContext", label: "Challenge Parameters & Constraints", description: "Why was this spec set, target cost reduction, and approval authority", type: "textarea", required: false, placeholder: "• Why was this specification set? (e.g. legacy decision, engineering preference, regulatory mandate, customer requirement)\n• What is the target cost reduction (% or €)?\n• Which stakeholders must approve a specification change?\n• Any known alternative materials or grades already under consideration?" },
    ],
    outputs: [
      "Gold Plating Report: Identified over-specifications with cost impact estimates",
      "Market Comparison: How specs compare to industry standards (via Perplexity research)",
      "Cost Reduction Opportunities: Specific changes with estimated savings percentages",
      "Alternative Specification: Optimized spec that maintains function at lower cost",
      "Supplier Market Expansion: How spec changes could increase supplier options",
      "Risk Assessment: What you lose vs. gain with each proposed change",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // GROUP B — WORKFLOW & CONVENIENCE
  // ═══════════════════════════════════════════════════════

  // ===== 9. RFP GENERATOR — TYPE 0 =====
  {
    id: "rfp-generator",
    title: "RFP Generator (Tender Package)",
    description: "Paste your procurement brief or requirements and select which tender documents to generate. EXOS extracts key details automatically and produces a complete, ready-to-send tender package.",
    previewDescription: "Drop in your raw procurement brief — however rough — and the AI extracts key requirements, generates a structured tender package (RFP, RFI, or RFQ), builds an evaluation matrix with weighted scoring, and flags missing information that could delay the process. Eliminates 3–6 weeks of tender preparation work and prevents the #1 cause of RFP reissue: incomplete evaluation criteria.",
    icon: FileSpreadsheet,
    status: "available",
    category: "documentation",
    strategySelector: "speedVsQuality",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in RFP Generation?",
      sections: [
        { heading: "Business Need & Delivery Timeline", description: "Provide a 2–5 sentence business need description, required delivery timeline, and mandatory regulatory/compliance standards (GDPR, ISO, SOC2). Without regulatory clauses, suppliers submit non-compliant proposals and legal review flags the document." },
        { heading: "Evaluation Criteria & Contract Structure", description: "Define evaluation weighting criteria (price/quality/sustainability/risk), preferred contract structure (framework, spot, call-off), and known incumbent supplier details. Missing evaluation criteria delay award by 3–6 weeks." },
        { heading: "Financial Impact", description: "A reissued RFP in a competitive tender delays award by 3–6 weeks and damages supplier confidence in the buying organisation." },
        { heading: "GDPR Note", description: "Do not include maximum budget ceiling in the RFP prompt (negotiation leverage). Use 'indicative budget range' only. Mask internal project code names." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, organisation type, and category being sourced", type: "textarea", required: false, placeholder: "Industry, organisation type, and the category being sourced. Include any relevant previous sourcing history with this requirement." },
      { id: "rawBrief", label: "Procurement Requirement", description: "Describe what you are sourcing — business problem, scope, timeline, and volume", type: "textarea", required: true, placeholder: "Describe what you are sourcing in plain language. Include: the business problem being solved, the scope of supply (goods, services, or both), the required delivery or go-live timeline, and any known volume or scale parameters.\n\nPaste your full brief here — the more detail, the better the output." },
      { id: "complianceEvaluation", label: "Compliance & Evaluation Criteria", description: "Regulatory standards, evaluation weighting, and contract structure", type: "textarea", required: false, placeholder: "Mandatory regulatory or compliance standards the supplier must meet (GDPR, ISO, SOC2, TUPE, etc.).\nEvaluation weighting if known (e.g. Price 40% / Quality 35% / Sustainability 15% / Risk 10%).\nPreferred contract structure (framework agreement, fixed-price, call-off, time & materials)." },
    ],
    outputs: [
      "Extracted Brief Summary (Auto-parsed from raw input)",
      "Tender Document(s) (Based on selected package type)",
      "Evaluation Matrix (Weighted scoring framework)",
      "Clarifications & Recommendations (Missing data flags + next steps)",
      "Suggested Attachments & Templates",
    ],
  },

  // ===== 10. SLA DEFINITION — TYPE 1 =====
  {
    id: "sla-definition",
    title: "SLA Definition",
    description: "Generate comprehensive Service Level Agreement terms with metrics, targets, and escalation procedures.",
    previewDescription: "Generate enforceable SLA terms with quantified metrics, tiered penalty structures, and escalation procedures. The AI translates vague service expectations into measurable KPIs, calculates the financial cost of each SLA breach level, and produces a ready-to-use contract appendix. Without financial penalties, SLAs are legally unenforceable — this scenario ensures yours aren't.",
    icon: Clock,
    status: "available",
    category: "documentation",
    strategySelector: "costVsRisk",
    deviationType: 1,
    dataRequirements: {
      title: "What data prevents Value Leakage in SLA Definitions?",
      sections: [
        { heading: "Core Deliverables & Uptime Requirements", description: "Define core service deliverables, uptime/availability requirement, and critical failure definition with acceptable response time. An SLA without financial penalties is legally unenforceable." },
        { heading: "Escalation & Penalty Mechanisms", description: "Provide 3-tier escalation contacts and timescales, service credit/penalty mechanism (% of monthly fee), measurement/reporting frequency, and known peak demand periods." },
        { heading: "Financial Impact", description: "A supplier delivering 94% uptime against a 99.9% SLA without penalty clauses = 43 hours of uncompensated downtime per year. At €500/hour operational cost, that's €21.5k unrecovered." },
        { heading: "GDPR Note", description: "Mask specific internal server names, IP ranges, exact physical facility coordinates, and key personnel home-office locations." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, service type, and relationship context", type: "textarea", required: true, placeholder: "Industry, service type (cloud, logistics, facilities, IT support), and the relationship context (new contract, renewal, dispute-triggered review)." },
      { id: "serviceDescription", label: "Service Performance Requirements", description: "Core deliverables, uptime %, failure definition, and response times", type: "textarea", required: true, placeholder: "• Core service deliverables (what must be delivered, measured, and reported)\n• Uptime / availability requirement (%)\n• Critical failure definition (describe what constitutes a P1 / SEV1 incident)\n• Response time to critical failure (hours)\n• Resolution time to critical failure (hours)" },
      { id: "remedyStructure", label: "Remedy & Escalation Structure", description: "Penalty tiers, escalation path, reporting frequency", type: "textarea", required: false, placeholder: "• Service credit / penalty mechanism — specify tiers:\n  Tier 1 breach at (%) = (% of monthly fee credit)\n  Tier 2 breach at (%) = (% credit)\n  Tier 3 breach = right to terminate\n• Escalation path: Level 1 role / Level 2 role / Level 3 executive\n• Measurement and reporting frequency\n• Known peak demand periods to carve out" },
    ],
    outputs: ["SLA Table: Metrics, targets, and financial penalties", "Decision Tree: Incident response by severity level", "Draft Agreement: Ready-to-use service quality appendix"],
  },

  // ===== 11. TAIL SPEND — TYPE 0 =====
  {
    id: "tail-spend-sourcing",
    title: "Tail Spend Rapid Sourcing",
    description: "Quick analysis for low-value purchases to determine the fastest compliant procurement route.",
    previewDescription: "Fast-track low-value purchases without bypassing compliance. The AI assesses your micro-purchase against procurement policy thresholds, recommends the fastest compliant route (direct buy, mini-RFQ, or catalogue order), and generates the necessary documentation. Tail spend represents 20% of addressable spend with 80% of supplier relationships — poorly managed, it multiplies transaction costs disproportionately.",
    icon: ShoppingCart,
    status: "available",
    category: "planning",
    strategySelector: "speedVsQuality",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in Tail Spend Sourcing?",
      sections: [
        { heading: "Item Description, Quantity & Delivery Date", description: "Provide a clear item/service description, quantity required, and required delivery date. Even for micro-purchases, missing acceptance criteria leads to disputes — total cost of a rework is often 3–5x the original purchase value." },
        { heading: "Quality & Specification Standards", description: "Include quality standards, preferred supplier types (local, certified, diverse), and budget ceiling. Without these, the AI cannot assess compliance against your procurement policy." },
        { heading: "Financial Impact", description: "Tail spend typically represents 20% of addressable spend with 80% of supplier relationships. Poorly executed tail-spend queries multiply transaction costs disproportionately." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry and the internal department or cost centre making the request", type: "textarea", required: true, placeholder: "Industry and the internal department or cost centre making the request." },
      { id: "purchaseRequirement", label: "Purchase Requirement", description: "Item/service name, quantity, delivery date and location", type: "textarea", required: true, placeholder: "Describe what you need to buy: item or service name, quantity required, required delivery date and delivery location. Keep it specific — the more precise your description, the more targeted the mini-RFQ." },
      { id: "qualityParameters", label: "Quality & Commercial Parameters", description: "Quality standard, budget ceiling, acceptance criteria, preferred supplier type", type: "textarea", required: false, placeholder: "Quality standard or specification required (if applicable).\nBudget ceiling or target unit price (€).\nAcceptance criteria — how will you verify the goods or service meet requirements?\nPreferred supplier characteristics (local, certified, diverse supplier programme)." },
    ],
    outputs: ["Action Plan: Direct 'Buy Here' link or 'Launch Tender' recommendation", "Compliance Alert: Notification if purchase violates procurement policy"],
  },

  // ===== 12. CONTRACT TEMPLATE — TYPE 0 =====
  {
    id: "contract-template",
    title: "Contract Template Generator",
    description: "Generate country-specific contract templates for EU procurement. Select your time investment tier and EXOS produces a structured template with clause-by-clause guidance. Not legal advice — a professional starting point.",
    previewDescription: "Generate jurisdiction-aware contract templates tailored to EU procurement law. Select your time-investment tier (Quick/Standard/Comprehensive) and the AI produces structured clause sets covering scope, pricing, liability, IP, termination, and GDPR compliance — with clause-by-clause guidance explaining what each provision protects against. A professional starting point, not legal advice, that saves days of drafting time.",
    icon: ScrollText,
    status: "available",
    category: "documentation",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in Contract Template Generation?",
      sections: [
        { heading: "Agreement Type & Governing Law", description: "Specify the agreement type (supply, services, NDA, framework), governing law jurisdiction, and key commercial terms (payment terms, liability cap). Governing law mismatches invalidate enforcement in cross-border disputes." },
        { heading: "Regulatory & IP Context", description: "Include specific regulatory context (GDPR DPA clauses, TUPE, IR35), preferred dispute resolution mechanism, IP ownership provisions, and auto-renewal/notice period preferences." },
        { heading: "Financial Impact", description: "GC survey (2024): 65% of contract disputes originate from ambiguous liability or IP clauses that could have been resolved in drafting. Legal review fees for a contested clause average €5–15k." },
        { heading: "GDPR Note", description: "Mask exact legal entity names in the drafting phase. Use [BUYER ENTITY] and [SUPPLIER ENTITY] placeholders. Do not include current agreed pricing in template fields." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, jurisdiction, and commercial relationship type", type: "textarea", required: false, placeholder: "Industry, jurisdiction (country of governing law), and the nature of the commercial relationship (one-off, framework, ongoing services, software licence)." },
      { id: "country", label: "Applicable Country (EU)", description: "Select the EU member state whose commercial law should apply", type: "select", required: true, options: [
        "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
        "Denmark", "Estonia", "Finland", "France", "Germany", "Greece",
        "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg",
        "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia",
        "Slovenia", "Spain", "Sweden"
      ] },
      { id: "timeTier", label: "Time Investment / Detail Level", description: "How much detail do you need?", type: "select", required: true, options: [
        "Quick Draft (3 feedback sections, ~15 min review)",
        "Standard (5-6 feedback sections, ~30-45 min review)",
        "Thorough (7+ feedback sections, ~1 hour+ review)"
      ] },
      { id: "contractBrief", label: "Agreement Structure & Core Commercial Terms", description: "Agreement type, payment terms, liability cap, key deliverables", type: "textarea", required: true, placeholder: "Agreement type: Supply / Services / NDA / Framework / Software Licence / Other.\nPayment terms (e.g. net 30, milestone-based, subscription).\nLiability cap (e.g. value of contract, 2x contract value).\nKey deliverables or subject matter of the agreement." },
      { id: "contractType", label: "Contract Type", description: "Select the type of contract to generate", type: "select", required: true, options: [
        "Service Agreement",
        "Supply / Purchase Agreement",
        "Framework Agreement",
        "Non-Disclosure Agreement (NDA)",
        "Consulting / Professional Services",
        "Maintenance & Support Agreement"
      ] },
      { id: "regulatoryProvisions", label: "Regulatory & Special Provisions", description: "GDPR DPA, TUPE, IP ownership, dispute resolution, auto-renewal", type: "textarea", required: false, placeholder: "Regulatory clauses required: GDPR Data Processing Agreement / TUPE (staff transfer) / IR35 / REACH / None.\nIP ownership: buyer retains all IP / supplier retains IP / jointly developed IP.\nDispute resolution: English courts / ICC arbitration / mediation first.\nAuto-renewal: yes / no — if yes, notice period to cancel (days)." },
    ],
    outputs: [
      "Legal Disclaimer & Scope Statement",
      "Contract Structure Overview (Clause Map)",
      "Drafted Contract Template (Country-Specific)",
      "Clause-by-Clause Guidance & Risk Flags [REVIEW WITH LEGAL COUNSEL]",
      "Recommended Next Steps & Legal Review Checklist",
    ],
  },

  // ===== 13. REQUIREMENTS GATHERING — TYPE 0 =====
  {
    id: "requirements-gathering",
    title: "Requirements Gathering",
    description: "Structure business needs into prioritized requirements with user stories and solution recommendations.",
    previewDescription: "Transform chaotic stakeholder wishlists into a structured Business Requirements Document. Paste raw meeting notes, emails, or bullet points — the AI organises them into MoSCoW-prioritised requirements, generates user stories for validation, and scans the market for 3–5 matching solutions. Prevents the #1 cause of scope creep: ambiguous requirements that increase project costs by 20–45%.",
    icon: ListChecks,
    status: "available",
    category: "planning",
    strategySelector: "skepticism",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in Requirements Gathering?",
      sections: [
        { heading: "Raw Stakeholder Requirements & Project Goal", description: "Provide the raw stakeholder requirement list (even bullet form), the project goal or business problem being solved, and known constraints (budget, timeline, technical). Failure to separate MoSCoW priorities means suppliers price all requirements equally." },
        { heading: "Priority Ranking & Existing Systems", description: "Include RACI chart of approvers, priority ranking (MoSCoW or similar), the existing system/process being replaced, and known risks or dependencies." },
        { heading: "Financial Impact", description: "PM Institute: scope creep on projects with ambiguous requirements increases final cost by 20–45% vs. baseline. Over-specified proposals follow without clear prioritisation." },
        { heading: "GDPR Note", description: "Scrub internal corporate strategic expansion plans, unreleased product names, and unannounced market entry targets. Use 'Project Alpha / Beta' codenames." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, department making the request, and business problem", type: "textarea", required: true, placeholder: "Industry, department making the request, and the business problem or opportunity being addressed. Include any known strategic context." },
      { id: "stakeholderRequirements", label: "Stakeholder Requirements", description: "Raw stakeholder requirements — any format is acceptable", type: "textarea", required: true, placeholder: "Paste your raw stakeholder requirements here — any format is acceptable. Include wishlists, meeting notes, email threads, or bullet points. Unstructured input is fine. EXOS will structure it into a prioritised BRD.\n\nDo not over-curate — include everything you've been told." },
      { id: "constraintsPriority", label: "Constraints & Priority Context", description: "Budget, timeline, technical limitations, must-haves vs nice-to-haves", type: "textarea", required: false, placeholder: "Known constraints: budget ceiling, delivery timeline, technical platform limitations.\nPriority guidance: are there known must-haves vs. nice-to-haves?\nKnown dependencies on other projects or systems.\nRegulatory requirements that are non-negotiable." },
    ],
    outputs: ["MoSCoW Matrix: Requirements prioritized by importance", "User Stories: Test scenarios for product validation", "Market Scan: 3-5 solutions matching requirements"],
  },

  // ===== 14. SUPPLIER PERFORMANCE REVIEW — TYPE 1H =====
  {
    id: "supplier-review",
    title: "Supplier Review",
    description: "Comprehensive supplier performance evaluation with scorecard and improvement planning.",
    previewDescription: "Build a data-driven supplier scorecard combining quantitative KPIs (delivery, quality, invoice accuracy) with qualitative stakeholder feedback and trend analysis. The AI generates a radar diagram of competencies, identifies performance gaps, and produces a 90-day improvement plan with a QBR discussion script. Moves supplier management from subjective opinions to evidence-based decisions.",
    icon: ClipboardCheck,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
    deviationType: '1H',
    dataRequirements: {
      title: "What data prevents Value Leakage in Supplier Performance Reviews?",
      sections: [
        { heading: "Performance Metrics (12 Months)", description: "Provide on-time delivery %, quality reject rate, invoice accuracy, and overall satisfaction rating from the last 12 months. Purely quantitative scores without qualitative context produce a report that is accurate but strategically useless." },
        { heading: "Qualitative Feedback & Trend Data", description: "Include 1–3 qualitative comments and quarter-on-quarter trend data. Weight each KPI to business priority. Without this, the supplier receives numbers with no improvement roadmap." },
        { heading: "Financial Impact", description: "Organisations with structured supplier performance programmes achieve 23% better on-time delivery and 15% quality improvement (CIPS, 2023). Without it, relationship drift is invisible." },
        { heading: "GDPR Note", description: "Mask specific names of internal stakeholders providing feedback (retaliation risk). Use role-based attribution: 'Operations Lead', 'Plant Manager' (GDPR Art. 5(1)(c))." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, category managed by this supplier, and relationship history", type: "textarea", required: true, placeholder: "Industry, category managed by this supplier, and the relationship history (years, strategic importance, known issues)." },
      { id: "performanceMetrics", label: "Performance Metrics (Last 12 Months)", description: "On-time delivery, quality, invoice accuracy, satisfaction, and spend", type: "textarea", required: true, placeholder: "• On-time delivery rate (%)\n• Quality reject or defect rate (%)\n• Invoice accuracy rate (%)\n• SLA compliance rate (%)\n• Overall stakeholder satisfaction score (1–5)\n• Annual spend with this supplier (€)\n• Period being reviewed (e.g. Jan–Dec 2025)" },
      { id: "qualitativeAssessment", label: "Qualitative Assessment & Strategic Context", description: "Stakeholder feedback, trend direction, volume changes, strategic intent", type: "textarea", required: false, placeholder: "• Key qualitative feedback (2–3 observations from stakeholders — use role references, not names)\n• Trend direction: improving / stable / declining — explain why\n• Planned volume changes affecting this supplier (increase / decrease / exit)\n• Strategic intent: develop and grow / maintain / performance-improve or exit" },
    ],
    outputs: ["Supplier Scorecard: Radar diagram of supplier competencies", "PIP Plan: 90-day performance improvement plan", "QBR Script: Scenario for annual business review meeting"],
  },

  // ===== 15. PROCUREMENT PROJECT PLANNING — TYPE 0 =====
  {
    id: "procurement-project-planning",
    title: "Procurement Project Planning",
    description: "Analyze project inputs, outputs, and constraints to set strategic priorities using proven strategic analysis methods.",
    previewDescription: "Map your procurement project from inception to go-live using SWOT, stakeholder mapping, and critical path analysis. The AI identifies decision gates, approval bottlenecks, resource conflicts, and regulatory checkpoints — then produces a prioritised action plan with risk-adjusted timelines. Prevents the most common project delay: missing RACI clarity that stalls approval chains.",
    icon: Target,
    status: "available",
    category: "planning",
    strategySelector: "speedVsQuality",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in Procurement Project Planning?",
      sections: [
        { heading: "Project Objective & Milestones", description: "Provide the project objective, key milestones (tender launch, evaluation, award, go-live), and estimated duration per phase. Missing RACI leads to approval bottlenecks — the most common project delay cause." },
        { heading: "Stakeholder Roles & Approval Gates", description: "Include stakeholder roles involved, regulatory approval gates, IT security review requirements, legal sign-off timescales, and known holiday/resource constraints." },
        { heading: "Financial Impact", description: "Delayed contract award on a time-critical project = revenue risk. A 2-week slip on a go-live supporting €1M/month revenue = €500k exposure." },
        { heading: "GDPR Note", description: "Use generic role titles rather than actual employee names in RACI charts (e.g. 'CPO', 'IT Security Lead'). Do not include personal email or phone data." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, category or project type, and business driver", type: "textarea", required: true, placeholder: "Industry, category or project type (new supplier sourcing, contract renewal, system implementation, category restructure), and the business driver." },
      { id: "projectBrief", label: "Project Scope & Milestones", description: "Project objective, key milestones, duration per phase, and deadlines", type: "textarea", required: true, placeholder: "Project objective in one sentence.\nKey milestones and estimated duration for each phase (e.g. Requirements definition: 2 weeks / Market engagement: 3 weeks / Tender evaluation: 4 weeks / Contract award: 1 week / Go-live: ongoing).\nTotal available timeline and hard deadline if applicable." },
      { id: "stakeholderConstraints", label: "Stakeholders, Approvals & Constraints", description: "Stakeholder roles, approval authority, regulatory gates, resource constraints", type: "textarea", required: false, placeholder: "Key stakeholder roles involved (use generic titles: CPO, IT Security Lead, Legal Counsel, Finance Director).\nApproval authority and financial delegation levels.\nRegulatory approval gates (data privacy review, security assessment, competition law check).\nKnown resource constraints or blackout periods." },
    ],
    outputs: ["SWOT Analysis: Strengths, weaknesses, opportunities, threats for the project", "Priority Matrix: Critical vs nice-to-have activities mapped by effort/impact", "Stakeholder Map: Influence/interest matrix with engagement strategy", "Critical Path: Key milestones and decision points", "Risk Register: Prioritized risks with mitigation strategies"],
  },

  // ═══════════════════════════════════════════════════════
  // GROUP C — RELIABILITY & COMPLIANCE
  // ═══════════════════════════════════════════════════════

  // ===== 16. SOW CRITIC — TYPE 2 =====
  {
    id: "sow-critic",
    title: "SOW Critic",
    description: "AI-powered Statement of Work review to identify gaps, ambiguities, and protection issues.",
    previewDescription: "Upload any SOW and get a clause-by-clause AI review that flags scope ambiguities, missing acceptance criteria, weak penalty structures, and IP ownership gaps. Produces a track-changes style redline, a protection scorecard (0–100%), and a list of clarification questions to send back to the supplier. Targets the #1 cause of supplier disputes: ambiguous deliverables that cost €30–80k per incident to resolve.",
    icon: FileText,
    status: "available",
    category: "documentation",
    strategySelector: "skepticism",
    deviationType: 2,
    dataRequirements: {
      title: "What data prevents Value Leakage in SOW Reviews?",
      sections: [
        { heading: "Complete SOW Text & Engagement Type", description: "Paste or upload the full draft SOW text and specify the engagement type (fixed-price, T&M, milestone-based). The AI cannot identify gaps it cannot see — an incomplete SOW provided for review will receive an incomplete review." },
        { heading: "Milestone Definitions & Payment Triggers", description: "Include exact milestone definitions, acceptance criteria, payment trigger events, IP ownership provisions, and change request procedures. These are the clauses most commonly exploited in disputes." },
        { heading: "Financial Impact", description: "Ambiguous deliverables are the #1 cause of supplier disputes. PwC: scope dispute resolution averages €30–80k in legal and management cost per incident." },
        { heading: "GDPR Note", description: "Remove PII of named project managers, individual contractors, and home-office addresses. Use role references only. Do not include uncommitted budget reserves." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, engagement type, and strategic importance of this contract", type: "textarea", required: true, placeholder: "Industry, engagement type (fixed-price project, time & materials, managed service), and the strategic importance of this contract." },
      { id: "sowText", label: "Statement of Work Document", description: "⚠ File upload recommended. Paste or upload the complete SOW text", type: "textarea", required: true, placeholder: "⚠ STRUCTURAL DEVIATION — FILE UPLOAD RECOMMENDED\n\nPaste the complete SOW text here or upload PDF/DOCX.\nPartial pastes produce partial reviews — include the complete document including schedules and appendices." },
      { id: "reviewScope", label: "Review Scope & Parameters", description: "Engagement type, regulatory framework, priority review areas", type: "textarea", required: false, placeholder: "• Engagement type: Fixed-price / Time & Materials / Milestone-based / Managed Service\n• Governing regulatory framework: GDPR / SOC2 / ISO 27001 / HIPAA / None\n• Priority review areas: scope definition / payment triggers / IP ownership / penalty clauses / exit provisions\n• Counterparty type: prime contractor / subcontractor / SaaS vendor / consultancy" },
    ],
    outputs: ["Redlining: Track-changes style markup", "Scorecard: Contract protection score (0-100%)", "Checklist: Questions to clarify gray areas"],
  },

  // ===== 17. RISK ASSESSMENT — TYPE 0 =====
  {
    id: "risk-assessment",
    title: "Risk Assessment",
    description: "Comprehensive risk analysis combining industry dynamics, contract risks, and real-time market situation assessment.",
    previewDescription: "Go beyond surface-level risk registers. This scenario combines industry dynamics, contract vulnerabilities, regulatory exposure, and real-time market intelligence to produce a multi-dimensional risk assessment. Identifies systemic and cascading risks that operational-only registers miss — including GDPR, cyber supply-chain, and geopolitical exposure that can cost €10–20M per incident.",
    icon: Shield,
    status: "available",
    category: "risk",
    strategySelector: "costVsRisk",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in Risk Assessment?",
      sections: [
        { heading: "Operational Hazards & Dependencies", description: "Provide project/category context, known operational hazards, and critical supplier dependencies. Surface-level risk identification misses regulatory and systemic risks — a register that only captures operational risks is incomplete." },
        { heading: "Historical Incidents & Insurance", description: "Include historical incident logs, insurance coverage status, business continuity plan details, and interdependencies with other categories or projects." },
        { heading: "Financial Impact", description: "An unmitigated GDPR breach costs €10–20M or 4% of global turnover (Article 83). A single unidentified cyber supply-chain risk can cascade across all connected systems." },
        { heading: "GDPR Note", description: "Mask specific facility security protocols, IT architecture details, and physical infrastructure vulnerabilities. These details, if exposed, create the very risks you are trying to mitigate." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, category or project being assessed, and regulatory environment", type: "textarea", required: true, placeholder: "Industry, category or project being assessed, and the regulatory environment this activity operates in (GDPR, financial services, manufacturing, energy)." },
      { id: "riskEnvironment", label: "Risk Environment & Known Hazards", description: "Project context, operational hazards, supplier dependencies, regulatory requirements", type: "textarea", required: true, placeholder: "Describe the project, category, or supplier relationship being assessed. Include: known operational hazards, critical supplier dependencies (name the dependency type, not the supplier name), regulatory requirements in scope, and any historical incidents or near-misses that inform the risk profile." },
      { id: "existingControls", label: "Existing Controls & Financial Exposure", description: "Controls in place, financial exposure, BCP status, interdependencies", type: "textarea", required: false, placeholder: "What controls are already in place (insurance, BCP, dual-sourcing, contractual protections)?\nEstimated maximum financial exposure if the primary risk materialises (€ range).\nBusiness continuity plan status: in place / partial / none.\nInterdependencies with other categories, projects, or systems." },
    ],
    outputs: [
      "Risk Heat Map: Visual probability vs impact assessment",
      "Industry Risk Brief: Market dynamics and trend analysis",
      "Contract Risk Score: Contractual protection assessment",
      "Current Situation Summary: Real-time risk factors with source citations",
      "Mitigation Roadmap: Prioritized actions to reduce exposure",
      "Monitoring Dashboard: Key risk indicators to track",
      "Scenario Analysis: Best/worst/likely case outcomes",
    ],
  },

  // ===== 18. RISK MATRIX — TYPE 1H =====
  {
    id: "risk-matrix",
    title: "Risk Matrix",
    description: "Supplier risk assessment covering legal, financial, cyber, and operational risks.",
    previewDescription: "Build a visual risk heatmap from structured risk inputs. Provide at least 5 identified risks with probability and impact ratings, and the AI generates a colour-coded matrix with mitigation priorities, owner assignments, and residual risk targets. Transforms a static spreadsheet into a living risk management tool with escalation thresholds and board notification triggers.",
    icon: Shield,
    status: "available",
    category: "risk",
    strategySelector: "costVsRisk",
    deviationType: '1H',
    dataRequirements: {
      title: "What data prevents Value Leakage in Risk Matrix analysis?",
      sections: [
        { heading: "Risk List with Probability & Impact", description: "Provide a minimum of 5 identified risks with estimated probability (High/Medium/Low) and impact (High/Medium/Low) for each. Without these, the AI defaults to generic ratings that provide no actionable prioritisation." },
        { heading: "Existing Controls & Risk Ownership", description: "Document existing control measures in place, risk owner assignments, target residual risk after mitigation, and review frequency. This transforms a static matrix into a living risk management tool." },
        { heading: "Financial Impact", description: "A risk matrix without user-provided probability and impact inputs produces a colour-coded chart with no decision value. Proper inputs enable prioritised mitigation that protects against cascading failures." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, scope of risk register, and risk appetite statement", type: "textarea", required: true, placeholder: "Industry, the scope of the risk register (project / category / supplier / enterprise-wide), and the risk appetite statement if defined." },
      { id: "riskRegister", label: "Risk Register — Structured Input", description: "List each risk with category, probability, impact, control, and owner", type: "textarea", required: true, placeholder: "List each risk using this exact format, one risk per line:\nRisk Name | Category (Operational/Financial/Compliance/Strategic/Reputational) | Probability (H/M/L) | Impact (H/M/L) | Current Control in Place | Risk Owner Role\n\nNOTE: include at minimum 5 risks; the matrix cannot be generated with fewer" },
      { id: "matrixParameters", label: "Matrix Parameters & Targets", description: "Risk appetite, residual targets, review frequency, escalation threshold", type: "textarea", required: false, placeholder: "• Risk appetite statement (tolerate / treat / transfer / terminate at what level?)\n• Target residual risk level after mitigation: High acceptable / Medium acceptable / Low only\n• Review frequency: monthly / quarterly / annually\n• Escalation threshold: at what risk score must the board be notified?" },
    ],
    outputs: ["Risk Heatmap: Probability vs Impact matrix", "Mitigation Plan: Risk reduction action list", "Traffic Light Status: Green/Yellow/Red recommendation"],
  },

  // ===== 19. SOFTWARE LICENSING — TYPE 2 =====
  {
    id: "software-licensing",
    title: "Software Licensing Structure",
    description: "Evaluate different software licensing models, multi-tier user needs, contract terms, and vendor lock-in to optimize software investments.",
    previewDescription: "Decode complex software licensing agreements before they decode your budget. Upload your licence document and the AI analyses metric definitions, true-up traps, tier mismatches, and auto-renewal clauses — then models multi-year TCO under different scenarios (monthly vs. annual vs. enterprise). 68% of enterprises receive unexpected true-up invoices; this scenario prevents that with proactive licence structure analysis.",
    icon: KeyRound,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
    deviationType: 2,
    dataRequirements: {
      title: "What data prevents Value Leakage in Software Licensing Audits?",
      sections: [
        { heading: "Licence Agreement & Usage Metrics", description: "Provide licence agreement text or summary, current usage metrics (users, CPU, revenue threshold), and contract expiry/true-up date. Metric definition mismatches are the most common software compliance risk." },
        { heading: "Utilisation & Overlap Data", description: "Include feature utilisation rates from admin portals, overlap matrix (which tools share features), active vs. provisioned users, and auto-renewal clauses. Gartner: average enterprise wastes 25% of SaaS spend on unused licences." },
        { heading: "Financial Impact", description: "68% of enterprises receive unexpected true-up invoices. Average overcharge on enterprise software = 15–30% of contract value. On a €200k contract, that is €30–60k." },
        { heading: "GDPR Note", description: "Do not include SSO architecture details, admin credentials, or user-level activity logs. Aggregate utilisation to tool level only (e.g. '42 of 60 licences active'). GDPR Art. 5(1)(b)." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, vendor name or software category, and audit trigger", type: "textarea", required: true, placeholder: "Industry, vendor name (or 'software category' if vendor-agnostic), and the trigger for this audit (renewal, true-up notice, internal compliance review, acquisition)." },
      { id: "licenceDocument", label: "Licence Agreement Document", description: "⚠ File upload recommended. Paste or upload the complete licence agreement text", type: "textarea", required: true, placeholder: "⚠ STRUCTURAL DEVIATION — FILE UPLOAD RECOMMENDED\n\nPaste the complete licence agreement text here or upload PDF/DOCX.\nThe metric definition, true-up clause, and escalation provisions are typically in different sections and cannot be reliably summarised without the full text." },
      { id: "usageContext", label: "Usage Context & Compliance Gap", description: "Current licence metric, internal measurement, discrepancy, true-up date", type: "textarea", required: false, placeholder: "• Current licenced metric as defined in the contract (e.g. named user / concurrent user / CPU socket / revenue band)\n• How that metric is currently being measured internally (describe the counting methodology)\n• Discrepancy between contract definition and internal measurement (if known)\n• True-up date or review period\n• Last true-up invoice amount (€) if available" },
    ],
    outputs: [
      "License Tier Optimization: Recommended user distribution across license tiers",
      "TCO Comparison: Multi-year cost under different scenarios (monthly vs annual vs enterprise)",
      "Contract Term Analysis: Short-term flexibility vs long-term savings trade-off",
      "Vendor Lock-in Score: Assessment with risk mitigation strategies",
      "Negotiation Playbook: Key leverage points and counter-proposals",
      "Break-even Analysis: When does commitment become cost-effective",
      "Scenario Comparison Table: Side-by-side financial projections",
      "Risk-adjusted Recommendation: AI-powered optimal licensing strategy",
    ],
  },

  // ===== 20. CATEGORY RISK EVALUATOR — TYPE 1 =====
  {
    id: "category-risk-evaluator",
    title: "Category Risk Evaluator",
    description: "Comprehensive category risk assessment at tender stage combining SOW analysis, market intelligence, and category dynamics to identify budget and supply risks before commitment.",
    previewDescription: "Assess category-level risk before committing budget. Combines supply market intelligence, supplier concentration analysis, regulatory exposure mapping, and demand forecasting to produce a Category Risk Score with breakdown by dimension. Identifies single points of failure, budget variance risks, and recommended contract terms — giving you a 'proceed / proceed with caution / halt' decision framework at tender stage.",
    icon: FileSearch,
    status: "available",
    category: "risk",
    strategySelector: "skepticism",
    deviationType: 1,
    dataRequirements: {
      title: "What data prevents Value Leakage in Category Risk Evaluation?",
      sections: [
        { heading: "Category & Supply Market Context", description: "Provide category name and description, number of active suppliers, estimated annual spend, and key supply chain geography. Categories assessed only on spend value — ignoring supply chain risk — leave single-source dependencies invisible until a crisis occurs." },
        { heading: "Concentration & Regulatory Exposure", description: "Include supplier concentration (% of spend with top 3 suppliers), regulatory exposure (restricted materials, emissions requirements), historical disruption events, and strategic importance to business." },
        { heading: "Financial Impact", description: "Supply chain disruptions cost large enterprises an average of $184M annually (McKinsey, 2023). Category risk assessment is the primary tool for prevention." },
        { heading: "GDPR Note", description: "Mask exact historical spend by supplier (reveals negotiating position). Use concentration ratios ('top supplier = 60% of spend') rather than absolute values." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry and category being evaluated (direct or indirect)", type: "textarea", required: true, placeholder: "Industry and the specific category being evaluated. Include whether this is a direct (production-critical) or indirect (operational support) category." },
      { id: "categoryProfile", label: "Category Profile & Supply Concentration", description: "Annual spend, supplier count, concentration %, supply geographies, regulatory exposure", type: "textarea", required: true, placeholder: "• Category name and annual spend (€)\n• Number of active suppliers in this category\n• Top supplier: % of total category spend\n• Second supplier: % of total category spend\n• Key supply geographies (country / region)\n• Regulatory exposure: restricted materials / emissions targets / ESG reporting requirements" },
      { id: "riskIndicators", label: "Risk Indicators & Strategic Context", description: "Disruption history, bottlenecks, ESG targets, strategic importance, demand forecast", type: "textarea", required: false, placeholder: "• Historical disruption events affecting this category (type and year)\n• Known supply chain bottlenecks or single points of failure\n• Sustainability / ESG targets applicable to this category\n• Strategic importance: Business-Critical / Important / Routine\n• 3-year business demand forecast for this category: growing / stable / declining" },
    ],
    outputs: [
      "Category Risk Score: Overall risk rating with breakdown by dimension",
      "SOW Ambiguity Report: Vague terms and clauses that could lead to budget overruns",
      "Market Intelligence Brief: Current market dynamics, trends, and pricing outlook",
      "Supply Risk Assessment: Supplier market health and availability analysis",
      "Budget Risk Forecast: Estimated potential cost variance based on category factors",
      "Risk Mitigation Strategy: Tender-stage actions to reduce identified risks",
      "Recommended Contract Terms: Key clauses to include based on category risks",
      "Decision Readiness Score: Assessment of whether tender should proceed",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // GROUP D — STRATEGIC MENTORSHIP
  // ═══════════════════════════════════════════════════════

  // ===== 21. NEGOTIATION PREPARATION — TYPE 0 =====
  {
    id: "negotiation-preparation",
    title: "Preparing for Negotiation",
    description: "Assess buying power, risks, and BATNA to formulate a robust negotiation strategy with tactical recommendations.",
    previewDescription: "Enter a negotiation with a mathematically defined strategy. The AI analyses your BATNA strength, maps the power balance, identifies the supplier's vulnerabilities, and produces a tactical playbook with opening positions, concession sequences, and walk-away triggers. Buyers with structured BATNA/ZOPA preparation achieve 8–12% better commercial outcomes — on a €1M contract, that's €80–120k.",
    icon: Handshake,
    status: "available",
    category: "planning",
    strategySelector: "riskAppetite",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in Negotiation Preparation?",
      sections: [
        { heading: "Supplier's Proposal & Your Target Outcome", description: "Provide the supplier's initial proposal (price and key terms), your target outcome (price, payment terms, scope), and your realistic alternatives (other suppliers or internal option). Without a mathematically defined walk-away point, buyers concede margin under pressure." },
        { heading: "Leverage & Relationship Context", description: "Include supplier's known financial position (public accounts), your volume leverage (% of supplier's revenue you represent), relationship history, pain points, and regulatory leverage (certifications you control)." },
        { heading: "Financial Impact", description: "EIPM: buyers with structured BATNA/ZOPA preparation achieve 8–12% better commercial outcomes than unprepared counterparts. On a €1M contract, that is €80–120k." },
        { heading: "GDPR Note", description: "Mask internal hard limits (walk-away price) if this document will be shared beyond the negotiation team. Use 'Target: [CONFIDENTIAL]' markers in exported outputs." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, category, supplier relationship history, and negotiation context", type: "textarea", required: true, placeholder: "Industry, category, supplier relationship history, and the context of this negotiation (renewal, renegotiation, new contract, post-disruption)." },
      { id: "supplierProposal", label: "Supplier Proposal & Your Position", description: "Supplier's current proposal and your target outcome", type: "textarea", required: true, placeholder: "Summarise the supplier's current proposal: key commercial terms, price position, contract structure, and any conditions attached.\n\nThen state your target outcome: what price, terms, or structure do you want to achieve, and what is your internal mandate (who has approved what)?" },
      { id: "alternativesLeverage", label: "Alternatives & Leverage Factors", description: "BATNA, volume leverage, and supplier vulnerability", type: "textarea", required: true, placeholder: "Your realistic alternatives if this negotiation fails (BATNA) — be specific about what the alternative actually is and its cost/feasibility.\n\nWhat leverage do you hold? (volume, alternative suppliers qualified, contract timing, supplier dependency on your business).\n\nWhat do you know about the supplier's position (margin pressure, capacity, competitive threats)?" },
    ],
    outputs: [
      "Power Balance Analysis: Visual assessment of negotiation leverage",
      "BATNA Strength Score: Rating with improvement recommendations",
      "Risk Assessment: What could go wrong and mitigation strategies",
      "Negotiation Strategy Playbook: Recommended approach based on situation",
      "Tactical Move Sequence: Opening, anchoring, concession strategy",
      "Counter-argument Preparation: Anticipated supplier positions and responses",
      "Walk-away Scenario Plan: When and how to exit negotiations",
      "Value Creation Opportunities: Win-win options to explore",
    ],
  },

  // ===== 22. CATEGORY STRATEGY — TYPE 0 =====
  {
    id: "category-strategy",
    title: "Category Strategy",
    description: "Comprehensive category management analysis with AI-guided insights, best practices from proprietary database, and cross-category analogies.",
    previewDescription: "Develop a full category strategy with Kraljic positioning, market intelligence, and a 3-year roadmap. The AI draws on proprietary best-practice databases and cross-category analogies to recommend strategic options (consolidate, diversify, partner, disintermediate) with pros, cons, and quick-win opportunities. Organisations with active category strategies reduce spend by 6–15% over 3 years versus transactional buying.",
    icon: FolderKanban,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in Category Strategy?",
      sections: [
        { heading: "Category Description & Spend", description: "Provide category description, current annual spend, primary supply market characteristics (competitive, oligopoly, specialist), and strategic importance to business (high/medium/low)." },
        { heading: "3-Year Business Context", description: "Include 3-year business growth plans affecting this category, current supplier relationship quality, sustainability/ESG targets, and regulatory changes on the horizon. Without this, a generic Kraljic plot replaces an actionable roadmap." },
        { heading: "Financial Impact", description: "Organisations with active category strategies reduce category spend by 6–15% over 3 years vs. transactional buying (Hackett Group, 2023)." },
        { heading: "GDPR Note", description: "Scrub M&A plans, divestiture timelines, and structural reorganisation announcements. These constitute inside information if the organisation is publicly listed (MAR)." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, category, and current Kraljic position", type: "textarea", required: true, placeholder: "Industry, the category being strategised, and the current relationship between this category and the business's core operations (strategic / leverage / bottleneck / routine — use Kraljic terminology if known)." },
      { id: "categoryOverview", label: "Category Profile & Supply Market", description: "Annual spend, supplier landscape, market structure, and relationship quality", type: "textarea", required: true, placeholder: "Annual spend and 3-year trend (growing / stable / declining).\nNumber of qualified suppliers and market structure (competitive / oligopoly / monopoly / emerging).\nCurrent supplier relationship quality (transactional / collaborative / strategic partnership).\nKnown supply market risks and opportunities." },
      { id: "strategicGoals", label: "Strategic Objectives & Business Alignment", description: "3-year demand changes, sustainability targets, regulatory horizon, success definition", type: "textarea", required: false, placeholder: "How will business demand for this category change over the next 3 years? (new product launches, geographic expansion, cost reduction mandates).\nSustainability or ESG targets applicable to this category.\nRegulatory changes on the horizon.\nWhat does success look like in 3 years — define it in measurable terms." },
    ],
    outputs: [
      "Kraljic Positioning: Category placement with strategic recommendations",
      "Market Intelligence Brief: Supplier market dynamics and trends",
      "Best Practice Recommendations: Insights from proprietary database and similar categories",
      "Strategic Options Matrix: 3-5 strategy options with pros/cons",
      "Quick Win Opportunities: Immediate actionable improvements",
      "Cross-Category Analogies: Lessons from similar categories in other industries",
      "3-Year Roadmap: Phased implementation plan with milestones",
    ],
  },

  // ===== 23. MAKE VS BUY — TYPE 1H =====
  {
    id: "make-vs-buy",
    title: "Make vs Buy",
    description: "Evaluate whether to produce in-house or outsource based on cost, capability, speed, quality, and strategic fit.",
    previewDescription: "Model the full make-vs-buy decision across five dimensions: cost, capability, speed, quality, and strategic control. The AI compares fully-loaded internal costs against external quotes, assesses IP risk, calculates break-even points, and evaluates exit costs if outsourcing fails. Addresses the #1 cause of post-decision regret: underestimating hidden internal costs or overestimating vendor capability.",
    icon: Scale,
    status: "available",
    category: "analysis",
    strategySelector: "speedVsQuality",
    deviationType: '1H',
    dataRequirements: {
      title: "What data prevents Value Leakage in Make vs. Buy decisions?",
      sections: [
        { heading: "Internal Cost Benchmarks", description: "Gather fully-loaded costs for in-house production: labor, overhead, equipment depreciation, and opportunity cost. Without these, the AI cannot detect hidden cost advantages or flag underestimated internal expenses." },
        { heading: "External Quotes & Market Data", description: "Collect at least 2–3 vendor quotes including unit price, MOQ, lead time, and payment terms. Market benchmarks let the AI identify whether quotes are competitive or inflated." },
        { heading: "Strategic & Capability Factors", description: "Document core competencies, IP sensitivity, quality requirements, and capacity constraints. These qualitative inputs drive the strategic-fit dimension that pure cost analysis misses." },
        { heading: "Timeline & Risk Constraints", description: "Note project deadlines, switching costs, regulatory lead times, and supply-chain risk factors. Missing timeline data is the #1 cause of post-decision Value Leakage in Make vs. Buy." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry and what is being evaluated for make vs. buy", type: "textarea", required: true, placeholder: "Industry and what is being evaluated for make vs. buy: describe the product, service, or process under consideration and why this question is being asked now." },
      { id: "makeCosts", label: "Internal (Make) Cost & Capability", description: "Fully-loaded internal cost, capability assessment, IP risk, and build timeline", type: "textarea", required: true, placeholder: "• Description of what the internal option involves\n• Total internal annual cost — fully loaded (€): include direct labour + materials + overhead + management time\n• Internal capability assessment: full capability / partial capability (describe gap) / no current capability\n• IP and confidentiality risk if outsourced: high / medium / low — explain\n• Time to build internal capability if not currently in place" },
      { id: "buyCosts", label: "External (Buy) Cost & Contract Risk", description: "Vendor quote, transition cost, capability, contract flexibility, exit risk", type: "textarea", required: true, placeholder: "• External vendor quote or market rate (€ per year or per unit)\n• One-time integration and transition cost estimate (€)\n• Vendor capability and track record: proven / emerging / unknown\n• Contract flexibility: month-to-month / locked-in (term and notice period)\n• Exit risk: data portability / migration complexity / switching cost estimate (€)" },
    ],
    outputs: ["Decision Matrix: Comparison across 5 criteria (Price, Speed, Quality, Risk, Control)", "Break-even Chart: Point where in-house becomes more cost-effective than outsourcing"],
  },

  // ===== 24. VOLUME CONSOLIDATION — TYPE 1 =====
  {
    id: "volume-consolidation",
    title: "Volume Consolidation",
    description: "Analyze supplier spend and identify opportunities to consolidate volume for better pricing and reduced complexity.",
    previewDescription: "Model optimal supplier ratios for maximum volume leverage with minimum supply risk. The AI analyses your current spend distribution, calculates consolidation savings at different split ratios (single-source, dual 70/30, triple 80/10/10), and factors in logistics costs, capacity constraints, and contract timelines. A dual-source 70/30 split achieves 90% of volume discount benefits while retaining full supply continuity.",
    icon: Layers,
    status: "available",
    category: "analysis",
    strategySelector: "riskAppetite",
    deviationType: 1,
    dataRequirements: {
      title: "What data prevents Value Leakage in Volume Consolidation?",
      sections: [
        { heading: "Spend Split & Volume per Supplier", description: "Provide current spend split across suppliers in the category, volume per supplier (annual), and the reason for category fragmentation (geography, spec differences, historical). Without this, consolidation modelling cannot identify optimal supplier ratios." },
        { heading: "Logistics & Capacity Data", description: "Include supplier capacity by geography, logistics cost differentials, preferred 'golden ratio' split for risk management (e.g. 70/30 dual-source), and incumbent contract expiry dates." },
        { heading: "Financial Impact", description: "CIPS: dual-source with 70/30 split achieves 90% of volume discount benefits while retaining full supply continuity protection. 100% consolidation destroys the continuity benefit." },
        { heading: "GDPR Note", description: "Mask exact factory locations and proprietary logistics hub coordinates. Use regional references ('Central Europe Hub') rather than specific facility addresses." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, category being consolidated, and reason for current fragmentation", type: "textarea", required: true, placeholder: "Industry, the category being consolidated, and the reason for current fragmentation (geographic, specification differences, legacy relationships, acquisition history)." },
      { id: "consolidationScope", label: "Current Supplier Spend Distribution", description: "List each supplier with spend, % of category, geography, and contract expiry", type: "textarea", required: true, placeholder: "List each supplier using this format, one per line:\nSupplier Reference | Annual Spend (€) | % of Category Total | Primary Geography | Contract Expiry Date\n\nNOTE: use anonymised references (Supplier A, Supplier B) not legal names — minimum 3 suppliers required for consolidation modelling" },
      { id: "consolidationParameters", label: "Consolidation Parameters & Risk Appetite", description: "Target ratio, max concentration, capacity constraints, logistics cost, timeline", type: "textarea", required: false, placeholder: "• Target consolidation ratio (e.g. 70/30 dual-source / 100% single-source / 80/10/10 three-way split)\n• Maximum single-supplier concentration you are willing to accept (%)\n• Supplier capacity constraints by geography\n• Logistics cost differential between suppliers\n• Timeline: when do current contracts expire?" },
    ],
    outputs: ["Bubble Chart Dashboard: Size = spend, axes = price and risk", "Negotiation Script: Volume discount talking points", "Savings Matrix: Comparison with 1/2/3 suppliers"],
  },

  // ===== 25. SUPPLIER DEPENDENCY PLANNER — TYPE 0 =====
  {
    id: "supplier-dependency-planner",
    title: "Supplier Dependency & Exit Planner",
    description: "Assess supplier dependency levels, calculate switching costs, evaluate portfolio concentration, and build diversification or exit roadmaps to reduce strategic risk.",
    previewDescription: "Quantify your lock-in exposure before it becomes leverage against you. The AI maps contractual, technical, and knowledge dependencies, calculates total switching costs (typically underestimated by 300–500%), and builds a phased diversification or exit roadmap. Transforms supplier dependency from an invisible strategic risk into a managed, quantified position with clear de-risking milestones.",
    icon: LogOut,
    status: "available",
    category: "risk",
    strategySelector: "costVsRisk",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in Supplier Dependency Planning?",
      sections: [
        { heading: "Systems & Contract Switching Risk", description: "List all systems/contracts with significant integration or switching risk, contract termination provisions, and estimated switching cost. Technical switching costs are routinely underestimated by 300–500% when data extraction complexity is not assessed." },
        { heading: "Data Portability & Alternatives", description: "Include data portability and export capabilities of current vendor, regulatory requirements for data retention/transfer, and competing alternatives with their integration complexity." },
        { heading: "Financial Impact", description: "Enterprise switching costs average 18–24 months of management time and 25–40% of the original contract value. An unplanned exit doubles these figures." },
        { heading: "GDPR Note", description: "Mask specific legacy system architectures, API credentials, and data volumes that could identify operational vulnerabilities to external parties." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, system/contract/relationship being assessed, and strategic driver", type: "textarea", required: true, placeholder: "Industry, the system, contract, or relationship being assessed for lock-in risk, and the strategic driver (upcoming renewal, risk review, acquisition due diligence)." },
      { id: "dependencyProfile", label: "Dependency Profile", description: "Key systems/contracts with lock-in risk, integration depth, termination provisions", type: "textarea", required: true, placeholder: "List the key systems, contracts, or supplier relationships where you have significant lock-in risk. For each, describe: the nature of the integration or dependency, the contract termination provisions and notice period, and any data or operational assets held by the supplier that you would need to recover." },
      { id: "exitParameters", label: "Exit & De-risking Parameters", description: "Data portability, alternatives, switching cost, regulatory constraints", type: "textarea", required: false, placeholder: "Data portability: can you export your data in a usable format? Describe current export capabilities.\nCompeting alternatives: what are the realistic replacement options and their integration complexity?\nEstimated switching cost (€) if known.\nRegulatory data retention requirements that constrain exit timing." },
    ],
    outputs: [
      "Dependency Score: Overall supplier dependency rating with risk factors",
      "Switching Cost Analysis: Total transition costs including hidden expenses",
      "Portfolio Concentration Report: Category-level supplier diversification analysis",
      "Lock-in Factor Assessment: Evaluation of contractual, technical, and knowledge dependencies",
      "Diversification Roadmap: Step-by-step plan to reduce concentration risk",
      "Exit Roadmap: Detailed transition plan if replacement is the goal",
      "Supplier Positioning Matrix: Your bargaining position vs supplier power",
      "Negotiation Leverage Brief: How exit/diversification options strengthen your position",
      "Risk Mitigation Timeline: Phased approach to reduce dependency while maintaining continuity",
    ],
  },

  // ===== 26. DISRUPTION MANAGEMENT — TYPE 0 =====
  {
    id: "disruption-management",
    title: "Disruption Management",
    description: "Emergency response planning for supply chain disruptions with alternative sourcing strategies.",
    previewDescription: "Activate a structured crisis response when disruption hits. Describe the event and the AI generates a 4-stage recovery algorithm, models financial impact under different delay scenarios, identifies pre-qualified alternative suppliers, and drafts stakeholder communications. Reactive disruption management costs 2.3x more and lasts 40–60% longer than structured responses — this scenario provides the structure in minutes.",
    icon: AlertTriangle,
    status: "available",
    category: "risk",
    strategySelector: "speedVsQuality",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in Disruption Management?",
      sections: [
        { heading: "Nature of Disruption & Inventory Buffer", description: "Describe the disruption (supplier failure, logistics event, geopolitical), affected product lines, and current inventory buffer in weeks of stock. Each hour without a structured plan compounds operational damage exponentially." },
        { heading: "Alternative Suppliers & Response Capabilities", description: "List pre-identified alternative supplier options, customer commitments at risk, cross-functional team availability, and financial reserves for emergency sourcing." },
        { heading: "Financial Impact", description: "Resilinc: the average supply chain disruption costs $184M and lasts 6.4 months when managed reactively. A structured 4-stage response plan reduces duration by 40–60%." },
        { heading: "GDPR Note", description: "Mask exact inventory depletion dates (commercially sensitive with customers) and specific emergency cash reserves (financially sensitive with lenders)." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry and category affected. If live crisis, skip to Block 2", type: "textarea", required: true, placeholder: "Industry and category affected.\nNote: if this is a live crisis, skip detailed industry context and proceed directly to the crisis definition below." },
      { id: "crisisDefinition", label: "Crisis Definition", description: "What has happened, cause, affected categories, geographic scope, severity", type: "textarea", required: true, placeholder: "Describe the disruption: what has happened or is imminent? Include the cause (supplier failure, port closure, geopolitical event, cyberattack, force majeure), the affected product lines or categories, the geographic scope, and the current severity (confirmed disruption / high-probability warning / early signal)." },
      { id: "resourceConstraints", label: "Resource & Constraint Status", description: "Inventory buffer, alternative suppliers, customer commitments at risk, financial reserves", type: "textarea", required: false, placeholder: "Current inventory buffer (weeks of stock remaining).\nAlternative suppliers already identified: yes / no — if yes, briefly describe.\nCustomer contractual commitments at immediate risk (describe, do not include confidential contract values).\nFinancial reserve available for emergency sourcing (€ range).\nCross-functional team available: procurement / operations / finance / legal / comms." },
    ],
    outputs: ["Emergency Map: Step-by-step supply chain recovery algorithm", "Impact Table: Financial losses under different delay scenarios", "Draft Letter: Claim letter or partner assistance request"],
  },

  // ===== 27. BLACK SWAN SCENARIO — TYPE 1 =====
  {
    id: "black-swan-scenario",
    title: "Black Swan Scenario Simulator",
    description: "Assess catastrophic risks with core suppliers and categories. Simulate Black Swan events and build proactive mitigation roadmaps before disruption strikes.",
    previewDescription: "Stress-test your supply chain against catastrophic scenarios before they happen. Select a Black Swan event type (pandemic, embargo, cyberattack, financial collapse) and the AI simulates cascading failures across your supply network, identifies single points of failure, and builds a prioritised mitigation roadmap with early warning indicators. Companies with stress-tested BCP frameworks recover 2.3x faster, preserving millions in revenue.",
    icon: Feather,
    status: "available",
    category: "risk",
    strategySelector: "riskAppetite",
    deviationType: 1,
    dataRequirements: {
      title: "What data prevents Value Leakage in Black Swan Scenario Simulation?",
      sections: [
        { heading: "Core Supply Chain Nodes & Scenario Types", description: "Provide core supply chain nodes (key suppliers, logistics routes, production sites), scenario type to simulate (pandemic, natural disaster, geopolitical embargo, cyberattack), and business continuity plan status." },
        { heading: "RTO/RPO Targets & Financial Reserves", description: "Include Recovery Time Objective (RTO) and Recovery Point Objective (RPO) targets, financial reserve/liquidity buffer, insurance coverage by risk type, and historical precedent events. Without RTO/RPO parameters, scenario planning becomes a theoretical exercise." },
        { heading: "Financial Impact", description: "BCG: companies with stress-tested BCP frameworks recover from major disruptions 2.3x faster than those without, preserving €M in revenue and relationship equity." },
        { heading: "GDPR Note", description: "Mask exact critical cash reserve amounts and specific banking/credit facility details. Use liquidity tier references ('Tier 1 reserve: 3 months OPEX') rather than absolute figures." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry and scope of supply chain being stress-tested", type: "textarea", required: true, placeholder: "Industry and the scope of supply chain being stress-tested: single category / end-to-end supply chain / specific geography / entire procurement operation." },
      { id: "supplyChainTopology", label: "Supply Chain Topology & Scenario", description: "Core nodes, scenario type, severity, and trigger event", type: "textarea", required: true, placeholder: "• Core supply chain nodes to stress-test: list key suppliers, logistics routes, and production sites (use anonymised references)\n• Scenario type: Pandemic / Natural disaster / Geopolitical embargo / Cyberattack / Financial collapse / Regulatory shutdown — select one\n• Scenario severity: Regional / National / Continental / Global\n• Scenario trigger: what specific event initiates the shock?" },
      { id: "resilienceParameters", label: "Resilience Parameters & Recovery Targets", description: "RTO, RPO, financial buffer, BCP status, insurance coverage", type: "textarea", required: false, placeholder: "• RTO — Recovery Time Objective: how quickly must operations resume? (hours / days / weeks)\n• RPO — Recovery Point Objective: what is the maximum acceptable data or inventory loss?\n• Financial liquidity buffer: weeks of operating cost available\n• BCP status: none / partial (describe gaps) / full\n• Insurance coverage by risk type: property / business interruption / cyber / political risk" },
    ],
    outputs: [
      "Black Swan Risk Map: Visual assessment of catastrophic risk exposure",
      "Scenario Simulation Results: Impact modeling for each identified scenario",
      "Vulnerability Assessment: Single points of failure and concentration risks",
      "Cascading Failure Analysis: How one disruption could trigger others",
      "Early Warning Indicators: Signals to monitor for each risk scenario",
      "Response Playbook: Step-by-step crisis response for each scenario",
      "Mitigation Roadmap: Prioritized actions to reduce Black Swan exposure",
      "Diversification Strategy: How to reduce concentration and single-source risk",
      "Investment Recommendation: Cost-benefit analysis of preventive measures",
      "Monitoring Dashboard: Key risk indicators and trigger points",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // GROUP E — REAL-TIME KNOWLEDGE
  // ═══════════════════════════════════════════════════════

  // ===== 28. MARKET SNAPSHOT — TYPE 0 =====
  {
    id: "market-snapshot",
    title: "Market Snapshot",
    description: "Perplexity-powered regional competitive landscape analysis. Identifies major players, market share, and recent moves — then benchmarks output completeness against your Definition of Success.",
    previewDescription: "Get real-time competitive intelligence for any supply market niche and region. Powered by Perplexity web search, the AI identifies major players, estimates market share, profiles recent M&A activity, and benchmarks output completeness against your Definition of Success. Specificity is the lever — a precise query ('automotive-grade MLCC capacitors in DACH') delivers actionable intelligence, not generic summaries.",
    icon: Radar,
    status: "available",
    category: "planning",
    deviationType: 0,
    dataRequirements: {
      title: "What data prevents Value Leakage in Market Snapshots?",
      sections: [
        { heading: "Specific Industry Niche & Region", description: "Provide a specific industry niche (not just 'manufacturing' — be specific, e.g. 'automotive-grade MLCC capacitors'), target geographic region, and timeframe of interest. Vague queries return publicly available summaries that add no competitive advantage." },
        { heading: "Technology Focus & Benchmarks", description: "Include specific technology focus or material sub-segment, known competitors to benchmark, regulatory change signals to monitor, and sustainability/ESG lens if required. Specificity is the lever that unlocks actionable intelligence." },
        { heading: "Financial Impact", description: "A procurement team that identifies a key supplier's acquisition target 3 months before announcement can renegotiate contracts before leverage shifts. Generic market reports cannot deliver this." },
        { heading: "GDPR Note", description: "Do not include why your organisation is researching this niche right now — the strategic rationale is inside information. The query should appear as general market research." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry and procurement context for this market research", type: "textarea", required: false, placeholder: "Industry and the procurement context for this market research (pre-tender market engagement, category review, risk assessment, new category entry)." },
      { id: "region", label: "Region of Analysis", description: "Select the specific country/region to analyze", type: "select", required: true, options: [
        "Germany", "France", "UK", "Netherlands", "Spain", "Italy", "Poland",
        "USA", "Canada", "Mexico", "Brazil",
        "China", "Japan", "South Korea", "India", "Australia",
        "UAE", "Saudi Arabia", "South Africa",
      ] },
      { id: "marketBrief", label: "Market Intelligence Brief", description: "Define the specific market niche, geography, technology/material, and time horizon", type: "textarea", required: true, placeholder: "Define the specific market niche you need intelligence on. Be precise: instead of 'packaging materials,' write 'sustainable secondary packaging for cold-chain pharmaceutical distribution in the EU.'\n\nInclude: target geographic market, the specific technology, material, or service type, and the time horizon of interest (current state / 12-month trend / 3-year outlook)." },
      { id: "intelligencePriorities", label: "Intelligence Priorities", description: "Top 3 intelligence signals most relevant to your decision", type: "textarea", required: false, placeholder: "Prioritise the intelligence signals most relevant to your decision:\n• Recent M&A activity or ownership changes\n• Pricing trends and commodity drivers\n• New entrants or emerging competitors\n• Regulatory or ESG changes affecting the market\n• Supplier financial health signals\n• Technology disruption or innovation\n\nList your top 3 priorities." },
      { id: "timeframe", label: "Timeframe", description: "How recent should the data be?", type: "select", required: false, options: ["Current Snapshot", "Past Month", "Past Quarter", "Past Year"] },
    ],
    outputs: [
      "Regional Competitive Landscape (Major Players & Market Share)",
      "Player Profiles (Strengths, Weaknesses, Recent Moves)",
      "Completeness Scorecard (Definition of Success Benchmark)",
      "Gap Analysis & Clarification Requests",
      "Recommended Sources for Further Discovery",
    ],
  },

  // ===== 29. PRE-FLIGHT AUDIT — TYPE 1H =====
  {
    id: "pre-flight-audit",
    title: "Pre-flight Audit",
    description: "Supplier intelligence gathering before negotiations. Get a comprehensive dossier on any supplier using just their website URL.",
    previewDescription: "Build a comprehensive supplier dossier in minutes. Provide the exact legal entity name and the AI scans financial health signals, litigation history, sanctions lists, ESG violations, M&A activity, and cybersecurity incidents — then produces a negotiation brief with leverage points and a due diligence checklist. A 10-minute pre-flight audit is the lowest-cost risk mitigation tool available, preventing onboarding risks that carry up to €5M in regulatory fines.",
    icon: Radar,
    status: "available",
    category: "planning",
    strategySelector: "skepticism",
    deviationType: '1H',
    dataRequirements: {
      title: "What data prevents Value Leakage in Pre-Flight Supplier Audits?",
      sections: [
        { heading: "Exact Legal Entity Name & Jurisdiction", description: "Provide the exact registered legal entity name (e.g. 'ACME Logistics GmbH', not just 'ACME'), primary jurisdiction (country of incorporation), and category of supply. Brand name vs. legal entity confusion pulls intelligence for the wrong company." },
        { heading: "Specific Risk Areas to Prioritise", description: "Include company registration number (for unambiguous matching), known subsidiary/trading name differences, and specific risk areas to prioritise (financial, ESG, cybersecurity, sanctions)." },
        { heading: "Financial Impact", description: "Onboarding a sanctioned supplier carries up to €5M in regulatory fines (EU Sanctions Regulation). A 10-minute pre-flight audit is the lowest-cost risk mitigation tool available." },
        { heading: "GDPR Note", description: "Legal entity name is required for effective due diligence. Do not include your internal negotiation strategy, target price, or strategic rationale in the query." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Industry, category of supply, and stage of supplier relationship", type: "textarea", required: true, placeholder: "Industry, category of supply, and the stage of the supplier relationship (new onboarding / major contract renewal / post-incident review / acquisition target)." },
      { id: "supplierLegalIdentity", label: "Supplier Legal Identity", description: "Exact legal entity name, country of incorporation, registration number", type: "textarea", required: true, placeholder: "• Exact registered legal entity name — not brand or trading name (e.g. 'ACME Logistics GmbH' not 'ACME')\n• Country of incorporation (not country of operation if different)\n• Company registration number — optional but strongly recommended for unambiguous matching\n• Known trading name if different from legal name\n• Primary jurisdiction of operations if different from country of incorporation" },
      { id: "auditScope", label: "Audit Scope & Risk Priorities", description: "Risk areas to prioritise, specific concerns, time period", type: "textarea", required: false, placeholder: "• Risk areas to prioritise (rank your top 3):\n  Financial distress signals / Litigation and regulatory sanctions / ESG violations and sustainability record / Cybersecurity incidents or data breaches / Sanctions list screening / Beneficial ownership and UBO changes\n• Specific concerns or red flags already identified\n• Time period of particular concern (e.g. 'focus on last 24 months')" },
    ],
    outputs: [
      "Supplier Dossier: Comprehensive intelligence report with verified facts",
      "News Digest: Recent news, lawsuits, mergers, and financial updates",
      "Risk Flags: Identified concerns matched against procurement risk patterns",
      "Negotiation Brief: Key leverage points and talking points for meetings",
      "Due Diligence Checklist: Items to verify during formal evaluation",
    ],
  },
];

// Get scenario by ID
export const getScenarioById = (id: string): Scenario | undefined => {
  return scenarios.find((s) => s.id === id);
};

// Get required fields that are missing data
export const getMissingRequiredFields = (
  scenarioId: string,
  providedData: Record<string, string | number | undefined>
): ScenarioRequiredField[] => {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return [];
  
  return scenario.requiredFields.filter(
    (field) => field.required && (!providedData[field.id] || providedData[field.id] === "")
  );
};

// Get optional fields that are missing (for analysis limitations)
export const getMissingOptionalFields = (
  scenarioId: string,
  providedData: Record<string, string | number | undefined>
): ScenarioRequiredField[] => {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return [];
  
  return scenario.requiredFields.filter(
    (field) => !field.required && (!providedData[field.id] || providedData[field.id] === "")
  );
};

// Get category label
export const getCategoryLabel = (category: Scenario["category"]): string => {
  const labels: Record<Scenario["category"], string> = {
    analysis: "Analysis & Optimization",
    planning: "Planning & Sourcing",
    risk: "Risk Management",
    documentation: "Documentation & Contracts",
  };
  return labels[category];
};
