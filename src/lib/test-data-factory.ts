/**
 * Test Data Factory
 *
 * Generates realistic business case data for scenario testing.
 * Each generator returns data that fills all required fields with
 * plausible values for the given scenario type.
 * 
 * @module test-data-factory
 */

type TestDataGenerator = () => Record<string, string>;

// Utility functions for random data generation
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomCurrency = (min: number, max: number): string => 
  randomNumber(min, max).toString();
const randomPercentage = (min: number, max: number): string => 
  randomNumber(min, max).toString();

// Industry context templates for realistic business descriptions
const industryContexts = {
  manufacturing: [
    "Mid-size automotive parts manufacturer in Southern Germany. We supply tier-1 OEMs with precision-machined components. IATF 16949 certified. Strong focus on cost efficiency and zero-defect culture. Currently exploring automation to address skilled labor shortage.",
    "Industrial machinery manufacturer based in the Midwest US. Our products serve the food processing industry. FDA compliance requirements. 200 employees with in-house engineering but limited digital capabilities.",
    "Electronics contract manufacturer in Czech Republic. We produce PCBAs for medical device companies. ISO 13485 certified. High-mix, low-volume production model with strict traceability requirements.",
  ],
  software: [
    "B2B SaaS company providing HR management solutions to enterprises. 150 employees, Series B funded. SOC2 Type 2 certified. We process sensitive employee data and require all vendors to meet strict security standards.",
    "Fintech startup building payment infrastructure for e-commerce. PCI-DSS compliant. Rapid growth phase with 80% YoY user growth. AWS-native architecture, heavily dependent on third-party APIs.",
    "Enterprise software company serving the insurance industry. 500+ employees, publicly traded. Legacy mainframe systems being gradually migrated to cloud. Strict change management processes.",
  ],
  healthcare: [
    "Regional hospital network with 3 facilities and 2,000 employees. HIPAA compliance is critical. We're modernizing our IT infrastructure and evaluating new vendor partnerships for medical equipment.",
    "Pharmaceutical manufacturing company producing generic medications. FDA and EMA regulated facilities. Single-source dependency for several APIs is a strategic concern.",
    "Medical device startup developing diagnostic equipment. ISO 13485 in process. Small team of 40, limited procurement expertise. Pre-revenue, VC-backed.",
  ],
  retail: [
    "E-commerce fashion retailer with $50M annual revenue. Omnichannel strategy with 12 physical stores. Peak season (Nov-Dec) represents 40% of annual sales. Shopify-based with multiple third-party integrations.",
    "Grocery chain with 45 stores across the Pacific Northwest. Thin margins require aggressive cost management. Private label products growing as a percentage of sales.",
    "Luxury goods retailer with global presence. Brand protection and customer experience are paramount. High-touch customer service model with long sales cycles.",
  ],
  professional: [
    "Management consulting firm with 300 consultants across 5 offices. Knowledge management and IP protection are critical. High travel expenses and contractor utilization.",
    "Law firm specializing in corporate M&A. 150 attorneys, partnership model. Strict confidentiality requirements. Document management and eDiscovery are major cost centers.",
    "Engineering services company providing design and project management for infrastructure projects. Government contracts represent 60% of revenue. DBE certification requirements.",
  ],
};

const getRandomIndustryContext = (): string => {
  const industries = Object.values(industryContexts);
  const industry = randomChoice(industries);
  return randomChoice(industry);
};

