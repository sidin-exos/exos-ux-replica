import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { LangSmithTracer } from "../_shared/langsmith.ts";
import { authenticateRequest, getUserOrgId } from "../_shared/auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { parseBody, requireString, optionalBoolean, optionalStringOrNull, optionalRecord, validationErrorResponse, ValidationError } from "../_shared/validate.ts";
import { callGoogleAI } from "../_shared/google-ai.ts";
import { anonymizeText, deanonymizeText, type AnonymizationResultServer } from "../_shared/anonymizer.ts";
import { SentryReporter } from "../_shared/sentry.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { trackEvent, trackOnceEvent, trackDailyEvent } from "../_shared/track.ts";
import {
  SCENARIO_GROUP_REGISTRY, SCENARIO_ID_REGISTRY, GROUP_LABELS,
  GROUP_AI_INSTRUCTIONS, GROUP_SCHEMAS, AI_PROMPT_CONTRACT,
  parseAIResponse, buildMarkdownFromEnvelope,
  type ExosOutputParsed,
} from "../_shared/output-schemas.ts";

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

function buildSynthesizerPrompt(scenarioGroup: string | null, scenarioId: string | null): string {
  // Synthesizer uses structured JSON output via schema injection
  const schemaInjection = scenarioGroup
    ? AI_PROMPT_CONTRACT + GROUP_AI_INSTRUCTIONS[scenarioGroup] + '\n\n' + GROUP_SCHEMAS[scenarioGroup]
    : '';

  const sid = scenarioId ? SCENARIO_ID_REGISTRY[scenarioId] || scenarioId : 'unknown';
  const groupLabel = scenarioGroup ? GROUP_LABELS[scenarioGroup] || scenarioGroup : 'unknown';

  return `You are a Senior Procurement Strategist producing the final deliverable for a client.

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

Use scenario_id "${sid}" and group "${scenarioGroup}" with group_label "${groupLabel}" in the envelope.

${schemaInjection}`;
}

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

interface ConstraintV2Item { id?: string; tier?: string; label: string; eu_ref?: string; procurement_impact?: string; blocker?: boolean; }
interface KpiV2Item { id?: string; label: string; direction?: string; exos_lever?: string; benchmark_signal?: string; }
interface CostDriverItem { driver: string; share_pct?: string; }
interface ProcLeverItem { lever: string; description?: string; }
interface FailureModeItem { mode: string; mitigation?: string; }

interface IndustryRow {
  name: string;
  slug: string;
  constraints: string[];
  kpis: string[];
  constraints_v2?: ConstraintV2Item[] | null;
  kpis_v2?: KpiV2Item[] | null;
}

interface CategoryRow {
  name: string;
  slug: string;
  characteristics: string;
  kpis: string[];
  category_group?: string | null;
  spend_type?: string | null;
  kraljic_position?: string | null;
  kraljic_rationale?: string | null;
  price_volatility?: string | null;
  market_structure?: string | null;
  supply_concentration?: string | null;
  key_cost_drivers?: CostDriverItem[] | null;
  procurement_levers?: ProcLeverItem[] | null;
  negotiation_dynamics?: string | null;
  should_cost_components?: string | null;
  eu_regulatory_context?: string | null;
  common_failure_modes?: FailureModeItem[] | null;
  exos_scenarios_primary?: string[] | null;
  exos_scenarios_secondary?: string[] | null;
  kpis_v2?: KpiV2Item[] | null;
}

