/**
 * Database-backed rate limiting for edge functions.
 * Limits requests per authenticated user per endpoint.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "./env.ts";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

/**
 * Check and record a request for rate limiting.
 * Uses userId (not IP) since all endpoints require auth.
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number = 20,
  windowMinutes: number = 60,
  options?: { failClosed?: boolean }
): Promise<RateLimitResult> {
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );

  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  // Count requests in current window
  const { count, error: countError } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("created_at", windowStart);

  if (countError) {
    console.error("Rate limit check failed:", countError);
    if (options?.failClosed) {
      // Fail-closed: deny on DB error for high-value endpoints
      console.warn(`Rate limit fail-closed triggered for endpoint: ${endpoint}`);
      return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + 60_000).toISOString() };
    }
    // Fail-open: allow on DB error for low-risk endpoints
    return { allowed: true, remaining: maxRequests, resetAt: "" };
  }

  const currentCount = count || 0;

  if (currentCount >= maxRequests) {
    const resetAt = new Date(Date.now() + windowMinutes * 60 * 1000).toISOString();
    return { allowed: false, remaining: 0, resetAt };
  }

  // Record this request
  await supabase.from("rate_limits").insert({
    user_id: userId,
    endpoint,
  });

  // Opportunistic cleanup (1% chance per request)
  if (Math.random() < 0.01) {
    supabase.rpc("cleanup_rate_limits").then(() => {}).catch(() => {});
  }

  return {
    allowed: true,
    remaining: maxRequests - currentCount - 1,
    resetAt: "",
  };
}

/**
 * Build a 429 rate limit response with standard headers.
 */
export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>,
  friendlyMessage?: string
): Response {
  return new Response(
    JSON.stringify({
      error: friendlyMessage || "Rate limit exceeded. Please try again later.",
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": result.resetAt,
      },
    }
  );
}
