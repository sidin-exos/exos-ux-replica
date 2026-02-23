import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { LangSmithTracer } from "../_shared/langsmith.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { parseBody, requireString, optionalBoolean, optionalStringOrNull, optionalRecord, validationErrorResponse, ValidationError } from "../_shared/validate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * EXOS Sentinel Analysis Edge Function
 * 
 * Processes procurement analysis requests:
 * 1. Optionally fetches industry/category context from DB (server-side grounding)
 * 2. Builds grounding XML and system prompt server-side when slugs are provided
 * 3. Calls AI gateway with grounded prompt
 * 4. For Deep Analytics scenarios, runs a 3-cycle Chain-of-Experts (Analyst → Auditor → Synthesizer)
 * 5. Logs prompts and responses to testing database
 * 6. Returns response for client-side validation and de-anonymization
 */

interface AnalysisRequest {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  useLocalModel?: boolean;
  localModelEndpoint?: string;
  useGoogleAIStudio?: boolean;
  googleModel?: string;
  stream?: boolean;
  // Server-side grounding inputs
  serverSideGrounding?: boolean;
  scenarioType?: string;
  scenarioData?: Record<string, unknown>;
  industrySlug?: string | null;
  categorySlug?: string | null;
  // Legacy metadata (kept for backward compat, no longer used for grounding)
  groundingContext?: Record<string, unknown>;
  anonymizationMetadata?: Record<string, unknown>;
  enableTestLogging?: boolean;
  // Multi-cycle routing
  scenarioId?: string;
  // Tracing
  env?: string;
}

// ============================================
// DEEP ANALYTICS MULTI-CYCLE CONSTANTS
// ============================================

const DEEP_ANALYTICS_SCENARIOS = [
  'tco-analysis', 'cost-breakdown', 'capex-vs-opex',
  'savings-calculation', 'make-vs-buy', 'volume-consolidation',
  'forecasting-budgeting', 'specification-optimizer',
];

const AUDITOR_SYSTEM_PROMPT = `You are a Senior Financial Auditor specializing in procurement cost analysis. Your task is to rigorously audit an AI-generated procurement analysis draft.

## Audit Checklist — apply EVERY check:

### 1. Arithmetic Verification
- Verify ALL calculations: ROI, NPV, IRR, break-even points, payback periods
- Check percentage calculations and compound effects
- Validate any savings projections against stated baseline costs
- Mark each calculation: [PASS] or [FAIL] with correction

### 2. Hidden Cost Detection
- Flag any missing: taxes, duties, tariffs
- Check for depreciation and amortization gaps
- Identify switching costs, integration costs, training costs
- Look for opportunity costs not accounted for
- Verify warranty, maintenance, and end-of-life costs

### 3. Savings Classification
- Enforce strict Hard Savings vs. Soft Savings separation
- Hard Savings: directly measurable budget reductions (price cuts, volume discounts)
- Soft Savings: efficiency gains, risk avoidance, productivity improvements
- [FAIL] any analysis that mixes hard and soft savings without clear labels

### 4. Unit Consistency
- Check monthly vs. annual vs. multi-year alignment
- Verify currency consistency throughout
- Validate quantity units (per unit, per lot, per annum)

### 5. Logical Coherence
- Verify recommendations follow from the data provided
- Flag unsupported claims or overly optimistic projections
- Check for contradictions between sections

Output your audit as a structured critique with [PASS] or [FAIL] markers for each check.
At the end, provide an overall AUDIT VERDICT: [APPROVED] or [REQUIRES CORRECTION].`;

const SYNTHESIZER_SYSTEM_PROMPT = `You are a Senior Procurement Strategist producing the final deliverable for a client.

You are given:
1. An original analysis draft
2. An auditor's critique with [PASS]/[FAIL] markers

Your task:
- Correct ALL items marked [FAIL] by the auditor
- Preserve all items marked [PASS] exactly as they are
- Incorporate any missing costs or corrections the auditor identified
- Ensure Hard Savings and Soft Savings are clearly separated
- Verify all arithmetic is correct in the final output

Output ONLY the final polished analysis. Do NOT include:
- Audit markers ([PASS]/[FAIL])
- References to the audit process
- Meta-commentary about corrections made

The output should read as a clean, professional procurement analysis as if it were correct from the start.

IMPORTANT: At the VERY END of your final output, you MUST append a <dashboard-data> XML block containing valid JSON with structured visualization data extracted from your analysis. Do NOT wrap the JSON in markdown code blocks. Include only dashboard keys relevant to the scenario.`;

