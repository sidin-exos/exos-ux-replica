import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseBody, requireString, validationErrorResponse, ValidationError } from "../_shared/validate.ts";
import { callGoogleAI } from "../_shared/google-ai.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return new Response(
        JSON.stringify({ error: authResult.error.message }),
        { status: authResult.error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: 30 requests/hour per user
    const rateCheck = await checkRateLimit(authResult.user.userId, "scenario-tutorial", 30, 60);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, corsHeaders);
    }

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

    const contextParts: string[] = [];
    if (industryName) contextParts.push(`Industry: ${industryName}`);
    if (categoryName) contextParts.push(`Category: ${categoryName}`);
    const contextStr = contextParts.join(", ");

    try {
      const response = await callGoogleAI({
        systemPrompt:
          "You are a procurement strategy advisor. Given a scenario name and an industry/category context, write 2-3 punchy bullet points explaining how this scenario solves real problems in that specific context. Markdown format. Under 100 words. No generic filler. Be specific and actionable.",
        contents: [
          {
            role: "user",
            parts: [{ text: `Scenario: "${scenarioTitle}"\nContext: ${contextStr}\n\nExplain how this scenario specifically benefits professionals in this context.` }],
          },
        ],
        temperature: 0.3,
        model: "gemini-3.1-flash-lite-preview",
      });

      const content = response.text || null;

      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (aiError) {
      const status = (aiError as Error & { status?: number }).status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw aiError;
    }
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
