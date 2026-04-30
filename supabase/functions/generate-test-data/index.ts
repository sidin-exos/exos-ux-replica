import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, requireAdmin } from "../_shared/auth.ts";
import { parseBody, requireString, requireStringEnum, optionalRecord, validationErrorResponse, ValidationError } from "../_shared/validate.ts";
import { callGoogleAI } from "../_shared/google-ai.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { LangSmithTracer, classifyError } from "../_shared/langsmith.ts";
import { estimateCost } from "../_shared/ai-pricing.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  QUALITY_TIER_INSTRUCTIONS,
  mapDataQualityToTier,
  getFieldGroups,
  buildBlockInstructions,
  type QualityTier,
  type ScenarioFieldConfigRow,
} from "./block-guidance.ts";

// Shared modules — canonical sources
import { TRICK_LIBRARY, selectRandomTrick, type TrickDefinition, type TrickTemplate } from "../_shared/trick-library.ts";
import { INDUSTRY_CATEGORY_MATRIX, CATEGORY_KPIS } from "../_shared/industry-matrix.ts";

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
  persona?: string;
  personaName?: string;
}

// Field groups type (returned by getFieldGroups from block-guidance.ts)
interface ScenarioFieldGroups {
  required: string[];
  optional: string[];
  all: string[];
}

// DB query columns for scenario_field_config
const FIELD_CONFIG_COLUMNS = "block_id, block_label, is_required, expected_data_type, sub_prompts, deviation_type, block_guidance, optimal_guidance, minimum_guidance, degraded_guidance, sort_order" as const;

/** Fetch scenario field configs from DB */
async function fetchFieldConfigs(
  supabase: ReturnType<typeof createClient>,
  scenarioSlug: string
): Promise<ScenarioFieldConfigRow[]> {
  const { data, error } = await supabase
    .from("scenario_field_config")
    .select(FIELD_CONFIG_COLUMNS)
    .eq("scenario_slug", scenarioSlug)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(`[TestDataGen] Failed to fetch field config for ${scenarioSlug}:`, error);
    return [];
  }
  return (data || []) as ScenarioFieldConfigRow[];
}

/** Fetch industry context from DB if available */
async function fetchIndustryContext(
  supabase: ReturnType<typeof createClient>,
  industrySlug: string
): Promise<{ kpis: string[]; constraints: string[] } | null> {
  const { data, error } = await supabase
    .from("industry_contexts")
    .select("kpis, constraints, kpis_v2, constraints_v2")
    .eq("slug", industrySlug)
    .maybeSingle();

  if (error || !data) return null;
  return {
    kpis: data.kpis || [],
    constraints: data.constraints || [],
  };
}

/** Fetch procurement category context from DB if available */
async function fetchCategoryContext(
  supabase: ReturnType<typeof createClient>,
  categorySlug: string
): Promise<{
  characteristics: string;
  kpis: string[];
  kpis_v2: unknown[] | null;
  key_cost_drivers: string[];
  negotiation_dynamics: string | null;
  kraljic_position: string | null;
  market_structure: string | null;
  supply_concentration: string | null;
} | null> {
  const { data, error } = await supabase
    .from("procurement_categories")
    .select("characteristics, kpis, kpis_v2, key_cost_drivers, negotiation_dynamics, kraljic_position, market_structure, supply_concentration")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (error || !data) return null;
  return {
    characteristics: data.characteristics || "",
    kpis: data.kpis || [],
    kpis_v2: Array.isArray(data.kpis_v2) ? data.kpis_v2 : null,
    key_cost_drivers: Array.isArray(data.key_cost_drivers)
      ? (data.key_cost_drivers as string[])
      : [],
    negotiation_dynamics: data.negotiation_dynamics,
    kraljic_position: data.kraljic_position,
    market_structure: data.market_structure || null,
    supply_concentration: data.supply_concentration || null,
  };
}

