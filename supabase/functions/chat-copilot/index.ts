import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseBody, requireString, requireArray, validationErrorResponse, ValidationError } from "../_shared/validate.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { LangSmithTracer, classifyError } from "../_shared/langsmith.ts";
import { estimateCost } from "../_shared/ai-pricing.ts";
import { callGoogleAI, convertOpenAITools } from "../_shared/google-ai.ts";
import {
  buildScenarioNavBlock,
  type CoachingCardRow,
} from "../_shared/chatbot-instructions.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { SentryReporter } from "../_shared/sentry.ts";
import { corsHeaders } from "../_shared/cors.ts";

// ─── STATIC PROMPT SECTIONS (not methodology content) ───────────────────────

const AVAILABLE_PAGES = `## Available Pages

### Home (/)
The main landing page with an overview of all capabilities.

### Reports & Scenario Wizard (/reports)
The scenario wizard — users describe their procurement challenge and get a structured AI analysis. This is the primary entry point for running scenarios.

### Market Intelligence (/market-intelligence)
Real-time market research powered by AI. Query types: supplier intel, commodity pricing, industry trends, regulatory changes, M&A activity, risk signals.

### Features (/features)
Overview of the Sentinel AI pipeline and platform capabilities.

### Dashboard Showcase (/dashboards)
Preview all available dashboard visualizations (Kraljic, Risk Matrix, TCO, etc.).

### Pricing & FAQ (/pricing)
Subscription tiers, pricing information, and frequently asked questions. FAQ is at /pricing#faq and contact form at /pricing#contact.`;

const NAVIGATION_RULES = `## Navigation Rules
1. **NEVER navigate on the first message.** First understand the user's specific challenge through conversation.
2. Only use the navigate_to_scenario tool after at least 2 exchanges where the user has clearly expressed a specific need AND confirmed they want to go there.
3. For general questions like "How to use EXOS?" — explain capabilities WITHOUT navigating. List relevant scenarios and ask what resonates.
4. When you do navigate, prefer /reports for scenario analysis and /market-intelligence for market data.
5. Keep responses under 150 words unless the user asks for detail.`;

// ─── SYSTEM PROMPT BUILDER ──────────────────────────────────────────────────

async function buildSystemPrompt(
  currentPath: string,
  scenarios?: { id: string; title: string; description: string }[]
): Promise<string> {
  // Fetch methodology config from DB
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: configs, error: configError } = await supabase
    .from("methodology_config")
    .select("key, value")
    .in("key", ["bot_identity", "conversation_architecture", "gdpr_protocol", "escalation_protocol", "quick_references"]);

  if (configError) {
    console.error("chat-copilot: Failed to fetch methodology config:", configError);
  }

  const configMap: Record<string, string> = {};
  (configs || []).forEach((c: { key: string; value: string }) => { configMap[c.key] = c.value; });

  // Build system prompt base from DB values
  const systemPromptBase = `${configMap["bot_identity"] || ""}

${configMap["conversation_architecture"] || ""}

${AVAILABLE_PAGES}

${NAVIGATION_RULES}

${configMap["gdpr_protocol"] || ""}

${configMap["escalation_protocol"] || ""}

${configMap["quick_references"] || ""}`;

  // Build scenario nav block
  let scenarioBlock: string;

  if (scenarios && scenarios.length > 0) {
    const { data: navCards, error: navError } = await supabase
      .from("coaching_cards")
      .select("scenario_slug, trigger_phrases, navigation_guidance");

    if (navError) {
      console.error("chat-copilot: Failed to fetch coaching cards:", navError);
    }

    scenarioBlock = "\n\n" + buildScenarioNavBlock(scenarios, (navCards || []) as CoachingCardRow[]);
  } else {
    scenarioBlock = "\n\n## Scenarios\nNo scenario catalog was provided. Direct users to /reports to browse the full list.";
  }

  return `${systemPromptBase}${scenarioBlock}\n\nThe user is currently on: ${currentPath || "/"}`;
}

// ─── TOOLS ──────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "navigate_to_scenario",
      description:
        "Navigate the user to a specific page or scenario in the EXOS platform",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "The route path to navigate to, e.g. /reports, /market-intelligence, /dashboards",
          },
        },
        required: ["path"],
      },
    },
  },
];

