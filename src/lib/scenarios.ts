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
  icon: LucideIcon;
  status: "available" | "coming-soon";
  category: "analysis" | "planning" | "risk" | "documentation";
  requiredFields: ScenarioRequiredField[];
  outputs: string[];
  strategySelector?: StrategyPresetType;
  dataRequirements?: {
    title: string;
    sections: { heading: string; description: string }[];
  };
}

export const scenarios: Scenario[] = [
  // ===== MAKE VS BUY (already refactored) =====
  {
    id: "make-vs-buy",
    title: "Make vs Buy",
    description: "Evaluate whether to produce in-house or outsource based on cost, capability, speed, quality, and strategic fit.",
    icon: Scale,
    status: "available",
    category: "analysis",
    strategySelector: "speedVsQuality",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, business model, competitive landscape, and any specific constraints the AI should consider", type: "textarea", required: true, placeholder: "E.g., 'We are a mid-size pharmaceutical company in Germany. Regulatory compliance is critical. We have limited in-house manufacturing capacity but strong R&D...'" },
      { id: "projectBrief", label: "The Dilemma (Project Brief)", description: "Describe what you are considering making internally vs. buying externally", type: "textarea", required: true, placeholder: "E.g., Should we build our own CRM internally or buy Salesforce? Or: Should we manufacture this component in-house or outsource to Asia?" },
      { id: "makeCosts", label: "Estimated Internal Costs (Make)", description: "Breakdown of costs if you produce or build in-house", type: "textarea", required: false, placeholder: "E.g., $150k in R&D, $50k in new machinery, requires hiring 2 engineers..." },
      { id: "buyCosts", label: "Estimated External Costs (Buy)", description: "Breakdown of costs if you outsource or purchase externally", type: "textarea", required: false, placeholder: "E.g., Vendor quote is $220k/year, plus $30k implementation fee..." },
      { id: "strategicFactors", label: "Strategic Factors & Constraints", description: "Key strategic considerations, risks, and constraints for this decision", type: "textarea", required: false, placeholder: "E.g., We need to own the IP. Time-to-market is critical (must launch in 3 months)." },
    ],
    outputs: ["Decision Matrix: Comparison across 5 criteria (Price, Speed, Quality, Risk, Control)", "Break-even Chart: Point where in-house becomes more cost-effective than outsourcing"],
  },

  // ===== 1. COST BREAKDOWN =====
  {
    id: "cost-breakdown",
    title: "Cost Breakdown",
    description: "Analyze cost drivers for goods and services, enabling detailed cost modelling and negotiation leverage.",
    icon: PieChart,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry and typical cost structures", type: "textarea", required: true, placeholder: "E.g., 'Aerospace manufacturing. Complex assemblies...'" },
      { id: "productDescription", label: "Product/Service Description", description: "What goods or services are you analyzing?", type: "text", required: true },
      { id: "currentCosts", label: "Known Cost Data & Breakdown", description: "Provide total cost, material, labor, and overhead estimates", type: "textarea", required: true, placeholder: "E.g., Total cost is $150/unit. Roughly 60% material, 25% labor. Annual volume: 10k units." },
      { id: "marketFactors", label: "Market Factors & Benchmarks", description: "Any known profit margins, indices, or logistics costs", type: "textarea", required: false, placeholder: "E.g., Supplier target margin is ~15%. Freight costs are rising." },
    ],
    outputs: ["Cost Waterfall: Visual breakdown of cost components", "Should-Cost Model: Bottom-up cost estimate with benchmarks", "Negotiation Leverage Points: Areas where supplier costs may be inflated", "Sensitivity Analysis: Impact of key cost driver changes"],
  },

  // ===== SPEND ANALYSIS =====
  {
    id: "spend-analysis-categorization",
    title: "Spend Analysis & Categorization",
    description: "Turn messy accounting exports into a strategic procurement dashboard. Paste your top expenses, and AI will map them to standard procurement categories, identify 'tail spend', and spot consolidation opportunities.",
    icon: PieChart,
    status: "available",
    category: "analysis",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, business model, and procurement maturity level", type: "textarea", required: true, placeholder: "E.g., 'Mid-size SaaS company, ~200 employees. No dedicated procurement function. Most purchases handled by department heads with P-cards...'" },
      { id: "rawSpendData", label: "Raw Spend Data (Paste from Excel/CSV)", description: "Paste your top 20-100 expenses. Include Supplier Name, Description/Memo, and Amount. Raw text is perfectly fine.", type: "textarea", required: true, placeholder: "Supplier | Description | Amount\nAWS | Cloud hosting | 45000\nHubSpot | Marketing CRM | 18000\nOffice Depot | Supplies | 3200\n..." },
      { id: "timeframe", label: "Timeframe", description: "What period does this data cover? (e.g., Q3 2025, Last 12 Months)", type: "text", required: false },
      { id: "businessGoal", label: "Strategic Goal", description: "e.g., 'Need to cut OPEX by 10%', 'Looking for vendor consolidation', 'Preparing for an audit'", type: "text", required: false },
    ],
    outputs: ["Spend Taxonomy & Categorization Breakdown", "Tail Spend Identification (High volume, low value)", "Vendor Consolidation Opportunities", "Quick Wins & Strategic Next Steps"],
  },

  // ===== TAIL SPEND =====
  {
    id: "tail-spend-sourcing",
    title: "Tail Spend Rapid Sourcing",
    description: "Quick analysis for low-value purchases to determine the fastest compliant procurement route.",
    icon: ShoppingCart,
    status: "available",
    category: "planning",
    strategySelector: "speedVsQuality",
    dataRequirements: {
      title: "What data prevents Value Leakage in Tail Spend Sourcing?",
      sections: [
        { heading: "Item Description, Quantity & Delivery Date", description: "Provide a clear item/service description, quantity required, and required delivery date. Even for micro-purchases, missing acceptance criteria leads to disputes — total cost of a rework is often 3–5x the original purchase value." },
        { heading: "Quality & Specification Standards", description: "Include quality standards, preferred supplier types (local, certified, diverse), and budget ceiling. Without these, the AI cannot assess compliance against your procurement policy." },
        { heading: "Financial Impact", description: "Tail spend typically represents 20% of addressable spend with 80% of supplier relationships. Poorly executed tail-spend queries multiply transaction costs disproportionately." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, compliance requirements, and procurement policies the AI should consider", type: "textarea", required: true, placeholder: "E.g., 'Financial services company with strict vendor approval process. Most purchases under €5k can use P-card...'" },
      { id: "purchaseAmount", label: "Purchase Amount", description: "Total cost of the purchase", type: "currency", required: true },
      { id: "urgency", label: "Urgency (Days)", description: "How many days until you need this", type: "number", required: true },
      { id: "alternativesExist", label: "Alternatives Exist", description: "Are there substitute products?", type: "select", required: false, options: ["Yes", "No"] },
      { id: "vendorHistory", label: "Current Vendor Landscape & Historical Spend", description: "Context about who you buy this from today and historical pricing.", type: "textarea", required: false, placeholder: "E.g., We usually buy this from Vendor X for $Y, but they are out of stock. Last year we spent $10k on this category..." },
      { id: "technicalSpecs", label: "Technical Specifications / Requirements", description: "Paste any technical requirements, SKUs, or performance criteria.", type: "textarea", required: false, placeholder: "Any specific technical details, specs, or compatibility requirements for the items you are sourcing..." },
    ],
    outputs: ["Action Plan: Direct 'Buy Here' link or 'Launch Tender' recommendation", "Compliance Alert: Notification if purchase violates procurement policy"],
  },

  // ===== SUPPLIER REVIEW =====
  {
    id: "supplier-review",
    title: "Supplier Review",
    description: "Comprehensive supplier performance evaluation with scorecard and improvement planning.",
    icon: ClipboardCheck,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry standards, quality expectations, and relationship priorities", type: "textarea", required: true, placeholder: "E.g., 'Automotive tier-1 supplier. Zero-defect culture, IATF 16949 compliance required. Long-term partnerships valued...'" },
      { id: "qualityScore", label: "Quality Score (0-10)", description: "Overall quality rating", type: "number", required: true },
      { id: "onTimeDelivery", label: "On-Time Delivery %", description: "Percentage of orders delivered on time", type: "percentage", required: true },
      { id: "communicationScore", label: "Communication Score", description: "Responsiveness and clarity (1-10)", type: "number", required: false },
      { id: "priceVsMarket", label: "Price vs Market", description: "How pricing compares to market", type: "select", required: false, options: ["Below Market", "At Market", "Above Market"] },
      { id: "spendVolume", label: "Annual Spend Volume", description: "Total annual spend with supplier", type: "currency", required: true },
      { id: "contractStatus", label: "Contract Status & Expiration", description: "Crucial for determining negotiation leverage.", type: "text", required: false, placeholder: "E.g., Expires in 3 months, Auto-renews next year..." },
      { id: "incidentLog", label: "Critical Incidents & Performance Issues", description: "Qualitative details about supplier failures.", type: "textarea", required: false, placeholder: "Describe specific failures, downtime events, or SLA breaches..." },
    ],
    outputs: ["Supplier Scorecard: Radar diagram of supplier competencies", "PIP Plan: 90-day performance improvement plan", "QBR Script: Scenario for annual business review meeting"],
  },

  // ===== 2. DISRUPTION MANAGEMENT =====
  {
    id: "disruption-management",
    title: "Disruption Management",
    description: "Emergency response planning for supply chain disruptions with alternative sourcing strategies.",
    icon: AlertTriangle,
    status: "available",
    category: "risk",
    strategySelector: "speedVsQuality",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your supply chain complexity and critical dependencies", type: "textarea", required: true },
      { id: "crisisDescription", label: "Crisis Description & Deficit", description: "What is failing and what is the current stock level?", type: "textarea", required: true, placeholder: "E.g., Microchip supplier factory flooded. We only have 14 days of inventory left." },
      { id: "impactAssessment", label: "Impact Assessment", description: "Lost revenue per day, in-transit status, and competitor response", type: "textarea", required: true, placeholder: "E.g., We lose $50k/day if production stops. Force majeure clause is ambiguous." },
      { id: "alternativesContext", label: "Alternatives & Backup Plans", description: "Substitute products or backup suppliers", type: "textarea", required: false, placeholder: "E.g., 2 backup suppliers available but with 15% price premium and 30-day switching time." },
    ],
    outputs: ["Emergency Map: Step-by-step supply chain recovery algorithm", "Impact Table: Financial losses under different delay scenarios", "Draft Letter: Claim letter or partner assistance request"],
  },

  // ===== 3. RISK ASSESSMENT =====
  {
    id: "risk-assessment",
    title: "Risk Assessment",
    description: "Comprehensive risk analysis combining industry dynamics, contract risks, and real-time market situation assessment.",
    icon: Shield,
    status: "available",
    category: "risk",
    strategySelector: "costVsRisk",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your regulatory environment", type: "textarea", required: true },
      { id: "assessmentSubject", label: "Assessment Subject", description: "What supplier or category are you assessing?", type: "text", required: true },
      { id: "currentSituation", label: "Current Situation & Market Risks", description: "Volatility, financials, and recent incidents", type: "textarea", required: true, placeholder: "E.g., $5M annual spend. Market is highly volatile. Supplier had 2 late deliveries last quarter." },
      { id: "contractContext", label: "Contractual Protections", description: "Contract type, liability, and termination rights", type: "textarea", required: false, placeholder: "E.g., 3-year contract, standard liability, index-linked price adjustments." },
      { id: "riskTolerance", label: "Business Criticality & Recovery", description: "Impact of failure and acceptable recovery time", type: "textarea", required: false, placeholder: "E.g., Mission critical. Maximum tolerable downtime is 48 hours." },
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

  // ===== TCO ANALYSIS =====
  {
    id: "tco-analysis",
    title: "Total Cost of Ownership",
    description: "Comprehensive lifecycle cost analysis for complex purchases including acquisition, operation, risks, and exit costs.",
    icon: Calculator,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, asset management practices, and typical ownership periods", type: "textarea", required: true, placeholder: "E.g., 'Manufacturing plant modernization. Assets typically 10-15 year lifecycle. Strong focus on OEE and uptime. Limited in-house maintenance capability...'" },
      { id: "assetDescription", label: "Asset/Purchase Description", description: "What are you evaluating?", type: "text", required: true },
      { id: "ownershipPeriod", label: "Ownership Period (Years)", description: "Expected useful life or evaluation period", type: "number", required: true },
      { id: "capexBreakdown", label: "Upfront Costs (CAPEX)", description: "List all one-time acquisition costs in free text", type: "textarea", required: true, placeholder: "E.g., Purchase price: $125k. Installation: $15k. One-time training: $5k..." },
      { id: "opexBreakdown", label: "Recurring/Operating Costs (OPEX)", description: "List all ongoing costs in free text", type: "textarea", required: true, placeholder: "E.g., Annual maintenance: $25k/yr. Energy consumption: ~$1.2k/mo. Consumables: $4k/yr..." },
      { id: "riskFactors", label: "Risks, Downtime & End-of-Life Costs", description: "Describe vendor lock-in, downtime impact, residual value, and other risk factors", type: "textarea", required: false, placeholder: "E.g., High vendor lock-in risk. Hourly downtime costs $5k. Estimated salvage value in 5 years is $10k..." },
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

  // ===== 4. SOFTWARE LICENSING =====
  {
    id: "software-licensing",
    title: "Software Licensing Structure",
    description: "Evaluate different software licensing models, multi-tier user needs, contract terms, and vendor lock-in to optimize software investments.",
    icon: KeyRound,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
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
      { id: "industryContext", label: "Industry & Business Context", description: "IT governance and compliance rules", type: "textarea", required: true },
      { id: "softwareDetails", label: "Software Details", description: "Name, category, and current solution (if replacing)", type: "textarea", required: true, placeholder: "E.g., Salesforce CRM. Replacing our legacy in-house system." },
      { id: "userMetrics", label: "User Tiers & Growth", description: "Total seats, power users vs occasional, growth rate", type: "textarea", required: true, placeholder: "E.g., 500 total users. 100 power users, 400 occasional. Expected 10% annual growth." },
      { id: "commercialTerms", label: "Pricing & Contract Terms", description: "Per-user cost, contract length, and implementation fees", type: "textarea", required: false, placeholder: "E.g., $150/user/month. Vendor pushing for a 3-year lock-in with 5% annual escalation." },
      { id: "strategicFactors", label: "Lock-in & Alternatives", description: "Integration depth, data exportability, and viable alternatives", type: "textarea", required: false, placeholder: "E.g., Deep ERP integration required. Exporting data is difficult. 2 viable alternatives exist." },
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

  // ===== 5. RISK MATRIX =====
  {
    id: "risk-matrix",
    title: "Risk Matrix",
    description: "Supplier risk assessment covering legal, financial, cyber, and operational risks.",
    icon: Shield,
    status: "available",
    category: "risk",
    strategySelector: "costVsRisk",
    dataRequirements: {
      title: "What data prevents Value Leakage in Risk Matrix analysis?",
      sections: [
        { heading: "Risk List with Probability & Impact", description: "Provide a minimum of 5 identified risks with estimated probability (High/Medium/Low) and impact (High/Medium/Low) for each. Without these, the AI defaults to generic ratings that provide no actionable prioritisation." },
        { heading: "Existing Controls & Risk Ownership", description: "Document existing control measures in place, risk owner assignments, target residual risk after mitigation, and review frequency. This transforms a static matrix into a living risk management tool." },
        { heading: "Financial Impact", description: "A risk matrix without user-provided probability and impact inputs produces a colour-coded chart with no decision value. Proper inputs enable prioritised mitigation that protects against cascading failures." },
      ],
    },
    requiredFields: [
      { id: "industryContext", label: "Industry & Context", description: "Describe your industry, regulatory environment, and risk tolerance culture", type: "textarea", required: true },
      { id: "supplierName", label: "Supplier Name", description: "Name of the supplier being assessed", type: "text", required: true },
      { id: "operationalRisks", label: "Operational & Cyber Risks", description: "Data access, environmental, and cybersecurity posture", type: "textarea", required: true, placeholder: "E.g., They process sensitive patient data. Cybersecurity is adequate but no SOC2. No recent site audits." },
      { id: "commercialRisks", label: "Commercial & Legal Risks", description: "Financial health, lawsuits, and revenue concentration", type: "textarea", required: false, placeholder: "E.g., Financials look stable, but we represent 40% of their revenue. No active lawsuits." },
    ],
    outputs: ["Risk Heatmap: Probability vs Impact matrix", "Mitigation Plan: Risk reduction action list", "Traffic Light Status: Green/Yellow/Red recommendation"],
  },

  // Page 2 Scenarios

  // ===== 14. SOW CRITIC =====
  {
    id: "sow-critic",
    title: "SOW Critic",
    description: "AI-powered Statement of Work review to identify gaps, ambiguities, and protection issues.",
    icon: FileText,
    status: "available",
    category: "documentation",
    strategySelector: "skepticism",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, typical contract risks, and protection priorities", type: "textarea", required: true, placeholder: "E.g., 'IT consulting services. IP ownership and liability caps are critical. We typically push back on unlimited liability...'" },
      { id: "sowText", label: "SOW Text", description: "Paste the Statement of Work text", type: "textarea", required: true, placeholder: "Paste the full SOW document here..." },
      { id: "reviewPriorities", label: "Review Priorities & Known Concerns", description: "What specific issues or clauses concern you?", type: "textarea", required: false, placeholder: "E.g., Concerned about IP ownership, unclear liability caps, and missing change request process. Deliverables are vague." },
    ],
    outputs: ["Redlining: Track-changes style markup", "Scorecard: Contract protection score (0-100%)", "Checklist: Questions to clarify gray areas"],
  },

  // ===== 15. SLA DEFINITION =====
  {
    id: "sla-definition",
    title: "SLA Definition",
    description: "Generate comprehensive Service Level Agreement terms with metrics, targets, and escalation procedures.",
    icon: Clock,
    status: "available",
    category: "documentation",
    strategySelector: "costVsRisk",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry standards, typical SLA expectations, and service criticality", type: "textarea", required: true, placeholder: "E.g., 'E-commerce platform. 99.9% uptime is industry standard. Peak traffic during holidays requires special provisions...'" },
      { id: "serviceDescription", label: "Service Description & Criticality", description: "What service and how critical is it?", type: "textarea", required: true, placeholder: "E.g., Cloud hosting for our e-commerce platform. Mission critical -- 99.9% uptime required. 24/7 operation." },
      { id: "performanceTargets", label: "Performance Targets & Response Times", description: "Response, resolution, and availability targets", type: "textarea", required: true, placeholder: "E.g., P1 response: 15 min. P2: 1 hour. Resolution: 4h for critical. Allowed downtime: 0.1%/month." },
      { id: "escalationAndPenalties", label: "Escalation, Penalties & Bonuses", description: "Escalation paths and financial consequences", type: "textarea", required: false, placeholder: "E.g., Tier 1 to Tier 2 after 2h. 5% credit for SLA breach. Bonus: free month for zero incidents." },
    ],
    outputs: ["SLA Table: Metrics, targets, and financial penalties", "Decision Tree: Incident response by severity level", "Draft Agreement: Ready-to-use service quality appendix"],
  },

  // ===== RFP GENERATOR =====
  {
    id: "rfp-generator",
    title: "RFP Generator (Tender Package)",
    description: "Paste your procurement brief or requirements and select which tender documents to generate. EXOS extracts key details automatically and produces a complete, ready-to-send tender package.",
    icon: FileSpreadsheet,
    status: "available",
    category: "documentation",
    strategySelector: "speedVsQuality",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry and procurement standards. Auto-injected if set in context settings.", type: "textarea", required: false, placeholder: "E.g., 'Government contractor with FAR compliance. Manufacturing sector with ISO 9001 requirements...'" },
      { id: "rawBrief", label: "Project Brief & Scope", description: "Paste your internal brief, email thread, or requirements doc. EXOS will extract procurement subject, location, volume, deadlines, and technical specs automatically.", type: "textarea", required: true, placeholder: "Example:\n\nWe need to source a new logistics partner for our Berlin warehouse. Volume is ~500 pallets/month, mostly FMCG goods. Current contract expires June 2026. Budget is around €180k/year. Must have GDP certification and 24/7 cold chain capability. Prefer providers with existing DACH network.\n\nPaste your full brief here — the more detail, the better the output." },
      { id: "budgetRange", label: "Budget Range / Constraints", description: "Optional: Approximate budget or spending limits. Helps EXOS calibrate requirements appropriately.", type: "text", required: false, placeholder: "€150k-200k annually" },
      { id: "evaluationPriorities", label: "Evaluation Priorities", description: "Optional: Key scoring priorities (e.g., 'Price 40%, Quality 30%, Delivery 20%, Sustainability 10%'). If omitted, EXOS suggests balanced weights.", type: "textarea", required: false, placeholder: "Price 40%, Quality 30%, Delivery 20%, Sustainability 10%" },
      { id: "technicalRequirements", label: "Technical Specs & Volumes", description: "Optional: Specific technical requirements, quantities, or SKUs that the AI should incorporate.", type: "textarea", required: false, placeholder: "E.g., 50 MacBooks (M3, 32GB RAM), 15,000 tons of rebar, or specific SKUs..." },
      { id: "incumbentData", label: "Current Suppliers & Baseline Data", description: "Optional: Current vendor details, pricing, and performance baselines for benchmarking.", type: "textarea", required: false, placeholder: "E.g., Currently using Vendor X, paying $Y per unit, current lead time is 3 weeks..." },
      { id: "additionalInstructions", label: "Additional Instructions or Constraints", description: "Anything else EXOS should know: compliance requirements, preferred suppliers, formatting preferences, NDA needs, etc.", type: "textarea", required: false, placeholder: "E.g., 'Must include NDA clause. Prefer suppliers with EU data residency. Response deadline should be 3 weeks.'" },
    ],
    outputs: [
      "Extracted Brief Summary (Auto-parsed from raw input)",
      "Tender Document(s) (Based on selected package type)",
      "Evaluation Matrix (Weighted scoring framework)",
      "Clarifications & Recommendations (Missing data flags + next steps)",
      "Suggested Attachments & Templates",
    ],
  },

  // ===== 6. REQUIREMENTS GATHERING =====
  {
    id: "requirements-gathering",
    title: "Requirements Gathering",
    description: "Structure business needs into prioritized requirements with user stories and solution recommendations.",
    icon: ListChecks,
    status: "available",
    category: "planning",
    strategySelector: "skepticism",
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
      { id: "industryContext", label: "Industry Context", description: "Describe your industry, technology maturity, and organizational constraints", type: "textarea", required: true },
      { id: "businessGoal", label: "Business Goal & Budget", description: "Problem to solve and budget constraints", type: "textarea", required: true, placeholder: "E.g., Need to automate AP processes. Budget is ~$50k/year." },
      { id: "technicalLandscape", label: "IT Landscape & Constraints", description: "Users, security, and systems to integrate", type: "textarea", required: true, placeholder: "E.g., 50 users. Must integrate with SAP. Highly restricted data security." },
      { id: "featureRequirements", label: "Feature Requirements", description: "Must-haves vs Nice-to-haves", type: "textarea", required: false, placeholder: "E.g., Must have: OCR invoice scanning, multi-currency. Nice to have: mobile app approvals." },
    ],
    outputs: ["MoSCoW Matrix: Requirements prioritized by importance", "User Stories: Test scenarios for product validation", "Market Scan: 3-5 solutions matching requirements"],
  },

  // Page 3 Scenarios

  // ===== 7. VOLUME CONSOLIDATION =====
  {
    id: "volume-consolidation",
    title: "Volume Consolidation",
    description: "Analyze supplier spend and identify opportunities to consolidate volume for better pricing and reduced complexity.",
    icon: Layers,
    status: "available",
    category: "analysis",
    strategySelector: "riskAppetite",
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
      { id: "industryContext", label: "Industry Context", description: "Describe your industry, supply chain characteristics, and consolidation constraints", type: "textarea", required: true },
      { id: "consolidationScope", label: "Spend & SKU Overlap", description: "Annual spend per vendor and product overlap", type: "textarea", required: true, placeholder: "E.g., Vendor A: $1.2M. Vendor B: $800k. Roughly 60% SKU overlap in MRO supplies." },
      { id: "logisticsTerms", label: "Logistics & Payment Terms", description: "Delivery distances, reliability, and payment terms", type: "textarea", required: false, placeholder: "E.g., Vendor A is local (Net-30). Vendor B is 500 miles away (Net-60) but more reliable." },
      { id: "growthForecast", label: "Volume Forecast & Penalties", description: "Expected growth and underdelivery penalties", type: "textarea", required: false, placeholder: "E.g., Expecting 15% volume growth next year. Current penalty for late delivery is 2%." },
    ],
    outputs: ["Bubble Chart Dashboard: Size = spend, axes = price and risk", "Negotiation Script: Volume discount talking points", "Savings Matrix: Comparison with 1/2/3 suppliers"],
  },

  // ===== 8. CAPEX VS OPEX =====
  {
    id: "capex-vs-opex",
    title: "Capex vs Opex (Lease/Buy)",
    description: "Financial comparison between purchasing assets versus leasing with NPV and cash flow analysis.",
    icon: Building,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
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
      { id: "industryContext", label: "Industry Context", description: "Describe your industry, capital constraints, and asset utilization patterns", type: "textarea", required: true },
      { id: "assetDetails", label: "Asset & Pricing Details", description: "Purchase price vs Lease rate and term", type: "textarea", required: true, placeholder: "E.g., Purchase: $500k. Lease: 6% rate over 5 years." },
      { id: "lifecycleCosts", label: "Lifecycle Costs", description: "Maintenance, energy, training, and residual value", type: "textarea", required: false, placeholder: "E.g., $20k annual maintenance. Expected residual value after 5 years is $80k." },
      { id: "financialParameters", label: "Financial Parameters", description: "WACC, property tax, and inflation", type: "textarea", required: false, placeholder: "E.g., 8% discount rate (WACC). 2% property tax." },
    ],
    outputs: ["NPV Waterfall Graph: 5-year total cost comparison", "Flexibility Matrix: Upgrade options vs ownership", "CFO Recommendation: Cash flow preservation advice"],
  },

  // ===== 13. SAVINGS CALCULATION =====
  {
    id: "savings-calculation",
    title: "Savings Calculation",
    description: "Document and validate procurement savings with inflation adjustment and audit-ready reporting.",
    icon: Calculator,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, savings reporting standards, and audit requirements", type: "textarea", required: true },
      { id: "savingsScenario", label: "Savings Scenario & Baseline", description: "Describe the deal: old price, new price, volume, contract term", type: "textarea", required: true, placeholder: "E.g., Negotiated widget price from $120 to $105/unit. Annual volume: 10,000 units. 3-year contract." },
      { id: "costAdjustments", label: "Cost Adjustments & Hidden Costs", description: "Inflation, FX, switching costs, quality changes", type: "textarea", required: true, placeholder: "E.g., Inflation at 4%. FX impact: EUR/USD hedge. Switching costs: $25k one-time. Quality defect rate expected to drop." },
      { id: "reportingRequirements", label: "Reporting & Audit Requirements", description: "How savings are documented and validated", type: "textarea", required: false, placeholder: "E.g., Finance requires documented baseline and auditable methodology. Need hard vs soft savings split." },
    ],
    outputs: ["Executive Summary: Hard vs Soft savings breakdown", "Progress Dashboard: Annual savings goal tracker", "Audit Report: PDF with inflation adjustment documentation"],
  },

  // ===== 9. SAAS OPTIMIZATION =====
  {
    id: "saas-optimization",
    title: "SaaS Optimization",
    description: "Identify unused licenses, duplicate tools, and right-sizing opportunities for software subscriptions.",
    icon: Cloud,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
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
      { id: "industryContext", label: "Industry Context", description: "Describe your industry, IT governance model, and software management practices", type: "textarea", required: true },
      { id: "subscriptionDetails", label: "Subscription Details", description: "Total seats, price, and contract end date", type: "textarea", required: true, placeholder: "E.g., 200 seats at $45/mo. Contract ends in 4 months. 60-day notice required." },
      { id: "usageMetrics", label: "Usage & Engagement", description: "Logins, feature usage, and SSO status", type: "textarea", required: true, placeholder: "E.g., Connected to Okta. Only 120 users logged in last month. Low feature utilization." },
      { id: "redundancyContext", label: "Redundancy & Support", description: "Duplicate apps and support tier", type: "textarea", required: false, placeholder: "E.g., Premium support. Overlaps heavily with our existing Microsoft 365 licenses." },
    ],
    outputs: ["Kill List: Licenses to remove with user names", "Tier Mismatch Chart: Overpayment for unused features", "Duplicate Matrix: Comparison of overlapping services"],
  },

  // ===== FORECASTING =====
  {
    id: "forecasting-budgeting",
    title: "Predictive Budgeting & Forecasting",
    description: "Combines your internal historical spend with external Market Intelligence. AI detects hidden seasonality, applies real-time industry inflation trends, and generates Best/Base/Worst case budget scenarios.",
    icon: TrendingUp,
    status: "available",
    category: "planning",
    strategySelector: "costVsRisk",
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
      { id: "industryContext", label: "Industry Context", description: "Auto-injected industry background", type: "text", required: false },
      { id: "categoryContext", label: "Category Context & Market Intelligence", description: "Auto-injected market trends and category benchmarks", type: "text", required: false },
      { id: "historicalSpendData", label: "Historical Spend Data (Paste from Excel)", description: "Paste 1-3 years of spend data (monthly/quarterly). Raw text with Category, Date, and Amount is fine.", type: "textarea", required: true },
      { id: "knownFutureEvents", label: "Known Future Events & Business Plans", description: "e.g., Hiring 15 new devs in Q2, opening a new office, major software renewals.", type: "textarea", required: true },
      { id: "budgetConstraints", label: "Hard Constraints or Directives", description: "e.g., 'Mandate to cut OPEX by 10%', 'Software budget capped at $50k'.", type: "text", required: false },
      { id: "forecastHorizon", label: "Forecast Horizon", description: "How far ahead are we planning?", type: "select", required: true, options: ["Next Quarter", "Next 6 Months", "Next 12 Months", "Next 24 Months"] },
    ],
    outputs: [
      "Baseline Trend (Internal Data Extrapolation)",
      "Market Intelligence Overlay (External Inflation & Risks)",
      "Scenario 1: Base Case (Expected Spend)",
      "Scenario 2: Stress Test (Worst Case & Triggers)",
      "Actionable Budget Optimization Steps",
    ],
  },

  // ===== 10. CATEGORY STRATEGY =====
  {
    id: "category-strategy",
    title: "Category Strategy",
    description: "Comprehensive category management analysis with AI-guided insights, best practices from proprietary database, and cross-category analogies.",
    icon: FolderKanban,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, market dynamics, and category management maturity", type: "textarea", required: true },
      { id: "categoryOverview", label: "Category Overview", description: "Name, annual spend, and supplier count", type: "textarea", required: true, placeholder: "E.g., IT Hardware. $4M annual spend across 15 suppliers." },
      { id: "marketDynamics", label: "Market Dynamics & Risk", description: "Market structure, supply risk, and business impact", type: "textarea", required: true, placeholder: "E.g., Oligopoly market. High business impact. Moderate supply risk due to chip shortages." },
      { id: "strategicGoals", label: "Strategy, Pain Points & Innovation", description: "Current strategy, pain points, and historical savings", type: "textarea", required: false, placeholder: "E.g., Current strategy is spot buying. Pain points: volatile pricing. Need to implement circular economy recycling." },
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

  // ===== NEGOTIATION PREPARATION =====
  {
    id: "negotiation-preparation",
    title: "Preparing for Negotiation",
    description: "Assess buying power, risks, and BATNA to formulate a robust negotiation strategy with tactical recommendations.",
    icon: Handshake,
    status: "available",
    category: "planning",
    strategySelector: "riskAppetite",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, typical supplier relationships, and negotiation culture", type: "textarea", required: true, placeholder: "E.g., 'Automotive OEM. Long-term supplier relationships valued. Negotiations typically annual. German Mittelstand suppliers prefer partnership approach...'" },
      { id: "negotiationSubject", label: "Negotiation Subject", description: "What are you negotiating?", type: "text", required: true },
      { id: "currentSpend", label: "Current/Expected Spend", description: "Annual value of the deal", type: "currency", required: true },
      { id: "supplierName", label: "Supplier Name", description: "Who are you negotiating with?", type: "text", required: true },
      { id: "relationshipHistory", label: "Relationship History", description: "How long and how well have you worked together?", type: "select", required: false, options: ["New Supplier", "1-2 Years", "3-5 Years", "Long-term Partner (5+ years)"] },
      { id: "batna", label: "Your BATNA", description: "Best Alternative To Negotiated Agreement - what's your backup plan?", type: "textarea", required: true, placeholder: "E.g., 'Can switch to Supplier B within 6 months. Would cost €50k transition but saves 8% annually...'" },
      { id: "negotiationObjectives", label: "Primary Objectives", description: "What do you want to achieve? List top 3 priorities", type: "textarea", required: true, placeholder: "E.g., '1) 5% price reduction, 2) Extended payment terms to Net-60, 3) Guaranteed capacity for peak season...'" },
      { id: "mustHaves", label: "Must-Haves (Walk-away Points)", description: "Non-negotiable requirements", type: "textarea", required: false, placeholder: "E.g., 'Minimum 3% price reduction, keep same quality specs, no exclusivity clause...'" },
      { id: "timeline", label: "Negotiation Timeline", description: "When must this be concluded?", type: "select", required: false, options: ["Urgent (<1 month)", "Normal (1-3 months)", "Flexible (3-6 months)", "Strategic (6+ months)"] },
      { id: "spendBreakdown", label: "Spend Breakdown & Current Pricing Baseline", description: "Critical for the AI to calculate specific savings projections.", type: "textarea", required: false, placeholder: "E.g., Breakdown by hardware/SaaS, top 5 SKUs, current hourly rates, or existing payment terms..." },
      { id: "leverageContext", label: "Market Alternatives & Leverage Context", description: "Consolidates alternatives, buying power, and dependencies into free-text context.", type: "textarea", required: false, placeholder: "Any known competitors, switching costs, dependencies on this supplier, or internal business constraints..." },
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

  // ===== 16. PROCUREMENT PROJECT PLANNING =====
  {
    id: "procurement-project-planning",
    title: "Procurement Project Planning",
    description: "Analyze project inputs, outputs, and constraints to set strategic priorities using proven strategic analysis methods.",
    icon: Target,
    status: "available",
    category: "planning",
    strategySelector: "speedVsQuality",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, organizational structure, and strategic planning culture", type: "textarea", required: true },
      { id: "projectBrief", label: "Project Brief & Objectives", description: "Project name, primary goal, scope, and boundaries", type: "textarea", required: true, placeholder: "E.g., 'Strategic Sourcing Transformation' -- Reduce procurement costs by 15% over 3 years. Scope: All indirect spend in North America." },
      { id: "constraintsAndResources", label: "Constraints, Resources & Stakeholders", description: "Budget, team, timeline, and key stakeholders", type: "textarea", required: true, placeholder: "E.g., Budget: $500k. Team: 3 FTEs. Timeline: 12 months. Key stakeholders: CPO, CFO, Operations." },
      { id: "risksAndSuccess", label: "Risks, Dependencies & Success Criteria", description: "Known risks and how success will be measured", type: "textarea", required: false, placeholder: "E.g., Risk: scope creep, change resistance. Success: 15% savings achieved, 80% stakeholder adoption." },
    ],
    outputs: ["SWOT Analysis: Strengths, weaknesses, opportunities, threats for the project", "Priority Matrix: Critical vs nice-to-have activities mapped by effort/impact", "Stakeholder Map: Influence/interest matrix with engagement strategy", "Critical Path: Key milestones and decision points", "Risk Register: Prioritized risks with mitigation strategies"],
  },

  // ===== 17. PRE-FLIGHT AUDIT =====
  {
    id: "pre-flight-audit",
    title: "Pre-flight Audit",
    description: "Supplier intelligence gathering before negotiations. Get a comprehensive dossier on any supplier using just their website URL.",
    icon: Radar,
    status: "available",
    category: "planning",
    strategySelector: "skepticism",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry and what aspects of the supplier are most important to investigate", type: "textarea", required: true },
      { id: "supplierIdentity", label: "Supplier Identity & Website", description: "Company name, URL, and planned purchase", type: "textarea", required: true, placeholder: "E.g., Acme Corp (www.acme.com). New supplier. Planning to purchase IT managed services, ~$500k/year." },
      { id: "researchScope", label: "Research Focus & Known Concerns", description: "What to investigate and any red flags", type: "textarea", required: true, placeholder: "E.g., Focus on financial health and legal history. Heard rumors of cash flow issues. CEO recently changed." },
      { id: "decisionContext", label: "Decision Timeline & Relationship Context", description: "Urgency and existing relationship status", type: "textarea", required: false, placeholder: "E.g., Need intelligence within 2 weeks. Currently no relationship. Strategic partnership potential." },
    ],
    outputs: [
      "Supplier Dossier: Comprehensive intelligence report with verified facts",
      "News Digest: Recent news, lawsuits, mergers, and financial updates",
      "Risk Flags: Identified concerns matched against procurement risk patterns",
      "Negotiation Brief: Key leverage points and talking points for meetings",
      "Due Diligence Checklist: Items to verify during formal evaluation",
    ],
  },

  // ===== 18. CATEGORY RISK EVALUATOR =====
  {
    id: "category-risk-evaluator",
    title: "Category Risk Evaluator",
    description: "Comprehensive category risk assessment at tender stage combining SOW analysis, market intelligence, and category dynamics to identify budget and supply risks before commitment.",
    icon: FileSearch,
    status: "available",
    category: "risk",
    strategySelector: "skepticism",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, typical contract risks, and category importance", type: "textarea", required: true },
      { id: "categoryAndTender", label: "Category, Tender Stage & Contract Value", description: "Category name, procurement stage, and estimated value", type: "textarea", required: true, placeholder: "E.g., IT Services for banking digital transformation. RFP active. Estimated value: $2M. Fixed price contract." },
      { id: "sowAndMarket", label: "SOW Summary & Market Dynamics", description: "Scope details and market conditions", type: "textarea", required: true, placeholder: "E.g., Scope includes cloud migration and app modernization. Market is consolidating. Skills shortage driving prices up." },
      { id: "historicalRisks", label: "Past Issues & Category Risks", description: "Historical problems and known risk factors", type: "textarea", required: false, placeholder: "E.g., Previous vendor went bankrupt. Significant scope creep on similar projects. High regulatory exposure." },
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

  // ===== 11. SUPPLIER DEPENDENCY PLANNER =====
  {
    id: "supplier-dependency-planner",
    title: "Supplier Dependency & Exit Planner",
    description: "Assess supplier dependency levels, calculate switching costs, evaluate portfolio concentration, and build diversification or exit roadmaps to reduce strategic risk.",
    icon: LogOut,
    status: "available",
    category: "risk",
    strategySelector: "costVsRisk",
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
      { id: "industryContext", label: "Industry Context", description: "Describe your industry, supply chain complexity, and strategic concerns", type: "textarea", required: true },
      { id: "dependencyContext", label: "Dependency Baseline", description: "Supplier name, category, spend, and revenue share", type: "textarea", required: true, placeholder: "E.g., VendorX provides core APIs. $2M spend. We are ~25% of their revenue. Highly strategic." },
      { id: "lockInFactors", label: "Lock-in Factors", description: "Contract terms, data portability, and knowledge dependency", type: "textarea", required: true, placeholder: "E.g., 3-year contract. Deep system integration. They hold significant institutional knowledge." },
      { id: "diversificationGoals", label: "Alternatives & Diversification Goal", description: "Available alternatives, switching costs, and timeline", type: "textarea", required: false, placeholder: "E.g., 2 viable alternatives. Estimated $150k switching cost. Goal: Add a backup supplier within 12 months." },
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

  // ===== 19. SPECIFICATION OPTIMIZER =====
  {
    id: "specification-optimizer",
    title: "Specification Optimizer",
    description: "Analyze technical specifications for 'gold plating' - excessive requirements that limit supplier options and unnecessarily inflate costs.",
    icon: Sparkles,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry and the purpose of this specification", type: "textarea", required: true },
      { id: "specificationText", label: "Technical Specification", description: "Paste the technical specification or requirements document", type: "textarea", required: true, placeholder: "Paste your technical specification here. Include material requirements, performance specs, certifications, tolerances, etc..." },
      { id: "specContext", label: "Specification Context & Source", description: "Who wrote it, when, and how many suppliers can meet it?", type: "textarea", required: true, placeholder: "E.g., Equipment spec from engineering team, last reviewed 4 years ago. Safety critical. Only 2 suppliers can meet current spec. Estimated purchase: $500k." },
      { id: "optimizationGoals", label: "Optimization Goals & Constraints", description: "What you want to achieve without compromising", type: "textarea", required: false, placeholder: "E.g., Want to open spec to more suppliers without compromising safety. Tolerances may be over-specified. Looking for 15-20% cost reduction." },
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

  // ===== 12. BLACK SWAN SCENARIO =====
  {
    id: "black-swan-scenario",
    title: "Black Swan Scenario Simulator",
    description: "Assess catastrophic risks with core suppliers and categories. Simulate Black Swan events and build proactive mitigation roadmaps before disruption strikes.",
    icon: Feather,
    status: "available",
    category: "risk",
    strategySelector: "riskAppetite",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, supply chain complexity, and past disruption experiences", type: "textarea", required: true },
      { id: "assessmentScope", label: "Scope & Exposure", description: "What is being assessed and the financial exposure", type: "textarea", required: true, placeholder: "E.g., Assessing our Asian PCB suppliers. $18M annual exposure. Catastrophic business impact if disrupted." },
      { id: "riskPosture", label: "Current Risk Posture", description: "Single-source items, inventory buffers, and visibility", type: "textarea", required: true, placeholder: "E.g., 14 single-sourced items. 3 weeks of safety stock. No visibility past Tier 1." },
      { id: "scenarioSimulation", label: "Scenarios & Response Capabilities", description: "Events to simulate and current response readiness", type: "textarea", required: false, placeholder: "E.g., Simulate a port strike or regional conflict. We have no pre-qualified backups and minimal crisis budget." },
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

  // ===== 20. MARKET SNAPSHOT =====
  {
    id: "market-snapshot",
    title: "Market Snapshot",
    description: "Perplexity-powered regional competitive landscape analysis. Identifies major players, market share, and recent moves — then benchmarks output completeness against your Definition of Success.",
    icon: Radar,
    status: "available",
    category: "planning",
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
      { id: "industryContext", label: "Industry Context", description: "Auto-injected industry background for grounding", type: "text", required: false },
      { id: "region", label: "Region of Analysis", description: "Select the specific country/region to analyze", type: "select", required: true, options: [
        "Germany", "France", "UK", "Netherlands", "Spain", "Italy", "Poland",
        "USA", "Canada", "Mexico", "Brazil",
        "China", "Japan", "South Korea", "India", "Australia",
        "UAE", "Saudi Arabia", "South Africa",
      ] },
      { id: "analysisScope", label: "Analysis Scope", description: "What do you want to know about this market?", type: "textarea", required: true, placeholder: "E.g., 'Top 5 logistics providers, their market share, pricing models, and recent M&A activity'" },
      { id: "successCriteria", label: "Definition of Success (Optional)", description: "What does a good answer look like? AI will auto-generate criteria if left blank.", type: "textarea", required: false, placeholder: "E.g., 'Must include revenue figures, market share %, and at least 3 cited sources per player'" },
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

  // ===== 21. CONTRACT TEMPLATE =====
  {
    id: "contract-template",
    title: "Contract Template Generator",
    description: "Generate country-specific contract templates for EU procurement. Select your time investment tier and EXOS produces a structured template with clause-by-clause guidance. Not legal advice — a professional starting point.",
    icon: ScrollText,
    status: "available",
    category: "documentation",
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
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, business model, and any specific constraints the AI should consider", type: "textarea", required: false, placeholder: "E.g., 'Mid-size manufacturing company in Germany. Regulated environment, strong focus on IP protection...'" },
      { id: "country", label: "Applicable Country (EU)", description: "Select the EU member state whose commercial law should apply", type: "select", required: true, options: [
        "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
        "Denmark", "Estonia", "Finland", "France", "Germany", "Greece",
        "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg",
        "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia",
        "Slovenia", "Spain", "Sweden"
      ] },
      { id: "timeTier", label: "Time Investment / Detail Level", description: "How much detail do you need? Quick = high-level structure (~15 min review). Standard = full clauses with guidance (~30-45 min). Thorough = detailed clauses + risk flags + alternative wording (~1h+).", type: "select", required: true, options: [
        "Quick Draft (3 feedback sections, ~15 min review)",
        "Standard (5-6 feedback sections, ~30-45 min review)",
        "Thorough (7+ feedback sections, ~1 hour+ review)"
      ] },
      { id: "contractBrief", label: "Contract Brief", description: "Describe the contract you need. Include parties, subject, approximate value, duration, and any special terms. Paste raw notes or an email — EXOS will extract structure automatically.", type: "textarea", required: true, placeholder: "E.g., 'We need a 2-year IT support contract with Acme GmbH, Berlin. Scope: helpdesk, on-site support, quarterly reviews. Value ~€120k/year. Need GDPR clause and 90-day termination notice...'" },
      { id: "contractType", label: "Contract Type", description: "Select the type of contract to generate", type: "select", required: true, options: [
        "Service Agreement",
        "Supply / Purchase Agreement",
        "Framework Agreement",
        "Non-Disclosure Agreement (NDA)",
        "Consulting / Professional Services",
        "Maintenance & Support Agreement"
      ] },
      { id: "contractValue", label: "Approximate Contract Value", description: "Optional. Helps calibrate clause complexity and risk provisions.", type: "text", required: false },
      { id: "specialRequirements", label: "Special Requirements or Constraints", description: "E.g., GDPR data processing clauses, sustainability provisions, specific payment milestones, IP ownership terms.", type: "textarea", required: false },
    ],
    outputs: [
      "Legal Disclaimer & Scope Statement",
      "Contract Structure Overview (Clause Map)",
      "Drafted Contract Template (Country-Specific)",
      "Clause-by-Clause Guidance & Risk Flags [REVIEW WITH LEGAL COUNSEL]",
      "Recommended Next Steps & Legal Review Checklist",
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
