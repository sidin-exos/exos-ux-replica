/**
 * send-team-invite — Admin-only team invite management.
 *
 * Actions:
 *   - send:   Create a pending invite and email the invitee.
 *   - resend: Re-send the invite email, extending expires_at by 7 days.
 *   - revoke: Mark a pending invite as revoked.
 *
 * Security:
 *   - JWT required (deploy with --no-verify-jwt; auth is enforced in-code).
 *   - Caller must be an org admin. Inviter_id is always the caller.
 *   - Rate limited to 20 sends/resends per hour per user.
 *
 * Emails are sent by invoking the existing send-transactional-email function
 * with the caller's JWT forwarded, which satisfies its non-allowlisted-recipient
 * authentication requirement.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";
import { authenticateRequest, requireAdmin, getUserOrgId } from "../_shared/auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { parseBody, requireString, requireStringEnum, ValidationError, validationErrorResponse } from "../_shared/validate.ts";

const ALLOWED_ROLES = ["user", "manager"] as const;
const ALLOWED_ACTIONS = ["send", "resend", "revoke"] as const;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function getSiteUrl(): string {
  return Deno.env.get("SITE_URL") || "https://exosproc.com";
}

async function sendInviteEmail(params: {
  callerJwt: string;
  recipientEmail: string;
  invitationId: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
  attempt: number;
}): Promise<{ ok: boolean; error?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const url = `${supabaseUrl}/functions/v1/send-transactional-email`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.callerJwt}`,
      apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
    },
    body: JSON.stringify({
      templateName: "team-invite",
      recipientEmail: params.recipientEmail,
      idempotencyKey: `team-invite-${params.invitationId}-${params.attempt}`,
      templateData: {
        inviterName: params.inviterName,
        organizationName: params.organizationName,
        role: params.role,
        inviteUrl: params.inviteUrl,
        expiresInDays: 7,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("send-transactional-email failed", {
      status: response.status,
      body: text.slice(0, 500),
    });
    return { ok: false, error: `email dispatch failed (${response.status})` };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // 1. Authenticate
  const authResult = await authenticateRequest(req);
  if ("error" in authResult) {
    return jsonResponse({ error: authResult.error.message }, authResult.error.status);
  }
  const { userId } = authResult.user;

  // 2. Admin gate
  const isAdmin = await requireAdmin(userId);
  if (!isAdmin) {
    return jsonResponse({ error: "Only organization admins can manage invitations" }, 403);
  }

  // 3. Org lookup
  const orgId = await getUserOrgId(userId);
  if (!orgId) {
    return jsonResponse({ error: "User has no organization" }, 403);
  }

  // 4. Parse body
  let body: Record<string, unknown>;
  let action: (typeof ALLOWED_ACTIONS)[number];
  try {
    body = await parseBody(req);
    action = requireStringEnum(body.action, "action", ALLOWED_ACTIONS)!;
  } catch (e) {
    if (e instanceof ValidationError) return validationErrorResponse(e.message);
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  // 5. Rate limit for write actions
  if (action === "send" || action === "resend") {
    const rateCheck = await checkRateLimit(userId, "send-team-invite", 20, 60);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, corsHeaders, "Invite rate limit reached. Try again later.");
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const authHeader = req.headers.get("Authorization") || "";
  const callerJwt = authHeader.replace(/^Bearer\s+/i, "");

  // --- SEND ---
  if (action === "send") {
    let email: string;
    let role: (typeof ALLOWED_ROLES)[number];
    try {
      email = requireString(body.email, "email", { maxLength: 254 })!.trim().toLowerCase();
      role = requireStringEnum(body.role, "role", ALLOWED_ROLES)!;
    } catch (e) {
      if (e instanceof ValidationError) return validationErrorResponse(e.message);
      throw e;
    }

    if (!isValidEmail(email)) {
      return validationErrorResponse("Invalid email address");
    }

    // Reject if already a member of this org
    const { data: existingMember, error: memberError } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", orgId)
      .ilike("email", email)
      .maybeSingle();
    if (memberError) {
      console.error("member lookup failed", memberError);
      return jsonResponse({ error: "Lookup failed" }, 500);
    }
    if (existingMember) {
      return jsonResponse({ error: "This person is already a member of your organization" }, 409);
    }

    // Reject if pending invite exists (handled by unique index, but return a nice error)
    const { data: existingInvite } = await supabase
      .from("org_invitations")
      .select("id")
      .eq("organization_id", orgId)
      .ilike("invitee_email", email)
      .eq("status", "pending")
      .maybeSingle();
    if (existingInvite) {
      return jsonResponse({ error: "An invitation is already pending for this email" }, 409);
    }

    // Insert invitation
    const { data: invitation, error: insertError } = await supabase
      .from("org_invitations")
      .insert({
        organization_id: orgId,
        inviter_id: userId,
        invitee_email: email,
        role,
      })
      .select("id, token, expires_at")
      .single();
    if (insertError || !invitation) {
      console.error("invitation insert failed", insertError);
      return jsonResponse({ error: "Failed to create invitation" }, 500);
    }

    // Fetch inviter + org for email
    const [{ data: inviter }, { data: org }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, full_name")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .maybeSingle(),
    ]);

    const inviterName = inviter?.full_name || inviter?.display_name || "A colleague";
    const organizationName = org?.name || "the organization";
    const inviteUrl = `${getSiteUrl()}/auth?invite=${invitation.token}&tab=sign-up`;

    const emailResult = await sendInviteEmail({
      callerJwt,
      recipientEmail: email,
      invitationId: invitation.id,
      inviterName,
      organizationName,
      role,
      inviteUrl,
      attempt: 1,
    });
    if (!emailResult.ok) {
      // Leave the invitation row in place; admin can resend.
      return jsonResponse({
        invitationId: invitation.id,
        emailSent: false,
        warning: "Invitation created but email failed to send. Use Resend to retry.",
      }, 200);
    }

    return jsonResponse({
      invitationId: invitation.id,
      token: invitation.token,
      expiresAt: invitation.expires_at,
      emailSent: true,
    }, 200);
  }

  // --- RESEND ---
  if (action === "resend") {
    let invitationId: string;
    try {
      invitationId = requireString(body.invitationId, "invitationId", { maxLength: 64 })!;
    } catch (e) {
      if (e instanceof ValidationError) return validationErrorResponse(e.message);
      throw e;
    }
    if (!isValidUuid(invitationId)) {
      return validationErrorResponse("Invalid invitationId");
    }

    const { data: invitation, error: fetchError } = await supabase
      .from("org_invitations")
      .select("id, organization_id, invitee_email, role, status, token")
      .eq("id", invitationId)
      .maybeSingle();
    if (fetchError) {
      console.error("invitation fetch failed", fetchError);
      return jsonResponse({ error: "Lookup failed" }, 500);
    }
    if (!invitation) {
      return jsonResponse({ error: "Invitation not found" }, 404);
    }
    if (invitation.organization_id !== orgId) {
      return jsonResponse({ error: "Invitation does not belong to your organization" }, 403);
    }
    if (invitation.status !== "pending") {
      return jsonResponse({ error: `Cannot resend an invitation in status '${invitation.status}'` }, 400);
    }

    // Extend expiry to 7 days from now
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: updateError } = await supabase
      .from("org_invitations")
      .update({ expires_at: newExpiry })
      .eq("id", invitationId);
    if (updateError) {
      console.error("invitation update failed", updateError);
      return jsonResponse({ error: "Failed to extend invitation" }, 500);
    }

    const [{ data: inviter }, { data: org }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, full_name")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .maybeSingle(),
    ]);
    const inviterName = inviter?.full_name || inviter?.display_name || "A colleague";
    const organizationName = org?.name || "the organization";
    const inviteUrl = `${getSiteUrl()}/auth?invite=${invitation.token}&tab=sign-up`;

    const emailResult = await sendInviteEmail({
      callerJwt,
      recipientEmail: invitation.invitee_email,
      invitationId: invitation.id,
      inviterName,
      organizationName,
      role: invitation.role,
      inviteUrl,
      attempt: Date.now(),
    });
    if (!emailResult.ok) {
      return jsonResponse({ error: "Failed to send email" }, 500);
    }

    return jsonResponse({ ok: true, expiresAt: newExpiry }, 200);
  }

  // --- REVOKE ---
  if (action === "revoke") {
    let invitationId: string;
    try {
      invitationId = requireString(body.invitationId, "invitationId", { maxLength: 64 })!;
    } catch (e) {
      if (e instanceof ValidationError) return validationErrorResponse(e.message);
      throw e;
    }
    if (!isValidUuid(invitationId)) {
      return validationErrorResponse("Invalid invitationId");
    }

    const { data: invitation, error: fetchError } = await supabase
      .from("org_invitations")
      .select("id, organization_id, status")
      .eq("id", invitationId)
      .maybeSingle();
    if (fetchError) {
      console.error("invitation fetch failed", fetchError);
      return jsonResponse({ error: "Lookup failed" }, 500);
    }
    if (!invitation) {
      return jsonResponse({ error: "Invitation not found" }, 404);
    }
    if (invitation.organization_id !== orgId) {
      return jsonResponse({ error: "Invitation does not belong to your organization" }, 403);
    }
    if (invitation.status !== "pending") {
      return jsonResponse({ error: `Cannot revoke an invitation in status '${invitation.status}'` }, 400);
    }

    const { error: updateError } = await supabase
      .from("org_invitations")
      .update({ status: "revoked" })
      .eq("id", invitationId);
    if (updateError) {
      console.error("revoke failed", updateError);
      return jsonResponse({ error: "Failed to revoke invitation" }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
