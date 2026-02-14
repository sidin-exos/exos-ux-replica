import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { parseBody, requireString, validationErrorResponse, ValidationError } from "../_shared/validate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  try {
    const body = await parseBody(req);

    const scenarioTitle = requireString(body.scenarioTitle, "scenarioTitle", { optional: true, maxLength: 500 });
    const industryName = requireString(body.industryName, "industryName", { optional: true, maxLength: 200 });
    const categoryName = requireString(body.categoryName, "categoryName", { optional: true, maxLength: 200 });

    // Guard: no context = no AI call
    if (!industryName && !categoryName) {
      return new Response(JSON.stringify({ content: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const contextParts: string[] = [];
    if (industryName) contextParts.push(`Industry: ${industryName}`);
    if (categoryName) contextParts.push(`Category: ${categoryName}`);
    const contextStr = contextParts.join(", ");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "You are a procurement strategy advisor. Given a scenario name and an industry/category context, write 2-3 punchy bullet points explaining how this scenario solves real problems in that specific context. Markdown format. Under 100 words. No generic filler. Be specific and actionable.",
            },
            {
              role: "user",
              content: `Scenario: "${scenarioTitle}"\nContext: ${contextStr}\n\nExplain how this scenario specifically benefits professionals in this context.`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? null;

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof ValidationError) {
      return validationErrorResponse(e.message);
    }
    console.error("scenario-tutorial error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
