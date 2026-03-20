/**
 * Shared authentication helper for edge functions.
 * Validates JWT from Authorization header using getUser() (server-side validation).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from "./env.ts";

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
    SUPABASE_URL,
    SUPABASE_ANON_KEY
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
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
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
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
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
 * Look up a user's organization_id from the profiles table.
 * Used by edge functions that write with service_role (where auth.uid() is NULL).
 */
export async function getUserOrgId(userId: string): Promise<string | null> {
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );

  const { data } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  return data?.organization_id || null;
}
