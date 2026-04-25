import { callGoogleAI } from "../_shared/google-ai.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { LangSmithTracer, classifyError } from "../_shared/langsmith.ts";
import { estimateCost } from "../_shared/ai-pricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_DRIVERS = [
  { name: "Crude Oil Price", rationale: "Primary energy input affecting logistics, packaging, and petrochemical-derived materials." },
  { name: "Regional Labour Cost Index", rationale: "Labour cost inflation directly impacts unit economics and service delivery." },
  { name: "Container Freight Rate", rationale: "Shipping costs fluctuate with demand, fuel prices, and geopolitical disruptions." },
  { name: "Base Metal Index (Copper/Aluminium)", rationale: "Key industrial metals used in components and packaging." },
  { name: "Currency Exchange Volatility", rationale: "FX movements affect imported input costs and procurement competitiveness." },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = data.claims.sub as string;
    const rateCheck = await checkRateLimit(userId, "im-driver-propose", 30, 60, { failClosed: true });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, corsHeaders);
    }

    const body = await req.json();
    const goodsDefinition = body?.goods_definition;
    const driverCountTarget = body?.driver_count_target ?? 5;

    if (!goodsDefinition || typeof goodsDefinition !== "string") {
      return new Response(JSON.stringify({ error: "goods_definition is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tracer = new LangSmithTracer({ env: "production", feature: "im-driver-propose" });
    const runId = tracer.createRun(
      "im-driver-propose",
      "llm",
      {
        model: "gemini-2.5-pro",
        goodsDefinitionLength: goodsDefinition.length,
        driverCountTarget,
      },
      { tags: ["model:gemini-2.5-pro"] }
    );

    // Call Gemini 3.1 Pro with tool calling for structured output
    try {
      const response = await callGoogleAI({
        systemPrompt: `You are a procurement inflation analyst for the EU mid-market. Given a goods/service description, propose exactly ${driverCountTarget} price drivers that a non-specialist procurement manager should monitor. Each driver must be a specific, measurable economic factor — not generic categories. Focus on factors that have direct, quantifiable impact on the cost of the described goods/service.`,
        contents: [
          {
            role: "user",
            parts: [{ text: `Goods/service description: "${goodsDefinition}"\n\nPropose exactly ${driverCountTarget} inflation price drivers with name and rationale.` }],
          },
        ],
        temperature: 0.3,
        maxOutputTokens: 2048,
        tools: [
          {
            functionDeclarations: [
              {
                name: "propose_drivers",
                description: "Propose inflation price drivers for the given goods/service",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    drivers: {
                      type: "ARRAY",
                      description: `Exactly ${driverCountTarget} price drivers`,
                      items: {
                        type: "OBJECT",
                        properties: {
                          name: { type: "STRING", description: "Short, specific driver name (e.g. 'Brent Crude Oil Price')" },
                          rationale: { type: "STRING", description: "One-sentence explanation of why this driver affects the cost" },
                        },
                        required: ["name", "rationale"],
                      },
                    },
                  },
                  required: ["drivers"],
                },
              },
            ],
          },
        ],
      });

      // Extract drivers from function call response
      if (response.functionCall?.name === "propose_drivers" && Array.isArray(response.functionCall.args.drivers)) {
        const drivers = (response.functionCall.args.drivers as Array<{ name: string; rationale: string }>)
          .slice(0, driverCountTarget);

        const promptTokens = response.usageMetadata?.promptTokenCount;
        const completionTokens = response.usageMetadata?.candidatesTokenCount;
        tracer.patchRun(runId, {
          source: "ai",
          driverCount: drivers.length,
          hasFunctionCall: true,
          promptTokens,
          completionTokens,
          totalTokens: response.usageMetadata?.totalTokenCount,
          estimatedCostUsd: estimateCost("gemini-2.5-pro", promptTokens, completionTokens),
        });

        return new Response(JSON.stringify({ drivers, source: "ai" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If no function call, fall back
      console.warn("Gemini did not return a function call, using fallback drivers");
      const fbPromptTokens = response.usageMetadata?.promptTokenCount;
      const fbCompletionTokens = response.usageMetadata?.candidatesTokenCount;
      tracer.patchRun(runId, {
        source: "fallback",
        hasFunctionCall: false,
        promptTokens: fbPromptTokens,
        completionTokens: fbCompletionTokens,
        totalTokens: response.usageMetadata?.totalTokenCount,
        estimatedCostUsd: estimateCost("gemini-2.5-pro", fbPromptTokens, fbCompletionTokens),
      });
      return new Response(JSON.stringify({ drivers: FALLBACK_DRIVERS.slice(0, driverCountTarget), source: "fallback" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (aiError) {
      console.error("Gemini API error, using fallback:", aiError);
      tracer.patchRun(
        runId,
        { errorType: classifyError(aiError), source: "fallback", estimatedCostUsd: 0 },
        aiError instanceof Error ? aiError.message : "AI error",
      );
      return new Response(JSON.stringify({ drivers: FALLBACK_DRIVERS.slice(0, driverCountTarget), source: "fallback" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("im-driver-propose error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
