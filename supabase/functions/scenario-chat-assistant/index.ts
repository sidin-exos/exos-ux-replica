import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { LangSmithTracer } from "../_shared/langsmith.ts";
import {
  parseBody,
  requireString,
  requireArray,
  optionalRecord,
  validationErrorResponse,
  ValidationError,
} from "../_shared/validate.ts";
import { sanitizeMessages } from "../_shared/anonymizer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(
  scenarioFields: { id: string; label: string; description: string; required: boolean; type: string; placeholder?: string }[],
  dataRequirements: string,
  extractedSoFar: Record<string, string>
): string {
  const filledIds = Object.keys(extractedSoFar);
  const pending = scenarioFields.filter((f) => !filledIds.includes(f.id));
  const filled = scenarioFields.filter((f) => filledIds.includes(f.id));

  const fieldList = scenarioFields
    .map((f) => {
      const status = filledIds.includes(f.id) ? "✅ filled" : "⬜ pending";
      return `- **${f.label}** (id: ${f.id}, ${f.required ? "required" : "optional"}, ${status}): ${f.description}${f.placeholder ? ` — Example: ${f.placeholder}` : ""}`;
    })
    .join("\n");

  return `You are the EXOS Procurement Data Assistant. Your role is to help users fill in scenario analysis fields through conversation.

## Your Behavior
- Walk through PENDING fields one at a time (or in small logical groups).
- For each field, explain: what it means, why the analysis needs it, and where to find the data (ERP systems, finance team, supplier contracts, market reports).
- If the user provides data, extract it and call the \`update_fields\` tool with the extracted values.
- Be concise and professional. Never fabricate data or suggest specific values — only explain what's needed.
- Note GDPR considerations when asking for supplier names, pricing, or contract details: remind users that data is anonymized before AI processing.
- If a field is already filled, skip it unless the user wants to update it.

## Scenario Fields
${fieldList}

## Progress
- Filled: ${filled.length}/${scenarioFields.length}
- Pending: ${pending.length} field(s)${pending.length > 0 ? `: ${pending.map((f) => f.label).join(", ")}` : ""}

## Data Requirements Context
${dataRequirements || "No additional data requirements specified."}

## Rules
- NEVER invent numbers, names, or values.
- When the user provides information, extract it into the correct field(s) using the update_fields tool.
- If a value is ambiguous, ask for clarification.
- Keep responses under 200 words unless the user asks for more detail.`;
}

function buildToolSchema(
  scenarioFields: { id: string; label: string; description: string }[]
) {
  const properties: Record<string, { type: string; description: string }> = {};
  for (const field of scenarioFields) {
    properties[field.id] = {
      type: "string",
      description: `Value for "${field.label}": ${field.description}`,
    };
  }

  return [
    {
      type: "function",
      function: {
        name: "update_fields",
        description:
          "Extract and update scenario field values from the user's message. Only include fields that the user has clearly provided data for.",
        parameters: {
          type: "object",
          properties,
          additionalProperties: false,
        },
      },
    },
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const tracer = new LangSmithTracer({
    env: "production",
    feature: "scenario-chat-assistant",
  });

  let parentRunId: string | undefined;

  try {
    // Auth
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

    // Parse & validate
    const body = await parseBody(req);

    const messages = requireArray(body.messages, "messages", { maxLength: 30 }) as {
      role: string;
      content: string;
    }[];
    const scenarioId = requireString(body.scenarioId, "scenarioId", { maxLength: 100 })!;
    const scenarioFields = requireArray(body.scenarioFields, "scenarioFields", {
      maxLength: 30,
    }) as { id: string; label: string; description: string; required: boolean; type: string; placeholder?: string }[];
    const dataRequirements = requireString(body.dataRequirements, "dataRequirements", {
      maxLength: 10000,
      optional: true,
    }) ?? "";
    const extractedSoFar = (optionalRecord(body.extractedSoFar, "extractedSoFar") ?? {}) as Record<string, string>;

    // Sanitize PII
    const sanitizedMessages = sanitizeMessages(messages);

    // Build prompt and tools
    const systemPrompt = buildSystemPrompt(scenarioFields, dataRequirements, extractedSoFar);
    const tools = buildToolSchema(scenarioFields);

    const llmMessages = [
      { role: "system", content: systemPrompt },
      ...sanitizedMessages,
    ];

    // Trace
    if (tracer.isEnabled()) {
      parentRunId = tracer.createRun(
        "scenario-chat-assistant",
        "chain",
        {
          scenarioId,
          fieldCount: scenarioFields.length,
          messageCount: messages.length,
          filledCount: Object.keys(extractedSoFar).length,
        },
        { tags: ["scenario-chat", scenarioId] }
      );
    }

    // LLM call
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const llmResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: llmMessages,
          tools,
          temperature: 0.2,
        }),
      }
    );

    if (!llmResponse.ok) {
      const status = llmResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({
            error: "The AI service is currently busy. Please wait a moment and try again.",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI usage limit reached. Please check your workspace credits.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await llmResponse.text();
      console.error("AI gateway error:", status, errorText);
      throw new Error(`AI gateway returned ${status}`);
    }

    const llmData = await llmResponse.json();
    const choice = llmData.choices?.[0];

    // Parse response
    let content = choice?.message?.content ?? "";
    let extractedFields: Record<string, string> | undefined;

    // Extract tool calls
    const toolCalls = choice?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      for (const tc of toolCalls) {
        if (tc.function?.name === "update_fields") {
          try {
            const args = JSON.parse(tc.function.arguments);
            // Only keep keys that match scenario field IDs
            const validIds = new Set(scenarioFields.map((f) => f.id));
            const filtered: Record<string, string> = {};
            for (const [key, value] of Object.entries(args)) {
              if (validIds.has(key) && typeof value === "string" && value.trim()) {
                filtered[key] = value.trim();
              }
            }
            if (Object.keys(filtered).length > 0) {
              extractedFields = { ...extractedFields, ...filtered };
            }
          } catch (e) {
            console.error("Failed to parse tool call arguments:", e);
          }
        }
      }
    }

    // If no text content but tool calls exist, provide a default message
    if (!content && extractedFields) {
      const fieldNames = Object.keys(extractedFields)
        .map((id) => scenarioFields.find((f) => f.id === id)?.label ?? id)
        .join(", ");
      content = `I've captured the following fields: ${fieldNames}. What would you like to provide next?`;
    }

    // Trace success
    if (tracer.isEnabled() && parentRunId) {
      tracer.patchRun(parentRunId, {
        content: content?.slice(0, 200),
        extractedFieldCount: extractedFields ? Object.keys(extractedFields).length : 0,
      });
    }

    const result: { content: string; extractedFields?: Record<string, string> } = { content };
    if (extractedFields) {
      result.extractedFields = extractedFields;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scenario-chat-assistant error:", e);

    if (tracer.isEnabled() && parentRunId) {
      tracer.patchRun(parentRunId, undefined, e instanceof Error ? e.message : "Unknown error");
    }

    if (e instanceof ValidationError) {
      return validationErrorResponse(e.message);
    }

    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
