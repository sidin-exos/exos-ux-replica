import { describe, it, expect, vi } from "vitest";
import { isAuthError } from "./auth-utils";

// Mock sonner so the module can be imported without DOM
vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

describe("isAuthError", () => {
  const AUTH_PATTERNS = [
    "not authenticated",
    "401",
    "unauthorized",
    "jwt expired",
    "invalid jwt",
    "session expired",
    "invalid claim",
    "no session",
    "auth session missing",
  ];

  it.each(AUTH_PATTERNS)("matches Error with message containing '%s'", (pattern) => {
    expect(isAuthError(new Error(`Something ${pattern} happened`))).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAuthError(new Error("JWT EXPIRED"))).toBe(true);
    expect(isAuthError(new Error("Not Authenticated"))).toBe(true);
  });

  it("returns false for non-auth errors", () => {
    expect(isAuthError(new Error("Network timeout"))).toBe(false);
    expect(isAuthError(new Error("File not found"))).toBe(false);
  });

  it("matches object with status 401", () => {
    expect(isAuthError({ status: 401 })).toBe(true);
  });

  it("matches object with status 403", () => {
    expect(isAuthError({ status: 403 })).toBe(true);
  });

  it("rejects object with status 500", () => {
    expect(isAuthError({ status: 500 })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAuthError(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isAuthError(undefined)).toBe(false);
  });

  it("returns false for string", () => {
    expect(isAuthError("unauthorized")).toBe(false);
  });
});
