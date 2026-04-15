/**
 * Google AI Studio shared helper for all EXOS Edge Functions.
 *
 * Two-tier model strategy:
 *   Heavy (default): "gemini-2.5-pro" — complex reasoning, tool use, multi-turn (GA, stable)
 *   Light:           "gemini-3.1-flash-lite-preview" — simple single-turn, cost-sensitive
 *
 * Note: gemini-3.1-pro-preview is currently affected by a known Google-side hang
 * (https://github.com/google-gemini/gemini-cli/issues/21937) — avoid until fixed.
 */

const DEFAULT_MODEL = "gemini-2.5-pro";
const OVERLOAD_FALLBACK_MODEL = "gemini-2.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 1_000;

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
        const error = new Error(`Google AI Studio request timed out after ${timeoutMs}ms`) as Error & { status: number };
        error.status = 504;
        throw error;
      }
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[GoogleAI] NETWORK ERR", JSON.stringify({ model, attempt, elapsedMs, errMsg }));
      throw err;
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

    if (attempt === MAX_ATTEMPTS && overloaded && model !== OVERLOAD_FALLBACK_MODEL) {
      console.warn(`[GoogleAI] ${res.status} exhausted on ${model}, falling back to ${OVERLOAD_FALLBACK_MODEL}`);
      return callGoogleAI({ ...request, model: OVERLOAD_FALLBACK_MODEL });
    }

    if (!retriable || attempt === MAX_ATTEMPTS) {
      throw error;
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
  };
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
