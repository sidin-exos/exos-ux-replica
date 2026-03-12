/**
 * Edge Function: generate-pdf
 *
 * Generates a PDF report server-side using @react-pdf/renderer.
 * Accepts a POST with GeneratePdfPayload and returns binary PDF.
 *
 * Security:
 * - Rate limited: 20 requests/hour per user
 * - Input validated via shared validators (200KB max for analysisResult)
 * - Filename sanitized against header injection
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import {
  parseBody,
  requireString,
  optionalRecord,
  requireStringEnum,
  requireArray,
  validationErrorResponse,
  ValidationError,
} from "../_shared/validate.ts";
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

  try {
    // 1. Authenticate
    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return new Response(
        JSON.stringify({ error: authResult.error.message }),
        { status: authResult.error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Rate limit: 20 requests/hour per user
    const rateCheck = await checkRateLimit(authResult.user.userId, "generate-pdf", 20, 60);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, corsHeaders, "PDF generation rate limit reached. Please wait before generating another report.");
    }

    // 3. Parse and validate body
    const body = await parseBody(req);

    const scenarioTitle = requireString(body.scenarioTitle, "scenarioTitle", { maxLength: 500 })!;
    const analysisResult = requireString(body.analysisResult, "analysisResult", { maxLength: 200000 })!;
    const timestamp = requireString(body.timestamp, "timestamp", { maxLength: 50 })!;
    const formData = (optionalRecord(body.formData, "formData", 100) ?? {}) as Record<string, string>;
    const selectedDashboards = body.selectedDashboards !== undefined
      ? requireArray(body.selectedDashboards, "selectedDashboards", { maxLength: 20 }) as string[]
      : undefined;
    const pdfTheme = body.pdfTheme !== undefined
      ? requireStringEnum(body.pdfTheme, "pdfTheme", ["light", "dark"] as const)
      : undefined;

    const payload: GeneratePdfPayload = {
      scenarioTitle,
      analysisResult,
      formData,
      timestamp,
      selectedDashboards: selectedDashboards as GeneratePdfPayload["selectedDashboards"],
      pdfTheme: pdfTheme as GeneratePdfPayload["pdfTheme"],
    };

    // 4. Generate PDF
    const pdfBytes = await generatePdfBuffer(payload);

    // Sanitize filename to prevent Content-Disposition header injection
    const safeTitle = scenarioTitle
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 40);
    const fileName = `EXOS_${safeTitle}_${timestamp.split("T")[0]}.pdf`;

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
    if (err instanceof ValidationError) {
      return validationErrorResponse(err.message);
    }
    console.error("PDF generation failed:", err);
    return new Response(
      JSON.stringify({ error: "PDF generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