// ============================================
// SERVER-SIDE GROUNDING HELPERS
// ============================================

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface IndustryRow {
  name: string;
  slug: string;
  constraints: string[];
  kpis: string[];
}

interface CategoryRow {
  name: string;
  slug: string;
  characteristics: string;
  kpis: string[];
}

function buildIndustryXML(industry: IndustryRow): string {
  return `<industry-context>
  <industry-name>${escapeXML(industry.name)}</industry-name>
  <industry-id>${escapeXML(industry.slug)}</industry-id>
  <regulatory-constraints>
    <description>Critical regulatory and operational constraints. All recommendations must account for these.</description>
    <constraints>
${industry.constraints.map((c, i) => `      <constraint priority="${i + 1}">${escapeXML(c)}</constraint>`).join('\n')}
    </constraints>
  </regulatory-constraints>
  <performance-kpis>
    <description>Standard performance metrics for this industry.</description>
    <kpis>
${industry.kpis.map((k, i) => `      <kpi index="${i + 1}">${escapeXML(k)}</kpi>`).join('\n')}
    </kpis>
  </performance-kpis>
</industry-context>`;
}

function buildCategoryXML(category: CategoryRow): string {
  return `<category-context>
  <category-name>${escapeXML(category.name)}</category-name>
  <category-id>${escapeXML(category.slug)}</category-id>
  <category-characteristics>
    <description>Key characteristics defining this procurement category.</description>
    <characteristics>${escapeXML(category.characteristics)}</characteristics>
  </category-characteristics>
  <category-kpis>
    <description>Standard performance metrics for this category.</description>
    <kpis>
${category.kpis.map((k, i) => `      <kpi index="${i + 1}">${escapeXML(k)}</kpi>`).join('\n')}
    </kpis>
  </category-kpis>
</category-context>`;
}

// Shadow log injection and extraction helpers
const SHADOW_LOG_INSTRUCTION = `

INTERNAL EVALUATION (do NOT include in your visible response):
After your analysis, output a JSON block fenced with \`\`\`shadow_log\`\`\` containing:
{
  "redundant_fields": ["...fields that added no analytical value"],
  "missing_context": ["...context the user likely wanted to provide but couldn't"],
  "friction_score": 1-10,
  "input_recommendation": "one sentence recommendation for improving input UX",
  "detected_input_format": "structured|semi-structured|raw_text|mixed"
}
This block will be stripped before the response reaches the user. It is for internal evaluation only.`;

function extractShadowLog(content: string): { cleanContent: string; shadowLog: Record<string, unknown> | null } {
  const regex = /```shadow_log\s*\n?([\s\S]*?)\n?\s*```/;
  const match = content.match(regex);
  if (!match) return { cleanContent: content, shadowLog: null };
  try {
    const parsed = JSON.parse(match[1].trim());
    const cleanContent = content.replace(regex, '').trim();
    return { cleanContent, shadowLog: parsed };
  } catch (e) {
    console.warn("[Sentinel] Failed to parse shadow_log JSON:", e);
    return { cleanContent: content.replace(regex, '').trim(), shadowLog: null };
  }
}

