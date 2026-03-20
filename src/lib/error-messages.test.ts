import { describe, it, expect } from "vitest";
import { getUserFriendlyError } from "./error-messages";

describe("getUserFriendlyError", () => {
  it("maps 'invalid login credentials' to friendly message", () => {
    expect(getUserFriendlyError(new Error("Invalid login credentials"))).toBe(
      "Invalid email or password."
    );
  });

  it("maps 'user already registered' to friendly message", () => {
    expect(getUserFriendlyError(new Error("User already registered"))).toBe(
      "An account with this email already exists."
    );
  });

  it("maps 'email not confirmed'", () => {
    expect(getUserFriendlyError(new Error("email not confirmed"))).toBe(
      "Please check your email and confirm your account."
    );
  });

  it("maps 'jwt expired' to session expired", () => {
    expect(getUserFriendlyError(new Error("jwt expired"))).toBe(
      "Your session has expired. Please sign in again."
    );
  });

  it("maps 'auth session missing'", () => {
    expect(getUserFriendlyError(new Error("auth session missing"))).toBe(
      "Your session has expired. Please sign in again."
    );
  });

  it("maps 'email rate limit exceeded'", () => {
    expect(getUserFriendlyError(new Error("email rate limit exceeded"))).toBe(
      "Too many attempts. Please wait a moment and try again."
    );
  });

  it("maps 'password should be at least 6 characters'", () => {
    expect(getUserFriendlyError(new Error("password should be at least 6 characters"))).toBe(
      "Password must be at least 6 characters."
    );
  });

  it("returns default for unknown error messages", () => {
    expect(getUserFriendlyError(new Error("some_constraint_violation_xyz"))).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("handles string errors", () => {
    expect(getUserFriendlyError("invalid login credentials")).toBe(
      "Invalid email or password."
    );
  });

  it("handles object with message property", () => {
    expect(getUserFriendlyError({ message: "jwt expired" })).toBe(
      "Your session has expired. Please sign in again."
    );
  });

  it("returns default for null", () => {
    expect(getUserFriendlyError(null)).toBe("Something went wrong. Please try again.");
  });

  it("returns default for undefined", () => {
    expect(getUserFriendlyError(undefined)).toBe("Something went wrong. Please try again.");
  });

  it("is case-insensitive", () => {
    expect(getUserFriendlyError(new Error("INVALID LOGIN CREDENTIALS"))).toBe(
      "Invalid email or password."
    );
  });

  it("matches patterns embedded in longer messages", () => {
    expect(
      getUserFriendlyError(new Error("AuthApiError: invalid login credentials at line 42"))
    ).toBe("Invalid email or password.");
  });
});
