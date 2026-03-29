import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { authenticateRequest, requireAdmin } from "../_shared/auth.ts";
import { parseBody, requireString, requireArray, optionalBoolean, validationErrorResponse, ValidationError, filterPromptInjection } from "../_shared/validate.ts";

import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { SentryReporter } from "../_shared/sentry.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface IndustryCategory {
  industrySlug: string;
  industryName: string;
  categorySlug: string;
  categoryName: string;
  geography?: string; // e.g., "EU", "US", "APAC", "Global"
}

interface GenerateRequest {
  combinations: IndustryCategory[];
  validateOnly?: boolean;
  defaultGeography?: string; // Applied to combinations without explicit geography
}

// Plausible industry+category combinations with expected high confidence
const PLAUSIBLE_COMBINATIONS: IndustryCategory[] = [
  { industrySlug: "pharma-life-sciences", industryName: "Pharma & Life Sciences", categorySlug: "lab-supplies", categoryName: "Lab Supplies" },
  { industrySlug: "automotive-oem", industryName: "Automotive (OEM)", categorySlug: "raw-materials-steel", categoryName: "Raw Materials (Steel)" },
  { industrySlug: "retail", industryName: "Retail", categorySlug: "logistics-small-parcel", categoryName: "Logistics (Small Parcel)" },
  { industrySlug: "saas-enterprise", industryName: "SaaS (Enterprise)", categorySlug: "it-software-saas", categoryName: "IT Software (SaaS)" },
  { industrySlug: "healthcare", industryName: "Healthcare", categorySlug: "mro-maintenance", categoryName: "MRO (Maintenance)" },
  { industrySlug: "electronics", industryName: "Electronics", categorySlug: "semiconductors", categoryName: "Semiconductors" },
  { industrySlug: "food-beverage", industryName: "Food & Beverage", categorySlug: "packaging-primary", categoryName: "Packaging (Primary)" },
  { industrySlug: "construction-infra", industryName: "Construction & Infra", categorySlug: "construction-materials", categoryName: "Construction Materials" },
  { industrySlug: "aerospace-defense", industryName: "Aerospace & Defense", categorySlug: "electronic-components", categoryName: "Electronic Components" },
  { industrySlug: "chemicals", industryName: "Chemicals", categorySlug: "chemicals-specialty", categoryName: "Chemicals (Specialty)" },
];

const VALIDATION_PROMPT = `You are a procurement industry expert. Evaluate how plausible this industry+category combination is for procurement analysis.

Industry: {{INDUSTRY}}
Procurement Category: {{CATEGORY}}

Rate the plausibility on a scale of 0.0 to 1.0 where:
- 1.0 = Highly relevant (this category is core to this industry's procurement)
- 0.7-0.9 = Relevant (common procurement category for this industry)
- 0.4-0.6 = Somewhat relevant (occasionally procured)
- 0.1-0.3 = Low relevance (rare for this industry)
- 0.0 = Not relevant (makes no sense)

Respond with ONLY a JSON object:
{"confidence": 0.85, "reasoning": "Brief explanation"}`;

const MARKET_INSIGHTS_PROMPT = `You are a senior procurement intelligence analyst with 20+ years of experience. Generate an exhaustive, deeply-researched market intelligence briefing for the following industry and procurement category combination.

Industry: {{INDUSTRY}}
Procurement Category: {{CATEGORY}}
Geographic Focus: {{GEOGRAPHY}}

Provide a comprehensive market intelligence report covering ALL of the following sections in depth:

## 1. EXECUTIVE SUMMARY
- 3-5 key takeaways for procurement leaders
- Overall market outlook (bullish/bearish/neutral) with justification
- Critical action items for the next 90 days

## 2. MARKET STRUCTURE & DYNAMICS
- Market size and growth rates (YoY, 5-year CAGR) in {{GEOGRAPHY}}
- Supply/demand balance and capacity utilization rates
- Market concentration (HHI, CR4/CR5 ratios if available)
- Entry barriers and switching costs
- Seasonal patterns and cyclicality

## 3. COMPETITIVE LANDSCAPE
- Top 10-15 suppliers in {{GEOGRAPHY}} with estimated market shares
- Recent M&A activity (last 24 months) and strategic implications
- New market entrants and disruptors
- Supplier financial health indicators
- Vertical integration trends

## 4. PRICING ANALYSIS
- Current price levels and 12-month price trajectory
- Key price drivers (raw materials, labor, energy, logistics)
- Price indices and benchmarks used in {{GEOGRAPHY}}
- Currency exposure and hedging considerations
- Total Cost of Ownership (TCO) components

## 5. SUPPLY CHAIN RISK ASSESSMENT
- Geopolitical risks affecting {{GEOGRAPHY}} supply chains
- Single points of failure and concentration risks
- Regulatory and compliance changes (current and pending)
- ESG/sustainability mandates and implications
- Force majeure history and vulnerability assessment
- Lead time volatility and inventory considerations

## 6. TECHNOLOGY & INNOVATION
- Emerging technologies disrupting this category
- Automation and digitalization trends
- Sustainability innovations and circular economy initiatives
- R&D investment levels and innovation pipeline
- Digital procurement tools and e-sourcing platforms

## 7. REGULATORY & COMPLIANCE LANDSCAPE
- Current regulations affecting procurement in {{GEOGRAPHY}}
- Upcoming regulatory changes (next 12-24 months)
- Certification and standard requirements
- Trade policy and tariff considerations
- Data privacy and security requirements

## 8. STRATEGIC PROCUREMENT OPPORTUNITIES
- Optimal timing for negotiations and tenders
- Negotiation leverage points and BATNA strategies
- Alternative sourcing regions and near-shoring options
- Volume consolidation and demand pooling opportunities
- Contract structure recommendations (length, pricing mechanisms)
- Supplier development and partnership opportunities

## 9. FORWARD-LOOKING INTELLIGENCE
- 12-month market forecast with confidence levels
- Emerging risks on the horizon
- Strategic scenarios (best case, base case, worst case)
- Early warning indicators to monitor

## 10. RECOMMENDED ACTIONS
- Immediate actions (0-30 days)
- Short-term initiatives (1-6 months)
- Strategic priorities (6-18 months)
- KPIs and success metrics

Be extremely specific and quantitative. Include actual company names, real data points, specific percentages, exact timeframes, and cite your sources. Reference {{GEOGRAPHY}}-specific regulations, standards, trade associations, and market dynamics. This report should be actionable for a Chief Procurement Officer making strategic decisions.`;

