import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
 */

// Parameter types for drafter
type CompanySize = "startup" | "smb" | "mid-market" | "enterprise" | "large-enterprise";
type Complexity = "simple" | "standard" | "complex" | "edge-case";
type FinancialPressure = "comfortable" | "moderate" | "tight" | "crisis";
type StrategicPriority = "cost" | "risk" | "speed" | "quality" | "innovation" | "sustainability";
type MarketConditions = "stable" | "growing" | "volatile" | "disrupted";
type DataQuality = "excellent" | "good" | "partial" | "poor";

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
  mode?: "draft" | "generate" | "full"; // New mode parameter
  scenarioType: string;
  industry?: string;
  category?: string;
  parameters?: DraftedParameters; // Pre-approved parameters for "generate" mode
  mctsIterations?: number;
  temperature?: number;
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
    const request: GenerateRequest = await req.json();
    const { 
      mode = "full",
      scenarioType, 
      industry,
      category,
      parameters,
      mctsIterations = 1, // Default to 1 for faster generation
      temperature = 0.7,
    } = request;

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

    console.log(`[TestDataGen] Mode: ${mode}, Scenario: ${scenarioType}`);

    // === DRAFT MODE: Propose random consistent parameters ===
    if (mode === "draft") {
      const draftResult = await handleDraftMode(LOVABLE_API_KEY, scenarioType, temperature);
      return new Response(
        JSON.stringify(draftResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === GENERATE MODE: Single-pass with pre-approved parameters ===
    if (mode === "generate" && parameters) {
      const generateResult = await handleGenerateMode(
        LOVABLE_API_KEY, 
        scenarioType, 
        parameters,
        temperature
      );
      return new Response(
        JSON.stringify(generateResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === FULL MODE: Legacy MCTS approach ===
    const fields = SCENARIO_SCHEMAS[scenarioType] || ["industryContext"];
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
        fields,
        iteration
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

// === DRAFT MODE HANDLER ===
async function handleDraftMode(
  apiKey: string, 
  scenarioType: string,
  temperature: number
): Promise<{ success: boolean; parameters?: DraftedParameters; error?: string }> {
  const industries = Object.keys(COMPATIBILITY_MATRIX);
  
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
  temperature: number
): Promise<{ success: boolean; data?: Record<string, string>; metadata?: object; error?: string }> {
  const fields = SCENARIO_SCHEMAS[scenarioType] || ["industryContext"];
  
  const companySizeDescriptions: Record<CompanySize, string> = {
    "startup": "10-50 employees, Series A/B stage, limited procurement maturity",
    "smb": "50-500 employees, established business, growing procurement needs",
    "mid-market": "500-2,000 employees, regional presence, structured procurement",
    "enterprise": "2,000-10,000 employees, multi-national, mature procurement",
    "large-enterprise": "10,000+ employees, global operations, complex procurement"
  };

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

CRITICAL RULES:
1. ALL data must be consistent with the above context
2. "industryContext" field MUST be 100+ words describing a specific company matching ALL parameters
3. All numeric values must be plausible for the company scale
4. If data quality is "partial" or "poor", leave some optional fields with realistic estimates or ranges

OUTPUT FORMAT:
Return ONLY a valid JSON object with the requested fields. No markdown, no explanation.`;

  const user = `Generate test data for "${scenarioType}" scenario.

REQUIRED FIELDS:
${fields.map(f => `- ${f}`).join('\n')}

Context: ${parameters.reasoning}

Return ONLY the JSON object.`;

  const response = await callAI(apiKey, system, user, temperature);
  
  if (!response.success) {
    return { success: false, error: "Failed to generate test data" };
  }

  const data = parseGeneratedData(response.content, fields);
  
  if (Object.keys(data).length === 0) {
    return { success: false, error: "Failed to parse generated data" };
  }

  return {
    success: true,
    data,
    metadata: {
      industry: parameters.industry,
      category: parameters.category,
      score: 75, // Single-pass score estimate
      iterations: 1,
      reasoning: parameters.reasoning,
      parameters: parameters
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
