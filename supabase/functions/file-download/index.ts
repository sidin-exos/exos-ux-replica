/**
 * Edge Function: file-download
 *
 * Generates short-lived signed URLs for file downloads.
 * Enforces org-scoped access: user must belong to the same org as the file.
 * Returns Content-Disposition: attachment to prevent inline XSS.
 *
 * Security:
 * - Rate limited: 30 requests/hour per user (fail-closed)
 * - UUID format validation on file_id
 * - Org membership verified via profiles table
 * - Signed URL expires in 60 seconds
 * - File access logged to audit table
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from "../_shared/env.ts";
import { getUserOrgId } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import {
  parseBody,
  requireString,
  validationErrorResponse,
  ValidationError,
} from "../_shared/validate.ts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Authenticate — extract JWT and validate via auth.getUser(token)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const authClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  const { data: { user: authUser }, error: authError } = await authClient.auth.getUser(token);

  if (authError || !authUser) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const userId = authUser.id;

  // 2. Rate limit — 30 requests/hour, fail-closed
  const rateCheck = await checkRateLimit(userId, "file-download", 30, 60, { failClosed: true });
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck, corsHeaders, "Download rate limit exceeded. Please try again later.");
  }

  // 3. Parse and validate file_id
  let fileId: string;
  try {
    const body = await parseBody(req);
    fileId = requireString(body.file_id, "file_id", { maxLength: 36, minLength: 36 })!;
    if (!UUID_REGEX.test(fileId)) {
      throw new ValidationError("file_id must be a valid UUID");
    }
  } catch (e) {
    if (e instanceof ValidationError) {
      return validationErrorResponse(e.message);
    }
    return validationErrorResponse("Invalid request body");
  }

  // 4. Lookup file metadata using service_role (bypasses RLS)
  const serviceClient = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: file, error: fileError } = await serviceClient
    .from("user_files")
    .select("id, organization_id, storage_path, file_name")
    .eq("id", fileId)
    .single();

  if (fileError || !file) {
    return new Response(
      JSON.stringify({ error: "File not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 5. Verify org membership — critical security check
  const userOrgId = await getUserOrgId(userId);
  if (!userOrgId || userOrgId !== file.organization_id) {
    // Log denied access attempt (fail-open for audit)
    try {
      await serviceClient.from("file_access_audit").insert({
        file_id: fileId,
        accessed_by: userId,
        organization_id: userOrgId || file.organization_id,
        action: "download",
        status: "denied",
        error_message: "Organization mismatch",
        ip_address: req.headers.get("x-forwarded-for") || null,
        user_agent: req.headers.get("user-agent") || null,
      });
    } catch { /* fail-open */ }

    return new Response(
      JSON.stringify({ error: "Access denied" }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 6. Generate signed URL (60s expiry, forces download)
  const { data: signedUrlData, error: signError } = await serviceClient.storage
    .from("user-files")
    .createSignedUrl(file.storage_path, 60, {
      download: file.file_name,
    });

  if (signError || !signedUrlData?.signedUrl) {
    return new Response(
      JSON.stringify({ error: "Failed to generate download URL" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 7. Log successful access (fail-open — don't block download if audit fails)
  try {
    await serviceClient.from("file_access_audit").insert({
      file_id: fileId,
      accessed_by: userId,
      organization_id: file.organization_id,
      action: "download",
      status: "success",
      ip_address: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });
  } catch (err) {
    console.error("Failed to log file access:", err);
  }

  return new Response(
    JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
});
