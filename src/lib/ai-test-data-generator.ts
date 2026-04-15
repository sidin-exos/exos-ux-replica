/**
 * AI-Powered Test Data Generator Client
 * 
 * Calls the edge function to generate test data using Gemini 3 Flash
 * with MCTS-inspired sampling and consistency validation.
 */

import { supabase } from "@/integrations/supabase/client";

export interface AIGeneratedTestData {
  success: boolean;
  data: Record<string, string>;
  metadata: {
    industry: string;
    category: string;
    score: number;
    iterations: number;
    reasoning: string;
  };
  error?: string;
}

interface GenerateOptions {
  scenarioType: string;
  industry?: string;
  category?: string;
  persona?: string;
  mctsIterations?: number;
}

// CANONICAL SOURCE: supabase/functions/_shared/industry-matrix.ts
// Keep this local copy in sync when categories are added.
// TODO Phase 1: fetch this from the edge function instead.
/**
 * Industry-Category Compatibility Matrix
 * Used for client-side validation before AI generation
 * Keys = real DB slugs from industry_contexts / procurement_categories
 */
export const INDUSTRY_CATEGORY_COMPATIBILITY: Record<string, string[]> = {
  "industrial-manufacturing": [
    "raw-materials-steel-metals", "chemicals-specialty", "plastics-resins",
    "electronic-components", "castings-forgings-machined-parts",
    "mro-maintenance-repair-operations", "packaging-primary",
    "logistics-road-freight", "capital-equipment-industrial-machinery",
    "tooling-dies-moulds", "contract-manufacturing", "utilities-energy",
    "fasteners-springs-fixings", "rubber-elastomers", "adhesives-sealants-coatings",
    "cables-wire-harnesses"
  ],
  "software-it": [
    "cloud-infrastructure-iaas-paas", "it-software-saas", "managed-it-services-msp",
    "cybersecurity-solutions", "professional-services", "it-hardware",
    "telecoms-connectivity-services", "training-education"
  ],
  "healthcare": [
    "medical-devices-clinical-consumables", "pharmaceutical-ingredients-apis",
    "clinical-research-organisation-cro-services", "lab-supplies",
    "scientific-laboratory-equipment-capital", "facilities-management",
    "medical-software-health-it-systems", "professional-services"
  ],
  "retail": [
    "textile-fabrics", "food-ingredients", "packaging-primary",
    "secondary-packaging-labels-print", "logistics-road-freight",
    "last-mile-e-commerce-fulfilment", "marketing-services",
    "facilities-management", "it-software-saas"
  ],
  "professional-services": [
    "professional-services", "corporate-travel", "facilities-management",
    "office-supplies", "managed-it-services-msp", "legal-services",
    "management-consulting-advisory", "training-education",
    "printing-creative-production"
  ],
  "banking-finance": [
    "cloud-infrastructure-iaas-paas", "it-hardware", "professional-services",
    "audit-tax-accounting-services", "facilities-management",
    "cybersecurity-solutions", "management-consulting-advisory",
    "market-research-data-intelligence", "insurance-corporate"
  ],
  "energy-utilities": [
    "capital-equipment-industrial-machinery", "raw-materials-steel-metals",
    "mro-maintenance-repair-operations", "precision-machining-subcontract-engineering",
    "logistics-road-freight", "personal-protective-equipment-ppe",
    "waste-management-recycling", "calibration-testing-inspection-services"
  ],
  "construction-infrastructure": [
    "construction-materials", "raw-materials-steel-metals",
    "capital-equipment-industrial-machinery", "personal-protective-equipment-ppe",
    "logistics-road-freight", "precision-machining-subcontract-engineering",
    "tooling-dies-moulds", "contract-manufacturing"
  ],
  "automotive-oem": [
    "castings-forgings-machined-parts", "electronic-components", "semiconductors",
    "plastics-resins", "rubber-elastomers", "printed-circuit-boards-pcbs",
    "tooling-dies-moulds", "logistics-road-freight", "surface-treatment-plating-coating"
  ],
  "pharma-life-sciences": [
    "pharmaceutical-ingredients-apis", "lab-supplies",
    "scientific-laboratory-equipment-capital",
    "clinical-research-organisation-cro-services",
    "packaging-primary", "cold-chain-logistics",
    "calibration-testing-inspection-services", "medical-software-health-it-systems"
  ],
  "food-beverage": [
    "food-ingredients", "packaging-primary", "secondary-packaging-labels-print",
    "cold-chain-logistics", "logistics-road-freight", "utilities-energy",
    "catering-workplace-food-services", "waste-management-recycling"
  ],
  "electronics": [
    "electronic-components", "semiconductors", "printed-circuit-boards-pcbs",
    "cables-wire-harnesses", "plastics-resins", "contract-manufacturing",
    "tooling-dies-moulds", "packaging-primary"
  ],
  "telecom": [
    "telecom-equipment", "telecoms-connectivity-services",
    "cloud-infrastructure-iaas-paas", "cybersecurity-solutions",
    "it-hardware", "managed-it-services-msp", "cables-wire-harnesses"
  ],
  "aerospace-defense": [
    "castings-forgings-machined-parts", "electronic-components",
    "precision-machining-subcontract-engineering", "adhesives-sealants-coatings",
    "calibration-testing-inspection-services", "capital-equipment-industrial-machinery",
    "surface-treatment-plating-coating"
  ],
  "fmcg-cpg": [
    "packaging-primary", "secondary-packaging-labels-print", "food-ingredients",
    "cosmetics-personal-care-ingredients", "marketing-services",
    "logistics-road-freight", "last-mile-e-commerce-fulfilment"
  ],
};

