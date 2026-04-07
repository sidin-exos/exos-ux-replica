// CANONICAL SOURCE: supabase/functions/_shared/trick-library.ts
// This client copy is kept for UI reference only and must not be
// edited directly. Sync manually when the shared module changes.

/**
 * Training Trick Library
 * 
 * Curated set of logical procurement traps for AI training.
 * Each trick is designed to test the AI's ability to detect
 * subtle but impactful business issues.
 */

export interface TrickTemplate {
  category: string;
  templates: string[];
  targetFields: string[];
  subtlety: "obvious" | "moderate" | "subtle" | "expert-level";
}

/**
 * Scenario-specific trick library
 * Maps scenario types to applicable trick categories
 */
export const TRICK_LIBRARY: Record<string, TrickTemplate[]> = {
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
        "Good payment terms offered, but context mentions extended payment requests to their suppliers",
        "Strong credit rating from last year, but recent restructuring and management changes mentioned in passing"
      ],
      targetFields: ["industryContext", "spendVolume"],
      subtlety: "subtle"
    },
    {
      category: "dependency-trap",
      templates: [
        "Only qualified supplier for critical component, mentioned positively as 'exclusive partnership'",
        "Proprietary technology integration that would require 18-month transition mentioned as 'seamless integration'",
        "Supplier holds key patents for required specifications, framed as 'technical excellence'"
      ],
      targetFields: ["industryContext", "spendVolume"],
      subtlety: "moderate"
    },
    {
      category: "esg-greenwashing",
      templates: [
        "Prominent sustainability certifications displayed, but audit scope limited to headquarters only",
        "Carbon neutral claims for operations, but supply chain emissions not included in scope",
        "Strong diversity metrics at corporate level, but manufacturing sites not included in reporting"
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
        "Low per-user cost, but API access requires separate enterprise license at significant premium",
        "Attractive pricing includes deep integration features that create switching dependencies"
      ],
      targetFields: ["industryContext", "commercialTerms"],
      subtlety: "moderate"
    },
    {
      category: "escalation-clause",
      templates: [
        "Competitive Year 1 pricing with standard 'cost of living adjustments' - actually 8-12% annual increases",
        "Base price locked, but 'usage fees' have uncapped growth tied to company metrics",
        "Initial term pricing favorable, but renewal rates subject to 'then-current list pricing'"
      ],
      targetFields: ["industryContext", "commercialTerms"],
      subtlety: "subtle"
    },
    {
      category: "user-tier-mismatch",
      templates: [
        "Enterprise tier purchased for full workforce, but only 20% are power users needing those features",
        "All-in licensing when actual usage pattern is 60% light users who could use cheaper tier",
        "Premium collaboration features included but organization uses external tools for those functions"
      ],
      targetFields: ["userMetrics", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "exit-penalty",
      templates: [
        "Early termination requires payment of remaining term plus 6-month penalty",
        "Data extraction services priced at $500/hour for assisted migration mentioned in fine print",
        "90-day termination notice required, but billing continues for 180 days post-notice"
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
        "Low base cost but consumables only available from vendor at 3x market rates",
        "Attractive acquisition cost but training certification required annually at significant cost per operator"
      ],
      targetFields: ["capexBreakdown", "opexBreakdown", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "obsolescence-trap",
      templates: [
        "Current generation equipment offered at discount, with new version launching in 6 months",
        "Technology approaching end-of-support but positioned as 'proven and stable'",
        "Legacy system with robust feature set but integration APIs being deprecated"
      ],
      targetFields: ["industryContext", "assetDescription"],
      subtlety: "subtle"
    },
    {
      category: "vendor-dependency",
      templates: [
        "Proprietary spare parts with single-source availability and extended lead times",
        "Specialized technician certification required that only vendor provides",
        "Custom firmware that requires vendor involvement for any modifications"
      ],
      targetFields: ["industryContext", "riskFactors"],
      subtlety: "moderate"
    },
    {
      category: "decommissioning-surprise",
      templates: [
        "Hazardous materials requiring specialized disposal not mentioned in ownership cost",
        "Asset contains regulated substances requiring certified decommissioning",
        "Removal and site restoration requirements buried in installation documentation"
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
        "Multiple options available but incumbent has exclusive access to required certifications",
        "Competitive market exists but switching requires customer re-approval that takes 18 months"
      ],
      targetFields: ["leverageContext", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "relationship-complacency",
      templates: [
        "15-year partnership celebrated as 'strategic' while pricing drifted 25% above market",
        "Strong relationship scores mask gradual erosion of service levels over past 3 years",
        "Preferred supplier status maintained despite declining competitiveness on key metrics"
      ],
      targetFields: ["relationshipHistory", "industryContext"],
      subtlety: "subtle"
    },
    {
      category: "contract-auto-renewal",
      templates: [
        "Auto-renewal clause with 90-day notice window, current contract expires in 45 days",
        "Evergreen contract with renewal pricing 20% above initial term",
        "Multi-year deal approaching renewal with incumbent already assuming continuation"
      ],
      targetFields: ["timeline", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "benchmark-gap",
      templates: [
        "Current pricing 30% above market but internal comparison limited to historical rates",
        "Supplier-provided 'competitive analysis' used as benchmark reference",
        "Cost increases accepted as 'market conditions' without independent verification"
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
        "Multiple manufacturing sites listed but all in same regulatory jurisdiction",
        "Dual-sourcing in place but both suppliers use same logistics provider"
      ],
      targetFields: ["industryContext", "currentSituation"],
      subtlety: "expert-level"
    },
    {
      category: "false-diversification",
      templates: [
        "Three approved suppliers all located within same 50km radius disaster zone",
        "Alternative sources identified but all dependent on same regional infrastructure",
        "Backup suppliers confirmed but all share same key sub-component manufacturer"
      ],
      targetFields: ["industryContext", "riskTolerance"],
      subtlety: "subtle"
    },
    {
      category: "contract-gap",
      templates: [
        "Business continuity requirements mentioned but no contractual SLAs for recovery time",
        "Force majeure clause excludes the most likely disruption scenarios for this category",
        "Insurance requirements specified but coverage amounts inadequate for identified risks"
      ],
      targetFields: ["industryContext", "riskTolerance"],
      subtlety: "moderate"
    },
    {
      category: "near-miss-ignored",
      templates: [
        "Previous quality incident resolved without root cause analysis mentioned casually",
        "Past delivery disruption attributed to one-time event that could easily recur",
        "Regulatory near-miss from 2 years ago downplayed as 'successfully addressed'"
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
        "Technical skills exist but not at scale required for production workload",
        "Previous similar project completed but key team members have since departed"
      ],
      targetFields: ["industryContext", "strategicFactors"],
      subtlety: "moderate"
    },
    {
      category: "hidden-management-cost",
      templates: [
        "Direct labor costs compared but management overhead for internal option not included",
        "Quality control requirements would need additional headcount not reflected in analysis",
        "Compliance monitoring burden for in-house option significantly underestimated"
      ],
      targetFields: ["makeCosts", "industryContext"],
      subtlety: "subtle"
    },
    {
      category: "knowledge-loss-downplayed",
      templates: [
        "External provider gains proprietary process knowledge that becomes competitive advantage",
        "IP developed jointly but ownership defaults to vendor per standard contract terms",
        "Specialized expertise transfers out but re-acquisition cost not considered"
      ],
      targetFields: ["strategicFactors", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "scale-mismatch",
      templates: [
        "Build option based on current volume but demand volatility requires 3x peak capacity",
        "Agency model attractive at current scale but economics invert at projected growth",
        "Fixed costs of internal option require 5-year payback but technology cycle is 3 years"
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
        "Backup sources identified but lead time for qualification exceeds crisis timeline",
        "Alternative products exist but customer approval required, taking 6+ months"
      ],
      targetFields: ["alternativesContext", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "lead-time-underestimate",
      templates: [
        "Switching time quoted for normal conditions but crisis creates industry-wide demand surge",
        "Recovery timeline assumes immediate capacity availability that doesn't exist",
        "Ramp-up estimates based on supplier optimism rather than historical performance"
      ],
      targetFields: ["crisisDescription", "industryContext"],
      subtlety: "subtle"
    },
    {
      category: "cost-of-inaction-hidden",
      templates: [
        "Revenue impact calculated for single product line but downstream dependencies not included",
        "Daily loss estimate excludes customer penalty clauses triggered at day 7",
        "Direct costs captured but reputational damage and customer defection not quantified"
      ],
      targetFields: ["impactAssessment", "industryContext"],
      subtlety: "moderate"
    },
    {
      category: "single-point-failure",
      templates: [
        "All alternatives route through same port or logistics hub as primary",
        "Backup power/IT infrastructure shares same grid or data center dependency",
        "Alternative suppliers all source key input from same geographic region"
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
        "Performance standards reference 'best efforts' rather than measurable outcomes",
        "Acceptance criteria defined as 'mutually agreeable' without objective measures"
      ],
      targetFields: ["industryContext"],
      subtlety: "moderate"
    },
    {
      category: "acceptance-loophole",
      templates: [
        "Acceptance deemed granted if client doesn't respond within 5 business days",
        "Partial delivery triggers proportional payment even if unusable without remaining scope",
        "Client testing period limited to 48 hours for complex deliverables"
      ],
      targetFields: ["industryContext"],
      subtlety: "subtle"
    },
    {
      category: "responsibility-shift",
      templates: [
        "Supplier performance contingent on 'timely client inputs' with undefined timeline",
        "Risk of third-party delays explicitly transferred to client",
        "Quality issues caused by 'client-provided specifications' excluded from warranty"
      ],
      targetFields: ["industryContext"],
      subtlety: "subtle"
    },
    {
      category: "penalty-asymmetry",
      templates: [
        "Client late payments incur 2%/month penalty but supplier delays have no consequences",
        "Force majeure protects supplier from delays but not client from supplier non-performance",
        "Liability caps protect supplier but indemnification requirements unlimited for client"
      ],
      targetFields: ["industryContext"],
      subtlety: "moderate"
    }
  ]
};

/**
 * Get random trick for a scenario type
 */
export function getRandomTrick(scenarioType: string): TrickTemplate | null {
  const tricks = TRICK_LIBRARY[scenarioType];
  if (!tricks || tricks.length === 0) return null;
  
  return tricks[Math.floor(Math.random() * tricks.length)];
}

/**
 * Get random template from a trick category
 */
export function getRandomTemplate(trick: TrickTemplate): string {
  return trick.templates[Math.floor(Math.random() * trick.templates.length)];
}

/**
 * Get random target field from a trick
 */
export function getRandomTargetField(trick: TrickTemplate): string {
  return trick.targetFields[Math.floor(Math.random() * trick.targetFields.length)];
}
