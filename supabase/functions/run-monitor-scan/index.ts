import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SentryReporter } from "../_shared/sentry.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Verify user with their JWT
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

    const { tracker_id } = await req.json();
    if (!tracker_id) {
      return new Response(JSON.stringify({ error: "tracker_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to read tracker and write report
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get tracker
    const { data: tracker, error: trackerError } = await adminClient
      .from("enterprise_trackers")
      .select("*")
      .eq("id", tracker_id)
      .single();

    if (trackerError || !tracker) {
      return new Response(JSON.stringify({ error: "Tracker not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user belongs to same org
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

    const params = tracker.parameters as Record<string, unknown>;
    const monitorType = params.monitor_type as string || "DM-2";

    // Build prompt based on monitor type
    let userPrompt = "";
    switch (monitorType) {
      case "DM-1":
        userPrompt = `Analyse the following procurement hypothesis and provide balanced evidence for and against. Present findings as a structured risk monitoring report.\n\nHypothesis: ${params.hypothesis}\nContext & Constraints: ${params.context_constraints}\n${params.existing_evidence ? `Existing Evidence: ${params.existing_evidence}` : ""}`;
        break;
      case "DM-2":
        userPrompt = `Provide a current risk assessment for the following entity. Cover supply continuity, financial exposure, regulatory compliance, operational performance, and strategic alignment.\n\nEntity Type: ${params.entity_type}\nContext: ${params.entity_context}\n${params.risk_data ? `Risk Data: ${params.risk_data}` : ""}`;
        break;
      case "DM-3":
        userPrompt = `Analyse the risk trajectory and dynamics for the following subject. Focus on direction and velocity of change rather than absolute position.\n\nTracking Subject: ${params.tracking_subject}\nBaseline & Context: ${params.baseline_context}\n${params.historical_data ? `Historical Data: ${params.historical_data}` : ""}`;
        break;
      case "DM-4":
        userPrompt = `Provide a geopolitical, regulatory, and logistics risk analysis for the following geography. Focus on recent developments and their procurement implications.\n\nCountry/Region: ${params.country_region}\nBusiness Context: ${params.geopolitical_context}\n${params.regulatory_notes ? `Regulatory Notes: ${params.regulatory_notes}` : ""}`;
        break;
      case "DM-5":
        userPrompt = `Analyse industry-level risk signals and structural shifts for the following sector. Cover M&A activity, capacity changes, technology disruption, and regulatory shifts.\n\nIndustry Scope: ${params.industry_scope}\nMarket Context: ${params.market_context}\n${params.known_disruptors ? `Known Disruptors: ${params.known_disruptors}` : ""}`;
        break;
      default:
        userPrompt = `Provide a risk monitoring update for: ${tracker.name}. Parameters: ${JSON.stringify(params)}`;
    }

    const systemPrompt = `You are an expert procurement risk analyst. Provide a concise, structured monitoring report. Use markdown formatting with clear sections. Focus on:
1. Current Status Summary (2-3 sentences)
2. Key Developments (bullet points of recent changes)
3. Risk Signals (emerging concerns or improvements)
4. Recommended Actions (actionable next steps for the procurement team)

When presenting tables, always place the Direction/Status column as the SECOND column (right after the risk area name). Use exactly one of these bold keywords for direction: **Improving**, **Stable**, **Deteriorating**, **Critical**, **Moderate**, **Low**.

Be factual, cite sources where possible. Flag direction of change (improving/stable/deteriorating) for each risk area. This is a decision-support tool — present information for consideration, never prescribe.`;

    const startTime = Date.now();

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

    // Save report with service role
    const { data: report, error: insertError } = await adminClient
      .from("monitor_reports")
      .insert({
        tracker_id,
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

    return new Response(JSON.stringify({ success: true, report }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("run-monitor-scan error:", error);
    new SentryReporter("run-monitor-scan").captureException(error, {
      userId: typeof user !== "undefined" ? user?.id : undefined,
    });
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
