/**
 * Shared types for server-side PDF generation.
 * Mirrors the frontend types from dashboard-data-parser.ts and dashboard-mappings.ts.
 */

import { extractFromEnvelope, extractRiskRegisterItems } from '../_shared/dashboard-extractor.ts';
import type { DashboardData, RiskRegisterItem } from '../_shared/dashboard-extractor.ts';

// Re-export for consumers
export { extractFromEnvelope, extractRiskRegisterItems };
export type { DashboardData, RiskRegisterItem };

// ── Dashboard type ──

export type DashboardType =
  | "action-checklist"
  | "decision-matrix"
  | "cost-waterfall"
  | "timeline-roadmap"
  | "kraljic-quadrant"
  | "tco-comparison"
  | "license-tier"
  | "sensitivity-spider"
  | "risk-matrix"
  | "scenario-comparison"
  | "supplier-scorecard"
  | "sow-analysis"
  | "negotiation-prep"
  | "data-quality"
  | "npv-waterfall"
  | "ifrs16-impact";

export interface DashboardConfig {
  id: DashboardType;
  name: string;
}

export const dashboardConfigs: Record<DashboardType, DashboardConfig> = {
  "action-checklist": { id: "action-checklist", name: "Action Checklist" },
  "decision-matrix": { id: "decision-matrix", name: "Decision Matrix" },
  "cost-waterfall": { id: "cost-waterfall", name: "Cost Breakdown" },
  "timeline-roadmap": { id: "timeline-roadmap", name: "Timeline Roadmap" },
  "kraljic-quadrant": { id: "kraljic-quadrant", name: "Kraljic Matrix" },
  "tco-comparison": { id: "tco-comparison", name: "TCO Comparison" },
  "license-tier": { id: "license-tier", name: "License Distribution" },
  "sensitivity-spider": { id: "sensitivity-spider", name: "Sensitivity Analysis" },
  "risk-matrix": { id: "risk-matrix", name: "Risk Matrix" },
  "scenario-comparison": { id: "scenario-comparison", name: "Scenario Comparison" },
  "supplier-scorecard": { id: "supplier-scorecard", name: "Supplier Scorecard" },
  "sow-analysis": { id: "sow-analysis", name: "SOW Analysis" },
  "negotiation-prep": { id: "negotiation-prep", name: "Negotiation Prep" },
  "data-quality": { id: "data-quality", name: "Data Quality" },
  "npv-waterfall": { id: "npv-waterfall", name: "NPV Waterfall" },
  "ifrs16-impact": { id: "ifrs16-impact", name: "IFRS 16 Impact" },
};

// ── Per-dashboard data interfaces ──

export interface ActionChecklistData {
  actions: {
    action: string;
    priority: "critical" | "high" | "medium" | "low";
    status: "done" | "in-progress" | "pending" | "blocked";
    owner?: string;
    dueDate?: string;
  }[];
}

export interface DecisionMatrixData {
  criteria: { name: string; weight: number }[];
  options: { name: string; scores: number[] }[];
}

export interface CostWaterfallData {
  components: { name: string; value: number; type: "cost" | "reduction" }[];
  currency?: string;
}

export interface TimelineRoadmapData {
  phases: {
    name: string;
    startWeek: number;
    endWeek: number;
    status: "completed" | "in-progress" | "upcoming";
    milestones?: string[];
  }[];
  totalWeeks?: number;
}

export interface KraljicData {
  items: {
    id: string;
    name: string;
    supplyRisk: number;
    businessImpact: number;
    spend?: string;
  }[];
}

export interface TCOComparisonData {
  data: { year: string; [key: string]: number | string }[];
  options: { id: string; name: string; color: string; totalTCO: number }[];
  currency?: string;
}

export interface LicenseTierData {
  tiers: {
    name: string;
    users: number;
    costPerUser: number;
    totalCost: number;
    color: string;
    recommended?: number;
  }[];
  currency?: string;
}

export interface SensitivityData {
  variables: {
    name: string;
    baseCase: number;
    lowCase: number;
    highCase: number;
    unit?: string;
  }[];
  baseCaseTotal?: number;
  currency?: string;
}