// Scenario-specific data generators
const generators: Record<string, TestDataGenerator> = {
  "make-vs-buy": () => ({
    industryContext: getRandomIndustryContext(),
    internalSalary: randomCurrency(65000, 120000),
    recruitingCost: randomCurrency(8000, 25000),
    managementTime: randomNumber(8, 40).toString(),
    officeItPerHead: randomCurrency(5000, 15000),
    agencyFee: randomCurrency(80000, 250000),
    agencyOnboardingSpeed: randomNumber(5, 30).toString(),
    knowledgeRetentionRisk: randomChoice(["Low", "Medium", "High"]),
    qualityBenchmark: randomNumber(6, 10).toString(),
    peakLoadCapacity: randomChoice(["Yes", "No", "Partial"]),
    strategicImportance: randomNumber(4, 10).toString(),
  }),

  "tail-spend-sourcing": () => ({
    industryContext: getRandomIndustryContext(),
    purchaseAmount: randomCurrency(500, 15000),
    urgency: randomNumber(1, 30).toString(),
    catalogAvailable: randomChoice(["Yes", "No"]),
    quotesCount: randomNumber(0, 5).toString(),
    paymentTerms: randomChoice(["Corporate Card", "Invoice", "Purchase Order"]),
    warranty: randomChoice(["Yes", "No"]),
    deliveryCost: randomCurrency(0, 500),
    returnRisk: randomChoice(["Low", "Medium", "High"]),
    alternativesExist: randomChoice(["Yes", "No"]),
    approvalRequired: randomChoice(["Yes", "No"]),
  }),

  "supplier-review": () => ({
    industryContext: getRandomIndustryContext(),
    qualityScore: randomNumber(5, 10).toString(),
    onTimeDelivery: randomPercentage(75, 99),
    incidentCount: randomNumber(0, 8).toString(),
    communicationScore: randomNumber(5, 10).toString(),
    innovationScore: randomNumber(3, 10).toString(),
    financialStability: randomChoice(["Strong", "Moderate", "At Risk"]),
    socialResponsibility: randomChoice(["Certified", "In Progress", "None"]),
    priceVsMarket: randomChoice(["Below Market", "At Market", "Above Market"]),
    crisisSupport: randomChoice(["Excellent", "Good", "Poor"]),
    spendVolume: randomCurrency(100000, 5000000),
  }),

  "disruption-management": () => ({
    industryContext: getRandomIndustryContext(),
    deficitSku: randomChoice([
      "High-grade aluminum alloy sheets",
      "Custom ASIC chips",
      "Medical-grade silicone tubing",
      "Specialty lubricants",
      "Carbon fiber composite panels",
      "Pharmaceutical API compound",
    ]),
    stockDays: randomNumber(3, 45).toString(),
    altSuppliers: randomNumber(0, 4).toString(),
    altProducts: randomChoice(["Yes", "No", "Partial"]),
    substitutePrice: randomPercentage(5, 50),
    switchingTime: randomNumber(7, 90).toString(),
    lostRevenuePerDay: randomCurrency(10000, 500000),
    inTransitStatus: randomChoice(["Yes", "No", "Unknown"]),
    forceMajeureClause: randomChoice(["Yes", "No", "Unclear"]),
    competitorResponse: randomChoice([
      "Competitors facing similar issues",
      "Main competitor has secured alternative supply",
      "Industry-wide shortage reported",
      "Unknown at this time",
    ]),
  }),

  "risk-assessment": () => ({
    industryContext: getRandomIndustryContext(),
    assessmentSubject: randomChoice([
      "Primary logistics provider",
      "Critical component supplier",
      "IT infrastructure vendor",
      "Offshore manufacturing partner",
      "Raw material supplier",
    ]),
    annualValue: randomCurrency(500000, 10000000),
    marketVolatility: randomChoice(["Stable", "Moderate", "Volatile", "Highly Volatile"]),
    regulatoryExposure: randomChoice(["Minimal", "Moderate", "High", "Critical"]),
    geopoliticalRisk: randomChoice(["Low", "Medium", "High", "Critical"]),
    commodityDependency: randomChoice(["None", "Low", "Moderate", "High"]),
    contractType: randomChoice(["Spot/No Contract", "Short-term (<1yr)", "Medium-term (1-3yr)", "Long-term (3+yr)"]),
    liabilityProtection: randomChoice(["Comprehensive", "Standard", "Limited", "None"]),
    terminationRights: randomChoice(["Flexible", "Moderate Notice", "Restrictive", "Locked In"]),
    priceAdjustmentMechanism: randomChoice(["Fixed", "Index-linked", "Negotiable", "Supplier Discretion"]),
    currentChallenges: randomChoice([
      "Supplier announced 15% price increase effective Q2. Lead times extended from 4 to 8 weeks. Quality scores stable.",
      "Recent capacity expansion by supplier should improve availability. Currency volatility affecting landed cost. New CEO appointed.",
      "Port congestion causing delays. Supplier's main facility in earthquake-prone zone. No recent incidents but insurance costs rising.",
      "Raw material shortage upstream affecting supplier. Two quality escapes in past quarter. Supplier investing in automation.",
    ]),
    supplierFinancialHealth: randomChoice(["Strong", "Stable", "Concerning", "At Risk"]),
    supplyChainVisibility: randomChoice(["Full Visibility", "Tier 1 Only", "Limited", "None"]),
    recentIncidents: randomChoice([
      "Minor quality issue in Q3, resolved with corrective action. No delivery delays.",
      "Two late deliveries due to logistics issues. No quality problems reported.",
      "Clean record for past 12 months. Annual audit passed with minor findings.",
      "",
    ]),
    businessCriticality: randomChoice(["Low", "Medium", "High", "Mission Critical"]),
    recoveryTime: randomChoice(["Hours", "Days", "Weeks", "Months"]),
  }),

  "tco-analysis": () => ({
    industryContext: getRandomIndustryContext(),
    assetDescription: randomChoice([
      "Industrial CNC machining center with 5-axis capability",
      "Enterprise ERP system implementation",
      "Fleet of 20 electric delivery vehicles",
      "Automated warehouse picking system",
      "Commercial HVAC system for new facility",
    ]),
    ownershipPeriod: randomNumber(5, 15).toString(),
    purchasePrice: randomCurrency(250000, 2000000),
    installationCost: randomCurrency(15000, 150000),
    trainingCost: randomCurrency(5000, 50000),
    integrationCost: randomCurrency(10000, 100000),
    annualMaintenance: randomCurrency(15000, 100000),
    energyConsumption: randomCurrency(5000, 50000),
    consumablesCost: randomCurrency(2000, 30000),
    laborCost: randomCurrency(20000, 80000),
    insuranceCost: randomCurrency(2000, 20000),
    vendorLockInRisk: randomChoice(["None", "Low", "Moderate", "High", "Critical"]),
    proprietaryComponents: randomPercentage(10, 80),
    alternativeSuppliers: randomChoice(["Many", "Some", "Few", "None"]),
    dataPortability: randomChoice(["Full Export", "Partial", "Difficult", "Locked In"]),
    technologyObsolescence: randomChoice(["Low", "Medium", "High", "Imminent"]),
    marketPriceTrend: randomChoice(["Decreasing", "Stable", "Increasing", "Volatile"]),
    regulatoryChanges: randomChoice(["Minimal", "Possible", "Likely", "Certain"]),
    inflationAssumption: randomPercentage(2, 6),
    currencyExposure: randomChoice(["None", "Low", "Moderate", "High"]),
    interestRate: randomPercentage(4, 12),
    residualValue: randomCurrency(25000, 300000),
    decommissioningCost: randomCurrency(5000, 50000),
    dataMigrationCost: randomCurrency(10000, 80000),
    downtimeRisk: randomChoice(["Very High (99%+)", "High (97-99%)", "Moderate (95-97%)", "Low (<95%)"]),
    downtimeCostPerHour: randomCurrency(1000, 50000),
  }),

  "software-licensing": () => ({
    industryContext: getRandomIndustryContext(),
    softwareName: randomChoice([
      "Salesforce Sales Cloud",
      "Microsoft 365 Enterprise",
      "SAP S/4HANA",
      "Adobe Creative Cloud",
      "Slack Enterprise Grid",
      "Atlassian Suite",
      "ServiceNow ITSM",
    ]),
    softwareCategory: randomChoice(["Productivity Suite", "CRM/Sales", "ERP", "Development Tools", "Design/Creative", "Analytics/BI", "Communication"]),
    totalUsers: randomNumber(50, 1000).toString(),
    powerUsers: randomNumber(10, 100).toString(),
    regularUsers: randomNumber(20, 400).toString(),
    occasionalUsers: randomNumber(20, 500).toString(),
    externalUsers: randomNumber(0, 100).toString(),
    userGrowthRate: randomPercentage(5, 30),
    perUserMonthly: randomCurrency(10, 150),
    enterpriseTierCost: randomCurrency(50000, 500000),
    usageBasedRate: randomCurrency(1, 10),
    implementationCost: randomCurrency(20000, 200000),
    contractLength: randomChoice(["Month-to-Month", "1 Year", "2 Years", "3 Years"]),
    longTermDiscount: randomPercentage(5, 30),
    annualEscalation: randomPercentage(3, 8),
    paymentTerms: randomChoice(["Monthly", "Quarterly", "Annual Upfront"]),
    terminationClause: randomChoice(["Free Exit", "Prorated Refund", "No Refund", "Penalty Fee"]),
    dataExportability: randomChoice(["Full Export (Standard Formats)", "Export with Limitations", "Difficult Export", "Proprietary Format Only"]),
    integrationDependency: randomChoice(["Standalone", "Light Integration", "Moderate Integration", "Deep Integration"]),
    switchingCostEstimate: randomCurrency(30000, 300000),
    alternativeProducts: randomChoice(["Many (5+)", "Some (2-4)", "Few (1-2)", "None"]),
    proprietaryFeatures: randomChoice(["None", "Low", "Moderate", "High"]),
    vendorStability: randomChoice(["Market Leader", "Established", "Growing", "Startup/At Risk"]),
    complianceRequirements: randomChoice(["SOC2, GDPR", "HIPAA, SOC2", "ISO 27001", "PCI-DSS", ""]),
    currentSolution: randomChoice(["Legacy on-premise system", "Competitor SaaS product", "Manual spreadsheets", ""]),
    currentAnnualCost: randomCurrency(30000, 200000),
  }),

  "risk-matrix": () => ({
    industryContext: getRandomIndustryContext(),
    legalStatus: randomChoice(["Verified", "Pending", "Issues Found"]),
    lawsuits: randomChoice(["None", "Minor", "Significant"]),
    dataAccess: randomChoice(["None", "Limited", "Sensitive", "Critical"]),
    financialHealth: randomChoice(["Strong", "Moderate", "Weak"]),
    concentration: randomChoice(["Diversified", "Moderate", "Single Client"]),
    environmentalRisk: randomChoice(["Low", "Medium", "High"]),
    sanctionsRisk: randomChoice(["None", "Low", "Medium", "High"]),
    cyberSecurity: randomChoice(["Certified", "Adequate", "Concerning"]),
    insurance: randomChoice(["Comprehensive", "Basic", "None"]),
    siteAudits: randomChoice(["Recent", "Outdated", "Never"]),
  }),

  "sow-critic": () => ({
    industryContext: getRandomIndustryContext(),
    sowText: `STATEMENT OF WORK

1. SCOPE
Provider shall deliver a comprehensive digital transformation solution including:
- Migration of legacy systems to cloud infrastructure
- Implementation of new CRM platform
- Training for up to 50 end users
- 12-month post-implementation support

2. DELIVERABLES
- Technical architecture document
- Migrated and tested cloud environment
- Configured CRM with custom workflows
- User training materials and sessions
- Monthly status reports

3. TIMELINE
Project duration: 6 months from contract signing
Phase 1 (Discovery): Weeks 1-4
Phase 2 (Build): Weeks 5-16
Phase 3 (Testing): Weeks 17-20
Phase 4 (Go-Live): Weeks 21-24

4. ACCEPTANCE
Client shall review each deliverable within 10 business days. Silence constitutes acceptance.

5. PAYMENT
50% upon signing, 25% at Phase 2 completion, 25% at Go-Live.`,
    deliverables: "Cloud environment, CRM implementation, training, documentation, 12-month support",
    acceptanceCriteria: "Client review within 10 business days, silence = acceptance",
    timeline: "6 months total, 4 phases as outlined in SOW",
    responsibilities: "Provider: all technical work. Client: provide access, attend training, approve deliverables",
    clientResources: "VPN access, sandbox environment, subject matter experts availability",
    exclusions: "Hardware procurement, third-party license costs, data cleansing",
    changeProcess: "Not explicitly defined in current SOW",
    penalties: "None defined",
    warrantyPeriod: "12-month support included",
  }),

  "sla-definition": () => ({
    industryContext: getRandomIndustryContext(),
    operatingHours: randomChoice(["24/7", "Business Hours (8/5)", "Extended (12/6)"]),
    responseTime: randomChoice(["1 hour", "4 hours", "8 hours", "24 hours"]),
    resolutionTime: randomChoice(["4 hours", "8 hours", "24 hours", "72 hours"]),
    allowedDowntime: randomPercentage(0, 5),
    serviceCriticality: randomChoice(["Mission Critical", "Important", "Standard"]),
    contactMethods: randomChoice([
      "Email, Phone, Ticketing System",
      "Dedicated Slack channel, Phone hotline",
      "Web portal only",
    ]),
    escalationProcess: randomChoice([
      "Tier 1 → Tier 2 (after 2 hours) → Management (after 8 hours)",
      "All issues directly to account manager",
      "Standard ticketing queue with priority flags",
    ]),
    reportingFrequency: randomChoice(["Weekly", "Monthly", "Quarterly"]),
    qualityBonuses: randomChoice([
      "5% rebate for >99.5% uptime",
      "None",
      "Free additional service month for zero incidents",
    ]),
  }),

  "rfp-generator": () => ({
    industryContext: getRandomIndustryContext(),
    procurementSubject: randomChoice([
      "IT Managed Services for 3-year term",
      "Commercial cleaning services for headquarters",
      "Employee benefits administration",
      "Fleet management and telematics solution",
      "Corporate travel management services",
    ]),
    volume: randomChoice([
      "Approximately 200 employees, 3 office locations",
      "$2M annual spend under management",
      "50 vehicles across 5 states",
      "Single facility, 100,000 sq ft",
    ]),
    technicalRequirements: "See detailed specification in Attachment A. Key requirements include 24/7 support, SLA of 99.5% uptime, integration with existing systems.",
    supplierQualifications: "Minimum 5 years in business, 3 comparable references, relevant certifications (ISO 27001, SOC2), $5M liability insurance",
    location: randomChoice([
      "Chicago, IL metropolitan area",
      "Remote delivery acceptable with quarterly on-site visits",
      "Multiple US locations - see Attachment B",
    ]),
    submissionDeadline: "30 days from RFP issue date",
    priceStructure: "Fixed monthly fee with usage tiers. Breakdown by: base fee, per-user costs, professional services rates",
    evaluationWeights: "Price 35%, Technical Capability 30%, Experience 20%, Implementation Plan 15%",
    ndaTerms: randomChoice(["Standard NDA", "Custom NDA", "None Required"]),
    responseFormat: "Structured response following provided template. Maximum 30 pages plus attachments.",
  }),

  "volume-consolidation": () => ({
    industryContext: getRandomIndustryContext(),
    suppliers: randomNumber(5, 15).toString(),
    totalSpend: randomCurrency(1000000, 20000000),
    topSupplierShare: randomPercentage(15, 45),
    qualityVariance: randomChoice(["Low", "Medium", "High"]),
    switchingCost: randomChoice(["Low", "Medium", "High"]),
    contractsExpiring: randomNumber(2, 8).toString(),
  }),

  "category-strategy": () => ({
    industryContext: getRandomIndustryContext(),
    categoryName: randomChoice([
      "Packaging Materials",
      "IT Hardware",
      "Professional Services",
      "Logistics and Transportation",
      "Marketing Services",
      "MRO Supplies",
    ]),
    annualSpend: randomCurrency(500000, 15000000),
    supplierCount: randomNumber(3, 25).toString(),
    marketConcentration: randomChoice(["Fragmented", "Moderate", "Concentrated", "Oligopoly"]),
    switchingBarrier: randomChoice(["Low", "Medium", "High"]),
    strategicImportance: randomChoice(["Low", "Medium", "High", "Critical"]),
    supplyRisk: randomChoice(["Low", "Medium", "High"]),
    currentContract: randomChoice(["Spot buying", "Annual contracts", "Multi-year agreement", "Framework agreement"]),
  }),

  "cost-breakdown": () => ({
    industryContext: getRandomIndustryContext(),
    productName: randomChoice([
      "Custom injection-molded plastic housing",
      "Precision machined aluminum bracket",
      "Printed circuit board assembly",
      "Specialty adhesive compound",
    ]),
    unitPrice: randomCurrency(10, 500),
    annualVolume: randomNumber(1000, 100000).toString(),
    materialCost: randomPercentage(30, 60),
    laborCost: randomPercentage(15, 35),
    overheadCost: randomPercentage(10, 25),
    profitMargin: randomPercentage(5, 20),
    toolingAmortization: randomCurrency(0, 50000),
    logisticsCost: randomPercentage(3, 12),
  }),

  "negotiation-prep": () => ({
    industryContext: getRandomIndustryContext(),
    counterparty: randomChoice([
      "Global logistics provider",
      "Regional IT services company",
      "Specialty chemical supplier",
      "Large consulting firm",
    ]),
    negotiationType: randomChoice(["Contract renewal", "New supplier", "Price increase pushback", "Scope expansion"]),
    currentSpend: randomCurrency(200000, 5000000),
    relationshipYears: randomNumber(1, 15).toString(),
    batna: randomChoice([
      "Qualified backup supplier at 10% premium",
      "Insourcing capability exists",
      "Limited alternatives available",
      "Strong alternative shortlisted",
    ]),
    targetOutcome: randomChoice([
      "5-10% cost reduction",
      "Extended payment terms",
      "Improved SLA commitments",
      "Volume flexibility",
    ]),
  }),
};

/**
 * Generates test data for a given scenario type
 * Returns form data that fills required fields with realistic values
 */
export function generateTestData(scenarioId: string): Record<string, string> {
  const generator = generators[scenarioId];
  
  if (!generator) {
    console.warn(`[TestDataFactory] No generator found for scenario: ${scenarioId}`);
    // Return minimal fallback data
    return {
      industryContext: getRandomIndustryContext(),
    };
  }
  
  return generator();
}

/**
 * Get list of all supported scenario IDs
 */
export function getSupportedScenarios(): string[] {
  return Object.keys(generators);
}
