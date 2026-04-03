import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { LangSmithTracer } from "../_shared/langsmith.ts";
import { authenticateRequest, getUserOrgId } from "../_shared/auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { parseBody, requireString, requireStringEnum, requireArray, validationErrorResponse, ValidationError, filterPromptInjection } from "../_shared/validate.ts";

import { SentryReporter } from "../_shared/sentry.ts";
import { corsHeaders } from "../_shared/cors.ts";

import {
  GROUP_AI_INSTRUCTIONS,
  GROUP_SCHEMAS,
  AI_PROMPT_CONTRACT,
  parseAIResponse,
  buildMarkdownFromEnvelope,
  SCENARIO_ID_REGISTRY,
  GROUP_LABELS,
} from "../_shared/output-schemas.ts";

type QueryType = 'supplier' | 'commodity' | 'industry' | 'regulatory' | 'm&a' | 'risk';
type RecencyFilter = 'day' | 'week' | 'month' | 'year';

interface IntelRequest {
  queryType: QueryType;
  query: string;
  recencyFilter?: RecencyFilter;
  domainFilter?: string[];
  context?: string;
  env?: string;
}

const QUERY_TYPE_PROMPTS: Record<QueryType, string> = {
  supplier: `You are a procurement intelligence analyst. Analyze supplier-related developments focusing on:
- Financial health indicators (revenue, profitability, debt levels, credit ratings)
- Operational challenges (production issues, quality problems, delivery delays)
- Strategic initiatives (expansions, new capabilities, partnerships)
- Leadership changes and organizational restructuring
- Customer wins/losses and market positioning
- Legal issues, regulatory actions, or compliance concerns

Flag any RED FLAGS that would concern a procurement professional. Structure your response with clear sections and actionable insights.`,

  commodity: `You are a commodity market analyst for procurement. Analyze commodity and raw material markets focusing on:
- Current price levels and recent price movements
- Supply/demand dynamics and inventory levels
- Major producer news and production disruptions
- Trade policy impacts (tariffs, sanctions, quotas)
- Weather and geopolitical factors affecting supply
- Forward price curves and market outlook

Provide procurement timing recommendations and risk mitigation strategies.`,

  industry: `You are an industry analyst supporting procurement strategy. Analyze industry trends focusing on:
- Market structure and competitive dynamics
- Technology disruption and innovation trends
- Pricing trends and margin pressures
- Consolidation and market concentration
- New entrants and emerging competitors
- Regulatory trends affecting the industry

Highlight implications for procurement strategy and supplier relationships.`,

  regulatory: `You are a regulatory affairs analyst for procurement. Analyze regulatory developments focusing on:
- New regulations and compliance requirements
- Compliance timelines and deadlines
- Supply chain implications and requirements
- Required disclosures and documentation
- Penalties and enforcement actions
- Industry best practices for compliance

Provide a clear compliance checklist and action items for procurement teams.`,

  "m&a": `You are an M&A analyst tracking supplier and market consolidation. Analyze merger and acquisition activity focusing on:
- Recent and pending M&A transactions
- Strategic rationale and synergy expectations
- Impact on market concentration and pricing power
- Effects on supply capacity and service levels
- Integration risks and timeline expectations
- Counter-party risk implications

Assess impacts on existing supplier relationships and recommend contingency planning.`,

  risk: `You are a supply chain risk analyst. Identify supply chain risk signals focusing on:
- Disruption indicators (port congestion, labor strikes, natural disasters)
- Geopolitical risks (trade tensions, sanctions, political instability)
- Financial distress signals in key suppliers
- Capacity constraints and lead time extensions
- Transportation and logistics challenges
- Cyber threats and technology vulnerabilities

Prioritize risks by severity and provide early warning indicators to monitor.`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  // Authenticate request
  const authResult = await authenticateRequest(req);
  if ("error" in authResult) {
    return new Response(
      JSON.stringify({ error: authResult.error.message }),
      { status: authResult.error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Rate limit: 20 requests/hour per user (calls paid Perplexity API)
  const rateCheck = await checkRateLimit(authResult.user.userId, "market-intelligence", 20, 60, { failClosed: true });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck, corsHeaders, "Market intelligence rate limit reached. Please wait before sending another query.");
  }

  const userOrgId = await getUserOrgId(authResult.user.userId);
  if (!userOrgId) {
    return new Response(
      JSON.stringify({ error: "User has no organization" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    const body = await parseBody(req);

    const VALID_QUERY_TYPES = ['supplier', 'commodity', 'industry', 'regulatory', 'm&a', 'risk'] as const;
    const VALID_RECENCY = ['day', 'week', 'month', 'year'] as const;

    const queryType = requireStringEnum(body.queryType, "queryType", VALID_QUERY_TYPES)! as QueryType;
    const query = requireString(body.query, "query", { minLength: 1, maxLength: 5000 })!;
    const recencyFilter = requireStringEnum(body.recencyFilter, "recencyFilter", VALID_RECENCY, { optional: true }) as RecencyFilter | undefined;
    const domainFilter = body.domainFilter !== undefined
      ? (requireArray(body.domainFilter, "domainFilter", { maxLength: 20 }) as string[])
      : undefined;
    const context = requireString(body.context, "context", { optional: true, maxLength: 5000 });
    const reqEnv = requireString(body.env, "env", { optional: true, maxLength: 50 });

    // Validate domain filter entries
    if (domainFilter) {
      for (const d of domainFilter) {
        if (typeof d !== "string" || d.length > 200) {
          throw new ValidationError("Each domain filter must be a string under 200 chars");
        }
      }
    }

    // Initialize LangSmith tracer (fire-and-forget)
    const tracer = new LangSmithTracer({ env: reqEnv, feature: "market_intelligence" });
    const parentRunId = tracer.createRun("market-intelligence", "chain", {
      queryType, queryLength: query?.length || 0, recencyFilter, domainFilter,
    }, { tags: ["model:sonar-pro"] });

    const baseSystemPrompt = QUERY_TYPE_PROMPTS[queryType];
    if (!baseSystemPrompt) {
      throw new Error(`Invalid queryType: ${queryType}`);
    }

    // Inject EXOS Output Schema v1.0 contract for Group E
    const schemaInjection = AI_PROMPT_CONTRACT
      + GROUP_AI_INSTRUCTIONS['E']
      + '\n\n'
      + GROUP_SCHEMAS['E'];
    const systemPrompt = baseSystemPrompt + '\n\n' + schemaInjection;

    // Build enriched query with optional context
    let enrichedQuery = query;
    if (context) {
      enrichedQuery = `Context: ${context}\n\nQuery: ${query}`;
    }

    // Build Perplexity API request
    const perplexityBody: Record<string, unknown> = {
      model: "sonar-pro",
      max_tokens: 5000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: enrichedQuery }
      ],
    };

    // Add optional filters
    if (recencyFilter) {
      perplexityBody.search_recency_filter = recencyFilter;
    }
    if (domainFilter && domainFilter.length > 0) {
      perplexityBody.search_domain_filter = domainFilter;
    }

    console.log("Calling Perplexity API with:", { queryType, recencyFilter, domainFilter });

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(perplexityBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 401) {
        throw new Error("Invalid API key. Please check your Perplexity API key configuration.");
      }
      throw new Error("Intelligence service temporarily unavailable");
    }

    const data = await response.json();
    const processingTimeMs = Date.now() - startTime;

    // Extract response content and citations, filter prompt injection
    const rawSummary = data.choices?.[0]?.message?.content || "";
    const injectionResult = filterPromptInjection(rawSummary);
    if (injectionResult.flagged) {
      console.warn("Prompt injection detected in Perplexity response:", injectionResult.matches);
    }
    const cleanedContent = injectionResult.cleaned;
    const citations = data.citations || [];
    
    // Extract token usage
    const tokenUsage = data.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    } : null;

    // Attempt to parse structured EXOS Output Schema v1.0
    const parsedEnvelope = parseAIResponse(cleanedContent);
    let summary = cleanedContent;
    let structured: Record<string, unknown> | undefined;

    if (parsedEnvelope?.schema_version === '1.0') {
      // Schema version validated
      summary = buildMarkdownFromEnvelope(parsedEnvelope);
      structured = parsedEnvelope as unknown as Record<string, unknown>;

      // GDPR flag logging
      if (parsedEnvelope.gdpr_flags?.length > 0) {
        console.warn('[MARKET-INTEL] GDPR flags in AI output', {
          scenario_id: parsedEnvelope.scenario_id,
          flag_count: parsedEnvelope.gdpr_flags.length,
        });
      }
    }

    // Trace child LLM run (fire-and-forget)
    const llmRunId = tracer.createRun("perplexity-sonar-pro", "llm", {
      model: "sonar-pro", queryType,
    }, { parentRunId });
    tracer.patchRun(llmRunId, {
      summaryLength: summary.length, citationCount: citations.length, tokenUsage, processingTimeMs,
      ...(parsedEnvelope?.schema_version === '1.0' ? {
        schema_version: '1.0',
        confidence_level: parsedEnvelope.confidence_level,
        data_gaps_count: parsedEnvelope.data_gaps?.length ?? 0,
        gdpr_flags_count: parsedEnvelope.gdpr_flags?.length ?? 0,
      } : {}),
    });

    // Format citations as structured objects
    const formattedCitations = citations.map((url: string, index: number) => ({
      index: index + 1,
      url,
    }));

    // Store query in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from("intel_queries").insert({
        query_type: queryType,
        query_text: query,
        recency_filter: recencyFilter || null,
        domain_filter: domainFilter || null,
        summary,
        citations: formattedCitations,
        raw_response: data,
        model_used: "sonar-pro",
        processing_time_ms: processingTimeMs,
        success: true,
        organization_id: userOrgId,
      });
    }

    // Patch parent trace run
    tracer.patchRun(parentRunId, {
      success: true, summaryLength: summary.length, citationCount: formattedCitations.length, processingTimeMs,
    });

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        citations: formattedCitations,
        queryType,
        processingTimeMs,
        model: "sonar-pro",
        tokenUsage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error.message);
    }
    const processingTimeMs = Date.now() - startTime;
    console.error("Market intelligence error:", error);
    new SentryReporter("market-intelligence").captureException(error, {
      userId: authResult.user.userId,
    });

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Patch parent trace with error (tracer may not exist if error was in parsing)
    try { tracer.patchRun(parentRunId, undefined, errorMessage); } catch (_) { /* noop */ }

    // Try to log failed query
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const body = await req.clone().json().catch(() => ({}));
        
        await supabase.from("intel_queries").insert({
          query_type: body.queryType || "unknown",
          query_text: body.query || "unknown",
          recency_filter: body.recencyFilter || null,
          domain_filter: body.domainFilter || null,
          model_used: "sonar-pro",
          processing_time_ms: processingTimeMs,
          success: false,
          error_message: errorMessage,
          organization_id: userOrgId,
        });
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