function buildServerGroundedPrompts(
  industry: IndustryRow | null,
  category: CategoryRow | null,
  scenarioType: string,
  scenarioData: Record<string, unknown>,
  userInput: string,
  injectShadowLog: boolean = false
): { systemPrompt: string; userPrompt: string } {
  // Build system prompt with injected context
  const contextParts: string[] = [];

  if (industry) contextParts.push(buildIndustryXML(industry));
  if (category) contextParts.push(buildCategoryXML(category));

  const systemPrompt = `You are an expert procurement analyst. Analyze the provided context and generate actionable recommendations.

IMPORTANT RULES:
1. Maintain all masked tokens exactly as provided (e.g., [SUPPLIER_A], [AMOUNT_B])
2. Do not attempt to guess or reveal masked information
3. Base recommendations on the provided industry/category context
4. Structure your response with clear sections: Analysis, Recommendations, Risks, Next Steps
5. Quantify recommendations with specific percentages or ranges when possible
6. Only cite specific data points from provided context
7. Flag uncertainty explicitly with confidence levels
8. Err on cautious side for savings projections
9. At the VERY END of your response, append a <dashboard-data> XML block containing valid JSON with structured data for relevant dashboards. Example:
<dashboard-data>{"actionChecklist":{"actions":[{"action":"...","priority":"high","status":"pending","owner":"..."}]},"riskMatrix":{"risks":[{"supplier":"...","impact":"high","probability":"medium","category":"..."}]}}</dashboard-data>
Only include dashboard keys relevant to the scenario analysis. Use REAL values from your analysis. Do NOT wrap the JSON in markdown code blocks inside the XML tags.

${contextParts.length > 0 ? `<grounding-context>\n${contextParts.join('\n\n')}\n</grounding-context>` : ''}${injectShadowLog ? SHADOW_LOG_INSTRUCTION : ''}`;

  // Build lean user prompt with scenario data + anonymized input
  const scenarioFields = Object.entries(scenarioData)
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => `<field name="${escapeXML(k)}">${escapeXML(String(v))}</field>`)
    .join('\n    ');

  const userPrompt = `<analysis-request scenario-type="${escapeXML(scenarioType)}">
  <user-input>
    ${scenarioFields}
  </user-input>
  <anonymized-query>
    ${escapeXML(userInput)}
  </anonymized-query>
</analysis-request>`;

  return { systemPrompt, userPrompt };
}

// ============================================
// REUSABLE LLM CALL HELPER
// ============================================

/**
 * Internal helper to call an LLM provider (Google AI Studio or Lovable Gateway).
 * Encapsulates retry logic, fallback, and LangSmith tracing in one place.
 * Used for both single-pass and multi-cycle flows.
 */
