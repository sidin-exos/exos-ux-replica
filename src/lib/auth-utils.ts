import { toast } from "sonner";

const AUTH_ERROR_PATTERNS = [
  "not authenticated",
  "401",
  "unauthorized",
  "jwt expired",
  "invalid jwt",
  "session expired",
  "invalid claim",
  "no session",
  "auth session missing",
] as const;

export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return AUTH_ERROR_PATTERNS.some((pattern) => msg.includes(pattern));
  }
  if (typeof error === "object" && error !== null && "status" in error) {
    return (error as { status: number }).status === 401 || (error as { status: number }).status === 403;
  }
  return false;
}

export function showAuthErrorToast() {
  toast.error("Sign in required", {
    description: "Please sign in to access this feature.",
    action: {
      label: "Sign In",
      onClick: () => { window.location.href = "/auth"; },
    },
  });
}
