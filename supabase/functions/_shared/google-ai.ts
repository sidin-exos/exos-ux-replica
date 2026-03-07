/**
 * Google AI Studio shared helper for all EXOS Edge Functions.
 *
 * Two-tier model strategy:
 *   Heavy (default): "gemini-3-flash-preview" — complex reasoning, tool use, multi-turn
 *   Light:           "gemini-3.1-flash-lite-preview" — simple single-turn, cost-sensitive
 */

const DEFAULT_MODEL = "gemini-3-flash-preview";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

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

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    const error = new Error(`Google AI Studio error ${res.status}: ${errText}`) as Error & { status: number; body: string };
    error.status = res.status;
    error.body = errText;
    throw error;
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
