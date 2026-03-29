/**
 * Dashboard Data Parser
 * 
 * Extracts structured JSON from <dashboard-data> blocks appended by the AI
 * at the end of analysis responses. Each dashboard type has a typed interface.
 * If parsing fails, returns null so dashboards fall back to hardcoded defaults.
 */

// ============================================
// Per-dashboard data interfaces
// ============================================

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

// ============================================
// Top-level union type
// ============================================

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

// ============================================
// Extraction & stripping utilities
// ============================================

const DASHBOARD_DATA_REGEX = /<dashboard-data>([\s\S]*?)<\/dashboard-data>/;

/** Map snake_case keys the AI might return to the camelCase keys DashboardData expects */
const SNAKE_TO_CAMEL: Record<string, keyof DashboardData> = {
  action_checklist: 'actionChecklist',
  decision_matrix: 'decisionMatrix',
  cost_waterfall: 'costWaterfall',
  timeline_roadmap: 'timelineRoadmap',
  kraljic_quadrant: 'kraljicQuadrant',
  tco_comparison: 'tcoComparison',
  license_tier: 'licenseTier',
  sensitivity_spider: 'sensitivitySpider',
  risk_matrix: 'riskMatrix',
  scenario_comparison: 'scenarioComparison',
  supplier_scorecard: 'supplierScorecard',
  sow_analysis: 'sowAnalysis',
  negotiation_prep: 'negotiationPrep',
  data_quality: 'dataQuality',
};

const VALID_KEYS = new Set<string>(Object.values(SNAKE_TO_CAMEL));

/**
 * Extracts structured dashboard data from AI response text.
 * Returns null if no block found or JSON is malformed.
 */
export function extractDashboardData(text: string): DashboardData | null {
  if (!text) return null;

  const match = text.match(DASHBOARD_DATA_REGEX);
  if (!match?.[1]) {
    if (text.length > 200) {
      console.warn('[dashboard-data] No <dashboard-data> block found in response');
    }
    return null;
  }

  try {
    // Sanitize: LLMs often inject markdown code fences inside custom XML tags
    const raw = match[1]
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(raw);

    // Basic sanity: must be a non-null object
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    // Normalize snake_case keys to camelCase and validate
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const camelKey = SNAKE_TO_CAMEL[key] || key;
      normalized[camelKey] = value;
    }

    const foundKeys = Object.keys(normalized);
    const recognized = foundKeys.filter(k => VALID_KEYS.has(k));
    const unrecognized = foundKeys.filter(k => !VALID_KEYS.has(k));

    if (unrecognized.length > 0) {
      console.warn('[dashboard-data] Unrecognized keys:', unrecognized, '| Recognized:', recognized);
    }
    if (recognized.length === 0) {
      console.warn('[dashboard-data] No recognized dashboard keys found. Keys present:', foundKeys);
      return null;
    }

    return normalized as DashboardData;
  } catch (err) {
    console.warn('[dashboard-data] Parse failed:', err);
    return null;
  }
}

/**
 * Strips the <dashboard-data> block from the markdown text
 * so it doesn't render in the UI.
 */
export function stripDashboardData(text: string): string {
  if (!text) return text;
  return text.replace(DASHBOARD_DATA_REGEX, '').trim();
}
