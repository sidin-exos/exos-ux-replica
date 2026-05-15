/**
 * Approximate AI model pricing per 1M tokens (USD).
 * Used for `estimatedCostUsd` field on LangSmith traces — not for billing.
 * Update when provider prices change.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Google standard (≤200K context) tier. >200K context is ~2x — we under-estimate large calls.
  "gemini-2.5-pro": { input: 1.25, output: 10.00 },
  "gemini-2.5-flash": { input: 0.30, output: 2.50 },
  // Google tiered pricing: ≤200K context $2/$12, >200K context $4/$18.
  // We use the standard tier — under-estimates large-context cost slightly,
  // but estimateCost feeds LangSmith dashboards only, not billing.
  "gemini-3.1-pro-preview": { input: 2.00, output: 12.00 },
  "gemini-3.1-flash-lite-preview": { input: 0.10, output: 0.40 },
  "gemini-3-flash-preview": { input: 0.50, output: 3.00 },
  "nvidia/nemotron-3-super-120b-a12b": { input: 0.30, output: 0.90 },
  "sonar": { input: 1.00, output: 1.00 },
  "sonar-pro": { input: 3.00, output: 15.00 },
};

export function estimateCost(
  model: string,
  promptTokens?: number,
  completionTokens?: number,
): number {
  const p = MODEL_PRICING[model];
  if (!p || !promptTokens || !completionTokens) return 0;
  return (promptTokens * p.input + completionTokens * p.output) / 1_000_000;
}
