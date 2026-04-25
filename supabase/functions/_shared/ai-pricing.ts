/**
 * Approximate AI model pricing per 1M tokens (USD).
 * Used for `estimatedCostUsd` field on LangSmith traces — not for billing.
 * Update when provider prices change.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.5-pro": { input: 1.25, output: 5.00 },
  "gemini-2.5-flash": { input: 0.15, output: 0.60 },
  "gemini-3.1-pro-preview": { input: 1.25, output: 5.00 },
  "gemini-3.1-flash-lite-preview": { input: 0.075, output: 0.30 },
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