/** Build DB-enriched context block for system prompts */
function buildDBContextBlock(
  industryCtx: { kpis: string[]; constraints: string[] } | null,
  categoryCtx: {
    characteristics: string;
    kpis: string[];
    kpis_v2: unknown[] | null;
    key_cost_drivers: string[];
    negotiation_dynamics: string | null;
    kraljic_position: string | null;
    market_structure: string | null;
    supply_concentration: string | null;
  } | null,
  category: string
): string {
  const parts: string[] = [];

  if (industryCtx) {
    parts.push(`INDUSTRY CONTEXT (from database):
- KPIs: ${industryCtx.kpis.join(", ")}
- Constraints: ${industryCtx.constraints.join(", ")}`);
  }

  if (categoryCtx) {
    parts.push(`CATEGORY INTELLIGENCE (from database):
- Characteristics: ${categoryCtx.characteristics}
- Category KPIs: ${categoryCtx.kpis.join(", ")}
- Key Cost Drivers: ${categoryCtx.key_cost_drivers.join(", ")}${
      categoryCtx.negotiation_dynamics
        ? `\n- Negotiation Dynamics: ${categoryCtx.negotiation_dynamics}`
        : ""
    }${
      categoryCtx.kraljic_position
        ? `\n- Kraljic Position: ${categoryCtx.kraljic_position}`
        : ""
    }${
      categoryCtx.market_structure
        ? `\n- Market Structure: ${categoryCtx.market_structure}`
        : ""
    }${
      categoryCtx.supply_concentration
        ? `\n- Supply Concentration: ${categoryCtx.supply_concentration}`
        : ""
    }`);
  } else {
    // Fall back to hardcoded KPIs
    const fallbackKpis = CATEGORY_KPIS[category];
    if (fallbackKpis) {
      parts.push(`CATEGORY KPIs (fallback):
- ${fallbackKpis.join("\n- ")}`);
    }
  }

  return parts.length > 0 ? "\n\n" + parts.join("\n\n") : "";
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
  },
  {
    id: "lost-user",
    name: "The Lost User (Out-of-Scope)",
    description: "A user who completely misunderstands what this procurement system is for. They ask completely irrelevant questions like 'What is the weather in London?', 'Write a python script for a calculator', or 'How to bake a chocolate cake'. They dump this random question into the main text field and ignore all other fields.",
    optionalFillRate: "0%"
  }
];

