import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SentryReporter } from "../_shared/sentry.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { LangSmithTracer, classifyError } from "../_shared/langsmith.ts";
import { estimateCost } from "../_shared/ai-pricing.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let tracer: LangSmithTracer | undefined;
  let runId: string | undefined;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateCheck = await checkRateLimit(user.id, "run-inflation-scan", 10, 60, { failClosed: true });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, corsHeaders);
    }

    const { tracker_id } = await req.json();
    if (!tracker_id) {
      return new Response(JSON.stringify({ error: "tracker_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get tracker
    const { data: tracker, error: trackerError } = await adminClient
      .from("inflation_trackers")
      .select("*")
      .eq("id", tracker_id)
      .single();

    if (trackerError || !tracker) {
      return new Response(JSON.stringify({ error: "Tracker not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify org access
    const { data: profile } = await adminClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.organization_id !== tracker.organization_id) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active drivers
    const { data: drivers, error: driversError } = await adminClient
      .from("inflation_drivers")
      .select("*")
      .eq("tracker_id", tracker_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (driversError) throw driversError;
    if (!drivers || drivers.length === 0) {
      return new Response(JSON.stringify({ error: "No active drivers to scan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a combined prompt for all drivers
    const driverList = drivers.map((d: any, i: number) =>
      `${i + 1}. **${d.driver_name}**${d.trigger_description ? ` — Trigger: ${d.trigger_description}` : ""}${d.rationale ? ` — Rationale: ${d.rationale}` : ""}`
    ).join("\n");

    const systemPrompt = `You are an expert procurement inflation analyst. You will analyse each inflation driver for the tracked goods/service and determine if conditions are improving, stable, or deteriorating.

For EACH driver, provide:
1. A status assessment: exactly one of **Improving**, **Stable**, or **Deteriorating**
2. A brief summary (2-3 sentences) of current market conditions
3. Key signals or data points supporting your assessment

Format your response as a structured report with a section for each driver. Use markdown formatting.
End with a brief overall outlook (2-3 sentences).

Be factual, cite sources where possible. This is a decision-support tool — present information for consideration, never prescribe.`;

    const userPrompt = `Analyse the following inflation drivers for "${tracker.goods_definition}":

${driverList}

Provide a current market scan for each driver. Focus on recent developments (last 1-2 weeks) and direction of change.`;

    const startTime = Date.now();

    tracer = new LangSmithTracer({ env: "production", feature: "run-inflation-scan" });
    runId = tracer.createRun(
      "run-inflation-scan",
      "llm",
      {
        model: "sonar-pro",
        trackerId: tracker_id,
        goodsDefinition: tracker.goods_definition,
        driverCount: drivers.length,
        systemPromptLen: systemPrompt.length,
        userPromptLen: userPrompt.length,
      },
      { tags: ["model:sonar-pro"] }
    );

    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        search_recency_filter: "week",
      }),
    });

    if (!perplexityResponse.ok) {
      const errBody = await perplexityResponse.text();
      throw new Error(`Perplexity API error [${perplexityResponse.status}]: ${errBody}`);
    }

    const result = await perplexityResponse.json();
    const processingTime = Date.now() - startTime;
    const content = result.choices?.[0]?.message?.content || "No content returned";
    const citations = result.citations || [];

    tracer.patchRun(runId, {
      contentLength: content.length,
      citationCount: citations.length,
      processingTimeMs: processingTime,
      promptTokens: result.usage?.prompt_tokens,
      completionTokens: result.usage?.completion_tokens,
      totalTokens: result.usage?.total_tokens,
      estimatedCostUsd: estimateCost("sonar-pro", result.usage?.prompt_tokens, result.usage?.completion_tokens),
    });

    // Store as a monitor report (reuse monitor_reports table via enterprise_trackers link)
    // First check if there's an enterprise_tracker linked, otherwise create a lightweight one
    let enterpriseTrackerId: string;

    const { data: existingEt } = await adminClient
      .from("enterprise_trackers")
      .select("id")
      .eq("name", `Inflation: ${tracker.goods_definition}`)
      .eq("organization_id", tracker.organization_id)
      .eq("tracker_type", "inflation")
      .limit(1)
      .single();

    if (existingEt) {
      enterpriseTrackerId = existingEt.id;
    } else {
      const { data: newEt, error: etErr } = await adminClient
        .from("enterprise_trackers")
        .insert({
          name: `Inflation: ${tracker.goods_definition}`,
          organization_id: tracker.organization_id,
          user_id: user.id,
          tracker_type: "inflation",
          parameters: { inflation_tracker_id: tracker_id },
          status: "active",
        })
        .select()
        .single();
      if (etErr) throw etErr;
      enterpriseTrackerId = (newEt as any).id;
    }

    // Save report
    const { data: report, error: insertError } = await adminClient
      .from("monitor_reports")
      .insert({
        tracker_id: enterpriseTrackerId,
        organization_id: tracker.organization_id,
        report_content: content,
        citations,
        model_used: "sonar-pro",
        processing_time_ms: processingTime,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save report: ${insertError.message}`);
    }

    // Update driver last_scanned_at
    const now = new Date().toISOString();
    for (const d of drivers) {
      await adminClient
        .from("inflation_drivers")
        .update({ last_scanned_at: now })
        .eq("id", d.id);
    }

    // Detect statuses from content and update drivers
    const contentLower = content.toLowerCase();
    for (const d of drivers) {
      const driverNameLower = (d as any).driver_name.toLowerCase();
      const driverSection = contentLower.indexOf(driverNameLower);
      if (driverSection === -1) continue;

      const sectionText = contentLower.substring(driverSection, driverSection + 500);
      let newStatus = "stable";
      if (sectionText.includes("**deteriorating**") || sectionText.includes("deteriorating")) {
        newStatus = "deteriorating";
      } else if (sectionText.includes("**improving**") || sectionText.includes("improving")) {
        newStatus = "improving";
      }

      await adminClient
        .from("inflation_drivers")
        .update({ current_status: newStatus })
        .eq("id", d.id);
    }

    return new Response(JSON.stringify({ success: true, report }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("run-inflation-scan error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (tracer && runId) {
      tracer.patchRun(runId, { errorType: classifyError(error) }, message);
    }
    new SentryReporter("run-inflation-scan").captureException(error, {
      userId: typeof user !== "undefined" ? user?.id : undefined,
    });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
