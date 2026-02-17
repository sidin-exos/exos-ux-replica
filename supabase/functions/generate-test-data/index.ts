import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, requireAdmin } from "../_shared/auth.ts";
import { parseBody, requireString, requireStringEnum, optionalBoolean, optionalRecord, validationErrorResponse, ValidationError } from "../_shared/validate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * AI-Powered Test Data Generation with Drafter-Validator Pattern
 * 
 * Supports three modes:
 * 1. "draft" - Fast parameter proposal (1 AI call)
 * 2. "generate" - Single-pass data generation with pre-approved params (1 AI call)
 * 3. "full" - Legacy MCTS-inspired multi-call approach
 * 4. "messy" - Chaotic data generation for stress testing
 */

// Parameter types for drafter
type CompanySize = "startup" | "smb" | "mid-market" | "enterprise" | "large-enterprise";
type Complexity = "simple" | "standard" | "complex" | "edge-case";
type FinancialPressure = "comfortable" | "moderate" | "tight" | "crisis";
type StrategicPriority = "cost" | "risk" | "speed" | "quality" | "innovation" | "sustainability";
type MarketConditions = "stable" | "growing" | "volatile" | "disrupted";
type DataQuality = "excellent" | "good" | "partial" | "poor";
type TrickSubtlety = "obvious" | "moderate" | "subtle" | "expert-level";

interface TrickDefinition {
  category: string;
  description: string;
  targetField: string;
  expectedDetection: string;
  subtlety: TrickSubtlety;
}

interface TrickTemplate {
  category: string;
  templates: string[];
  targetFields: string[];
  subtlety: TrickSubtlety;
}

interface DraftedParameters {
  industry: string;
  category: string;
  companySize: CompanySize;
  complexity: Complexity;
  financialPressure: FinancialPressure;
  strategicPriority: StrategicPriority;
  marketConditions: MarketConditions;
  dataQuality: DataQuality;
  reasoning: string;
  trick?: TrickDefinition;
}

interface ScenarioSchema {
  required: string[];
  optional: string[];
}

// =============================================
// BUYER PERSONAS
// =============================================
const BUYER_PERSONAS = [
  {
    id: "rushed-junior",
    name: "The Rushed Junior Buyer",
    description: "A junior procurement specialist who is short on time. Provides minimal, vague context. Uses informal language, abbreviations, and often leaves optional fields blank.",
    optionalFillRate: "30-40%"
  },
  {
    id: "methodical-manager",
    name: "The Methodical Category Manager",
    description: "An experienced category manager. Provides highly detailed, structured, and strategic context. Fills out almost all optional fields with precise industry terminology.",
    optionalFillRate: "85-95%"
  },
  {
    id: "cfo-finance",
    name: "The CFO / Finance Leader",
    description: "A senior finance executive focused purely on numbers, risk, and ROI. Provides very short text context but is extremely precise with financial figures (currencies, percentages). Often ignores technical or operational optional fields.",
    optionalFillRate: "40-60% (financial fields prioritized)"
  },
  {
    id: "frustrated-stakeholder",
    name: "The Frustrated Stakeholder (Business Unit)",
    description: "A non-procurement user (e.g., Marketing or IT Director) forced to use the system. Complains in the text fields, provides messy narrative data instead of structured facts, and misunderstands procurement terminology.",
    optionalFillRate: "50-70% (filled but often with wrong format)"
  }
];

function selectPersona(requestedPersona?: string) {
  if (requestedPersona) {
    const found = BUYER_PERSONAS.find(p => p.id === requestedPersona);
    if (found) return found;
  }
  return BUYER_PERSONAS[Math.floor(Math.random() * BUYER_PERSONAS.length)];
}

// Industry-Category compatibility matrix
const COMPATIBILITY_MATRIX: Record<string, string[]> = {
  manufacturing: [
    "raw-materials", "components", "mro", "packaging", "logistics",
    "capital-equipment", "tooling", "contract-manufacturing", "energy"
  ],
  software: [
    "cloud-infrastructure", "saas-subscriptions", "development-tools",
    "security-services", "professional-services", "it-hardware", "telecom"
  ],
  healthcare: [
    "medical-devices", "pharmaceuticals", "clinical-supplies", "lab-equipment",
    "facilities-services", "it-systems", "professional-services", "biotech"
  ],
  retail: [
    "merchandise", "packaging", "logistics", "marketing-services",
    "store-operations", "e-commerce-tech", "facilities", "pos-systems"
  ],
  professional: [
    "professional-services", "travel", "facilities", "office-supplies",
    "it-services", "legal-services", "consulting", "training"
  ],
  financial: [
    "it-infrastructure", "professional-services", "compliance-services",
    "facilities", "security-services", "consulting", "market-data"
  ],
  energy: [
    "capital-equipment", "raw-materials", "mro", "engineering-services",
    "logistics", "safety-equipment", "environmental-services"
  ],
  construction: [
    "raw-materials", "equipment-rental", "subcontractors", "safety",
    "logistics", "engineering-services", "machinery", "tools"
  ],
};

// Core category KPIs that must align with generated data
const CATEGORY_KPIS: Record<string, string[]> = {
  "raw-materials": ["Price volatility (%)", "Lead time reliability", "Quality defect rate (PPM)"],
  "it-services": ["SLA compliance (%)", "Ticket resolution time", "System uptime (%)"],
  "professional-services": ["Billable utilization (%)", "Project delivery on-time", "Client satisfaction"],
  "logistics": ["On-time delivery (%)", "Damage rate (%)", "Cost per unit shipped"],
  "capital-equipment": ["Uptime (%)", "Maintenance cost ratio", "ROI period (months)"],
};

