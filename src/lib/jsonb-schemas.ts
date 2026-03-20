import { z } from "zod";
import type { DashboardType } from "@/lib/dashboard-mappings";

// --- Market Insights ---

export const CitationSchema = z.object({
  index: z.number(),
  url: z.string(),
});

export const MarketInsightRowSchema = z.object({
  id: z.string(),
  industry_slug: z.string(),
  industry_name: z.string(),
  category_slug: z.string(),
  category_name: z.string(),
  confidence_score: z.number(),
  content: z.string(),
  citations: z.array(CitationSchema).catch([]),
  key_trends: z.array(z.string()),
  risk_signals: z.array(z.string()),
  opportunities: z.array(z.string()),
  created_at: z.string(),
  is_active: z.boolean(),
});

export type MarketInsightParsed = z.infer<typeof MarketInsightRowSchema>;

// --- Enterprise Trackers ---

export const EnterpriseTrackerRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  tracker_type: z.enum(["risk", "inflation"]),
  name: z.string(),
  status: z.enum(["setup", "active", "paused"]),
  parameters: z.record(z.unknown()),
  file_references: z.array(z.string()),
  created_at: z.string(),
});

// --- Intel Queries ---

export const IntelQueryRowSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  query_type: z.enum(["supplier", "commodity", "industry", "regulatory", "m&a", "risk"]),
  query_text: z.string(),
  recency_filter: z.enum(["day", "week", "month", "year"]).nullable(),
  domain_filter: z.array(z.string()).nullable(),
  summary: z.string().nullable(),
  citations: z.array(CitationSchema).nullable().catch(null),
  processing_time_ms: z.number().nullable(),
  success: z.boolean(),
});

// --- Shareable Reports ---

export const ReportDataSchema = z.object({
  scenarioTitle: z.string(),
  scenarioId: z.string().optional(),
  analysisResult: z.string(),
  formData: z.record(z.string()),
  timestamp: z.string(),
  selectedDashboards: z.array(z.string().transform(s => s as DashboardType)).optional(),
});

export type ReportDataParsed = z.infer<typeof ReportDataSchema>;

/**
 * Safe-parse a JSONB value against a Zod schema.
 * Returns the parsed value on success, or the fallback on failure (logging a warning).
 */
export function safeParseJsonb<T>(
  schema: z.ZodType<T, z.ZodTypeDef, any>,
  data: unknown,
  label: string,
  fallback: T,
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  console.warn(`[JSONB] ${label}: schema mismatch`, result.error.flatten());
  return fallback;
}
