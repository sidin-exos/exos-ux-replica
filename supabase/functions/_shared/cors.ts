/**
 * Shared CORS and security headers for all edge functions.
 *
 * Origin model (audit issue M3):
 *   - Production:     https://exosproc.com
 *   - Vercel preview: https://*.vercel.app
 *   - Local dev:      http://localhost:<port>  /  http://127.0.0.1:<port>
 *
 * All other origins receive the safe production origin in the
 * Access-Control-Allow-Origin header. The browser will then refuse
 * to expose the response to scripts on the unrecognised origin —
 * which is the desired CORS denial, without any extra server logic.
 *
 * The export is a function (not a static record) so the response
 * varies per request. Callers should pass the incoming `Request` so
 * that the Origin header can be inspected.
 */

const ALLOWED_ORIGIN_REGEX =
  /^https:\/\/exosproc\.com$|^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.vercel\.app$|^http:\/\/localhost(?::\d+)?$|^http:\/\/127\.0\.0\.1(?::\d+)?$/;

const DEFAULT_ORIGIN = "https://exosproc.com";

const ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type, " +
  "x-supabase-client-platform, x-supabase-client-platform-version, " +
  "x-supabase-client-runtime, x-supabase-client-runtime-version";

/**
 * Pick the Access-Control-Allow-Origin value for the request.
 * Falls back to the production origin when the Origin header is
 * missing or not on the allowlist — that way preflights to other
 * origins still return a valid header, but the browser refuses to
 * expose the response.
 */
function resolveAllowedOrigin(req?: Request): string {
  const origin = req?.headers.get("origin") ?? null;
  if (origin && ALLOWED_ORIGIN_REGEX.test(origin)) {
    return origin;
  }
  return DEFAULT_ORIGIN;
}

/**
 * Build the standard CORS + security header set for a response.
 *
 * `Vary: Origin` is included so caches don't serve a response
 * generated for one origin to clients on another.
 */
export function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Vary": "Origin",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
  };
}