// =============================================
// SCENARIO_SCHEMAS — required/optional split mirrors src/lib/scenarios.ts
// Including 3 CEO overrides: annualMaintenance (tco), contractLength (sw-licensing), contractTerm (savings)
// =============================================
const SCENARIO_SCHEMAS: Record<string, ScenarioSchema> = {
  "make-vs-buy": {
    required: ["industryContext", "mainFocus", "internalSalary", "agencyFee"],
    optional: ["recruitingCost", "managementTime", "officeItPerHead", "agencyOnboardingSpeed",
               "knowledgeRetentionRisk", "qualityBenchmark", "peakLoadCapacity", "strategicImportance"]
  },
  "cost-breakdown": {
    required: ["industryContext", "mainFocus", "productDescription", "totalCost", "volumePerYear"],
    optional: ["materialCost", "laborCost", "overheadCost", "logisticsCost", "toolingCost",
               "profitMargin", "commodityIndex", "laborRateReference", "currencyExposure"]
  },
  "spend-analysis-categorization": {
    required: ["industryContext", "mainFocus", "spendData"],
    optional: ["timeframe", "categoryTaxonomy"]
  },
  "tail-spend-sourcing": {
    required: ["industryContext", "mainFocus", "purchaseAmount", "urgency"],
    optional: ["catalogAvailable", "paymentTerms", "approvalRequired",
               "quotesCount", "warranty", "deliveryCost", "returnRisk", "alternativesExist"]
  },
  "supplier-review": {
    required: ["industryContext", "mainFocus", "qualityScore", "onTimeDelivery", "innovationScore"],
    optional: ["incidentCount", "communicationScore", "financialStability",
               "socialResponsibility", "priceVsMarket", "crisisSupport", "spendVolume"]
  },
  "disruption-management": {
    required: ["industryContext", "mainFocus", "deficitSku", "stockDays", "lostRevenuePerDay"],
    optional: ["altSuppliers", "altProducts", "switchingTime", "substitutePrice",
               "forceMajeureClause", "inTransitStatus", "competitorResponse"]
  },
  "risk-assessment": {
    required: ["industryContext", "mainFocus", "assessmentSubject", "annualValue", "businessCriticality"],
    optional: ["marketVolatility", "regulatoryExposure", "geopoliticalRisk",
               "contractType", "liabilityProtection", "terminationRights",
               "currentChallenges", "supplierFinancialHealth", "recoveryTime",
               "commodityDependency", "priceAdjustmentMechanism", "supplyChainVisibility", "recentIncidents"]
  },
  "tco-analysis": {
    required: ["industryContext", "mainFocus", "assetDescription", "ownershipPeriod", "purchasePrice", "annualMaintenance"],
    optional: ["installationCost", "trainingCost", "energyConsumption", "vendorLockInRisk", "residualValue",
               "integrationCost", "consumablesCost", "laborCost", "insuranceCost",
               "proprietaryComponents", "alternativeSuppliers", "dataPortability",
               "technologyObsolescence", "marketPriceTrend", "regulatoryChanges",
               "inflationAssumption", "currencyExposure", "interestRate",
               "decommissioningCost", "dataMigrationCost", "downtimeRisk", "downtimeCostPerHour"]
  },
  "software-licensing": {
    required: ["industryContext", "mainFocus", "softwareName", "softwareCategory", "totalUsers",
               "externalUsers", "userGrowthRate", "perUserMonthly", "enterpriseTierCost", "contractLength"],
    optional: ["powerUsers", "regularUsers", "occasionalUsers",
               "usageBasedRate", "implementationCost", "longTermDiscount", "annualEscalation",
               "paymentTerms", "terminationClause", "dataExportability",
               "integrationDependency", "switchingCostEstimate", "alternativeProducts",
               "proprietaryFeatures", "vendorStability", "complianceRequirements",
               "currentSolution", "currentAnnualCost"]
  },
  "risk-matrix": {
    required: ["industryContext", "mainFocus", "dataAccess"],
    optional: ["legalStatus", "lawsuits", "financialHealth", "concentration",
               "cyberSecurity", "environmentalRisk", "sanctionsRisk", "insurance", "siteAudits"]
  },
  "sow-critic": {
    required: ["industryContext", "mainFocus", "sowText"],
    optional: ["deliverables", "acceptanceCriteria", "timeline", "responsibilities",
               "clientResources", "exclusions", "changeProcess", "penalties", "warrantyPeriod"]
  },
  "sla-definition": {
    required: ["industryContext", "mainFocus", "operatingHours", "responseTime", "serviceCriticality"],
    optional: ["resolutionTime", "allowedDowntime", "escalationProcess",
               "contactMethods", "reportingFrequency", "qualityBonuses"]
  },
  "rfp-generator": {
    required: ["industryContext", "rawBrief", "documentTypes", "evaluationPriorities",
               "budgetRange", "additionalInstructions"],
    optional: ["mainFocus"]
  },
  "requirements-gathering": {
    required: ["industryContext", "mainFocus", "businessGoal", "mustHaveFeatures"],
    optional: ["budget", "userCount", "dataSecurityLevel", "urgency",
               "itLandscape", "niceToHaveFeatures", "scalability", "languageSupport"]
  },
  "negotiation-preparation": {
    required: ["industryContext", "mainFocus", "negotiationSubject", "currentSpend",
               "supplierName", "batna", "negotiationObjectives"],
    optional: ["relationshipHistory", "buyingPower", "marketAlternatives", "switchingCost",
               "supplierDependency", "supplierBatna", "mustHaves", "niceToHaves",
               "knownConstraints", "timeline"]
  },
  "procurement-project-planning": {
    required: ["industryContext", "mainFocus", "projectTitle", "projectObjective", "projectScope"],
    optional: ["keyInputs", "expectedOutputs", "budgetConstraint", "timelineConstraint",
               "resourceConstraint", "stakeholders", "riskFactors", "successCriteria",
               "strategicAlignment", "dependencies"]
  },
  "forecasting-budgeting": {
    required: ["industryContext", "categoryContext", "historicalSpendData",
               "knownFutureEvents", "budgetConstraints", "forecastHorizon"],
    optional: []
  },
  "market-snapshot": {
    required: ["industryContext", "region", "analysisScope", "successCriteria"],
    optional: ["timeframe"]
  },
  "contract-template": {
    required: ["industryContext", "mainFocus", "country", "timeTier",
               "contractBrief", "contractType", "contractValue", "specialRequirements"],
    optional: []
  },
  "saas-optimization": {
    required: ["industryContext", "mainFocus", "totalSeats", "pricePerSeat", "contractEndDate"],
    optional: ["lastLoginDate", "featureUsage", "noticePeriod", "autoRenewal",
               "ssoIntegration", "duplicateApps", "supportTier"]
  },
  "capex-vs-opex": {
    required: ["industryContext", "mainFocus", "purchasePrice", "leaseRate", "leaseTerm"],
    optional: ["maintenanceCost", "residualValue", "wacc",
               "propertyTax", "partsInflation", "energyCost", "trainingCost"]
  },
  "savings-calculation": {
    required: ["industryContext", "mainFocus", "baselinePrice", "newPrice", "volume", "contractTerm"],
    optional: ["inflationIndex", "fxRate", "qualityCost", "earlyPaymentDiscount",
               "storageCost", "switchingCosts"]
  },
  "volume-consolidation": {
    required: ["industryContext", "mainFocus", "spendPerVendor"],
    optional: ["skuOverlap", "unitOfMeasure", "paymentTerms", "orderFrequency",
               "reliabilityIndex", "volumeGrowthForecast", "currentPenalties", "taxRate"]
  },
  "category-strategy": {
    required: ["industryContext", "mainFocus", "categoryName", "annualSpend", "painPoints"],
    optional: ["supplierCount", "marketStructure", "supplyRisk", "businessImpact",
               "currentStrategy", "innovationNeeds", "contractStatus", "stakeholders",
               "historicalSavings", "benchmarkData"]
  },
  // === 5 NEW SCENARIOS ===
  "pre-flight-audit": {
    required: ["industryContext", "mainFocus", "supplierWebsite", "supplierName"],
    optional: ["plannedPurchase", "estimatedValue", "existingRelationship",
               "researchFocus", "urgency", "redFlags"]
  },
  "category-risk-evaluator": {
    required: ["industryContext", "mainFocus", "categoryName", "tenderStage", "contractValue"],
    optional: ["sowText", "contractType", "marketConcentration", "marketTrends",
               "priceVolatility", "supplyRisk", "regulatoryExposure",
               "technologyChange", "substitutability", "pastIssues"]
  },
  "supplier-dependency-planner": {
    required: ["industryContext", "mainFocus", "supplierName", "serviceCategory",
               "annualSpend", "strategicImportance", "diversificationGoal"],
    optional: ["categoryTotalSpend", "spendConcentration", "revenueShare",
               "uniqueCapabilities", "contractTerms", "terminationPenalty",
               "dataPortability", "integrationDepth", "knowledgeDependency",
               "alternativeSuppliers", "switchingTimeEstimate", "switchingCostEstimate", "timeHorizon"]
  },
  "specification-optimizer": {
    required: ["industryContext", "mainFocus", "specificationText", "specificationCategory", "safetyRequirements"],
    optional: ["estimatedValue", "specSource", "lastReviewed", "competitiveMarket",
               "performanceMargins", "certificationRequirements", "tolerances"]
  },
  "black-swan-scenario": {
    required: ["industryContext", "mainFocus", "assessmentScope", "scopeDetails",
               "annualExposure", "scenarioTypes"],
    optional: ["businessImpact", "singleSourceItems", "geographicConcentration",
               "tierVisibility", "inventoryBuffer", "recentNearMisses",
               "alternativesReady", "responsePlaybook", "financialReserve",
               "insuranceCoverage", "acceptableDowntime", "investmentWillingness"]
  },
};

