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
    projectBrief: randomChoice([
      "Should we build a custom CRM system in-house or purchase Salesforce Enterprise licenses? Our sales team (45 reps) currently uses spreadsheets and a legacy Access database. We need pipeline tracking, forecasting, and integration with our ERP.",
      "We currently outsource PCB assembly to a contract manufacturer in Shenzhen. Volume is 8,000 units/month. Should we bring this in-house by investing in a pick-and-place line, or renew the outsourcing contract?",
      "Our warehouse fulfillment is handled by a 3PL (DHL Supply Chain). As we scale from 2,000 to 10,000 orders/day, should we build our own fulfillment center or renegotiate with the 3PL?",
      "We need a custom ERP module for production scheduling. Options: develop internally with our 3-person dev team, or license a SAP add-on (PP/DS module) at ~€80k/year. Current scheduling is done in Excel.",
    ]),
    makeCosts: randomChoice([
      "Estimated dev team: 3 engineers x $140k/year = $420k. Infrastructure (AWS): ~$30k/year. Timeline: 9-12 months to MVP. Ongoing maintenance: ~$80k/year.",
      "Pick-and-place line: $650k CapEx. Facility retrofit: $120k. Hiring 4 technicians at $55k each = $220k/year. Ramp-up time: 6 months. Yield loss during ramp: ~8%.",
      "Warehouse lease (40,000 sqft): $480k/year. WMS software: $45k/year. Staff (25 FTEs): $1.1M/year. Racking and conveyors: $350k CapEx. Build-out timeline: 8 months.",
      "Internal dev: 3 devs x 6 months = ~€250k fully loaded. Integration with existing SAP ECC: additional €40k consulting. Risk: team has no PP/DS domain expertise.",
    ]),
    buyCosts: randomChoice([
      "Salesforce Enterprise: $150/user/month x 45 users = $81k/year. Implementation partner: $120k one-time. Data migration: $25k. Training: $15k. Total Year 1: ~$241k.",
      "Current CM quote for renewal: $4.20/unit x 8,000/month = $403k/year. New CM quote (Vietnam): $3.60/unit but MOQ 12,000. Tooling transfer fee: $35k.",
      "DHL renegotiated rate: $4.80/order (down from $5.50). At 10,000 orders/day = $17.5M/year. Includes WMS, labor, and facility. SLA: 99.2% same-day ship.",
      "SAP PP/DS license: €80k/year. Implementation: €150k (3-month project with partner). Annual support: €16k. Includes 2 days of training. Go-live in 4 months.",
    ]),
    strategicFactors: randomChoice([
      "We need full control over customer data (GDPR). Sales process is our core differentiator. Vendor lock-in risk is high with Salesforce. However, time-to-value matters -- we're losing deals without proper pipeline visibility.",
      "IP protection is not a concern (standard PCBs). But supply chain resilience is critical after 2024 disruptions. We also want to reduce lead time from 6 weeks to 2 weeks. Quality must stay above 99.7% first-pass yield.",
      "Logistics is not our core competency. But the 3PL's error rate (1.8%) is hurting our brand. We need same-day shipping capability for Prime-like experience. Capital is available ($2M approved) but management bandwidth is limited.",
      "ERP scheduling is becoming a bottleneck as we scale. The SAP module is proven but expensive and rigid. Internal build gives flexibility but our dev team is already at capacity with other projects. Must decide within 6 weeks.",
    ]),
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
    communicationScore: randomNumber(5, 10).toString(),
    priceVsMarket: randomChoice(["Below Market", "At Market", "Above Market"]),
    spendVolume: randomCurrency(100000, 5000000),
    contractStatus: randomChoice([
      "Expires Q3 2026", "Auto-renews in 6 months", "Month-to-month, no fixed term",
      "Long-term agreement until 2028", "Under renegotiation, current terms expire in 90 days",
      "Expired — operating on goodwill basis",
    ]),
    incidentLog: randomChoice([
      "Two late deliveries in Q4 causing production line stoppage (4h total downtime). Root cause: carrier switch without notification.",
      "Quality escape in batch #4412 — 15% rejection rate on incoming inspection. Supplier issued corrective action report.",
      "SLA breach: response time exceeded 48h on three critical tickets in January. Escalated to account manager.",
      "No significant incidents in the past 12 months. Minor packaging damage on one shipment, resolved immediately.",
      "",
      "",
    ]),
  }),

  // ===== 2. DISRUPTION MANAGEMENT =====
  "disruption-management": () => ({
    industryContext: getRandomIndustryContext(),
    crisisDescription: randomChoice([
      "Our sole-source microchip supplier's factory in Taiwan was flooded. We have 14 days of inventory remaining. These chips are custom ASICs with 16-week lead time from any new supplier.",
      "Key steel supplier declared force majeure due to energy crisis. We depend on them for 80% of our specialty alloy needs. Current stock covers 3 weeks of production.",
      "Medical-grade silicone tubing supplier failed FDA audit and production is halted indefinitely. We use their tubing in 6 product lines. Only 10 days of buffer stock on hand.",
      "Our primary logistics partner (40% of shipments) experienced a ransomware attack and all systems are down. No ETA for recovery. 200 containers are currently in transit with no tracking.",
    ]),
    impactAssessment: randomChoice([
      "Production line stops in 14 days. Revenue impact: $85k/day. 3 customer contracts have penalty clauses for late delivery. Force majeure clause in our supplier contract is ambiguous about 'natural disasters'.",
      "We lose $50k/day in lost production. Two automotive OEM customers have zero-tolerance late delivery policies. Competitor has reportedly secured alternative supply. In-transit shipments: 2 containers worth $120k.",
      "Revenue at risk: $200k/week across affected product lines. Hospital customers cannot accept substitutes without re-validation (6-month process). Insurance claim filed but outcome uncertain.",
      "Customer orders worth $1.2M are delayed. E-commerce platform SLA requires 48h delivery. Competitor is offering expedited shipping to capture our customers. No insurance coverage for cyber incidents at supplier.",
    ]),
    alternativesContext: randomChoice([
      "2 backup suppliers identified but not qualified. Switching time: 30 days minimum. Price premium: 15-20%. One alternative requires minimum order of 50,000 units (vs our 8,000/month need).",
      "One alternative supplier in Germany (qualified) at 25% premium. Another in South Korea (not qualified, 8-week qualification). Substitute material exists but requires customer approval and testing.",
      "No direct substitutes available — proprietary formulation. Competitor's product could work but requires FDA re-submission. Emergency procurement from grey market possible but quality risk is high.",
      "3 alternative carriers available. Two can absorb 60% of volume within 1 week. Full transition would take 3-4 weeks. Costs 8-12% more. Manual tracking possible as interim measure.",
    ]),
  }),

  // ===== 3. RISK ASSESSMENT =====
  "risk-assessment": () => ({
    industryContext: getRandomIndustryContext(),
    assessmentSubject: randomChoice([
      "Primary logistics provider — TransGlobal Shipping",
      "Critical component supplier — SemiTech Industries",
      "IT infrastructure vendor — CloudScale Solutions",
      "Offshore manufacturing partner — Pacific Assembly Co.",
      "Raw material supplier — NordicMetals AB",
    ]),
    currentSituation: randomChoice([
      "$5M annual spend. Market is highly volatile with 20% price swings in last quarter. Supplier had 2 late deliveries last quarter and their CFO resigned unexpectedly. Commodity dependency on rare earths is high.",
      "$3.2M annual spend. Supplier market is consolidating — 3 major acquisitions in 12 months. Our supplier is financially stable but their key patent expires next year. Regulatory environment is tightening.",
      "$8M annual spend. Geopolitical risk is elevated — supplier operates primarily in a sanctions-adjacent region. Quality has been excellent but supply chain visibility is limited to Tier 1 only.",
      "$1.5M annual spend. Supplier recently lost their ISO certification (regained after 3 months). They're our sole source for a critical component. Market has few alternatives due to technical specifications.",
    ]),
    contractContext: randomChoice([
      "3-year contract expiring in 8 months. Standard liability terms. Index-linked price adjustments (PPI). 90-day termination notice. No force majeure update since 2019.",
      "Month-to-month arrangement — no formal contract. Payment terms: Net-30. No liability caps or SLA penalties. Relationship based on handshake agreements.",
      "Long-term partnership agreement (5 years, 2 remaining). Comprehensive liability protection. Fixed pricing with annual CPI adjustment cap of 3%. Restrictive termination clause.",
      "",
    ]),
    riskTolerance: randomChoice([
      "Mission critical — maximum tolerable downtime is 48 hours. This supplier feeds our main production line. No qualified backup exists.",
      "High impact but not mission critical. Recovery time of 2-4 weeks is acceptable. Two partial alternatives exist but at 30% cost premium.",
      "Medium criticality. Supply interruption would affect 3 product lines but workarounds exist. Acceptable downtime: up to 1 month.",
      "",
    ]),
  }),

  // ===== TCO ANALYSIS (already refactored) =====
  "tco-analysis": () => ({
    industryContext: getRandomIndustryContext(),
    assetDescription: randomChoice([
      "Industrial CNC machining center with 5-axis capability",
      "Enterprise ERP system implementation",
      "Fleet of 20 electric delivery vehicles",
      "Automated warehouse picking system",
    ]),
    ownershipPeriod: randomNumber(5, 15).toString(),
    capexBreakdown: randomChoice([
      "Purchase price: $1.2M. Installation & commissioning: $85k. Initial training for 12 operators: $25k. Custom tooling and fixtures: $40k.",
      "Software license: $350k. Implementation partner fees: $180k. Data migration from legacy system: $60k. User training (200 staff): $30k.",
      "Vehicle acquisition (20 units): $1.6M. Charging infrastructure: $120k. Fleet management software: $45k. Driver training program: $15k.",
      "Racking and conveyor system: $800k. Pick-to-light installation: $150k. WMS software license: $90k. Integration with existing ERP: $65k.",
    ]),
    opexBreakdown: randomChoice([
      "Annual maintenance contract: $45k/yr. Energy consumption: ~$1.8k/mo. Consumables and spare parts: $12k/yr. Operator labor (2 FTEs): $140k/yr.",
      "Annual SaaS subscription: $120k/yr. Dedicated admin (0.5 FTE): $45k/yr. Annual training refresher: $8k/yr. Third-party integrations maintenance: $15k/yr.",
      "Electricity for charging: ~$2.5k/mo. Insurance (fleet): $60k/yr. Tire replacement and servicing: $35k/yr. Fleet management subscription: $12k/yr.",
      "WMS annual license: $30k/yr. Preventive maintenance: $25k/yr. Electricity for automation: $18k/yr. Spare conveyor belts and sensors: $8k/yr.",
    ]),
    riskFactors: randomChoice([
      "High vendor lock-in -- proprietary tooling with no third-party alternatives. Downtime costs approximately $8k/hr due to production line stoppage. Residual value after 10 years estimated at $150k.",
      "Moderate lock-in risk -- data export possible but costly. Technology obsolescence risk is high (3-year refresh cycle). Annual price escalation capped at 5% but historically hits the cap.",
      "Low lock-in -- vehicles are standard models with broad service network. Battery degradation risk: expect 20% capacity loss by year 5. Residual value volatile due to EV market shifts.",
      "Proprietary control software with no migration path. Regulatory changes (fire safety codes) may require $50k retrofit by 2028. Decommissioning and disposal estimated at $35k.",
    ]),
  }),

  // ===== 4. SOFTWARE LICENSING =====
  "software-licensing": () => ({
    industryContext: getRandomIndustryContext(),
    softwareDetails: randomChoice([
      "Salesforce Sales Cloud Enterprise. Currently using a legacy on-premise CRM (ACT!) that is end-of-life. Need full migration including 5 years of customer data.",
      "Microsoft 365 E5 suite. Replacing a mix of Google Workspace and standalone Office licenses. Need Teams, SharePoint, and advanced security features (Defender, DLP).",
      "SAP S/4HANA Cloud. Migrating from SAP ECC 6.0 on-premise. Critical ERP for manufacturing operations. 3-year implementation roadmap.",
      "Atlassian Suite (Jira, Confluence, Bitbucket). Currently on Server licenses being deprecated. Must move to Cloud or Data Center. 200+ engineering team depends on it daily.",
    ]),
    userMetrics: randomChoice([
      "500 total users. 100 power users (sales reps, daily use), 300 regular users (marketing, support), 100 occasional users (executives, view-only). Expected 10% annual growth.",
      "350 users across 3 offices. 50 power users needing full admin features. 200 standard users. 100 light users who just need email and basic docs. Growth: 15% next year due to acquisition.",
      "800 users globally. 150 power users (developers, full access), 400 regular users, 250 read-only stakeholders. Also need 50 external contractor licenses. Flat growth expected.",
      "120 users, all engineers. Everyone needs full access — no tiering possible due to workflow requirements. Planning to hire 30 more engineers in next 12 months.",
    ]),
    commercialTerms: randomChoice([
      "$150/user/month for Enterprise tier. Vendor pushing for a 3-year lock-in with 5% annual escalation. Implementation quoted at $180k. Month-to-month option is $195/user.",
      "$57/user/month for E5 (annual commitment). Volume discount of 10% available at 500+ seats. No implementation cost if self-service. Microsoft partner quoted $45k for managed migration.",
      "On-demand pricing model: €180/user/month. 3-year contract reduces to €140. Implementation: €1.2M over 18 months with certified partner. Annual support: 22% of license fees.",
      "$15/user/month for Standard. Premium tier: $25/user. Data Center (self-hosted): $42k/year for 500 users. Cloud migration tool provided free but manual cleanup needed.",
    ]),
    strategicFactors: randomChoice([
      "Deep ERP integration required — Salesforce connects to our SAP for order management. Exporting 5 years of customer data would be extremely difficult. 2 viable alternatives: HubSpot and Dynamics 365.",
      "Already deeply embedded in Microsoft ecosystem (Azure AD, Teams). Switching would require retraining 350 users. Data portability is good (standard formats). Google Workspace is the main alternative.",
      "SAP is deeply integrated into every business process. Switching ERP is not realistic — this is about license optimization within SAP ecosystem. RISE with SAP is the vendor's push.",
      "Moderate lock-in. Git repos and wikis can be exported. However, custom Jira workflows (50+) would need rebuilding. GitLab and Linear are viable alternatives for parts of the suite.",
    ]),
  }),

  // ===== 5. RISK MATRIX =====
  "risk-matrix": () => ({
    industryContext: getRandomIndustryContext(),
    supplierName: randomChoice([
      "Meridian Technologies", "Atlas Supply Co.", "GlobalServe Solutions",
      "Pinnacle Data Systems", "Nordic Components AB", "SinoTech Manufacturing",
    ]),
    operationalRisks: randomChoice([
      "They process sensitive patient data under our HIPAA BAA. Cybersecurity posture is adequate (SOC2 Type 1) but no penetration test in 18 months. Last site audit was 2 years ago. Environmental compliance is current.",
      "They access our production network for remote equipment monitoring. No formal cybersecurity certification. Recent employee reported data handling concerns on Glassdoor. ISO 14001 certified for environmental.",
      "Limited data access — only receive PO and shipping information. Strong cybersecurity (ISO 27001 certified, annual pen tests). Recent site audit passed with minor findings. Environmental risk is low.",
      "They have admin access to our cloud infrastructure. SOC2 Type 2 certified. However, they subcontract 30% of work to a third party whose security posture is unknown. No environmental risks identified.",
    ]),
    commercialRisks: randomChoice([
      "Financials look stable — publicly traded, $2B revenue. But we represent 40% of their revenue in our region, creating mutual dependency. No active lawsuits. Insurance coverage is comprehensive.",
      "Private company, limited financial visibility. Annual revenue estimated at $50M. We are a small customer (~2% of revenue). One minor lawsuit pending (employment dispute). Basic insurance only.",
      "Strong financial health — D&B rating of 5A1. Diversified customer base, we are <5% of revenue. Clean legal record. Comprehensive insurance including cyber and product liability.",
      "Recently acquired by a PE firm — financial restructuring ongoing. Cash flow concerns reported in industry press. We are their 3rd largest client. Two active lawsuits (patent disputes). Insurance status unclear post-acquisition.",
    ]),
  }),

  // ===== 14. SOW CRITIC =====
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
    reviewPriorities: randomChoice([
      "Concerned about IP ownership — who owns the custom CRM workflows? Also, the 'silence = acceptance' clause is a red flag. Need clearer change request process and liability caps.",
      "Main concern: no penalty for late delivery or quality failures. Also missing: data migration ownership, rollback plan, and post-go-live defect resolution SLA.",
      "The payment structure is heavily front-loaded (50% upfront). Need milestone-based payments tied to acceptance. Also concerned about scope creep — 'comprehensive' is too vague.",
      "",
    ]),
  }),

  // ===== 15. SLA DEFINITION =====
  "sla-definition": () => ({
    industryContext: getRandomIndustryContext(),
    serviceDescription: randomChoice([
      "Cloud hosting for our e-commerce platform. Mission critical — 99.9% uptime required. 24/7 operation. Peak traffic during Black Friday and holiday season (3x normal load). Handles payment processing.",
      "IT helpdesk and desktop support for 450 users across 3 offices. Business hours primary, but executives need 24/7 VIP support. Currently averaging 200 tickets/month.",
      "Managed print services across 12 office locations. 150 devices total. Includes toner supply, maintenance, and reporting. Standard business hours operation.",
      "ERP application management for our SAP S/4HANA environment. Business critical — supports all order processing and financial reporting. 500 users globally across 3 time zones.",
    ]),
    performanceTargets: randomChoice([
      "P1 (system down): 15-minute response, 4-hour resolution. P2 (degraded): 1-hour response, 8-hour resolution. P3 (minor): 4-hour response, 3-day resolution. Monthly uptime target: 99.95%.",
      "First call resolution target: 75%. Average response time: <30 minutes during business hours. VIP tickets: 15-minute response, 2-hour resolution. Monthly satisfaction score: >4.2/5.",
      "Device uptime: 98%. Toner replacement: within 4 business hours of request. Break-fix: next business day. Monthly usage reports delivered by 5th of each month.",
      "P1 response: 30 minutes (24/7). P2: 2 hours (business hours). Batch job monitoring: real-time. Monthly system availability: 99.9%. Quarterly patching windows: max 4 hours downtime.",
    ]),
    escalationAndPenalties: randomChoice([
      "Tier 1 to Tier 2 after 2 hours. Tier 2 to management after 4 hours. 5% monthly credit for each SLA breach. Cap: 25% of monthly fee. Bonus: 1 free month for 6 consecutive months with zero P1s.",
      "Automatic escalation to account manager after 1 hour for P1. Weekly performance review calls. Penalty: 2% credit per missed KPI. Three consecutive months of misses triggers contract review.",
      "Standard escalation: helpdesk → team lead → service manager → VP. No financial penalties but quarterly performance scorecard determines contract renewal. Bonus for exceeding targets: reduced rates next year.",
      "",
    ]),
  }),

  // ===== RFP GENERATOR =====
  "rfp-generator": () => ({
    industryContext: getRandomIndustryContext(),
    rawBrief: randomChoice([
      "Hi team,\n\nWe need to find a new logistics partner for our Berlin warehouse operations. Current contract with TransEuro expires end of June 2026.\n\nKey details:\n- Volume: approximately 500 pallets per month, mostly FMCG goods\n- Must have GDP certification and 24/7 cold chain capability\n- Budget is around €180k/year but flexible for the right partner\n- Prefer providers with existing DACH network coverage\n- Need integration with our SAP WMS module\n- Warehouse is in Berlin-Spandau industrial zone\n\nWe'd also like to explore cross-docking options for our seasonal peaks (Oct-Dec).\n\nPlease draft something we can send out to 4-5 shortlisted providers.\n\nThanks,\nMaria",
      "Subject: IT Managed Services RFP Draft\n\nWe're looking to outsource our IT helpdesk and infrastructure management. Currently running a team of 6 in-house, supporting 450 users across 3 offices (Munich, Hamburg, remote).\n\nRequirements:\n- 24/7 L1/L2 support with 15-min response SLA for critical issues\n- Monthly patching and vulnerability management\n- Quarterly business reviews\n- Must be ISO 27001 certified\n- Budget: €350-400k annually\n- Contract term: 3 years with annual exit clause\n- Data must stay in EU (GDPR compliance)\n\nWe had issues with our last MSP around escalation transparency, so clear reporting is a must.\n\nDeadline for proposals: 6 weeks from distribution.",
      "Need to source commercial cleaning services for our new headquarters building.\n\nBuilding: 25,000 sqm office space, 3 floors + basement parking\nLocation: Amsterdam Zuid business district\nStart date: September 2026\nEmployees: ~800\n\nScope:\n- Daily office cleaning (Mon-Fri)\n- Deep cleaning monthly\n- Window cleaning quarterly\n- Restroom supplies management\n- Green/sustainable products preferred\n\nBudget: haven't set one yet, need market pricing first. Maybe €200-300k range?\n\nPrevious vendor was unreliable with staffing. Need guaranteed minimum staffing levels and backup protocols.\n\nAlso interested in integrated facility management if the same provider can handle security and reception.",
      "We need to procure a fleet management and telematics solution for our delivery operations.\n\n- Fleet size: 85 vehicles (60 vans, 25 trucks)\n- Operating across Benelux region\n- Need real-time GPS tracking, route optimization, driver behavior monitoring\n- Must integrate with our existing TMS (Oracle Transportation Management)\n- Fuel card integration required\n- Budget: €120k setup + €8k/month operational\n- Implementation timeline: go-live by Q3 2026\n\nWe're also evaluating EV transition — solution should support mixed fleet (ICE + EV) with charging station management.\n\nCompliance: need to meet EU tachograph regulations and sustainability reporting requirements.",
    ]),
    budgetRange: randomChoice(["€150k-200k annually", "$500k total project budget", "Not yet defined — need market pricing", ""]),
    evaluationPriorities: randomChoice(["Price 35%, Technical Capability 30%, Experience 20%, Implementation Plan 15%", "Quality 40%, Price 30%, Sustainability 20%, References 10%", ""]),
    technicalRequirements: randomChoice([
      "50 MacBook Pro M3 (32GB RAM, 512GB SSD), 20 Dell U2723QE monitors, 50 USB-C docking stations. All devices must support MDM enrollment (Jamf).",
      "15,000 tons Grade 500 rebar (12mm and 16mm diameter), 8,000 m³ C30/37 ready-mix concrete. Delivery to 3 sites within Hamburg metro area.",
      "SaaS platform must support SSO (SAML 2.0), handle 10,000 concurrent users, and provide 99.95% uptime SLA. API rate limit: minimum 1,000 req/min.",
      "",
    ]),
    incumbentData: randomChoice([
      "Currently using TransEuro GmbH at EUR 165k/year. Lead time: 48h for standard deliveries. On-time delivery rate: 91%. Contract expires June 2026.",
      "Incumbent: TechServe AG, €380k/year for L1/L2 support. Average ticket resolution: 4.2h. Customer satisfaction: 3.1/5. Pain points: poor escalation transparency, no proactive monitoring.",
      "No current supplier — greenfield procurement. Previously handled in-house with 3 FTEs (estimated cost €210k/year fully loaded).",
      "",
    ]),
    additionalInstructions: randomChoice([
      "Must include NDA clause. Prefer EU-based suppliers with GDPR compliance.",
      "Response deadline should be 3 weeks. Include site visit option.",
      "",
      "Sustainability certification (EcoVadis Gold or equivalent) preferred but not mandatory.",
    ]),
  }),

  // ===== 6. REQUIREMENTS GATHERING =====
  "requirements-gathering": () => ({
    industryContext: getRandomIndustryContext(),
    businessGoal: randomChoice([
      "Need to automate accounts payable processing to reduce errors and cycle time. Budget is ~$50k/year for the solution. Currently processing 500 invoices/month manually with 8% error rate.",
      "Consolidate 5 legacy systems into a unified platform for customer service. Budget: $200k implementation + $80k/year. 150 support agents need real-time access to customer history.",
      "Implement real-time inventory visibility across 8 warehouses. Budget is flexible but CFO wants ROI within 18 months. Currently losing $500k/year to stockouts and overstock.",
      "Enable secure remote work for 500 employees. Zero-trust architecture preferred. Budget: $300k first year. Must pass SOC2 audit requirements.",
    ]),
    technicalLandscape: randomChoice([
      "50 users initially, scaling to 200. Must integrate with SAP ERP (ECC 6.0) and Salesforce. Data security: highly restricted (financial data). On-premise data center with plans to move to Azure.",
      "200 support agents across 3 time zones. Zendesk currently in use but being replaced. Must integrate with Shopify, Stripe, and internal CRM (custom Python). SSO via Okta required.",
      "Mixed IT environment: SAP for ERP, custom WMS (Java), various Excel-based tools. 8 warehouses with varying connectivity (some rural, limited bandwidth). Need offline capability.",
      "500 users, 80% non-technical. Current stack: Microsoft 365, Azure AD, Cisco networking. Need VPN replacement. Must support BYOD policy. Compliance: GDPR, SOC2, ISO 27001.",
    ]),
    featureRequirements: randomChoice([
      "Must have: OCR invoice scanning, 3-way matching, multi-currency support, approval workflows. Nice to have: mobile app for approvals, AI-powered anomaly detection, vendor portal.",
      "Must have: omnichannel support (email, chat, phone), knowledge base, SLA tracking, CSAT surveys. Nice to have: AI chatbot, sentiment analysis, predictive routing.",
      "Must have: real-time stock levels, barcode scanning, automated reorder points, batch tracking. Nice to have: demand forecasting, supplier portal, IoT sensor integration.",
      "",
    ]),
  }),

  // ===== 7. VOLUME CONSOLIDATION =====
  "volume-consolidation": () => ({
    industryContext: getRandomIndustryContext(),
    consolidationScope: randomChoice([
      "MRO supplies across 5 plants. Vendor A (Grainger): $1.2M/year. Vendor B (Würth): $800k. Vendor C (local distributor): $350k. Roughly 60% SKU overlap between A and B. 200+ unique part numbers.",
      "Packaging materials. 3 suppliers: SupplierX ($2.5M, corrugated), SupplierY ($1.8M, corrugated + labels), SupplierZ ($600k, specialty packaging). 40% product overlap. Total: $4.9M annual.",
      "IT hardware procurement. Dell ($800k), Lenovo ($450k), HP ($300k). 70% overlap in laptop and desktop categories. Currently each department chooses their own vendor. No volume leverage.",
      "Office supplies across 12 locations. Currently using 8 different local suppliers. Total spend: $420k. Significant overlap in common items (paper, toner, cleaning). No consolidated contract exists.",
    ]),
    logisticsTerms: randomChoice([
      "Vendor A is local with next-day delivery (Net-30 terms). Vendor B is 500 miles away (Net-60) but 98% delivery reliability. Vendor C offers same-day emergency delivery but at 20% premium.",
      "All suppliers are within 200km. SupplierX: dedicated weekly truck, free delivery over $5k. SupplierY: consolidated monthly shipments, Net-45. SupplierZ: on-demand, freight extra.",
      "Dell and Lenovo ship from central EU warehouses (3-5 day delivery). HP uses local distributors (next-day). Payment terms vary: Dell Net-30, Lenovo Net-45, HP Net-60.",
      "",
    ]),
    growthForecast: randomChoice([
      "Expecting 15% volume growth next year due to new production line. Current penalty for late delivery is 2% of order value. Considering long-term agreement (3 years) for price stability.",
      "Flat growth expected. Two plants scheduled for equipment upgrades which will temporarily double MRO needs in Q3. No current penalties — need to introduce them in new contracts.",
      "10% growth expected. Opening 2 new offices next year. Want to consolidate before expansion to lock in volume pricing. Current contracts expire in 6 months.",
      "",
    ]),
  }),

  // ===== 8. CAPEX VS OPEX =====
  "capex-vs-opex": () => ({
    industryContext: getRandomIndustryContext(),
    assetDetails: randomChoice([
      "Industrial packaging line. Purchase price: $750k. Lease option: 10% annual rate over 5 years ($150k/yr). Second-hand market exists but limited for this model. Vendor offers buyback at end of lease.",
      "Fleet of 15 delivery vans. Purchase: $45k each ($675k total). Lease: $850/mo per vehicle for 4 years. Includes maintenance in lease option. Mileage cap: 25,000 km/yr.",
      "Server infrastructure for on-premise data center. Purchase: $320k for hardware + $80k installation. Cloud alternative (AWS): $12k/mo. Hybrid option available. 5-year evaluation period.",
      "Office furniture for new headquarters (200 workstations). Purchase: $400k. Furniture-as-a-Service lease: $8k/month for 3 years. Includes replacement of damaged items.",
    ]),
    lifecycleCosts: randomChoice([
      "$35k annual maintenance contract. Energy consumption: $6k/year. Operator training: $8k initial, $2k/year refresher. Expected residual value after 5 years: $150k. Decommissioning: $10k.",
      "Insurance: $2k/vehicle/year. Tires and servicing: $3k/vehicle/year. Fuel/electricity: varies. Training: minimal. Residual value at end of lease: $0 (return). Purchase residual: ~$15k/vehicle.",
      "Annual hardware maintenance: $40k (after warranty). Power and cooling: $24k/year. Dedicated IT staff (0.5 FTE): $50k/year. Cloud option includes all maintenance. Technology refresh needed at year 3.",
      "",
    ]),
    financialParameters: randomChoice([
      "WACC: 8%. Corporate tax rate: 25% (depreciation benefits favor purchase). Property tax on owned equipment: 1.5%. Inflation assumption: 3% for maintenance costs.",
      "Discount rate: 10% (high-growth company). Interest rate on debt: 5.5%. Lease payments are 100% tax deductible. Purchase allows accelerated depreciation over 3 years.",
      "WACC: 7%. No property tax on IT equipment. Cloud spending is OPEX (immediately deductible). CapEx requires board approval over $200k. Cash reserves: adequate.",
      "",
    ]),
  }),

  // ===== 13. SAVINGS CALCULATION =====
  "savings-calculation": () => ({
    industryContext: getRandomIndustryContext(),
    savingsScenario: randomChoice([
      "Negotiated widget price from $120 to $105/unit (12.5% reduction). Annual volume: 10,000 units. 3-year contract with fixed pricing. Replaces previous spot-buying arrangement.",
      "Consolidated 3 IT service contracts into 1 managed services agreement. Old total: $850k/year. New total: $720k/year. Includes expanded scope (24/7 monitoring added).",
      "Switched packaging supplier from EU to Turkey. Old price: €2.80/unit. New price: €2.15/unit (23% reduction). Volume: 500,000 units/year. Added 4 weeks lead time.",
      "Renegotiated logistics rates with incumbent carrier. Old rate: $4.50/shipment. New rate: $3.90/shipment (13% reduction). Volume: 50,000 shipments/year. 2-year commitment.",
    ]),
    costAdjustments: randomChoice([
      "Inflation at 4% (PPI for manufacturing). FX impact: EUR/USD hedge at 1.08 for Year 1, floating after. Switching costs: $25k one-time (tooling transfer). Quality defect rate expected to drop from 2% to 1%.",
      "No switching costs — same vendor. Inflation clause: CPI cap at 3% annually. Hidden cost: $15k for contract migration and system reconfiguration. Payment terms improved from Net-30 to Net-45.",
      "Shipping cost increase: $0.35/unit (longer supply chain). Customs duties: 4.5%. Currency risk: TRY/EUR volatility. Quality inspection costs: $12k/year for incoming inspection. Buffer stock needed: $40k.",
      "No inflation adjustment needed (fixed rate). Early payment discount added: 2%/10 Net-30. Fuel surcharge eliminated (was $0.15/shipment). Storage costs unchanged.",
    ]),
    reportingRequirements: randomChoice([
      "Finance requires documented baseline with timestamp. Auditable methodology for hard savings. Need hard vs soft savings split. Quarterly reporting to CPO. Year-over-year comparison format.",
      "Board reporting: need executive summary with ROI calculation. Procurement team tracks in SAP. Distinction between cost avoidance and cost reduction is critical for our methodology.",
      "Simple tracking sufficient — we use a savings tracker spreadsheet. Main requirement: baseline must be verifiable (use last 12 months average). No external audit planned.",
      "",
    ]),
  }),

  // ===== 9. SAAS OPTIMIZATION =====
  "saas-optimization": () => ({
    industryContext: getRandomIndustryContext(),
    subscriptionDetails: randomChoice([
      "Salesforce Sales Cloud: 200 seats at $150/user/month. Contract ends June 2026. 60-day cancellation notice required. Auto-renewal enabled. Annual escalation: 5%.",
      "Slack Business+: 350 seats at $12.50/user/month. Monthly billing, no long-term contract. No cancellation notice needed. Connected to Okta SSO.",
      "Adobe Creative Cloud for Enterprise: 80 licenses at $55/user/month. Annual commitment, renews in 3 months. 30-day notice required. Volume discount tier: 50-99.",
      "ServiceNow ITSM: 150 seats at $100/user/month. 3-year contract, 18 months remaining. Penalty for early exit: remaining months' fees. Enterprise support included.",
    ]),
    usageMetrics: randomChoice([
      "Only 120 of 200 users logged in last month. Feature utilization: 35% (mainly using contacts and opportunities, not reports/dashboards/forecasting). 15 users haven't logged in for 6+ months.",
      "280 of 350 active daily. However, 40% only use direct messages — not channels, workflows, or integrations. SSO connected. 70 users could move to free tier without impact.",
      "55 of 80 users active. Only 20 users use advanced tools (After Effects, Premiere). Others mainly use Acrobat and basic Photoshop — could downgrade to cheaper plan.",
      "All 150 seats actively used but 60 users only access the self-service portal (read-only). They don't need full ITSM licenses. Could switch to customer portal licenses at $25/user.",
    ]),
    redundancyContext: randomChoice([
      "We also have HubSpot ($800/month) for marketing — significant CRM overlap with Salesforce. Microsoft Dynamics considered as unified alternative. Premium support on Salesforce rarely used.",
      "Microsoft Teams is available via our M365 license but barely adopted. Slack and Teams running in parallel creates confusion. Support tier: Standard (included). No premium support needed.",
      "Canva Enterprise ($12k/year) covers 80% of design needs for marketing team. Adobe overlap for basic design work. Premium support not utilized.",
      "Jira Service Management also in use ($45/user/month for 80 agents) — significant overlap with ServiceNow for IT ticketing. Could consolidate onto one platform.",
    ]),
  }),

  // ===== FORECASTING (no changes) =====
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
      categoryContext: "",
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

  // ===== 10. CATEGORY STRATEGY =====
  "category-strategy": () => ({
    industryContext: getRandomIndustryContext(),
    categoryOverview: randomChoice([
      "IT Hardware. $4M annual spend across 15 suppliers. Categories include laptops, monitors, servers, and networking equipment. Spend has grown 20% in 2 years due to hybrid work.",
      "Packaging Materials. $6.5M annual spend. 8 suppliers. Mix of corrugated, flexible, and specialty packaging. 60% of spend with top 2 suppliers.",
      "Professional Services (Consulting). $3.2M across 22 suppliers. Highly fragmented — many one-off engagements. No preferred supplier program. Rates vary from $150-$450/hr.",
      "Logistics and Transportation. $12M annual spend. 6 carriers for domestic, 4 for international. Fuel surcharges represent 15% of total cost. Growing e-commerce channel driving small parcel volume up.",
    ]),
    marketDynamics: randomChoice([
      "Oligopoly market dominated by 3 players (Dell, HP, Lenovo = 80% market share). High business impact — every employee needs equipment. Moderate supply risk due to chip shortages easing. Price deflation trend for standard configs.",
      "Fragmented market with 50+ regional suppliers. Low supply risk — commoditized materials. Moderate business impact. Key trend: sustainability pressure driving demand for recycled content (+15% cost premium).",
      "Highly fragmented market. Low supply risk but high price variability. High business impact when expertise is critical (M&A, digital transformation). Market trend: offshore delivery models expanding.",
      "Consolidating market — 3 major acquisitions in 18 months. High supply risk for specialized routes. Critical business impact for customer deliveries. E-commerce logistics growing 25% annually.",
    ]),
    strategicGoals: randomChoice([
      "Current strategy is spot buying with no standard configs. Pain points: volatile pricing, long procurement cycles, inconsistent equipment across teams. Need to implement a catalog model. Historical savings: 0% (no formal program).",
      "Multi-source strategy with annual tenders. Pain points: quality inconsistency, rising costs, sustainability compliance pressure. Need to implement circular economy recycling program. Last tender achieved 4% savings.",
      "Ad-hoc engagement model. Pain points: no rate benchmarking, scope creep on most projects, no performance evaluation. Need preferred supplier panel with agreed rate cards. No historical savings data available.",
      "Incumbent-heavy model — 70% of spend with 2 carriers. Pain points: fuel surcharge opacity, poor visibility, capacity constraints during peak season. Need to add carriers and implement dynamic pricing.",
    ]),
  }),

  // ===== NEGOTIATION PREPARATION (remove mainFocus only) =====
  "negotiation-preparation": () => ({
    industryContext: getRandomIndustryContext(),
    negotiationSubject: randomChoice([
      "Annual IT infrastructure services renewal",
      "Raw materials supply agreement renegotiation",
      "Professional services rate card restructuring",
      "Logistics and warehousing contract extension",
      "Enterprise software license true-up negotiation",
    ]),
    currentSpend: randomCurrency(200000, 5000000),
    supplierName: randomChoice([
      "Meridian Technologies", "Atlas Supply Co.", "Pinnacle Services Group",
      "Vanguard Solutions", "Sterling Logistics", "CoreTech Systems",
    ]),
    relationshipHistory: randomChoice(["New Supplier", "1-2 Years", "3-5 Years", "Long-term Partner (5+ years)"]),
    batna: randomChoice([
      "Qualified backup supplier at 10% premium but with better service levels. 3-month transition timeline.",
      "Insourcing capability exists but would require 6-month ramp-up and €120k investment.",
      "Two alternatives shortlisted from recent RFI. Both can match specs within 90 days.",
      "Could unbundle services and source components separately, saving ~5% but adding management overhead.",
      "Strong alternative ready to engage. They offered 7% below current pricing in preliminary discussions.",
    ]),
    negotiationObjectives: randomChoice([
      "1) 5-10% price reduction, 2) Extended payment terms to Net-60, 3) Guaranteed capacity for peak season",
      "1) Price freeze for 2 years, 2) Improved SLA with financial penalties, 3) Quarterly business reviews",
      "1) Volume-based tiered pricing, 2) Innovation investment commitment, 3) Flexible termination clause",
      "1) Consolidate 3 contracts into 1, 2) Reduce total cost by 12%, 3) Add sustainability reporting",
    ]),
    mustHaves: randomChoice([
      "Minimum 3% price reduction, keep same quality specs, no exclusivity clause",
      "Net-45 payment terms minimum, annual price review cap at CPI, 90-day termination notice",
      "Maintain current service levels, no price increase above 3%, data portability guaranteed",
      "",
    ]),
    timeline: randomChoice(["Urgent (<1 month)", "Normal (1-3 months)", "Flexible (3-6 months)", "Strategic (6+ months)"]),
    spendBreakdown: randomChoice([
      "$340k hardware, $180k SaaS licenses, $90k professional services. Current blended rate: $165/hr for consulting.",
      "60% recurring maintenance ($1.2M), 25% project-based work ($500k), 15% ad-hoc support ($300k). Payment: Net-30.",
      "Top 5 SKUs represent 72% of spend. Unit prices range from $12-$450. Volume discount currently at 8%.",
      "Annual license: $620k. Implementation services: $180k. Training: $45k. Support tier: Premium at $95k/yr.",
      "",
    ]),
    leverageContext: randomChoice([
      "Two qualified alternatives shortlisted. Switching cost moderate -- 3 month migration. We represent ~8% of their revenue.",
      "Sole source situation but patent expires in 18 months. New entrants expected. Supplier knows this.",
      "We are their 3rd largest account (~12% revenue). They recently lost a major client and have excess capacity.",
      "Market is consolidating -- only 2 viable alternatives remain. However, our contract terms are below market.",
      "",
    ]),
  }),

  // ===== 16. PROCUREMENT PROJECT PLANNING =====
  "project-planning": () => ({
    industryContext: getRandomIndustryContext(),
    projectBrief: randomChoice([
      "'Strategic Sourcing Transformation' — Reduce procurement costs by 15% over 3 years through strategic sourcing across all indirect spend in North America. Scope includes 12 categories totaling $45M annual spend.",
      "'Supplier Consolidation Initiative' — Reduce supplier base from 500 to 200 qualified vendors within 18 months. Focus on tail spend elimination and preferred supplier adoption. Scope: all non-production categories.",
      "'Procurement Technology Upgrade' — Implement new P2P system (Coupa or Ariba) to replace manual PO processes. Scope: full procure-to-pay cycle for 3 business units. Budget: $1.2M including implementation.",
      "'Category Management Excellence Program' — Develop category strategies for top 10 spend categories. Establish cross-functional category teams. Build internal capability for strategic sourcing. 24-month program.",
    ]),
    constraintsAndResources: randomChoice([
      "Budget: $500k for consulting and tools. Team: 3 FTEs dedicated + 5 part-time from business units. Timeline: 12 months with quarterly milestones. Key stakeholders: CPO (sponsor), CFO, regional procurement leads, business unit VPs.",
      "Budget: $200k operational + headcount cost. Team: 2 dedicated procurement analysts. Timeline: 18 months phased rollout. Stakeholders: Procurement Director, Category Managers, Finance Controller, IT (for system access).",
      "Budget: $1.2M total (software $400k, implementation $600k, change management $200k). Team: PM + 2 procurement, supported by vendor's implementation team (6 consultants). Timeline: 9 months. Stakeholders: CIO, CPO, all department heads.",
      "Budget: $350k for external consultants + internal resource costs. Team: Category Manager leads each workstream, supported by 1 analyst. Timeline: 24 months. Stakeholders: CEO (sponsor), CPO, business unit leaders.",
    ]),
    risksAndSuccess: randomChoice([
      "Risks: scope creep (departments adding requirements), change resistance from business units, data quality issues in spend analysis. Success criteria: 15% savings achieved and documented, 80% stakeholder adoption of new processes.",
      "Risks: supplier pushback during consolidation, loss of preferred local suppliers, internal politics protecting incumbent vendors. Success: supplier count reduced to target, no supply disruptions, contract compliance >90%.",
      "Risks: integration complexity with existing ERP, user adoption challenges, data migration errors. Success: 95% PO compliance through system, 50% reduction in cycle time, positive user satisfaction scores (>4/5).",
      "",
    ]),
  }),

  // ===== 17. PRE-FLIGHT AUDIT =====
  "pre-flight-audit": () => ({
    industryContext: getRandomIndustryContext(),
    supplierIdentity: randomChoice([
      "Acme Corp (www.acmecorp.com). New supplier — no prior relationship. Planning to purchase IT managed services, estimated $500k/year. Headquarters in Dublin, Ireland. Founded 2015.",
      "NordicTech Solutions (www.nordictech.se). Recommended by our engineering team. Planning to purchase precision sensor components, ~€300k/year. Swedish company, 120 employees.",
      "Pacific Assembly Ltd (www.pacificassembly.com). Found through industry directory. Considering for contract manufacturing of electronic assemblies. Potential: $1.2M/year. Based in Shenzhen, China.",
      "GreenLogistics GmbH (www.greenlogistics.de). Competitor's former logistics partner. Evaluating for sustainable fleet management services, ~€200k/year. Berlin-based startup, founded 2020.",
    ]),
    researchScope: randomChoice([
      "Focus on financial health and legal history. Heard rumors of cash flow issues from an industry contact. CEO changed 6 months ago. Need to understand ownership structure and any pending litigation.",
      "Priority: technical capability and quality certifications. Need to verify ISO 13485 and IATF 16949 claims. Also want to check environmental compliance history and any safety incidents.",
      "Comprehensive audit needed — this would be our largest contract manufacturer. Focus areas: financial stability (D&B report), production capacity, existing client references, IP protection practices, labor practices.",
      "Quick check needed — mainly financial health and reputation. They're a startup so limited history. Check founder backgrounds, funding status, customer reviews, and any news about the company.",
    ]),
    decisionContext: randomChoice([
      "Need intelligence within 2 weeks — RFP responses due at month-end. Currently no relationship. If positive, would pursue strategic partnership. Board decision required for contracts over $300k.",
      "Medium-term evaluation — decision expected in 2 months. This would replace our current supplier whose contract expires in 6 months. Need enough information for a shortlist recommendation.",
      "Urgent — production team wants to place first order within 3 weeks. Need rapid assessment of critical risks only. If major red flags found, we'll delay and continue with current supplier.",
      "",
    ]),
  }),

  // ===== 18. CATEGORY RISK EVALUATOR =====
  "category-risk-evaluator": () => ({
    industryContext: getRandomIndustryContext(),
    categoryAndTender: randomChoice([
      "IT Services for banking digital transformation. RFP active — 5 vendors shortlisted. Estimated value: $2M over 2 years. Fixed price contract preferred. Evaluation closing in 4 weeks.",
      "Facilities management for new corporate campus. Pre-tender planning phase. Estimated value: €5M/year for 5-year contract. Integrated FM model (cleaning, security, maintenance). RFP drafting in progress.",
      "Raw materials (specialty polymers) for medical device manufacturing. RFI stage — market sounding. Estimated value: $800k/year. Framework agreement. 3 potential suppliers identified globally.",
      "Cloud infrastructure migration services. Negotiation phase with 2 finalists. Estimated value: $1.5M project + $200k/year managed services. T&M with capped ceiling. Decision needed in 2 weeks.",
    ]),
    sowAndMarket: randomChoice([
      "Scope includes cloud migration (200 applications), app modernization (50 apps), and 12-month managed services. Market is consolidating — Accenture acquired a mid-size competitor last quarter. Skills shortage in cloud architects driving day rates up 15%.",
      "Scope: building management systems, cleaning, landscaping, security (60 guards), and catering for 2,000 employees. Market is fragmented locally but global FM players (ISS, Sodexo, CBRE) dominate for this contract size.",
      "Scope: supply of 12 specialty polymer compounds meeting ISO 10993 biocompatibility requirements. Market is oligopolistic — 4 global manufacturers control 85% of medical-grade supply. Lead times: 8-12 weeks standard.",
      "Scope: lift-and-shift migration of on-premise infrastructure to AWS/Azure, including networking, security, and CI/CD pipeline. Market is competitive with 10+ qualified system integrators. Price pressure on standard migrations.",
    ]),
    historicalRisks: randomChoice([
      "Previous IT vendor went bankrupt mid-project (2023) — $400k write-off. Similar digital transformation project in another business unit experienced 60% scope creep and 18-month delay. High regulatory exposure (banking regulations).",
      "Last FM contract had significant scope creep — 25% cost overrun in Year 2. Previous vendor's staff turnover was 80%, affecting service quality. Building is LEED certified, requiring specific cleaning products and procedures.",
      "Supply disruption in 2022 — one manufacturer's facility fire caused 6-month shortage. We had to accept a 35% spot price premium. No qualified alternatives at the time. Regulatory exposure: FDA audit every 2 years.",
      "",
    ]),
  }),

  // ===== 19. SPECIFICATION OPTIMIZER =====
  "specification-optimizer": () => ({
    industryContext: getRandomIndustryContext(),
    specificationText: randomChoice([
      "Material: AISI 316L stainless steel, surface finish Ra ≤ 0.4 μm. Dimensional tolerance: ±0.01mm. Hardness: 170-220 HB. Heat treatment: solution annealed per ASTM A269. Certification: EN 10204 3.2 required. Weld inspection: 100% radiographic per ASME IX. Operating temperature: -40°C to +200°C.",
      "Server requirements: Intel Xeon Gold 6348 or equivalent, minimum 28 cores per CPU, dual CPU configuration. RAM: 512GB DDR4-3200 ECC registered. Storage: 8x 1.92TB NVMe SSD in RAID-10. Network: 4x 25GbE SFP28. Redundant 1600W platinum PSU. Rack depth: max 750mm. Operating temperature: 10-35°C.",
      "Cleaning chemical requirements: pH neutral (6.5-7.5). VOC content: <5g/L. Biodegradable within 28 days per OECD 301B. Must hold EU Ecolabel or Nordic Swan certification. Fragrance-free. Compatible with all common floor finishes (polyurethane, epoxy, vinyl). MSDS must confirm no classified hazardous substances.",
      "Packaging specification: 350gsm SBS board with C1S coating. Print: 6-color offset lithography, 175 LPI minimum. Varnish: spot UV + matte lamination. Die-cut tolerance: ±0.5mm. Glue flap: minimum 15mm. FDA-compliant food contact inks required. Shelf life stability: 24 months under tropical conditions.",
    ]),
    specContext: randomChoice([
      "Equipment spec from engineering team, last reviewed 4 years ago. This is for pharmaceutical processing equipment — safety critical application. Currently only 2 suppliers worldwide can meet the full spec. Estimated purchase value: $500k.",
      "Server spec written by IT architect based on peak load analysis from 2022. We've since moved 40% of workload to cloud. Only Dell and Lenovo can meet exact CPU model requirement. Estimated procurement: $180k for 6 servers.",
      "Cleaning spec inherited from previous FM contract (2019). Originally written for a healthcare facility — we're an office building. Current spec limits us to 3 premium-priced suppliers. Annual spend on chemicals: €45k.",
      "Packaging spec designed by marketing team for premium product line. Current spec requires a specific board weight and finish that only 2 approved suppliers can produce. Annual packaging spend: $320k.",
    ]),
    optimizationGoals: randomChoice([
      "Want to open spec to more suppliers (target: 4-5 qualified) without compromising safety. The 0.01mm tolerance and 100% radiographic weld inspection may be over-specified for our application. Looking for 15-20% cost reduction.",
      "Reduce hardware costs by allowing equivalent CPUs (AMD EPYC acceptable?). Question whether 512GB RAM is needed per server given cloud offload. Want to reduce from single-source to 3+ qualified vendors.",
      "Simplify spec to open market to 5+ suppliers. Healthcare-grade cleaning is overkill for our office environment. EU Ecolabel requirement may be limiting — is Nordic Swan equivalent? Target: 25% cost reduction.",
      "",
    ]),
  }),

  // ===== 11. SUPPLIER DEPENDENCY PLANNER =====
  "supplier-dependency-planner": () => ({
    industryContext: getRandomIndustryContext(),
    dependencyContext: randomChoice([
      "VendorX provides our core API infrastructure and data processing pipeline. $2M annual spend. We represent approximately 25% of their revenue. Rated as 'highly strategic' internally. They serve 3 of our 5 product lines.",
      "SteelCorp is our sole supplier for aerospace-grade titanium alloy components. $4.5M annual spend. They are a $200M company — we are ~2% of revenue. Only supplier with required AS9100 certification for our applications.",
      "CloudHosting Inc. provides all our production infrastructure (AWS managed services). $1.8M annual spend. Deep expertise in our specific tech stack (Kubernetes, Terraform). 3 of their engineers have institutional knowledge of our architecture.",
      "LogiPartner handles 100% of our European distribution. $3.2M annual spend. They operate dedicated warehouse space for us. We are their largest client (~30% of revenue). 15-year relationship.",
    ]),
    lockInFactors: randomChoice([
      "3-year contract with 12-month termination notice and $500k early exit penalty. Deep system integration — their APIs are embedded in 200+ microservices. They hold significant institutional knowledge about our data models and business logic.",
      "Annual renewable contract, no exit penalty. But the titanium alloy formulation is proprietary to SteelCorp — no other supplier produces this exact grade. Qualification of a new supplier would take 18-24 months and require FAA re-certification.",
      "Month-to-month managed services agreement. Data portability is technically feasible but would require 6-month migration project (~$400k). Their 3 engineers know our infrastructure intimately — losing that knowledge is the biggest risk.",
      "5-year contract, 3 years remaining. Penalty for early exit: €800k. Custom warehouse infrastructure built for our products (€1.2M investment by LogiPartner, amortized over contract term). They handle customs clearance for 15 countries.",
    ]),
    diversificationGoals: randomChoice([
      "Goal: Add a backup API provider within 12 months. 2 viable alternatives identified (CompanyA and CompanyB). Estimated switching cost: $350k for initial integration. Want to split traffic 70/30 eventually.",
      "Goal: Qualify at least 1 alternative titanium supplier. Only 1 realistic candidate identified (JapanMetals). Switching cost: $800k for qualification and testing. Timeline: 24 months. Not looking to fully replace, just reduce single-source risk.",
      "Goal: Evaluate options before current contract renewal. Considering bringing some capabilities in-house (hire 2 DevOps engineers). Also evaluating 2 alternative MSPs. Decision needed within 6 months.",
      "",
    ]),
  }),

  // ===== 12. BLACK SWAN SCENARIO =====
  "black-swan-scenario": () => ({
    industryContext: getRandomIndustryContext(),
    assessmentScope: randomChoice([
      "Assessing our Asian PCB and semiconductor suppliers — 8 suppliers across Taiwan, South Korea, and Japan. $18M annual exposure across these suppliers. Catastrophic business impact if disrupted — feeds all 4 production lines.",
      "Evaluating single-source risk for our specialty chemicals supply. 3 chemicals from 1 supplier in Germany ($4.5M). If this supplier fails, our entire pharmaceutical production stops within 2 weeks.",
      "Assessing geographic concentration risk in our logistics network. 60% of inbound shipments route through 2 ports (Rotterdam and Hamburg). $30M annual goods value passes through these chokepoints.",
      "Evaluating our IT infrastructure dependency on 2 cloud providers (AWS and Azure). $5M combined annual spend. 100% of our SaaS platform runs on these services. RPO: 0, RTO: 4 hours.",
    ]),
    riskPosture: randomChoice([
      "14 single-sourced components in scope. Safety stock: 3 weeks average (varies by component). No visibility past Tier 1 — we don't know who our suppliers' suppliers are. Last supply chain mapping exercise: 2019.",
      "Complete single-source dependency for all 3 chemicals. Safety stock: 2 months (unusual for our industry). Good visibility into this supplier's operations but no knowledge of their upstream. Annual supplier audit conducted.",
      "No alternative routes pre-qualified for port disruption scenarios. 5 days average inventory buffer. Insurance covers cargo in transit but not business interruption. No crisis response plan for logistics disruption.",
      "Multi-region deployment (US-East and EU-West) for primary services. DR site in US-West with 4-hour failover. Monthly DR tests conducted. However, no plan for simultaneous multi-cloud outage. No alternative to these 2 providers evaluated.",
    ]),
    scenarioSimulation: randomChoice([
      "Simulate: (1) Major earthquake in Taiwan affecting TSMC and related fabs, (2) China-Taiwan geopolitical escalation with trade restrictions, (3) Simultaneous pandemic-style lockdowns across all 3 source countries. We have no pre-qualified backups and minimal crisis budget ($100k).",
      "Simulate: (1) Factory explosion at supplier's main site, (2) Regulatory shutdown of supplier (environmental violation), (3) Supplier acquisition by our competitor. Response readiness: basic crisis guidelines exist but never tested. Budget for alternatives: not allocated.",
      "Simulate: (1) Rotterdam port strike lasting 4+ weeks, (2) Suez Canal blockage redux, (3) Regional natural disaster (North Sea flooding). Current response capability: manual rerouting takes 2-3 weeks. No pre-negotiated alternative port agreements.",
      "",
    ]),
  }),

  // ===== MARKET SNAPSHOT (no changes) =====
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

  // ===== CONTRACT TEMPLATE (remove mainFocus only) =====
  "contract-template": () => ({
    industryContext: getRandomIndustryContext(),
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

  // ===== SPEND ANALYSIS (remove mainFocus only) =====
  "spend-analysis-categorization": () => ({
    industryContext: getRandomIndustryContext(),
    rawSpendData: randomChoice([
      "Supplier | Description | Amount\nAWS | Cloud hosting | 45000\nHubSpot | Marketing CRM | 18000\nOffice Depot | Supplies | 3200\nDHL | Shipping | 28000\nPwC | Audit services | 95000\nSalesforce | CRM licenses | 72000\nGoogle | Ads & workspace | 34000\nRandstad | Temp staff | 120000\nSecureworks | Cybersecurity | 45000\nWerk | Cleaning | 18000",
      "Vendor, Category, Q1, Q2, Q3, Q4\nGrainger, MRO, 45000, 52000, 48000, 61000\nWürth, Fasteners, 18000, 19000, 17000, 22000\nABC Supply, Electrical, 32000, 28000, 35000, 30000\nFastenal, Safety, 12000, 14000, 11000, 15000\nMSC Industrial, Cutting Tools, 28000, 31000, 26000, 34000",
    ]),
    timeframe: randomChoice(["Last 12 Months", "Q3 2025", "FY 2025", ""]),
    businessGoal: randomChoice([
      "Need to cut OPEX by 10%",
      "Looking for vendor consolidation opportunities",
      "Preparing for board audit — need clean taxonomy",
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
