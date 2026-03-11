import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { LangSmithTracer } from "../_shared/langsmith.ts";
import { authenticateRequest, getUserOrgId } from "../_shared/auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { parseBody, requireString, optionalBoolean, optionalStringOrNull, optionalRecord, validationErrorResponse, ValidationError } from "../_shared/validate.ts";
import { callGoogleAI } from "../_shared/google-ai.ts";
import { anonymizeText, deanonymizeText, type AnonymizationResultServer } from "../_shared/anonymizer.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

interface MarketInsightRow {
  key_trends: string[] | null;
  risk_signals: string[] | null;
  opportunities: string[] | null;
}

function buildMarketIntelligenceXML(insight: MarketInsightRow): string {
  const trends = (insight.key_trends || []).map(t => `      <trend>${escapeXML(t)}</trend>`).join('\n');
  const risks = (insight.risk_signals || []).map(r => `      <signal>${escapeXML(r)}</signal>`).join('\n');
  const opps = (insight.opportunities || []).map(o => `      <opportunity>${escapeXML(o)}</opportunity>`).join('\n');
  return `<market-intelligence>
    <description>Current market intelligence from verified sources. Use these to ground recommendations in real market conditions.</description>
    <key-trends>
${trends}
    </key-trends>
    <risk-signals>
${risks}
    </risk-signals>
    <opportunities>
${opps}
    </opportunities>
  </market-intelligence>`;
}

// ============================================
// SERVER-SIDE VALIDATION HELPER
// ============================================

interface ValidationRule {
  rule_type: string;
  pattern: string;
  severity: string;
  description: string;
  suggestion: string | null;
}

interface ServerValidationResult {
  passed: boolean;
  confidenceScore: number;
  issues: Array<{ rule_type: string; severity: string; description: string; match?: string }>;
}

async function runServerValidation(
  content: string,
  scenarioType: string | undefined,
  supabaseClient: ReturnType<typeof createClient> | null
): Promise<ServerValidationResult> {
  if (!supabaseClient) {
    return { passed: true, confidenceScore: 1.0, issues: [] };
  }

  try {
    let query = supabaseClient
      .from("validation_rules")
      .select("rule_type, pattern, severity, description, suggestion")
      .eq("is_active", true);

    if (scenarioType) {
      query = query.or(`scenario_type.is.null,scenario_type.eq.${scenarioType}`);
    } else {
      query = query.is("scenario_type", null);
    }

    const { data: rules, error } = await query;

    if (error) {
      console.warn("[Sentinel] Failed to fetch validation_rules:", error);
      return { passed: true, confidenceScore: 1.0, issues: [] };
    }

    if (!rules || rules.length === 0) {
      return { passed: true, confidenceScore: 1.0, issues: [] };
    }

    const issues: ServerValidationResult["issues"] = [];
    const contentLower = content.toLowerCase();

    for (const rule of rules as ValidationRule[]) {
      try {
        if (rule.rule_type === 'required_section' || rule.rule_type === 'required_keyword') {
          // For required patterns, check if ANY alternative matches (pipe-separated)
          const alternatives = rule.pattern.split('|').map(p => p.trim().toLowerCase());
          const found = alternatives.some(alt => contentLower.includes(alt));
          if (!found) {
            issues.push({
              rule_type: rule.rule_type,
              severity: rule.severity,
              description: rule.description,
            });
          }
        } else {
          // For hallucination/unsafe/forbidden patterns, use regex matching
          const regex = new RegExp(rule.pattern, 'gi');
          let match;
          while ((match = regex.exec(content)) !== null) {
            issues.push({
              rule_type: rule.rule_type,
              severity: rule.severity,
              description: rule.description,
              match: match[0],
            });
            // Prevent infinite loop on zero-length matches
            if (match[0].length === 0) break;
          }
        }
      } catch (regexErr) {
        console.warn(`[Sentinel] Invalid regex pattern in rule: ${rule.pattern}`, regexErr);
      }
    }

    // Calculate confidence score (same deduction math as client-side)
    let score = 1.0;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 0.3; break;
        case 'high': score -= 0.15; break;
        case 'medium': score -= 0.08; break;
        case 'low': score -= 0.03; break;
      }
    }
    score = Math.max(0, Math.min(1, score));

    const hasCritical = issues.some(i => i.severity === 'critical');
    const passed = !hasCritical && score >= 0.6;

    return { passed, confidenceScore: score, issues };
  } catch (err) {
    console.warn("[Sentinel] Server validation error:", err);
    return { passed: true, confidenceScore: 1.0, issues: [] };
  }
}