// Helper to get all fields from a schema
function getAllFields(schema: ScenarioSchema): string[] {
  return [...schema.required, ...schema.optional];
}

// Trick Library - scenario-specific training traps
const TRICK_LIBRARY: Record<string, TrickTemplate[]> = {
  "supplier-review": [
    {
      category: "performance-masking",
      templates: [
        "High communication and innovation scores, but recent delivery reliability declining with explanations buried in context",
        "Excellent quality metrics from samples, but production batch consistency issues mentioned casually",
        "Strong overall ratings, but crisis response time has degraded over past quarters with blame on external factors"
      ],
      targetFields: ["industryContext", "crisisSupport"],
      subtlety: "moderate"
    },
    {
      category: "financial-warning-signs",
      templates: [
        "Supplier appears stable but recently lost major customer representing significant portion of their revenue",
        "Good payment terms offered, but context mentions extended payment requests to their suppliers"
      ],
      targetFields: ["industryContext", "financialStability"],
      subtlety: "subtle"
    },
    {
      category: "dependency-trap",
      templates: [
        "Only qualified supplier for critical component, mentioned positively as 'exclusive partnership'",
        "Proprietary technology integration that would require 18-month transition mentioned as 'seamless integration'"
      ],
      targetFields: ["industryContext", "strategicImportance"],
      subtlety: "moderate"
    },
    {
      category: "esg-greenwashing",
      templates: [
        "Prominent sustainability certifications displayed, but audit scope limited to headquarters only",
        "Carbon neutral claims for operations, but supply chain emissions not included in scope"
      ],
      targetFields: ["socialResponsibility", "industryContext"],
      subtlety: "subtle"
    }
  ],
  "software-licensing": [
    {
      category: "lock-in-trap",
      templates: [
        "Generous discount for 3-year term, but data export only available in proprietary format",
        "Low per-user cost, but API access requires separate enterprise license at significant premium"
      ],
      targetFields: ["industryContext", "contractLength"],
      subtlety: "moderate"
    },
    {
      category: "escalation-clause",
      templates: [
        "Competitive Year 1 pricing with standard 'cost of living adjustments' - actually 8-12% annual increases",
        "Base price locked, but 'usage fees' have uncapped growth tied to company metrics"
      ],
      targetFields: ["industryContext", "perUserMonthly"],
      subtlety: "subtle"
    },
    {
      category: "user-tier-mismatch",
      templates: [
        "Enterprise tier purchased for full workforce, but only 20% are power users needing those features",
        "All-in licensing when actual usage pattern is 60% light users who could use cheaper tier"
      ],
      targetFields: ["powerUsers", "regularUsers", "occasionalUsers"],
      subtlety: "moderate"
    },
    {
      category: "exit-penalty",
      templates: [
        "Early termination requires payment of remaining term plus 6-month penalty",
        "Data extraction services priced at $500/hour for assisted migration mentioned in fine print"
      ],
      targetFields: ["industryContext", "contractLength"],
      subtlety: "subtle"
    }
  ],
  "tco-analysis": [
    {
      category: "iceberg-costs",
      templates: [
        "Competitive purchase price but annual maintenance at 22% of purchase price vs industry standard 15%",
        "Low base cost but consumables only available from vendor at 3x market rates"
      ],
      targetFields: ["purchasePrice", "annualMaintenance", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "obsolescence-trap",
      templates: [
        "Current generation equipment offered at discount, with new version launching in 6 months",
        "Technology approaching end-of-support but positioned as 'proven and stable'"
      ],
      targetFields: ["industryContext", "assetDescription"],
      subtlety: "subtle"
    },
    {
      category: "vendor-dependency",
      templates: [
        "Proprietary spare parts with single-source availability and extended lead times",
        "Specialized technician certification required that only vendor provides"
      ],
      targetFields: ["industryContext", "vendorLockInRisk"],
      subtlety: "moderate"
    },
    {
      category: "decommissioning-surprise",
      templates: [
        "Hazardous materials requiring specialized disposal not mentioned in ownership cost",
        "Asset contains regulated substances requiring certified decommissioning"
      ],
      targetFields: ["residualValue", "industryContext"],
      subtlety: "expert-level"
    }
  ],
  "negotiation-preparation": [
    {
      category: "leverage-illusion",
      templates: [
        "Three alternative suppliers identified but all have 12+ month qualification lead times",
        "Multiple options available but incumbent has exclusive access to required certifications"
      ],
      targetFields: ["marketAlternatives", "switchingCost", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "relationship-complacency",
      templates: [
        "15-year partnership celebrated as 'strategic' while pricing drifted 25% above market",
        "Strong relationship scores mask gradual erosion of service levels over past 3 years"
      ],
      targetFields: ["relationshipHistory", "industryContext"],
      subtlety: "subtle"
    },
    {
      category: "contract-auto-renewal",
      templates: [
        "Auto-renewal clause with 90-day notice window, current contract expires in 45 days",
        "Evergreen contract with renewal pricing 20% above initial term"
      ],
      targetFields: ["knownConstraints", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "benchmark-gap",
      templates: [
        "Current pricing 30% above market but internal comparison limited to historical rates",
        "Supplier-provided 'competitive analysis' used as benchmark reference"
      ],
      targetFields: ["currentSpend", "industryContext"],
      subtlety: "subtle"
    }
  ],
  "risk-assessment": [
    {
      category: "hidden-concentration",
      templates: [
        "Tier-1 supplier appears diversified but all Tier-2 sources share single raw material supplier",
        "Multiple manufacturing sites listed but all in same regulatory jurisdiction"
      ],
      targetFields: ["industryContext", "geopoliticalRisk"],
      subtlety: "expert-level"
    },
    {
      category: "false-diversification",
      templates: [
        "Three approved suppliers all located within same 50km radius disaster zone",
        "Alternative sources identified but all dependent on same regional infrastructure"
      ],
      targetFields: ["industryContext", "businessCriticality"],
      subtlety: "subtle"
    },
    {
      category: "contract-gap",
      templates: [
        "Business continuity requirements mentioned but no contractual SLAs for recovery time",
        "Force majeure clause excludes the most likely disruption scenarios for this category"
      ],
      targetFields: ["industryContext", "recoveryTime"],
      subtlety: "moderate"
    },
    {
      category: "near-miss-ignored",
      templates: [
        "Previous quality incident resolved without root cause analysis mentioned casually",
        "Past delivery disruption attributed to one-time event that could easily recur"
      ],
      targetFields: ["industryContext", "supplierFinancialHealth"],
      subtlety: "subtle"
    }
  ],
  "make-vs-buy": [
    {
      category: "capability-overestimate",
      templates: [
        "Internal team 'could' develop capability but current capacity fully allocated for 18 months",
        "Technical skills exist but not at scale required for production workload"
      ],
      targetFields: ["industryContext", "knowledgeRetentionRisk"],
      subtlety: "moderate"
    },
    {
      category: "hidden-management-cost",
      templates: [
        "Direct labor costs compared but management overhead for internal option not included",
        "Quality control requirements would need additional headcount not reflected in analysis"
      ],
      targetFields: ["managementTime", "industryContext"],
      subtlety: "subtle"
    },
    {
      category: "knowledge-loss-downplayed",
      templates: [
        "External provider gains proprietary process knowledge that becomes competitive advantage",
        "IP developed jointly but ownership defaults to vendor per standard contract terms"
      ],
      targetFields: ["knowledgeRetentionRisk", "strategicImportance"],
      subtlety: "moderate"
    },
    {
      category: "scale-mismatch",
      templates: [
        "Build option based on current volume but demand volatility requires 3x peak capacity",
        "Agency model attractive at current scale but economics invert at projected growth"
      ],
      targetFields: ["peakLoadCapacity", "industryContext"],
      subtlety: "subtle"
    }
  ],
  "disruption-management": [
    {
      category: "alternatives-mirage",
      templates: [
        "Three alternative suppliers listed but none have required certifications or capacity",
        "Backup sources identified but lead time for qualification exceeds crisis timeline"
      ],
      targetFields: ["altSuppliers", "altProducts", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "lead-time-underestimate",
      templates: [
        "Switching time quoted for normal conditions but crisis creates industry-wide demand surge",
        "Recovery timeline assumes immediate capacity availability that doesn't exist"
      ],
      targetFields: ["switchingTime", "stockDays"],
      subtlety: "subtle"
    },
    {
      category: "cost-of-inaction-hidden",
      templates: [
        "Revenue impact calculated for single product line but downstream dependencies not included",
        "Daily loss estimate excludes customer penalty clauses triggered at day 7"
      ],
      targetFields: ["lostRevenuePerDay", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "single-point-failure",
      templates: [
        "All alternatives route through same port or logistics hub as primary",
        "Backup power/IT infrastructure shares same grid or data center dependency"
      ],
      targetFields: ["industryContext", "altSuppliers"],
      subtlety: "expert-level"
    }
  ],
  "sow-critic": [
    {
      category: "scope-ambiguity",
      templates: [
        "Deliverables described as 'industry standard' without specific metrics or requirements",
        "Performance standards reference 'best efforts' rather than measurable outcomes"
      ],
      targetFields: ["industryContext"],
      subtlety: "moderate"
    },
    {
      category: "acceptance-loophole",
      templates: [
        "Acceptance deemed granted if client doesn't respond within 5 business days",
        "Partial delivery triggers proportional payment even if unusable without remaining scope"
      ],
      targetFields: ["industryContext"],
      subtlety: "subtle"
    },
    {
      category: "responsibility-shift",
      templates: [
        "Supplier performance contingent on 'timely client inputs' with undefined timeline",
        "Risk of third-party delays explicitly transferred to client"
      ],
      targetFields: ["industryContext"],
      subtlety: "subtle"
    },
    {
      category: "penalty-asymmetry",
      templates: [
        "Client late payments incur 2%/month penalty but supplier delays have no consequences",
        "Force majeure protects supplier from delays but not client from supplier non-performance"
      ],
      targetFields: ["industryContext"],
      subtlety: "moderate"
    }
  ]
};

// Helper to get random trick for scenario
function selectRandomTrick(scenarioType: string): { trick: TrickDefinition; template: TrickTemplate } | null {
  const tricks = TRICK_LIBRARY[scenarioType];
  if (!tricks || tricks.length === 0) return null;
  
  const template = tricks[Math.floor(Math.random() * tricks.length)];
  const description = template.templates[Math.floor(Math.random() * template.templates.length)];
  const targetField = template.targetFields[Math.floor(Math.random() * template.targetFields.length)];
  
  return {
    template,
    trick: {
      category: template.category,
      description,
      targetField,
      expectedDetection: `AI should identify and flag the ${template.category.replace(/-/g, ' ')} issue despite neutral/positive framing`,
      subtlety: template.subtlety
    }
  };
}

interface GenerateRequest {
  mode?: "draft" | "generate" | "full" | "messy";
  scenarioType: string;
  industry?: string;
  category?: string;
  parameters?: DraftedParameters;
  mctsIterations?: number;
  temperature?: number;
  persona?: string;
}

interface MCTSNode {
  score: number;
  data: Record<string, string>;
  reasoning: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate request - admin only
  const authResult = await authenticateRequest(req);
  if ("error" in authResult) {
    return new Response(
      JSON.stringify({ error: authResult.error.message }),
      { status: authResult.error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const isAdmin = await requireAdmin(authResult.user.userId);
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: "Admin access required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await parseBody(req);

    const VALID_MODES = ["draft", "generate", "full", "messy"] as const;
    const mode = requireStringEnum(body.mode, "mode", VALID_MODES, { optional: true }) || "full";
    const scenarioType = requireString(body.scenarioType, "scenarioType", { minLength: 1, maxLength: 200 })!;
    const industry = requireString(body.industry, "industry", { optional: true, maxLength: 200 });
    const category = requireString(body.category, "category", { optional: true, maxLength: 200 });
    const parameters = optionalRecord(body.parameters, "parameters", 30) as DraftedParameters | undefined;
    const persona = requireString(body.persona, "persona", { optional: true, maxLength: 100 });
    const mctsIterations = typeof body.mctsIterations === "number" && body.mctsIterations >= 1 && body.mctsIterations <= 10
      ? body.mctsIterations : 1;
    const temperature = typeof body.temperature === "number" && body.temperature >= 0 && body.temperature <= 2
      ? body.temperature : 0.7;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[TestDataGen] Mode: ${mode}, Scenario: ${scenarioType}`);

    // === DRAFT MODE: Propose random consistent parameters ===
    if (mode === "draft") {
      const draftResult = await handleDraftMode(LOVABLE_API_KEY, scenarioType, temperature);
      return new Response(
        JSON.stringify(draftResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Select persona for generate/messy/full modes
    const selectedPersona = selectPersona(persona);
    console.log(`[TestDataGen] Persona: ${selectedPersona.id} (${selectedPersona.name})`);

    // === GENERATE MODE: Single-pass with pre-approved parameters ===
    if (mode === "generate" && parameters) {
      const generateResult = await handleGenerateMode(
        LOVABLE_API_KEY, 
        scenarioType, 
        parameters,
        temperature,
        selectedPersona
      );
      return new Response(
        JSON.stringify(generateResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === MESSY MODE: Generate chaotic, high-friction inputs ===
    if (mode === "messy") {
      const messyResult = await handleMessyMode(
        LOVABLE_API_KEY,
        scenarioType,
        temperature > 0 ? Math.max(temperature, 0.9) : 0.9,
        selectedPersona
      );
      return new Response(
        JSON.stringify(messyResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === FULL MODE: Legacy MCTS approach ===
    const schema = SCENARIO_SCHEMAS[scenarioType] || { required: ["industryContext"], optional: [] };
    const fields = getAllFields(schema);
    const industries = Object.keys(COMPATIBILITY_MATRIX);
    
    const selectedIndustry = industry && industries.includes(industry) 
      ? industry 
      : industries[Math.floor(Math.random() * industries.length)];
    
    const validCategories = COMPATIBILITY_MATRIX[selectedIndustry] || [];
    const selectedCategory = category && validCategories.includes(category)
      ? category
      : validCategories[Math.floor(Math.random() * validCategories.length)];

    console.log(`[TestDataGen] Full mode - Industry: ${selectedIndustry}, Category: ${selectedCategory}`);
    console.log(`[TestDataGen] MCTS iterations: ${mctsIterations}`);

    const candidates: MCTSNode[] = [];
    
    for (let iteration = 0; iteration < mctsIterations; iteration++) {
      console.log(`[TestDataGen] MCTS iteration ${iteration + 1}/${mctsIterations}`);
      
      const generationPrompt = buildGenerationPrompt(
        scenarioType, 
        selectedIndustry, 
        selectedCategory, 
        schema,
        iteration,
        selectedPersona
      );
      
      const generationResponse = await callAI(LOVABLE_API_KEY, generationPrompt.system, generationPrompt.user, temperature);
      
      if (!generationResponse.success) {
        console.warn(`[TestDataGen] Generation failed on iteration ${iteration + 1}`);
        continue;
      }

      const parsedData = parseGeneratedData(generationResponse.content, fields);
      
      const validationPrompt = buildValidationPrompt(
        parsedData, 
        selectedIndustry, 
        selectedCategory,
        scenarioType
      );
      
      const validationResponse = await callAI(LOVABLE_API_KEY, validationPrompt.system, validationPrompt.user, 0.3);
      const scoreResult = parseValidationScore(validationResponse.content);
      
      candidates.push({
        score: scoreResult.score,
        data: parsedData,
        reasoning: scoreResult.reasoning
      });
      
      console.log(`[TestDataGen] Candidate ${iteration + 1} score: ${scoreResult.score}/100`);
    }

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({ error: "Failed to generate valid test data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`[TestDataGen] Selected best candidate with score: ${bestCandidate.score}/100`);

    return new Response(
      JSON.stringify({
        success: true,
        data: bestCandidate.data,
        metadata: {
          industry: selectedIndustry,
          category: selectedCategory,
          score: bestCandidate.score,
          iterations: mctsIterations,
          reasoning: bestCandidate.reasoning,
          persona: selectedPersona.id,
          personaName: selectedPersona.name,
          requiredFieldCount: schema.required.length,
          optionalFieldCount: schema.optional.length,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error.message);
    }
    console.error("[TestDataGen] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// === DRAFT MODE HANDLER ===
async function handleDraftMode(
  apiKey: string, 
  scenarioType: string,
  temperature: number
): Promise<{ success: boolean; parameters?: DraftedParameters; error?: string }> {
  const industries = Object.keys(COMPATIBILITY_MATRIX);
  
  // Select a random trick and persona for this scenario type
  const trickResult = selectRandomTrick(scenarioType);
  const persona = selectPersona();
  const trick = trickResult?.trick || null;
  
  console.log(`[TestDataGen] Draft mode - Selected trick: ${trick?.category || 'none'}`);
  
  const system = `You are a procurement test case designer. Generate a random but internally-consistent set of parameters for a test case.

AVAILABLE OPTIONS:
- Industries: ${industries.join(", ")}
- Company Sizes: startup, smb, mid-market, enterprise, large-enterprise
- Complexity: simple, standard, complex, edge-case
- Financial Pressure: comfortable, moderate, tight, crisis
- Strategic Priority: cost, risk, speed, quality, innovation, sustainability
- Market Conditions: stable, growing, volatile, disrupted
- Data Quality: excellent, good, partial, poor

RULES:
1. Pick a RANDOM industry and a COMPATIBLE category from that industry
2. All parameters should form a COHERENT business scenario
3. Write a 1-2 sentence "reasoning" explaining the case

OUTPUT FORMAT:
Return ONLY a valid JSON object with these exact keys:
{
  "industry": "...",
  "category": "...",
  "companySize": "...",
  "complexity": "...",
  "financialPressure": "...",
  "strategicPriority": "...",
  "marketConditions": "...",
  "dataQuality": "...",
  "reasoning": "..."
}`;

  const user = `Generate random parameters for a "${scenarioType}" procurement test case. Be creative but consistent.`;

  const response = await callAI(apiKey, system, user, temperature);
  
  if (!response.success) {
    return { success: false, error: "Failed to generate draft parameters" };
  }

  try {
    let jsonStr = response.content.trim();
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
    
    const parsed = JSON.parse(jsonStr.trim()) as DraftedParameters;
    
    // Validate the category is compatible with industry
    const validCategories = COMPATIBILITY_MATRIX[parsed.industry] || [];
    if (!validCategories.includes(parsed.category)) {
      parsed.category = validCategories[0] || "professional-services";
    }
    
    // Attach the selected trick
    if (trick) {
      parsed.trick = trick;
    }
    
    // Attach the selected persona
    parsed.persona = persona.id;
    parsed.personaName = persona.name;
    
    return { success: true, parameters: parsed };
  } catch (error) {
    console.error("[TestDataGen] Failed to parse draft:", error);
    return { success: false, error: "Failed to parse draft parameters" };
  }
}

// === GENERATE MODE HANDLER ===
async function handleGenerateMode(
  apiKey: string,
  scenarioType: string,
  parameters: DraftedParameters,
  temperature: number,
  selectedPersona: typeof BUYER_PERSONAS[number]
): Promise<{ success: boolean; data?: Record<string, string>; metadata?: object; error?: string }> {
  const schema = SCENARIO_SCHEMAS[scenarioType] || { required: ["industryContext"], optional: [] };
  const fields = getAllFields(schema);
  
  const companySizeDescriptions: Record<CompanySize, string> = {
    "startup": "10-50 employees, Series A/B stage, limited procurement maturity",
    "smb": "50-500 employees, established business, growing procurement needs",
    "mid-market": "500-2,000 employees, regional presence, structured procurement",
    "enterprise": "2,000-10,000 employees, multi-national, mature procurement",
    "large-enterprise": "10,000+ employees, global operations, complex procurement"
  };

  // Build trick embedding instructions if trick is present
  const trick = parameters.trick;
  const trickInstructions = trick ? `

CRITICAL TRAINING INSTRUCTION:
You must embed a specific challenge in this test case for AI training purposes.

TRICK TO EMBED:
- Category: ${trick.category}
- Description: ${trick.description}
- Target Field: ${trick.targetField}
- Subtlety Level: ${trick.subtlety}

EMBEDDING RULES:
1. The trick must be LOGICALLY embedded - it should be a realistic business situation
2. Do NOT use obvious warning words like "risk", "concern", "warning", "issue", "problem", "fail", "danger"
3. Bury the concerning detail in otherwise NEUTRAL or POSITIVE language
4. The trick should require careful reading to detect - don't make it the focus
5. An experienced procurement professional should be able to spot it
6. Embed the trick primarily in the "${trick.targetField}" field
7. The rest of the data should appear normal and professional` : '';

  const system = `You are an expert procurement consultant generating realistic test data.

STRICT CONTEXT:
- Industry: ${parameters.industry}
- Procurement Category: ${parameters.category}
- Company Size: ${parameters.companySize} (${companySizeDescriptions[parameters.companySize]})
- Complexity Level: ${parameters.complexity}
- Financial Pressure: ${parameters.financialPressure}
- Strategic Priority: ${parameters.strategicPriority}
- Market Conditions: ${parameters.marketConditions}
- Data Quality: ${parameters.dataQuality}

BUYER PERSONA:
You are generating test data from the perspective of this user persona: "${selectedPersona.name}"
${selectedPersona.description}

Adjust your output accordingly:
- Tone and verbosity of text fields should match this persona
- Optional field fill rate should be approximately ${selectedPersona.optionalFillRate}

FIELD REQUIREMENTS:
REQUIRED FIELDS (MUST always be filled):
${schema.required.map(f => `- ${f}`).join('\n')}

OPTIONAL FIELDS (fill according to persona behavior — leave some blank as empty strings):
${schema.optional.map(f => `- ${f}`).join('\n')}

CRITICAL RULES:
1. ALL data must be consistent with the above context
2. "industryContext" field MUST be 100+ words describing a specific company matching ALL parameters
3. "mainFocus" field MUST describe the user's primary objective or challenge for this analysis (50-100 words). This represents what the user is focused on - it may or may NOT align with hidden issues.
4. All numeric values must be plausible for the company scale
5. If data quality is "partial" or "poor", leave some optional fields with realistic estimates or ranges
6. ALWAYS include all REQUIRED fields. For OPTIONAL fields, follow the persona's fill rate guidance — include some as empty strings "" to simulate realistic incomplete forms.
${trickInstructions}

IMPORTANT: "mainFocus" is the user's stated priority. It may be DIFFERENT from the hidden trick.

OUTPUT FORMAT:
Return ONLY a valid JSON object with the requested fields. No markdown, no explanation.
Include ALL required fields and the optional fields you choose to fill. For unfilled optional fields, include them as empty strings.`;

  const user = `Generate test data for "${scenarioType}" scenario.

REQUIRED FIELDS:
${schema.required.map(f => `- ${f}`).join('\n')}

OPTIONAL FIELDS (fill per persona behavior):
${schema.optional.map(f => `- ${f}`).join('\n')}

Context: ${parameters.reasoning}
${trick ? `\nRemember: Subtly embed the ${trick.category} challenge in the ${trick.targetField} field without being obvious.` : ''}

Return ONLY the JSON object.`;

  console.log(`[TestDataGen] Generate mode - Trick: ${trick?.category || 'none'}, Target: ${trick?.targetField || 'N/A'}, Persona: ${selectedPersona.id}`);

  const response = await callAI(apiKey, system, user, temperature);
  
  if (!response.success) {
    return { success: false, error: "Failed to generate test data" };
  }

  const data = parseGeneratedData(response.content, fields);
  
  if (Object.keys(data).length === 0) {
    return { success: false, error: "Failed to parse generated data" };
  }

  // Validate trick embedding if trick was specified
  let trickScore = null;
  if (trick && data[trick.targetField]) {
    trickScore = scoreTrickEmbedding(data, trick);
    console.log(`[TestDataGen] Trick embedding score: ${trickScore.subtletyScore}/100 - ${trickScore.feedback}`);
  }

  return {
    success: true,
    data,
    metadata: {
      industry: parameters.industry,
      category: parameters.category,
      score: 75,
      iterations: 1,
      reasoning: parameters.reasoning,
      parameters: parameters,
      trickValidation: trickScore,
      persona: selectedPersona.id,
      personaName: selectedPersona.name,
      requiredFieldCount: schema.required.length,
      optionalFieldCount: schema.optional.length,
    }
  };
}

// Validate trick embedding quality
function scoreTrickEmbedding(
  data: Record<string, string>, 
  trick: TrickDefinition
): { embedded: boolean; subtletyScore: number; feedback: string } {
  const targetContent = data[trick.targetField] || "";
  
  if (!targetContent) {
    return { embedded: false, subtletyScore: 0, feedback: "Target field is empty" };
  }
  
  // Check for obvious warning words (bad - reduces subtlety)
  const warningWords = /\b(risk|concern|warning|issue|problem|fail|danger|threat|vulnerability|weakness|flaw|defect|critical)\b/gi;
  const hasWarningWords = warningWords.test(targetContent);
  
  // Check if trick topic keywords are present (good - means it's embedded)
  const trickKeywords = trick.category.split('-').join('|');
  const categoryTerms = new RegExp(`(${trickKeywords}|decline|delay|hidden|buried|quietly|casually|mentioned|attributed)`, 'i');
  const hasTrickIndicators = categoryTerms.test(targetContent);
  
  // Check content length (longer is better for hiding tricks)
  const contentLength = targetContent.length;
  const lengthScore = Math.min(30, Math.floor(contentLength / 20));
  
  // Calculate subtlety score
  let subtletyScore = 50; // Base score
  if (hasTrickIndicators) subtletyScore += 20;
  if (!hasWarningWords) subtletyScore += 20;
  subtletyScore += lengthScore;
  subtletyScore = Math.min(100, subtletyScore);
  
  // Generate feedback
  let feedback = "";
  if (hasWarningWords) {
    feedback = "Contains obvious warning words - trick may be too easy to spot";
  } else if (!hasTrickIndicators) {
    feedback = "Trick indicators not clearly present - may need stronger embedding";
  } else if (subtletyScore >= 80) {
    feedback = "Well-embedded trick with good subtlety";
  } else {
    feedback = "Trick embedded but could be more subtle";
  }
  
  return {
    embedded: hasTrickIndicators,
    subtletyScore,
    feedback
  };
}

// === MESSY MODE HANDLER ===
const HIGH_FRICTION_SCENARIOS = [
  "tco-analysis", "software-licensing", "cost-breakdown",
  "make-vs-buy", "supplier-review", "negotiation-preparation"
];

async function handleMessyMode(
  apiKey: string,
  scenarioType: string,
  temperature: number,
  selectedPersona: typeof BUYER_PERSONAS[number]
): Promise<{ success: boolean; data?: Record<string, string>; metadata?: object; error?: string }> {
  // Default to a random high-friction scenario if the provided one isn't in the list
  const targetScenario = HIGH_FRICTION_SCENARIOS.includes(scenarioType)
    ? scenarioType
    : HIGH_FRICTION_SCENARIOS[Math.floor(Math.random() * HIGH_FRICTION_SCENARIOS.length)];

  const schema = SCENARIO_SCHEMAS[targetScenario] || { required: ["industryContext"], optional: [] };
  const fields = getAllFields(schema);

  // Messy mode defaults to frustrated-stakeholder but can be overridden
  const messyPersona = selectedPersona.id === "frustrated-stakeholder" || selectedPersona
    ? selectedPersona
    : BUYER_PERSONAS.find(p => p.id === "frustrated-stakeholder")!;

  console.log(`[TestDataGen] Messy mode - Target: ${targetScenario}, Fields: ${fields.length}, Persona: ${messyPersona.id}`);

  const system = `You are a busy, disorganized procurement manager. Generate realistic, messy corporate data for the '${targetScenario}' scenario. Do NOT provide clean, isolated numbers or perfectly formatted text. Instead, generate copy-pasted email threads from suppliers, fragmented meeting notes, or raw CSV strings where pricing, terms, and context are all mixed together in unstructured text. Force this chaotic text into the required scenario schema fields, even if it means shoving a whole email paragraph into a 'currency' or 'number' field, or leaving some fields completely blank. The goal is to simulate maximum UX friction and trigger the shadow logging evaluation.

BUYER PERSONA:
You are generating this messy data from the perspective of: "${messyPersona.name}"
${messyPersona.description}

FIELD REQUIREMENTS:
REQUIRED FIELDS (MUST be filled, even if messily):
${schema.required.map(f => `- ${f}`).join('\n')}

OPTIONAL FIELDS (fill chaotically per persona, some blank):
${schema.optional.map(f => `- ${f}`).join('\n')}

OUTPUT FORMAT:
Return ONLY a valid JSON object with ALL field names as keys. Required fields must have messy data. Optional fields may be empty strings or contain mismatched data.`;

  const user = `Generate messy, chaotic procurement data for the "${targetScenario}" scenario.

ALL FIELDS (force messy data into required, optionally fill others):
${fields.map(f => `- ${f}`).join('\n')}

Examples of messy data styles:
- A "currency" field containing: "idk maybe around 50k? check the email from Sarah — she said between 45-55k EUR but that was before the Q3 adjustments"
- A "number" field containing: "see attached spreadsheet row 47, col D — last time it was 12 but procurement said they're renegotiating"
- A "text" field containing a full forwarded email thread with "FW: RE: RE: Updated pricing" 
- Some optional fields left completely blank

Return ONLY the JSON object.`;

  const response = await callAI(apiKey, system, user, temperature);

  if (!response.success) {
    return { success: false, error: "Failed to generate messy test data" };
  }

  const data = parseGeneratedData(response.content, fields);

  if (Object.keys(data).length === 0) {
    return { success: false, error: "Failed to parse messy generated data" };
  }

  return {
    success: true,
    data,
    metadata: {
      industry: "mixed",
      category: "mixed",
      score: 0, // Messy data intentionally scores low
      iterations: 1,
      reasoning: `Messy mode: chaotic data generated for ${targetScenario} to stress-test shadow logging`,
      mode: "messy",
      targetScenario,
      fieldsGenerated: Object.keys(data).length,
      fieldsExpected: fields.length,
      persona: messyPersona.id,
      personaName: messyPersona.name,
      requiredFieldCount: schema.required.length,
      optionalFieldCount: schema.optional.length,
    }
  };
}

async function callAI(
  apiKey: string, 
  systemPrompt: string, 
  userPrompt: string,
  temperature: number = 0.7
): Promise<{ success: boolean; content: string }> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TestDataGen] AI error: ${response.status}`, errorText);
      return { success: false, content: "" };
    }

    const data = await response.json();
    return {
      success: true,
      content: data.choices?.[0]?.message?.content || ""
    };
  } catch (error) {
    console.error("[TestDataGen] AI call failed:", error);
    return { success: false, content: "" };
  }
}

function buildGenerationPrompt(
  scenarioType: string,
  industry: string,
  category: string,
  schema: ScenarioSchema,
  seed: number,
  selectedPersona: typeof BUYER_PERSONAS[number]
): { system: string; user: string } {
  const fields = getAllFields(schema);
  const diversityHints = [
    "Focus on a mid-size company with typical procurement challenges.",
    "Consider a large enterprise with complex supply chain requirements.",
    "Create a scenario for a growing startup with limited procurement resources.",
    "Develop a case for a regulated industry with strict compliance needs.",
    "Generate data for a company undergoing digital transformation."
  ];

  const system = `You are an expert procurement consultant generating realistic test data for procurement analysis software.

BUYER PERSONA:
You are generating test data from the perspective of this user persona: "${selectedPersona.name}"
${selectedPersona.description}

Adjust your output accordingly:
- Tone and verbosity of text fields should match this persona
- Optional field fill rate should be approximately ${selectedPersona.optionalFillRate}

FIELD REQUIREMENTS:
REQUIRED FIELDS (MUST always be filled):
${schema.required.map(f => `- ${f}`).join('\n')}

OPTIONAL FIELDS (fill according to persona behavior — leave some as empty strings):
${schema.optional.length > 0 ? schema.optional.map(f => `- ${f}`).join('\n') : '(none)'}

CRITICAL RULES:
1. All generated data MUST be consistent with the ${industry} industry
2. All generated data MUST be relevant to the ${category} procurement category
3. The "industryContext" field MUST be at least 100 words describing a realistic company
4. All numeric values must be plausible for the industry scale
5. DO NOT generate illogical combinations (e.g., pharmaceutical procurement for a software company)
6. ALWAYS fill all REQUIRED fields. For OPTIONAL fields, follow the persona fill rate — include unfilled optional fields as empty strings.

OUTPUT FORMAT:
Return ONLY a valid JSON object with the requested fields. No markdown, no explanation.`;

  const user = `Generate realistic test data for the "${scenarioType}" procurement scenario.

CONTEXT:
- Industry: ${industry}
- Procurement Category: ${category}
- Diversity seed: ${diversityHints[seed % diversityHints.length]}

ALL FIELDS (return as JSON object):
${fields.map(f => `- ${f}`).join('\n')}

IMPORTANT:
- "industryContext" must describe a specific, realistic company (100+ words) in the ${industry} sector
- All values must be internally consistent with that company
- Numbers should be realistic for the company size described
- Include specific details like certifications, employee counts, and strategic priorities

Return ONLY the JSON object.`;

  return { system, user };
}

function buildValidationPrompt(
  data: Record<string, string>,
  industry: string,
  category: string,
  scenarioType: string
): { system: string; user: string } {
  const system = `You are a procurement data reviewer. Score test data for basic plausibility.

SCORING CRITERIA (0-100) - BE GENEROUS:
- Industry Match (0-30): Does the data roughly fit the industry? Minor mismatches OK.
- Category Fit (0-30): Is the category reasonable for the business? Flexible interpretation.
- Basic Consistency (0-20): No obvious contradictions in the data.
- Usability (0-20): Is the data detailed enough for testing purposes?

SCORING GUIDANCE:
- 70-100: Acceptable for testing (pass)
- 50-69: Minor issues but usable
- Below 50: Major logical problems

ONLY MAJOR RED FLAGS (significant deductions):
- Completely wrong industry (e.g., pharmaceutical manufacturing for a software startup)
- Obvious numerical impossibilities (negative employees, 1000% margins)
- Self-contradicting statements

BE LENIENT: Test data doesn't need to be perfect. Accept creative scenarios.

OUTPUT FORMAT:
SCORE: [number 0-100]
REASONING: [1-2 sentences]
ISSUES: [comma-separated list, or "None"]`;

  const user = `Quick validation for "${scenarioType}" test data:

Industry: ${industry}
Category: ${category}

Data:
${JSON.stringify(data, null, 2)}

Score generously - we need diverse test cases.`;

  return { system, user };
}

function buildEnhancementPrompt(
  data: Record<string, string>,
  industry: string,
  category: string,
  scenarioType: string,
  validationFeedback: string
): { system: string; user: string } {
  const system = `You are a procurement expert enhancing test data quality.

Your task is to fix any inconsistencies and enhance the realism of the generated data.

RULES:
1. Keep the same company context but fix any logical issues
2. Adjust numbers to be internally consistent
3. Add specific details that increase realism
4. Ensure all data aligns with ${industry} industry standards

OUTPUT FORMAT:
Return ONLY a valid JSON object with the corrected fields. No markdown, no explanation.`;

  const user = `Enhance this test data for the "${scenarioType}" scenario:

Original Data:
${JSON.stringify(data, null, 2)}

Validation Feedback:
${validationFeedback}

Fix any issues and return the enhanced JSON object.`;

  return { system, user };
}

function parseGeneratedData(content: string, fields: string[]): Record<string, string> {
  try {
    // Try to extract JSON from the response
    let jsonStr = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    
    const parsed = JSON.parse(jsonStr.trim());
    
    // Convert all values to strings
    const result: Record<string, string> = {};
    for (const field of fields) {
      if (parsed[field] !== undefined) {
        result[field] = String(parsed[field]);
      }
    }
    
    return result;
  } catch (error) {
    console.warn("[TestDataGen] Failed to parse JSON:", error);
    return {};
  }
}

function parseValidationScore(content: string): { score: number; reasoning: string } {
  try {
    const scoreMatch = content.match(/SCORE:\s*(\d+)/i);
    const reasoningMatch = content.match(/REASONING:\s*(.+?)(?=ISSUES:|$)/is);
    
    return {
      score: scoreMatch ? parseInt(scoreMatch[1], 10) : 50,
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : "No reasoning provided"
    };
  } catch {
    return { score: 50, reasoning: "Failed to parse validation" };
  }
}
