/**
 * AI provider helper for all EXOS Edge Functions.
 *
 * Three-tier fallback chain:
 *   1. Gemini 3.1 Pro Preview (5 attempts, exp backoff)
 *   2. Gemini 3 Flash Preview (only when default Pro caller is overloaded)
 *   3. Nebius Nemotron (last resort when Google is unreachable)
 *
 * The Ghost 429 / RESOURCE_EXHAUSTED risk on gemini-3.1-pro-preview is mitigated
 * by the Nebius fallback — when Google quota saturates, Nemotron picks up.
 * Avoid the deprecated gemini-3-pro-preview entirely.
 */

const DEFAULT_MODEL = "gemini-3.1-pro-preview";
const OVERLOAD_FALLBACK_MODEL = "gemini-3-flash-preview";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 1_000;

const NEBIUS_BASE_URL = "https://api.tokenfactory.us-central1.nebius.com/v1";
const NEBIUS_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const NEBIUS_TIMEOUT_MS = 45_000;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GoogleAIRequest {
  systemPrompt?: string;
  contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
  tools?: GoogleAITool[];
  timeoutMs?: number;
  // Set true on outer-retry callers (e.g. sentinel-analysis) to prevent re-triggering
  // the full Google→Flash→Nebius chain on every retry — avoids 150s edge timeout.
  skipNebiusFallback?: boolean;
}

export interface GoogleAITool {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}

export interface GoogleAIResponse {
  text: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  provider?: "google_ai_studio" | "nebius";
  fallbackReason?: string;
}

// ─── Main API call ──────────────────────────────────────────────────────────