export interface RiskMatrixData {
  risks: {
    supplier: string;
    impact: "high" | "medium" | "low";
    probability: "high" | "medium" | "low";
    category: string;
  }[];
}

export interface ScenarioComparisonData {
  scenarios: { id: string; name: string; color: string }[];
  radarData: { metric: string; [key: string]: number | string }[];
  summary: { criteria: string; [key: string]: string }[];
}

export interface SupplierScorecardData {
  suppliers: {
    name: string;
    score: number;
    trend: "up" | "down" | "stable";
    spend: string;
  }[];
}

export interface SOWAnalysisData {
  clarity: number;
  sections: {
    name: string;
    status: "complete" | "partial" | "missing";
    note: string;
  }[];
  recommendations?: string[];
}

export interface NegotiationPrepData {
  batna: { strength: number; description: string };
  leveragePoints: { point: string; tactic: string }[];
  sequence: { step: string; detail: string }[];
}

export interface DataQualityData {
  fields: {
    field: string;
    status: "complete" | "partial" | "missing";
    coverage: number;
  }[];
  limitations?: { title: string; impact: string }[];
}

export interface NpvWaterfallData {
  options: {
    id: string;
    name: string;
    color: string;
    capexNominal: number;
    opexNominal: number;
    residualValue: number;
    npv: number;
    waccPct?: number;
    breakEvenYear?: number | null;
    ifrsOnBalanceSheet?: boolean | null;
  }[];
  preferredOptionId?: string;
  verdict?: string;
  cashFlowRationale?: string;
  currency?: string;
}

export interface Ifrs16ImpactData {
  options: {
    id: string;
    name: string;
    color: string;
    onBalanceSheet: boolean | null;
    rightOfUseAsset?: number | null;
    leaseLiability?: number | null;
    taxShieldValue?: number | null;
    plTreatment?: string | null;
    balanceSheetImpact?: string | null;
  }[];
  ifrs16Note?: string;
  currency?: string;
}

// ── Extraction utilities (legacy XML fallback) ──

const DASHBOARD_DATA_REGEX = /<dashboard-data>([\s\S]*?)<\/dashboard-data>/;

/** Map snake_case keys the AI might return to the camelCase keys DashboardData expects */
const SNAKE_TO_CAMEL: Record<string, string> = {
  action_checklist: "actionChecklist",
  decision_matrix: "decisionMatrix",
  cost_waterfall: "costWaterfall",
  timeline_roadmap: "timelineRoadmap",
  kraljic_quadrant: "kraljicQuadrant",
  tco_comparison: "tcoComparison",
  license_tier: "licenseTier",
  sensitivity_spider: "sensitivitySpider",
  risk_matrix: "riskMatrix",
  scenario_comparison: "scenarioComparison",
  supplier_scorecard: "supplierScorecard",
  sow_analysis: "sowAnalysis",
  negotiation_prep: "negotiationPrep",
  data_quality: "dataQuality",
};

const VALID_KEYS = new Set<string>(Object.values(SNAKE_TO_CAMEL));

export function extractDashboardData(text: string): DashboardData | null {
  if (!text) return null;
  const match = text.match(DASHBOARD_DATA_REGEX);
  if (!match?.[1]) return null;
  try {
    const raw = match[1].replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    // Normalize snake_case keys to camelCase (AI often outputs snake_case)
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const camelKey = SNAKE_TO_CAMEL[key] || key;
      normalized[camelKey] = value;
    }

    const recognized = Object.keys(normalized).filter(k => VALID_KEYS.has(k));
    if (recognized.length === 0) return null;

    return normalized as DashboardData;
  } catch {
    return null;
  }
}

export function stripDashboardData(text: string): string {
  if (!text) return text;
  return text
    .replace(DASHBOARD_DATA_REGEX, "")
    .replace(/```dashboard:\w+[\s\S]*?```/g, "") // strip ```dashboard:xxx...``` code blocks
    .trim();
}

// ── Request payload ──

export interface GeneratePdfPayload {
  scenarioTitle: string;
  analysisResult: string;
  structuredData?: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
  pdfTheme?: "light" | "dark";
  evaluationScore?: number;
  evaluationConfidence?: string;
}

export type PdfThemeMode = "light" | "dark";
