/**
 * Canonical Trick Library — Shared Module
 *
 * Curated set of logical procurement traps for AI training.
 * Each trick tests the AI's ability to detect subtle business issues.
 *
 * This is the SINGLE SOURCE OF TRUTH.
 * Client-side copy at src/lib/trick-library.ts is for UI reference only.
 */

export type TrickSubtlety = "obvious" | "moderate" | "subtle" | "expert-level";

export interface TrickDefinition {
  category: string;
  description: string;
  targetField: string;
  expectedDetection: string;
  subtlety: TrickSubtlety;
}

export interface TrickTemplate {
  category: string;
  templates: string[];
  targetFields: string[];
  subtlety: TrickSubtlety;
}

export type TrickLibrary = Record<string, TrickTemplate[]>;

export const TRICK_LIBRARY: TrickLibrary = {
  "supplier-review": [
    {
      category: "performance-masking",
      templates: [
        "High communication and innovation scores, but recent delivery reliability declining with explanations buried in context",
        "Excellent quality metrics from samples, but production batch consistency issues mentioned casually",
        "Strong overall ratings, but crisis response time has degraded over past quarters with blame on external factors"
      ],
      targetFields: ["industryContext", "incidentLog"],
      subtlety: "moderate"
    },
    {
      category: "financial-warning-signs",
      templates: [
        "Supplier appears stable but recently lost major customer representing significant portion of their revenue",
        "Good payment terms offered, but context mentions extended payment requests to their suppliers"
      ],
      targetFields: ["industryContext", "spendVolume"],
      subtlety: "subtle"
    },
    {
      category: "dependency-trap",
      templates: [
        "Only qualified supplier for critical component, mentioned positively as 'exclusive partnership'",
        "Proprietary technology integration that would require 18-month transition mentioned as 'seamless integration'"
      ],
      targetFields: ["industryContext", "spendVolume"],
      subtlety: "moderate"
    },
    {
      category: "esg-greenwashing",
      templates: [
        "Prominent sustainability certifications displayed, but audit scope limited to headquarters only",
        "Carbon neutral claims for operations, but supply chain emissions not included in scope"
      ],
      targetFields: ["industryContext", "incidentLog"],
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
      targetFields: ["industryContext", "commercialTerms"],
      subtlety: "moderate"
    },
    {
      category: "escalation-clause",
      templates: [
        "Competitive Year 1 pricing with standard 'cost of living adjustments' - actually 8-12% annual increases",
        "Base price locked, but 'usage fees' have uncapped growth tied to company metrics"
      ],
      targetFields: ["industryContext", "commercialTerms"],
      subtlety: "subtle"
    },
    {
      category: "user-tier-mismatch",
      templates: [
        "Enterprise tier purchased for full workforce, but only 20% are power users needing those features",
        "All-in licensing when actual usage pattern is 60% light users who could use cheaper tier"
      ],
      targetFields: ["userMetrics", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "exit-penalty",
      templates: [
        "Early termination requires payment of remaining term plus 6-month penalty",
        "Data extraction services priced at $500/hour for assisted migration mentioned in fine print"
      ],
      targetFields: ["industryContext", "commercialTerms"],
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
      targetFields: ["capexBreakdown", "opexBreakdown", "industryContext"],
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
      targetFields: ["industryContext", "riskFactors"],
      subtlety: "moderate"
    },
    {
      category: "decommissioning-surprise",
      templates: [
        "Hazardous materials requiring specialized disposal not mentioned in ownership cost",
        "Asset contains regulated substances requiring certified decommissioning"
      ],
      targetFields: ["riskFactors", "industryContext"],
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
      targetFields: ["leverageContext", "industryContext"],
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
      targetFields: ["timeline", "industryContext"],
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
      targetFields: ["industryContext", "currentSituation"],
      subtlety: "expert-level"
    },
    {
      category: "false-diversification",
      templates: [
        "Three approved suppliers all located within same 50km radius disaster zone",
        "Alternative sources identified but all dependent on same regional infrastructure"
      ],
      targetFields: ["industryContext", "riskTolerance"],
      subtlety: "subtle"
    },
    {
      category: "contract-gap",
      templates: [
        "Business continuity requirements mentioned but no contractual SLAs for recovery time",
        "Force majeure clause excludes the most likely disruption scenarios for this category"
      ],
      targetFields: ["industryContext", "riskTolerance"],
      subtlety: "moderate"
    },
    {
      category: "near-miss-ignored",
      templates: [
        "Previous quality incident resolved without root cause analysis mentioned casually",
        "Past delivery disruption attributed to one-time event that could easily recur"
      ],
      targetFields: ["industryContext", "currentSituation"],
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
      targetFields: ["industryContext", "strategicFactors"],
      subtlety: "moderate"
    },
    {
      category: "hidden-management-cost",
      templates: [
        "Direct labor costs compared but management overhead for internal option not included",
        "Quality control requirements would need additional headcount not reflected in analysis"
      ],
      targetFields: ["makeCosts", "industryContext"],
      subtlety: "subtle"
    },
    {
      category: "knowledge-loss-downplayed",
      templates: [
        "External provider gains proprietary process knowledge that becomes competitive advantage",
        "IP developed jointly but ownership defaults to vendor per standard contract terms"
      ],
      targetFields: ["strategicFactors", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "scale-mismatch",
      templates: [
        "Build option based on current volume but demand volatility requires 3x peak capacity",
        "Agency model attractive at current scale but economics invert at projected growth"
      ],
      targetFields: ["projectBrief", "industryContext"],
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
      targetFields: ["alternativesContext", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "lead-time-underestimate",
      templates: [
        "Switching time quoted for normal conditions but crisis creates industry-wide demand surge",
        "Recovery timeline assumes immediate capacity availability that doesn't exist"
      ],
      targetFields: ["crisisDescription", "industryContext"],
      subtlety: "subtle"
    },
    {
      category: "cost-of-inaction-hidden",
      templates: [
        "Revenue impact calculated for single product line but downstream dependencies not included",
        "Daily loss estimate excludes customer penalty clauses triggered at day 7"
      ],
      targetFields: ["impactAssessment", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "single-point-failure",
      templates: [
        "All alternatives route through same port or logistics hub as primary",
        "Backup power/IT infrastructure shares same grid or data center dependency"
      ],
      targetFields: ["industryContext", "alternativesContext"],
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

/**
 * Select a random trick for a given scenario type.
 * Returns both the resolved TrickDefinition and the source template.
 */
export function selectRandomTrick(
  scenarioType: string
): { trick: TrickDefinition; template: TrickTemplate } | null {
  const tricks = TRICK_LIBRARY[scenarioType];
  if (!tricks || tricks.length === 0) return null;

  const template = tricks[Math.floor(Math.random() * tricks.length)];
  const description =
    template.templates[Math.floor(Math.random() * template.templates.length)];
  const targetField =
    template.targetFields[Math.floor(Math.random() * template.targetFields.length)];

  return {
    template,
    trick: {
      category: template.category,
      description,
      targetField,
      expectedDetection: `AI should identify and flag the ${template.category.replace(/-/g, " ")} issue despite neutral/positive framing`,
      subtlety: template.subtlety,
    },
  };
}
