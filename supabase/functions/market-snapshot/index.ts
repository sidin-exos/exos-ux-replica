import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { LangSmithTracer } from "../_shared/langsmith.ts";
import { authenticateRequest, getUserOrgId } from "../_shared/auth.ts";
import {
  parseBody,
  requireString,
  requireStringEnum,
  validationErrorResponse,
  ValidationError,
} from "../_shared/validate.ts";
import { callGoogleAI } from "../_shared/google-ai.ts";

import { corsHeaders } from "../_shared/cors.ts";

const VALID_REGIONS = [
  "Germany", "France", "UK", "Netherlands", "Spain", "Italy", "Poland",
  "USA", "Canada", "Mexico", "Brazil",
  "China", "Japan", "South Korea", "India", "Australia",
  "UAE", "Saudi Arabia", "South Africa",
] as const;

const VALID_TIMEFRAMES = [
  "Current Snapshot", "Past Month", "Past Quarter", "Past Year",
] as const;

/** Map user-facing timeframe to Perplexity search_recency_filter */
function mapTimeframeToRecency(timeframe: string): string | undefined {
  switch (timeframe) {
    case "Past Month": return "month";
    case "Past Quarter": return "month"; // Perplexity max is "month", covers quarter context
    case "Past Year": return "year";
    default: return undefined; // "Current Snapshot" = no filter
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  // Authenticate
  const authResult = await authenticateRequest(req);
  if ("error" in authResult) {
    return new Response(
      JSON.stringify({ error: authResult.error.message }),
      { status: authResult.error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userOrgId = await getUserOrgId(authResult.user.userId);
  if (!userOrgId) {
    return new Response(
      JSON.stringify({ error: "User has no organization" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // --- Validate secrets ---
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    // --- Parse & validate input ---
    const body = await parseBody(req);

    const region = requireStringEnum(body.region, "region", VALID_REGIONS)!;
    const analysisScope = requireString(body.analysisScope, "analysisScope", { minLength: 10, maxLength: 5000 })!;
    const successCriteria = requireString(body.successCriteria, "successCriteria", { optional: true, maxLength: 3000 });
    const timeframe = requireStringEnum(body.timeframe, "timeframe", VALID_TIMEFRAMES)!;
    const industryContext = requireString(body.industryContext, "industryContext", { optional: true, maxLength: 5000 });
    const reqEnv = requireString(body.env, "env", { optional: true, maxLength: 50 });

    // --- LangSmith tracing ---
    const tracer = new LangSmithTracer({ env: reqEnv, feature: "market_snapshot" });
    const parentRunId = tracer.createRun("market-snapshot", "chain", {
      region, analysisScopeLength: analysisScope.length, timeframe,
      hasSuccessCriteria: !!successCriteria, hasIndustryContext: !!industryContext,
    }, { tags: ["model:sonar-pro", "model:gemini-3.1-flash-lite-preview"] });

    // =====================================================
    // PHASE 1: Market Research (Perplexity Sonar Pro)
    // =====================================================
    const phase1RunId = tracer.createRun("phase1-perplexity-research", "llm", {
      model: "sonar-pro", region, timeframe,
    }, { parentRunId });

    const systemPrompt = `You are a senior market intelligence analyst producing a structured competitive landscape report.

CRITICAL REGIONAL CONSTRAINT:
You are analyzing ONLY the ${region} market. Do NOT include players, data, or trends from other regions unless they directly impact ${region}. Every company mentioned must have verified presence and operations in ${region}. If a global company is mentioned, focus exclusively on their ${region} operations, market share, and regional strategy.

${industryContext ? `INDUSTRY CONTEXT:\n${industryContext}\n` : ""}

OUTPUT STRUCTURE (use these exact headings):

## Regional Competitive Landscape: ${region}
Overview of the market structure, size estimates, and growth trajectory specific to ${region}.

## Major Players & Market Share
For each player (aim for 5-8):
- Company name and ${region}-specific headquarters/office
- Estimated market share in ${region} (% if available)
- Revenue or size indicators for ${region} operations
- Key products/services offered in ${region}

## Player Profiles
For each major player:
### [Company Name]
- **Strengths**: Regional competitive advantages
- **Weaknesses**: Known limitations in ${region}
- **Recent Moves**: M&A, expansions, partnerships, leadership changes (last 12 months)
- **Pricing Model**: How they price in ${region}

## Regional Risk Factors
Regulatory, geopolitical, economic factors specific to ${region} that affect this market.

## Recommended Sources for Further Discovery
List specific databases, trade associations, government statistics offices, and industry reports relevant to ${region} for deeper research. Include URLs where possible.

IMPORTANT: Cite your sources inline using [1], [2], etc. Be specific about data recency — flag any figure older than 12 months.`;

    const perplexityBody: Record<string, unknown> = {
      model: "sonar-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: analysisScope },
      ],
      temperature: 0.2,
    };

    const recencyFilter = mapTimeframeToRecency(timeframe);
    if (recencyFilter) {
      perplexityBody.search_recency_filter = recencyFilter;
    }

    console.log("[Phase 1] Calling Perplexity:", { region, timeframe, recencyFilter });

    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(perplexityBody),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error("[Phase 1] Perplexity error:", perplexityResponse.status, errorText);
      if (perplexityResponse.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
      if (perplexityResponse.status === 401) throw new Error("Invalid Perplexity API key.");
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    const perplexityData = await perplexityResponse.json();
    const researchOutput = perplexityData.choices?.[0]?.message?.content || "";
    const citations = (perplexityData.citations || []).map((url: string, i: number) => ({
      index: i + 1,
      url,
    }));

    const phase1TimeMs = Date.now() - startTime;
    tracer.patchRun(phase1RunId, {
      outputLength: researchOutput.length, citationCount: citations.length, processingTimeMs: phase1TimeMs,
    });

    console.log("[Phase 1] Complete:", { outputLength: researchOutput.length, citations: citations.length, ms: phase1TimeMs });

    // =====================================================
    // PHASE 2: Quality Gate (Lovable AI)
    // =====================================================
    const phase2Start = Date.now();
    const phase2RunId = tracer.createRun("phase2-quality-gate", "llm", {
      model: "gemini-3.1-flash-lite-preview", hasUserCriteria: !!successCriteria,
    }, { parentRunId });

    const qualityGatePrompt = `You are a quality assurance analyst for market intelligence reports. Your job is to benchmark a research output against success criteria and identify gaps.

RESEARCH OUTPUT TO EVALUATE:
${researchOutput}

USER'S ANALYSIS REQUEST:
${analysisScope}

REGION CONSTRAINT: ${region}

${successCriteria ? `USER-DEFINED SUCCESS CRITERIA:\n${successCriteria}` : "The user did not provide explicit success criteria. You MUST infer reasonable criteria from the analysis request above."}

YOUR TASK:
1. Define or confirm the success criteria (list each as a numbered item)
2. Score overall completeness (0-100) based on how well the research output meets each criterion
3. For each criterion, give a sub-score (0-100) and brief assessment
4. Identify specific GAPS — data points that are missing, unverified, or potentially outdated
5. If the user's original request was ambiguous or incomplete, generate CLARIFICATION QUESTIONS that would improve a follow-up analysis
6. Check REGIONAL ACCURACY — flag any information that appears to be about a different region
7. Suggest SPECIFIC SOURCES for filling gaps (industry databases, trade associations, government statistics, paid reports)

OUTPUT FORMAT (use these exact headings):

## Success Criteria
1. [Criterion] — Score: X/100 — [Assessment]
2. [Criterion] — Score: X/100 — [Assessment]
...

## Overall Completeness Score: X/100

## Gap Analysis
- [Gap 1]: [What's missing and why it matters]
- [Gap 2]: ...

## Regional Accuracy Check
- [Any non-regional data flagged, or "All data verified as ${region}-specific"]

## Clarification Questions
- [Question 1]: [Why this matters for improving the analysis]
- [Question 2]: ...
(If the request was clear and complete, state "No clarifications needed")

## Recommended Follow-up Sources
- [Source 1]: [URL or name] — [What gap it fills]
- [Source 2]: ...`;

    let qualityGateOutput = "";
    let completenessScore = 0;

    try {
      const qualityResponse = await callGoogleAI({
        contents: [{ role: "user", parts: [{ text: qualityGatePrompt }] }],
        temperature: 0.2,
        model: "gemini-3.1-flash-lite-preview",
      });

      qualityGateOutput = qualityResponse.text || "";

      const scoreMatch = qualityGateOutput.match(/Overall Completeness Score:\s*(\d+)/i);
      if (scoreMatch) {
        completenessScore = parseInt(scoreMatch[1], 10);
      }
    } catch (qualityError) {
      const status = (qualityError as Error & { status?: number }).status;
      console.error("[Phase 2] Quality gate error:", status, qualityError);

      if (status === 429) {
        qualityGateOutput = "## Quality Gate Unavailable\nRate limit reached. The market research above is complete but could not be benchmarked against success criteria. Please retry later.";
      } else {
        qualityGateOutput = "## Quality Gate Unavailable\nThe quality assessment could not be completed. The market research above is still valid.";
      }
    }

    const phase2TimeMs = Date.now() - phase2Start;
    tracer.patchRun(phase2RunId, {
      outputLength: qualityGateOutput.length, completenessScore, processingTimeMs: phase2TimeMs,
    });

    console.log("[Phase 2] Complete:", { completenessScore, ms: phase2TimeMs });

    // =====================================================
    // Combine & Store
    // =====================================================
    const totalProcessingTimeMs = Date.now() - startTime;

    // Build combined result for the Sentinel-compatible response format
    const combinedResult = `${researchOutput}\n\n---\n\n# Quality Gate Assessment\n\n${qualityGateOutput}`;

    // Store in intel_queries
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("intel_queries").insert({
        query_type: "market-snapshot",
        query_text: `[${region}] ${analysisScope}`,
        recency_filter: recencyFilter || null,
        summary: combinedResult.slice(0, 10000), // DB column limit safety
        citations,
        raw_response: { perplexity: perplexityData, completenessScore },
        model_used: "sonar-pro + gemini-3.1-flash-lite-preview",
        processing_time_ms: totalProcessingTimeMs,
        success: true,
        organization_id: userOrgId,
      });
    }

    // Patch parent trace
    tracer.patchRun(parentRunId, {
      success: true, completenessScore, citationCount: citations.length,
      processingTimeMs: totalProcessingTimeMs,
    });

    // Return Sentinel-compatible response format so GenericScenarioWizard can render it
    return new Response(
      JSON.stringify({
        success: true,
        result: combinedResult,
        citations,
        completenessScore,
        processingTimeMs: totalProcessingTimeMs,
        model: "sonar-pro + gemini-3.1-flash-lite-preview",
        phases: {
          research: { outputLength: researchOutput.length, citationCount: citations.length, processingTimeMs: phase1TimeMs },
          qualityGate: { completenessScore, processingTimeMs: phase2TimeMs },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error.message);
    }

    const processingTimeMs = Date.now() - startTime;
    console.error("[market-snapshot] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log failure
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const b = await req.clone().json().catch(() => ({}));
        await supabase.from("intel_queries").insert({
          query_type: "market-snapshot",
          query_text: b.analysisScope || "unknown",
          model_used: "sonar-pro",
          processing_time_ms: processingTimeMs,
          success: false,
          error_message: errorMessage,
          organization_id: userOrgId,
        });
      }
    } catch (logErr) {
      console.error("Failed to log error:", logErr);
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