function buildIndustryXML(industry: IndustryRow): string {
  const hasV2C = Array.isArray(industry.constraints_v2) && industry.constraints_v2.length > 0;
  const hasV2K = Array.isArray(industry.kpis_v2) && industry.kpis_v2.length > 0;

  const constraintsXML = hasV2C
    ? industry.constraints_v2!.map((c, i) => {
        const attrs = [`priority="${i + 1}"`, c.tier ? `tier="${escapeXML(c.tier)}"` : '', c.blocker ? `blocker="true"` : '', c.eu_ref ? `eu-ref="${escapeXML(c.eu_ref)}"` : ''].filter(Boolean).join(' ');
        const impact = c.procurement_impact ? `\n        <procurement-impact>${escapeXML(c.procurement_impact)}</procurement-impact>` : '';
        const blockerComment = c.blocker ? ' <!-- HARD GATE -->' : '';
        return `      <constraint ${attrs}>${escapeXML(c.label)}${impact}\n      </constraint>${blockerComment}`;
      }).join('\n')
    : industry.constraints.map((c, i) => `      <constraint priority="${i + 1}">${escapeXML(c)}</constraint>`).join('\n');

  const kpisXML = hasV2K
    ? industry.kpis_v2!.map((k, i) => {
        const attrs = [`index="${i + 1}"`, k.direction ? `direction="${escapeXML(k.direction)}"` : '', k.exos_lever ? `exos-lever="${escapeXML(k.exos_lever)}"` : '', k.benchmark_signal ? `benchmark="${escapeXML(k.benchmark_signal)}"` : ''].filter(Boolean).join(' ');
        return `      <kpi ${attrs}>${escapeXML(k.label)}</kpi>`;
      }).join('\n')
    : industry.kpis.map((k, i) => `      <kpi index="${i + 1}">${escapeXML(k)}</kpi>`).join('\n');

  return `<industry-context>
  <industry-name>${escapeXML(industry.name)}</industry-name>
  <industry-id>${escapeXML(industry.slug)}</industry-id>
  <regulatory-constraints>
    <description>Critical regulatory and operational constraints. All recommendations must account for these. Items flagged as blockers are hard decision gates.</description>
    <constraints>
${constraintsXML}
    </constraints>
  </regulatory-constraints>
  <performance-kpis>
    <description>Standard performance metrics for this industry.</description>
    <kpis>
${kpisXML}
    </kpis>
  </performance-kpis>
</industry-context>`;
}

