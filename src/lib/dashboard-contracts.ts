/**
 * Dashboard contracts — pure helpers shared between web and PDF dashboards.
 *
 * Goal: prevent visual/semantic drift between `src/components/reports/*` (web)
 * and `src/components/reports/pdf/dashboardVisuals/*` (PDF).
 *
 * Both must consume these helpers so KPIs, splits and scales match exactly.
 */

import type { CostWaterfallData, DataQualityData } from "./dashboard-data-parser";

// ─────────────────────────────────────────────────────────────────────
// Currency formatting (single source of truth)
// ─────────────────────────────────────────────────────────────────────

export const formatAmount = (value: number, currency: string = "$"): string => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${currency}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${currency}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${currency}${abs}`;
};

// ─────────────────────────────────────────────────────────────────────
// Cost Breakdown contract
// ─────────────────────────────────────────────────────────────────────

export interface CostItem {
  name: string;
  value: number;
}

export interface SplitCostResult {
  costs: CostItem[];          // type === "cost", sorted desc
  reductions: CostItem[];     // type === "reduction" (abs values), sorted desc
  gross: number;              // sum of costs
  totalReductions: number;    // sum of |reductions|
  net: number;                // gross - totalReductions
  reductionPercent: number;   // 0..100, rounded
  currency: string;
}

/**
 * Single source of truth for splitting cost components into
 * "Maximum Cost" vs "Potential Improvements".
 *
 * Used by both CostWaterfallDashboard (web) and PDFCostWaterfall (PDF)
 * to guarantee identical KPIs.
 */
export function splitCostComponents(
  data: CostWaterfallData | undefined | null,
  fallbackCurrency: string = "$"
): SplitCostResult {
  const components = data?.components ?? [];
  const currency = data?.currency || fallbackCurrency;

  const costs: CostItem[] = components
    .filter((c) => c.type === "cost")
    .map((c) => ({ name: c.name, value: c.value }))
    .sort((a, b) => b.value - a.value);

  const reductions: CostItem[] = components
    .filter((c) => c.type === "reduction")
    .map((c) => ({ name: c.name, value: Math.abs(c.value) }))
    .sort((a, b) => b.value - a.value);

  const gross = costs.reduce((s, c) => s + c.value, 0);
  const totalReductions = reductions.reduce((s, c) => s + c.value, 0);
  const net = gross - totalReductions;
  const reductionPercent = gross > 0 ? Math.round((totalReductions / gross) * 100) : 0;

  return { costs, reductions, gross, totalReductions, net, reductionPercent, currency };
}

// ─────────────────────────────────────────────────────────────────────
// Data Quality contract
// ─────────────────────────────────────────────────────────────────────

export type FieldStatus = "complete" | "partial" | "missing";
export const FIELD_STATUS_ORDER: FieldStatus[] = ["complete", "partial", "missing"];
export const DQ_MAX_SCORE = 5;

export interface NormalizedField {
  field: string;
  /** Always 0..5 scale, rounded to nearest 0.5 */
  coverage: number;
  status: FieldStatus;
}

export interface NormalizedDataQuality {
  fields: NormalizedField[];
  grouped: Record<FieldStatus, NormalizedField[]>;
  counts: Record<FieldStatus, number>;
  totalFields: number;
  /** Average coverage on the 0..5 scale */
  avgScore: number;
  /** Confidence as 0..100 percent */
  confidencePct: number;
  /** "High" | "Medium" | "Low" derived from confidencePct */
  confidenceLabel: "High" | "Medium" | "Low";
  limitations: { title: string; impact: string }[];
}

/**
 * Coerce a coverage value onto the canonical 0..5 scale.
 * Inputs > 5 are assumed to be 0..100 percentages.
 */
export function toFiveScale(v: number): number {
  if (!Number.isFinite(v) || v < 0) return 0;
  const scaled = v > DQ_MAX_SCORE ? (v / 100) * DQ_MAX_SCORE : v;
  const rounded = Math.round(scaled * 2) / 2;
  return Math.max(0, Math.min(DQ_MAX_SCORE, rounded));
}

function deriveStatus(raw: string | undefined, coverage: number): FieldStatus {
  if (raw === "complete" || raw === "partial" || raw === "missing") return raw;
  // Fallback by coverage band
  if (coverage <= 0) return "missing";
  if (coverage >= 4) return "complete";
  return "partial";
}

/**
 * Single source of truth for the Data Quality KPIs.
 * Used by both DataQualityDashboard (web) and PDFDataQuality (PDF).
 */
export function normalizeDataQuality(data: DataQualityData | undefined | null): NormalizedDataQuality {
  const inputFields = data?.fields ?? [];
  const limitations = data?.limitations ?? [];

  const fields: NormalizedField[] = inputFields.map((f) => {
    const coverage = toFiveScale(f.coverage);
    return {
      field: f.field,
      coverage,
      status: deriveStatus(f.status as string, coverage),
    };
  });

  const grouped: Record<FieldStatus, NormalizedField[]> = {
    complete: [],
    partial: [],
    missing: [],
  };
  fields.forEach((f) => grouped[f.status].push(f));

  const counts: Record<FieldStatus, number> = {
    complete: grouped.complete.length,
    partial: grouped.partial.length,
    missing: grouped.missing.length,
  };

  const totalFields = fields.length;
  const avgScore = totalFields
    ? fields.reduce((acc, f) => acc + f.coverage, 0) / totalFields
    : 0;
  const confidencePct = Math.round((avgScore / DQ_MAX_SCORE) * 100);
  const confidenceLabel: "High" | "Medium" | "Low" =
    confidencePct >= 75 ? "High" : confidencePct >= 60 ? "Medium" : "Low";

  return {
    fields,
    grouped,
    counts,
    totalFields,
    avgScore,
    confidencePct,
    confidenceLabel,
    limitations,
  };
}

export const formatScore = (v: number): string => v.toFixed(1).replace(/\.0$/, "");