export async function callGoogleAI(request: GoogleAIRequest): Promise<GoogleAIResponse> {
  const apiKey = Deno.env.get("GOOGLE_AI_STUDIO_KEY");
  if (!apiKey) {
    throw new Error("GOOGLE_AI_STUDIO_KEY is not configured");
  }

  const model = request.model || DEFAULT_MODEL;
  const endpoint = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: request.contents,
    generationConfig: {
      temperature: request.temperature ?? 0.4,
      maxOutputTokens: request.maxOutputTokens ?? 4096,
      // CRITICAL: Cap Gemini "thinking" budget to a small value for structured-
      // JSON envelope generation. Without a cap, Gemini 2.5/3 Pro consumes most
      // of the output window on hidden reasoning tokens (visible only via
      // usageMetadata.thoughtsTokenCount), returning a tiny truncated envelope.
      // Note: Gemini 2.5 Pro does NOT allow thinkingBudget=0 (returns 400
      // "Budget 0 is invalid. This model only works in thinking mode"). The
      // minimum allowed is 128. We use 512 to leave a small reasoning headroom
      // while reserving the bulk of maxOutputTokens for the visible JSON.
      // Flash variants do allow 0, but 512 is safe across all models.
      thinkingConfig: { thinkingBudget: 512 },
    },
  };

  if (request.systemPrompt) {
    body.systemInstruction = { parts: [{ text: request.systemPrompt }] };
  }

  if (request.tools && request.tools.length > 0) {
    body.tools = request.tools;
  }

  const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const contentsLen = JSON.stringify(request.contents).length;
  const sysPromptLen = request.systemPrompt?.length ?? 0;

  let res: Response | undefined;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log("[GoogleAI] →", JSON.stringify({
      model,
      attempt,
      maxAttempts: MAX_ATTEMPTS,
      contentsLen,
      sysPromptLen,
      hasTools: !!request.tools && request.tools.length > 0,
      temperature: request.temperature ?? 0.4,
      maxOutputTokens: request.maxOutputTokens ?? 4096,
      timeoutMs,
    }));

    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      const elapsedMs = Math.round(performance.now() - startTime);
      if (err instanceof Error && err.name === "AbortError") {
        console.error("[GoogleAI] TIMEOUT", JSON.stringify({ model, attempt, elapsedMs, timeoutMs }));
        const timeoutError = new Error(`Google AI Studio request timed out after ${timeoutMs}ms`) as Error & { status: number };
        timeoutError.status = 504;
        return await maybeNebiusFallback(request, timeoutError, `google_timeout_${timeoutMs}ms`);
      }
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[GoogleAI] NETWORK ERR", JSON.stringify({ model, attempt, elapsedMs, errMsg }));
      const networkError = (err instanceof Error ? err : new Error(errMsg)) as Error & { status?: number };
      networkError.status = networkError.status ?? 502;
      return await maybeNebiusFallback(request, networkError, "google_network_error");
    } finally {
      clearTimeout(timeoutId);
    }

    const elapsedMs = Math.round(performance.now() - startTime);
    console.log("[GoogleAI] ← HTTP", res.status, "in", elapsedMs, "ms");

    if (res.ok) {
      break;
    }

    const errText = await res.text();
    const error = new Error(`Google AI Studio error ${res.status}: ${errText}`) as Error & { status: number; body: string };
    error.status = res.status;
    error.body = errText;

    const retriable = res.status >= 500 && res.status < 600;
    const overloaded = res.status === 503 || res.status === 429;
    // Auth failures: Google specifically can't answer due to credential / permission
    // problems. Retrying won't help (the key won't change mid-loop), but Nebius can
    // still serve the request, so we route straight there.
    const isAuthFailure = res.status === 401 || res.status === 403 ||
      (res.status === 400 && /API_KEY_INVALID|API key not valid/i.test(errText));

    // Pro→Flash escalation only fires for the default Pro caller. Flash-variant
    // callers (e.g. scenario-tutorial uses gemini-3.1-flash-lite-preview) skip
    // straight to Nebius rather than getting silently upgraded to a costlier model.
    if (attempt === MAX_ATTEMPTS && overloaded && model === DEFAULT_MODEL) {
      console.warn(`[GoogleAI] ${res.status} exhausted on ${model}, falling back to ${OVERLOAD_FALLBACK_MODEL}`);
      return callGoogleAI({ ...request, model: OVERLOAD_FALLBACK_MODEL });
    }

    if (isAuthFailure) {
      console.warn(`[GoogleAI] auth failure ${res.status} — going straight to Nebius`);
      return await maybeNebiusFallback(request, error, `google_auth_${res.status}`);
    }

    if (!retriable) {
      throw error;
    }

    if (attempt === MAX_ATTEMPTS) {
      return await maybeNebiusFallback(request, error, `google_${res.status}_after_${MAX_ATTEMPTS}_attempts`);
    }

    lastError = error;
    const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
    console.warn(`[GoogleAI] ${res.status} on attempt ${attempt}/${MAX_ATTEMPTS}, retrying in ${delay}ms`);
    await new Promise(r => setTimeout(r, delay));
  }

  if (!res || !res.ok) {
    throw lastError ?? new Error("Google AI Studio request failed with no response");
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];

  // Handle safety blocks
  if (candidate?.finishReason === "SAFETY") {
    const error = new Error("Response blocked by safety filter") as Error & { status: number };
    error.status = 400;
    throw error;
  }

  const parts = candidate?.content?.parts || [];

  let text = "";
  let functionCall: { name: string; args: Record<string, unknown> } | undefined;

  for (const part of parts) {
    if (part.text) {
      text += part.text;
    }
    if (part.functionCall) {
      functionCall = {
        name: part.functionCall.name,
        args: part.functionCall.args || {},
      };
    }
  }

  return {
    text,
    functionCall,
    usageMetadata: data.usageMetadata,
    provider: "google_ai_studio",
  };
}

// ─── Nebius / Nemotron fallback ─────────────────────────────────────────────

