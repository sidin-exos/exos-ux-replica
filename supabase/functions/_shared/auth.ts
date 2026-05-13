/**
 * Shared authentication helper for edge functions.
 * Validates JWT from Authorization header using getUser() (server-side validation).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export interface AuthResult {
  userId: string;
  email?: string;
  role?: string;
  isSuperAdmin?: boolean;
}

export interface AuthError {
  status: number;
  message: string;
}

/**
 * Validate the Authorization header and return user info.
 * Returns either AuthResult or AuthError.
 */
export async function authenticateRequest(
  req: Request
): Promise<{ user: AuthResult } | { error: AuthError }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: { status: 401, message: "Missing authorization header" } };
  }

  const token = authHeader.replace("Bearer ", "");

  // Use getUser(token) for direct JWT validation — the header-based
  // approach (global headers + getUser()) doesn't work reliably in
  // Deno Edge Function runtime ("Auth session missing!" error).
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: { status: 401, message: "Invalid or expired token" } };
  }

  return {
    user: {
      userId: user.id,
      email: user.email,
      role: (user.app_metadata?.role as string) ?? undefined,
    },
  };
}

/**
 * Check if a user has admin role via the profiles table.
 * When allowSuperAdmin is true, super admins also pass the check.
 */
export async function requireAdmin(
  userId: string,
  opts?: { allowSuperAdmin?: boolean }
): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data } = await supabase
    .from("profiles")
    .select("role, is_super_admin")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return false;
  if (opts?.allowSuperAdmin && data.is_super_admin) return true;
  return data.role === "admin";
}

/**
 * Check if a user is a platform-level super admin.
 */
export async function requireSuperAdmin(userId: string): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .eq("is_super_admin", true)
    .maybeSingle();

  return !!data;
}

/**
 * Look up a user's organization context from the profiles table.
 *
 * Returns a discriminated union so callers cannot accidentally treat
 * a missing org as a privilege bypass (audit issue #9):
 *
 *   { orgId }       — user has a concrete organization. Most callers
 *                     filter on this value. A super_admin who also
 *                     happens to belong to an org returns this shape,
 *                     preserving prior behaviour for endpoints that
 *                     require a concrete org context.
 *   { superAdmin }  — user is a platform super_admin with NO concrete
 *                     org. Cross-tenant code paths (e.g.
 *                     sentinel-analysis file access) should accept
 *                     this shape as an explicit org-filter bypass.
 *   { error }       — anything else: profile lookup failed, profile
 *                     missing, or user has no org. Callers MUST treat
 *                     this as denial — never as a bypass.
 *
 * Used by edge functions that write with service_role (where auth.uid()
 * is NULL inside the database).
 */
export type OrgAuthResult =
  | { orgId: string }
  | { superAdmin: true }
  | { error: string };

export async function getUserOrgId(userId: string): Promise<OrgAuthResult> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("organization_id, is_super_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { error: `Profile lookup failed: ${error.message}` };
  }
  if (!data) {
    return { error: "Profile not found" };
  }
  if (data.organization_id) {
    return { orgId: data.organization_id as string };
  }
  if (data.is_super_admin) {
    return { superAdmin: true };
  }
  return { error: "User has no organization" };
}