/**
 * Validate industry-category combination
 */
export function validateIndustryCategoryPair(
  industry: string,
  category: string
): { valid: boolean; suggestion?: string } {
  const compatibleCategories = INDUSTRY_CATEGORY_COMPATIBILITY[industry];
  
  if (!compatibleCategories) {
    return { valid: true }; // Unknown industry, allow any category
  }
  
  if (compatibleCategories.includes(category)) {
    return { valid: true };
  }
  
  // Find a suggested compatible category
  const suggestion = compatibleCategories[0];
  return { 
    valid: false, 
    suggestion: `"${category}" is not typical for ${industry}. Consider: ${suggestion}` 
  };
}

/**
 * Get compatible categories for an industry
 */
export function getCompatibleCategories(industry: string): string[] {
  return INDUSTRY_CATEGORY_COMPATIBILITY[industry] || [];
}

/**
 * Get all industries
 */
export function getIndustries(): string[] {
  return Object.keys(INDUSTRY_CATEGORY_COMPATIBILITY);
}

/**
 * Generate test data using AI with MCTS sampling
 */
export async function generateAITestData(
  options: GenerateOptions
): Promise<AIGeneratedTestData> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-test-data", {
      body: {
        scenarioType: options.scenarioType,
        industry: options.industry,
        category: options.category,
        persona: options.persona,
        mctsIterations: options.mctsIterations || 3,
      },
    });

    if (error) {
      console.error("[AITestDataGen] Function error:", error);
      return {
        success: false,
        data: {},
        metadata: {
          industry: options.industry || "unknown",
          category: options.category || "unknown",
          score: 0,
          iterations: 0,
          reasoning: error.message || "Function call failed",
        },
        error: error.message,
      };
    }

    if (!data.success) {
      return {
        success: false,
        data: {},
        metadata: {
          industry: options.industry || "unknown",
          category: options.category || "unknown",
          score: 0,
          iterations: 0,
          reasoning: data.error || "Generation failed",
        },
        error: data.error,
      };
    }

    // Support new fieldValues shape with backward compat
    const fieldValues = data.fieldValues || data.data || {};

    return {
      success: true,
      data: fieldValues,
      metadata: {
        industry: options.industry || data.metadata?.industry || "unknown",
        category: options.category || data.metadata?.category || "unknown",
        score: data.metadata?.score || 75,
        iterations: data.metadata?.iterations || 1,
        reasoning: data.metadata?.reasoning || "",
        ...data.metadata,
        testNotes: data.testNotes,
        expectedEvaluatorScore: data.expectedEvaluatorScore,
        methodologyEnriched: data.methodologyEnriched,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[AITestDataGen] Error:", errorMessage);
    return {
      success: false,
      data: {},
      metadata: {
        industry: options.industry || "unknown",
        category: options.category || "unknown",
        score: 0,
        iterations: 0,
        reasoning: errorMessage,
      },
      error: errorMessage,
    };
  }
}

/**
 * Hybrid generator: Use AI when available, fall back to static data
 */
export async function generateTestDataHybrid(
  scenarioType: string,
  options?: {
    preferAI?: boolean;
    industry?: string;
    category?: string;
    mctsIterations?: number;
  }
): Promise<{
  data: Record<string, string>;
  source: "ai" | "static";
  metadata?: AIGeneratedTestData["metadata"];
}> {
  const { preferAI = true, industry, category, mctsIterations } = options || {};

  if (preferAI) {
    try {
      const result = await generateAITestData({
        scenarioType,
        industry,
        category,
        mctsIterations,
      });

      if (result.success && Object.keys(result.data).length > 0) {
        if (import.meta.env.DEV) {
          const meta = result.metadata as any;
          console.log(
            `[TestEngine] Generated ${meta.qualityTier || "unknown"} data for ${scenarioType}. Methodology enriched: ${meta.methodologyEnriched}. Expected evaluator score: ${meta.expectedEvaluatorScore}`
          );
          if (meta.methodologyEnriched === false) {
            console.warn(
              `[TestEngine] Category "${category}" or industry "${industry}" not found in DB. Generation used fallback context only.`
            );
          }
        }
        return {
          data: result.data,
          source: "ai",
          metadata: result.metadata,
        };
      }
    } catch (err) {
      // AI generation failed — fall through to static generator
    }
  }

  // Fall back to static generator
  const { generateTestData } = await import("@/lib/test-data-factory");
  return {
    data: generateTestData(scenarioType),
    source: "static",
  };
}
