/**
 * Approximate AI model pricing per 1M tokens (USD).
 * Mirrors supabase/functions/_shared/ai-pricing.ts — keep in sync.
 * Used for the "Est. Cost" hint shown in the UI. Not for billing.
 *
 * Google Gemini tiered context pricing: we use the standard (≤200K) tier,
 * which under-estimates large-context calls. Update when prices change.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Gemini 2.5 Pro: $1.25 in / $10 out (≤200K context)
  "gemini-2.5-pro": { input: 1.25, output: 10.00 },
  "gemini-2.5-flash": { input: 0.30, output: 2.50 },
  // Gemini 3.x previews
  "gemini-3.1-pro-preview": { input: 2.00, output: 12.00 },
  "gemini-3.1-flash-lite-preview": { input: 0.10, output: 0.40 },
  "gemini-3-flash-preview": { input: 0.50, output: 3.00 },
};

const DEFAULT_PRICING = { input: 1.25, output: 10.00 }; // safe upper-bound default

function normalizeModelId(model?: string | null): string {
  if (!model) return "";
  // Accept "google/gemini-2.5-pro" or "gemini-2.5-pro"
  return model.split("/").pop() ?? model;
}

export function estimateCostUsd(
  model: string | null | undefined,
  promptTokens?: number | null,
  completionTokens?: number | null,
): number {
  const id = normalizeModelId(model);
  const p = MODEL_PRICING[id] ?? DEFAULT_PRICING;
  const inTok = promptTokens ?? 0;
  const outTok = completionTokens ?? 0;
  return (inTok * p.input + outTok * p.output) / 1_000_000;
}