function selectPersona(requestedPersona?: string) {
  if (requestedPersona) {
    const found = BUYER_PERSONAS.find(p => p.id === requestedPersona);
    if (found) return found;
  }
  return BUYER_PERSONAS[Math.floor(Math.random() * BUYER_PERSONAS.length)];
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

  // Rate limit: 10 requests/hour per admin user
  // 30 req/hour per admin user — matches sentinel-analysis. Draft + generate
  // count as separate calls so the legacy 10/hour was too tight for active testing.
  const rateCheck = await checkRateLimit(authResult.user.userId, "generate-test-data", 30, 60, { failClosed: true });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck, corsHeaders);
  }

  // Create supabase client for DB reads
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

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

    console.log(`[TestDataGen] Mode: ${mode}, Scenario: ${scenarioType}`);

    // Fetch field configs from DB for this scenario
    const fieldConfigs = await fetchFieldConfigs(supabase, scenarioType);

    // === DRAFT MODE: Propose random consistent parameters ===
    if (mode === "draft") {
      const draftResult = await handleDraftMode(scenarioType, temperature);
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
        scenarioType,
        parameters,
        temperature,
        selectedPersona,
        fieldConfigs,
        supabase
      );
      return new Response(
        JSON.stringify(generateResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === MESSY MODE: Generate chaotic, high-friction inputs ===
    if (mode === "messy") {
      const messyResult = await handleMessyMode(
        scenarioType,
        temperature > 0 ? Math.max(temperature, 0.9) : 0.9,
        selectedPersona,
        supabase
      );
      return new Response(
        JSON.stringify(messyResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === FULL MODE: Legacy MCTS approach ===
    const fieldGroups = getFieldGroups(fieldConfigs);
    const fields = fieldGroups.all;
    const industries = Object.keys(INDUSTRY_CATEGORY_MATRIX);
    
    const selectedIndustry = industry && industries.includes(industry) 
      ? industry 
      : industries[Math.floor(Math.random() * industries.length)];
    
    const validCategories = INDUSTRY_CATEGORY_MATRIX[selectedIndustry] || [];
    const selectedCategory = category && validCategories.includes(category)
      ? category
      : validCategories[Math.floor(Math.random() * validCategories.length)];

    console.log(`[TestDataGen] Full mode - Industry: ${selectedIndustry}, Category: ${selectedCategory}`);
    console.log(`[TestDataGen] MCTS iterations: ${mctsIterations}`);

    // Fetch DB context for enriched prompts
    const [industryCtx, categoryCtx] = await Promise.all([
      fetchIndustryContext(supabase, selectedIndustry),
      fetchCategoryContext(supabase, selectedCategory),
    ]);

    const candidates: MCTSNode[] = [];
    
    for (let iteration = 0; iteration < mctsIterations; iteration++) {
      console.log(`[TestDataGen] MCTS iteration ${iteration + 1}/${mctsIterations}`);
      
      const generationPrompt = buildGenerationPrompt(
        scenarioType,
        selectedIndustry,
        selectedCategory,
        fieldGroups,
        iteration,
        selectedPersona,
        fieldConfigs,
        industryCtx,
        categoryCtx
      );
      
      const generationResponse = await callAI(generationPrompt.system, generationPrompt.user, temperature);

      if (!generationResponse.success) {
        console.warn(`[TestDataGen] Generation failed on iteration ${iteration + 1}: ${generationResponse.error || "unknown error"}`);
        continue;
      }

      const parsedData = parseGeneratedData(generationResponse.content, fields);
      
      const validationPrompt = buildValidationPrompt(
        parsedData, 
        selectedIndustry, 
        selectedCategory,
        scenarioType
      );
      
      const validationResponse = await callAI(validationPrompt.system, validationPrompt.user, 0.3);
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
          requiredFieldCount: fieldGroups.required.length,
          optionalFieldCount: fieldGroups.optional.length,
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
  scenarioType: string,
  temperature: number
): Promise<{ success: boolean; parameters?: DraftedParameters; error?: string }> {
  const industries = Object.keys(INDUSTRY_CATEGORY_MATRIX);
  
  // Select a random trick and persona for this scenario type
  const trickResult = selectRandomTrick(scenarioType);
  const persona = selectPersona();
  const trick = trickResult?.trick || null;

  // Weighted dataQuality distribution — bias the engine toward good-quality
  // inputs so most tests exercise the happy path. Poor/partial cases still
  // appear so we keep coverage of degraded-input handling, just at a much
  // lower frequency.
  //   excellent: 40%  (OPTIMAL)
  //   good:      40%  (OPTIMAL)   → 80% OPTIMAL total
  //   partial:   15%  (MINIMUM)
  //   poor:       5%  (DEGRADED)
  const qualityRoll = Math.random();
  const presetDataQuality: DataQuality =
    qualityRoll < 0.40 ? "excellent"
    : qualityRoll < 0.80 ? "good"
    : qualityRoll < 0.95 ? "partial"
    : "poor";

  console.log(`[TestDataGen] Draft mode - Selected trick: ${trick?.category || 'none'}, presetDataQuality: ${presetDataQuality}`);

  const system = `You are a procurement test case designer. Generate a random but internally-consistent set of parameters for a test case.

AVAILABLE OPTIONS:
- Industries: ${industries.join(", ")}
- Company Sizes: startup, smb, mid-market, enterprise, large-enterprise
- Complexity: simple, standard, complex, edge-case
- Financial Pressure: comfortable, moderate, tight, crisis
- Strategic Priority: cost, risk, speed, quality, innovation, sustainability
- Market Conditions: stable, growing, volatile, disrupted
- Data Quality: MUST be exactly "${presetDataQuality}" (pre-selected — do not change)

RULES:
1. Pick a RANDOM industry and a COMPATIBLE category from that industry
2. All parameters should form a COHERENT business scenario
3. Write a 1-2 sentence "reasoning" explaining the case
4. The "dataQuality" field MUST equal "${presetDataQuality}" exactly

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

  const draftTemperature = Math.min(temperature, 0.5);
  const response = await callAIWithLimit(system, user, draftTemperature, 4096);

  if (!response.success) {
    return { success: false, error: response.error || "Failed to generate draft parameters" };
  }

  try {
    let jsonStr = response.content.trim();
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
    
    const parsed = JSON.parse(jsonStr.trim()) as DraftedParameters;
    
    // Validate the category is compatible with industry
    const validCategories = INDUSTRY_CATEGORY_MATRIX[parsed.industry] || [];
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
    
    // Hard-enforce the pre-sampled distribution in case the LLM drifted
    if (parsed.dataQuality !== presetDataQuality) {
      console.warn(`[TestDataGen] LLM returned dataQuality="${parsed.dataQuality}", overriding to preset "${presetDataQuality}"`);
      parsed.dataQuality = presetDataQuality;
    }

    // Compute and attach qualityTier
    const qualityTier = mapDataQualityToTier(parsed.dataQuality);
    (parsed as any).qualityTier = qualityTier;
    console.log(`[TestDataGen] Draft mode - qualityTier: ${qualityTier} (from dataQuality: ${parsed.dataQuality})`);
    
    return { success: true, parameters: parsed };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[TestDataGen] Failed to parse draft:", message);
    return { success: false, error: `Failed to parse draft parameters: ${message}` };
  }
}

// === GENERATE MODE HANDLER ===
async function handleGenerateMode(
  scenarioType: string,
  parameters: DraftedParameters,
  temperature: number,
  selectedPersona: typeof BUYER_PERSONAS[number],
  fieldConfigs: ScenarioFieldConfigRow[],
  supabase: ReturnType<typeof createClient>
): Promise<{ success: boolean; data?: Record<string, string>; metadata?: object; error?: string }> {
  const fieldGroups = getFieldGroups(fieldConfigs);
  const fields = fieldGroups.all;

  // Compute quality tier
  const qualityTier: QualityTier = mapDataQualityToTier(parameters.dataQuality);
  const deviationType = fieldConfigs[0]?.deviation_type || "0";
  
  const companySizeDescriptions: Record<CompanySize, string> = {
    "startup": "10-50 employees, Series A/B stage, limited procurement maturity",
    "smb": "50-500 employees, established business, growing procurement needs",
    "mid-market": "500-2,000 employees, regional presence, structured procurement",
    "enterprise": "2,000-10,000 employees, multi-national, mature procurement",
    "large-enterprise": "10,000+ employees, global operations, complex procurement"
  };

  // Build block-specific instructions from DB field configs
  const blockInstructions = buildBlockInstructions(fieldConfigs, qualityTier);

  // Fetch DB context for enrichment
  const [industryCtx, categoryCtx] = await Promise.all([
    fetchIndustryContext(supabase, parameters.industry),
    fetchCategoryContext(supabase, parameters.category),
  ]);
  

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

  // ── PERSONA STYLE INSTRUCTIONS ──
  const PERSONA_STYLE_INSTRUCTIONS: Record<string, string> = {
    "rushed-junior": "Write minimally and vaguely. Use abbreviations freely. Fill only 30-40% of optional fields. Skip details a junior wouldn't know.",
    "methodical-manager": "Write in detailed, structured prose with precise industry terminology. Fill 85-95% of optional fields. Include strategic rationale.",
    "cfo-finance": "Focus exclusively on numbers, risk metrics, and ROI. Keep text fields extremely short. Prioritize financial fields. Fill 40-60% of optional fields.",
    "frustrated-stakeholder": "Mix complaints into data fields. Use narrative paragraphs instead of structured facts. Misuse procurement terminology. Fill 50-70% of optional fields but often in wrong format.",
    "lost-user": "Write completely irrelevant content with no procurement context. Ask random unrelated questions. Fill 0% of optional fields meaningfully.",
  };

  // ── COMPANY SIZE FINANCIAL SCALES ──
  const COMPANY_SIZE_SCALES: Record<string, string> = {
    "startup": "contract values €5K-€50K, WACC 15-25%, limited leverage",
    "smb": "contract values €20K-€200K, WACC 10-16%",
    "SME": "contract values €20K-€200K, WACC 8-14%",
    "mid-market": "contract values €100K-€2M, WACC 7-11%",
    "Mid-Market": "contract values €100K-€2M, WACC 7-11%",
    "enterprise": "contract values €500K-€10M, WACC 6-9%",
    "large-enterprise": "contract values €500K-€20M, WACC 6-9%",
    "Large Enterprise": "contract values €500K-€20M, WACC 6-9%",
  };

  const personaStyle = PERSONA_STYLE_INSTRUCTIONS[selectedPersona.id] || PERSONA_STYLE_INSTRUCTIONS["methodical-manager"];
  const financialScale = COMPANY_SIZE_SCALES[parameters.companySize] || "contract values €100K-€2M, WACC 7-11%";

  // ── SYSTEM PROMPT ──
  const system = `You are a procurement data specialist generating realistic test data for the EXOS procurement intelligence platform.

GDPR RULES (non-negotiable):
- Never use real company names. Use fictional EU entity names with correct legal suffixes: GmbH, OÜ, SAS, SpA, AB, BV, Sp. z o.o.
- Never generate email addresses, phone numbers, or personal names.
- Use role-based references only: "Operations Lead", "CPO", "Plant Manager".
- Financial figures must use clearly fictional but realistic EU ranges in EUR.
- Registration numbers: use patterns like "HRB 00000", "REG-SAMPLE-001".
- Addresses: region-level only — "Stuttgart region", "Northern France".

OUTPUT FORMAT (strict): You must return a valid JSON object with exactly this structure:
{
  "block1": "string — industry and business context",
  "block2": "string — scenario-specific core data",
  "block3": "string — enhanced parameters and financial data",
  "testNotes": "string — 1-2 sentences describing what this test case exercises",
  "expectedEvaluatorScore": "READY" | "IMPROVABLE" | "INSUFFICIENT"
}

Do not include markdown, code fences, or any text outside the JSON object.`;

  // ── USER PROMPT (6 layers) ──
  // LAYER 1 — Scenario context
  let userPrompt = `SCENARIO: ${scenarioType} (Group: ${deviationType})
QUALITY TIER: ${qualityTier}
PERSONA: ${selectedPersona.id} (${selectedPersona.name})

`;

  // LAYER 2 — Field structure from scenario_field_config
  if (fieldConfigs.length > 0) {
    userPrompt += `REQUIRED BLOCKS AND THEIR PURPOSE:\n`;
    fieldConfigs.forEach((fc, idx) => {
      const blockNum = idx + 1;
      userPrompt += `BLOCK ${blockNum} — ${fc.block_label}:\n`;
      userPrompt += `  Type: ${fc.expected_data_type}\n`;
      if (fc.sub_prompts) {
        const subs = Array.isArray(fc.sub_prompts) ? fc.sub_prompts : [];
        if (subs.length > 0) {
          userPrompt += `  Required sub-prompts: ${subs.map((s: any) => typeof s === 'string' ? s : s.label || s.prompt || JSON.stringify(s)).join(', ')}\n`;
        }
      }
      if (fc.deviation_type === '1H') {
        userPrompt += `  ⚠ CRITICAL FIELDS — must be present for correct output type\n`;
      }
      // Tier-specific guidance
      const guidance = qualityTier === 'OPTIMAL' ? fc.optimal_guidance
        : qualityTier === 'MINIMUM' ? fc.minimum_guidance
        : qualityTier === 'DEGRADED' ? fc.degraded_guidance
        : fc.block_guidance;
      if (guidance) {
        userPrompt += `  Guidance for ${qualityTier} tier: ${guidance}\n`;
      }
      userPrompt += `\n`;
    });
  }

  // LAYER 3 — Methodology grounding from DB
  if (categoryCtx || industryCtx) {
    if (categoryCtx) {
      userPrompt += `CATEGORY INTELLIGENCE (${parameters.category}):\n`;
      if (categoryCtx.key_cost_drivers?.length) userPrompt += `  Key cost drivers: ${categoryCtx.key_cost_drivers.join(', ')}\n`;
      if (categoryCtx.kraljic_position) userPrompt += `  Kraljic position: ${categoryCtx.kraljic_position}\n`;
      if (categoryCtx.market_structure) userPrompt += `  Market structure: ${categoryCtx.market_structure}\n`;
      if (categoryCtx.negotiation_dynamics) userPrompt += `  Negotiation dynamics: ${categoryCtx.negotiation_dynamics}\n`;
      if (categoryCtx.kpis_v2) userPrompt += `  Relevant KPIs: ${JSON.stringify(categoryCtx.kpis_v2)}\n`;
      userPrompt += `\n`;
    }
    if (industryCtx) {
      userPrompt += `INDUSTRY INTELLIGENCE (${parameters.industry}):\n`;
      if (industryCtx.kpis?.length) userPrompt += `  Industry KPIs: ${JSON.stringify(industryCtx.kpis)}\n`;
      if (industryCtx.constraints?.length) userPrompt += `  Industry constraints: ${JSON.stringify(industryCtx.constraints)}\n`;
      userPrompt += `\n`;
    }
  }

  // LAYER 4 — Parameter constraints
  userPrompt += `GENERATION PARAMETERS:
  Industry: ${parameters.industry}
  Category: ${parameters.category}
  Company Size: ${parameters.companySize} — scale all financial figures accordingly
  Complexity: ${parameters.complexity}
  Financial Context: ${parameters.financialPressure}
  Market Conditions: ${parameters.marketConditions}
  Priority Focus: ${parameters.strategicPriority}

FINANCIAL SCALE REFERENCE FOR ${parameters.companySize}: ${financialScale}

`;

  // LAYER 5 — Trick injection
  if (trick) {
    userPrompt += `EMBEDDED TRICK — include this issue subtly in the data:
  Type: ${trick.category}
  Instruction: ${trick.description}
  Target block: ${trick.targetField}
  Subtlety level: ${trick.subtlety} — make it ${trick.subtlety === 'obvious' ? 'obvious' : 'subtle'} but realistic.

`;
  }

  // LAYER 6 — Generation instruction
  if (qualityTier === 'OPTIMAL') {
    userPrompt += `Generate complete, realistic content for ALL THREE BLOCKS for the ${scenarioType} scenario at OPTIMAL quality tier.
All blocks must be fully populated with scenario-specific, contextually rich content. Every sub-prompt must be addressed with concrete, internally consistent values. Use domain terminology naturally.`;
  } else if (qualityTier === 'MINIMUM') {
    userPrompt += `Generate MINIMUM viable content for ALL THREE BLOCKS for the ${scenarioType} scenario.
Provide the minimum viable content that meets bare requirements. Critical sub-prompts must be present. Optional fields may be omitted. Block 3 may be brief.`;
  } else if (qualityTier === 'DEGRADED') {
    userPrompt += `Generate DEGRADED content for ALL THREE BLOCKS for the ${scenarioType} scenario.
Deliberately trigger the common failure mode for this scenario.`;
    if (deviationType === '1' || deviationType === '1H') {
      userPrompt += ` Ignore sub-prompt structure — write Block 2 as a single narrative paragraph that buries the required data points in prose.`;
      if (deviationType === '1H') {
        const criticalSubs = fieldConfigs.filter(f => f.deviation_type === '1H').map(f => f.block_label);
        userPrompt += ` Omit the critical fields entirely: ${criticalSubs.join(', ')}.`;
      }
    }
  } else {
    userPrompt += `Generate obviously unusable GIBBERISH content for ALL THREE BLOCKS. Keyboard mash, lorem ipsum, completely irrelevant text. All three blocks must fail basic quality checks.`;
  }

  userPrompt += `\n\nUse the persona writing style: ${personaStyle}`;

  const user = userPrompt;

  console.log(`[TestDataGen] Generate mode - QualityTier: ${qualityTier}, DeviationType: ${deviationType}, Trick: ${trick?.category || 'none'}, Persona: ${selectedPersona.id}`);

  // LangSmith tracing
  const tracer = new LangSmithTracer({ env: "production", feature: "test-data-gen" });
  const runId = tracer.createRun("generate-test-data", "chain", {
    model: "gemini-3.1-pro-preview",
    scenarioType,
    qualityTier,
    deviationType,
    persona: selectedPersona.id,
    trick: trick?.category || "none",
  }, {
    tags: [`tier:${qualityTier}`, `deviation:${deviationType}`, `scenario:${scenarioType}`, "model:gemini-3.1-pro-preview"],
    metadata: { qualityTier, deviationType, persona: selectedPersona.id },
  });

  const response = await callAI(system, user, temperature);

  if (!response.success) {
    tracer.patchRun(
      runId,
      { errorType: classifyError(response.error) },
      response.error || "AI call failed",
    );
    return { success: false, error: response.error || "Failed to generate test data" };
  }

  const rawData = parseGeneratedData(response.content, fields);
  
  // Map block1/block2/block3 keys back to actual field IDs from fieldConfigs
  const data: Record<string, string> = {};
  const blockKeys = ["block1", "block2", "block3"] as const;
  for (const [key, value] of Object.entries(rawData)) {
    const blockIdx = blockKeys.indexOf(key as any);
    if (blockIdx >= 0 && fieldConfigs[blockIdx]) {
      data[fieldConfigs[blockIdx].block_id] = value;
    } else if (key !== "testNotes" && key !== "expectedEvaluatorScore") {
      // Preserve any field that already uses the correct field ID
      data[key] = value;
    }
  }

  // Preserve test metadata from AI response
  const testNotes = rawData["testNotes"] || "";
  const expectedEvaluatorScore = rawData["expectedEvaluatorScore"] || "";
  
  if (Object.keys(data).length === 0) {
    tracer.patchRun(
      runId,
      { errorType: "invalid_request" },
      "Failed to parse generated data",
    );
    return { success: false, error: "Failed to parse generated data" };
  }

  // Validate trick embedding if trick was specified
  let trickScore: { embedded: boolean; subtletyScore: number; feedback: string } | null = null;
  if (trick && data[trick.targetField]) {
    trickScore = scoreTrickEmbedding(data, trick);
    console.log(`[TestDataGen] Trick embedding score: ${trickScore.subtletyScore}/100 - ${trickScore.feedback}`);
  }

  const promptTokens = response.usageMetadata?.promptTokenCount;
  const completionTokens = response.usageMetadata?.candidatesTokenCount;
  tracer.patchRun(runId, {
    fieldsGenerated: Object.keys(data).length,
    fieldsExpected: fields.length,
    qualityTier,
    promptTokens,
    completionTokens,
    totalTokens: response.usageMetadata?.totalTokenCount,
    estimatedCostUsd: estimateCost(response.modelUsed || "gemini-3.1-pro-preview", promptTokens, completionTokens),
    modelUsed: response.modelUsed,
    provider: response.provider ?? "google_ai_studio",
    fallbackReason: response.fallbackReason,
  });

  return {
    success: true,
    scenarioId: scenarioType,
    qualityTier,
    parameters,
    fieldValues: data,
    testNotes: testNotes || "",
    expectedEvaluatorScore: expectedEvaluatorScore || "READY",
    methodologyEnriched: !!(categoryCtx || industryCtx),
    generatedAt: new Date().toISOString(),
    metadata: {
      trickValidation: trickScore,
      persona: selectedPersona.id,
      personaName: selectedPersona.name,
      requiredFieldCount: fieldGroups.required.length,
      optionalFieldCount: fieldGroups.optional.length,
      deviationType,
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
  scenarioType: string,
  temperature: number,
  selectedPersona: typeof BUYER_PERSONAS[number],
  supabase: ReturnType<typeof createClient>
): Promise<{ success: boolean; data?: Record<string, string>; metadata?: object; error?: string }> {
  // Default to a random high-friction scenario if the provided one isn't in the list
  const targetScenario = HIGH_FRICTION_SCENARIOS.includes(scenarioType)
    ? scenarioType
    : HIGH_FRICTION_SCENARIOS[Math.floor(Math.random() * HIGH_FRICTION_SCENARIOS.length)];

  const messyFieldConfigs = await fetchFieldConfigs(supabase, targetScenario);
  const fieldGroups = getFieldGroups(messyFieldConfigs);
  const fields = fieldGroups.all;

  // Messy mode defaults to frustrated-stakeholder but can be overridden
  const messyPersona = selectedPersona.id === "frustrated-stakeholder" || selectedPersona
    ? selectedPersona
    : BUYER_PERSONAS.find(p => p.id === "frustrated-stakeholder")!;

  console.log(`[TestDataGen] Messy mode - Target: ${targetScenario}, Fields: ${fields.length}, Persona: ${messyPersona.id}`);

  // Inject GIBBERISH tier instructions
  const gibberishInstructions = QUALITY_TIER_INSTRUCTIONS['GIBBERISH'];

  const system = `You are a busy, disorganized procurement manager. Generate realistic, messy corporate data for the '${targetScenario}' scenario. Do NOT provide clean, isolated numbers or perfectly formatted text. Instead, generate copy-pasted email threads from suppliers, fragmented meeting notes, or raw CSV strings where pricing, terms, and context are all mixed together in unstructured text. Force this chaotic text into the required scenario schema fields, even if it means shoving a whole email paragraph into a 'currency' or 'number' field, or leaving some fields completely blank. The goal is to simulate maximum UX friction and trigger the shadow logging evaluation.

${gibberishInstructions}

BUYER PERSONA:
You are generating this messy data from the perspective of: "${messyPersona.name}"
${messyPersona.description}

FIELD REQUIREMENTS:
REQUIRED FIELDS (MUST be filled, even if messily):
${fieldGroups.required.map(f => `- ${f}`).join('\n')}

OPTIONAL FIELDS (fill chaotically per persona, some blank):
${fieldGroups.optional.length > 0 ? fieldGroups.optional.map(f => `- ${f}`).join('\n') : '(none)'}

OUTPUT FORMAT:
Return ONLY a valid JSON object with ALL field names as keys. Required fields must have messy data. Optional fields may be empty strings or contain mismatched data.
You MUST include fields from ALL blocks — Block 1, Block 2, and Block 3.`;

  const user = `Generate messy, chaotic procurement data for the "${targetScenario}" scenario.

ALL FIELDS (force messy data into required, optionally fill others):
${fields.map(f => `- ${f}`).join('\n')}

Examples of messy data styles:
- A "currency" field containing: "idk maybe around 50k? check the email from Sarah — she said between 45-55k EUR but that was before the Q3 adjustments"
- A "number" field containing: "see attached spreadsheet row 47, col D — last time it was 12 but procurement said they're renegotiating"
- A "text" field containing a full forwarded email thread with "FW: RE: RE: Updated pricing" 
- Some optional fields left completely blank

IMPORTANT: You MUST generate content for ALL blocks, not just Block 1.

Return ONLY the JSON object.`;

  const response = await callAI(system, user, temperature);

  if (!response.success) {
    return { success: false, error: response.error || "Failed to generate messy test data" };
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
      requiredFieldCount: fieldGroups.required.length,
      optionalFieldCount: fieldGroups.optional.length,
    }
  };
}

interface CallAIResult {
  success: boolean;
  content: string;
  error?: string;
  usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
  modelUsed?: string;
  provider?: "google_ai_studio" | "nebius";
  fallbackReason?: string;
}

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<CallAIResult> {
  return callAIWithLimit(systemPrompt, userPrompt, temperature, 8192);
}

async function callAIWithLimit(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxOutputTokens: number
): Promise<CallAIResult> {
  const base = {
    systemPrompt,
    contents: [{ role: "user" as const, parts: [{ text: userPrompt }] }],
    temperature,
    maxOutputTokens,
    timeoutMs: 45_000,
  };

  // When response.provider === "nebius", the request was answered by Nemotron via the
  // shared fallback chain in google-ai.ts — surface that in modelUsed for trace accuracy.
  const resolveModelUsed = (provider: string | undefined, googleModel: string): string =>
    provider === "nebius" ? "nvidia/nemotron-3-super-120b-a12b" : googleModel;

  try {
    const response = await callGoogleAI(base);
    return {
      success: true,
      content: response.text,
      usageMetadata: response.usageMetadata,
      modelUsed: resolveModelUsed(response.provider, "gemini-3.1-pro-preview"),
      provider: response.provider,
      fallbackReason: response.fallbackReason,
    };
  } catch (error) {
    const status = (error as { status?: number })?.status;
    const primaryMsg = error instanceof Error ? error.message : String(error);
    const overloaded = status === 503 || status === 429;

    if (!overloaded) {
      console.error("[TestDataGen] AI call failed:", primaryMsg);
      return { success: false, content: "", error: primaryMsg };
    }

    console.warn(`[TestDataGen] primary model overloaded (${status}), falling back to gemini-3-flash-preview`);
    try {
      const response = await callGoogleAI({ ...base, model: "gemini-3-flash-preview" });
      return {
        success: true,
        content: response.text,
        usageMetadata: response.usageMetadata,
        modelUsed: resolveModelUsed(response.provider, "gemini-3-flash-preview"),
        provider: response.provider,
        fallbackReason: response.fallbackReason,
      };
    } catch (fallbackError) {
      const fbMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      console.error("[TestDataGen] fallback gemini-3-flash-preview also failed:", fbMsg);
      return { success: false, content: "", error: fbMsg };
    }
  }
}

function buildGenerationPrompt(
  scenarioType: string,
  industry: string,
  category: string,
  fieldGroups: ScenarioFieldGroups,
  seed: number,
  selectedPersona: typeof BUYER_PERSONAS[number],
  fieldConfigs: ScenarioFieldConfigRow[],
  industryCtx: { kpis: string[]; constraints: string[] } | null,
  categoryCtx: {
    characteristics: string;
    kpis: string[];
    key_cost_drivers: string[];
    negotiation_dynamics: string | null;
    kraljic_position: string | null;
  } | null
): { system: string; user: string } {
  const fields = fieldGroups.all;
  const diversityHints = [
    "Focus on a mid-size company with typical procurement challenges.",
    "Consider a large enterprise with complex supply chain requirements.",
    "Create a scenario for a growing startup with limited procurement resources.",
    "Develop a case for a regulated industry with strict compliance needs.",
    "Generate data for a company undergoing digital transformation."
  ];

  // Default to OPTIMAL for full mode
  const blockInstructions = buildBlockInstructions(fieldConfigs, 'OPTIMAL');

  // Build DB context block
  const dbContextBlock = buildDBContextBlock(industryCtx, categoryCtx, category);

  const system = `You are an expert procurement consultant generating realistic test data for procurement analysis software.
${dbContextBlock}

BUYER PERSONA:
You are generating test data from the perspective of this user persona: "${selectedPersona.name}"
${selectedPersona.description}

Adjust your output accordingly:
- Tone and verbosity of text fields should match this persona
- Optional field fill rate should be approximately ${selectedPersona.optionalFillRate}

FIELD REQUIREMENTS:
REQUIRED FIELDS (MUST always be filled):
${fieldGroups.required.map(f => `- ${f}`).join('\n')}

OPTIONAL FIELDS (fill according to persona behavior — leave some as empty strings):
${fieldGroups.optional.length > 0 ? fieldGroups.optional.map(f => `- ${f}`).join('\n') : '(none)'}
${blockInstructions}

CRITICAL RULES:
1. All generated data MUST be consistent with the ${industry} industry
2. All generated data MUST be relevant to the ${category} procurement category
3. ALL blocks must be populated — do not stop after Block 1
4. All numeric values must be plausible for the industry scale
5. DO NOT generate illogical combinations (e.g., pharmaceutical procurement for a software company)
6. ALWAYS fill all REQUIRED fields. For OPTIONAL fields, follow the persona fill rate — include unfilled optional fields as empty strings.
7. You MUST generate content for Block 1, Block 2, AND Block 3 fields.

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
- You MUST generate content for ALL required fields — not just the first one
- You MUST populate ALL blocks (Block 1, Block 2, Block 3) — do NOT stop after the first block
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

/**
 * Parse AI-generated JSON, preserving ALL keys from the response.
 * The `expectedFields` list is used to ensure known fields are included,
 * but any EXTRA keys the AI generates (e.g. Block 2/3 fields not in
 * scenario_field_config) are also preserved.
 */
function parseGeneratedData(content: string, expectedFields: string[]): Record<string, string> {
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
    
    // Build the union of expected fields + any extra keys from the AI response
    const allKeys = new Set<string>([...expectedFields, ...Object.keys(parsed)]);

    // Convert all values to strings (stringify objects/arrays)
    const result: Record<string, string> = {};
    for (const field of allKeys) {
      if (parsed[field] !== undefined && parsed[field] !== null) {
        const val = parsed[field];
        if (typeof val === "object") {
          // Format structured sub-prompt data as readable text
          if (Array.isArray(val)) {
            result[field] = val.map(item => typeof item === "object" ? JSON.stringify(item) : String(item)).join("\n");
          } else {
            // Convert key-value object to readable bullet points
            result[field] = Object.entries(val)
              .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
              .join("\n");
          }
        } else {
          result[field] = String(val);
        }
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
