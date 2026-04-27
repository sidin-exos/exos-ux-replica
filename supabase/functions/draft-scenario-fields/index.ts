import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface FieldSpec {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
}

interface RequestBody {
  scenarioTitle: string;
  description: string;
  fileNames: string[];
  fields: FieldSpec[];
  /** Optional "what data do I need to prepare" sections for extra grounding. */
  sections?: { heading: string; description: string }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;
    const { scenarioTitle, description, fileNames, fields, sections } = body;

    if (!Array.isArray(fields) || fields.length === 0) {
      return new Response(JSON.stringify({ error: "fields required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectContext = [
      description?.trim() ? `Project description:\n${description.trim()}` : "(no description)",
      fileNames?.length ? `Attached files: ${fileNames.join(", ")}` : "(no files attached)",
    ].join("\n\n");

    const fieldsList = fields
      .map(
        (f, i) =>
          `${i + 1}. id: "${f.id}" — ${f.label}${
            f.description ? ` (${f.description})` : ""
          }${f.placeholder ? `\n   Example shape: ${f.placeholder}` : ""}`,
      )
      .join("\n");

    const sectionsBlock = sections?.length
      ? `\n\nRecommended data the scenario expects:\n${sections
          .map((s, i) => `${i + 1}. ${s.heading} — ${s.description}`)
          .join("\n")}`
      : "";

    const systemPrompt = `You are a senior procurement analyst. Given a project's free-text context, you draft well-structured input fields for a specific analytical scenario. Use only information present in the project context — never invent specific numbers, vendor names, or facts. Where information is missing, write a short bracketed prompt like "[TODO: add annual spend in EUR]" so the user can quickly fill the gap. Keep each field concise (3–8 lines), use bullet points where the field placeholder suggests them, and write in a neutral business-analyst tone.`;

    const userPrompt = `Scenario: ${scenarioTitle}

Fields to draft:
${fieldsList}${sectionsBlock}

Project context:
${projectContext}

Draft each field's content. Reuse facts from the project context. For any required fact that's missing, leave a clearly marked "[TODO: ...]" placeholder rather than fabricating a value.`;

    // Build dynamic schema: one string property per field id
    const properties: Record<string, unknown> = {};
    for (const f of fields) {
      properties[f.id] = {
        type: "string",
        description: `Drafted content for field "${f.label}".`,
      };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "draft_fields",
              description: "Return drafted text for each scenario input field.",
              parameters: {
                type: "object",
                properties: {
                  fields: {
                    type: "object",
                    properties,
                    required: fields.map((f) => f.id),
                    additionalProperties: false,
                  },
                },
                required: ["fields"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "draft_fields" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "No structured response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("draft-scenario-fields error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
