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
  LucideIcon,
} from "lucide-react";

export interface ScenarioRequiredField {
  id: string;
  label: string;
  description: string;
  type: "text" | "number" | "percentage" | "select" | "currency";
  required: boolean;
  options?: string[]; // For select type
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: "available" | "coming-soon";
  category: "analysis" | "planning" | "risk" | "documentation";
  requiredFields: ScenarioRequiredField[];
  outputs: string[];
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
    requiredFields: [
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
    requiredFields: [
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
    requiredFields: [
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
    requiredFields: [
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
    id: "risk-matrix",
    title: "Risk Matrix",
    description:
      "Supplier risk assessment covering legal, financial, cyber, and operational risks.",
    icon: Shield,
    status: "available",
    category: "risk",
    requiredFields: [
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
    requiredFields: [
      { id: "sowText", label: "SOW Text", description: "Paste the Statement of Work text", type: "text", required: true },
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
    requiredFields: [
      { id: "industry", label: "Industry", description: "Your business sector", type: "text", required: true },
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
    requiredFields: [
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
    requiredFields: [
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
    requiredFields: [
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
    requiredFields: [
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
    requiredFields: [
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
    requiredFields: [
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
    id: "budgeting-assistant",
    title: "Budgeting Assistant",
    description:
      "Build procurement budgets with historical analysis, growth forecasting, and risk buffers.",
    icon: Wallet,
    status: "available",
    category: "planning",
    requiredFields: [
      { id: "historicalSpend", label: "Historical Spend", description: "Previous period spending", type: "currency", required: true },
      { id: "growthForecast", label: "Growth Forecast %", description: "Expected business growth", type: "percentage", required: true },
      { id: "headcountPlan", label: "Headcount Plan", description: "Staffing changes expected", type: "number", required: true },
      { id: "marketPriceTrend", label: "Market Price Trend %", description: "Expected price changes", type: "percentage", required: true },
      { id: "fixedVsVariable", label: "Fixed vs Variable Split %", description: "Percentage of fixed costs", type: "percentage", required: false },
      { id: "seasonalityFactor", label: "Seasonality Factor", description: "Seasonal demand variation", type: "select", required: false, options: ["None", "Mild", "Significant"] },
      { id: "oneOffProjects", label: "One-Off Projects", description: "Special initiatives planned", type: "text", required: false },
      { id: "contingencyBuffer", label: "Contingency Buffer %", description: "Risk reserve percentage", type: "percentage", required: true },
      { id: "departmentTargets", label: "Department Targets", description: "Cost reduction goals by area", type: "text", required: false },
      { id: "currencyVolatility", label: "Currency Volatility Impact", description: "FX risk consideration", type: "select", required: false, options: ["Low", "Medium", "High"] },
    ],
    outputs: ["Budget Sheet: Quarterly and category breakdown (Excel-ready)", "Risk Heatmap: Areas prone to overspending", "Board Justification: Budget narrative for leadership"],
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
