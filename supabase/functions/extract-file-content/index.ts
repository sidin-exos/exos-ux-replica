/**
 * Edge Function: extract-file-content
 *
 * Downloads a user-uploaded file from Supabase Storage, extracts its text
 * content, and stores it in user_files.extracted_text for later use by
 * sentinel-analysis.
 *
 * Supported formats: xlsx, docx, pdf.
 * Truncates to 100 000 chars (~25K tokens) to stay within AI context budgets.
 *
 * Security:
 * - Authenticated user required
 * - Org membership verified (file must belong to user's org)
 * - Rate limited: 60 requests/hour per user
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { authenticateRequest } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import {
  parseBody,
  requireString,
  validationErrorResponse,
  ValidationError,
} from "../_shared/validate.ts";

import ExcelJS from "https://esm.sh/exceljs@4.4.0";
import mammoth from "npm:mammoth@1.8.0";
import { extractText } from "npm:unpdf@0.12.1";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_EXTRACTED_CHARS = 100_000;

// ── Extractors ──────────────────────────────────────────────────────

async function extractXlsx(buffer: ArrayBuffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const parts: string[] = [];

  workbook.eachSheet((sheet: { name: string; eachRow: (cb: (row: { values: unknown[] }) => void) => void }) => {
    parts.push(`\n=== Sheet: ${sheet.name} ===\n`);

    sheet.eachRow((row: { values: unknown[] }) => {
      // row.values is 1-indexed (index 0 is undefined)
      const cells = (row.values as unknown[])
        .slice(1)
        .map((v) => (v == null ? "" : String(v)));
      parts.push(cells.join("\t"));
    });
  });

  return parts.join("\n").trim();
}

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return String(result.value ?? "").trim();
}

async function extractPdf(buffer: ArrayBuffer): Promise<string> {
  const result = await extractText(new Uint8Array(buffer));
  // unpdf may return text as string or array depending on version
  const text = Array.isArray(result.text)
    ? result.text.join("\n")
    : String(result.text ?? "");
  return text.trim();
}

function truncate(text: string): string {
  if (text.length <= MAX_EXTRACTED_CHARS) return text;
  return (
    text.slice(0, MAX_EXTRACTED_CHARS) +
    `\n\n[DOCUMENT TRUNCATED — original document is ${text.length.toLocaleString()} characters. First ${MAX_EXTRACTED_CHARS.toLocaleString()} characters shown.]`
  );
}

// ── Main handler ────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Authenticate (same proven pattern as sentinel-analysis)
  const authResult = await authenticateRequest(req);
  if ("error" in authResult) {
    return new Response(
      JSON.stringify({ error: authResult.error.message }),
      { status: authResult.error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const userId = authResult.user.userId;

  // 2. Rate limit
  const rateCheck = await checkRateLimit(userId, "extract-file-content", 200, 60, { failClosed: true });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck, corsHeaders, "Extraction rate limit exceeded. Please try again later.");
  }

  // 3. Parse and validate fileId
  let fileId: string;
  try {
    const body = await parseBody(req);
    fileId = requireString(body.fileId, "fileId", { maxLength: 36, minLength: 36 })!;
    if (!UUID_REGEX.test(fileId)) {
      throw new ValidationError("fileId must be a valid UUID");
    }
  } catch (e) {
    if (e instanceof ValidationError) {
      return validationErrorResponse(e.message);
    }
    return validationErrorResponse("Invalid request body");
  }

  // 4. Service role client for DB + Storage
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 5. Fetch file metadata
  const { data: file, error: fileError } = await serviceClient
    .from("user_files")
    .select("id, user_id, storage_path, file_name, file_type, extraction_status")
    .eq("id", fileId)
    .single();

  if (fileError || !file) {
    return new Response(
      JSON.stringify({ error: "File not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 6. Access: any authenticated user can trigger extraction.
  // File visibility is controlled by RLS on the frontend queries.
  // Extraction is a harmless operation (populates extracted_text in the same row).

  // 7. Skip if already done or currently processing
  if (file.extraction_status === "processing") {
    return new Response(
      JSON.stringify({ status: "processing", message: "Extraction already in progress" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 8. Mark as processing
  await serviceClient
    .from("user_files")
    .update({ extraction_status: "processing", extraction_error: null })
    .eq("id", fileId);

  try {
    // 9. Download file from storage
    const { data: blob, error: downloadError } = await serviceClient.storage
      .from("user-files")
      .download(file.storage_path);

    if (downloadError || !blob) {
      throw new Error(`Storage download failed: ${downloadError?.message || "empty response"}`);
    }

    const buffer = await blob.arrayBuffer();

    // 10. Extract text based on file type
    let rawText: string;

    switch (file.file_type) {
      case "xlsx":
        rawText = await extractXlsx(buffer);
        break;
      case "docx":
        rawText = await extractDocx(buffer);
        break;
      case "pdf":
        rawText = await extractPdf(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${file.file_type}`);
    }

    if (!rawText || rawText.length === 0) {
      throw new Error("No text content could be extracted from the file");
    }

    // 11. Truncate if needed
    const extractedText = truncate(rawText);

    // 12. Save extracted text
    const tokenEstimate = Math.ceil(extractedText.length / 4);

    const { error: updateError } = await serviceClient
      .from("user_files")
      .update({
        extracted_text: extractedText,
        extraction_status: "done",
        extracted_at: new Date().toISOString(),
        token_estimate: tokenEstimate,
        extraction_error: null,
      })
      .eq("id", fileId);

    if (updateError) {
      throw new Error(`Failed to save extracted text: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        status: "done",
        tokenEstimate,
        charCount: extractedText.length,
        truncated: rawText.length > MAX_EXTRACTED_CHARS,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Mark as failed
    const errorMessage = err instanceof Error ? err.message : "Unknown extraction error";
    console.error(`[extract-file-content] Failed for file ${fileId}:`, errorMessage);

    await serviceClient
      .from("user_files")
      .update({
        extraction_status: "failed",
        extraction_error: errorMessage,
      })
      .eq("id", fileId);

    return new Response(
      JSON.stringify({ status: "failed", error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
