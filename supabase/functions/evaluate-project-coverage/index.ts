import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface Section {
  heading: string;
  description: string;
}

interface RequestBody {
  scenarioTitle: string;
  description: string;
  fileNames: string[];
  sections: Section[];
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
    const { scenarioTitle, description, fileNames, sections } = body;

    if (!Array.isArray(sections) || sections.length === 0) {
      return new Response(JSON.stringify({ error: "sections required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectContext = [
      description?.trim() ? `Project description:\n${description.trim()}` : "(no description)",
      fileNames?.length ? `Attached files: ${fileNames.join(", ")}` : "(no files attached)",
    ].join("\n\n");

    const sectionsList = sections
      .map((s, i) => `${i + 1}. ${s.heading} — ${s.description}`)
      .join("\n");

    const systemPrompt = `You assess whether a procurement project's available context covers the recommended data sections for a specific analytical scenario. For each section, judge if the project content (description + attached file names) plausibly supplies that data. Be strict but fair — file names can imply coverage (e.g., "supplier_contracts.pdf" implies contract data). Return concise, actionable feedback.`;

    const userPrompt = `Scenario: ${scenarioTitle}

Recommended data sections:
${sectionsList}

Project context:
${projectContext}

For each section, decide coverage: "covered", "partial", or "missing". Provide a one-sentence reason.`;

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
              name: "report_coverage",
              description: "Report coverage assessment for each section.",
              parameters: {
                type: "object",
                properties: {
                  sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        heading: { type: "string" },
                        status: { type: "string", enum: ["covered", "partial", "missing"] },
                        reason: { type: "string" },
                      },
                      required: ["heading", "status", "reason"],
                      additionalProperties: false,
                    },
                  },
                  overallScore: {
                    type: "number",
                    description: "0-100 overall coverage score",
                  },
                  summary: { type: "string" },
                },
                required: ["sections", "overallScore", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_coverage" } },
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
    console.error("evaluate-project-coverage error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
