/**
 * Edge Function: generate-pdf
 *
 * Generates a PDF report server-side using @react-pdf/renderer.
 * Accepts a POST with GeneratePdfPayload and returns binary PDF.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";
import { generatePdfBuffer } from "./pdf-document.tsx";
import type { GeneratePdfPayload } from "./types.ts";

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 1. Authenticate
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const { data: { user: authUser }, error: authError } = await authClient.auth.getUser(token);

  if (authError || !authUser) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 2. Parse body
  let payload: GeneratePdfPayload;
  try {
    payload = await req.json();
    if (!payload.scenarioTitle || !payload.analysisResult || !payload.timestamp) {
      throw new Error("Missing required fields");
    }
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid request body: scenarioTitle, analysisResult, and timestamp are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 3. Generate PDF
  try {
    const pdfBytes = await generatePdfBuffer(payload);

    const fileName = `EXOS_${payload.scenarioTitle.replace(/\s+/g, "_")}_${payload.timestamp.split("T")[0]}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return new Response(
      JSON.stringify({ error: "PDF generation failed", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
