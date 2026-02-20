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

// Industry context templates for realistic business descriptions (100+ words each)
const industryContexts = {
  manufacturing: [
    "We are a mid-size automotive parts manufacturer headquartered in Southern Germany with approximately 450 employees across two production facilities. Our core business is supplying tier-1 OEMs (primarily BMW, Mercedes-Benz, and Volkswagen) with precision-machined aluminum and steel components for powertrain and chassis applications. We hold IATF 16949 certification and are currently pursuing carbon neutrality targets mandated by our major customers. Our competitive advantage lies in rapid prototyping capabilities and consistent zero-defect delivery performance. Key challenges include a skilled labor shortage in CNC machining, rising energy costs following recent geopolitical events, and pressure to transition capabilities toward electric vehicle components. We operate a just-in-time delivery model with 48-hour lead time requirements for most customers. Annual procurement spend is approximately €35M, with raw materials representing 60% of that figure. Our procurement team of 8 professionals manages approximately 200 active suppliers across direct and indirect categories.",
    "Industrial machinery manufacturer based in the Midwest United States, specializing in custom food processing equipment for the dairy and beverage industries. We employ 200 people including a strong in-house mechanical and electrical engineering team, though our digital and software capabilities remain limited. FDA compliance is mandatory for all equipment we produce, requiring extensive documentation and material traceability. Our typical sales cycle is 6-12 months with high customization requirements. We source heavily from both domestic and international suppliers, with lead times becoming increasingly unpredictable. Key procurement categories include stainless steel fabrications, motors and drives, control systems, and maintenance supplies. We are exploring automation solutions to address rising labor costs and capacity constraints. Our procurement function is relatively immature, with significant opportunity for category management and strategic sourcing improvements. Annual spend exceeds $25M with approximately 150 active suppliers across all categories.",
    "Electronics contract manufacturer operating from a modern facility in Czech Republic, producing printed circuit board assemblies (PCBAs) primarily for medical device companies in Western Europe. We are ISO 13485 certified with a high-mix, low-volume production model that demands exceptional flexibility and traceability. Our customer base includes several Fortune 500 medical device manufacturers who require complete component genealogy and rigorous quality documentation. We process approximately 2,000 unique part numbers monthly with batch sizes ranging from 50 to 5,000 units. Key procurement challenges include semiconductor availability (though improving), conflict mineral compliance, and managing a complex approved vendor list with customer-mandated sources. We employ 180 staff including 25 in our supply chain and procurement department. Strategic priorities include reducing single-source dependencies and improving demand forecasting accuracy with our customers. Annual component procurement exceeds €40M.",
  ],
  software: [
    "We are a B2B SaaS company providing human resources management solutions to mid-market and enterprise clients, primarily in North America and Western Europe. Our platform handles sensitive employee data including payroll, benefits, and performance management, requiring SOC2 Type 2 certification and GDPR compliance across all our operations and vendor relationships. Currently at 150 employees following our Series B funding round, we are scaling rapidly with aggressive hiring targets. Our technology stack is primarily AWS-based with a microservices architecture. Key procurement categories include cloud infrastructure, development tools, security solutions, and professional services for implementation support. We require all vendors handling employee data to meet our stringent security standards, including annual penetration testing and formal incident response procedures. Our procurement challenges include managing software sprawl, optimizing cloud spend, and ensuring vendor security compliance at scale. Annual indirect spend is approximately $8M.",
    "Fintech startup building payment infrastructure and checkout solutions for e-commerce platforms, primarily serving the European and LATAM markets. We are PCI-DSS Level 1 compliant and maintain SOC2 certification, processing over €500M in transactions annually. Our rapid growth phase (80% YoY user growth) creates significant procurement challenges around scaling infrastructure while maintaining security and compliance. Our architecture is AWS-native with heavy reliance on third-party APIs for payment processing, fraud detection, and identity verification. We employ 120 people across engineering, operations, and commercial teams. Key vendor relationships include payment schemes, banking partners, cloud providers, and specialized fintech service providers. Procurement priorities include negotiating volume-based pricing as we scale, ensuring business continuity through vendor diversification, and managing the complexity of multi-currency, multi-jurisdiction regulatory requirements. Our procurement function is maturing rapidly from startup-style ad-hoc purchasing. Annual technology spend exceeds $5M.",
    "Enterprise software company serving the insurance industry with claims management and policy administration solutions. We are publicly traded with 500+ employees across offices in the US, UK, and India. Our customer base includes several top-20 global insurers who require extensive security due diligence and long-term vendor stability. We operate legacy mainframe systems that are being gradually migrated to cloud-based microservices, creating complex hybrid architecture challenges. Change management processes are rigorous given the regulated nature of our customers' businesses. Procurement categories include IT infrastructure, professional services (consulting and implementation), office facilities, and travel. Our procurement organization is centralized with category managers for key spend areas. Strategic initiatives include vendor consolidation, improving contract compliance, and implementing a new procure-to-pay system. Annual procurement spend exceeds $40M with significant opportunity for savings through strategic sourcing.",
  ],
  healthcare: [
    "We are a regional hospital network operating three acute care facilities and twelve outpatient clinics across the metropolitan area, employing approximately 2,000 clinical and administrative staff. HIPAA compliance is fundamental to all our operations, requiring rigorous vendor security assessments and business associate agreements for any technology or service provider accessing patient data. We are currently undertaking a major IT infrastructure modernization program, including EHR optimization, cybersecurity improvements, and telehealth expansion. Key procurement categories include medical devices and equipment, pharmaceuticals, IT systems, facilities maintenance, and clinical supplies. Our GPO (Group Purchasing Organization) relationship covers approximately 70% of our supply spend, but we maintain direct contracting relationships for high-value categories. Challenges include supply chain resilience following recent disruptions, managing physician preference items, and balancing cost reduction with quality of care requirements. Our procurement team of 15 professionals manages approximately $180M in annual spend.",
    "Pharmaceutical manufacturing company producing generic medications for the European and North American markets. We operate three FDA and EMA regulated manufacturing facilities with a combined workforce of 800 employees. Our product portfolio includes over 150 SKUs across solid oral dosage forms and injectables. Supply chain reliability is critical given the life-saving nature of our products and strict regulatory requirements around supply continuity. A strategic concern is our single-source dependency for several active pharmaceutical ingredients (APIs), particularly those sourced from Asian suppliers. Key procurement categories include APIs, excipients, packaging materials, equipment and maintenance, and contract manufacturing services. We are investing heavily in supply chain visibility and supplier quality management systems. Regulatory changes around serialization and environmental compliance are driving significant procurement and supplier development activity. Annual procurement spend exceeds €120M with raw materials representing the largest category.",
    "Medical device startup developing next-generation diagnostic equipment for point-of-care testing applications. We are a small team of 40 employees, predominantly engineers and scientists, with limited procurement expertise on staff. Currently pre-revenue and VC-backed, we are working toward ISO 13485 certification and FDA 510(k) clearance for our first product. Our supply chain is still being established, with key decisions pending around contract manufacturing versus in-house production. Procurement needs include prototype components, test equipment, contract design and manufacturing services, and regulatory consulting. We face challenges typical of startups: limited leverage with suppliers, cash flow constraints affecting payment terms, and building quality systems from scratch. Our immediate priorities are establishing a reliable supplier base for critical components and negotiating favorable terms with potential contract manufacturers. Budget constraints require creative approaches to procurement while maintaining quality standards required for medical devices.",
  ],
  retail: [
    "E-commerce fashion retailer with $50M annual revenue, operating an omnichannel business model with our online platform and 12 physical retail locations across major metropolitan areas. Peak season (November-December) represents approximately 40% of annual sales, creating significant demand forecasting and inventory management challenges. Our technology stack is Shopify-based with multiple third-party integrations for payments, shipping, marketing automation, and customer service. We work with approximately 200 suppliers, primarily apparel manufacturers in Southeast Asia and Southern Europe. Key procurement categories include merchandise (managed separately by our buying team), fulfillment and logistics, marketing services, technology and SaaS subscriptions, and store operations. Our procurement function is relatively lean with three team members managing approximately $15M in indirect spend. Strategic priorities include improving logistics cost efficiency, optimizing our marketing spend ROI, and reducing the complexity of our technology vendor landscape through consolidation.",
    "Grocery retail chain operating 45 stores across the Pacific Northwest region, serving approximately 500,000 customers weekly. Our business operates on thin margins (typically 2-3% net), requiring aggressive and sophisticated cost management across all categories. Private label products are growing as a percentage of sales, currently representing 22% of revenue, and this is a strategic priority area. Our procurement organization manages relationships with hundreds of suppliers across fresh produce, packaged goods, and store operations categories. We participate in a buying cooperative for national brand products but maintain direct relationships for regional and local suppliers. Key challenges include managing price volatility in fresh categories, ensuring supply chain resilience, and competing effectively against both traditional grocers and discount formats. We are investing in technology to improve demand forecasting, reduce shrinkage, and optimize promotional effectiveness. Annual procurement spend across all categories exceeds $400M.",
    "Luxury goods retailer with a global presence across 25 boutique locations in major cities including New York, London, Paris, Tokyo, and Dubai. Our brand positioning emphasizes exclusivity, craftsmanship, and exceptional customer experience, which significantly influences our procurement decisions and vendor relationships. We work primarily with artisan manufacturers and premium service providers who understand and can deliver to luxury standards. Customer experience is paramount, requiring high-touch service delivery and flawless execution across all touchpoints. Our sales model involves long relationship cycles with high-net-worth clients, often with bespoke or made-to-order products. Procurement categories include store design and fixtures, visual merchandising, premium packaging, events and hospitality, and corporate services. Vendor selection prioritizes quality, reliability, and brand alignment over cost optimization. Our procurement team works closely with creative and retail operations to ensure all vendor interactions reinforce our brand values. Annual indirect procurement spend is approximately $30M globally.",
  ],
  professional: [
    "Management consulting firm with approximately 300 consultants across five offices in major European business centers. Our practice areas include strategy, operations, digital transformation, and organizational change for clients across multiple industries. Knowledge management and intellectual property protection are critical given our business model depends on proprietary methodologies and client confidentiality. We have significant travel expenses given our client-facing delivery model, with consultants typically spending 3-4 days per week at client sites. Contractor and subcontractor utilization is substantial, representing approximately 20% of our delivery capacity during peak periods. Key procurement categories include travel and entertainment, professional development and training, technology and collaboration tools, office facilities, and external expertise. Our procurement function is relatively sophisticated with formal category management and preferred supplier programs. Strategic priorities include optimizing travel costs without impacting client relationships, improving knowledge management tools, and managing our flexible workforce more strategically. Annual indirect spend exceeds $25M.",
    "Law firm specializing in corporate mergers and acquisitions with 150 attorneys operating from offices in New York, London, and Hong Kong. We advise on complex cross-border transactions for Fortune 500 clients, requiring strict confidentiality and sophisticated information management. Our partnership model influences procurement decisions, with equity partners having significant input on major purchases and vendor relationships. Document management and eDiscovery represent major cost centers, particularly for litigation support activities. Key procurement categories include legal research platforms, practice management technology, document production services, facilities and real estate, and professional services. We maintain rigorous vendor due diligence processes given the sensitivity of client matters we handle. Procurement challenges include managing the transition to cloud-based solutions while maintaining security, optimizing our real estate footprint post-pandemic, and improving procurement data visibility across our international offices. Annual procurement spend is approximately $35M across all categories.",
    "Engineering services company providing design, project management, and construction supervision services primarily for infrastructure projects including transportation, water, and energy. Government contracts represent approximately 60% of our revenue, requiring DBE (Disadvantaged Business Enterprise) certification compliance and adherence to public procurement regulations. We employ 400 engineers, architects, and project managers across 8 regional offices. Our procurement needs include design software and technology, surveying equipment, fleet vehicles, subconsultant services, and office operations. Managing subconsultant relationships is particularly important given we often team with specialized firms on large pursuits. Compliance requirements for government work add complexity to our procurement processes, including detailed documentation of pricing, small business utilization reporting, and conflict of interest management. Our procurement function works closely with our contracts and compliance team to ensure we meet all regulatory requirements while achieving competitive pricing. Annual procurement spend is approximately $20M.",
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
    alternativesExist: randomChoice(["Yes", "No"]),
    vendorHistory: randomChoice([
      "We usually buy from Grainger for ~$2k/order but their lead times have slipped to 3 weeks. Last year we spent $18k across 12 orders in this category.",
      "No established vendor. Previous one-off purchases from Amazon Business and Uline. Total spend last FY was under $5k.",
      "Current supplier is a local distributor (ABC Supply). Pricing is 10-15% above market but they offer same-day delivery. Spent $8k last year.",
      "We have a frame agreement with Würth for fasteners but this item isn't covered. Ad-hoc purchases go through whoever the engineer finds first.",
    ]),
    technicalSpecs: randomChoice([
      "Need ISO 9001 certified supplier. Material must be 316L stainless steel, tolerance ±0.05mm. Compatible with existing assembly jig ref #JIG-2024-A.",
      "Standard office-grade, no special specs. Must be compatible with HP LaserJet Pro M404 series.",
      "API-grade valve, ANSI 300# flange, 4-inch bore. Must include material test certificates (EN 10204 3.1).",
      "",
    ]),
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
    rawBrief: randomChoice([
      "Hi team,\n\nWe need to find a new logistics partner for our Berlin warehouse operations. Current contract with TransEuro expires end of June 2026.\n\nKey details:\n- Volume: approximately 500 pallets per month, mostly FMCG goods\n- Must have GDP certification and 24/7 cold chain capability\n- Budget is around €180k/year but flexible for the right partner\n- Prefer providers with existing DACH network coverage\n- Need integration with our SAP WMS module\n- Warehouse is in Berlin-Spandau industrial zone\n\nWe'd also like to explore cross-docking options for our seasonal peaks (Oct-Dec).\n\nPlease draft something we can send out to 4-5 shortlisted providers.\n\nThanks,\nMaria",
      "Subject: IT Managed Services RFP Draft\n\nWe're looking to outsource our IT helpdesk and infrastructure management. Currently running a team of 6 in-house, supporting 450 users across 3 offices (Munich, Hamburg, remote).\n\nRequirements:\n- 24/7 L1/L2 support with 15-min response SLA for critical issues\n- Monthly patching and vulnerability management\n- Quarterly business reviews\n- Must be ISO 27001 certified\n- Budget: €350-400k annually\n- Contract term: 3 years with annual exit clause\n- Data must stay in EU (GDPR compliance)\n\nWe had issues with our last MSP around escalation transparency, so clear reporting is a must.\n\nDeadline for proposals: 6 weeks from distribution.",
      "Need to source commercial cleaning services for our new headquarters building.\n\nBuilding: 25,000 sqm office space, 3 floors + basement parking\nLocation: Amsterdam Zuid business district\nStart date: September 2026\nEmployees: ~800\n\nScope:\n- Daily office cleaning (Mon-Fri)\n- Deep cleaning monthly\n- Window cleaning quarterly\n- Restroom supplies management\n- Green/sustainable products preferred\n\nBudget: haven't set one yet, need market pricing first. Maybe €200-300k range?\n\nPrevious vendor was unreliable with staffing. Need guaranteed minimum staffing levels and backup protocols.\n\nAlso interested in integrated facility management if the same provider can handle security and reception.",
      "We need to procure a fleet management and telematics solution for our delivery operations.\n\n- Fleet size: 85 vehicles (60 vans, 25 trucks)\n- Operating across Benelux region\n- Need real-time GPS tracking, route optimization, driver behavior monitoring\n- Must integrate with our existing TMS (Oracle Transportation Management)\n- Fuel card integration required\n- Budget: €120k setup + €8k/month operational\n- Implementation timeline: go-live by Q3 2026\n\nWe're also evaluating EV transition — solution should support mixed fleet (ICE + EV) with charging station management.\n\nCompliance: need to meet EU tachograph regulations and sustainability reporting requirements.",
    ]),
    documentTypes: randomChoice([
      "RFP Document (Request for Proposal) — Full proposal request with scope, evaluation criteria, and response template",
      "RFI Document (Request for Information) — Exploratory request to assess supplier capabilities before formal tendering",
      "RFQ Document (Request for Quotation) — Price-focused request for well-defined requirements with clear specifications",
      "Full Tender Package (RFP + Evaluation Matrix + Cover Letter) — Complete package ready for formal distribution",
    ]),
    evaluationPriorities: randomChoice([
      "Price 35%, Technical Capability 30%, Experience 20%, Implementation Plan 15%",
      "Quality 40%, Price 30%, Sustainability 20%, References 10%",
      "",
    ]),
    budgetRange: randomChoice([
      "€150k-200k annually",
      "$500k total project budget",
      "Not yet defined — need market pricing",
      "",
    ]),
    additionalInstructions: randomChoice([
      "Must include NDA clause. Prefer EU-based suppliers with GDPR compliance.",
      "Response deadline should be 3 weeks. Include site visit option.",
      "",
      "Sustainability certification (EcoVadis Gold or equivalent) preferred but not mandatory.",
    ]),
  }),

  "volume-consolidation": () => ({
    industryContext: getRandomIndustryContext(),
    spendPerVendor: randomCurrency(100000, 2000000),
    skuOverlap: randomPercentage(10, 60),
    unitOfMeasure: randomChoice(["kg", "pcs", "hours", "liters", "units"]),
    logisticsDistance: randomChoice(["Local (<50km)", "Regional (50-200km)", "National (>200km)", "International"]),
    paymentTerms: randomNumber(30, 90).toString(),
    orderFrequency: randomChoice(["Daily", "Weekly", "Monthly", "Quarterly"]),
    reliabilityIndex: randomNumber(5, 10).toString(),
    volumeGrowthForecast: randomPercentage(5, 25),
    currentPenalties: randomCurrency(0, 50000),
    taxRate: randomPercentage(5, 25),
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
    marketStructure: randomChoice(["Monopoly", "Oligopoly", "Fragmented", "Emerging"]),
    supplyRisk: randomChoice(["Low", "Medium", "High", "Critical"]),
    businessImpact: randomChoice(["Low", "Medium", "High", "Strategic"]),
    currentStrategy: randomChoice([
      "Multi-source with 3 approved suppliers. Annual tenders. Focus on cost reduction through volume leverage.",
      "Single-source partnership with preferred supplier. 3-year framework agreement. Joint innovation projects.",
      "Spot buying from various suppliers. No formal category strategy. Reactive purchasing approach.",
      "Dual-source model with primary and backup supplier. Quarterly business reviews. KPI-driven management.",
    ]),
    painPoints: randomChoice([
      "Price volatility linked to commodity markets. Long lead times from offshore suppliers. Quality inconsistency across batches.",
      "Limited supplier options due to technical specifications. Supplier consolidation reducing competition. Rising raw material costs.",
      "High transaction costs from fragmented spend. Maverick buying bypassing contracts. Poor visibility into total category spend.",
      "Capacity constraints during peak seasons. Currency exposure on imported goods. Increasing regulatory compliance requirements.",
    ]),
    innovationNeeds: randomChoice([
      "Need to reduce carbon footprint by 30% by 2030. Looking for bio-based or recycled material alternatives.",
      "Exploring automation and digital solutions. Interest in supplier-led innovation partnerships.",
      "Focus on circular economy and waste reduction. Seeking suppliers with sustainability certifications.",
      "",
    ]),
    contractStatus: randomChoice(["Active Long-term", "Expiring Soon", "Spot Buying", "Renegotiating"]),
    stakeholderAlignment: randomChoice(["Strong", "Moderate", "Weak", "Conflicting"]),
  }),

  "cost-breakdown": () => ({
    industryContext: getRandomIndustryContext(),
    productDescription: randomChoice([
      "Custom injection-molded plastic housing for electronic components",
      "Precision machined aluminum bracket for automotive assembly",
      "Printed circuit board assembly with 200+ components",
      "Specialty adhesive compound for aerospace applications",
      "Custom packaging solution including design and production",
    ]),
    totalCost: randomCurrency(50000, 500000),
    materialCost: randomCurrency(20000, 250000),
    laborCost: randomCurrency(10000, 100000),
    overheadCost: randomCurrency(5000, 75000),
    logisticsCost: randomCurrency(2000, 25000),
    toolingCost: randomCurrency(0, 100000),
    profitMargin: randomPercentage(5, 25),
    volumePerYear: randomNumber(1000, 100000).toString(),
    commodityIndex: randomChoice([
      "LME Aluminum 3-month",
      "HDPE resin index",
      "Steel HRC index",
      "Copper COMEX",
      "",
    ]),
    laborRateReference: randomChoice([
      "BLS Manufacturing Wage Index",
      "Industry average $45/hour",
      "Regional labor market survey",
      "",
    ]),
    currencyExposure: randomChoice([
      "EUR/USD for European suppliers",
      "CNY/USD for Asian manufacturing",
      "No significant exposure",
      "Multiple currencies: EUR, GBP, JPY",
    ]),
  }),

  "negotiation-prep": () => ({
    industryContext: getRandomIndustryContext(),
    counterparty: randomChoice([
      "Global logistics provider with dominant market position",
      "Regional IT services company seeking to expand relationship",
      "Specialty chemical supplier with unique formulation capabilities",
      "Large consulting firm for strategic transformation project",
      "Software vendor for enterprise platform renewal",
    ]),
    negotiationType: randomChoice(["Contract renewal", "New supplier", "Price increase pushback", "Scope expansion"]),
    currentSpend: randomCurrency(200000, 5000000),
    relationshipYears: randomNumber(1, 15).toString(),
    batna: randomChoice([
      "Qualified backup supplier at 10% premium but with better service levels",
      "Insourcing capability exists but would require 6-month ramp-up",
      "Limited alternatives available - this is a specialized market",
      "Strong alternative shortlisted and ready to engage",
      "Could unbundle services and source components separately",
    ]),
    targetOutcome: randomChoice([
      "5-10% cost reduction with maintained service levels",
      "Extended payment terms from Net 30 to Net 60",
      "Improved SLA commitments with financial penalties",
      "Volume flexibility with demand-based pricing",
      "Multi-year deal with price protection clause",
    ]),
  }),

  // NEW GENERATORS FOR MISSING SCENARIOS

  "capex-vs-opex": () => ({
    industryContext: getRandomIndustryContext(),
    purchasePrice: randomCurrency(100000, 2000000),
    leaseRate: randomPercentage(8, 18),
    leaseTerm: randomNumber(3, 7).toString(),
    maintenanceCost: randomCurrency(5000, 50000),
    residualValue: randomCurrency(20000, 400000),
    propertyTax: randomPercentage(1, 4),
    wacc: randomPercentage(6, 15),
    partsInflation: randomPercentage(2, 8),
    energyCost: randomCurrency(3000, 30000),
    trainingCost: randomCurrency(2000, 25000),
  }),

  "savings-calculation": () => ({
    industryContext: getRandomIndustryContext(),
    baselinePrice: randomCurrency(50, 500),
    newPrice: randomCurrency(40, 450),
    volume: randomNumber(1000, 100000).toString(),
    inflationIndex: randomPercentage(2, 8),
    fxRate: randomChoice([
      "EUR/USD at 1.08, stable",
      "GBP/USD volatile, hedged",
      "No FX impact - domestic",
      "CNY exposure, 5% depreciation expected",
    ]),
    qualityCost: randomCurrency(0, 50000),
    earlyPaymentDiscount: randomPercentage(1, 3),
    storageCost: randomCurrency(0, 25000),
    contractTerm: randomNumber(1, 5).toString(),
    switchingCosts: randomCurrency(5000, 100000),
  }),

  "saas-optimization": () => ({
    industryContext: getRandomIndustryContext(),
    totalSeats: randomNumber(50, 500).toString(),
    pricePerSeat: randomCurrency(10, 150),
    lastLoginDate: randomChoice([
      "2024-01-15 (45 days ago)",
      "2023-11-20 (90 days ago)",
      "2024-02-01 (current)",
      "2023-09-01 (150+ days ago)",
    ]),
    featureUsage: randomNumber(2, 10).toString(),
    contractEndDate: randomChoice([
      "2024-06-30",
      "2024-12-31",
      "2025-03-15",
      "2024-09-01",
    ]),
    noticePeriod: randomNumber(30, 90).toString(),
    autoRenewal: randomChoice(["Yes", "No"]),
    ssoIntegration: randomChoice(["Yes", "No", "Partial"]),
    duplicateApps: randomChoice([
      "Slack and Teams both in use",
      "Multiple project management tools (Asana, Monday, Jira)",
      "Overlapping design tools (Figma, Sketch, Adobe XD)",
      "None identified",
    ]),
    supportTier: randomChoice(["Premium", "Standard", "Basic"]),
  }),

  "forecasting-budgeting": () => {
    const categories = ["IT Software", "Professional Services", "MRO Supplies", "Marketing", "Logistics", "Raw Materials"];
    const selectedCats = categories.sort(() => Math.random() - 0.5).slice(0, randomNumber(3, 4));
    const quarters = ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"];
    const numQuarters = randomNumber(8, 12);
    const usedQuarters = quarters.slice(0, Math.min(numQuarters, quarters.length));

    let spendLines = "Category, Period, Amount\n";
    for (const q of usedQuarters) {
      for (const cat of selectedCats) {
        const base = randomNumber(20000, 350000);
        spendLines += `${cat}, ${q}, $${base.toLocaleString()}\n`;
      }
    }

    const futureEvents = [
      `Hiring ${randomNumber(5, 30)} engineers in Q2 2026 (~$${randomNumber(200, 800)}K impact)`,
      `Major ERP renewal due Q3 2026 ($${randomNumber(100, 500)}K)`,
      `New office opening Q1 2026 ($${randomNumber(150, 400)}K setup + $${randomNumber(30, 80)}K/quarter ongoing)`,
      `Marketing campaign for product launch Q2 2026 ($${randomNumber(50, 200)}K)`,
      `Fleet replacement program starting Q4 2025 ($${randomNumber(300, 900)}K over 18 months)`,
    ];
    const selectedEvents = futureEvents.sort(() => Math.random() - 0.5).slice(0, randomNumber(2, 4));

    return {
      industryContext: getRandomIndustryContext(),
      categoryContext: "", // Populated by wizard via category selector
      historicalSpendData: spendLines.trim(),
      knownFutureEvents: selectedEvents.join("\n"),
      budgetConstraints: randomChoice([
        "Mandate to cut OPEX by 10% across all departments",
        "Software budget capped at $500K for FY2026",
        "No new headcount-driven spend without VP approval",
        "Total procurement budget flat YoY despite 8% revenue growth",
        "",
      ]),
      forecastHorizon: randomChoice(["Next Quarter", "Next 6 Months", "Next 12 Months", "Next 24 Months"]),
    };
  },

  "market-snapshot": () => {
    const regions = [
      "Germany", "France", "UK", "Netherlands", "Spain", "Italy", "Poland",
      "USA", "Canada", "Mexico", "Brazil",
      "China", "Japan", "South Korea", "India", "Australia",
      "UAE", "Saudi Arabia", "South Africa",
    ];
    const scopes = [
      "Top 5 logistics providers, their market share, pricing models, and recent M&A activity",
      "Leading cloud infrastructure vendors, enterprise adoption rates, pricing tiers, and regional data center presence",
      "Major raw material suppliers for automotive steel, capacity utilization, export restrictions, and price trends over the past year",
      "Key contract manufacturing partners for electronics, certifications held (ISO 13485, IATF 16949), lead times, and minimum order quantities",
      "Top SaaS procurement platforms, feature comparison, customer base size, funding status, and integration capabilities",
      "Dominant facility management companies, service scope, contract models, and customer satisfaction benchmarks",
    ];
    const criteria = [
      "Must include revenue figures, market share %, and at least 3 cited sources per player",
      "Each player profile should have: founding year, headquarters, employee count, key clients, and competitive differentiator",
      "Include at least 5 players with quantitative data points (revenue, growth rate). Flag any data older than 12 months",
      "Need pricing benchmarks with currency-specific figures. Identify regulatory barriers to entry for this region",
      "",
    ];
    return {
      industryContext: getRandomIndustryContext(),
      region: randomChoice(regions),
      analysisScope: randomChoice(scopes),
      successCriteria: randomChoice(criteria),
      timeframe: randomChoice(["Current Snapshot", "Past Month", "Past Quarter", "Past Year"]),
    };
  },

  "requirements-gathering": () => ({
    industryContext: getRandomIndustryContext(),
    businessGoal: randomChoice([
      "Improve customer service response time by 50%",
      "Automate manual procurement processes to reduce errors",
      "Enable remote work capabilities for 500 employees",
      "Consolidate 5 legacy systems into unified platform",
      "Implement real-time inventory visibility across warehouses",
    ]),
    budget: randomCurrency(100000, 2000000),
    userCount: randomNumber(20, 500).toString(),
    itLandscape: randomChoice([
      "SAP ERP, Salesforce CRM, custom legacy applications",
      "Microsoft 365, Azure cloud infrastructure, various SaaS tools",
      "Oracle EBS, on-premise data center, limited cloud adoption",
      "Mixed environment with significant technical debt",
    ]),
    dataSecurityLevel: randomChoice(["Public", "Internal", "Confidential", "Highly Restricted"]),
    urgency: randomChoice(["Immediate", "3-6 Months", "6-12 Months", "Flexible"]),
    mustHaveFeatures: randomChoice([
      "Mobile access, real-time reporting, SSO integration",
      "Automated workflows, approval routing, audit trail",
      "Multi-language support, API integrations, offline capability",
      "Role-based access, document management, collaboration tools",
    ]),
    niceToHaveFeatures: randomChoice([
      "AI-powered recommendations, predictive analytics",
      "Custom dashboards, advanced reporting, data visualization",
      "Chatbot integration, self-service portal",
      "Integration with IoT devices, real-time alerts",
    ]),
    scalability: randomChoice(["No Growth", "Moderate Growth", "High Growth"]),
    languageSupport: randomChoice([
      "English only",
      "English, German, French",
      "All major European languages",
      "Global - 10+ languages required",
    ]),
  }),

  "project-planning": () => ({
    industryContext: getRandomIndustryContext(),
    projectName: randomChoice([
      "Strategic Sourcing Transformation",
      "Supplier Consolidation Initiative",
      "Procurement Technology Upgrade",
      "Category Management Excellence Program",
      "Supply Chain Risk Mitigation Project",
    ]),
    projectObjective: randomChoice([
      "Reduce procurement costs by 15% over 3 years through strategic sourcing",
      "Implement new P2P system to improve process efficiency and compliance",
      "Develop category strategies for top 10 spend categories",
      "Establish supplier risk management framework and monitoring capabilities",
      "Consolidate supplier base from 500 to 200 qualified vendors",
    ]),
    projectScope: randomChoice([
      "All indirect spend categories across North American operations",
      "IT and professional services categories globally",
      "Direct materials for manufacturing plants in Europe",
      "Facilities management and MRO across all locations",
    ]),
    projectBudget: randomCurrency(100000, 2000000),
    projectTimeline: randomChoice([
      "12 months with quarterly milestones",
      "6 months fast-track implementation",
      "18-month phased rollout",
      "24 months including change management",
    ]),
    stakeholders: randomChoice([
      "CPO (sponsor), Category Managers, Finance, Operations, IT",
      "Procurement Director, Business Unit Leaders, CFO, Legal",
      "VP Supply Chain, Plant Managers, Quality, Sustainability",
      "CEO (sponsor), CHRO, CIO, Procurement Team",
    ]),
    constraints: randomChoice([
      "Limited internal resources, competing priorities, budget freeze in Q3",
      "Change resistance from business units, legacy system dependencies",
      "Tight timeline due to contract expirations, resource constraints",
      "Regulatory requirements, union considerations, seasonal business impact",
    ]),
    successMetrics: randomChoice([
      "Cost savings achieved, process cycle time, user adoption rate",
      "Supplier consolidation ratio, contract compliance, stakeholder satisfaction",
      "Risk exposure reduction, supplier performance improvement, audit findings",
      "ROI, payback period, efficiency gains, error reduction",
    ]),
    risks: randomChoice([
      "Scope creep, resource availability, technology integration challenges",
      "Stakeholder resistance, supplier pushback, data quality issues",
      "Market volatility, regulatory changes, key personnel turnover",
      "Budget overrun, timeline delays, change management failures",
    ]),
  }),

  "contract-template": () => ({
    industryContext: getRandomIndustryContext(),
    mainFocus: randomChoice([
      "We need a solid contract template for a new IT outsourcing arrangement. Key concern is protecting our IP while ensuring clear SLAs and penalty clauses for non-performance.",
      "Preparing a framework agreement for recurring maintenance services across 3 facilities. Need clear scope definitions and flexible pricing mechanisms.",
      "Setting up an NDA with a potential technology partner before sharing proprietary manufacturing processes. Must be enforceable under local law.",
      "Drafting a consulting engagement contract for a 6-month digital transformation project. Need milestone-based payments and clear deliverable acceptance criteria.",
      "Creating a supply agreement for critical raw materials with a new supplier. Need price adjustment clauses, quality standards, and force majeure provisions.",
    ]),
    country: randomChoice([
      "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
      "Denmark", "Estonia", "Finland", "France", "Germany", "Greece",
      "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg",
      "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia",
      "Slovenia", "Spain", "Sweden"
    ]),
    timeTier: randomChoice([
      "Quick Draft (3 feedback sections, ~15 min review)",
      "Standard (5-6 feedback sections, ~30-45 min review)",
      "Thorough (7+ feedback sections, ~1 hour+ review)"
    ]),
    contractBrief: randomChoice([
      "We need a 2-year IT managed services contract with CloudOps GmbH, Munich. Scope includes 24/7 helpdesk, infrastructure monitoring, quarterly business reviews, and incident management. Estimated value €180k/year. Must include GDPR data processing addendum, 90-day termination notice, and SLA penalties for P1 incidents exceeding 4-hour resolution.",
      "Framework agreement for office supplies and equipment with BüroMax AG across our 5 German locations. 3-year term with annual volume of approximately €250k. Need catalog pricing mechanism, delivery SLAs (48h standard, 4h urgent), and sustainability requirements for all paper products. Option to extend for 2 additional years.",
      "Professional services contract with McKinsey Digital for a supply chain optimization project. 6-month engagement, 3 consultants on-site 4 days/week. Budget €450k. Milestone payments tied to deliverables: diagnostic (Month 2), design (Month 4), implementation roadmap (Month 6). Need IP assignment clause and non-compete for 12 months post-engagement.",
      "Supply agreement with ChemTrade BV (Netherlands) for specialty adhesives used in our electronics assembly line. Annual volume ~50 tonnes, value €320k. Need price adjustment formula linked to raw material indices, quality specifications (ISO 9001 minimum), batch testing requirements, and consignment stock arrangement at our facility.",
      "Maintenance & support agreement for our SAP S/4HANA system with Atos SE. 3-year term covering application management, basis administration, and development support. ~15 FTE equivalent. Value €1.2M/year. Need tiered SLA structure, knowledge transfer obligations, and exit management clause with 6-month transition period.",
    ]),
    contractType: randomChoice([
      "Service Agreement",
      "Supply / Purchase Agreement",
      "Framework Agreement",
      "Non-Disclosure Agreement (NDA)",
      "Consulting / Professional Services",
      "Maintenance & Support Agreement"
    ]),
    contractValue: randomChoice(["€120,000/year", "€250,000", "€1.2M over 3 years", "€450,000", "€80,000/year", ""]),
    specialRequirements: randomChoice([
      "GDPR data processing agreement required. Sustainability reporting clause per EU CSRD. Payment within 30 days of invoice.",
      "IP ownership must remain with us. Non-disclosure obligations survive 5 years post-termination. Quarterly performance reviews mandatory.",
      "Force majeure must explicitly cover pandemics and supply chain disruptions. Price escalation capped at 3% annually. Right to audit supplier facilities.",
      "Must include anti-bribery and anti-corruption provisions. Subcontracting only with prior written approval. Insurance requirements: €5M professional indemnity.",
      "",
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
