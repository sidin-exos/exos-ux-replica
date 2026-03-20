/**
 * Test Data Factory
 *
 * Generates realistic business case data for scenario testing.
 * Each generator returns data that fills all required fields with
 * plausible values for the given scenario type.
 * 
 * Field IDs are synchronized with src/lib/scenarios.ts (3-Block Meta-Pattern).
 * 
 * @module test-data-factory
 */

type TestDataGenerator = () => Record<string, string>;

// Utility functions for random data generation
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;
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

// ═══════════════════════════════════════════════════════
// Scenario-specific data generators
// Field IDs match scenarios.ts requiredFields exactly
// ═══════════════════════════════════════════════════════
const generators: Record<string, TestDataGenerator> = {

  // ===== 1. TCO ANALYSIS =====
  // Fields: industryContext, assetDefinition, opexFinancials
  "tco-analysis": () => ({
    industryContext: getRandomIndustryContext(),
    assetDefinition: randomChoice([
      "• Industrial CNC machining center with 5-axis capability\n• Lifecycle duration: 10 years\n• Annual usage: 4,500 operating hours\n• Quoted CAPEX: €1,200,000 (purchase price €1.2M, installation & commissioning €85k, initial training for 12 operators €25k, custom tooling €40k)\n• Primary vendor: Supplier_CNC_01 (sole source for this specification)",
      "• Enterprise ERP system implementation (SAP S/4HANA Cloud)\n• Lifecycle duration: 7 years\n• Annual usage: 500 concurrent users\n• Quoted CAPEX: €620,000 (software license €350k, implementation partner €180k, data migration €60k, user training €30k)\n• Primary vendor: SAP (via certified implementation partner)",
      "• Fleet of 20 electric delivery vehicles\n• Lifecycle duration: 8 years\n• Annual usage: 35,000 km per vehicle\n• Quoted CAPEX: €1,780,000 (vehicle acquisition €1.6M, charging infrastructure €120k, fleet management software €45k, driver training €15k)\n• Primary vendor: Supplier_EV_01",
      "• Automated warehouse picking system\n• Lifecycle duration: 12 years\n• Annual throughput: 500,000 picks\n• Quoted CAPEX: €1,105,000 (racking and conveyor €800k, pick-to-light €150k, WMS software €90k, ERP integration €65k)\n• Primary vendor: Supplier_WMS_01",
    ]),
    opexFinancials: randomChoice([
      "• Maintenance: €45,000/year\n• Energy consumption: €21,600/year (€1,800/month)\n• Consumables and spare parts: €12,000/year\n• Operator labour (2 FTEs): €140,000/year\n• WACC: 8%\n• Annual inflation assumption: 3%\n• Currency: EUR",
      "• SaaS subscription: €120,000/year\n• Dedicated admin (0.5 FTE): €45,000/year\n• Annual training refresher: €8,000/year\n• Third-party integrations maintenance: €15,000/year\n• WACC: 7%\n• Annual inflation assumption: 2.5%\n• Currency: EUR",
      "• Electricity for charging: €30,000/year (€2,500/month)\n• Insurance (fleet): €60,000/year\n• Tyre replacement and servicing: €35,000/year\n• Fleet management subscription: €12,000/year\n• WACC: 9%\n• Annual inflation assumption: 4%\n• Currency: EUR",
      "• WMS annual licence: €30,000/year\n• Preventive maintenance: €25,000/year\n• Electricity for automation: €18,000/year\n• Spare conveyor belts and sensors: €8,000/year\n• WACC: 7.5%\n• Annual inflation assumption: 3%\n• Currency: EUR",
    ]),
  }),

  // ===== 2. COST BREAKDOWN =====
  // Fields: industryContext, productSpecification, supplierQuote
  "cost-breakdown": () => ({
    industryContext: getRandomIndustryContext(),
    productSpecification: randomChoice([
      "• Custom aluminium housing for industrial sensor\n• Material: die-cast aluminium alloy ADC12\n• Weight: approximately 850g per unit\n• Manufacturing geography: Southern Germany\n• Labour intensity: medium (CNC finishing required after casting)",
      "• Injection-moulded polymer enclosure for consumer electronics\n• Material: ABS/PC blend, UL94 V-0 rated\n• Weight: 120g per unit\n• Manufacturing geography: Shenzhen, China\n• Labour intensity: low (automated injection moulding, manual QC)",
      "• Stainless steel pharmaceutical vessel (500L capacity)\n• Material: 316L stainless steel, Ra ≤ 0.4μm internal finish\n• Manufacturing geography: Northern Italy\n• Labour intensity: high (welding, polishing, documentation)",
    ]),
    supplierQuote: randomChoice([
      "• Supplier quoted price: €42.50 per unit\n• Our internal target: €36.00 per unit\n• Alternative quote from Supplier_B: €39.80 per unit\n• Estimated supplier margin: 18-22% based on industry benchmarks",
      "• Supplier quoted price: $3.20 per unit (MOQ 50,000)\n• Our internal target: $2.80 per unit\n• Alternative quote from Supplier_C: $3.05 per unit at MOQ 100,000\n• Estimated supplier margin: 25-30% (typical for this category)",
      "• Supplier quoted price: €185,000 per vessel\n• Our internal target: €155,000\n• No alternative quotes yet — only 3 qualified suppliers globally\n• Estimated supplier margin: 15-20% based on material cost analysis",
    ]),
  }),

  // ===== 3. CAPEX VS OPEX =====
  // Fields: industryContext, assetFinancials, financialContext
  "capex-vs-opex": () => ({
    industryContext: getRandomIndustryContext(),
    assetFinancials: randomChoice([
      "• Industrial packaging line\n• Purchase price — CAPEX option: €750,000\n• Annual lease cost — OPEX option: €150,000/year (10% annual rate over 5 years)\n• Asset financial lifespan: 7 years\n• Depreciation method: straight-line\n• Estimated annual maintenance and insurance: €41,000\n• Estimated residual value at end of life: €150,000",
      "• Fleet of 15 delivery vans\n• Purchase price — CAPEX option: €675,000 (€45k each)\n• Annual lease cost — OPEX option: €153,000/year (€850/month per vehicle for 4 years)\n• Asset financial lifespan: 5 years\n• Depreciation method: declining balance\n• Estimated annual maintenance and insurance: €75,000 (€5k/vehicle)\n• Estimated residual value at end of life: €225,000 (€15k/vehicle)",
      "• Server infrastructure for on-premise data centre\n• Purchase price — CAPEX option: €400,000 (hardware €320k + installation €80k)\n• Annual cloud alternative — OPEX option: €144,000/year (€12k/month AWS)\n• Asset financial lifespan: 5 years\n• Depreciation method: straight-line\n• Estimated annual maintenance and insurance: €64,000\n• Estimated residual value at end of life: €20,000",
      "• Office furniture for new headquarters (200 workstations)\n• Purchase price — CAPEX option: €400,000\n• Annual lease cost — OPEX option: €96,000/year (€8k/month Furniture-as-a-Service)\n• Asset financial lifespan: 8 years\n• Depreciation method: straight-line\n• Estimated annual maintenance and insurance: €5,000\n• Estimated residual value at end of life: €40,000",
    ]),
    financialContext: randomChoice([
      "• WACC: 8%\n• Corporate tax rate: 25%\n• IFRS 16 applicability: yes\n• Off-balance-sheet preference: no\n• Currency: EUR",
      "• WACC: 10%\n• Corporate tax rate: 21%\n• IFRS 16 applicability: yes\n• Off-balance-sheet preference: yes (board preference)\n• Currency: EUR",
      "• WACC: 7%\n• Corporate tax rate: 19%\n• IFRS 16 applicability: unsure\n• Off-balance-sheet preference: no\n• Currency: EUR",
      "",
    ]),
  }),

  // ===== 4. SAVINGS CALCULATION =====
  // Fields: industryContext, baselinePricing, savingsClassification
  "savings-calculation": () => ({
    industryContext: getRandomIndustryContext(),
    baselinePricing: randomChoice([
      "• Baseline price per unit: €120\n• New negotiated price per unit: €105\n• Annual volume: 10,000 units\n• Total annual spend at baseline: €1,200,000\n• Currency: EUR\n• Measurement period: 12 months",
      "• Baseline total: €850,000/year (3 separate IT service contracts)\n• New consolidated total: €720,000/year (1 managed services agreement)\n• Expanded scope included (24/7 monitoring added)\n• Currency: EUR\n• Measurement period: 12 months",
      "• Baseline price per unit: €2.80 (EU supplier)\n• New price per unit: €2.15 (Turkey supplier, 23% reduction)\n• Annual volume: 500,000 units\n• Total annual spend at baseline: €1,400,000\n• Currency: EUR\n• Measurement period: 12 months",
      "• Baseline rate per shipment: $4.50\n• New rate per shipment: $3.90 (13% reduction)\n• Annual volume: 50,000 shipments\n• Total annual spend at baseline: $225,000\n• Currency: USD\n• Measurement period: 24 months (2-year commitment)",
    ]),
    savingsClassification: randomChoice([
      "• Savings category: Hard Saving — negotiated unit price reduction on like-for-like specification\n• Inflation adjustment: yes — PPI for manufacturing at 4%\n• Maverick spend excluded: no\n• Finance sign-off required: yes\n• FX impact: EUR/USD hedge at 1.08 for Year 1, floating after. Switching costs: €25k one-time (tooling transfer). Quality defect rate expected to drop from 2% to 1%.",
      "• Savings category: Hard Saving — vendor consolidation\n• Inflation adjustment: no — fixed rate contract\n• Maverick spend excluded: no\n• Finance sign-off required: yes\n• Hidden cost: €15k for contract migration and system reconfiguration. Payment terms improved from Net-30 to Net-45.",
      "• Savings category: Cost Avoidance — geographic sourcing shift\n• Inflation adjustment: yes — CPI cap at 3% annually\n• Maverick spend excluded: yes — estimated €40k buffer stock requirement\n• Finance sign-off required: yes\n• Additional costs: shipping +€0.35/unit, customs 4.5%, currency risk TRY/EUR, QC inspection €12k/year.",
      "• Savings category: Hard Saving — rate renegotiation with incumbent\n• Inflation adjustment: no — fixed rate\n• Maverick spend excluded: no\n• Finance sign-off required: no\n• Early payment discount added: 2%/10 Net-30. Fuel surcharge eliminated (was $0.15/shipment).",
    ]),
  }),

  // ===== 5. SPEND ANALYSIS =====
  // Fields: industryContext, rawSpendData, classificationParameters
  "spend-analysis-categorization": () => ({
    industryContext: getRandomIndustryContext(),
    rawSpendData: randomChoice([
      "Supplier | Description | Amount\nAWS | Cloud hosting | 45000\nHubSpot | Marketing CRM | 18000\nOffice Depot | Supplies | 3200\nDHL | Shipping | 28000\nPwC | Audit services | 95000\nSalesforce | CRM licenses | 72000\nGoogle | Ads & workspace | 34000\nRandstad | Temp staff | 120000\nSecureworks | Cybersecurity | 45000\nWerk | Cleaning | 18000",
      "Vendor, Category, Q1, Q2, Q3, Q4\nGrainger, MRO, 45000, 52000, 48000, 61000\nWürth, Fasteners, 18000, 19000, 17000, 22000\nABC Supply, Electrical, 32000, 28000, 35000, 30000\nFastenal, Safety, 12000, 14000, 11000, 15000\nMSC Industrial, Cutting Tools, 28000, 31000, 26000, 34000",
    ]),
    classificationParameters: randomChoice([
      "• Preferred taxonomy: UNSPSC\n• Known problem categories: IT services (fragmented across 15+ vendors)\n• Cost-centre codes: not available\n• Target output: consolidation opportunities",
      "• Preferred taxonomy: Custom internal (aligned to eCl@ss L3)\n• Known problem categories: MRO — high maverick spend\n• Cost-centre codes: available per plant\n• Target output: savings potential",
      "",
    ]),
  }),

  // ===== 6. FORECASTING & BUDGETING =====
  // Fields: industryContext, historicalSpendData, scenarioAssumptions
  "forecasting-budgeting": () => ({
    industryContext: getRandomIndustryContext(),
    historicalSpendData: randomChoice([
      "• Category: IT Infrastructure\n• Current annual spend: €2,400,000\n• Prior year spend: €2,100,000\n• Year before that: €1,800,000\n• Key volume drivers: headcount growth (+15% YoY), cloud migration project, new office opening\n• Planning horizon: 3 year",
      "• Category: Raw Materials (Steel)\n• Current annual spend: €8,500,000\n• Prior year spend: €7,200,000\n• Year before that: €6,800,000\n• Key volume drivers: new production line (Q3), electric vehicle component ramp-up, seasonal demand peaks Q2/Q4\n• Planning horizon: 1 year",
      "• Category: Professional Services (Consulting)\n• Current annual spend: €3,200,000\n• Prior year spend: €3,500,000\n• Year before that: €2,800,000\n• Key volume drivers: digital transformation programme winding down, M&A integration support, regulatory compliance projects\n• Planning horizon: 1 year",
    ]),
    scenarioAssumptions: randomChoice([
      "• Base case — inflation 3%, volume +10%\n• Upside — cloud optimisation delivers 15% cost reduction on infrastructure\n• Downside — hiring freeze delays projects, but committed SaaS costs remain\n• Index: CPI for services, Gartner IT spending benchmark\n• Currency: EUR",
      "• Base case — steel index +5%, volume +20% (new line)\n• Upside — commodity prices stabilise, volume discount from consolidation\n• Downside — tariff increase on imported steel (20% surcharge scenario)\n• Index: HRC Steel Index (LME)\n• Currency: EUR",
      "",
    ]),
  }),

  // ===== 7. SAAS OPTIMIZATION =====
  // Fields: industryContext, subscriptionDetails, optimisationParameters
  "saas-optimization": () => ({
    industryContext: getRandomIndustryContext(),
    subscriptionDetails: randomChoice([
      "Salesforce Sales Cloud | 200 purchased | 120 active | €360,000/year | Renewal: June 2026 | CRM & pipeline management\nSlack Business+ | 350 purchased | 280 active | €52,500/year | Monthly billing | Team communication\nAdobe Creative Cloud | 80 purchased | 45 active | €52,800/year | Renewal: Sept 2026 | Design & marketing",
      "ServiceNow ITSM | 150 purchased | 130 active | €180,000/year | 18 months remaining | IT service management\nZoom Enterprise | 400 purchased | 250 active | €96,000/year | Renewal: March 2026 | Video conferencing\nConfluence Cloud | 300 purchased | 180 active | €36,000/year | Annual renewal | Knowledge management",
      "Microsoft 365 E5 | 500 purchased | 480 active | €342,000/year | Renewal: Dec 2026 | Productivity suite\nHubSpot Enterprise | 50 purchased | 42 active | €60,000/year | Annual renewal | Marketing automation\nDatadog Pro | 25 purchased | 25 active | €45,000/year | Monthly billing | Infrastructure monitoring",
    ]),
    optimisationParameters: randomChoice([
      "• Known overlaps: Salesforce and HubSpot both have CRM features; Slack and Teams both used for messaging\n• Auto-renewal flags: Salesforce (60-day notice), Adobe (30-day notice)\n• Feature utilisation: Salesforce at 35% (mainly contacts and opportunities), Adobe at 30% (mainly PDF and basic editing)\n• Optimisation target: cost reduction",
      "• Known overlaps: Zoom and Teams for video; Confluence and SharePoint for wikis\n• Auto-renewal flags: ServiceNow (penalty for early exit)\n• Feature utilisation: Zoom at 40% (no webinar or phone features used), Confluence at 50%\n• Optimisation target: consolidation",
      "",
    ]),
  }),

  // ===== 8. SPECIFICATION OPTIMIZER =====
  // Fields: industryContext, specificationText, specContext
  "specification-optimizer": () => ({
    industryContext: getRandomIndustryContext(),
    specificationText: randomChoice([
      "Material: AISI 316L stainless steel, surface finish Ra ≤ 0.4 μm. Dimensional tolerance: ±0.01mm. Hardness: 170-220 HB. Heat treatment: solution annealed per ASTM A269. Certification: EN 10204 3.2 required. Weld inspection: 100% radiographic per ASME IX. Operating temperature: -40°C to +200°C.",
      "Server requirements: Intel Xeon Gold 6348 or equivalent, minimum 28 cores per CPU, dual CPU configuration. RAM: 512GB DDR4-3200 ECC registered. Storage: 8x 1.92TB NVMe SSD in RAID-10. Network: 4x 25GbE SFP28. Redundant 1600W platinum PSU. Rack depth: max 750mm. Operating temperature: 10-35°C.",
      "Cleaning chemical requirements: pH neutral (6.5-7.5). VOC content: <5g/L. Biodegradable within 28 days per OECD 301B. Must hold EU Ecolabel or Nordic Swan certification. Fragrance-free. Compatible with all common floor finishes (polyurethane, epoxy, vinyl). MSDS must confirm no classified hazardous substances.",
      "Packaging specification: 350gsm SBS board with C1S coating. Print: 6-color offset lithography, 175 LPI minimum. Varnish: spot UV + matte lamination. Die-cut tolerance: ±0.5mm. Glue flap: minimum 15mm. FDA-compliant food contact inks required. Shelf life stability: 24 months under tropical conditions.",
    ]),
    specContext: randomChoice([
      "• Why set: engineering team specification, last reviewed 4 years ago. Safety-critical pharmaceutical application.\n• Target cost reduction: 15-20%\n• Approval authority: VP Engineering and Quality Director\n• Known alternatives: 304 stainless steel (lower cost, lower corrosion resistance). Currently only 2 suppliers worldwide meet full spec. Estimated purchase value: €500k. The 0.01mm tolerance and 100% radiographic weld inspection may be over-specified.",
      "• Why set: IT architect based on peak load analysis from 2022. 40% of workload since moved to cloud.\n• Target cost reduction: 20-25%\n• Approval authority: CTO\n• Known alternatives: AMD EPYC processors (acceptable?). 512GB RAM may be overkill given cloud offload. Only Dell and Lenovo meet exact CPU model requirement. Estimated procurement: €180k for 6 servers.",
      "• Why set: inherited from previous FM contract (2019), originally for healthcare facility — we're an office building.\n• Target cost reduction: 25%\n• Approval authority: Facilities Manager\n• Known alternatives: standard commercial cleaning products. Healthcare-grade is overkill. EU Ecolabel requirement may be limiting — is Nordic Swan equivalent? Current spec limits us to 3 premium-priced suppliers. Annual spend: €45k.",
      "",
    ]),
  }),

  // ===== 9. RFP GENERATOR =====
  // Fields: industryContext, rawBrief, complianceEvaluation
  "rfp-generator": () => ({
    industryContext: getRandomIndustryContext(),
    rawBrief: randomChoice([
      "Hi team,\n\nWe need to find a new logistics partner for our Berlin warehouse operations. Current contract with TransEuro expires end of June 2026.\n\nKey details:\n- Volume: approximately 500 pallets per month, mostly FMCG goods\n- Must have GDP certification and 24/7 cold chain capability\n- Budget is around €180k/year but flexible for the right partner\n- Prefer providers with existing DACH network coverage\n- Need integration with our SAP WMS module\n- Warehouse is in Berlin-Spandau industrial zone\n\nWe'd also like to explore cross-docking options for our seasonal peaks (Oct-Dec).\n\nPlease draft something we can send out to 4-5 shortlisted providers.\n\nThanks,\nMaria",
      "Subject: IT Managed Services RFP Draft\n\nWe're looking to outsource our IT helpdesk and infrastructure management. Currently running a team of 6 in-house, supporting 450 users across 3 offices (Munich, Hamburg, remote).\n\nRequirements:\n- 24/7 L1/L2 support with 15-min response SLA for critical issues\n- Monthly patching and vulnerability management\n- Quarterly business reviews\n- Must be ISO 27001 certified\n- Budget: €350-400k annually\n- Contract term: 3 years with annual exit clause\n- Data must stay in EU (GDPR compliance)\n\nWe had issues with our last MSP around escalation transparency, so clear reporting is a must.\n\nDeadline for proposals: 6 weeks from distribution.",
      "Need to source commercial cleaning services for our new headquarters building.\n\nBuilding: 25,000 sqm office space, 3 floors + basement parking\nLocation: Amsterdam Zuid business district\nStart date: September 2026\nEmployees: ~800\n\nScope:\n- Daily office cleaning (Mon-Fri)\n- Deep cleaning monthly\n- Window cleaning quarterly\n- Restroom supplies management\n- Green/sustainable products preferred\n\nBudget: haven't set one yet, need market pricing first. Maybe €200-300k range?\n\nPrevious vendor was unreliable with staffing. Need guaranteed minimum staffing levels and backup protocols.\n\nAlso interested in integrated facility management if the same provider can handle security and reception.",
    ]),
    complianceEvaluation: randomChoice([
      "Mandatory: GDP certification, GDPR compliance, ISO 9001.\nEvaluation weighting: Price 35% / Technical Capability 30% / Experience 20% / Implementation Plan 15%.\nPreferred contract: framework agreement with annual review.\nMust include NDA clause. Prefer EU-based suppliers.",
      "Mandatory: ISO 27001, GDPR, SOC2 Type 2.\nEvaluation weighting: Quality 40% / Price 30% / Sustainability 20% / References 10%.\nPreferred contract: 3 years with annual exit clause.\nResponse deadline: 3 weeks. Include site visit option.",
      "Sustainability certification (EcoVadis Gold or equivalent) preferred but not mandatory.\nNo formal evaluation weighting defined — need market pricing first.\nPreferred contract: services agreement, 3-year term.",
      "",
    ]),
  }),

  // ===== 10. SLA DEFINITION =====
  // Fields: industryContext, serviceDescription, remedyStructure
  "sla-definition": () => ({
    industryContext: getRandomIndustryContext(),
    serviceDescription: randomChoice([
      "• Cloud hosting for e-commerce platform — mission critical\n• Uptime requirement: 99.9%\n• Critical failure: complete platform unavailability or payment processing failure\n• Response time to critical failure: 15 minutes\n• Resolution time to critical failure: 4 hours\n• 24/7 operation, peak traffic during Black Friday and holiday season (3x normal load)",
      "• IT helpdesk and desktop support for 450 users across 3 offices\n• Uptime requirement: 99.5% (business hours)\n• Critical failure: >50 users unable to work simultaneously\n• Response time: 30 minutes (business hours), VIP 15 minutes\n• Resolution time: P1 4 hours, P2 8 hours, P3 3 days\n• First call resolution target: 75%",
      "• ERP application management (SAP S/4HANA) — business critical\n• Uptime requirement: 99.9%\n• Critical failure: batch job failure affecting financial reporting or order processing halt\n• Response time: 30 minutes (24/7)\n• Resolution time: P1 2 hours, P2 8 hours\n• 500 users globally across 3 time zones",
    ]),
    remedyStructure: randomChoice([
      "• Tier 1 breach at 99.5% = 5% of monthly fee credit\n  Tier 2 breach at 99.0% = 15% of monthly fee credit\n  Tier 3 breach below 98% = right to terminate\n• Escalation: helpdesk → team lead (2h) → service manager (4h) → VP (8h)\n• Measurement and reporting: monthly\n• Peak demand carve-out: Black Friday week (separate SLA applies)",
      "• 2% credit per missed KPI, cap 25% of monthly fee\n• Three consecutive months of misses triggers contract review\n• Escalation: automatic to account manager after 1 hour for P1\n• Weekly performance review calls\n• Bonus: 1 free month for 6 consecutive months with zero P1 incidents",
      "",
    ]),
  }),

  // ===== 11. TAIL SPEND =====
  // Fields: industryContext, purchaseRequirement, qualityParameters
  "tail-spend-sourcing": () => ({
    industryContext: getRandomIndustryContext(),
    purchaseRequirement: randomChoice([
      "Need 50 units of 316L stainless steel brackets, tolerance ±0.05mm, compatible with existing assembly jig ref #JIG-2024-A. Delivery to Munich plant within 2 weeks. ISO 9001 certified supplier required.",
      "Standard office supplies order: 200 reams A4 paper, 50 toner cartridges (HP LaserJet Pro M404 compatible), 100 ballpoint pens. Delivery to Amsterdam office within 5 business days.",
      "API-grade valve, ANSI 300# flange, 4-inch bore with material test certificates (EN 10204 3.1). Single unit needed for emergency maintenance. Delivery within 48 hours if possible.",
      "25 ergonomic office chairs for new team area. Must meet EN 1335 Type A standard. Budget ceiling: €500 per chair. Delivery and assembly within 3 weeks to Hamburg office.",
    ]),
    qualityParameters: randomChoice([
      "Quality: ISO 9001 minimum. Material certificates required.\nBudget ceiling: €12,000\nAcceptance: incoming inspection against dimensional drawings\nPreferred supplier: certified, local (within 200km)",
      "Quality: standard commercial grade, no special certification needed.\nBudget ceiling: €3,500\nAcceptance: visual inspection on delivery\nPreferred supplier: any reliable distributor with next-day capability",
      "Quality: API 6D certified. Full material traceability required.\nBudget ceiling: €8,000\nAcceptance: pressure test certificate + dimensional check\nPreferred supplier: existing approved vendor list preferred",
      "",
    ]),
  }),

  // ===== 12. CONTRACT TEMPLATE =====
  // Fields: industryContext, country, timeTier, contractBrief, contractType, regulatoryProvisions
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
      "Agreement type: Service Agreement.\nPayment terms: net 30, monthly invoicing.\nLiability cap: 2x annual contract value.\nKey deliverables: 24/7 helpdesk, infrastructure monitoring, quarterly business reviews, incident management. Estimated value €180k/year. Must include GDPR data processing addendum, 90-day termination notice, SLA penalties for P1 incidents exceeding 4-hour resolution.",
      "Agreement type: Framework Agreement.\nPayment terms: net 45, quarterly volume reconciliation.\nLiability cap: value of contract.\nKey deliverables: office supplies and equipment across 5 locations. 3-year term, ~€250k/year. Catalog pricing mechanism, delivery SLAs (48h standard, 4h urgent), sustainability requirements for paper products. Option to extend 2 years.",
      "Agreement type: Consulting / Professional Services.\nPayment terms: milestone-based (3 milestones over 6 months).\nLiability cap: contract value.\nKey deliverables: supply chain optimisation diagnostic, design, implementation roadmap. Budget €450k. IP assignment clause and 12-month non-compete required.",
      "Agreement type: Supply / Purchase Agreement.\nPayment terms: net 30, price adjustment formula linked to raw material indices.\nLiability cap: 2x annual value.\nKey deliverables: specialty adhesives, ~50 tonnes/year, €320k annual value. Quality specs ISO 9001, batch testing, consignment stock arrangement.",
    ]),
    contractType: randomChoice([
      "Service Agreement",
      "Supply / Purchase Agreement",
      "Framework Agreement",
      "Non-Disclosure Agreement (NDA)",
      "Consulting / Professional Services",
      "Maintenance & Support Agreement"
    ]),
    regulatoryProvisions: randomChoice([
      "Regulatory: GDPR Data Processing Agreement required. Sustainability reporting per EU CSRD.\nIP ownership: buyer retains all IP.\nDispute resolution: ICC arbitration.\nAuto-renewal: yes — 90-day notice to cancel.",
      "Regulatory: none specific.\nIP ownership: jointly developed IP.\nDispute resolution: English courts.\nAuto-renewal: no — fixed term with renewal option.",
      "Regulatory: GDPR, SOC2 compliance required.\nIP ownership: buyer retains all IP.\nDispute resolution: mediation first, then courts of governing law jurisdiction.\nAuto-renewal: yes — 60-day notice.",
      "",
    ]),
  }),

  // ===== 13. REQUIREMENTS GATHERING =====
  // Fields: industryContext, stakeholderRequirements, constraintsPriority
  "requirements-gathering": () => ({
    industryContext: getRandomIndustryContext(),
    stakeholderRequirements: randomChoice([
      "From AP team: Need OCR invoice scanning, 3-way matching, multi-currency support, approval workflows. From CFO: Must integrate with SAP ERP (ECC 6.0). From IT: cloud-based preferred, SSO via Azure AD. From operations: mobile app for approvals on the go. Nice to have: AI-powered anomaly detection, vendor portal for self-service.",
      "From customer service director: omnichannel support (email, chat, phone), knowledge base, SLA tracking, CSAT surveys. From IT: must integrate with Shopify, Stripe, and internal CRM. SSO via Okta. From CEO: want AI chatbot for first-line response. From legal: all data EU-hosted.",
      "From warehouse ops: real-time stock levels, barcode scanning, automated reorder points, batch tracking across 8 warehouses. From IT: mixed environment (SAP ERP, custom WMS, Excel tools), some warehouses have limited bandwidth — need offline capability. From CFO: ROI within 18 months.",
      "From CISO: zero-trust architecture, VPN replacement. From IT: 500 users, 80% non-technical, must support BYOD. From legal: GDPR, SOC2, ISO 27001 compliance mandatory. From HR: minimal user training required.",
    ]),
    constraintsPriority: randomChoice([
      "Budget: ~$50k/year. Timeline: go-live within 6 months. Must-haves: OCR, 3-way match, SAP integration. Nice-to-haves: mobile app, AI anomaly detection. Dependencies: SAP upgrade planned for Q4 2026.",
      "Budget: $200k implementation + $80k/year. Timeline: 9 months. Must-haves: omnichannel, SLA tracking, EU hosting. Nice-to-haves: AI chatbot, sentiment analysis. Dependencies: Zendesk contract ends March 2026.",
      "Budget: flexible but CFO wants ROI within 18 months. Timeline: phased rollout over 12 months. Must-haves: real-time inventory, barcode scanning, offline mode. Nice-to-haves: demand forecasting, IoT integration.",
      "",
    ]),
  }),

  // ===== 14. SUPPLIER REVIEW =====
  // Fields: industryContext, performanceMetrics, qualitativeAssessment
  "supplier-review": () => ({
    industryContext: getRandomIndustryContext(),
    performanceMetrics: randomChoice([
      "• On-time delivery rate: 91%\n• Quality reject rate: 2.3%\n• Invoice accuracy rate: 96%\n• SLA compliance rate: 88%\n• Overall stakeholder satisfaction: 3.2/5\n• Annual spend: €1,200,000\n• Period: Jan–Dec 2025",
      "• On-time delivery rate: 97%\n• Quality reject rate: 0.4%\n• Invoice accuracy rate: 99%\n• SLA compliance rate: 95%\n• Overall stakeholder satisfaction: 4.1/5\n• Annual spend: €3,500,000\n• Period: Jan–Dec 2025",
      "• On-time delivery rate: 82%\n• Quality reject rate: 5.1%\n• Invoice accuracy rate: 91%\n• SLA compliance rate: 78%\n• Overall stakeholder satisfaction: 2.4/5\n• Annual spend: €800,000\n• Period: Jul 2025–Jun 2026",
    ]),
    qualitativeAssessment: randomChoice([
      "• Operations Lead: 'Delivery reliability has declined since they changed their logistics partner in Q3. Communication on delays is reactive not proactive.'\n• Plant Manager: 'Quality was excellent until recently — batch #4412 had 15% rejection rate, supplier issued corrective action but root cause unclear.'\n• Trend: declining — three metrics worsened quarter-on-quarter\n• Volume plan: maintain current volume pending performance improvement\n• Strategic intent: performance-improve or exit within 6 months",
      "• Category Manager: 'Strong technical capability and responsive account management team. Proactive about suggesting cost reduction ideas.'\n• Engineering Lead: 'Consistently meet tight tolerance requirements. Good collaboration on new product introductions.'\n• Trend: stable to improving\n• Volume plan: increase 15% next year (new product line)\n• Strategic intent: develop and grow — strategic partnership candidate",
      "",
    ]),
  }),

  // ===== 15. PROCUREMENT PROJECT PLANNING =====
  // Fields: industryContext, projectBrief, stakeholderConstraints
  "procurement-project-planning": () => ({
    industryContext: getRandomIndustryContext(),
    projectBrief: randomChoice([
      "Project objective: reduce procurement costs by 15% over 3 years through strategic sourcing across all indirect spend in North America.\nKey milestones: Spend analysis (Month 1-2) / Category strategy development (Month 3-5) / Tender execution (Month 6-9) / Contract implementation (Month 10-12).\nScope: 12 categories totaling $45M annual spend.\nHard deadline: initial savings must be reportable by FY-end.",
      "Project objective: implement new P2P system (Coupa or Ariba) to replace manual PO processes.\nKey milestones: Requirements (Weeks 1-4) / Vendor selection (Weeks 5-10) / Implementation (Weeks 11-30) / Go-live (Week 36).\nScope: full procure-to-pay cycle for 3 business units. Budget: $1.2M.\nHard deadline: go-live before fiscal year end.",
      "Project objective: develop category strategies for top 10 spend categories and establish cross-functional category teams.\nKey milestones: Baseline analysis (Month 1-3) / Strategy workshops (Month 4-8) / Implementation waves (Month 9-18) / Capability building (Month 19-24).\n24-month programme. Budget: $350k for external consultants.",
    ]),
    stakeholderConstraints: randomChoice([
      "Key roles: CPO (sponsor), CFO (approval >$500k), Regional Procurement Leads (execution), Business Unit VPs (adoption).\nApproval: all contracts >$200k require CPO + CFO sign-off.\nRegulatory: data privacy review for any SaaS tool, competition law check for consolidated tenders.\nConstraints: Q4 freeze on new vendor onboarding, 2 team members on parental leave in H2.",
      "Key roles: CIO (sponsor), CPO (co-sponsor), Department Heads (change management), IT Security Lead (compliance).\nApproval: CIO for technology decisions, CPO for process changes.\nRegulatory: SOC2 compliance for any cloud vendor, GDPR DPA required.\nConstraints: IT team at 90% capacity, vendor implementation slots limited to Q2-Q3.",
      "",
    ]),
  }),

  // Also register as "project-planning" for backward compatibility
  "project-planning": () => generators["procurement-project-planning"](),

  // ===== 16. RISK ASSESSMENT =====
  // Fields: industryContext, riskEnvironment, mitigationParameters
  "risk-assessment": () => ({
    industryContext: getRandomIndustryContext(),
    riskEnvironment: randomChoice([
      "Assessing risk for our primary logistics provider relationship. $5M annual spend. Market is highly volatile with 20% price swings in last quarter. Supplier had 2 late deliveries last quarter and their CFO resigned unexpectedly. Commodity dependency on rare earths is high. Contract: 3-year expiring in 8 months, standard liability terms, index-linked price adjustments (PPI), 90-day termination notice.",
      "Assessing risk for critical IT infrastructure vendor. $3.2M annual spend. Supplier market is consolidating — 3 major acquisitions in 12 months. Our supplier is financially stable but their key patent expires next year. Regulatory environment is tightening. Month-to-month arrangement with no formal contract.",
      "Assessing risk for offshore manufacturing partner. $8M annual spend. Geopolitical risk is elevated — supplier operates primarily in a sanctions-adjacent region. Quality has been excellent but supply chain visibility is limited to Tier 1 only. Long-term partnership agreement (5 years, 2 remaining). Comprehensive liability protection.",
      "Assessing risk for raw material supplier. $1.5M annual spend. Supplier recently lost their ISO certification (regained after 3 months). Sole source for a critical component. Market has few alternatives due to technical specifications. Mission critical — maximum tolerable downtime is 48 hours.",
    ]),
    mitigationParameters: randomChoice([
      "• Maximum tolerable downtime: 48 hours\n• Insurance coverage: comprehensive but no cyber rider\n• BCP status: partial — last tested 2023\n• Budget for risk mitigation: €50,000\n• Priority: supply continuity above cost optimisation",
      "• Maximum tolerable downtime: 2-4 weeks acceptable\n• Insurance: basic commercial liability only\n• BCP status: none formal\n• Budget for risk mitigation: not specifically allocated\n• Priority: balanced — cost and continuity equally important",
      "• Maximum tolerable downtime: 1 month for most product lines\n• Insurance: comprehensive including political risk\n• BCP status: full, annually tested\n• Budget for risk mitigation: €200,000\n• Priority: compliance and reputation risk above financial risk",
      "",
    ]),
  }),

  // ===== 17. SOW CRITIC =====
  // Fields: industryContext, sowText, reviewScope
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
    reviewScope: randomChoice([
      "• Engagement type: Fixed-price\n• Governing regulatory framework: GDPR, SOC2\n• Priority review areas: scope definition, payment triggers, IP ownership, the 'silence = acceptance' clause\n• Counterparty type: SaaS vendor / consultancy\n• Additional concern: no penalty for late delivery or quality failures, missing change request process",
      "• Engagement type: Fixed-price\n• Governing regulatory framework: GDPR\n• Priority review areas: payment structure (50% upfront is too front-loaded), scope creep risk ('comprehensive' is vague), data migration ownership\n• Counterparty type: consultancy\n• Additional concern: no rollback plan, no post-go-live defect resolution SLA",
      "",
    ]),
  }),

  // ===== 18. DISRUPTION MANAGEMENT =====
  // Fields: industryContext, crisisDefinition, resourceConstraints
  "disruption-management": () => ({
    industryContext: getRandomIndustryContext(),
    crisisDefinition: randomChoice([
      "Our sole-source microchip supplier's factory in Taiwan was flooded. We have 14 days of inventory remaining. These chips are custom ASICs with 16-week lead time from any new supplier. Cause: natural disaster (flooding). Affected: all 4 production lines. Geographic scope: Asia-Pacific. Severity: confirmed disruption.\n\nRevenue impact: $85k/day. 3 customer contracts have penalty clauses for late delivery. Force majeure clause in our supplier contract is ambiguous.",
      "Key steel supplier declared force majeure due to energy crisis. We depend on them for 80% of our specialty alloy needs. Current stock covers 3 weeks of production. Cause: energy crisis / force majeure. Affected: specialty alloy components across all product lines. Geographic scope: European. Severity: confirmed disruption.\n\nWe lose $50k/day in lost production. Two automotive OEM customers have zero-tolerance late delivery policies.",
      "Medical-grade silicone tubing supplier failed FDA audit and production is halted indefinitely. We use their tubing in 6 product lines. Only 10 days of buffer stock on hand. Cause: regulatory shutdown. Affected: medical device product lines. Geographic scope: domestic US. Severity: confirmed disruption.\n\nRevenue at risk: $200k/week across affected product lines. Hospital customers cannot accept substitutes without re-validation (6-month process).",
      "Our primary logistics partner (40% of shipments) experienced a ransomware attack and all systems are down. No ETA for recovery. 200 containers currently in transit with no tracking. Cause: cyberattack at supplier. Affected: inbound and outbound logistics. Geographic scope: pan-European. Severity: confirmed disruption.\n\nCustomer orders worth $1.2M are delayed. No insurance coverage for cyber incidents at supplier.",
    ]),
    resourceConstraints: randomChoice([
      "• Inventory buffer: 14 days remaining\n• Alternative suppliers: 2 backup suppliers identified but not qualified. Switching time: 30 days minimum. Price premium: 15-20%.\n• Customer commitments at risk: 3 contracts with penalty clauses\n• Financial reserve: $100k emergency procurement budget\n• Team: procurement + operations + legal available",
      "• Inventory buffer: 3 weeks\n• Alternative suppliers: one qualified in Germany (25% premium), one in South Korea (not qualified, 8-week qualification)\n• Customer commitments: 2 automotive OEMs with zero-tolerance policies\n• Financial reserve: €200k contingency fund\n• Team: full cross-functional crisis team assembled",
      "• Inventory buffer: 10 days\n• Alternative suppliers: no direct substitutes — proprietary formulation. Grey market possible but quality risk high.\n• Customer commitments: hospital supply agreements with no substitution clause\n• Financial reserve: limited — startup cash constraints\n• Team: procurement + regulatory + quality available",
      "",
    ]),
  }),

  // ===== 19. RISK MATRIX =====
  // Fields: industryContext, riskRegister, matrixParameters
  "risk-matrix": () => ({
    industryContext: getRandomIndustryContext(),
    riskRegister: randomChoice([
      "Supplier: Supplier_Tech_01\n\nOperational risks:\n• They process sensitive patient data under HIPAA BAA. Cybersecurity posture: SOC2 Type 1 but no pen test in 18 months. Last site audit: 2 years ago.\n• They access our production network for remote equipment monitoring.\n\nCommercial risks:\n• Publicly traded, $2B revenue — financially stable. We represent 40% of their revenue in our region (mutual dependency). No active lawsuits. Insurance: comprehensive.",
      "Supplier: Supplier_Data_01\n\nOperational risks:\n• No formal cybersecurity certification. Recent Glassdoor report about data handling concerns. Limited data access (PO and shipping only).\n• They subcontract 30% of work to unknown third party.\n\nCommercial risks:\n• Private company, limited financial visibility (~$50M revenue). We are small customer (~2% revenue). One minor employment lawsuit pending. Basic insurance only.",
      "Supplier: Supplier_Cloud_01\n\nOperational risks:\n• They have admin access to our cloud infrastructure. SOC2 Type 2 certified, annual pen tests.\n• 30% of work subcontracted — third party's security posture unknown.\n\nCommercial risks:\n• Recently acquired by PE firm — financial restructuring ongoing. Cash flow concerns in industry press. We are 3rd largest client. Two active patent lawsuits. Insurance status unclear post-acquisition.",
    ]),
    matrixParameters: randomChoice([
      "• Risk categories to assess: cybersecurity, financial stability, operational dependency, legal/compliance, environmental\n• Scoring methodology: 5x5 matrix (likelihood x impact)\n• Appetite: conservative — flag anything above medium risk\n• Review frequency: quarterly",
      "• Risk categories: data security, supply continuity, commercial stability, regulatory compliance\n• Scoring: 3x3 matrix (high/medium/low)\n• Appetite: moderate — accept medium risks with mitigation plan\n• Review frequency: bi-annually",
      "",
    ]),
  }),

  // ===== 20. SOFTWARE LICENSING =====
  // Fields: industryContext, licenceDocument, usageContext
  "software-licensing": () => ({
    industryContext: getRandomIndustryContext(),
    licenceDocument: randomChoice([
      "Salesforce Sales Cloud Enterprise.\n\nCommercial terms:\n• $150/user/month for Enterprise tier\n• Vendor pushing 3-year lock-in with 5% annual escalation\n• Month-to-month option: $195/user\n• Implementation: $180k quoted by certified partner\n\nUser metrics:\n• 500 total users: 100 power users (sales reps, daily), 300 regular (marketing, support), 100 occasional (executives, view-only)\n• Expected 10% annual growth\n• Only 120 of 200 current pilot users logged in last month",
      "Microsoft 365 E5 suite.\n\nCommercial terms:\n• $57/user/month (annual commitment)\n• Volume discount: 10% at 500+ seats\n• No implementation cost if self-service\n• Partner-managed migration: $45k\n\nUser metrics:\n• 350 users across 3 offices\n• 50 power users (full admin), 200 standard, 100 light (email and basic docs)\n• 15% growth expected next year (acquisition)",
      "SAP S/4HANA Cloud.\n\nCommercial terms:\n• €180/user/month on-demand\n• 3-year contract: €140/user/month\n• Implementation: €1.2M over 18 months with certified partner\n• Annual support: 22% of licence fees\n\nUser metrics:\n• 800 users globally: 150 power (developers), 400 regular, 250 read-only\n• 50 external contractor licences also needed\n• Flat growth expected",
    ]),
    usageContext: randomChoice([
      "• Current system: legacy on-premise CRM (ACT!), end-of-life. Need full migration including 5 years of customer data.\n• Deep ERP integration required — connects to SAP for order management\n• Data export from current system: extremely difficult\n• Alternatives evaluated: HubSpot, Dynamics 365\n• Strategic concern: vendor lock-in (5-year data export difficulty)",
      "• Current system: mix of Google Workspace and standalone Office licences. Replacing to standardise.\n• Already deeply embedded in Microsoft ecosystem (Azure AD, Teams)\n• Data portability: good (standard formats)\n• Alternative: Google Workspace (main alternative)\n• Strategic concern: switching cost = retraining 350 users",
      "• Current system: SAP ECC 6.0 on-premise. 3-year migration roadmap.\n• SAP is integrated into every business process — switching ERP not realistic\n• This is about licence optimisation within SAP ecosystem\n• RISE with SAP is the vendor's push\n• Strategic concern: total cost of ownership over migration period",
    ]),
  }),

  // ===== 21. CATEGORY RISK EVALUATOR =====
  // Fields: industryContext, categoryProfile, riskIndicators
  "category-risk-evaluator": () => ({
    industryContext: getRandomIndustryContext(),
    categoryProfile: randomChoice([
      "IT Services for banking digital transformation. RFP active — 5 vendors shortlisted. Estimated value: $2M over 2 years. Fixed price preferred. Evaluation closing in 4 weeks.\n\nScope: cloud migration (200 applications), app modernisation (50 apps), and 12-month managed services. Market is consolidating — Accenture acquired a mid-size competitor. Skills shortage driving day rates up 15%.",
      "Facilities management for new corporate campus. Pre-tender planning phase. Estimated value: €5M/year for 5-year contract. Integrated FM model (cleaning, security, maintenance).\n\nScope: building management systems, cleaning, landscaping, security (60 guards), catering for 2,000 employees. Market: fragmented locally but global players (ISS, Sodexo, CBRE) dominate for this contract size.",
      "Raw materials (specialty polymers) for medical device manufacturing. RFI stage — market sounding. Estimated value: $800k/year. Framework agreement.\n\nScope: 12 specialty polymer compounds meeting ISO 10993 biocompatibility. Market: oligopolistic — 4 global manufacturers control 85% of medical-grade supply. Lead times: 8-12 weeks.",
    ]),
    riskIndicators: randomChoice([
      "• Previous IT vendor went bankrupt mid-project (2023) — $400k write-off\n• Similar project in another BU: 60% scope creep, 18-month delay\n• High regulatory exposure (banking regulations)\n• Skills shortage in cloud architects\n• Vendor financial health: mixed across shortlist",
      "• Last FM contract: 25% cost overrun in Year 2\n• Previous vendor staff turnover: 80%, affecting service quality\n• Building is LEED certified (specific product requirements)\n• Single-site concentration risk\n• Market pricing volatile post-pandemic",
      "• Supply disruption in 2022 — manufacturer fire caused 6-month shortage\n• Accepted 35% spot price premium during crisis\n• No qualified alternatives at the time\n• FDA audit every 2 years — regulatory exposure\n• Oligopolistic market limits negotiation leverage",
      "",
    ]),
  }),

  // ===== 22. NEGOTIATION PREPARATION =====
  // Fields: industryContext, supplierProposal, alternativesLeverage
  "negotiation-preparation": () => ({
    industryContext: getRandomIndustryContext(),
    supplierProposal: randomChoice([
      "Supplier: Supplier_IT_01. Annual IT infrastructure services renewal.\nCurrent spend: $" + randomNumber(200000, 5000000) + ".\n\nSupplier's proposal: 3% price increase citing inflation, maintain current SLA terms, push for 3-year lock-in. Offering 'innovation credits' worth 2% of contract for new service trials. Reduced escalation commitment.\n\nOur target: 5-10% price reduction, extended payment terms to Net-60, guaranteed capacity for peak season. Minimum acceptable: price freeze for 2 years with improved SLA penalties.",
      "Supplier: Supplier_Materials_01. Raw materials supply agreement renegotiation.\nCurrent spend: €" + randomNumber(500000, 3000000) + ".\n\nSupplier's proposal: 8% price increase linked to commodity indices, minimum 2-year commitment, volume floor of 90% of current orders. Payment terms: Net-30 unchanged.\n\nOur target: price freeze for 2 years, remove volume floor, add quarterly price review mechanism. Must-haves: no price increase above 3%, annual review cap at CPI.",
      "Supplier: Supplier_Consulting_01. Professional services rate card restructuring.\nCurrent spend: €" + randomNumber(300000, 2000000) + ".\n\nSupplier's proposal: 5% rate increase across all tiers, new minimum engagement size of 20 days, push for retainer model at €25k/month.\n\nOur target: volume-based tiered pricing, innovation investment commitment, flexible termination clause. Consolidate 3 current contracts into 1 with 12% total cost reduction.",
    ]),
    alternativesLeverage: randomChoice([
      "BATNA: Two qualified alternatives shortlisted from recent RFI. Both can match specs within 90 days. One offered 7% below current pricing in preliminary discussions.\n\nLeverage: We represent ~8% of their revenue. Switching cost moderate — 3-month migration. Their recent quarterly report showed 5% revenue decline. They have excess capacity after losing a major client.\n\nSupplier vulnerability: patent expires in 18 months — new entrants expected. They know this.",
      "BATNA: Insourcing capability exists but would require 6-month ramp-up and €120k investment. Could unbundle services and source components separately, saving ~5% but adding management overhead.\n\nLeverage: We are their 3rd largest account (~12% revenue). They recently lost a major client and have excess capacity. Market is consolidating — only 2 viable alternatives remain.\n\nSupplier vulnerability: cash flow pressure visible in extended payment terms requests to their own suppliers.",
      "BATNA: Strong alternative ready to engage — qualified backup supplier at 10% premium but better service levels. 3-month transition timeline.\n\nLeverage: 5+ year relationship gives us reference value. Our contract timing coincides with their fiscal year-end (pressure to book revenue). Two alternatives shortlisted.\n\nSupplier vulnerability: their PE owners are pushing for revenue growth — losing our account would be visible. Our market intel suggests their utilisation is at 70%.",
    ]),
  }),

  // ===== 23. CATEGORY STRATEGY =====
  // Fields: industryContext, categoryOverview, strategicGoals
  "category-strategy": () => ({
    industryContext: getRandomIndustryContext(),
    categoryOverview: randomChoice([
      "Annual spend: €4M, growing 20% over 2 years.\nIT Hardware — 15 suppliers. Categories: laptops, monitors, servers, networking.\nMarket structure: oligopoly (Dell, HP, Lenovo = 80% share).\nSupplier relationship: transactional — spot buying, no standard configs.\nRisks: volatile pricing, long procurement cycles, inconsistent equipment across teams.\nOpportunities: catalog model, volume leverage, standardisation.",
      "Annual spend: €6.5M, stable.\nPackaging Materials — 8 suppliers. Mix of corrugated, flexible, and specialty. 60% with top 2 suppliers.\nMarket structure: fragmented with 50+ regional suppliers.\nSupplier relationship: multi-source with annual tenders.\nRisks: quality inconsistency, sustainability compliance pressure.\nOpportunities: circular economy programme, recycled content, supplier development.",
      "Annual spend: €3.2M, declining from €3.5M.\nProfessional Services (Consulting) — 22 suppliers. Highly fragmented, many one-off engagements.\nMarket structure: highly fragmented.\nSupplier relationship: ad-hoc.\nRisks: no rate benchmarking, scope creep, no performance evaluation.\nOpportunities: preferred supplier panel, rate cards, improved governance.",
      "Annual spend: €12M, growing with e-commerce.\nLogistics and Transportation — 6 domestic + 4 international carriers.\nMarket structure: consolidating (3 major acquisitions in 18 months).\nSupplier relationship: incumbent-heavy (70% with 2 carriers).\nRisks: fuel surcharge opacity, capacity constraints at peak.\nOpportunities: add carriers, dynamic pricing, e-commerce logistics specialisation.",
    ]),
    strategicGoals: randomChoice([
      "3-year demand: hybrid work driving 15% annual growth in hardware needs. New offices planned in 2 cities.\nSustainability: 50% recycled content in packaging by 2028.\nRegulatory: EU CSRD reporting requires vendor sustainability data.\nSuccess in 3 years: catalog model implemented, 3-5 preferred suppliers, 12% cost reduction vs. baseline, 100% equipment standardisation.",
      "3-year demand: flat volume but increasing sustainability requirements from customers.\nSustainability: EcoVadis Gold required for all packaging suppliers by 2027.\nRegulatory: Single-Use Plastics Directive compliance.\nSuccess: circular economy programme operational, 2 innovation partnerships, 8% cost reduction through material substitution.",
      "3-year demand: digital transformation winding down, M&A integration support growing.\nSustainability: not a primary driver for this category.\nRegulatory: no specific changes.\nSuccess: preferred panel of 6-8 firms, agreed rate cards, 15% cost reduction, scope creep below 10% on all engagements.",
      "",
    ]),
  }),

  // ===== 24. MAKE VS BUY =====
  // Fields: industryContext, makeCosts, buyCosts
  "make-vs-buy": () => ({
    industryContext: getRandomIndustryContext(),
    makeCosts: randomChoice([
      "• Custom CRM system build\n• Total internal annual cost: $420k (3 engineers x $140k) + $30k infrastructure (AWS) + $80k ongoing maintenance\n• Internal capability: partial — team has general dev skills but no CRM domain expertise\n• IP risk if outsourced: high — customer data is our core differentiator (GDPR)\n• Time to build: 9-12 months to MVP\n• Strategic note: full control over customer data, sales process is our differentiator",
      "• In-house PCB assembly line\n• Total internal annual cost: $870k (CapEx $650k pick-and-place + $120k facility retrofit, amortised) + $220k/year labour (4 technicians)\n• Internal capability: no current capability — need to hire and train\n• IP risk if outsourced: low — standard PCBs, no proprietary design\n• Time to build: 6-month ramp-up, 8% yield loss during ramp\n• Strategic note: supply chain resilience is the driver — want to reduce lead time from 6 weeks to 2 weeks",
      "• Own fulfilment centre\n• Total internal annual cost: $1.975M ($480k lease + $45k WMS + $1.1M staff 25 FTEs + $350k CapEx racking/conveyors amortised)\n• Internal capability: no current capability — logistics is not core competency\n• IP risk if outsourced: low\n• Time to build: 8 months\n• Strategic note: current 3PL error rate (1.8%) hurting brand. Need same-day shipping. $2M capital approved.",
    ]),
    buyCosts: randomChoice([
      "• Salesforce Enterprise licences\n• External cost: $81k/year ($150/user x 45 users) + $160k one-time (implementation $120k + migration $25k + training $15k)\n• Vendor capability: proven — market leader\n• Contract: annual subscription, cancellable with 90 days notice\n• Exit risk: data export possible but costly. 2 alternatives: HubSpot, Dynamics 365\n• Switching cost estimate: $50k for data migration",
      "• Contract manufacturer (Shenzhen)\n• External cost: $403k/year ($4.20/unit x 8,000/month). New CM quote (Vietnam): $3.60/unit but MOQ 12,000\n• Vendor capability: proven — current CM has 5-year track record\n• Contract: annual renewable\n• Exit risk: tooling transfer fee $35k. Alternative CM requires new qualification (8 weeks)\n• Switching cost estimate: $35k + 8 weeks lost production",
      "• 3PL (renegotiated)\n• External cost: $17.5M/year ($4.80/order x 10,000 orders/day, down from $5.50)\n• Vendor capability: proven — includes WMS, labour, facility. SLA: 99.2% same-day ship\n• Contract: 3-year with annual review\n• Exit risk: moderate — standard WMS, labour transfers possible\n• Switching cost estimate: $200k transition + 3 months parallel running",
    ]),
  }),

  // ===== 25. VOLUME CONSOLIDATION =====
  // Fields: industryContext, consolidationScope, consolidationParameters
  "volume-consolidation": () => ({
    industryContext: getRandomIndustryContext(),
    consolidationScope: randomChoice([
      "Supplier_A | €1,200,000 | 51% | Midwest US (local, next-day delivery) | Expires Q4 2026\nSupplier_B | €800,000 | 34% | 500 miles away, 98% reliability | Expires Q2 2027\nSupplier_C | €350,000 | 15% | Local, same-day emergency, 20% premium | Month-to-month\n\nCategory: MRO supplies across 5 plants. ~60% SKU overlap between A and B. 200+ unique part numbers.",
      "Supplier_X | €2,500,000 | 51% | Domestic (corrugated) | Expires Dec 2026\nSupplier_Y | €1,800,000 | 37% | Domestic (corrugated + labels) | Expires Mar 2027\nSupplier_Z | €600,000 | 12% | Regional (specialty packaging) | Annual renewal\n\nCategory: Packaging materials. 40% product overlap between X and Y. Total: €4.9M annual.",
      "Supplier_Dell | €800,000 | 52% | Central EU warehouse, 3-5 day | Framework, annual\nSupplier_Lenovo | €450,000 | 29% | Central EU, 3-5 day | Net-45 terms\nSupplier_HP | €300,000 | 19% | Local distributors, next-day | Net-60 terms\n\nCategory: IT hardware. 70% overlap in laptop and desktop categories. Each department currently chooses own vendor — no volume leverage.",
    ]),
    consolidationParameters: randomChoice([
      "• Target: 70/30 dual-source split for supply continuity\n• Max single-supplier concentration: 75%\n• Capacity constraints: Supplier_B has limited warehouse capacity for same-day\n• Logistics cost: Supplier_A local (free delivery >€5k), Supplier_B freight extra\n• Contract timing: Supplier_A expires first — natural consolidation window\n• Growth: expecting 15% volume growth (new production line). Current penalty for late delivery: 2% of order value.",
      "• Target: consolidate to 2 suppliers (eliminate smallest)\n• Max single-supplier concentration: 60%\n• Capacity constraints: Supplier_Z is sole source for specialty items\n• Logistics cost: X has dedicated weekly truck (free >€5k), Y consolidated monthly\n• Contract timing: staggered — use X renewal as trigger\n• Growth: flat. Two plants upgrading equipment — temporary 2x MRO needs in Q3.",
      "",
    ]),
  }),

  // ===== 26. SUPPLIER DEPENDENCY PLANNER =====
  // Fields: industryContext, dependencyProfile, exitParameters
  "supplier-dependency-planner": () => ({
    industryContext: getRandomIndustryContext(),
    dependencyProfile: randomChoice([
      "VendorX — core API infrastructure and data processing pipeline. $2M annual spend, ~25% of their revenue. Rated 'highly strategic' internally. Serves 3 of 5 product lines.\n\nLock-in: 3-year contract, 12-month termination notice, $500k early exit penalty. Their APIs embedded in 200+ microservices. They hold significant institutional knowledge about our data models and business logic.",
      "SteelCorp — sole supplier for aerospace-grade titanium alloy components. $4.5M annual spend, ~2% of their revenue ($200M company).\n\nLock-in: annual renewable, no exit penalty. BUT the titanium alloy formulation is proprietary — no other supplier produces this exact grade. Qualification of new supplier: 18-24 months + FAA re-certification.",
      "CloudHosting Inc. — all production infrastructure (AWS managed services). $1.8M annual spend.\n\nLock-in: month-to-month MSA. Data portability technically feasible but requires 6-month migration (~$400k). Their 3 engineers know our infrastructure intimately — institutional knowledge is biggest risk.",
      "LogiPartner — 100% of European distribution. $3.2M annual spend, ~30% of their revenue. 15-year relationship.\n\nLock-in: 5-year contract, 3 years remaining. Early exit penalty: €800k. Custom warehouse infrastructure built for us (€1.2M, amortised). They handle customs clearance for 15 countries.",
    ]),
    exitParameters: randomChoice([
      "Data portability: API documentation exists but no automated export. Estimated extraction effort: 3 months.\nAlternatives: 2 viable (CompanyA, CompanyB). Estimated integration: $350k each. Want 70/30 split eventually.\nSwitching cost: $850k total (penalty + migration + parallel running).\nRegulatory: data retention requirements (7 years financial data) constrain exit timing.",
      "Data portability: not applicable — proprietary alloy formulation cannot be replicated.\nAlternatives: 1 realistic candidate (JapanMetals). Qualification: $800k over 24 months.\nSwitching cost: $800k + 24 months.\nGoal: not full replacement — reduce single-source risk. Dual-source target.",
      "Data portability: technically feasible with 6-month project.\nAlternatives: evaluate options before contract renewal. Consider hiring 2 DevOps engineers for partial insourcing. Also evaluating 2 alternative MSPs.\nSwitching cost: $400k migration + $150k/year salary differential.\nDecision needed within 6 months.",
      "",
    ]),
  }),

  // ===== 27. BLACK SWAN SCENARIO =====
  // Fields: industryContext, supplyChainTopology, resilienceParameters
  "black-swan-scenario": () => ({
    industryContext: getRandomIndustryContext(),
    supplyChainTopology: randomChoice([
      "• Core nodes: 8 suppliers across Taiwan, South Korea, Japan (PCB and semiconductor). $18M annual exposure.\n• Scenario type: Natural disaster — major earthquake in Taiwan affecting semiconductor fabs\n• Scenario severity: Continental (Asia-Pacific)\n• Scenario trigger: 7.0+ magnitude earthquake affecting Hsinchu Science Park\n\nCurrent posture: 14 single-sourced components. Safety stock: 3 weeks average. No visibility past Tier 1. Last supply chain mapping: 2019.",
      "• Core nodes: 1 supplier in Germany for 3 specialty chemicals. $4.5M annual exposure.\n• Scenario type: Regulatory shutdown — environmental violation closes main production site\n• Scenario severity: National (Germany)\n• Scenario trigger: environmental agency enforcement action\n\nCurrent posture: complete single-source dependency. Safety stock: 2 months (unusual). Good visibility into supplier operations but no knowledge of upstream. Annual audit conducted.",
      "• Core nodes: 2 ports (Rotterdam, Hamburg) handling 60% of inbound shipments. $30M annual goods value.\n• Scenario type: Geopolitical — prolonged port strike or Suez Canal blockage\n• Scenario severity: Continental (Europe)\n• Scenario trigger: labour action or maritime chokepoint closure\n\nCurrent posture: no alternative routes pre-qualified. 5 days average inventory buffer. Insurance covers cargo but not business interruption. No crisis response plan for logistics disruption.",
      "• Core nodes: AWS and Azure (2 cloud providers). $5M combined annual spend. 100% of SaaS platform runs on these.\n• Scenario type: Cyberattack — simultaneous multi-cloud outage\n• Scenario severity: Global\n• Scenario trigger: coordinated state-actor cyberattack on cloud infrastructure\n\nCurrent posture: multi-region deployment (US-East, EU-West). DR site with 4-hour failover. Monthly DR tests. However, no plan for simultaneous multi-cloud outage.",
    ]),
    resilienceParameters: randomChoice([
      "• RTO: 2 weeks maximum — production lines must resume\n• RPO: zero tolerance for customer order data loss\n• Financial buffer: 6 weeks operating cost available\n• BCP status: partial — covers IT systems but not supply chain\n• Insurance: property and business interruption, no political risk rider\n• Crisis budget: $100k (inadequate for the scenarios described)",
      "• RTO: 4 weeks acceptable for non-critical products, 1 week for essential products\n• RPO: batch records must be preserved (regulatory requirement)\n• Financial buffer: 3 months operating cost\n• BCP status: full, annually tested\n• Insurance: comprehensive including regulatory shutdown\n• Crisis budget: €500k pre-approved",
      "• RTO: 1 week — e-commerce SLA requires 48h delivery\n• RPO: real-time — no order data loss acceptable\n• Financial buffer: 2 weeks operating cost\n• BCP status: partial — IT DR tested, logistics DR never tested\n• Insurance: cargo in transit only, no business interruption\n• Crisis budget: not specifically allocated",
      "",
    ]),
  }),

  // ===== 28. MARKET SNAPSHOT =====
  // Fields: industryContext, region, marketBrief, intelligencePriorities, timeframe
  "market-snapshot": () => {
    const regions = [
      "Germany", "France", "UK", "Netherlands", "Spain", "Italy", "Poland",
      "USA", "Canada", "Mexico", "Brazil",
      "China", "Japan", "South Korea", "India", "Australia",
      "UAE", "Saudi Arabia", "South Africa",
    ];
    return {
      industryContext: getRandomIndustryContext(),
      region: randomChoice(regions),
      marketBrief: randomChoice([
        "Sustainable secondary packaging for cold-chain pharmaceutical distribution in the EU. Looking at current market leaders, their market share, pricing models, and recent M&A activity. Time horizon: current state and 12-month outlook.",
        "Leading cloud infrastructure vendors for financial services in DACH region. Enterprise adoption rates, pricing tiers, regional data centre presence, and compliance certifications (BaFin, PSD2). Time horizon: current state.",
        "Major raw material suppliers for automotive-grade steel in Central Europe. Capacity utilisation, export restrictions, price trends over past year, and sustainability credentials. Time horizon: past year + 12-month forecast.",
        "Top SaaS procurement platforms for mid-market enterprises. Feature comparison, customer base size, funding status, integration capabilities, and pricing benchmarks. Time horizon: current snapshot.",
        "Contract manufacturing partners for medical device electronics (ISO 13485 certified) in EMEA. Lead times, minimum order quantities, certifications, and capacity availability. Time horizon: current state.",
      ]),
      intelligencePriorities: randomChoice([
        "Top 3 priorities:\n1. Recent M&A activity or ownership changes\n2. Pricing trends and commodity drivers\n3. New entrants or emerging competitors",
        "Top 3 priorities:\n1. Supplier financial health signals\n2. Regulatory or ESG changes affecting the market\n3. Technology disruption or innovation",
        "Top 3 priorities:\n1. Pricing trends and commodity drivers\n2. New entrants or emerging competitors\n3. Recent M&A activity",
        "",
      ]),
      timeframe: randomChoice(["Current Snapshot", "Past Month", "Past Quarter", "Past Year"]),
    };
  },

  // ===== 29. PRE-FLIGHT AUDIT =====
  // Fields: industryContext, supplierLegalIdentity, auditScope
  "pre-flight-audit": () => ({
    industryContext: getRandomIndustryContext(),
    supplierLegalIdentity: randomChoice([
      "• Legal entity name: Acme Managed Services Ltd\n• Country of incorporation: Ireland\n• Company registration number: IE-584729\n• Trading name: Acme Corp\n• Primary jurisdiction of operations: Ireland and UK",
      "• Legal entity name: NordicTech Solutions AB\n• Country of incorporation: Sweden\n• Company registration number: 559123-4567\n• Trading name: same as legal name\n• Primary jurisdiction of operations: Nordics and DACH",
      "• Legal entity name: Pacific Assembly Co. Ltd\n• Country of incorporation: Hong Kong (operations in Shenzhen, China)\n• Company registration number: HK-2847591\n• Trading name: PacAssembly\n• Primary jurisdiction of operations: Guangdong Province, China",
      "• Legal entity name: GreenLogistics GmbH\n• Country of incorporation: Germany\n• Company registration number: HRB 219847 (Berlin)\n• Trading name: same\n• Primary jurisdiction of operations: Germany (Berlin-based startup, founded 2020)",
    ]),
    auditScope: randomChoice([
      "• Priority risk areas:\n  1. Financial distress signals (heard rumours of cash flow issues)\n  2. Litigation and regulatory sanctions\n  3. Beneficial ownership and UBO changes (CEO changed 6 months ago)\n• Specific concerns: industry contact reported cash flow issues\n• Time period: focus on last 24 months\n• Decision context: need intelligence within 2 weeks — RFP responses due at month-end. Potential strategic partnership if positive.",
      "• Priority risk areas:\n  1. ESG violations and sustainability record\n  2. Cybersecurity incidents or data breaches\n  3. Sanctions list screening\n• Specific concerns: none specific — routine due diligence for new onboarding\n• Time period: comprehensive (all available history)\n• Decision context: medium-term evaluation — decision in 2 months. Would replace current supplier whose contract expires in 6 months.",
      "• Priority risk areas:\n  1. Financial distress signals (startup — limited history)\n  2. Sanctions list screening (founder backgrounds)\n  3. Cybersecurity incidents\n• Specific concerns: startup with limited track record, need founder background check\n• Time period: all available (company founded 2020)\n• Decision context: urgent — production team wants to place first order within 3 weeks. Quick assessment of critical risks only.",
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
    // No generator for this scenario — return fallback
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
