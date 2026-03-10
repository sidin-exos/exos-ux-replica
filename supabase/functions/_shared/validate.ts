/**
 * Shared input validation helpers for Edge Functions.
 * Provides size-limited string/array/object checks to prevent
 * resource exhaustion and basic type coercion issues.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Return a 400 response with a safe validation message */
export function validationErrorResponse(message: string): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// --- Primitive validators ---

export function requireString(
  value: unknown,
  name: string,
  opts: { maxLength?: number; minLength?: number; optional?: boolean } = {}
): string | undefined {
  const { maxLength = 50000, minLength = 0, optional = false } = opts;
  if (value === undefined || value === null || value === "") {
    if (optional) return undefined;
    throw new ValidationError(`${name} is required`);
  }
  if (typeof value !== "string") {
    throw new ValidationError(`${name} must be a string`);
  }
  if (value.length < minLength) {
    throw new ValidationError(`${name} must be at least ${minLength} characters`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`${name} must be at most ${maxLength} characters`);
  }
  return value;
}

export function requireStringEnum<T extends string>(
  value: unknown,
  name: string,
  allowed: readonly T[],
  opts: { optional?: boolean } = {}
): T | undefined {
  if (value === undefined || value === null) {
    if (opts.optional) return undefined;
    throw new ValidationError(`${name} is required`);
  }
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(`${name} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function optionalBoolean(value: unknown, name: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new ValidationError(`${name} must be a boolean`);
  }
  return value;
}

export function optionalStringOrNull(
  value: unknown,
  name: string,
  maxLength = 200
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new ValidationError(`${name} must be a string or null`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`${name} must be at most ${maxLength} characters`);
  }
  return value;
}

export function requireArray(
  value: unknown,
  name: string,
  opts: { maxLength?: number; optional?: boolean } = {}
): unknown[] | undefined {
  const { maxLength = 100, optional = false } = opts;
  if (value === undefined || value === null) {
    if (optional) return undefined;
    throw new ValidationError(`${name} is required`);
  }
  if (!Array.isArray(value)) {
    throw new ValidationError(`${name} must be an array`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`${name} must have at most ${maxLength} items`);
  }
  return value;
}

export function optionalRecord(
  value: unknown,
  name: string,
  maxKeys = 100
): Record<string, unknown> | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${name} must be an object`);
  }
  if (Object.keys(value).length > maxKeys) {
    throw new ValidationError(`${name} has too many keys (max ${maxKeys})`);
  }
  return value as Record<string, unknown>;
}

// --- Prompt injection filtering ---

export interface InjectionFilterResult {
  cleaned: string;
  flagged: boolean;
  matches: string[];
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+(instructions?|prompts?|rules?)/gi,
  /override\s+(system|instructions?|rules?)/gi,
  /\bsystem\s*:\s/gi,
  /\bassistant\s*:\s/gi,
  /you\s+are\s+now\s+a/gi,
  /forget\s+(everything|all|your)\s+(above|previous|prior)/gi,
  /disregard\s+(all|any|previous|prior)\s+(instructions?|rules?|prompts?)/gi,
  /\bdo\s+not\s+follow\s+(the\s+)?(above|previous|system)/gi,
  /\bact\s+as\s+(if\s+you\s+are|a\s+different)/gi,
  /\bjailbreak/gi,
  /\bDAN\s+mode/gi,
  /\bpretend\s+you\s+(are|have)\s+no\s+(restrictions?|rules?|limits?)/gi,
];

/**
 * Scan text for prompt injection patterns.
 * Returns cleaned text with flagged segments replaced, plus metadata.
 */
export function filterPromptInjection(text: string): InjectionFilterResult {
  const matches: string[] = [];
  let cleaned = text;

  for (const pattern of INJECTION_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      matches.push(match[0]);
    }
    cleaned = cleaned.replace(pattern, "[FILTERED]");
  }

  return { cleaned, flagged: matches.length > 0, matches };
}

/** Parse and validate JSON body, returning raw object. Throws ValidationError on parse failure. */
export async function parseBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new ValidationError("Request body must be a JSON object");
    }
    return body as Record<string, unknown>;
  } catch (e) {
    if (e instanceof ValidationError) throw e;
    throw new ValidationError("Invalid JSON in request body");
  }
}
