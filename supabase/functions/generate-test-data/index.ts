import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * AI-Powered Test Data Generation with MCTS-Inspired Sampling
 * 
 * Uses Gemini 3 Flash to generate realistic, consistent procurement
 * test cases with multi-step reasoning:
 * 
 * 1. Industry-Category Validation: Ensures logical combinations
 * 2. MCTS Exploration: Samples diverse but plausible scenarios
 * 3. Consistency Checking: AI validates generated data coherence
 */

// Industry-Category compatibility matrix
// Prevents illogical combinations like "electronics" for "healthcare"
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

// Scenario-specific field schemas for AI generation
const SCENARIO_SCHEMAS: Record<string, string[]> = {
  "make-vs-buy": [
    "industryContext", "internalSalary", "recruitingCost", "managementTime",
    "officeItPerHead", "agencyFee", "agencyOnboardingSpeed", "knowledgeRetentionRisk",
    "qualityBenchmark", "peakLoadCapacity", "strategicImportance"
  ],
  "supplier-review": [
    "industryContext", "qualityScore", "onTimeDelivery", "incidentCount",
    "communicationScore", "innovationScore", "financialStability",
    "socialResponsibility", "priceVsMarket", "crisisSupport", "spendVolume"
  ],
  "software-licensing": [
    "industryContext", "softwareName", "softwareCategory", "totalUsers",
    "powerUsers", "regularUsers", "occasionalUsers", "externalUsers",
    "userGrowthRate", "perUserMonthly", "enterpriseTierCost", "contractLength"
  ],
  "tco-analysis": [
    "industryContext", "assetDescription", "ownershipPeriod", "purchasePrice",
    "installationCost", "trainingCost", "annualMaintenance", "energyConsumption",
    "vendorLockInRisk", "residualValue"
  ],
  "risk-assessment": [
    "industryContext", "assessmentSubject", "annualValue", "marketVolatility",
    "regulatoryExposure", "geopoliticalRisk", "businessCriticality",
    "supplierFinancialHealth", "recoveryTime"
  ],
  "disruption-management": [
    "industryContext", "deficitSku", "stockDays", "altSuppliers", "altProducts",
    "substitutePrice", "switchingTime", "lostRevenuePerDay", "forceMajeureClause"
  ],
  "negotiation-prep": [
    "industryContext", "supplierName", "annualSpend", "contractEndDate",
    "relationshipYears", "switchingCost", "alternativeCount", "spendTrend", "leverage"
  ],
};

interface GenerateRequest {
  scenarioType: string;
  industry?: string;
  category?: string;
  mctsIterations?: number; // Number of MCTS exploration iterations (default: 3)
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