async function maybeNebiusFallback(
  request: GoogleAIRequest,
  originalError: Error & { status?: number },
  reason: string,
): Promise<GoogleAIResponse> {
  if (request.skipNebiusFallback) {
    throw originalError;
  }
  if (!Deno.env.get("NEBIUS_API_KEY")) {
    console.warn("[GoogleAI] Nebius fallback skipped: NEBIUS_API_KEY not configured");
    throw originalError;
  }
  console.warn(`[GoogleAI] Falling back to Nebius (${reason})`);
  try {
    const nebiusResponse = await callNebiusAI(request);
    nebiusResponse.provider = "nebius";
    nebiusResponse.fallbackReason = reason;
    return nebiusResponse;
  } catch (nebiusError) {
    const msg = nebiusError instanceof Error ? nebiusError.message : String(nebiusError);
    console.error(`[GoogleAI] Nebius fallback failed: ${msg}`);
    // Surface the ORIGINAL Google error to the caller — they expect Google semantics
    // and the Nebius failure is incidental noise from their perspective.
    throw originalError;
  }
}

async function callNebiusAI(request: GoogleAIRequest): Promise<GoogleAIResponse> {
  const apiKey = Deno.env.get("NEBIUS_API_KEY");
  if (!apiKey) {
    const err = new Error("NEBIUS_API_KEY is not configured") as Error & { status: number };
    err.status = 500;
    throw err;
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (request.systemPrompt) {
    messages.push({ role: "system", content: request.systemPrompt });
  }
  for (const c of request.contents) {
    messages.push({
      role: c.role === "model" ? "assistant" : "user",
      content: c.parts.map(p => p.text).join("\n"),
    });
  }

  const body: Record<string, unknown> = {
    model: NEBIUS_MODEL,
    messages,
    temperature: request.temperature ?? 0.4,
    max_tokens: request.maxOutputTokens ?? 4096,
  };

  if (request.tools && request.tools.length > 0) {
    body.tools = request.tools.flatMap(t =>
      t.functionDeclarations.map(fn => ({
        type: "function",
        function: {
          name: fn.name,
          description: fn.description,
          parameters: convertGoogleSchemaToJsonSchema(fn.parameters),
        },
      }))
    );
  }

  const timeoutMs = NEBIUS_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  console.log("[Nebius] →", JSON.stringify({
    model: NEBIUS_MODEL,
    messageCount: messages.length,
    temperature: body.temperature,
    maxTokens: body.max_tokens,
    hasTools: !!body.tools,
    timeoutMs,
  }));

  const startTime = performance.now();
  let res: Response;
  try {
    res = await fetch(`${NEBIUS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    const elapsedMs = Math.round(performance.now() - startTime);
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[Nebius] TIMEOUT", JSON.stringify({ elapsedMs, timeoutMs }));
      const error = new Error(`Nebius request timed out after ${timeoutMs}ms`) as Error & { status: number };
      error.status = 504;
      throw error;
    }
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Nebius] NETWORK ERR", JSON.stringify({ elapsedMs, errMsg }));
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const elapsedMs = Math.round(performance.now() - startTime);
  console.log("[Nebius] ← HTTP", res.status, "in", elapsedMs, "ms");

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const error = new Error(`Nebius error ${res.status}: ${errText}`) as Error & { status: number; body: string };
    error.status = res.status;
    error.body = errText;
    throw error;
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice) {
    const error = new Error("Nebius: no choices in response") as Error & { status: number };
    error.status = 502;
    throw error;
  }

  // Mirror Google's SAFETY semantics — callers already handle 400 as "blocked".
  if (choice.finish_reason === "content_filter") {
    const error = new Error("Response blocked by Nebius content filter") as Error & { status: number };
    error.status = 400;
    throw error;
  }

  const result: GoogleAIResponse = {
    text: choice.message?.content ?? "",
    usageMetadata: data.usage ? {
      promptTokenCount: data.usage.prompt_tokens ?? 0,
      candidatesTokenCount: data.usage.completion_tokens ?? 0,
      totalTokenCount: data.usage.total_tokens ?? 0,
    } : undefined,
  };

  // OpenAI returns tool_calls[0].function.arguments as a JSON STRING; Google returns
  // the args as a parsed object. All our callers do `args.<key>` directly without
  // JSON.parse, so we must parse here to keep the contract identical.
  const toolCalls = choice.message?.tool_calls;
  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    const tc = toolCalls[0];
    let args: Record<string, unknown> = {};
    const raw = tc.function?.arguments;
    if (typeof raw === "string") {
      try {
        args = JSON.parse(raw);
      } catch {
        console.error("[Nebius] tool_call arguments not valid JSON, defaulting to {}");
      }
    } else if (raw && typeof raw === "object") {
      args = raw as Record<string, unknown>;
    }
    result.functionCall = { name: tc.function?.name ?? "", args };
  }

  return result;
}

// Reverse of convertJsonSchemaToGoogle: callers pass tools through
// convertOpenAITools (which UPPERCASES type tags for Google); Nebius/OpenAI
// expects standard lowercase JSON Schema, so we translate before sending.
function convertGoogleSchemaToJsonSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const typeMap: Record<string, string> = {
    OBJECT: "object",
    STRING: "string",
    NUMBER: "number",
    INTEGER: "integer",
    BOOLEAN: "boolean",
    ARRAY: "array",
  };

  if (typeof schema.type === "string") {
    result.type = typeMap[schema.type] ?? schema.type.toLowerCase();
  }
  if (schema.description) {
    result.description = schema.description;
  }
  if (schema.properties && typeof schema.properties === "object") {
    const props: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(schema.properties as Record<string, Record<string, unknown>>)) {
      props[k] = convertGoogleSchemaToJsonSchema(v);
    }
    result.properties = props;
  }
  if (Array.isArray(schema.required)) {
    result.required = schema.required;
  }
  if (schema.items && typeof schema.items === "object") {
    result.items = convertGoogleSchemaToJsonSchema(schema.items as Record<string, unknown>);
  }

  return result;
}

// ─── OpenAI → Google message converter ──────────────────────────────────────

export function convertOpenAIMessages(
  messages: Array<{ role: string; content: string }>
): {
  systemPrompt?: string;
  contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
} {
  let systemPrompt: string | undefined;
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemPrompt = systemPrompt ? systemPrompt + "\n\n" + msg.content : msg.content;
    } else {
      const googleRole: "user" | "model" = msg.role === "assistant" ? "model" : "user";
      contents.push({ role: googleRole, parts: [{ text: msg.content }] });
    }
  }

  return { systemPrompt, contents };
}

// ─── OpenAI → Google tools converter ────────────────────────────────────────

export function convertOpenAITools(
  tools: Array<{
    type: string;
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>
): GoogleAITool[] {
  return [{
    functionDeclarations: tools
      .filter(t => t.type === "function")
      .map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: convertJsonSchemaToGoogle(t.function.parameters),
      })),
  }];
}

function convertJsonSchemaToGoogle(schema: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const typeMap: Record<string, string> = {
    object: "OBJECT",
    string: "STRING",
    number: "NUMBER",
    integer: "INTEGER",
    boolean: "BOOLEAN",
    array: "ARRAY",
  };

  if (typeof schema.type === "string") {
    result.type = typeMap[schema.type] || schema.type;
  }

  if (schema.description) {
    result.description = schema.description;
  }

  if (schema.properties && typeof schema.properties === "object") {
    result.properties = {};
    for (const [key, val] of Object.entries(schema.properties as Record<string, Record<string, unknown>>)) {
      (result.properties as Record<string, unknown>)[key] = convertJsonSchemaToGoogle(val);
    }
  }

  if (Array.isArray(schema.required)) {
    result.required = schema.required;
  }

  if (schema.items && typeof schema.items === "object") {
    result.items = convertJsonSchemaToGoogle(schema.items as Record<string, unknown>);
  }

  return result;
}
