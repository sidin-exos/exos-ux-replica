import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseBody, requireString, requireArray, validationErrorResponse, ValidationError } from "../_shared/validate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the EXOS Guide — a procurement strategy assistant embedded in the EXOS platform.

Your role: Help users identify which procurement scenario or tool best fits their challenge, then navigate them there.

## Available Pages & Scenarios

### Home (/)
The main landing page with an overview of all capabilities.

### Reports (/reports)
The scenario wizard — users describe their procurement challenge and get a structured AI analysis. This is the primary entry point for running scenarios like:
- **Volume Consolidation** — Combine spend across suppliers for leverage
- **Cost Breakdown Analysis** — Decompose costs to find savings
- **Make-or-Buy Decision** — Compare internal production vs. outsourcing
- **Supplier Risk Assessment** — Evaluate supplier financial/operational risk
- **Contract Negotiation Prep** — Build a negotiation strategy with BATNA
- **Scope of Work (SOW) Analysis** — Review and optimize SOW documents
- **Total Cost of Ownership (TCO)** — Full lifecycle cost comparison
- **Scenario Comparison** — Compare multiple strategic options side-by-side

### Market Intelligence (/market-intelligence)
Real-time market research powered by Perplexity. Query types: supplier intel, commodity pricing, industry trends, regulatory changes, M&A activity, risk signals.

### Features (/features)
Overview of the Sentinel AI pipeline and platform capabilities.

### Dashboard Showcase (/dashboards)
Preview all available dashboard visualizations (Kraljic, Risk Matrix, TCO, etc.).

### Pricing (/pricing)
Subscription tiers and pricing information.

### FAQ (/faq)
Frequently asked questions about the platform.

## Conversation Guidelines

1. Be concise and action-oriented. Procurement professionals value efficiency.
2. Ask clarifying questions to understand the user's specific challenge before recommending a scenario.
3. **NEVER navigate on the first message.** First understand the user's specific challenge through conversation.
4. Only use the navigate_to_scenario tool after at least 2 exchanges where the user has clearly expressed a specific need AND confirmed they want to go there.
5. For general questions like "How to use EXOS?", "What can you do?", or "Help me get started" — explain the platform capabilities WITHOUT navigating. List the available scenarios and ask what resonates.
6. When you do navigate, prefer /reports for scenario analysis and /market-intelligence for market data.
7. Never fabricate procurement data or savings estimates — that's what the scenarios are for.
8. Keep responses under 150 words unless the user asks for detail.`;

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body = await parseBody(req);

    const messages = requireArray(body.messages, "messages", { maxLength: 50 })!;
    if (messages.length === 0) {
      throw new ValidationError("messages array must not be empty");
    }
    // Validate each message has role and content strings
    for (const msg of messages) {
      if (typeof msg !== "object" || msg === null) throw new ValidationError("Each message must be an object");
      const m = msg as Record<string, unknown>;
      requireString(m.role, "message.role", { maxLength: 50 });
      requireString(m.content, "message.content", { maxLength: 10000 });
    }
    const currentPath = requireString(body.currentPath, "currentPath", { optional: true, maxLength: 500 });

    // Enrich system prompt with current location context
    const systemWithContext = `${SYSTEM_PROMPT}\n\nThe user is currently on: ${currentPath || "/"}`;

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
          messages: [
            { role: "system", content: systemWithContext },
            ...messages,
          ],
          tools: TOOLS,
          temperature: 0.4,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            content:
              "I'm receiving too many requests right now. Please try again in a moment.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            content:
              "AI usage credits have been exhausted. Please contact the administrator.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error("No response from AI model");
    }

    let content = choice.message?.content || "";
    let action: { type: string; payload: string } | undefined;

    // Check for tool calls (navigation)
    const toolCalls = choice.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      for (const tc of toolCalls) {
        if (tc.function?.name === "navigate_to_scenario") {
          try {
            const args = JSON.parse(tc.function.arguments);
            if (args.path) {
              action = { type: "NAVIGATE", payload: args.path };
            }
          } catch (e) {
            console.error("Failed to parse tool call arguments:", e);
          }
        }
      }
    }

    // If the model only returned tool calls with no text, provide a default message
    if (!content && action) {
      content = "Let me take you there.";
    }

    return new Response(JSON.stringify({ content, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error.message);
    }
    console.error("chat-copilot error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        content:
          "I'm having trouble connecting right now. Please try again in a moment.",
        error: errorMessage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
