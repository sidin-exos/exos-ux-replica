/**
 * Edge Function: generate-excel
 *
 * Generates an Excel (.xlsx) report server-side using ExcelJS.
 * Accepts a POST with GenerateExcelPayload and returns binary XLSX.
 *
 * Security:
 * - Rate limited: 120 requests/hour per user
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
  validationErrorResponse,
  ValidationError,
} from "../_shared/validate.ts";
import { SentryReporter } from "../_shared/sentry.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { generateExcelBuffer } from "./excel-document.ts";
import type { GenerateExcelPayload } from "./types.ts";

let authResult: { user: { userId: string } } | { error: { status: number; message: string } };

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
    authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return new Response(
        JSON.stringify({ error: authResult.error.message }),
        { status: authResult.error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Rate limit: 120 requests/hour per user
    const rateCheck = await checkRateLimit(authResult.user.userId, "generate-excel", 120, 60);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, corsHeaders, "Excel generation rate limit reached. Please wait before generating another report.");
    }

    // 3. Parse and validate body
    const body = await parseBody(req);

    const scenarioTitle = requireString(body.scenarioTitle, "scenarioTitle", { maxLength: 500 })!;
    const analysisResult = requireString(body.analysisResult, "analysisResult", { maxLength: 200000 })!;
    const timestamp = requireString(body.timestamp, "timestamp", { maxLength: 50 })!;
    const formData = (optionalRecord(body.formData, "formData", 100) ?? {}) as Record<string, string>;

    const payload: GenerateExcelPayload = {
      scenarioTitle,
      analysisResult,
      formData,
      timestamp,
    };

    // 4. Generate Excel
    const xlsxBytes = await generateExcelBuffer(payload);

    // Sanitize filename to prevent Content-Disposition header injection
    const safeTitle = scenarioTitle
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 40);
    const fileName = `EXOS_${safeTitle}_${timestamp.split("T")[0]}.xlsx`;

    return new Response(xlsxBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return validationErrorResponse(err.message);
    }
    console.error("Excel generation failed:", err);
    new SentryReporter("generate-excel").captureException(err, {
      userId: authResult && !("error" in authResult) ? authResult.user.userId : undefined,
    });
    return new Response(
      JSON.stringify({ error: "Excel generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