function buildServerGroundedPrompts(
  industry: IndustryRow | null,
  category: CategoryRow | null,
  scenarioType: string,
  scenarioData: Record<string, unknown>,
  userInput: string,
  injectShadowLog: boolean = false,
  marketInsight: MarketInsightRow | null = null
): { systemPrompt: string; userPrompt: string } {
  // Build system prompt with injected context
  const contextParts: string[] = [];

  if (industry) contextParts.push(buildIndustryXML(industry));
  if (category) contextParts.push(buildCategoryXML(category));
  if (marketInsight) contextParts.push(buildMarketIntelligenceXML(marketInsight));

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
 * Internal helper to call Google AI Studio via shared helper.
 * Encapsulates retry logic (3 attempts with exponential backoff on 503)
 * and LangSmith tracing. Used for both single-pass and multi-cycle flows.
 */
async function callLLM(
  sysPrompt: string,
  usrPrompt: string,
  opts: {
    googleModel: string;
    tracer: LangSmithTracer;
    parentRunId: string;
    spanName: string;
  }
): Promise<string> {
  const { googleModel, tracer, parentRunId, spanName } = opts;

  const spanId = tracer.createRun(spanName, "llm", {
    model: googleModel,
    provider: "google_ai_studio",
    systemPromptLength: sysPrompt.length,
    userPromptLength: usrPrompt.length,
  }, { parentRunId });

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000];

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.warn(`[callLLM] Retry attempt ${attempt + 1}/${MAX_RETRIES} for ${spanName} after ${RETRY_DELAYS[attempt - 1]}ms`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
      }

      const response = await callGoogleAI({
        systemPrompt: sysPrompt,
        contents: [{ role: "user", parts: [{ text: usrPrompt }] }],
        temperature: 0.4,
        maxOutputTokens: 4096,
        model: googleModel,
      });

      const content = response.text || "";
      tracer.patchRun(spanId, { contentLength: content.length, provider: "google_ai_studio", usage: response.usageMetadata });
      return content;
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 503 && attempt < MAX_RETRIES - 1) {
        console.warn(`[callLLM] Google AI Studio 503 attempt ${attempt + 1} for ${spanName}`);
        continue;
      }
      if (attempt === MAX_RETRIES - 1) {
        tracer.patchRun(spanId, undefined, err instanceof Error ? err.message : "Network error");
        throw err;
      }
    }
  }

  tracer.patchRun(spanId, undefined, "All retry attempts exhausted");
  throw new Error("Google AI Studio unavailable after retries");
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Hard auth: require authentication
  const authResult = await authenticateRequest(req);
  if ("error" in authResult) {
    return new Response(
      JSON.stringify({ error: authResult.error.message }),
      {
        status: authResult.error.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  const { userId } = authResult.user;
  const userOrgId = await getUserOrgId(userId);

  // Rate limit: 10 requests/hour per user (expensive multi-cycle endpoint)
  const rateCheck = await checkRateLimit(userId, "sentinel-analysis", 10, 60, { failClosed: true });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck, corsHeaders,
      "Analysis rate limit reached. Please wait before submitting another analysis."
    );
  }

  // Declare tracer and parentRunId at function scope for error handler
  let tracer: LangSmithTracer | undefined;
  let parentRunId: string | undefined;

  try {
    const body = await parseBody(req);

    // Validate inputs
    const rawUserPrompt = requireString(body.userPrompt, "userPrompt", { minLength: 1, maxLength: 50000 })!;
    // Accept model/useGoogleAIStudio/stream for backward compat but always use Google AI Studio directly
    const rawGoogleModel = requireString(body.googleModel, "googleModel", { optional: true, maxLength: 100 })
      || requireString(body.model, "model", { optional: true, maxLength: 100 })
      || "gemini-3-flash-preview";
    // Strip "google/" prefix if sent from legacy clients
    const googleModel = rawGoogleModel.replace(/^google\//, "");
    const useLocalModel = optionalBoolean(body.useLocalModel, "useLocalModel") ?? false;
    const localModelEndpoint = requireString(body.localModelEndpoint, "localModelEndpoint", { optional: true, maxLength: 500 });
    // Accept but ignore — always use Google AI Studio
    optionalBoolean(body.useGoogleAIStudio, "useGoogleAIStudio");
    optionalBoolean(body.stream, "stream");
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

    // === SERVER-SIDE ANONYMIZATION (fail-closed) ===
    let anonymizationResult: AnonymizationResultServer;
    try {
      anonymizationResult = anonymizeText(rawUserPrompt);
      console.log(`[Sentinel] Anonymized: ${anonymizationResult.metadata.entitiesFound} entities found, confidence=${anonymizationResult.metadata.confidence.toFixed(2)}`);
    } catch (anonymizationError) {
      console.error("[Sentinel] CRITICAL: Anonymization failed, aborting to prevent PII exposure:", anonymizationError);
      return new Response(
        JSON.stringify({
          error: "Anonymization failed",
          message: "Unable to process your request safely. Please try again.",
          stage: "anonymization",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const anonymizedUserPrompt = anonymizationResult.anonymizedText;

    // Anonymize scenarioData values using the same entity map
    let anonymizedScenarioData = scenarioData;
    if (scenarioData && Object.keys(anonymizationResult.entityMap).length > 0) {
      anonymizedScenarioData = {} as Record<string, unknown>;
      for (const [key, value] of Object.entries(scenarioData)) {
        if (typeof value === "string") {
          let masked = value;
          for (const [token, entity] of Object.entries(anonymizationResult.entityMap)) {
            masked = masked.split(entity.originalValue).join(token);
          }
          (anonymizedScenarioData as Record<string, unknown>)[key] = masked;
        } else {
          (anonymizedScenarioData as Record<string, unknown>)[key] = value;
        }
      }
    }

    // Determine if multi-cycle
    const isMultiCycle = !!scenarioId && DEEP_ANALYTICS_SCENARIOS.includes(scenarioId);

    // Initialize LangSmith tracer
    tracer = new LangSmithTracer({ env: reqEnv, feature: "sentinel_analysis" });
    parentRunId = tracer.createRun("sentinel-analysis", "chain", {
      model: googleModel,
      scenarioType: scenarioType || "unknown",
      serverSideGrounding,
      scenarioId: scenarioId || null,
      isMultiCycle,
    }, {
      metadata: { industrySlug, categorySlug, useLocalModel, isMultiCycle, cycleCount: isMultiCycle ? 3 : 1 },
      tags: [googleModel, ...(isMultiCycle ? ["multi-cycle", "chain-of-experts"] : [])],
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
      let insightResult: { data: MarketInsightRow | null; error: unknown } = { data: null, error: null };
      const fetchErrors: string[] = [];

      try {
        [industryResult, categoryResult, insightResult] = await Promise.all([
          industrySlug
            ? supabase.from("industry_contexts").select("name, slug, constraints, kpis").eq("slug", industrySlug).single()
            : Promise.resolve({ data: null, error: null }),
          categorySlug
            ? supabase.from("procurement_categories").select("name, slug, characteristics, kpis").eq("slug", categorySlug).single()
            : Promise.resolve({ data: null, error: null }),
          (industrySlug && categorySlug)
            ? supabase.from("market_insights")
                .select("key_trends, risk_signals, opportunities")
                .eq("industry_slug", industrySlug)
                .eq("category_slug", categorySlug)
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (industryResult.error) { console.error("[Sentinel] Failed to fetch industry context:", industryResult.error); fetchErrors.push("industry: " + String(industryResult.error)); }
        if (categoryResult.error) { console.error("[Sentinel] Failed to fetch category context:", categoryResult.error); fetchErrors.push("category: " + String(categoryResult.error)); }
        if (insightResult.error) { console.warn("[Sentinel] Failed to fetch market insight (non-fatal):", insightResult.error); }
      } finally {
        tracer.patchRun(fetchRunId, {
          foundIndustry: !!industryResult.data,
          foundCategory: !!categoryResult.data,
          foundInsight: !!insightResult.data,
          errors: fetchErrors,
        }, fetchErrors.length > 0 ? fetchErrors.join("; ") : undefined);
      }

      // --- Child Run 2: assemble-prompt ---
      const assembleRunId = tracer.createRun("assemble-prompt", "tool", {
        scenarioType: scenarioType || "general",
      }, { parentRunId });

      try {
        // Inject shadow log instruction for test-logged requests
        const shouldInjectShadowLog = enableTestLogging && !!scenarioType;

        const grounded = buildServerGroundedPrompts(
          industryResult.data as IndustryRow | null,
          categoryResult.data as CategoryRow | null,
          scenarioType || "general",
          anonymizedScenarioData || {},
          anonymizedUserPrompt,
          shouldInjectShadowLog,
          insightResult.data as MarketInsightRow | null
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
      userPrompt = anonymizedUserPrompt;
      // Inject shadow log for legacy path too if conditions met
      if (enableTestLogging && scenarioType) {
        systemPrompt += SHADOW_LOG_INSTRUCTION;
      }
    } else {
      // Fallback: no grounding, use a basic system prompt
      systemPrompt = "You are an expert procurement analyst. Provide clear, actionable recommendations.";
      userPrompt = anonymizedUserPrompt;
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
            scenario_data: anonymizedScenarioData || {},
            industry_slug: industrySlug,
            category_slug: categorySlug,
            system_prompt: systemPrompt,
            user_prompt: userPrompt,
            grounding_context: groundingContext,
            anonymization_metadata: anonymizationMetadata,
            ...(userOrgId ? { organization_id: userOrgId } : {}),
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

      const llmOpts = { googleModel, tracer, parentRunId: parentRunId!, spanName: "" };

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

      // Run server-side validation on anonymized response
      const validation = await runServerValidation(finalContent, scenarioId, supabase);
      console.log(`[Sentinel] Multi-cycle validation: passed=${validation.passed}, confidence=${validation.confidenceScore}, issues=${validation.issues.length}`);

      // Deanonymize the final response for the client
      const multiDeanon = deanonymizeText(finalContent, anonymizationResult.entityMap);
      if (multiDeanon.metadata.unmappedTokens.length > 0) {
        console.warn("[Sentinel] Multi-cycle unmapped tokens:", multiDeanon.metadata.unmappedTokens);
      }

      // Log final result with ANONYMIZED content for privacy
      if (enableTestLogging && supabase && promptId) {
        try {
          await supabase.from("test_reports").insert({
            prompt_id: promptId,
            model: googleModel,
            raw_response: finalContent,
            processing_time_ms: processingTime,
            success: true,
            validation_result: validation,
            ...(userOrgId ? { organization_id: userOrgId } : {}),
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
        source: "google_ai_studio",
        validationPassed: validation.passed,
        validationConfidence: validation.confidenceScore,
      });

      return new Response(
        JSON.stringify({
          content: multiDeanon.restoredText,
          validation,
          model: googleModel,
          source: "google_ai_studio",
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

    // --- Child Run 3: ai-inference ---
    const inferenceRunId = tracer.createRun("ai-inference", "llm", {
      model: googleModel, promptLengths: { system: systemPrompt.length, user: userPrompt.length },
    }, { parentRunId });

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000];

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.warn(`[Sentinel] Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${RETRY_DELAYS[attempt - 1]}ms`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
        }

        const aiResponse = await callGoogleAI({
          systemPrompt,
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          temperature: 0.4,
          maxOutputTokens: 4096,
          model: googleModel,
        });

        const processingTime = Math.round(performance.now() - startTime);
        const rawContent = aiResponse.text || "";

        // Extract and strip shadow_log from response
        const { cleanContent: content, shadowLog } = extractShadowLog(rawContent);
        if (shadowLog) {
          console.log("[Sentinel] Shadow log extracted:", JSON.stringify(shadowLog));
        }

        const usage = aiResponse.usageMetadata ? {
          prompt_tokens: aiResponse.usageMetadata.promptTokenCount || 0,
          completion_tokens: aiResponse.usageMetadata.candidatesTokenCount || 0,
          total_tokens: aiResponse.usageMetadata.totalTokenCount || 0,
        } : null;

        // Run server-side validation on anonymized response
        const validation = await runServerValidation(content, scenarioType, supabase);

        // Deanonymize the response for the client
        const singleDeanon = deanonymizeText(content, anonymizationResult.entityMap);
        if (singleDeanon.metadata.unmappedTokens.length > 0) {
          console.warn("[Sentinel] Single-pass unmapped tokens:", singleDeanon.metadata.unmappedTokens);
        }

        // Log successful response with ANONYMIZED content for privacy
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
              validation_result: validation,
              ...(userOrgId ? { organization_id: userOrgId } : {}),
            });
          } catch (reportError) {
            console.error("[Sentinel] Failed to log report:", reportError);
          }
        }

        tracer.patchRun(inferenceRunId, { contentLength: content.length, usage, processingTimeMs: processingTime, hasShadowLog: !!shadowLog });
        tracer.patchRun(parentRunId, { success: true, contentLength: content.length, source: "google_ai_studio", processingTimeMs: processingTime });

        return new Response(
          JSON.stringify({
            content: singleDeanon.restoredText, validation, model: googleModel, source: "google_ai_studio", usage, promptId, processingTimeMs: processingTime
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (aiError) {
        const status = (aiError as Error & { status?: number }).status;
        const processingTime = Math.round(performance.now() - startTime);

        // Retry on 503
        if (status === 503 && attempt < MAX_RETRIES - 1) {
          console.warn(`[Sentinel] Google AI Studio 503 on attempt ${attempt + 1}`);
          continue;
        }

        // Rate limit
        if (status === 429) {
          console.warn("[Sentinel] Rate limit exceeded");
          if (enableTestLogging && supabase && promptId) {
            await supabase.from("test_reports").insert({
              prompt_id: promptId, model: googleModel, raw_response: "", processing_time_ms: processingTime,
              success: false, error_message: "Rate limit exceeded",
              ...(userOrgId ? { organization_id: userOrgId } : {}),
            });
          }
          tracer.patchRun(inferenceRunId, undefined, "Rate limit exceeded (429)");
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Final attempt exhausted or non-retryable error
        if (attempt === MAX_RETRIES - 1) {
          const errorMessage = aiError instanceof Error ? aiError.message : "AI error";
          console.error("[Sentinel] AI error after retries:", errorMessage);
          if (enableTestLogging && supabase && promptId) {
            await supabase.from("test_reports").insert({
              prompt_id: promptId, model: googleModel, raw_response: "", processing_time_ms: processingTime,
              success: false, error_message: errorMessage,
              ...(userOrgId ? { organization_id: userOrgId } : {}),
            });
          }
          tracer.patchRun(inferenceRunId, undefined, errorMessage);
          return new Response(
            JSON.stringify({ error: "AI service error", details: errorMessage }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Should not reach here, but safety fallback
    tracer.patchRun(inferenceRunId, undefined, "All retry attempts exhausted");
    return new Response(
      JSON.stringify({ error: "AI service unavailable after retries" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
