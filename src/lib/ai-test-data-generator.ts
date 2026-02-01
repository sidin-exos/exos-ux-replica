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
  mctsIterations?: number;
}

/**
 * Industry-Category Compatibility Matrix
 * Used for client-side validation before AI generation
 */
export const INDUSTRY_CATEGORY_COMPATIBILITY: Record<string, string[]> = {
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

    return {
      success: true,
      data: data.data,
      metadata: data.metadata,
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
        return {
          data: result.data,
          source: "ai",
          metadata: result.metadata,
        };
      }
    } catch (err) {
      console.warn("[TestDataHybrid] AI generation failed, falling back to static");
    }
  }

  // Fall back to static generator
  const { generateTestData } = await import("@/lib/test-data-factory");
  return {
    data: generateTestData(scenarioType),
    source: "static",
  };
}
