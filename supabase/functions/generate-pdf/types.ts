/**
 * Shared types for server-side PDF generation.
 * Mirrors the frontend types from dashboard-data-parser.ts and dashboard-mappings.ts.
 */

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
  | "data-quality";

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

// ── Top-level union ──

export interface DashboardData {
  actionChecklist?: ActionChecklistData;
  decisionMatrix?: DecisionMatrixData;
  costWaterfall?: CostWaterfallData;
  timelineRoadmap?: TimelineRoadmapData;
  kraljicQuadrant?: KraljicData;
  tcoComparison?: TCOComparisonData;
  licenseTier?: LicenseTierData;
  sensitivitySpider?: SensitivityData;
  riskMatrix?: RiskMatrixData;
  scenarioComparison?: ScenarioComparisonData;
  supplierScorecard?: SupplierScorecardData;
  sowAnalysis?: SOWAnalysisData;
  negotiationPrep?: NegotiationPrepData;
  dataQuality?: DataQualityData;
}

// ── Extraction utilities ──

const DASHBOARD_DATA_REGEX = /<dashboard-data>([\s\S]*?)<\/dashboard-data>/;

/** Map snake_case keys the AI might return to the camelCase keys DashboardData expects */
const SNAKE_TO_CAMEL: Record<string, keyof DashboardData> = {
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

// ── Structured envelope extraction (mirrors frontend extractFromEnvelope) ──

interface ExosOutputLike {
  schema_version: string;
  recommendations?: { action: string; priority: string }[];
  data_gaps?: { field: string; impact: string; resolution: string }[];
  payload?: Record<string, unknown>;
}

const GENERIC_GAP_PHRASES = ['not specified', 'unknown', 'provide missing data', 'not available', 'n/a'];

export function extractFromEnvelope(raw: string): DashboardData | null {
  if (!raw) return null;
  let parsed: ExosOutputLike;
  try {
    parsed = JSON.parse(raw);
    if (parsed?.schema_version !== '1.0' || !parsed.payload) return null;
  } catch { return null; }

  const result: DashboardData = {};
  const payload = parsed.payload!;
  const scenarioSpecific = (payload.scenario_specific ?? {}) as Record<string, unknown>;

  if (parsed.recommendations && parsed.recommendations.length > 0) {
    result.actionChecklist = {
      actions: parsed.recommendations.map(r => ({
        action: r.action,
        priority: r.priority.toLowerCase() as "critical" | "high" | "medium" | "low",
        status: "pending" as const,
      })),
    };
  }

  const financialModel = payload.financial_model as Record<string, unknown> | undefined;
  if (financialModel?.cost_breakdown && Array.isArray(financialModel.cost_breakdown)) {
    result.costWaterfall = {
      components: (financialModel.cost_breakdown as Array<Record<string, unknown>>).map(cb => ({
        name: String(cb.category ?? ''),
        value: Number(cb.amount ?? 0),
        type: 'cost' as const,
      })),
      currency: String(financialModel.currency ?? 'EUR'),
    };
  }

  const riskSummary = payload.risk_summary as Record<string, unknown> | undefined;
  if (riskSummary) {
    const riskItems = (scenarioSpecific.risk_register ?? scenarioSpecific.risk_items ?? []) as Array<Record<string, unknown>>;
    if (Array.isArray(riskItems) && riskItems.length > 0) {
      result.riskMatrix = {
        risks: riskItems.map(r => ({
          supplier: String(r.risk_name ?? r.supplier ?? r.item ?? ''),
          impact: String(r.impact ?? r.severity ?? 'medium').toLowerCase() as "high" | "medium" | "low",
          probability: String(r.probability ?? r.likelihood ?? 'medium').toLowerCase() as "high" | "medium" | "low",
          category: String(r.category ?? r.type ?? ''),
        })),
      };
    }
  }

  if (scenarioSpecific.batna || scenarioSpecific.zopa || scenarioSpecific.leverage_points) {
    const batnaObj = (scenarioSpecific.batna ?? {}) as Record<string, unknown>;
    const leveragePoints = (scenarioSpecific.leverage_points ?? scenarioSpecific.leverage_analysis ?? []) as Array<Record<string, unknown>>;
    const negScenarios = (scenarioSpecific.negotiation_scenarios ?? []) as Array<Record<string, unknown>>;

    const strength = Number(batnaObj.batna_strength_pct ?? batnaObj.strength ?? 50);
    const description = String(batnaObj.description ?? batnaObj.best_alternative ?? '');

    result.negotiationPrep = {
      batna: { strength, description },
      leveragePoints: leveragePoints.map(l => ({
        point: String(l.title ?? l.point ?? l.lever ?? ''),
        tactic: String(l.description ?? l.tactic ?? l.approach ?? ''),
      })),
      sequence: negScenarios.map(s => ({
        step: String(s.name ?? ''),
        detail: String(s.description ?? '') + (s.expected_savings_pct != null ? ` (Est. savings: ${s.expected_savings_pct}%)` : ''),
      })),
    };

    if (negScenarios.length > 0) {
      const scenarioColors = ['#10b981', '#3b82f6', '#ef4444'];
      result.scenarioComparison = {
        scenarios: negScenarios.map((s, i) => ({
          id: `neg-${i}`,
          name: String(s.name ?? `Scenario ${i + 1}`),
          color: scenarioColors[i] ?? '#6b7280',
        })),
        radarData: [
          { metric: 'Expected Savings', ...Object.fromEntries(negScenarios.map((s, i) => [`neg-${i}`, Number(s.expected_savings_pct ?? 0)])) },
          { metric: 'Risk Level', ...Object.fromEntries(negScenarios.map((s, i) => [`neg-${i}`, s.risk_level === 'high' ? 80 : s.risk_level === 'medium' ? 50 : 20])) },
        ],
        summary: negScenarios.map(s => ({
          criteria: String(s.name ?? ''),
          description: String(s.description ?? ''),
          risk: String(s.risk_level ?? ''),
          recommended: s.recommended ? '✓' : '',
        })),
      };
    }
  }

  if (scenarioSpecific.issues || scenarioSpecific.missing_clauses) {
    const sections = (scenarioSpecific.issues ?? scenarioSpecific.missing_clauses ?? []) as Array<Record<string, unknown>>;
    result.sowAnalysis = {
      clarity: Number(scenarioSpecific.clarity_score ?? 50),
      sections: sections.map(s => ({
        name: String(s.section ?? s.clause ?? s.name ?? ''),
        status: String(s.status ?? 'partial') as "complete" | "partial" | "missing",
        note: String(s.note ?? s.description ?? s.issue ?? ''),
      })),
    };
  }

  const validGaps = (parsed.data_gaps ?? []).filter(g => {
    if (!g?.field || !g?.impact || !g?.resolution) return false;
    const combined = `${g.field} ${g.impact} ${g.resolution}`.toLowerCase();
    return !GENERIC_GAP_PHRASES.some(p => combined.includes(p));
  });
  if (validGaps.length > 0) {
    result.dataQuality = {
      fields: validGaps.map(g => ({ field: g.field, status: 'missing' as const, coverage: 0 })),
      limitations: validGaps.map(g => ({ title: g.field, impact: g.impact })),
    };
  }

  if (scenarioSpecific.scorecard && Array.isArray(scenarioSpecific.scorecard)) {
    result.supplierScorecard = {
      suppliers: (scenarioSpecific.scorecard as Array<Record<string, unknown>>).map(s => ({
        name: String(s.name ?? s.supplier ?? ''),
        score: Number(s.score ?? s.overall_score ?? 0),
        trend: String(s.trend ?? 'stable') as "up" | "down" | "stable",
        spend: String(s.spend ?? ''),
      })),
    };
  }

  return Object.keys(result).length > 0 ? result : null;
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