  try {
    const { 
      scenarioType, 
      industry,
      category,
      mctsIterations = 3 
    }: GenerateRequest = await req.json();

    if (!scenarioType) {
      return new Response(
        JSON.stringify({ error: "Missing scenarioType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fields = SCENARIO_SCHEMAS[scenarioType] || ["industryContext"];
    const industries = Object.keys(COMPATIBILITY_MATRIX);
    
    // Select valid industry-category combination
    const selectedIndustry = industry && industries.includes(industry) 
      ? industry 
      : industries[Math.floor(Math.random() * industries.length)];
    
    const validCategories = COMPATIBILITY_MATRIX[selectedIndustry] || [];
    const selectedCategory = category && validCategories.includes(category)
      ? category
      : validCategories[Math.floor(Math.random() * validCategories.length)];

    console.log(`[TestDataGen] Industry: ${selectedIndustry}, Category: ${selectedCategory}`);
    console.log(`[TestDataGen] MCTS iterations: ${mctsIterations}`);

    // MCTS-Inspired Generation: Generate multiple candidates and score them
    const candidates: MCTSNode[] = [];
    
    for (let iteration = 0; iteration < mctsIterations; iteration++) {
      console.log(`[TestDataGen] MCTS iteration ${iteration + 1}/${mctsIterations}`);
      
      // Phase 1: Generate candidate test case
      const generationPrompt = buildGenerationPrompt(
        scenarioType, 
        selectedIndustry, 
        selectedCategory, 
        fields,
        iteration // Seed for diversity
      );
      
      const generationResponse = await callAI(LOVABLE_API_KEY, generationPrompt.system, generationPrompt.user);
      
      if (!generationResponse.success) {
        console.warn(`[TestDataGen] Generation failed on iteration ${iteration + 1}`);
        continue;
      }

      // Parse generated data
      const parsedData = parseGeneratedData(generationResponse.content, fields);
      
      // Phase 2: Validate and score the generated case
      const validationPrompt = buildValidationPrompt(
        parsedData, 
        selectedIndustry, 
        selectedCategory,
        scenarioType
      );
      
      const validationResponse = await callAI(LOVABLE_API_KEY, validationPrompt.system, validationPrompt.user);
      
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

    // Select best candidate (MCTS selection phase)
    candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = candidates[0];
    
    console.log(`[TestDataGen] Selected best candidate with score: ${bestCandidate.score}/100`);

    // Phase 3: Final consistency check and enhancement
    const enhancementPrompt = buildEnhancementPrompt(
      bestCandidate.data,
      selectedIndustry,
      selectedCategory,
      scenarioType,
      bestCandidate.reasoning
    );
    
    const enhancedResponse = await callAI(LOVABLE_API_KEY, enhancementPrompt.system, enhancementPrompt.user);
    const finalData = parseGeneratedData(enhancedResponse.content, fields);
    
    // Merge enhanced data with original (keep original if enhancement fails)
    const outputData = {
      ...bestCandidate.data,
      ...finalData
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: outputData,
        metadata: {
          industry: selectedIndustry,
          category: selectedCategory,
          score: bestCandidate.score,
          iterations: mctsIterations,
          reasoning: bestCandidate.reasoning
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[TestDataGen] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callAI(
  apiKey: string, 
  systemPrompt: string, 
  userPrompt: string
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
        temperature: 0.7, // Higher for diversity
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
  fields: string[],
  seed: number
): { system: string; user: string } {
  const diversityHints = [
    "Focus on a mid-size company with typical procurement challenges.",
    "Consider a large enterprise with complex supply chain requirements.",
    "Create a scenario for a growing startup with limited procurement resources.",
    "Develop a case for a regulated industry with strict compliance needs.",
    "Generate data for a company undergoing digital transformation."
  ];

  const system = `You are an expert procurement consultant generating realistic test data for procurement analysis software.

CRITICAL RULES:
1. All generated data MUST be consistent with the ${industry} industry
2. All generated data MUST be relevant to the ${category} procurement category
3. The "industryContext" field MUST be at least 100 words describing a realistic company
4. All numeric values must be plausible for the industry scale
5. DO NOT generate illogical combinations (e.g., pharmaceutical procurement for a software company)

OUTPUT FORMAT:
Return ONLY a valid JSON object with the requested fields. No markdown, no explanation.`;

  const user = `Generate realistic test data for the "${scenarioType}" procurement scenario.

CONTEXT:
- Industry: ${industry}
- Procurement Category: ${category}
- Diversity seed: ${diversityHints[seed % diversityHints.length]}

REQUIRED FIELDS (return as JSON object):
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
  const system = `You are a procurement data quality auditor. Your job is to score test data for plausibility and internal consistency.

SCORING CRITERIA (0-100):
- Industry Alignment (0-25): Does the data match the specified industry?
- Category Relevance (0-25): Is the data appropriate for the procurement category?
- Internal Consistency (0-25): Are all values logically consistent with each other?
- Realism (0-25): Would this scenario occur in the real world?

RED FLAGS (major deductions):
- Electronics components for healthcare (unless medical devices)
- Financial values that don't match company size
- Contradictory statements in the business context
- Generic/vague descriptions without specific details

OUTPUT FORMAT (MUST follow exactly):
SCORE: [number 0-100]
REASONING: [2-3 sentences explaining the score]
ISSUES: [comma-separated list of problems, or "None"]`;

  const user = `Validate this test data for the "${scenarioType}" scenario:

Industry: ${industry}
Category: ${category}

Generated Data:
${JSON.stringify(data, null, 2)}

Score the data and identify any inconsistencies.`;

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
