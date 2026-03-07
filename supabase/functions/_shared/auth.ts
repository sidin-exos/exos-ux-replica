/**
 * Shared authentication helper for edge functions.
 * Validates JWT from Authorization header using getClaims().
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export interface AuthResult {
  userId: string;
  email?: string;
  role?: string;
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);

  if (error || !data?.claims) {
    return { error: { status: 401, message: "Invalid or expired token" } };
  }

  return {
    user: {
      userId: data.claims.sub as string,
      email: data.claims.email as string | undefined,
      role: data.claims.role as string | undefined,
    },
  };
}

/**
 * Check if a user has admin role via the profiles table.
 */
export async function requireAdmin(userId: string): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .eq("role", "admin")
    .maybeSingle();

  return !!data;
}

/**
 * Look up a user's organization_id from the profiles table.
 * Used by edge functions that write with service_role (where auth.uid() is NULL).
 */
export async function getUserOrgId(userId: string): Promise<string | null> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  return data?.organization_id || null;
}
