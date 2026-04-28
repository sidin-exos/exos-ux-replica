import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { callGoogleAI } from "../_shared/google-ai.ts";
import { LangSmithTracer, classifyError } from "../_shared/langsmith.ts";
import { estimateCost } from "../_shared/ai-pricing.ts";

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
        type: "STRING",
        description: `Drafted content for field "${f.label}".`,
      };
    }

    const tracer = new LangSmithTracer({
      env: "production",
      feature: "draft-scenario-fields",
    });
    const runId = tracer.createRun(
      "draft-scenario-fields",
      "llm",
      {
        scenarioType: scenarioTitle,
        fieldCount: fields.length,
        projectContextLength: projectContext.length,
      },
      { tags: ["model:gemini-3.1-pro-preview"] },
    );

    try {
      const aiResponse = await callGoogleAI({
        systemPrompt,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        temperature: 0.4,
        maxOutputTokens: 4096,
        tools: [
          {
            functionDeclarations: [
              {
                name: "draft_fields",
                description: "Return drafted text for each scenario input field.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    fields: {
                      type: "OBJECT",
                      properties,
                      required: fields.map((f) => f.id),
                    },
                  },
                  required: ["fields"],
                },
              },
            ],
          },
        ],
      });

      if (
        aiResponse.functionCall?.name !== "draft_fields" ||
        !aiResponse.functionCall.args
      ) {
        tracer.patchRun(
          runId,
          { errorType: "no_function_call" },
          "No structured response",
        );
        return new Response(JSON.stringify({ error: "No structured response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = aiResponse.functionCall.args as {
        fields: Record<string, string>;
      };

      const promptTokens = aiResponse.usageMetadata?.promptTokenCount;
      const completionTokens = aiResponse.usageMetadata?.candidatesTokenCount;
      tracer.patchRun(runId, {
        promptTokens,
        completionTokens,
        totalTokens: aiResponse.usageMetadata?.totalTokenCount,
        estimatedCostUsd: estimateCost(
          "gemini-3.1-pro-preview",
          promptTokens,
          completionTokens,
        ),
        draftedFieldCount: result.fields ? Object.keys(result.fields).length : 0,
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (aiError) {
      tracer.patchRun(
        runId,
        { errorType: classifyError(aiError) },
        aiError instanceof Error ? aiError.message : "AI error",
      );
      throw aiError;
    }
  } catch (e) {
    console.error("draft-scenario-fields error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
