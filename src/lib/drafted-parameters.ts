/**
 * Drafted Parameters Types and Client Functions
 * 
 * Supports the two-phase drafter-validator workflow:
 * 1. Draft: AI proposes random but consistent parameters
 * 2. Generate: Single-pass generation with approved parameters
 */

import { supabase } from "@/integrations/supabase/client";

// Parameter value types
export type CompanySize = "startup" | "smb" | "mid-market" | "enterprise" | "large-enterprise";
export type Complexity = "simple" | "standard" | "complex" | "edge-case";
export type FinancialPressure = "comfortable" | "moderate" | "tight" | "crisis";
export type StrategicPriority = "cost" | "risk" | "speed" | "quality" | "innovation" | "sustainability";
export type MarketConditions = "stable" | "growing" | "volatile" | "disrupted";
export type DataQuality = "excellent" | "good" | "partial" | "poor";
export type TrickSubtlety = "obvious" | "moderate" | "subtle" | "expert-level";

/**
 * Training Trick Definition
 * A logical procurement trap embedded in test cases for AI training
 */
export interface TrickDefinition {
  category: string;           // e.g., "performance-masking"
  description: string;        // Human-readable explanation
  targetField: string;        // Primary field where trick is embedded
  expectedDetection: string;  // What the AI should flag
  subtlety: TrickSubtlety;
}

export interface DraftedParameters {
  industry: string;
  category: string;
  companySize: CompanySize;
  complexity: Complexity;
  financialPressure: FinancialPressure;
  strategicPriority: StrategicPriority;
  marketConditions: MarketConditions;
  dataQuality: DataQuality;
  reasoning: string;
  trick?: TrickDefinition;    // Optional training trick
}

export interface DraftResult {
  success: boolean;
  parameters?: DraftedParameters;
  error?: string;
}

export interface GenerateWithParamsResult {
  success: boolean;
  data?: Record<string, string>;
  metadata?: {
    industry: string;
    category: string;
    score: number;
    iterations: number;
    reasoning: string;
    parameters: DraftedParameters;
    mainFocusGenerated?: string; // The AI-generated main focus/challenge
  };
  error?: string;
}

// Human-readable labels for parameter values
export const PARAMETER_LABELS: Record<string, Record<string, string>> = {
  companySize: {
    "startup": "Startup (10-50 employees)",
    "smb": "SMB (50-500 employees)",
    "mid-market": "Mid-Market (500-2K employees)",
    "enterprise": "Enterprise (2K-10K employees)",
    "large-enterprise": "Large Enterprise (10K+ employees)",
  },
  complexity: {
    "simple": "Simple",
    "standard": "Standard",
    "complex": "Complex",
    "edge-case": "Edge Case",
  },
  financialPressure: {
    "comfortable": "Comfortable",
    "moderate": "Moderate",
    "tight": "Tight",
    "crisis": "Crisis",
  },
  strategicPriority: {
    "cost": "Cost Optimization",
    "risk": "Risk Mitigation",
    "speed": "Speed/Agility",
    "quality": "Quality Excellence",
    "innovation": "Innovation",
    "sustainability": "Sustainability/ESG",
  },
  marketConditions: {
    "stable": "Stable",
    "growing": "Growing",
    "volatile": "Volatile",
    "disrupted": "Disrupted",
  },
  dataQuality: {
    "excellent": "Excellent",
    "good": "Good",
    "partial": "Partial",
    "poor": "Poor",
  },
  trickSubtlety: {
    "obvious": "Obvious (Easy to spot)",
    "moderate": "Moderate (Requires attention)",
    "subtle": "Subtle (Careful reading needed)",
    "expert-level": "Expert-Level (Deep analysis required)",
  },
};

// Human-readable labels for trick categories
export const TRICK_CATEGORY_LABELS: Record<string, string> = {
  "performance-masking": "Performance Masking",
  "financial-warning-signs": "Financial Warning Signs",
  "dependency-trap": "Dependency Trap",
  "esg-greenwashing": "ESG Greenwashing",
  "lock-in-trap": "Lock-In Trap",
  "escalation-clause": "Escalation Clause",
  "user-tier-mismatch": "User Tier Mismatch",
  "exit-penalty": "Exit Penalty",
  "iceberg-costs": "Iceberg Costs",
  "obsolescence-trap": "Obsolescence Trap",
  "vendor-dependency": "Vendor Dependency",
  "decommissioning-surprise": "Decommissioning Surprise",
  "leverage-illusion": "Leverage Illusion",
  "relationship-complacency": "Relationship Complacency",
  "contract-auto-renewal": "Contract Auto-Renewal",
  "benchmark-gap": "Benchmark Gap",
  "hidden-concentration": "Hidden Concentration",
  "false-diversification": "False Diversification",
  "contract-gap": "Contract Gap",
  "near-miss-ignored": "Near Miss Ignored",
  "capability-overestimate": "Capability Overestimate",
  "hidden-management-cost": "Hidden Management Cost",
  "knowledge-loss-downplayed": "Knowledge Loss Downplayed",
  "scale-mismatch": "Scale Mismatch",
  "alternatives-mirage": "Alternatives Mirage",
  "lead-time-underestimate": "Lead Time Underestimate",
  "cost-of-inaction-hidden": "Cost of Inaction Hidden",
  "single-point-failure": "Single Point Failure",
  "scope-ambiguity": "Scope Ambiguity",
  "acceptance-loophole": "Acceptance Loophole",
  "responsibility-shift": "Responsibility Shift",
  "penalty-asymmetry": "Penalty Asymmetry",
};

/**
 * Draft random but consistent parameters for a test case
 */
export async function draftParameters(
  scenarioType: string,
  temperature: number = 0.7
): Promise<DraftResult> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-test-data", {
      body: {
        mode: "draft",
        scenarioType,
        temperature,
      },
    });

    if (error) {
      console.error("[DraftParams] Function error:", error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error || "Draft failed" };
    }

    return { success: true, parameters: data.parameters };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[DraftParams] Error:", message);
    return { success: false, error: message };
  }
}

/**
 * Generate test data with pre-approved parameters (single AI call)
 */
export async function generateWithParameters(
  scenarioType: string,
  parameters: DraftedParameters,
  temperature: number = 0.7
): Promise<GenerateWithParamsResult> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-test-data", {
      body: {
        mode: "generate",
        scenarioType,
        parameters,
        temperature,
      },
    });

    if (error) {
      console.error("[GenerateWithParams] Function error:", error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error || "Generation failed" };
    }

    return {
      success: true,
      data: data.data,
      metadata: data.metadata,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GenerateWithParams] Error:", message);
    return { success: false, error: message };
  }
}

/**
 * Format industry/category slugs for display
 */
export function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