function buildCategoryXML(category: CategoryRow): string {
  const hasV2K = Array.isArray(category.kpis_v2) && category.kpis_v2.length > 0;

  const kpisXML = hasV2K
    ? category.kpis_v2!.map((k, i) => {
        const attrs = [`index="${i + 1}"`, k.direction ? `direction="${escapeXML(k.direction)}"` : '', k.exos_lever ? `exos-lever="${escapeXML(k.exos_lever)}"` : '', k.benchmark_signal ? `benchmark="${escapeXML(k.benchmark_signal)}"` : ''].filter(Boolean).join(' ');
        return `      <kpi ${attrs}>${escapeXML(k.label)}</kpi>`;
      }).join('\n')
    : category.kpis.map((k, i) => `      <kpi index="${i + 1}">${escapeXML(k)}</kpi>`).join('\n');

  // Build enriched sections
  const enriched: string[] = [];

  if (category.kraljic_position) {
    enriched.push(`  <kraljic-position value="${escapeXML(category.kraljic_position)}">${category.kraljic_rationale ? escapeXML(category.kraljic_rationale) : ''}</kraljic-position>`);
  }
  if (category.price_volatility || category.market_structure || category.supply_concentration) {
    enriched.push(`  <market-dynamics>
    ${category.price_volatility ? `<price-volatility>${escapeXML(category.price_volatility)}</price-volatility>` : ''}
    ${category.market_structure ? `<market-structure>${escapeXML(category.market_structure)}</market-structure>` : ''}
    ${category.supply_concentration ? `<supply-concentration>${escapeXML(category.supply_concentration)}</supply-concentration>` : ''}
  </market-dynamics>`);
  }
  if (Array.isArray(category.key_cost_drivers) && category.key_cost_drivers.length > 0) {
    enriched.push(`  <key-cost-drivers>\n${category.key_cost_drivers.map(d => `      <driver${d.share_pct ? ` share="${escapeXML(d.share_pct)}"` : ''}>${escapeXML(d.driver)}</driver>`).join('\n')}\n  </key-cost-drivers>`);
  }
  if (Array.isArray(category.procurement_levers) && category.procurement_levers.length > 0) {
    enriched.push(`  <procurement-levers>\n${category.procurement_levers.map(l => `      <lever${l.description ? ` description="${escapeXML(l.description)}"` : ''}>${escapeXML(l.lever)}</lever>`).join('\n')}\n  </procurement-levers>`);
  }
  if (category.negotiation_dynamics) {
    enriched.push(`  <negotiation-dynamics>${escapeXML(category.negotiation_dynamics)}</negotiation-dynamics>`);
  }
  if (category.should_cost_components) {
    enriched.push(`  <should-cost-components>${escapeXML(category.should_cost_components)}</should-cost-components>`);
  }
  if (category.eu_regulatory_context) {
    enriched.push(`  <eu-regulatory-context>${escapeXML(category.eu_regulatory_context)}</eu-regulatory-context>`);
  }
  if (Array.isArray(category.common_failure_modes) && category.common_failure_modes.length > 0) {
    enriched.push(`  <common-failure-modes>\n${category.common_failure_modes.map(f => `      <failure-mode${f.mitigation ? ` mitigation="${escapeXML(f.mitigation)}"` : ''}>${escapeXML(f.mode)}</failure-mode>`).join('\n')}\n  </common-failure-modes>`);
  }

  return `<category-context>
  <category-name>${escapeXML(category.name)}</category-name>
  <category-id>${escapeXML(category.slug)}</category-id>
  ${category.category_group ? `<category-group>${escapeXML(category.category_group)}</category-group>` : ''}
  ${category.spend_type ? `<spend-type>${escapeXML(category.spend_type)}</spend-type>` : ''}
  <category-characteristics>
    <description>Key characteristics defining this procurement category.</description>
    <characteristics>${escapeXML(category.characteristics)}</characteristics>
  </category-characteristics>
${enriched.length > 0 ? enriched.join('\n') + '\n' : ''}  <category-kpis>
    <description>Standard performance metrics for this category.</description>
    <kpis>
${kpisXML}
    </kpis>
  </category-kpis>
  <system-instruction>If an item is flagged as a blocker or price volatility is high, treat it as a hard constraint requiring mitigation.</system-instruction>
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
  marketInsight: MarketInsightRow | null = null,
  _selectedDashboards: string[] = []
): { systemPrompt: string; userPrompt: string } {
  // Build system prompt with injected context
  const contextParts: string[] = [];

  if (industry) contextParts.push(buildIndustryXML(industry));
  if (category) contextParts.push(buildCategoryXML(category));
  if (marketInsight) contextParts.push(buildMarketIntelligenceXML(marketInsight));

  // Derive scenario group server-side
  const scenarioGroup = SCENARIO_GROUP_REGISTRY[scenarioType];
  const scenarioCode = SCENARIO_ID_REGISTRY[scenarioType] || scenarioType;
  const groupLabel = scenarioGroup ? GROUP_LABELS[scenarioGroup] || scenarioGroup : 'unknown';

  // Build schema injection (replaces legacy <dashboard-data> XML instructions)
  const schemaInjection = scenarioGroup
    ? AI_PROMPT_CONTRACT + GROUP_AI_INSTRUCTIONS[scenarioGroup] + '\n\n' + GROUP_SCHEMAS[scenarioGroup]
    : '';

  const systemPrompt = `You are an expert procurement analyst. Analyze the provided context and generate actionable recommendations.

IMPORTANT RULES:
1. Maintain all masked tokens exactly as provided (e.g., [SUPPLIER_A], [AMOUNT_B])
2. Do not attempt to guess or reveal masked information
3. Base recommendations on the provided industry/category context
4. Quantify recommendations with specific percentages or ranges when possible
5. Only cite specific data points from provided context
6. Flag uncertainty explicitly with confidence levels
7. Err on cautious side for savings projections

Use scenario_id "${scenarioCode}", scenario_name based on the analysis type, group "${scenarioGroup || 'A'}", and group_label "${groupLabel}" in the envelope.

${schemaInjection}

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
        maxOutputTokens: 8192,
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
  const rateCheck = await checkRateLimit(userId, "sentinel-analysis", 30, 60, { failClosed: true });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck, corsHeaders,
      "Analysis rate limit reached. Please wait before submitting another analysis."
    );
  }

  // Funnel: session_returned (CP6) — fire at most once/day if user signed up >= 7 days ago
  trackDailyEvent({
    userId,
    event: "session_returned",
    checkpoint: "CP6",
    computeProps: async (supabase) => {
      const { data } = await supabase
        .from("user_funnel_events")
        .select("created_at")
        .eq("user_id", userId)
        .eq("event_name", "user_signed_up")
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      const daysSince = Math.floor(
        (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSince < 7) return null;
      const { count } = await supabase
        .from("user_funnel_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("event_name", "session_returned");
      return { days_since_signup: daysSince, session_number: (count ?? 0) + 1 };
    },
  });

  // Declare tracer and parentRunId at function scope for error handler
  let tracer: LangSmithTracer | undefined;
  let parentRunId: string | undefined;

  try {
    const body = await parseBody(req);

    // Validate inputs
    const rawUserPrompt = requireString(body.userPrompt, "userPrompt", { minLength: 1, maxLength: 50000 })!;
    // Accept model/useGoogleAIStudio/stream for backward compat but always use Google AI Studio directly
    const rawGoogleModel = (requireString(body.googleModel, "googleModel", { optional: true, maxLength: 100 })
      || requireString(body.model, "model", { optional: true, maxLength: 100 })
      || "gemini-3.1-pro-preview").replace(/^google\//, "");
    // Server-side model whitelist — prevents cost amplification and model probing
    const ALLOWED_MODELS = [
      "gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-3-pro-preview",
      "gemini-3.1-flash-lite-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite",
    ];
    const googleModel = ALLOWED_MODELS.includes(rawGoogleModel) ? rawGoogleModel : "gemini-3.1-pro-preview";
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
    const selectedDashboards: string[] = Array.isArray(body.selectedDashboards) ? body.selectedDashboards.filter((d: unknown) => typeof d === "string").slice(0, 20) : [];
    const reqEnv = requireString(body.env, "env", { optional: true, maxLength: 50 });

    // === SERVER-SIDE ANONYMIZATION (fail-closed) ===
    let anonymizationResult: AnonymizationResultServer;
    try {
      anonymizationResult = anonymizeText(rawUserPrompt);
      console.log(`[Sentinel] Anonymized: ${anonymizationResult.metadata.entitiesFound} entities found, confidence=${anonymizationResult.metadata.confidence.toFixed(2)}`);
    } catch (anonymizationError) {
      console.error("[Sentinel] CRITICAL: Anonymization failed, aborting to prevent PII exposure:", anonymizationError);
      new SentryReporter("sentinel-analysis").captureException(anonymizationError, {
        userId,
        tags: { stage: "anonymization", scenarioType: scenarioType || "unknown" },
      });
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
            ? supabase.from("industry_contexts").select("name, slug, constraints, kpis, constraints_v2, kpis_v2").eq("slug", industrySlug).single()
            : Promise.resolve({ data: null, error: null }),
          categorySlug
            ? supabase.from("procurement_categories").select("name, slug, characteristics, kpis, category_group, spend_type, kraljic_position, kraljic_rationale, price_volatility, market_structure, supply_concentration, key_cost_drivers, procurement_levers, negotiation_dynamics, should_cost_components, eu_regulatory_context, common_failure_modes, exos_scenarios_primary, exos_scenarios_secondary, kpis_v2").eq("slug", categorySlug).single()
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
          insightResult.data as MarketInsightRow | null,
          selectedDashboards
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
      // Legacy path: client sent full prompts
      systemPrompt = body.systemPrompt;
      // Inject schema for structured output if scenario type is known
      const legacyGroup = scenarioType ? SCENARIO_GROUP_REGISTRY[scenarioType] : null;
      if (legacyGroup) {
        systemPrompt += '\n\n' + AI_PROMPT_CONTRACT + GROUP_AI_INSTRUCTIONS[legacyGroup] + '\n\n' + GROUP_SCHEMAS[legacyGroup];
      }
      userPrompt = anonymizedUserPrompt;
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
      const scenarioGroup = scenarioId ? SCENARIO_GROUP_REGISTRY[scenarioId] : null;

      // Cycle 1: Analyst Draft
      const draft = await callLLM(systemPrompt, userPrompt, { ...llmOpts, spanName: "Analyst_Draft" });
      console.log(`[Sentinel] Cycle 1 (Analyst Draft): ${draft.length} chars`);

      // Cycle 2: Auditor Critique
      const critiquePrompt = `<draft>\n${draft}\n</draft>\n\n<original-request>\n${userPrompt}\n</original-request>`;
      const critique = await callLLM(AUDITOR_SYSTEM_PROMPT, critiquePrompt, { ...llmOpts, spanName: "Auditor_Critique" });
      console.log(`[Sentinel] Cycle 2 (Auditor Critique): ${critique.length} chars`);

      // Cycle 3: Synthesizer Final (with schema injection)
      const synthPrompt = `<draft>\n${draft}\n</draft>\n<critique>\n${critique}\n</critique>\n<original-request>\n${userPrompt}\n</original-request>`;
      const finalContent = await callLLM(buildSynthesizerPrompt(scenarioGroup, scenarioId), synthPrompt, { ...llmOpts, spanName: "Synthesizer_Final" });
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

      // Try to parse structured envelope
      const parsedEnvelope = parseAIResponse(finalContent);
      let responseContent = multiDeanon.restoredText;
      if (parsedEnvelope?.schema_version === '1.0') {
        responseContent = buildMarkdownFromEnvelope(parsedEnvelope);
        // GDPR flag logging
        if (parsedEnvelope.gdpr_flags?.length > 0) {
          console.warn('[SENTINEL] GDPR flags in AI output', { scenario_id: parsedEnvelope.scenario_id, flag_count: parsedEnvelope.gdpr_flags.length });
        }
        tracer.patchRun(parentRunId!, {
          scenario_id: parsedEnvelope.scenario_id, confidence_level: parsedEnvelope.confidence_level,
          data_gaps_count: parsedEnvelope.data_gaps?.length ?? 0, gdpr_flags_count: parsedEnvelope.gdpr_flags?.length ?? 0,
          schema_version: parsedEnvelope.schema_version,
        });
      }

      // Funnel: first_action_completed (CP3) — only first analysis ever
      trackOnceEvent({ userId, event: "first_action_completed", checkpoint: "CP3", properties: { action_type: "scenario_started" } });
      // Funnel: report_generated (CP4)
      trackEvent({ userId, event: "report_generated", checkpoint: "CP4", properties: { report_type: scenarioType, scenario_id: scenarioId } });

      return new Response(
        JSON.stringify({
          content: responseContent,
          structured: parsedEnvelope?.schema_version === '1.0' ? parsedEnvelope : undefined,
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
          maxOutputTokens: 8192,
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

        // Try to parse structured envelope from single-pass
        const singleParsedEnvelope = parseAIResponse(content);
        let responseContent = singleDeanon.restoredText;
        if (singleParsedEnvelope?.schema_version === '1.0') {
          responseContent = buildMarkdownFromEnvelope(singleParsedEnvelope);
          if (singleParsedEnvelope.gdpr_flags?.length > 0) {
            console.warn('[SENTINEL] GDPR flags in AI output', { scenario_id: singleParsedEnvelope.scenario_id, flag_count: singleParsedEnvelope.gdpr_flags.length });
          }
        }

        tracer.patchRun(inferenceRunId, { contentLength: content.length, usage, processingTimeMs: processingTime, hasShadowLog: !!shadowLog,
          ...(singleParsedEnvelope?.schema_version === '1.0' ? { scenario_id: singleParsedEnvelope.scenario_id, confidence_level: singleParsedEnvelope.confidence_level, data_gaps_count: singleParsedEnvelope.data_gaps?.length ?? 0, schema_version: '1.0' } : {}),
        });
        tracer.patchRun(parentRunId, { success: true, contentLength: content.length, source: "google_ai_studio", processingTimeMs: processingTime });

        // Funnel: first_action_completed (CP3) — only first analysis ever
        trackOnceEvent({ userId, event: "first_action_completed", checkpoint: "CP3", properties: { action_type: "scenario_started" } });
        // Funnel: report_generated (CP4)
        trackEvent({ userId, event: "report_generated", checkpoint: "CP4", properties: { report_type: scenarioType, scenario_id: scenarioId } });

        return new Response(
          JSON.stringify({
            content: responseContent,
            structured: singleParsedEnvelope?.schema_version === '1.0' ? singleParsedEnvelope : undefined,
            validation, model: googleModel, source: "google_ai_studio", usage, promptId, processingTimeMs: processingTime
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
            JSON.stringify({ error: "AI service error", details: "The AI service encountered an error processing your request" }),
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
    new SentryReporter("sentinel-analysis").captureException(error, { userId });
    try { tracer?.patchRun(parentRunId!, undefined, error instanceof Error ? error.message : "Unknown error"); } catch (_) { /* noop */ }
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
