/**
 * Maps known Supabase/API error messages to user-friendly strings.
 * Keeps internal details (column names, constraint names, stack traces) out of the UI.
 */

const AUTH_ERROR_MAP: Record<string, string> = {
  "invalid login credentials": "Invalid email or password.",
  "invalid credentials": "Invalid email or password.",
  "email not confirmed": "Please check your email and confirm your account.",
  "user already registered": "An account with this email already exists.",
  "user not found": "No account found with this email.",
  "password should be at least": "Password must be at least 6 characters.",
  "email rate limit exceeded": "Too many attempts. Please wait a moment and try again.",
  "over_email_send_rate_limit": "Too many emails sent. Please wait before trying again.",
  "new password should be different": "New password must be different from your current password.",
  "invalid claim: missing sub claim": "Your session has expired. Please sign in again.",
  "auth session missing": "Your session has expired. Please sign in again.",
  "jwt expired": "Your session has expired. Please sign in again.",
};

const DEFAULT_USER_MESSAGE = "Something went wrong. Please try again.";

/**
 * Given an error from Supabase or a generic catch block,
 * returns a safe, user-friendly message string.
 */
export function getUserFriendlyError(error: unknown): string {
  const raw = extractMessage(error);
  if (!raw) return DEFAULT_USER_MESSAGE;

  const lower = raw.toLowerCase();
  for (const [pattern, friendly] of Object.entries(AUTH_ERROR_MAP)) {
    if (lower.includes(pattern)) return friendly;
  }

  return DEFAULT_USER_MESSAGE;
}

function extractMessage(error: unknown): string | null {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  if (typeof error === "string") return error;
  return null;
}
