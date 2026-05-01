import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { callGoogleAI } from "../_shared/google-ai.ts";
import { LangSmithTracer, classifyError } from "../_shared/langsmith.ts";
import { estimateCost } from "../_shared/ai-pricing.ts";

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

For each section, decide coverage: "covered", "partial", or "missing". Provide a one-sentence reason.

Then assign an overall score from 0 to 5, in 0.5-point increments only (allowed values: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5). Maximum is 5. Use this rubric:
- 5 = all sections fully covered, with explicit numbers, sources and calculated totals
- 4 = all sections present but at least one lacks explicit quantification (e.g. "implied rather than calculated")
- 3 = roughly half covered, analysis possible but limited
- 2 = significant gaps, results will be weak
- 1 = mostly missing, analysis not viable
- 0 = no usable context

IMPORTANT — predictive calibration: this score must correlate with the post-run analytical rigour score (0–100). A 4.5★ coverage must imply a likely rigour ≥ 80/100. If any section is "partial" because a key number is implied or missing, cap the score at 4.0★. If two or more sections are "partial" or any are "missing", cap at 3.5★.`;

    const tracer = new LangSmithTracer({
      env: "production",
      feature: "evaluate-project-coverage",
    });
    const runId = tracer.createRun(
      "evaluate-project-coverage",
      "llm",
      {
        scenarioType: scenarioTitle,
        projectContextLength: projectContext.length,
      },
      { tags: ["model:gemini-3.1-pro-preview"] },
    );

    try {
      const aiResponse = await callGoogleAI({
        systemPrompt,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        temperature: 0.3,
        maxOutputTokens: 2048,
        tools: [
          {
            functionDeclarations: [
              {
                name: "report_coverage",
                description: "Report coverage assessment for each section.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    sections: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          heading: { type: "STRING" },
                          status: {
                            type: "STRING",
                            enum: ["covered", "partial", "missing"],
                          },
                          reason: { type: "STRING" },
                        },
                        required: ["heading", "status", "reason"],
                      },
                    },
                    overallScore: {
                      type: "NUMBER",
                      description:
                        "Overall coverage score from 0 to 5, in 0.5 increments only. Maximum 5.",
                    },
                    summary: { type: "STRING" },
                  },
                  required: ["sections", "overallScore", "summary"],
                },
              },
            ],
          },
        ],
      });

      if (
        aiResponse.functionCall?.name !== "report_coverage" ||
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
        sections: Array<{ heading: string; status: string; reason: string }>;
        overallScore: number;
        summary: string;
      };

      // Clamp + snap to 0.5 increments, max 5
      if (typeof result.overallScore === "number") {
        const clamped = Math.max(0, Math.min(5, result.overallScore));
        result.overallScore = Math.round(clamped * 2) / 2;
      }

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
        overallScore: result.overallScore,
        fieldCount: Array.isArray(result.sections) ? result.sections.length : 0,
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
    console.error("evaluate-project-coverage error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