// ─── HANDLER ────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate
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

  // Rate limit: 20 requests/hour per user
  const rateCheck = await checkRateLimit(userId, "chat-copilot", 20, 60);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        content: "You're sending too many messages. Please wait a few minutes and try again.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateCheck.resetAt,
        },
      }
    );
  }

  // Init tracer
  const tracer = new LangSmithTracer({ env: "production", feature: "chat-copilot" });
  const startTime = Date.now();

  try {
    const body = await parseBody(req);

    const messages = requireArray(body.messages, "messages", { maxLength: 50 })!;
    if (messages.length === 0) {
      throw new ValidationError("messages array must not be empty");
    }
    for (const msg of messages) {
      if (typeof msg !== "object" || msg === null) throw new ValidationError("Each message must be an object");
      const m = msg as Record<string, unknown>;
      requireString(m.role, "message.role", { maxLength: 50 });
      requireString(m.content, "message.content", { maxLength: 10000 });
    }
    const currentPath = requireString(body.currentPath, "currentPath", { optional: true, maxLength: 500 });

    // Parse optional scenarios array
    const rawScenarios = requireArray(body.scenarios, "scenarios", { optional: true, maxLength: 50 });
    let parsedScenarios: { id: string; title: string; description: string }[] | undefined;
    if (rawScenarios && rawScenarios.length > 0) {
      parsedScenarios = rawScenarios
        .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
        .map((s) => ({
          id: String(s.id || ""),
          title: String(s.title || ""),
          description: String(s.description || ""),
        }))
        .filter((s) => s.id && s.title);
    }

    const systemPrompt = await buildSystemPrompt(currentPath || "/", parsedScenarios);

    // Create LangSmith parent run
    const parentRunId = tracer.createRun("chat-copilot", "chain", {
      userId,
      currentPath: currentPath || "/",
      messageCount: messages.length,
      scenarioCount: parsedScenarios?.length || 0,
      hasContext: !!currentPath && currentPath !== "/",
    }, { tags: ["chat", "model:gemini-2.5-pro"] });

    // Convert messages to Google format (frontend sends user/assistant roles)
    const typedMessages = messages as Array<{ role: string; content: string }>;
    const googleContents = typedMessages.map(m => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: m.content }],
    }));

    try {
      const aiResponse = await callGoogleAI({
        systemPrompt,
        contents: googleContents,
        temperature: 0.4,
        tools: convertOpenAITools(TOOLS),
      });

      let content = aiResponse.text || "";
      let action: { type: string; payload: string } | undefined;

      if (aiResponse.functionCall?.name === "navigate_to_scenario") {
        const args = aiResponse.functionCall.args;
        if (args.path) {
          action = { type: "NAVIGATE", payload: args.path as string };
        }
      }

      if (!content && action) {
        content = "Let me take you there.";
      }

      // Patch LangSmith with success
      const promptTokens = aiResponse.usageMetadata?.promptTokenCount;
      const completionTokens = aiResponse.usageMetadata?.candidatesTokenCount;
      tracer.patchRun(parentRunId, {
        content,
        hasAction: !!action,
        actionPath: action?.payload,
        promptTokens,
        completionTokens,
        totalTokens: aiResponse.usageMetadata?.totalTokenCount,
        estimatedCostUsd: estimateCost("gemini-2.5-pro", promptTokens, completionTokens),
        responseLength: content.length,
        processingTimeMs: Date.now() - startTime,
      });

      return new Response(JSON.stringify({ content, action }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (aiError) {
      const status = (aiError as Error & { status?: number }).status;
      if (status === 429) {
        tracer.patchRun(parentRunId, { errorType: "rate_limited" }, "rate_limited");
        return new Response(
          JSON.stringify({
            content: "I'm receiving too many requests right now. Please try again in a moment.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      tracer.patchRun(
        parentRunId,
        { errorType: classifyError(aiError) },
        aiError instanceof Error ? aiError.message : "AI error",
      );
      throw aiError;
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error.message);
    }
    console.error("chat-copilot error:", error);
    new SentryReporter("chat-copilot").captureException(error, { userId });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        error: errorMessage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