async function callLLM(
  sysPrompt: string,
  usrPrompt: string,
  opts: {
    model: string;
    useGoogleAIStudio: boolean;
    googleModel: string;
    tracer: LangSmithTracer;
    parentRunId: string;
    spanName: string;
  }
): Promise<string> {
  const { model, useGoogleAIStudio, googleModel, tracer, parentRunId, spanName } = opts;

  const spanId = tracer.createRun(spanName, "llm", {
    model: useGoogleAIStudio ? googleModel : model,
    provider: useGoogleAIStudio ? "google_ai_studio" : "lovable_gateway",
    systemPromptLength: sysPrompt.length,
    userPromptLength: usrPrompt.length,
  }, { parentRunId });

  // --- Try Google AI Studio first if BYOK ---
  if (useGoogleAIStudio) {
    const GOOGLE_AI_STUDIO_KEY = Deno.env.get("GOOGLE_AI_STUDIO_KEY");
    if (GOOGLE_AI_STUDIO_KEY) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${GOOGLE_AI_STUDIO_KEY}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: sysPrompt + "\n\n" + usrPrompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          tracer.patchRun(spanId, { contentLength: content.length, provider: "google_ai_studio" });
          return content;
        }

        const errText = await res.text();
        console.warn(`[callLLM] Google AI Studio ${res.status} for ${spanName}, falling back to gateway`);
        // Fall through to gateway on 429, 5xx, 400-403
        if (!(res.status === 429 || res.status >= 500 || res.status === 400 || res.status === 401 || res.status === 403)) {
          tracer.patchRun(spanId, undefined, `Google AI Studio ${res.status}: ${errText}`);
          throw new Error(`Google AI Studio error ${res.status}`);
        }
      } catch (googleErr) {
        console.warn(`[callLLM] Google AI Studio error for ${spanName}:`, googleErr);
        // Fall through to Lovable Gateway
      }
    }
  }

  // --- Lovable AI Gateway with retry ---
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    tracer.patchRun(spanId, undefined, "LOVABLE_API_KEY not configured");
    throw new Error("AI gateway not configured");
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000];

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
      }

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: usrPrompt },
          ],
          temperature: 0.4,
          max_completion_tokens: 4096,
        }),
      });

      if (res.status === 503 && attempt < MAX_RETRIES - 1) {
        const errText = await res.text();
        console.warn(`[callLLM] Gateway 503 attempt ${attempt + 1} for ${spanName}: ${errText}`);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        tracer.patchRun(spanId, undefined, `Gateway ${res.status}: ${errText}`);
        throw new Error(`AI gateway error ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      tracer.patchRun(spanId, { contentLength: content.length, provider: "lovable_gateway", usage: data.usage });
      return content;
    } catch (fetchErr) {
      if (attempt === MAX_RETRIES - 1) {
        tracer.patchRun(spanId, undefined, fetchErr instanceof Error ? fetchErr.message : "Network error");
        throw fetchErr;
      }
    }
  }

  tracer.patchRun(spanId, undefined, "All retry attempts exhausted");
  throw new Error("AI gateway unavailable after retries");
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate request
  const authResult = await authenticateRequest(req);
  if ("error" in authResult) {
    return new Response(
      JSON.stringify({ error: authResult.error.message }),
      { status: authResult.error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Declare tracer and parentRunId at function scope for error handler
  let tracer: LangSmithTracer | undefined;
  let parentRunId: string | undefined;

  try {
    const body = await parseBody(req);

    // Validate inputs
    const rawUserPrompt = requireString(body.userPrompt, "userPrompt", { minLength: 1, maxLength: 50000 })!;
    const VALID_GATEWAY_MODELS = [
      "google/gemini-2.5-pro", "google/gemini-2.5-flash", "google/gemini-2.5-flash-lite",
      "google/gemini-3-pro-preview", "google/gemini-3-flash-preview",
      "openai/gpt-5", "openai/gpt-5-mini", "openai/gpt-5-nano", "openai/gpt-5.2",
    ];
    const DEFAULT_GATEWAY_MODEL = "google/gemini-3-flash-preview";
    const rawModel = requireString(body.model, "model", { optional: true, maxLength: 100 }) || DEFAULT_GATEWAY_MODEL;
    const model = VALID_GATEWAY_MODELS.includes(rawModel) ? rawModel : DEFAULT_GATEWAY_MODEL;
    const useLocalModel = optionalBoolean(body.useLocalModel, "useLocalModel") ?? false;
    const localModelEndpoint = requireString(body.localModelEndpoint, "localModelEndpoint", { optional: true, maxLength: 500 });
    const useGoogleAIStudio = optionalBoolean(body.useGoogleAIStudio, "useGoogleAIStudio") ?? false;
    const googleModel = requireString(body.googleModel, "googleModel", { optional: true, maxLength: 100 }) || "gemini-2.5-flash";
    const stream = optionalBoolean(body.stream, "stream") ?? false;
    const serverSideGrounding = optionalBoolean(body.serverSideGrounding, "serverSideGrounding") ?? false;
    const scenarioType = requireString(body.scenarioType, "scenarioType", { optional: true, maxLength: 200 });
    const scenarioData = optionalRecord(body.scenarioData, "scenarioData", 50);
    const industrySlug = optionalStringOrNull(body.industrySlug, "industrySlug", 100);
    const categorySlug = optionalStringOrNull(body.categorySlug, "categorySlug", 100);
    const groundingContext = optionalRecord(body.groundingContext, "groundingContext", 50);
    const anonymizationMetadata = optionalRecord(body.anonymizationMetadata, "anonymizationMetadata", 50);
    const enableTestLogging = optionalBoolean(body.enableTestLogging, "enableTestLogging") ?? true;
    const scenarioId = requireString(body.scenarioId, "scenarioId", { optional: true, maxLength: 100 });
    const reqEnv = requireString(body.env, "env", { optional: true, maxLength: 50 });

    // Determine if multi-cycle
    const isMultiCycle = !!scenarioId && DEEP_ANALYTICS_SCENARIOS.includes(scenarioId);

    // Initialize LangSmith tracer
    tracer = new LangSmithTracer({ env: reqEnv, feature: "sentinel_analysis" });
    parentRunId = tracer.createRun("sentinel-analysis", "chain", {
      model,
      scenarioType: scenarioType || "unknown",
      serverSideGrounding,
      scenarioId: scenarioId || null,
      isMultiCycle,
    }, {
      metadata: { industrySlug, categorySlug, useGoogleAIStudio, useLocalModel, isMultiCycle, cycleCount: isMultiCycle ? 3 : 1 },
      tags: [model, ...(isMultiCycle ? ["multi-cycle", "chain-of-experts"] : [])],
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = supabaseUrl && supabaseKey
      ? createClient(supabaseUrl, supabaseKey)
      : null;

    // --- Resolve prompts ---
    let systemPrompt: string;
    let userPrompt: string;

    if (serverSideGrounding && supabase) {
      // --- Child Run 1: fetch-context ---
      const fetchRunId = tracer.createRun("fetch-context", "tool", {
        industrySlug, categorySlug,
      }, { parentRunId });

      let industryResult: { data: IndustryRow | null; error: unknown } = { data: null, error: null };
      let categoryResult: { data: CategoryRow | null; error: unknown } = { data: null, error: null };
      const fetchErrors: string[] = [];

      try {
        [industryResult, categoryResult] = await Promise.all([
          industrySlug
            ? supabase.from("industry_contexts").select("name, slug, constraints, kpis").eq("slug", industrySlug).single()
            : Promise.resolve({ data: null, error: null }),
          categorySlug
            ? supabase.from("procurement_categories").select("name, slug, characteristics, kpis").eq("slug", categorySlug).single()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (industryResult.error) { console.error("[Sentinel] Failed to fetch industry context:", industryResult.error); fetchErrors.push("industry: " + String(industryResult.error)); }
        if (categoryResult.error) { console.error("[Sentinel] Failed to fetch category context:", categoryResult.error); fetchErrors.push("category: " + String(categoryResult.error)); }
      } finally {
        tracer.patchRun(fetchRunId, {
          foundIndustry: !!industryResult.data,
          foundCategory: !!categoryResult.data,
          errors: fetchErrors,
        }, fetchErrors.length > 0 ? fetchErrors.join("; ") : undefined);
      }

      // --- Child Run 2: assemble-prompt ---
      const assembleRunId = tracer.createRun("assemble-prompt", "tool", {
        scenarioType: scenarioType || "general",
      }, { parentRunId });

      try {
        // Inject shadow log instruction for non-streaming test-logged requests
        const shouldInjectShadowLog = enableTestLogging && !stream && !!scenarioType;

        const grounded = buildServerGroundedPrompts(
          industryResult.data as IndustryRow | null,
          categoryResult.data as CategoryRow | null,
          scenarioType || "general",
          scenarioData || {},
          rawUserPrompt,
          shouldInjectShadowLog
        );

        systemPrompt = grounded.systemPrompt;
        userPrompt = grounded.userPrompt;
      } finally {
        tracer.patchRun(assembleRunId, {
          systemPromptLength: systemPrompt?.length || 0,
          userPromptLength: userPrompt?.length || 0,
          contextPartsCount: (industryResult.data ? 1 : 0) + (categoryResult.data ? 1 : 0),
        });
      }
    } else if (body.systemPrompt) {
      // Legacy path: client sent full prompts (useQuickAnalysis, ModelConfigPanel, etc.)
      systemPrompt = body.systemPrompt;
      userPrompt = rawUserPrompt;
      // Inject shadow log for legacy path too if conditions met
      if (enableTestLogging && !stream && scenarioType) {
        systemPrompt += SHADOW_LOG_INSTRUCTION;
      }
    } else {
      // Fallback: no grounding, use a basic system prompt
      systemPrompt = "You are an expert procurement analyst. Provide clear, actionable recommendations.";
      userPrompt = rawUserPrompt;
    }

    // Validate required fields
    if (!userPrompt) {
      return new Response(
        JSON.stringify({ error: "Missing userPrompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let promptId: string | null = null;
    const startTime = performance.now();

    // Log the prompt to testing database
    if (enableTestLogging && supabase && scenarioType) {
      try {
        const { data: promptData, error: promptError } = await supabase
          .from("test_prompts")
          .insert({
            scenario_type: scenarioType,
            scenario_data: scenarioData || {},
            industry_slug: industrySlug,
            category_slug: categorySlug,
            system_prompt: systemPrompt,
            user_prompt: userPrompt,
            grounding_context: groundingContext,
            anonymization_metadata: anonymizationMetadata
          })
          .select("id")
          .single();

        if (promptError) {
          console.error("[Sentinel] Failed to log prompt:", promptError);
        } else {
          promptId = promptData.id;
        }
      } catch (logError) {
        console.error("[Sentinel] Prompt logging error:", logError);
      }
    }

    // Future: Route to local Mistral model if configured
    if (useLocalModel && localModelEndpoint) {
      return new Response(
        JSON.stringify({
          error: "Local model endpoint not yet implemented",
          message: "Configure your Mistral model endpoint and uncomment the local model logic"
        }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // MULTI-CYCLE CHAIN-OF-EXPERTS (Deep Analytics)
    // ============================================
    if (isMultiCycle) {
      console.log(`[Sentinel] Multi-cycle Chain-of-Experts for scenario: ${scenarioId}`);

      const llmOpts = { model, useGoogleAIStudio, googleModel, tracer, parentRunId: parentRunId!, spanName: "" };

      // Cycle 1: Analyst Draft
      const draft = await callLLM(systemPrompt, userPrompt, { ...llmOpts, spanName: "Analyst_Draft" });
      console.log(`[Sentinel] Cycle 1 (Analyst Draft): ${draft.length} chars`);

      // Cycle 2: Auditor Critique
      const critiquePrompt = `<draft>\n${draft}\n</draft>\n\n<original-request>\n${userPrompt}\n</original-request>`;
      const critique = await callLLM(AUDITOR_SYSTEM_PROMPT, critiquePrompt, { ...llmOpts, spanName: "Auditor_Critique" });
      console.log(`[Sentinel] Cycle 2 (Auditor Critique): ${critique.length} chars`);

      // Cycle 3: Synthesizer Final
      const synthPrompt = `<draft>\n${draft}\n</draft>\n<critique>\n${critique}\n</critique>\n<original-request>\n${userPrompt}\n</original-request>`;
      const finalContent = await callLLM(SYNTHESIZER_SYSTEM_PROMPT, synthPrompt, { ...llmOpts, spanName: "Synthesizer_Final" });
      console.log(`[Sentinel] Cycle 3 (Synthesizer Final): ${finalContent.length} chars`);

      const processingTime = Math.round(performance.now() - startTime);

      // Log final result (only final — drafts/critiques stay server-side)
      if (enableTestLogging && supabase && promptId) {
        try {
          await supabase.from("test_reports").insert({
            prompt_id: promptId,
            model: useGoogleAIStudio ? googleModel : model,
            raw_response: finalContent,
            processing_time_ms: processingTime,
            success: true,
          });
        } catch (reportError) {
          console.error("[Sentinel] Failed to log multi-cycle report:", reportError);
        }
      }

      tracer.patchRun(parentRunId!, {
        success: true,
        isMultiCycle: true,
        cycleCount: 3,
        contentLength: finalContent.length,
        processingTimeMs: processingTime,
        source: useGoogleAIStudio ? "google_ai_studio" : "cloud",
      });

      return new Response(
        JSON.stringify({
          content: finalContent,
          model: useGoogleAIStudio ? googleModel : model,
          source: useGoogleAIStudio ? "google_ai_studio" : "cloud",
          promptId,
          processingTimeMs: processingTime,
          isMultiCycle: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // SINGLE-PASS INFERENCE (Standard scenarios)
    // ============================================

    // --- Child Run 3: ai-inference (wraps all AI provider attempts) ---
    const inferenceRunId = tracer.createRun("ai-inference", "chain", {
      model, useGoogleAIStudio, promptLengths: { system: systemPrompt.length, user: userPrompt.length },
    }, { parentRunId });

    // Route to Google AI Studio (BYOK mode)
    if (useGoogleAIStudio) {
      const GOOGLE_AI_STUDIO_KEY = Deno.env.get("GOOGLE_AI_STUDIO_KEY");

      if (!GOOGLE_AI_STUDIO_KEY) {
        console.error("[Sentinel] GOOGLE_AI_STUDIO_KEY not configured, falling back to Lovable AI");
        // Fall through to Lovable AI Gateway
      } else {
        const googleEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${GOOGLE_AI_STUDIO_KEY}`;

        const googleAttemptId = tracer.createRun("ai-attempt-1", "llm", {
          model: googleModel, provider: "google_ai_studio", attempt: 1,
        }, { parentRunId: inferenceRunId });

        try {
          const googleResponse = await fetch(googleEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 4096,
              },
            }),
          });

          const processingTime = Math.round(performance.now() - startTime);

          if (!googleResponse.ok) {
            const errorText = await googleResponse.text();
            console.error(`[Sentinel] Google AI Studio error: ${googleResponse.status}`, errorText);

            tracer.patchRun(googleAttemptId, undefined, `Google AI Studio ${googleResponse.status}`);

            if (enableTestLogging && supabase && promptId) {
              await supabase.from("test_reports").insert({
                prompt_id: promptId,
                model: googleModel,
                raw_response: errorText,
                processing_time_ms: processingTime,
                success: false,
                error_message: `Google AI Studio error: ${googleResponse.status}`
              });
            }

            // Fallback to Lovable AI Gateway on rate limit, server errors, OR auth/key errors (400/401/403)
            if (googleResponse.status === 429 || googleResponse.status >= 500 || googleResponse.status === 400 || googleResponse.status === 401 || googleResponse.status === 403) {
              console.warn(`[Sentinel] Google AI Studio ${googleResponse.status}, falling back to Lovable AI Gateway`);
              throw new Error(`Google AI Studio ${googleResponse.status}: fallback to gateway`);
            }

            tracer.patchRun(inferenceRunId, { success: false, source: "google_ai_studio" }, `Google AI Studio ${googleResponse.status}`);
            tracer.patchRun(parentRunId, { success: false, source: "google_ai_studio" }, `Google AI Studio ${googleResponse.status}`);

            return new Response(
              JSON.stringify({ error: "Google AI Studio error", details: errorText }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const googleData = await googleResponse.json();
          const rawContent = googleData.candidates?.[0]?.content?.parts?.[0]?.text || "";

          // Extract and strip shadow_log from response
          const { cleanContent: content, shadowLog } = extractShadowLog(rawContent);
          if (shadowLog) {
            console.log("[Sentinel] Shadow log extracted (Google):", JSON.stringify(shadowLog));
          }

          const usage = googleData.usageMetadata ? {
            prompt_tokens: googleData.usageMetadata.promptTokenCount || 0,
            completion_tokens: googleData.usageMetadata.candidatesTokenCount || 0,
            total_tokens: googleData.usageMetadata.totalTokenCount || 0,
          } : null;

          // Log successful response with shadow_log
          if (enableTestLogging && supabase && promptId) {
            try {
              await supabase.from("test_reports").insert({
                prompt_id: promptId,
                model: googleModel,
                raw_response: content,
                processing_time_ms: processingTime,
                token_usage: usage,
                success: true,
                shadow_log: shadowLog,
                prompt_tokens: usage?.prompt_tokens || 0,
                completion_tokens: usage?.completion_tokens || 0,
                total_tokens: usage?.total_tokens || 0,
              });
            } catch (reportError) {
              console.error("[Sentinel] Failed to log report:", reportError);
            }
          }

          tracer.patchRun(googleAttemptId, { contentLength: content.length, usage, processingTimeMs: processingTime, hasShadowLog: !!shadowLog });
          tracer.patchRun(inferenceRunId, { success: true, contentLength: content.length, source: "google_ai_studio", processingTimeMs: processingTime });
          tracer.patchRun(parentRunId, { success: true, contentLength: content.length, source: "google_ai_studio", processingTimeMs: processingTime });

          return new Response(
            JSON.stringify({
              content, model: googleModel, source: "google_ai_studio", usage, promptId, processingTimeMs: processingTime
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (googleError) {
          console.error("[Sentinel] Google AI Studio fetch error:", googleError);
          tracer.patchRun(googleAttemptId, undefined, googleError instanceof Error ? googleError.message : "Google AI Studio error");
          // Fall through to Lovable AI Gateway
        }
      }
    }

    // Call Lovable AI Gateway with retry logic
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[Sentinel] LOVABLE_API_KEY not configured");
      tracer.patchRun(inferenceRunId, undefined, "LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000];
    let aiResponse: Response | null = null;
    let lastError: string | null = null;
    // Track attempt offset: if Google was attempt 1, gateway starts at 2
    const attemptOffset = useGoogleAIStudio ? 1 : 0;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const attemptRunId = tracer.createRun(`ai-attempt-${attempt + 1 + attemptOffset}`, "llm", {
        model, provider: "lovable_gateway", attempt: attempt + 1 + attemptOffset,
      }, { parentRunId: inferenceRunId });

      try {
        if (attempt > 0) {
          console.warn(`[Sentinel] Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${RETRY_DELAYS[attempt - 1]}ms`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
        }

        aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.4,
            max_completion_tokens: 4096,
            stream
          }),
        });

        if (aiResponse.status === 503) {
          lastError = await aiResponse.text();
          console.warn(`[Sentinel] Got 503 on attempt ${attempt + 1}: ${lastError}`);
          tracer.patchRun(attemptRunId, undefined, `503: ${lastError}`);
          if (attempt < MAX_RETRIES - 1) continue;
        } else {
          // Success or non-retryable error — patch this attempt as done
          tracer.patchRun(attemptRunId, { status: aiResponse.status });
        }

        break;
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : "Network error";
        console.warn(`[Sentinel] Fetch error on attempt ${attempt + 1}: ${lastError}`);
        tracer.patchRun(attemptRunId, undefined, lastError);
        if (attempt === MAX_RETRIES - 1) {
          tracer.patchRun(inferenceRunId, undefined, `All ${MAX_RETRIES} attempts failed: ${lastError}`);
          return new Response(
            JSON.stringify({ error: "AI gateway connection failed after retries", details: lastError }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!aiResponse) {
      tracer.patchRun(inferenceRunId, undefined, `AI gateway unavailable: ${lastError}`);
      return new Response(
        JSON.stringify({ error: "AI gateway unavailable", details: lastError }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processingTime = Math.round(performance.now() - startTime);

    if (aiResponse.status === 429) {
      console.warn("[Sentinel] Rate limit exceeded");
      if (enableTestLogging && supabase && promptId) {
        await supabase.from("test_reports").insert({
          prompt_id: promptId, model, raw_response: "", processing_time_ms: processingTime,
          success: false, error_message: "Rate limit exceeded"
        });
      }
      tracer.patchRun(inferenceRunId, undefined, "Rate limit exceeded (429)");
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (aiResponse.status === 402) {
      console.warn("[Sentinel] Payment required");
      if (enableTestLogging && supabase && promptId) {
        await supabase.from("test_reports").insert({
          prompt_id: promptId, model, raw_response: "", processing_time_ms: processingTime,
          success: false, error_message: "Payment required"
        });
      }
      tracer.patchRun(inferenceRunId, undefined, "Payment required (402)");
      return new Response(
        JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[Sentinel] AI gateway error: ${aiResponse.status}`, errorText);
      if (enableTestLogging && supabase && promptId) {
        await supabase.from("test_reports").insert({
          prompt_id: promptId, model, raw_response: errorText, processing_time_ms: processingTime,
          success: false, error_message: `AI gateway error: ${aiResponse.status}`
        });
      }
      tracer.patchRun(inferenceRunId, undefined, `AI gateway error: ${aiResponse.status}`);
      return new Response(
        JSON.stringify({ error: "AI gateway error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (stream) {
      tracer.patchRun(inferenceRunId, { success: true, source: "cloud", streaming: true });
      tracer.patchRun(parentRunId, { success: true, source: "cloud", streaming: true });
      return new Response(aiResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await aiResponse.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Extract and strip shadow_log from response
    const { cleanContent: content, shadowLog } = extractShadowLog(rawContent);
    if (shadowLog) {
      console.log("[Sentinel] Shadow log extracted (Gateway):", JSON.stringify(shadowLog));
    }

    // Log successful response with shadow_log
    if (enableTestLogging && supabase && promptId) {
      try {
        await supabase.from("test_reports").insert({
          prompt_id: promptId, model, raw_response: content,
          processing_time_ms: processingTime, token_usage: data.usage || null, success: true,
          shadow_log: shadowLog,
          prompt_tokens: data.usage?.prompt_tokens || 0,
          completion_tokens: data.usage?.completion_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0,
        });
      } catch (reportError) {
        console.error("[Sentinel] Failed to log report:", reportError);
      }
    }

    tracer.patchRun(inferenceRunId, { success: true, contentLength: content.length, usage: data.usage, source: "cloud", processingTimeMs: processingTime, hasShadowLog: !!shadowLog });
    tracer.patchRun(parentRunId, { success: true, contentLength: content.length, source: "cloud", processingTimeMs: processingTime });

    return new Response(
      JSON.stringify({
        content, model, source: "cloud", usage: data.usage, promptId, processingTimeMs: processingTime
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error.message);
    }
    console.error("[Sentinel] Error:", error);
    try { tracer?.patchRun(parentRunId!, undefined, error instanceof Error ? error.message : "Unknown error"); } catch (_) { /* noop */ }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
