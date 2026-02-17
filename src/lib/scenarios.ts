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

// Shared field definitions for consistency across all scenarios
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
  strategySelector?: StrategyPresetType; // Optional strategy preference selector
}

export const scenarios: Scenario[] = [
  // Page 1 Scenarios
  {
    id: "make-vs-buy",
    title: "Make vs Buy",
    description:
      "Evaluate whether to produce in-house or outsource based on cost, capability, speed, quality, and strategic fit.",
    icon: Scale,
    status: "available",
    category: "analysis",
    strategySelector: "speedVsQuality",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, business model, competitive landscape, and any specific constraints the AI should consider", type: "textarea", required: true, placeholder: "E.g., 'We are a mid-size pharmaceutical company in Germany. Regulatory compliance is critical. We have limited in-house manufacturing capacity but strong R&D...'" },
      MAIN_FOCUS_FIELD,
      { id: "internalSalary", label: "Internal Salary (Loaded)", description: "Fully loaded annual salary cost per employee", type: "currency", required: true },
      { id: "recruitingCost", label: "Recruiting Cost", description: "Cost to recruit and hire new staff", type: "currency", required: true },
      { id: "managementTime", label: "Management Time", description: "Hours per month for oversight", type: "number", required: true },
      { id: "officeItPerHead", label: "Office/IT Per Head", description: "Annual office and IT costs per employee", type: "currency", required: true },
      { id: "agencyFee", label: "Agency Fee", description: "External agency or contractor fee", type: "currency", required: true },
      { id: "agencyOnboardingSpeed", label: "Agency Onboarding Speed", description: "Days to onboard external agency", type: "number", required: true },
      { id: "knowledgeRetentionRisk", label: "Knowledge Retention Risk", description: "Risk level of losing institutional knowledge", type: "select", required: true, options: ["Low", "Medium", "High"] },
      { id: "qualityBenchmark", label: "Quality Benchmark", description: "Expected quality score (0-10)", type: "number", required: false },
      { id: "peakLoadCapacity", label: "Peak Load Capacity", description: "Can handle peak demand periods", type: "select", required: false, options: ["Yes", "No", "Partial"] },
      { id: "strategicImportance", label: "Strategic Importance Score", description: "How strategic is this function (1-10)", type: "number", required: true },
    ],
    outputs: ["Decision Matrix: Comparison across 5 criteria (Price, Speed, Quality, Risk, Control)", "Break-even Chart: Point where in-house becomes more cost-effective than outsourcing"],
  },
  {
    id: "tail-spend-sourcing",
    title: "Tail Spend Rapid Sourcing",
    description:
      "Quick analysis for low-value purchases to determine the fastest compliant procurement route.",
    icon: ShoppingCart,
    status: "available",
    category: "planning",
    strategySelector: "speedVsQuality",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, compliance requirements, and procurement policies the AI should consider", type: "textarea", required: true, placeholder: "E.g., 'Financial services company with strict vendor approval process. Most purchases under €5k can use P-card...'" },
      MAIN_FOCUS_FIELD,
      { id: "purchaseAmount", label: "Purchase Amount", description: "Total cost of the purchase", type: "currency", required: true },
      { id: "urgency", label: "Urgency (Days)", description: "How many days until you need this", type: "number", required: true },
      { id: "catalogAvailable", label: "Available in Catalog", description: "Is this item in your approved catalog?", type: "select", required: true, options: ["Yes", "No"] },
      { id: "quotesCount", label: "Number of Quotes", description: "How many quotes do you have?", type: "number", required: false },
      { id: "paymentTerms", label: "Payment Terms", description: "Preferred payment method", type: "select", required: true, options: ["Corporate Card", "Invoice", "Purchase Order"] },
      { id: "warranty", label: "Warranty Required", description: "Is warranty needed?", type: "select", required: false, options: ["Yes", "No"] },
      { id: "deliveryCost", label: "Delivery Cost", description: "Estimated shipping/delivery cost", type: "currency", required: false },
      { id: "returnRisk", label: "Return Risk", description: "Likelihood of needing to return", type: "select", required: false, options: ["Low", "Medium", "High"] },
      { id: "alternativesExist", label: "Alternatives Exist", description: "Are there substitute products?", type: "select", required: false, options: ["Yes", "No"] },
      { id: "approvalRequired", label: "Manager Approval Required", description: "Does this need management sign-off?", type: "select", required: true, options: ["Yes", "No"] },
    ],
    outputs: ["Action Plan: Direct 'Buy Here' link or 'Launch Tender' recommendation", "Compliance Alert: Notification if purchase violates procurement policy"],
  },
  {
    id: "supplier-review",
    title: "Supplier Review",
    description:
      "Comprehensive supplier performance evaluation with scorecard and improvement planning.",
    icon: ClipboardCheck,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry standards, quality expectations, and relationship priorities", type: "textarea", required: true, placeholder: "E.g., 'Automotive tier-1 supplier. Zero-defect culture, IATF 16949 compliance required. Long-term partnerships valued...'" },
      MAIN_FOCUS_FIELD,
      { id: "qualityScore", label: "Quality Score (0-10)", description: "Overall quality rating", type: "number", required: true },
      { id: "onTimeDelivery", label: "On-Time Delivery %", description: "Percentage of orders delivered on time", type: "percentage", required: true },
      { id: "incidentCount", label: "Number of Incidents", description: "Quality or delivery incidents this period", type: "number", required: true },
      { id: "communicationScore", label: "Communication Score", description: "Responsiveness and clarity (1-10)", type: "number", required: true },
      { id: "innovationScore", label: "Innovation Score", description: "Proactive improvement suggestions (1-10)", type: "number", required: false },
      { id: "financialStability", label: "Financial Stability", description: "Supplier financial health", type: "select", required: true, options: ["Strong", "Moderate", "At Risk"] },
      { id: "socialResponsibility", label: "Social Responsibility", description: "ESG and ethics compliance", type: "select", required: false, options: ["Certified", "In Progress", "None"] },
      { id: "priceVsMarket", label: "Price vs Market", description: "How pricing compares to market", type: "select", required: true, options: ["Below Market", "At Market", "Above Market"] },
      { id: "crisisSupport", label: "Crisis Support Readiness", description: "Willingness to help during emergencies", type: "select", required: false, options: ["Excellent", "Good", "Poor"] },
      { id: "spendVolume", label: "Annual Spend Volume", description: "Total annual spend with supplier", type: "currency", required: true },
    ],
    outputs: ["Supplier Scorecard: Radar diagram of supplier competencies", "PIP Plan: 90-day performance improvement plan", "QBR Script: Scenario for annual business review meeting"],
  },
  {
    id: "disruption-management",
    title: "Disruption Management",
    description:
      "Emergency response planning for supply chain disruptions with alternative sourcing strategies.",
    icon: AlertTriangle,
    status: "available",
    category: "risk",
    strategySelector: "speedVsQuality",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, supply chain complexity, and critical dependencies", type: "textarea", required: true, placeholder: "E.g., 'Electronics manufacturer with JIT production. Single source for key chips. 2-week inventory buffer typical...'" },
      MAIN_FOCUS_FIELD,
      { id: "deficitSku", label: "Deficit SKU Name", description: "Name of the product/service at risk", type: "text", required: true },
      { id: "stockDays", label: "Stock (Days)", description: "Current inventory in days of supply", type: "number", required: true },
      { id: "altSuppliers", label: "Alternative Suppliers", description: "Number of backup suppliers available", type: "number", required: true },
      { id: "altProducts", label: "Substitute Products", description: "Are replacement products available?", type: "select", required: true, options: ["Yes", "No", "Partial"] },
      { id: "substitutePrice", label: "Substitute Price Premium", description: "Price increase for alternatives", type: "percentage", required: false },
      { id: "switchingTime", label: "Switching Time (Days)", description: "Days to switch to alternative", type: "number", required: true },
      { id: "lostRevenuePerDay", label: "Lost Revenue Per Day", description: "Daily revenue impact of stockout", type: "currency", required: true },
      { id: "inTransitStatus", label: "In-Transit Status", description: "Are shipments currently in transit?", type: "select", required: false, options: ["Yes", "No", "Unknown"] },
      { id: "forceMajeureClause", label: "Force Majeure Clause", description: "Legal protection available?", type: "select", required: false, options: ["Yes", "No", "Unclear"] },
      { id: "competitorResponse", label: "Competitor Response", description: "How are competitors handling this?", type: "text", required: false },
    ],
    outputs: ["Emergency Map: Step-by-step supply chain recovery algorithm", "Impact Table: Financial losses under different delay scenarios", "Draft Letter: Claim letter or partner assistance request"],
  },
  {
    id: "risk-assessment",
    title: "Risk Assessment",
    description:
      "Comprehensive risk analysis combining industry dynamics, contract risks, and real-time market situation assessment.",
    icon: Shield,
    status: "available",
    category: "risk",
    strategySelector: "costVsRisk",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, regulatory environment, and risk management maturity", type: "textarea", required: true, placeholder: "E.g., 'Pharmaceutical manufacturing in EU. Strict GMP requirements. Multi-tier supply chains with API suppliers in Asia...'" },
      MAIN_FOCUS_FIELD,
      { id: "assessmentSubject", label: "Assessment Subject", description: "What supplier, category, or project are you assessing?", type: "text", required: true },
      { id: "annualValue", label: "Annual Value at Risk", description: "Total annual spend or value exposed", type: "currency", required: true },
      // Industry Analysis
      { id: "marketVolatility", label: "Market Volatility", description: "How volatile is the supplier market?", type: "select", required: true, options: ["Stable", "Moderate", "Volatile", "Highly Volatile"] },
      { id: "regulatoryExposure", label: "Regulatory Exposure", description: "Level of regulatory oversight in the supply chain", type: "select", required: true, options: ["Minimal", "Moderate", "High", "Critical"] },
      { id: "geopoliticalRisk", label: "Geopolitical Risk", description: "Exposure to geopolitical instability", type: "select", required: true, options: ["Low", "Medium", "High", "Critical"] },
      { id: "commodityDependency", label: "Commodity Dependency", description: "Reliance on volatile commodity inputs", type: "select", required: false, options: ["None", "Low", "Moderate", "High"] },
      // Contract Analysis (Simplified)
      { id: "contractType", label: "Contract Type", description: "Current contractual arrangement", type: "select", required: true, options: ["Spot/No Contract", "Short-term (<1yr)", "Medium-term (1-3yr)", "Long-term (3+yr)"] },
      { id: "liabilityProtection", label: "Liability Protection", description: "Level of contractual protection", type: "select", required: true, options: ["Comprehensive", "Standard", "Limited", "None"] },
      { id: "terminationRights", label: "Termination Rights", description: "Ease of contract exit", type: "select", required: true, options: ["Flexible", "Moderate Notice", "Restrictive", "Locked In"] },
      { id: "priceAdjustmentMechanism", label: "Price Adjustment Clause", description: "How are price changes handled?", type: "select", required: false, options: ["Fixed", "Index-linked", "Negotiable", "Supplier Discretion"] },
      // Current Situation (Search-grounded)
      { id: "currentChallenges", label: "Current Market Challenges", description: "What specific issues are affecting this market/supplier now?", type: "textarea", required: true, placeholder: "E.g., 'Chip shortage affecting lead times. Supplier recently announced capacity expansion. Raw material prices up 15%...'" },
      { id: "supplierFinancialHealth", label: "Supplier Financial Health", description: "Current financial stability assessment", type: "select", required: true, options: ["Strong", "Stable", "Concerning", "At Risk"] },
      { id: "supplyChainVisibility", label: "Supply Chain Visibility", description: "How much visibility do you have into sub-tiers?", type: "select", required: false, options: ["Full Visibility", "Tier 1 Only", "Limited", "None"] },
      { id: "recentIncidents", label: "Recent Incidents", description: "Any recent quality, delivery, or compliance issues?", type: "textarea", required: false, placeholder: "E.g., '2 late deliveries last quarter. Minor quality issue resolved. No compliance violations...'" },
      // Risk Tolerance
      { id: "businessCriticality", label: "Business Criticality", description: "Impact if supply fails", type: "select", required: true, options: ["Low", "Medium", "High", "Mission Critical"] },
      { id: "recoveryTime", label: "Acceptable Recovery Time", description: "Maximum tolerable disruption", type: "select", required: true, options: ["Hours", "Days", "Weeks", "Months"] },
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
  {
    id: "tco-analysis",
    title: "Total Cost of Ownership",
    description:
      "Comprehensive lifecycle cost analysis for complex purchases including acquisition, operation, risks, and exit costs.",
    icon: Calculator,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, asset management practices, and typical ownership periods", type: "textarea", required: true, placeholder: "E.g., 'Manufacturing plant modernization. Assets typically 10-15 year lifecycle. Strong focus on OEE and uptime. Limited in-house maintenance capability...'" },
      MAIN_FOCUS_FIELD,
      { id: "assetDescription", label: "Asset/Purchase Description", description: "What are you evaluating?", type: "text", required: true },
      { id: "ownershipPeriod", label: "Ownership Period (Years)", description: "Expected useful life or evaluation period", type: "number", required: true },
      // Acquisition Costs
      { id: "purchasePrice", label: "Purchase/Acquisition Price", description: "Base purchase cost", type: "currency", required: true },
      { id: "installationCost", label: "Installation & Setup Cost", description: "Delivery, installation, commissioning", type: "currency", required: true },
      { id: "trainingCost", label: "Training Cost", description: "Staff training and certification", type: "currency", required: false },
      { id: "integrationCost", label: "Integration Cost", description: "Systems integration, customization", type: "currency", required: false },
      // Operating Costs
      { id: "annualMaintenance", label: "Annual Maintenance Cost", description: "Regular maintenance and service contracts", type: "currency", required: true },
      { id: "energyConsumption", label: "Annual Energy Cost", description: "Power, fuel, utilities consumption", type: "currency", required: true },
      { id: "consumablesCost", label: "Annual Consumables Cost", description: "Spare parts, supplies, materials", type: "currency", required: false },
      { id: "laborCost", label: "Annual Operating Labor Cost", description: "Staff time to operate", type: "currency", required: false },
      { id: "insuranceCost", label: "Annual Insurance Cost", description: "Asset insurance premiums", type: "currency", required: false },
      // Vendor Lock-in Analysis
      { id: "vendorLockInRisk", label: "Vendor Lock-in Risk", description: "Dependency on single vendor for support/parts", type: "select", required: true, options: ["None", "Low", "Moderate", "High", "Critical"] },
      { id: "proprietaryComponents", label: "Proprietary Components %", description: "Percentage of proprietary vs standard parts", type: "percentage", required: true },
      { id: "alternativeSuppliers", label: "Alternative Service Providers", description: "Availability of third-party maintenance", type: "select", required: true, options: ["Many", "Some", "Few", "None"] },
      { id: "dataPortability", label: "Data Portability", description: "Ease of migrating data/configurations", type: "select", required: false, options: ["Full Export", "Partial", "Difficult", "Locked In"] },
      // Long-term Market Factors
      { id: "technologyObsolescence", label: "Technology Obsolescence Risk", description: "Risk of technology becoming outdated", type: "select", required: true, options: ["Low", "Medium", "High", "Imminent"] },
      { id: "marketPriceTrend", label: "Market Price Trend", description: "Expected future price direction for this category", type: "select", required: true, options: ["Decreasing", "Stable", "Increasing", "Volatile"] },
      { id: "regulatoryChanges", label: "Regulatory Change Risk", description: "Risk of new regulations affecting asset", type: "select", required: false, options: ["Minimal", "Possible", "Likely", "Certain"] },
      // Macroeconomic Factors
      { id: "inflationAssumption", label: "Inflation Assumption %", description: "Expected annual inflation rate", type: "percentage", required: true },
      { id: "currencyExposure", label: "Currency Exposure", description: "Foreign currency risk for ongoing costs", type: "select", required: false, options: ["None", "Low", "Moderate", "High"] },
      { id: "interestRate", label: "Financing Rate %", description: "Cost of capital or financing rate", type: "percentage", required: true },
      // Exit Costs
      { id: "residualValue", label: "Expected Residual Value", description: "Asset value at end of ownership", type: "currency", required: true },
      { id: "decommissioningCost", label: "Decommissioning Cost", description: "Removal, disposal, remediation costs", type: "currency", required: false },
      { id: "dataMigrationCost", label: "Data Migration Cost", description: "Cost to transfer data to new system", type: "currency", required: false },
      // Risk Factors
      { id: "downtimeRisk", label: "Downtime Risk", description: "Expected reliability and uptime", type: "select", required: true, options: ["Very High (99%+)", "High (97-99%)", "Moderate (95-97%)", "Low (<95%)"] },
      { id: "downtimeCostPerHour", label: "Downtime Cost Per Hour", description: "Business impact of unplanned downtime", type: "currency", required: true },
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
  {
    id: "software-licensing",
    title: "Software Licensing Structure",
    description:
      "Evaluate different software licensing models, multi-tier user needs, contract terms, and vendor lock-in to optimize software investments.",
    icon: KeyRound,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, compliance requirements, and software usage patterns", type: "textarea", required: true, placeholder: "E.g., 'Financial services firm with 500 employees. SOC2 compliance required. Mix of power users and occasional users. Preference for cloud-based solutions...'" },
      MAIN_FOCUS_FIELD,
      { id: "softwareName", label: "Software Product", description: "Name of the software being evaluated", type: "text", required: true },
      { id: "softwareCategory", label: "Software Category", description: "Type of software", type: "select", required: true, options: ["Productivity Suite", "CRM/Sales", "ERP", "Development Tools", "Design/Creative", "Analytics/BI", "Security", "Communication", "Other"] },
      // User Tier Analysis
      { id: "totalUsers", label: "Total User Count", description: "Total number of users needing access", type: "number", required: true },
      { id: "powerUsers", label: "Power Users", description: "Users needing full features daily", type: "number", required: true },
      { id: "regularUsers", label: "Regular Users", description: "Users needing standard features frequently", type: "number", required: true },
      { id: "occasionalUsers", label: "Occasional Users", description: "Users needing basic/view-only access occasionally", type: "number", required: true },
      { id: "externalUsers", label: "External Users", description: "Contractors, partners, or customers needing access", type: "number", required: false },
      { id: "userGrowthRate", label: "Expected User Growth Rate %", description: "Annual growth in user base", type: "percentage", required: false },
      // Pricing Scenarios
      { id: "perUserMonthly", label: "Per-User Monthly Cost", description: "Standard per-seat monthly rate", type: "currency", required: true },
      { id: "enterpriseTierCost", label: "Enterprise Tier Annual Cost", description: "Flat enterprise license cost (if offered)", type: "currency", required: false },
      { id: "usageBasedRate", label: "Usage-Based Rate", description: "Per-transaction or consumption rate (if applicable)", type: "currency", required: false },
      { id: "implementationCost", label: "Implementation Cost", description: "One-time setup, migration, training costs", type: "currency", required: true },
      // Contract Terms
      { id: "contractLength", label: "Proposed Contract Length", description: "Vendor's proposed commitment period", type: "select", required: true, options: ["Month-to-Month", "1 Year", "2 Years", "3 Years", "5 Years"] },
      { id: "longTermDiscount", label: "Long-Term Discount %", description: "Discount offered for multi-year commitment", type: "percentage", required: true },
      { id: "annualEscalation", label: "Annual Price Escalation %", description: "Expected or contractual annual price increase", type: "percentage", required: true },
      { id: "paymentTerms", label: "Payment Terms", description: "Payment frequency and timing", type: "select", required: false, options: ["Monthly", "Quarterly", "Annual Upfront", "Multi-Year Upfront"] },
      { id: "terminationClause", label: "Early Termination Clause", description: "Can you exit early? At what cost?", type: "select", required: true, options: ["Free Exit", "Prorated Refund", "No Refund", "Penalty Fee"] },
      // Vendor Lock-in Assessment
      { id: "dataExportability", label: "Data Exportability", description: "Ease of extracting your data", type: "select", required: true, options: ["Full Export (Standard Formats)", "Export with Limitations", "Difficult Export", "Proprietary Format Only"] },
      { id: "integrationDependency", label: "Integration Dependency", description: "How deeply integrated with other systems?", type: "select", required: true, options: ["Standalone", "Light Integration", "Moderate Integration", "Deep Integration"] },
      { id: "switchingCostEstimate", label: "Estimated Switching Cost", description: "Cost to migrate to alternative solution", type: "currency", required: true },
      { id: "alternativeProducts", label: "Viable Alternatives", description: "Number of credible alternative products", type: "select", required: true, options: ["Many (5+)", "Some (2-4)", "Few (1-2)", "None"] },
      { id: "proprietaryFeatures", label: "Proprietary Feature Dependency", description: "Reliance on unique vendor features", type: "select", required: false, options: ["None", "Low", "Moderate", "High"] },
      // Strategic Factors
      { id: "vendorStability", label: "Vendor Stability", description: "Vendor's market position and financial health", type: "select", required: true, options: ["Market Leader", "Established", "Growing", "Startup/At Risk"] },
      { id: "complianceRequirements", label: "Compliance Requirements", description: "Required certifications or compliance", type: "text", required: false },
      { id: "currentSolution", label: "Current Solution", description: "Existing software (if replacing)", type: "text", required: false },
      { id: "currentAnnualCost", label: "Current Annual Cost", description: "Annual cost of current solution", type: "currency", required: false },
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
  {
    id: "risk-matrix",
    title: "Risk Matrix",
    description:
      "Supplier risk assessment covering legal, financial, cyber, and operational risks.",
    icon: Shield,
    status: "available",
    category: "risk",
    strategySelector: "costVsRisk",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, regulatory environment, and risk tolerance culture", type: "textarea", required: true, placeholder: "E.g., 'Healthcare sector with HIPAA requirements. We process patient data and require SOC2 compliance from all vendors...'" },
      MAIN_FOCUS_FIELD,
      { id: "legalStatus", label: "Legal Status", description: "Business registration and legal standing", type: "select", required: true, options: ["Verified", "Pending", "Issues Found"] },
      { id: "lawsuits", label: "Active Lawsuits", description: "Any pending litigation?", type: "select", required: true, options: ["None", "Minor", "Significant"] },
      { id: "dataAccess", label: "Data Access Level", description: "What company data do they access?", type: "select", required: true, options: ["None", "Limited", "Sensitive", "Critical"] },
      { id: "financialHealth", label: "Financial Health", description: "Financial stability indicators", type: "select", required: true, options: ["Strong", "Moderate", "Weak"] },
      { id: "concentration", label: "Revenue Concentration", description: "Are we their only major client?", type: "select", required: true, options: ["Diversified", "Moderate", "Single Client"] },
      { id: "environmentalRisk", label: "Environmental Risk", description: "Ecological compliance status", type: "select", required: false, options: ["Low", "Medium", "High"] },
      { id: "sanctionsRisk", label: "Sanctions Risk", description: "Exposure to sanctioned entities/countries", type: "select", required: true, options: ["None", "Low", "Medium", "High"] },
      { id: "cyberSecurity", label: "Cybersecurity Quality", description: "IT security maturity level", type: "select", required: true, options: ["Certified", "Adequate", "Concerning"] },
      { id: "insurance", label: "Insurance Coverage", description: "Liability and business insurance", type: "select", required: false, options: ["Comprehensive", "Basic", "None"] },
      { id: "siteAudits", label: "On-Site Audits", description: "Have you conducted site visits?", type: "select", required: false, options: ["Recent", "Outdated", "Never"] },
    ],
    outputs: ["Risk Heatmap: Probability vs Impact matrix", "Mitigation Plan: Risk reduction action list", "Traffic Light Status: Green/Yellow/Red recommendation"],
  },

  // Page 2 Scenarios
  {
    id: "sow-critic",
    title: "SOW Critic",
    description:
      "AI-powered Statement of Work review to identify gaps, ambiguities, and protection issues.",
    icon: FileText,
    status: "available",
    category: "documentation",
    strategySelector: "skepticism",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, typical contract risks, and protection priorities", type: "textarea", required: true, placeholder: "E.g., 'IT consulting services. IP ownership and liability caps are critical. We typically push back on unlimited liability...'" },
      MAIN_FOCUS_FIELD,
      { id: "sowText", label: "SOW Text", description: "Paste the Statement of Work text", type: "textarea", required: true, placeholder: "Paste the full SOW document here..." },
      { id: "deliverables", label: "Deliverables", description: "List of expected outputs", type: "text", required: true },
      { id: "acceptanceCriteria", label: "Acceptance Criteria", description: "How will deliverables be accepted?", type: "text", required: true },
      { id: "timeline", label: "Timeline/Milestones", description: "Key dates and deadlines", type: "text", required: true },
      { id: "responsibilities", label: "Party Responsibilities", description: "Who does what?", type: "text", required: true },
      { id: "clientResources", label: "Client Resources Required", description: "What must the client provide?", type: "text", required: false },
      { id: "exclusions", label: "Out of Scope", description: "What is explicitly excluded?", type: "text", required: false },
      { id: "changeProcess", label: "Change Request Process", description: "How are changes handled?", type: "text", required: true },
      { id: "penalties", label: "Penalties/SLAs", description: "Financial consequences for non-performance", type: "text", required: false },
      { id: "warrantyPeriod", label: "Warranty Period", description: "Post-delivery support duration", type: "text", required: false },
    ],
    outputs: ["Redlining: Track-changes style markup", "Scorecard: Contract protection score (0-100%)", "Checklist: Questions to clarify gray areas"],
  },
  {
    id: "sla-definition",
    title: "SLA Definition",
    description:
      "Generate comprehensive Service Level Agreement terms with metrics, targets, and escalation procedures.",
    icon: Clock,
    status: "available",
    category: "documentation",
    strategySelector: "costVsRisk",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry standards, typical SLA expectations, and service criticality", type: "textarea", required: true, placeholder: "E.g., 'E-commerce platform. 99.9% uptime is industry standard. Peak traffic during holidays requires special provisions...'" },
      MAIN_FOCUS_FIELD,
      { id: "operatingHours", label: "Operating Hours", description: "Service availability requirement", type: "select", required: true, options: ["24/7", "Business Hours (8/5)", "Extended (12/6)"] },
      { id: "responseTime", label: "Response Time Target", description: "Expected initial response time", type: "text", required: true },
      { id: "resolutionTime", label: "Resolution Time Target", description: "Expected issue resolution time", type: "text", required: true },
      { id: "allowedDowntime", label: "Allowed Downtime %", description: "Maximum acceptable downtime", type: "percentage", required: true },
      { id: "serviceCriticality", label: "Service Criticality", description: "How critical is this service?", type: "select", required: true, options: ["Mission Critical", "Important", "Standard"] },
      { id: "contactMethods", label: "Contact Methods", description: "How to reach support", type: "text", required: false },
      { id: "escalationProcess", label: "Escalation Process", description: "Steps when SLA is at risk", type: "text", required: true },
      { id: "reportingFrequency", label: "Reporting Frequency", description: "How often are reports needed?", type: "select", required: false, options: ["Weekly", "Monthly", "Quarterly"] },
      { id: "qualityBonuses", label: "Quality Bonuses", description: "Incentives for exceeding targets", type: "text", required: false },
    ],
    outputs: ["SLA Table: Metrics, targets, and financial penalties", "Decision Tree: Incident response by severity level", "Draft Agreement: Ready-to-use service quality appendix"],
  },
  {
    id: "rfp-generator",
    title: "RFP Lite Generator",
    description:
      "Generate a streamlined Request for Proposal with evaluation criteria and supplier response template.",
    icon: FileSpreadsheet,
    status: "available",
    category: "documentation",
    strategySelector: "speedVsQuality",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, typical vendor landscape, and procurement standards", type: "textarea", required: true, placeholder: "E.g., 'Government contractor with FAR compliance requirements. Prefer local suppliers where possible. Formal bid process required above $25k...'" },
      MAIN_FOCUS_FIELD,
      { id: "procurementSubject", label: "Procurement Subject", description: "What are you buying?", type: "text", required: true },
      { id: "volume", label: "Volume/Quantity", description: "Expected purchase volume", type: "text", required: true },
      { id: "technicalRequirements", label: "Technical Requirements", description: "Key specifications needed", type: "text", required: true },
      { id: "supplierQualifications", label: "Supplier Qualifications", description: "Required vendor capabilities", type: "text", required: true },
      { id: "location", label: "Service Location", description: "Where is delivery/service needed?", type: "text", required: true },
      { id: "submissionDeadline", label: "Submission Deadline", description: "When are proposals due?", type: "text", required: true },
      { id: "priceStructure", label: "Price Structure", description: "How should pricing be broken down?", type: "text", required: false },
      { id: "evaluationWeights", label: "Evaluation Criteria Weights", description: "Scoring priorities (e.g., Price 40%, Quality 30%)", type: "text", required: true },
      { id: "ndaTerms", label: "NDA Requirements", description: "Confidentiality requirements", type: "select", required: false, options: ["Standard NDA", "Custom NDA", "None Required"] },
      { id: "responseFormat", label: "Response Format", description: "How should suppliers respond?", type: "text", required: false },
    ],
    outputs: ["RFP Document: Ready-to-send PDF for supplier distribution", "Evaluation Matrix: Blank scoring form for comparing responses", "Email Template: Tender invitation letter"],
  },
  {
    id: "requirements-gathering",
    title: "Requirements Gathering",
    description:
      "Structure business needs into prioritized requirements with user stories and solution recommendations.",
    icon: ListChecks,
    status: "available",
    category: "planning",
    strategySelector: "skepticism",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, technology maturity, and organizational constraints", type: "textarea", required: true, placeholder: "E.g., 'Retail chain with 200 stores. Legacy POS system. Limited IT staff. Need cloud-first solutions with strong vendor support...'" },
      MAIN_FOCUS_FIELD,
      { id: "businessGoal", label: "Business Goal", description: "What problem are you solving?", type: "text", required: true },
      { id: "budget", label: "Budget Range", description: "Available funding", type: "currency", required: true },
      { id: "userCount", label: "Number of Users", description: "How many people will use this?", type: "number", required: true },
      { id: "itLandscape", label: "IT Landscape", description: "Key systems to integrate with", type: "text", required: false },
      { id: "dataSecurityLevel", label: "Data Security Requirements", description: "Sensitivity of data involved", type: "select", required: true, options: ["Public", "Internal", "Confidential", "Highly Restricted"] },
      { id: "urgency", label: "Implementation Urgency", description: "Timeline requirements", type: "select", required: true, options: ["Immediate", "3-6 Months", "6-12 Months", "Flexible"] },
      { id: "mustHaveFeatures", label: "Must-Have Features", description: "Essential functionality", type: "text", required: true },
      { id: "niceToHaveFeatures", label: "Nice-to-Have Features", description: "Desired but optional features", type: "text", required: false },
      { id: "scalability", label: "Scalability Needs", description: "Expected growth requirements", type: "select", required: false, options: ["No Growth", "Moderate Growth", "High Growth"] },
      { id: "languageSupport", label: "Language Support", description: "Required languages", type: "text", required: false },
    ],
    outputs: ["MoSCoW Matrix: Requirements prioritized by importance", "User Stories: Test scenarios for product validation", "Market Scan: 3-5 solutions matching requirements"],
  },

  // Page 3 Scenarios
  {
    id: "volume-consolidation",
    title: "Volume Consolidation",
    description:
      "Analyze supplier spend and identify opportunities to consolidate volume for better pricing and reduced complexity.",
    icon: Layers,
    status: "available",
    category: "analysis",
    strategySelector: "riskAppetite",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, supply chain characteristics, and consolidation constraints", type: "textarea", required: true, placeholder: "E.g., 'Manufacturing with 50+ suppliers for MRO. Regional delivery requirements. Some suppliers are sole-source for specialized parts...'" },
      MAIN_FOCUS_FIELD,
      { id: "spendPerVendor", label: "Spend Per Vendor (Annual)", description: "Annual spend breakdown by supplier", type: "currency", required: true },
      { id: "skuOverlap", label: "SKU Overlap %", description: "Percentage of overlapping products", type: "percentage", required: true },
      { id: "unitOfMeasure", label: "Unit of Measure", description: "Standard units (kg/pcs/hours)", type: "text", required: true },
      { id: "logisticsDistance", label: "Logistics Distance", description: "Average delivery distance", type: "text", required: false },
      { id: "paymentTerms", label: "Payment Terms (DPO)", description: "Days payable outstanding", type: "number", required: true },
      { id: "orderFrequency", label: "Order Frequency", description: "How often you order", type: "select", required: true, options: ["Daily", "Weekly", "Monthly", "Quarterly"] },
      { id: "reliabilityIndex", label: "Delivery Reliability Index", description: "Supplier reliability score (1-10)", type: "number", required: true },
      { id: "volumeGrowthForecast", label: "Volume Growth Forecast %", description: "Expected volume increase", type: "percentage", required: false },
      { id: "currentPenalties", label: "Current Underdelivery Penalties", description: "Existing penalty amounts", type: "currency", required: false },
      { id: "taxRate", label: "VAT/Tax Rate %", description: "Applicable tax rate", type: "percentage", required: false },
    ],
    outputs: ["Bubble Chart Dashboard: Size = spend, axes = price and risk", "Negotiation Script: Volume discount talking points", "Savings Matrix: Comparison with 1/2/3 suppliers"],
  },
  {
    id: "capex-vs-opex",
    title: "Capex vs Opex (Lease/Buy)",
    description:
      "Financial comparison between purchasing assets versus leasing with NPV and cash flow analysis.",
    icon: Building,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, capital constraints, and asset utilization patterns", type: "textarea", required: true, placeholder: "E.g., 'Logistics company expanding fleet. Capital is constrained. Assets typically obsolete in 5 years. Prefer operational flexibility...'" },
      MAIN_FOCUS_FIELD,
      { id: "purchasePrice", label: "Purchase Price", description: "Asset purchase cost", type: "currency", required: true },
      { id: "leaseRate", label: "Lease Rate %", description: "Annual lease rate", type: "percentage", required: true },
      { id: "leaseTerm", label: "Lease Term (Years)", description: "Duration of lease", type: "number", required: true },
      { id: "maintenanceCost", label: "Annual Maintenance Cost", description: "Yearly upkeep expenses", type: "currency", required: true },
      { id: "residualValue", label: "Residual Value", description: "Asset value at end of period", type: "currency", required: true },
      { id: "propertyTax", label: "Property Tax Rate %", description: "Annual property tax", type: "percentage", required: false },
      { id: "wacc", label: "WACC/Discount Rate %", description: "Cost of capital for NPV", type: "percentage", required: true },
      { id: "partsInflation", label: "Parts Inflation Rate %", description: "Annual spare parts price increase", type: "percentage", required: false },
      { id: "energyCost", label: "Annual Energy Cost", description: "Power consumption costs", type: "currency", required: false },
      { id: "trainingCost", label: "Training Cost", description: "Staff training expenses", type: "currency", required: false },
    ],
    outputs: ["NPV Waterfall Graph: 5-year total cost comparison", "Flexibility Matrix: Upgrade options vs ownership", "CFO Recommendation: Cash flow preservation advice"],
  },
  {
    id: "savings-calculation",
    title: "Savings Calculation",
    description:
      "Document and validate procurement savings with inflation adjustment and audit-ready reporting.",
    icon: Calculator,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, savings reporting standards, and audit requirements", type: "textarea", required: true, placeholder: "E.g., 'Fortune 500 with strict procurement savings targets. Finance requires documented baseline and auditable methodology...'" },
      MAIN_FOCUS_FIELD,
      { id: "baselinePrice", label: "Baseline Price", description: "Original price before negotiation", type: "currency", required: true },
      { id: "newPrice", label: "New Price", description: "Negotiated price", type: "currency", required: true },
      { id: "volume", label: "Annual Volume", description: "Expected purchase quantity", type: "number", required: true },
      { id: "inflationIndex", label: "Inflation Index %", description: "Relevant inflation rate", type: "percentage", required: true },
      { id: "fxRate", label: "FX Rate Impact", description: "Currency exchange consideration", type: "text", required: false },
      { id: "qualityCost", label: "Cost of Quality (Defects)", description: "Quality-related cost changes", type: "currency", required: false },
      { id: "earlyPaymentDiscount", label: "Early Payment Discount %", description: "Discount for faster payment", type: "percentage", required: false },
      { id: "storageCost", label: "Storage Cost Change", description: "Inventory holding cost impact", type: "currency", required: false },
      { id: "contractTerm", label: "Contract Term (Years)", description: "Agreement duration", type: "number", required: true },
      { id: "switchingCosts", label: "Switching Costs", description: "One-time transition expenses", type: "currency", required: false },
    ],
    outputs: ["Executive Summary: Hard vs Soft savings breakdown", "Progress Dashboard: Annual savings goal tracker", "Audit Report: PDF with inflation adjustment documentation"],
  },
  {
    id: "saas-optimization",
    title: "SaaS Optimization",
    description:
      "Identify unused licenses, duplicate tools, and right-sizing opportunities for software subscriptions.",
    icon: Cloud,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, IT governance model, and software management practices", type: "textarea", required: true, placeholder: "E.g., 'Tech startup with 500 employees. Decentralized software purchasing. Many shadow IT tools. Need to consolidate before audit...'" },
      MAIN_FOCUS_FIELD,
      { id: "totalSeats", label: "Total Seats/Licenses", description: "Number of licenses owned", type: "number", required: true },
      { id: "pricePerSeat", label: "Price Per Seat", description: "Cost per license", type: "currency", required: true },
      { id: "lastLoginDate", label: "Last Login Date", description: "Most recent user activity", type: "text", required: true },
      { id: "featureUsage", label: "Feature Usage Score", description: "How much of the product is used (1-10)", type: "number", required: true },
      { id: "contractEndDate", label: "Contract End Date", description: "When does the subscription end?", type: "text", required: true },
      { id: "noticePeriod", label: "Notice Period (Days)", description: "Cancellation notice requirement", type: "number", required: true },
      { id: "autoRenewal", label: "Auto-Renewal", description: "Is auto-renewal enabled?", type: "select", required: true, options: ["Yes", "No"] },
      { id: "ssoIntegration", label: "SSO Integration", description: "Connected to company SSO?", type: "select", required: false, options: ["Yes", "No", "Partial"] },
      { id: "duplicateApps", label: "Duplicate/Similar Apps", description: "Other tools with overlapping features", type: "text", required: false },
      { id: "supportTier", label: "Support Tier", description: "Level of vendor support", type: "select", required: false, options: ["Premium", "Standard", "Basic"] },
    ],
    outputs: ["Kill List: Licenses to remove with user names", "Tier Mismatch Chart: Overpayment for unused features", "Duplicate Matrix: Comparison of overlapping services"],
  },
  {
    id: "forecasting-budgeting",
    title: "Predictive Budgeting & Forecasting",
    description:
      "Combines your internal historical spend with external Market Intelligence. AI detects hidden seasonality, applies real-time industry inflation trends, and generates Best/Base/Worst case budget scenarios.",
    icon: TrendingUp,
    status: "available",
    category: "planning",
    strategySelector: "costVsRisk",
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
  {
    id: "cost-breakdown",
    title: "Cost Breakdown",
    description:
      "Analyze cost drivers for goods and services, enabling detailed cost modelling and negotiation leverage.",
    icon: PieChart,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, typical cost structures, and benchmarking sources you use", type: "textarea", required: true, placeholder: "E.g., 'Aerospace manufacturing. Complex assemblies with 60% material cost, 25% labor, 15% overhead. We use AAMC benchmarks for cost validation...'" },
      MAIN_FOCUS_FIELD,
      { id: "productDescription", label: "Product/Service Description", description: "What goods or services are you analyzing?", type: "text", required: true },
      { id: "totalCost", label: "Total Cost", description: "Current total cost of the item/service", type: "currency", required: true },
      { id: "materialCost", label: "Material/Direct Cost", description: "Raw materials or direct input costs", type: "currency", required: true },
      { id: "laborCost", label: "Labor Cost", description: "Direct and indirect labor costs", type: "currency", required: true },
      { id: "overheadCost", label: "Overhead Cost", description: "Fixed and variable overhead", type: "currency", required: true },
      { id: "logisticsCost", label: "Logistics/Shipping Cost", description: "Transportation and handling", type: "currency", required: false },
      { id: "toolingCost", label: "Tooling/Equipment Cost", description: "One-time or amortized tooling", type: "currency", required: false },
      { id: "profitMargin", label: "Supplier Profit Margin %", description: "Estimated or known supplier margin", type: "percentage", required: false },
      { id: "volumePerYear", label: "Annual Volume", description: "Yearly purchase quantity", type: "number", required: true },
      { id: "commodityIndex", label: "Commodity Index Reference", description: "Relevant commodity price index", type: "text", required: false },
      { id: "laborRateReference", label: "Labor Rate Benchmark", description: "Reference labor rates (e.g., BLS, industry avg)", type: "text", required: false },
      { id: "currencyExposure", label: "Currency Exposure", description: "Key currencies in cost structure", type: "text", required: false },
    ],
    outputs: ["Cost Waterfall: Visual breakdown of cost components", "Should-Cost Model: Bottom-up cost estimate with benchmarks", "Negotiation Leverage Points: Areas where supplier costs may be inflated", "Sensitivity Analysis: Impact of key cost driver changes"],
  },
  {
    id: "category-strategy",
    title: "Category Strategy",
    description:
      "Comprehensive category management analysis with AI-guided insights, best practices from proprietary database, and cross-category analogies.",
    icon: FolderKanban,
    status: "available",
    category: "analysis",
    strategySelector: "skepticism",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, market dynamics, and category management maturity", type: "textarea", required: true, placeholder: "E.g., 'Global pharma company. Category management is centralized. We use Kraljic matrix for portfolio segmentation. Key focus on API suppliers...'" },
      MAIN_FOCUS_FIELD,
      { id: "categoryName", label: "Category Name", description: "Name of the category being analyzed", type: "text", required: true },
      { id: "annualSpend", label: "Annual Category Spend", description: "Total yearly spend in this category", type: "currency", required: true },
      { id: "supplierCount", label: "Number of Suppliers", description: "Current supplier base size", type: "number", required: true },
      { id: "marketStructure", label: "Market Structure", description: "Competitive landscape of supplier market", type: "select", required: true, options: ["Monopoly", "Oligopoly", "Fragmented", "Emerging"] },
      { id: "supplyRisk", label: "Supply Risk Level", description: "Risk of supply disruption", type: "select", required: true, options: ["Low", "Medium", "High", "Critical"] },
      { id: "businessImpact", label: "Business Impact", description: "How critical is this category to operations?", type: "select", required: true, options: ["Low", "Medium", "High", "Strategic"] },
      { id: "currentStrategy", label: "Current Strategy", description: "Describe your existing approach to this category", type: "textarea", required: true, placeholder: "E.g., 'Multi-source with 3 approved suppliers. Annual tenders. Focus on cost reduction...'" },
      { id: "painPoints", label: "Key Pain Points", description: "Main challenges in this category", type: "textarea", required: true, placeholder: "E.g., 'Price volatility, long lead times, quality inconsistency, supplier consolidation in market...'" },
      { id: "innovation Needs", label: "Innovation Requirements", description: "Are there innovation or sustainability goals?", type: "textarea", required: false, placeholder: "E.g., 'Need to reduce carbon footprint by 30%. Looking for bio-based alternatives...'" },
      { id: "contractStatus", label: "Contract Status", description: "Current contract situation", type: "select", required: true, options: ["Active Long-term", "Expiring Soon", "Spot Buying", "Renegotiating"] },
      { id: "stakeholders", label: "Key Stakeholders", description: "Who are the main internal stakeholders?", type: "text", required: false },
      { id: "historicalSavings", label: "Historical Savings %", description: "Savings achieved in last 3 years", type: "percentage", required: false },
      { id: "benchmarkData", label: "Available Benchmarks", description: "What benchmarking data do you have access to?", type: "text", required: false },
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
  {
    id: "negotiation-preparation",
    title: "Preparing for Negotiation",
    description:
      "Assess buying power, risks, and BATNA to formulate a robust negotiation strategy with tactical recommendations.",
    icon: Handshake,
    status: "available",
    category: "planning",
    strategySelector: "riskAppetite",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, typical supplier relationships, and negotiation culture", type: "textarea", required: true, placeholder: "E.g., 'Automotive OEM. Long-term supplier relationships valued. Negotiations typically annual. German Mittelstand suppliers prefer partnership approach...'" },
      MAIN_FOCUS_FIELD,
      { id: "negotiationSubject", label: "Negotiation Subject", description: "What are you negotiating?", type: "text", required: true },
      { id: "currentSpend", label: "Current/Expected Spend", description: "Annual value of the deal", type: "currency", required: true },
      { id: "supplierName", label: "Supplier Name", description: "Who are you negotiating with?", type: "text", required: true },
      { id: "relationshipHistory", label: "Relationship History", description: "How long and how well have you worked together?", type: "select", required: true, options: ["New Supplier", "1-2 Years", "3-5 Years", "Long-term Partner (5+ years)"] },
      { id: "buyingPower", label: "Your Buying Power", description: "How important are you to this supplier?", type: "select", required: true, options: ["Top 5 Customer", "Significant", "Average", "Small Account"] },
      { id: "marketAlternatives", label: "Alternative Suppliers", description: "How many viable alternatives exist?", type: "select", required: true, options: ["None (Sole Source)", "1-2 Alternatives", "3-5 Alternatives", "Many Alternatives"] },
      { id: "switchingCost", label: "Switching Cost", description: "Cost/effort to change suppliers", type: "select", required: true, options: ["Very High", "High", "Moderate", "Low"] },
      { id: "supplierDependency", label: "Supplier's Dependency on You", description: "What % of their revenue do you represent?", type: "select", required: false, options: ["<5%", "5-15%", "15-30%", ">30%"] },
      { id: "batna", label: "Your BATNA", description: "Best Alternative To Negotiated Agreement - what's your backup plan?", type: "textarea", required: true, placeholder: "E.g., 'Can switch to Supplier B within 6 months. Would cost €50k transition but saves 8% annually...'" },
      { id: "supplierBatna", label: "Supplier's BATNA (Estimate)", description: "What alternatives does the supplier have?", type: "textarea", required: false, placeholder: "E.g., 'They have excess capacity and actively seeking new customers. Lost a major account last year...'" },
      { id: "negotiationObjectives", label: "Primary Objectives", description: "What do you want to achieve? List top 3 priorities", type: "textarea", required: true, placeholder: "E.g., '1) 5% price reduction, 2) Extended payment terms to Net-60, 3) Guaranteed capacity for peak season...'" },
      { id: "mustHaves", label: "Must-Haves (Walk-away Points)", description: "Non-negotiable requirements", type: "textarea", required: true, placeholder: "E.g., 'Minimum 3% price reduction, keep same quality specs, no exclusivity clause...'" },
      { id: "niceToHaves", label: "Nice-to-Haves (Trade Items)", description: "Items you can trade or concede", type: "textarea", required: false, placeholder: "E.g., 'Could accept longer contract term, might increase volume commitment, willing to share demand forecasts...'" },
      { id: "knownConstraints", label: "Known Supplier Constraints", description: "What pressures is the supplier facing?", type: "textarea", required: false, placeholder: "E.g., 'Raw material costs up 12%, labor shortage in their region, capacity fully utilized...'" },
      { id: "timeline", label: "Negotiation Timeline", description: "When must this be concluded?", type: "select", required: true, options: ["Urgent (<1 month)", "Normal (1-3 months)", "Flexible (3-6 months)", "Strategic (6+ months)"] },
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
  {
    id: "procurement-project-planning",
    title: "Procurement Project Planning",
    description:
      "Analyze project inputs, outputs, and constraints to set strategic priorities using proven strategic analysis methods.",
    icon: Target,
    status: "available",
    category: "planning",
    strategySelector: "speedVsQuality",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, organizational structure, and strategic planning culture", type: "textarea", required: true, placeholder: "E.g., 'Global FMCG company. Matrix organization with regional procurement. Central category management for key spend areas. Strong focus on sustainability goals...'" },
      MAIN_FOCUS_FIELD,
      { id: "projectTitle", label: "Project Title", description: "Name of the procurement project", type: "text", required: true },
      { id: "projectObjective", label: "Project Objective", description: "Primary goal of the project", type: "textarea", required: true, placeholder: "E.g., 'Reduce packaging costs by 15% while transitioning to sustainable materials within 18 months'" },
      { id: "projectScope", label: "Scope & Boundaries", description: "What is in scope and out of scope?", type: "textarea", required: true, placeholder: "In scope: All primary packaging for EU markets. Out of scope: Secondary packaging, US operations..." },
      { id: "keyInputs", label: "Key Inputs Available", description: "Resources, data, and assets available for the project", type: "textarea", required: true, placeholder: "E.g., 'Current supplier contracts, 3-year spend data, sustainability audit results, stakeholder requirements...'" },
      { id: "expectedOutputs", label: "Expected Outputs", description: "Deliverables and outcomes expected", type: "textarea", required: true, placeholder: "E.g., 'New supplier contracts, cost reduction report, sustainability certification, implementation roadmap...'" },
      { id: "budgetConstraint", label: "Budget Constraint", description: "Available project budget", type: "currency", required: true },
      { id: "timelineConstraint", label: "Timeline Constraint", description: "Project deadline or duration", type: "text", required: true },
      { id: "resourceConstraint", label: "Resource Constraints", description: "Team size, skills, availability limitations", type: "text", required: true },
      { id: "stakeholders", label: "Key Stakeholders", description: "Primary stakeholders and their interests", type: "textarea", required: false, placeholder: "E.g., 'CFO (cost focus), Sustainability Director (ESG goals), Operations (supply continuity), Marketing (brand positioning)...'" },
      { id: "riskFactors", label: "Known Risk Factors", description: "Identified risks and uncertainties", type: "textarea", required: false, placeholder: "E.g., 'Supplier capacity constraints, regulatory changes, commodity price volatility, internal change resistance...'" },
      { id: "successCriteria", label: "Success Criteria", description: "How will success be measured?", type: "textarea", required: true, placeholder: "E.g., '15% cost reduction achieved, 80% sustainable materials by deadline, zero supply disruptions during transition...'" },
      { id: "strategicAlignment", label: "Strategic Alignment", description: "How does this align with company strategy?", type: "text", required: false },
      { id: "dependencies", label: "Dependencies & Prerequisites", description: "What must happen before or during the project?", type: "text", required: false },
    ],
    outputs: ["SWOT Analysis: Strengths, weaknesses, opportunities, threats for the project", "Priority Matrix: Critical vs nice-to-have activities mapped by effort/impact", "Stakeholder Map: Influence/interest matrix with engagement strategy", "Critical Path: Key milestones and decision points", "Risk Register: Prioritized risks with mitigation strategies"],
  },
  // New scenarios - Pre-flight Audit, SOW Scope-Creep Detector, Exit Strategy Planner, Specification Optimizer
  {
    id: "pre-flight-audit",
    title: "Pre-flight Audit",
    description:
      "Supplier intelligence gathering before negotiations. Get a comprehensive dossier on any supplier using just their website URL.",
    icon: Radar,
    status: "available",
    category: "planning",
    strategySelector: "skepticism",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry and what aspects of the supplier are most important to investigate", type: "textarea", required: true, placeholder: "E.g., 'We are an aerospace OEM evaluating a new machining supplier. Critical factors: quality certifications, financial stability, customer references in our sector...'" },
      MAIN_FOCUS_FIELD,
      { id: "supplierWebsite", label: "Supplier Website URL", description: "The main website URL of the supplier to research", type: "text", required: true },
      { id: "supplierName", label: "Supplier Company Name", description: "Official name of the supplier company", type: "text", required: true },
      { id: "plannedPurchase", label: "Planned Purchase Type", description: "What you intend to buy from this supplier", type: "text", required: true },
      { id: "estimatedValue", label: "Estimated Annual Value", description: "Approximate annual spend if awarded", type: "currency", required: false },
      { id: "existingRelationship", label: "Existing Relationship", description: "Have you worked with this supplier before?", type: "select", required: true, options: ["New Supplier", "Occasional", "Regular", "Strategic Partner"] },
      { id: "researchFocus", label: "Research Focus Areas", description: "What aspects are most important to investigate?", type: "select", required: true, options: ["Financial Health", "Legal/Litigation", "Market Reputation", "Technical Capability", "All Areas"] },
      { id: "urgency", label: "Decision Timeline", description: "When do you need this intelligence?", type: "select", required: false, options: ["Immediate (days)", "Short-term (weeks)", "Medium-term (months)"] },
      { id: "redFlags", label: "Known Concerns", description: "Any specific concerns or rumors you've heard?", type: "textarea", required: false, placeholder: "E.g., 'Heard they may have cash flow issues. CEO recently changed. Some employee reviews mention quality problems...'" },
    ],
    outputs: [
      "Supplier Dossier: Comprehensive intelligence report with verified facts",
      "News Digest: Recent news, lawsuits, mergers, and financial updates",
      "Risk Flags: Identified concerns matched against procurement risk patterns",
      "Negotiation Brief: Key leverage points and talking points for meetings",
      "Due Diligence Checklist: Items to verify during formal evaluation",
    ],
  },
  {
    id: "category-risk-evaluator",
    title: "Category Risk Evaluator",
    description:
      "Comprehensive category risk assessment at tender stage combining SOW analysis, market intelligence, and category dynamics to identify budget and supply risks before commitment.",
    icon: FileSearch,
    status: "available",
    category: "risk",
    strategySelector: "skepticism",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, typical contract risks, and category importance", type: "textarea", required: true, placeholder: "E.g., 'IT services for a bank. We've had issues with vendors adding change requests. This category is critical for digital transformation...'" },
      MAIN_FOCUS_FIELD,
      { id: "categoryName", label: "Category Name", description: "Name of the procurement category being evaluated", type: "text", required: true },
      { id: "tenderStage", label: "Tender Stage", description: "Current stage of the procurement process", type: "select", required: true, options: ["Pre-tender Planning", "RFI Stage", "RFP Active", "Bid Evaluation", "Negotiation Phase"] },
      // SOW Analysis Section
      { id: "sowText", label: "Statement of Work / Requirements", description: "Paste the SOW, RFP scope, or requirements to analyze for ambiguity", type: "textarea", required: false, placeholder: "Paste your Statement of Work, RFP requirements, or scope definition here. Include deliverables, timelines, and acceptance criteria..." },
      { id: "contractType", label: "Contract Type", description: "Commercial model for this engagement", type: "select", required: true, options: ["Fixed Price", "Time & Materials", "Cost Plus", "Hybrid/Capped T&M", "Framework Agreement"] },
      { id: "contractValue", label: "Estimated Contract Value", description: "Total estimated value", type: "currency", required: true },
      // Market Intelligence Section
      { id: "marketConcentration", label: "Market Concentration", description: "How concentrated is the supplier market?", type: "select", required: true, options: ["Fragmented (many players)", "Moderate (5-10 key players)", "Oligopoly (2-4 dominant)", "Near-monopoly"] },
      { id: "marketTrends", label: "Current Market Trends", description: "Key trends affecting this category", type: "textarea", required: true, placeholder: "E.g., 'Consolidation among vendors. Skills shortage driving prices up. AI disruption changing service models...'" },
      { id: "priceVolatility", label: "Price Volatility", description: "How volatile are prices in this category?", type: "select", required: true, options: ["Stable", "Moderate fluctuation", "High volatility", "Unpredictable"] },
      { id: "supplyRisk", label: "Supply Risk Level", description: "Overall supply availability risk", type: "select", required: true, options: ["Low - ample supply", "Medium - some constraints", "High - limited suppliers", "Critical - severe constraints"] },
      // Category Dynamics
      { id: "regulatoryExposure", label: "Regulatory Exposure", description: "Level of regulatory oversight", type: "select", required: true, options: ["Minimal", "Moderate", "High", "Critical"] },
      { id: "technologyChange", label: "Technology Change Rate", description: "How fast is technology changing in this category?", type: "select", required: false, options: ["Stable", "Gradual evolution", "Rapid change", "Disruptive change"] },
      { id: "substitutability", label: "Substitutability", description: "Ease of switching to alternatives", type: "select", required: true, options: ["Easy - many substitutes", "Moderate - some options", "Difficult - few alternatives", "Locked - no substitutes"] },
      { id: "pastIssues", label: "Historical Category Issues", description: "Past problems in this category?", type: "textarea", required: false, placeholder: "E.g., 'Previous vendor went bankrupt. Quality issues with last 2 suppliers. Significant scope creep on similar projects...'" },
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
  {
    id: "supplier-dependency-planner",
    title: "Supplier Dependency & Exit Planner",
    description:
      "Assess supplier dependency levels, calculate switching costs, evaluate portfolio concentration, and build diversification or exit roadmaps to reduce strategic risk.",
    icon: LogOut,
    status: "available",
    category: "risk",
    strategySelector: "costVsRisk",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, supply chain complexity, and strategic concerns", type: "textarea", required: true, placeholder: "E.g., 'Manufacturing company with high dependency on 3 key suppliers. Concerned about concentration risk after recent supply disruptions. Need to evaluate diversification options...'" },
      MAIN_FOCUS_FIELD,
      { id: "supplierName", label: "Supplier Name", description: "Supplier being assessed", type: "text", required: true },
      { id: "serviceCategory", label: "Service/Product Category", description: "What do they provide?", type: "text", required: true },
      { id: "annualSpend", label: "Annual Spend with Supplier", description: "Current annual expenditure", type: "currency", required: true },
      { id: "categoryTotalSpend", label: "Total Category Spend", description: "Total spend in this category across all suppliers", type: "currency", required: true },
      // Dependency Assessment
      { id: "spendConcentration", label: "Spend Concentration", description: "What % of category spend goes to this supplier?", type: "percentage", required: true },
      { id: "revenueShare", label: "Your Share of Supplier Revenue", description: "What % of their revenue do you represent?", type: "select", required: true, options: ["<5% (small customer)", "5-15% (significant)", "15-30% (major)", ">30% (dominant)", "Unknown"] },
      { id: "strategicImportance", label: "Strategic Importance", description: "How critical is this supplier to your operations?", type: "select", required: true, options: ["Commodity - easily replaced", "Important - some dependency", "Strategic - significant dependency", "Critical - business relies on them"] },
      { id: "uniqueCapabilities", label: "Unique Capabilities", description: "What can only this supplier provide?", type: "textarea", required: true, placeholder: "E.g., 'Proprietary technology for our core product. Only supplier with required certifications. Exclusive access to key materials...'" },
      // Lock-in Factors
      { id: "contractTerms", label: "Contract Terms", description: "Current contractual situation", type: "select", required: true, options: ["Month-to-month", "Annual renewable", "Multi-year (1-3)", "Long-term (3+)", "No contract"] },
      { id: "terminationPenalty", label: "Termination Penalty", description: "Cost to exit early", type: "select", required: false, options: ["None", "Minor fees", "Significant penalty", "Prohibitive", "Unknown"] },
      { id: "dataPortability", label: "Data/System Portability", description: "How easy is it to extract data/migrate systems?", type: "select", required: true, options: ["Easy - standard formats", "Moderate - some effort", "Difficult - proprietary", "Very difficult - locked in"] },
      { id: "integrationDepth", label: "Integration Depth", description: "How deeply integrated are their systems/processes?", type: "select", required: true, options: ["Surface level", "Moderate integration", "Deep integration", "Fully embedded"] },
      { id: "knowledgeDependency", label: "Knowledge Dependency", description: "Institutional knowledge held by supplier", type: "select", required: true, options: ["Low - documented", "Medium - some tacit knowledge", "High - significant expertise", "Critical - irreplaceable knowledge"] },
      // Market & Alternatives
      { id: "alternativeSuppliers", label: "Alternative Suppliers Available", description: "How many viable alternatives exist?", type: "select", required: true, options: ["Many (5+)", "Several (3-4)", "Few (2)", "Single source", "None identified"] },
      { id: "switchingTimeEstimate", label: "Estimated Switching Time", description: "Time needed to transition", type: "select", required: true, options: ["1-3 months", "3-6 months", "6-12 months", "12-24 months", ">24 months"] },
      { id: "switchingCostEstimate", label: "Estimated Switching Cost", description: "Approximate cost to switch suppliers", type: "currency", required: false },
      // Diversification Intent
      { id: "diversificationGoal", label: "Diversification Goal", description: "What outcome are you seeking?", type: "select", required: true, options: ["Reduce risk - add backup supplier", "Full replacement - exit supplier", "Rebalance portfolio - redistribute spend", "Evaluate options - no action yet"] },
      { id: "timeHorizon", label: "Time Horizon for Change", description: "When do you need to act?", type: "select", required: false, options: ["Urgent (<3 months)", "Near-term (3-12 months)", "Medium-term (1-2 years)", "Long-term (2+ years)"] },
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
  {
    id: "specification-optimizer",
    title: "Specification Optimizer",
    description:
      "Analyze technical specifications for 'gold plating' - excessive requirements that limit supplier options and unnecessarily inflate costs.",
    icon: Sparkles,
    status: "available",
    category: "analysis",
    strategySelector: "costVsRisk",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry and the purpose of this specification", type: "textarea", required: true, placeholder: "E.g., 'Chemical manufacturing equipment. Safety is paramount. Looking for cost savings without compromising on process requirements...'" },
      MAIN_FOCUS_FIELD,
      { id: "specificationText", label: "Technical Specification", description: "Paste the technical specification or requirements document", type: "textarea", required: true, placeholder: "Paste your technical specification here. Include material requirements, performance specs, certifications, tolerances, etc..." },
      { id: "specificationCategory", label: "Specification Category", description: "Type of product/service being specified", type: "select", required: true, options: ["Raw Materials", "Components", "Equipment/Machinery", "IT Hardware", "Software", "Professional Services", "Facilities/Construction", "Other"] },
      { id: "estimatedValue", label: "Estimated Purchase Value", description: "Budget or expected cost", type: "currency", required: true },
      { id: "specSource", label: "Specification Source", description: "Who created this specification?", type: "select", required: true, options: ["Engineering/Technical Team", "Incumbent Supplier", "Industry Standard", "Copied from Past Project", "Unknown Origin"] },
      { id: "lastReviewed", label: "Last Specification Review", description: "When was this spec last updated?", type: "select", required: false, options: ["Current (< 1 year)", "Recent (1-3 years)", "Old (3-5 years)", "Very Old (5+ years)", "Unknown"] },
      { id: "competitiveMarket", label: "Supplier Market", description: "How many suppliers can meet current spec?", type: "select", required: true, options: ["Many (5+)", "Several (3-4)", "Few (2)", "Single Source", "Unknown"] },
      { id: "safetyRequirements", label: "Safety/Compliance Criticality", description: "How critical are safety requirements?", type: "select", required: true, options: ["Safety Critical", "Compliance Required", "Best Practice", "Preference Only"] },
      { id: "performanceMargins", label: "Performance Margins", description: "Are specs significantly above actual need?", type: "select", required: false, options: ["Exactly as Needed", "Some Buffer", "Significant Over-spec", "Unknown"] },
      { id: "certificationRequirements", label: "Certification Requirements", description: "Special certifications required?", type: "text", required: false },
      { id: "tolerances", label: "Key Tolerances/Precision", description: "Any unusually tight tolerances specified?", type: "text", required: false },
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
  // Black Swan Scenario
  {
    id: "black-swan-scenario",
    title: "Black Swan Scenario Simulator",
    description:
      "Assess catastrophic risks with core suppliers and categories. Simulate Black Swan events and build proactive mitigation roadmaps before disruption strikes.",
    icon: Feather,
    status: "available",
    category: "risk",
    strategySelector: "riskAppetite",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, supply chain complexity, and past disruption experiences", type: "textarea", required: true, placeholder: "E.g., 'Global automotive manufacturer. Experienced chip shortage impact in 2021. Complex tier-2/3 supplier dependencies. Just-in-time inventory model...'" },
      MAIN_FOCUS_FIELD,
      { id: "assessmentScope", label: "Assessment Scope", description: "What are you assessing for Black Swan exposure?", type: "select", required: true, options: ["Single Critical Supplier", "Category/Commodity", "Geographic Region", "Entire Supply Base"] },
      { id: "scopeDetails", label: "Scope Details", description: "Name the supplier, category, or region being assessed", type: "text", required: true },
      { id: "annualExposure", label: "Annual Spend Exposed", description: "Total annual spend at risk in this scope", type: "currency", required: true },
      { id: "businessImpact", label: "Business Impact if Disrupted", description: "Revenue/operations impact of total failure", type: "select", required: true, options: ["Minor inconvenience", "Moderate disruption", "Significant business impact", "Catastrophic - threatens viability"] },
      // Current Risk Posture
      { id: "singleSourceItems", label: "Single-Source Dependencies", description: "How many single-source items in scope?", type: "select", required: true, options: ["None", "Few (1-3)", "Several (4-10)", "Many (10+)", "Unknown"] },
      { id: "geographicConcentration", label: "Geographic Concentration", description: "Are suppliers concentrated in specific regions?", type: "select", required: true, options: ["Globally diversified", "Multi-regional", "Single region", "Single country", "Single location"] },
      { id: "tierVisibility", label: "Supply Chain Visibility", description: "How deep can you see into sub-tiers?", type: "select", required: true, options: ["Tier 3+ visibility", "Tier 2 visibility", "Tier 1 only", "Limited visibility", "No visibility"] },
      { id: "inventoryBuffer", label: "Inventory Buffer", description: "How much safety stock do you hold?", type: "select", required: true, options: ["Months of stock", "Weeks of stock", "Days of stock", "Just-in-time/minimal", "Unknown"] },
      // Black Swan Scenarios to Simulate
      { id: "scenarioTypes", label: "Scenarios to Simulate", description: "Which Black Swan events to model?", type: "textarea", required: true, placeholder: "E.g., 'Pandemic lockdown of supplier region. Key supplier bankruptcy. Natural disaster at main factory. Geopolitical trade restrictions. Cyber attack on supplier...'" },
      { id: "recentNearMisses", label: "Recent Near-Misses", description: "Any recent events that almost caused major disruption?", type: "textarea", required: false, placeholder: "E.g., 'Supplier had fire but contained. Weather delayed shipment 2 weeks. Supplier acquired by competitor...'" },
      // Response Capability
      { id: "alternativesReady", label: "Pre-qualified Alternatives", description: "Are backup suppliers pre-qualified?", type: "select", required: true, options: ["Fully qualified and tested", "Qualified but untested", "Identified but not qualified", "None identified"] },
      { id: "responsePlaybook", label: "Crisis Response Playbook", description: "Do you have documented response plans?", type: "select", required: true, options: ["Detailed and tested", "Documented but untested", "Basic guidelines only", "None"] },
      { id: "financialReserve", label: "Financial Reserve for Crisis", description: "Budget available for emergency response", type: "select", required: false, options: ["Dedicated crisis fund", "General contingency available", "Would need approval", "None allocated"] },
      { id: "insuranceCoverage", label: "Supply Chain Insurance", description: "Is business interruption covered?", type: "select", required: false, options: ["Comprehensive coverage", "Partial coverage", "Minimal coverage", "No coverage", "Unknown"] },
      // Risk Tolerance
      { id: "acceptableDowntime", label: "Acceptable Downtime", description: "Maximum tolerable supply disruption", type: "select", required: true, options: ["Hours", "Days", "Weeks", "Months"] },
      { id: "investmentWillingness", label: "Mitigation Investment Willingness", description: "Budget for preventive measures", type: "select", required: false, options: ["Significant investment", "Moderate investment", "Minimal investment", "No budget available"] },
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
  // Spend Analysis & Categorization
  {
    id: "spend-analysis-categorization",
    title: "Spend Analysis & Categorization",
    description:
      "Turn messy accounting exports into a strategic procurement dashboard. Paste your top expenses, and AI will map them to standard procurement categories, identify 'tail spend', and spot consolidation opportunities.",
    icon: PieChart,
    status: "available",
    category: "analysis",
    requiredFields: [
      { id: "industryContext", label: "Industry & Business Context", description: "Describe your industry, business model, and procurement maturity level", type: "textarea", required: true, placeholder: "E.g., 'Mid-size SaaS company, ~200 employees. No dedicated procurement function. Most purchases handled by department heads with P-cards...'" },
      MAIN_FOCUS_FIELD,
      { id: "rawSpendData", label: "Raw Spend Data (Paste from Excel/CSV)", description: "Paste your top 20-100 expenses. Include Supplier Name, Description/Memo, and Amount. Raw text is perfectly fine.", type: "textarea", required: true, placeholder: "Supplier | Description | Amount\nAWS | Cloud hosting | 45000\nHubSpot | Marketing CRM | 18000\nOffice Depot | Supplies | 3200\n..." },
      { id: "timeframe", label: "Timeframe", description: "What period does this data cover? (e.g., Q3 2025, Last 12 Months)", type: "text", required: true },
      { id: "businessGoal", label: "Strategic Goal", description: "e.g., 'Need to cut OPEX by 10%', 'Looking for vendor consolidation', 'Preparing for an audit'", type: "text", required: false },
    ],
    outputs: [
      "Spend Taxonomy & Categorization Breakdown",
      "Tail Spend Identification (High volume, low value)",
      "Vendor Consolidation Opportunities",
      "Quick Wins & Strategic Next Steps",
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