async function validateCombination(
  apiKey: string,
  industry: string,
  category: string
): Promise<{ confidence: number; reasoning: string }> {
  const prompt = VALIDATION_PROMPT
    .replace("{{INDUSTRY}}", industry)
    .replace("{{CATEGORY}}", category);

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Validation API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    console.error("Failed to parse validation response:", content);
  }
  
  return { confidence: 0.5, reasoning: "Unable to parse validation response" };
}

async function generateMarketInsights(
  apiKey: string,
  industry: string,
  category: string,
  geography: string
): Promise<{ content: string; citations: string[]; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null }> {
  const prompt = MARKET_INSIGHTS_PROMPT
    .replace("{{INDUSTRY}}", industry)
    .replace("{{CATEGORY}}", category)
    .replace(/\{\{GEOGRAPHY\}\}/g, geography);

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        { role: "system", content: "You are a world-class procurement intelligence analyst. Provide exhaustive, deeply-researched market intelligence with specific data points, exact figures, named companies, and cited sources. Be extremely thorough and quantitative. Your reports inform C-level procurement decisions worth millions." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 5000, // 5x increase for comprehensive insights
      search_recency_filter: "month",
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Market insights API error:", response.status, errorText);
    throw new Error(`Market insights API error: ${response.status}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || "";
  const injectionResult = filterPromptInjection(rawContent);
  if (injectionResult.flagged) {
    console.warn("Prompt injection detected in market insights:", injectionResult.matches);
  }

  return {
    content: injectionResult.cleaned,
    citations: data.citations || [],
    usage: data.usage || null,
  };
}

function extractInsightArrays(content: string): { trends: string[]; risks: string[]; opportunities: string[] } {
  const trends: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];

  // Extract key trends (items after "Market Conditions" or "Trends")
  const trendMatches = content.match(/(?:trend|condition|dynamic)[s]?[:\s]*[-•*]\s*([^\n]+)/gi);
  if (trendMatches) {
    trends.push(...trendMatches.slice(0, 5).map(m => m.replace(/^[^:]+:\s*[-•*]\s*/, '').trim()));
  }

  // Extract risk signals
  const riskMatches = content.match(/(?:risk|disrupt|threat|concern)[s]?[:\s]*[-•*]\s*([^\n]+)/gi);
  if (riskMatches) {
    risks.push(...riskMatches.slice(0, 5).map(m => m.replace(/^[^:]+:\s*[-•*]\s*/, '').trim()));
  }

  // Extract opportunities
  const oppMatches = content.match(/(?:opportunit|recommend|leverage|advantage)[ies]*[:\s]*[-•*]\s*([^\n]+)/gi);
  if (oppMatches) {
    opportunities.push(...oppMatches.slice(0, 5).map(m => m.replace(/^[^:]+:\s*[-•*]\s*/, '').trim()));
  }

  return { trends, risks, opportunities };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

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
  const rateCheck = await checkRateLimit(authResult.user.userId, "generate-market-insights", 10, 60, { failClosed: true });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck, corsHeaders);
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await parseBody(req);
    const validateOnly = optionalBoolean(body.validateOnly, "validateOnly") ?? false;
    const defaultGeography = requireString(body.defaultGeography, "defaultGeography", { optional: true, maxLength: 100 }) || "EU";
    const combinations = body.combinations !== undefined
      ? (requireArray(body.combinations, "combinations", { maxLength: 10 }) as IndustryCategory[])
      : undefined;

    // Validate each combination entry
    if (combinations) {
      for (const c of combinations) {
        if (typeof c !== "object" || c === null) throw new ValidationError("Each combination must be an object");
        const combo = c as Record<string, unknown>;
        requireString(combo.industrySlug, "industrySlug", { maxLength: 200 });
        requireString(combo.industryName, "industryName", { maxLength: 200 });
        requireString(combo.categorySlug, "categorySlug", { maxLength: 200 });
        requireString(combo.categoryName, "categoryName", { maxLength: 200 });
      }
    }

    const { combinations: _drop, validateOnly: _vd, defaultGeography: _dg, ...rest } = body as GenerateRequest;

    // Use provided combinations or default plausible ones
    const targetCombinations = combinations && combinations.length > 0 
      ? combinations 
      : PLAUSIBLE_COMBINATIONS.slice(0, 5);
    
    // Apply default geography to combinations that don't have one
    const combinationsWithGeo = targetCombinations.map(c => ({
      ...c,
      geography: c.geography || defaultGeography,
    }));

    const results: Array<{
      industry: string;
      category: string;
      confidence: number;
      success: boolean;
      error?: string;
      insightId?: string;
    }> = [];

    let totalTokens = 0;
    let totalCost = 0;

    for (const combo of combinationsWithGeo) {
      try {
        console.log(`Processing: ${combo.industryName} + ${combo.categoryName} [${combo.geography}]`);

        // Step 1: Validate combination plausibility
        const validation = await validateCombination(
          PERPLEXITY_API_KEY,
          combo.industryName,
          combo.categoryName
        );

        console.log(`Validation: confidence=${validation.confidence}, reason=${validation.reasoning}`);

        // Skip if confidence too low
        if (validation.confidence < 0.4) {
          results.push({
            industry: combo.industrySlug,
            category: combo.categorySlug,
            confidence: validation.confidence,
            success: false,
            error: `Low confidence: ${validation.reasoning}`,
          });
          continue;
        }

        if (validateOnly) {
          results.push({
            industry: combo.industrySlug,
            category: combo.categorySlug,
            confidence: validation.confidence,
            success: true,
          });
          continue;
        }

        // Step 2: Archive existing active insight
        await supabase
          .from("market_insights")
          .update({ is_active: false })
          .eq("industry_slug", combo.industrySlug)
          .eq("category_slug", combo.categorySlug)
          .eq("is_active", true);

        // Step 3: Generate market insights with geography focus
        const insights = await generateMarketInsights(
          PERPLEXITY_API_KEY,
          combo.industryName,
          combo.categoryName,
          combo.geography
        );

        if (insights.usage) {
          totalTokens += insights.usage.total_tokens;
          // Sonar-pro pricing: $5/1000 requests, roughly $0.003/1K tokens
          totalCost += (insights.usage.total_tokens / 1000) * 0.003;
        }

        // Extract structured data from content
        const { trends, risks, opportunities } = extractInsightArrays(insights.content);

        // Step 4: Store new insight
        const { data: insertedData, error: insertError } = await supabase
          .from("market_insights")
          .insert({
            industry_slug: combo.industrySlug,
            industry_name: combo.industryName,
            category_slug: combo.categorySlug,
            category_name: combo.categoryName,
            confidence_score: validation.confidence,
            content: insights.content,
            citations: insights.citations.map((url, i) => ({ index: i + 1, url })),
            key_trends: trends,
            risk_signals: risks,
            opportunities: opportunities,
            raw_response: { usage: insights.usage },
            model_used: "sonar-pro",
            processing_time_ms: Date.now() - startTime,
            is_active: true,
          })
          .select("id")
          .single();

        if (insertError) {
          throw new Error(`Insert error: ${insertError.message}`);
        }

        results.push({
          industry: combo.industrySlug,
          category: combo.categorySlug,
          confidence: validation.confidence,
          success: true,
          insightId: insertedData?.id,
        });

      } catch (error) {
        console.error(`Error processing ${combo.industrySlug}+${combo.categorySlug}:`, error);
        results.push({
          industry: combo.industrySlug,
          category: combo.categorySlug,
          confidence: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const processingTimeMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          processingTimeMs,
          totalTokens,
          estimatedCost: `$${totalCost.toFixed(4)}`,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error.message);
    }
    console.error("Generate market insights error:", error);
    new SentryReporter("generate-market-insights").captureException(error, {
      userId: authResult.user.userId,
    });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
