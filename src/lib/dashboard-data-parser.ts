/**
 * Dashboard Data Parser
 * 
 * Extracts structured JSON from AI responses. Supports two formats:
 * 1. EXOS Output Schema v1.0 (structured JSON envelope with schema_version: "1.0")
 * 2. @deprecated Legacy <dashboard-data> XML blocks
 * 
 * If parsing fails, returns null so dashboards fall back to hardcoded defaults.
 *
 * SYNC COPY of supabase/functions/_shared/dashboard-extractor.ts
 * Cannot import directly (Deno-only path). Must be kept in sync manually.
 * When dashboard-extractor.ts changes, update this file to match.
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
    // Wave 3 enrichment (S18 + Group C scenarios) — optional, kept for backward compat.
    id?: string;
    score?: number;                                  // probability * impact (1–25)
    rag?: "RED" | "AMBER" | "GREEN";
    owner?: string;                                  // role/function only — never PII
    mitigation?: string;
    currentControl?: string;
    targetResidualRag?: "RED" | "AMBER" | "GREEN";
    financialImpactEur?: number | null;
    regulatoryReference?: string;
    confidence?: "HIGH" | "MEDIUM" | "LOW";
  }[];
  // Optional matrix-level summary (S18). Renderer can fall back to derivation.
  trafficLight?: {
    rag: "RED" | "AMBER" | "GREEN";
    rationale?: string;
    boardNotificationRequired?: boolean;
  };
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

export interface SpendAnalysisData {
  taxonomy: {
    level1: string;
    level2?: string | null;
    taxonomyCode?: string | null;
    annualSpend: number;
    sharePct: number;
    supplierCount: number;
    sampleSkus?: string[];
    confidence?: "HIGH" | "MEDIUM" | "LOW";
  }[];
  tailSpend: {
    thresholdPctOfTotal: number;
    spendInTail: number;
    spendInTailPct: number;
    suppliersInTail: number;
    transactionsInTail: number;
    addressableSavings: number;
    candidates: {
      category: string;
      supplierCount: number;
      annualSpend: number;
      consolidationAction: string;
    }[];
  } | null;
  vendorConsolidation: {
    category: string;
    currentSuppliers: number;
    targetSuppliers: number;
    currentSpend: number;
    estimatedSavings: number;
    savingsPct: number;
    rationale: string;
    preferredSupplier?: string | null;
  }[];
  quickWins: {
    action: string;
    ownerRole: string;
    weeksToValue: number;
    estimatedSavings: number;
    effort?: "LOW" | "MEDIUM" | "HIGH";
    priority?: "HIGH" | "MEDIUM" | "LOW";
  }[];
  savingsSummary: {
    totalAddressableSpend: number;
    identifiedSavings: number;
    savingsPctOfAddressable: number;
    confidence?: "HIGH" | "MEDIUM" | "LOW";
  } | null;
  currency?: string;
}

// ── S9 RFP Generator data ────────────────────────────────────────────────────
export interface RfpPackageData {
  extractedBrief: {
    summary: string;
    scopeType?: "GOODS" | "SERVICES" | "MIXED" | "WORKS" | null;
    packageType: "RFP" | "RFI" | "RFQ";
    volume?: string | null;
    locations: string[];
    annualBudgetEur?: number | null;
    incumbentStatus?: string | null;
    mandatoryCompliance: string[];
    deadlines: {
      rfpIssue?: string | null;
      questionsDue?: string | null;
      submissionDue?: string | null;
      awardTarget?: string | null;
      goLiveTarget?: string | null;
    };
  };
  tenderDocument: {
    type: "RFP" | "RFI" | "RFQ";
    title: string;
    sections: { heading: string; content: string; mandatory: boolean }[];
  } | null;
  evaluationMatrix: {
    scoringScale: string;
    criteria: {
      name: string;
      weightPct: number;
      subCriteria: { name: string; weightPct: number; scoringGuidance?: string }[];
    }[];
    totalWeightCheck: number;
    weightsBalanced: boolean;
    minimumQualifyingScore?: number | null;
  } | null;
  clarifications: {
    question: string;
    whyItMatters: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    field?: string;
  }[];
  suggestedAttachments: {
    name: string;
    purpose: string;
    templateAvailable: boolean;
  }[];
  deliverablesCoverage: {
    delivered: number;
    total: number;
    missing: string[];
  };
}

// Wave 1+2 — re-exported from sentinel/types so dashboards have a single import surface.
export type {
  ShouldCostGapData,
  SavingsRealizationFunnelData,
  SavingsClassification,
  CFOAcceptance,
  WorkingCapitalData,
  ConcentrationData,
  HhiInterpretation,
} from "./sentinel/types";

export { interpretHhi } from "./sentinel/types";

import type {
  ShouldCostGapData as _ShouldCostGapData,
  SavingsRealizationFunnelData as _SavingsRealizationFunnelData,
  WorkingCapitalData as _WorkingCapitalData,
  ConcentrationData as _ConcentrationData,
} from "./sentinel/types";

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
  shouldCostGap?: _ShouldCostGapData;
  savingsRealizationFunnel?: _SavingsRealizationFunnelData;
  workingCapitalDpo?: _WorkingCapitalData;
  supplierConcentrationMap?: _ConcentrationData;
  spendAnalysis?: SpendAnalysisData;
  rfpPackage?: RfpPackageData;
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
  should_cost_gap: 'shouldCostGap',
  savings_realization_funnel: 'savingsRealizationFunnel',
  working_capital_dpo: 'workingCapitalDpo',
  supplier_concentration_map: 'supplierConcentrationMap',
  spend_analysis: 'spendAnalysis',
  rfp_package: 'rfpPackage',
};

const VALID_KEYS = new Set<string>(Object.values(SNAKE_TO_CAMEL));

/**
 * Check whether a raw AI response string is EXOS Output Schema v1.0.
 */
export function isStructuredOutput(raw: string): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return ['1.0','2.0'].includes(parsed?.schema_version);
  } catch {
    return false;
  }
}

// ============================================
// Envelope extraction helpers (synced with dashboard-extractor.ts)
// ============================================

const SCENARIO_COLORS: Record<string, string> = {
  Conservative: '#10b981',
  Aggressive: '#6366f1',
  Hybrid: '#8b5cf6',
};

const TCO_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

function normaliseRisk(v: unknown): 'high' | 'medium' | 'low' {
  if (typeof v === 'number' && Number.isFinite(v)) {
    // Common 1–5 / 1–10 / 0–100 scoring scales
    if (v >= 67 || v >= 7 || v >= 4) return 'high';
    if (v <= 33 || v <= 3 || v <= 1) return 'low';
    return 'medium';
  }
  const s = String(v ?? '').toLowerCase().trim();
  if (!s) return 'medium';
  if (s === 'high' || s === 'red' || s === 'critical' || s === 'severe' ||
      s === 'h' || s === 'r' || s.includes('high') || s.includes('critical') ||
      s.includes('red') || s.includes('severe')) return 'high';
  if (s === 'low' || s === 'green' || s === 'minor' || s === 'l' || s === 'g' ||
      s.includes('low') || s.includes('green') || s.includes('minor') ||
      s.includes('negligible')) return 'low';
  return 'medium';
}

// Canonical names of arrays the model uses to express risk-bearing items
// across all 29 scenarios (S17 risk_register, S18 risks/risk_matrix,
// S20 risk_dimensions, S25 dependency_risks, S26 risk_factors,
// S27 prioritised_vulnerabilities, etc.).
const RISK_ARRAY_KEYS = [
  'risk_register', 'risk_items', 'risks', 'risk_matrix', 'risk_assessment',
  'risk_dimensions', 'risk_factors', 'risk_list', 'key_risks', 'top_risks',
  'dependency_risks', 'prioritised_vulnerabilities', 'prioritized_vulnerabilities',
  'vulnerabilities', 'threats', 'hazards',
  // S27 Black Swan — supply-chain nodes act as the risk register.
  'supply_chain_nodes',
] as const;

function collectRiskSource(payload: Record<string, any>, ss: Record<string, any>): any[] {
  // Search scenario_specific first, then payload root, then nested risk_summary.
  for (const key of RISK_ARRAY_KEYS) {
    const v = ss?.[key];
    if (Array.isArray(v) && v.length > 0) return v;
  }
  for (const key of RISK_ARRAY_KEYS) {
    const v = payload?.[key];
    if (Array.isArray(v) && v.length > 0) return v;
  }
  if (Array.isArray(payload?.risk_summary?.risks) && payload.risk_summary.risks.length > 0) {
    return payload.risk_summary.risks;
  }
  // Fallback: severity-prefixed key_findings strings ("Critical: ...", "[High] ...").
  const kf = ss?.key_findings ?? payload?.key_findings;
  if (Array.isArray(kf) && kf.length > 0 && kf.some((x: any) =>
      typeof x === 'string' && /^\s*\[?(critical|high|medium|low)\b/i.test(x))) {
    return kf;
  }
  return [];
}

const SEVERITY_PREFIX_RE = /^\s*\[?(critical|high|medium|low)\b\]?\s*[:\-—]?\s*/i;

const RAG_VALUES = new Set(['RED', 'AMBER', 'GREEN']);
const CONFIDENCE_VALUES = new Set(['HIGH', 'MEDIUM', 'LOW']);

function normaliseRagValue(v: unknown): 'RED' | 'AMBER' | 'GREEN' | undefined {
  const s = String(v ?? '').toUpperCase().trim();
  return RAG_VALUES.has(s) ? (s as 'RED' | 'AMBER' | 'GREEN') : undefined;
}

function normaliseConfidenceValue(v: unknown): 'HIGH' | 'MEDIUM' | 'LOW' | undefined {
  const s = String(v ?? '').toUpperCase().trim();
  return CONFIDENCE_VALUES.has(s) ? (s as 'HIGH' | 'MEDIUM' | 'LOW') : undefined;
}

function toFiniteNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Map an HML or 1–5 score to a 1–5 numeric for matrix-score reconciliation. */
function toScoreNum(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v >= 1 && v <= 5) return Math.round(v);
    if (v >= 0 && v <= 100) return Math.max(1, Math.min(5, Math.round(v / 20)));
  }
  const s = String(v ?? '').toLowerCase().trim();
  if (s === 'h' || s === 'high' || s.includes('high') || s === 'critical' || s.includes('critical')) return 4;
  if (s === 'l' || s === 'low' || s.includes('low')) return 2;
  if (s === 'm' || s === 'medium' || s.includes('medium')) return 3;
  return undefined;
}

function mapRiskItem(r: any): RiskMatrixData['risks'][number] | null {
  if (!r) return null;
  // Plain string entries — surface them with default medium/medium scoring,
  // unless prefixed with a severity word (Critical/High/Medium/Low).
  if (typeof r === 'string') {
    const t = r.trim();
    if (!t) return null;
    const m = t.match(SEVERITY_PREFIX_RE);
    if (m) {
      const sev = m[1].toLowerCase();
      const title = t.replace(SEVERITY_PREFIX_RE, '').trim();
      return {
        supplier: title || t,
        impact: normaliseRisk(sev),
        probability: sev === 'critical' || sev === 'high' ? 'high' : 'medium',
        category: 'Risk',
      };
    }
    return { supplier: t, impact: 'medium', probability: 'medium', category: 'Operational' };
  }
  if (typeof r !== 'object') return null;
  const title =
    r.risk_description ?? r.label ?? r.risk ?? r.vulnerability ?? r.dimension ??
    r.name ?? r.title ?? r.description ?? r.factor ?? r.threat ?? r.hazard ??
    r.issue ?? r.node_name ?? r.node ?? null;
  if (!title || !String(title).trim()) return null;
  // S27 node shape: criticality (CRITICAL|HIGH|MEDIUM|LOW) + single_point_of_failure flag.
  const isS27Node = r.node_type !== undefined || r.single_point_of_failure !== undefined || r.criticality !== undefined;
  const impactRaw =
    r.impact ?? r.severity ?? r.severity_if_triggered ?? r.consequence ??
    r.business_impact ?? r.financial_impact_score ?? r.rag_status ??
    (isS27Node ? r.criticality : undefined);
  const probRaw =
    r.likelihood ?? r.probability ?? r.dependency_risk_score ??
    r.supply_risk_level ?? r.frequency ?? r.rag_status ??
    (isS27Node ? (r.single_point_of_failure ? 'high' : (r.alternative_available ? 'low' : 'medium')) : undefined);

  // Wave 3 enrichment: capture full risk-register payload for S18.
  const probNum = toScoreNum(r.probability ?? r.likelihood);
  const impactNum = toScoreNum(r.impact ?? r.severity ?? r.business_impact);
  const rawScore = toFiniteNumber(r.score);
  const score = (probNum && impactNum) ? probNum * impactNum : rawScore;
  // Reconcile RAG with score (RC-3): GREEN ≤6, AMBER 7–14, RED ≥15.
  const declaredRag = normaliseRagValue(r.rag_status ?? r.rag);
  const derivedRag: 'RED' | 'AMBER' | 'GREEN' | undefined =
    score == null ? undefined : score >= 15 ? 'RED' : score >= 7 ? 'AMBER' : 'GREEN';
  const rag = derivedRag ?? declaredRag;

  return {
    supplier: String(title).trim(),
    impact: normaliseRisk(impactRaw),
    probability: normaliseRisk(probRaw),
    category: r.category ?? r.risk_category ?? r.type ?? 'Operational',
    id: r.id ?? r.risk_id ?? undefined,
    score,
    rag,
    owner: r.owner_role ?? r.owner ?? r.responsible_role ?? undefined,
    mitigation: r.mitigation ?? r.mitigation_action ?? r.recommended_action ?? undefined,
    currentControl: r.current_control ?? r.existing_control ?? undefined,
    targetResidualRag: normaliseRagValue(r.target_residual_rag ?? r.residual_rag),
    financialImpactEur: toFiniteNumber(r.financial_impact_eur ?? r.financial_impact ?? r.exposure_eur) ?? null,
    regulatoryReference: r.regulatory_reference ?? r.regulation ?? r.standard ?? undefined,
    confidence: normaliseConfidenceValue(r.confidence),
  };
}


const GENERIC_PHRASES = [
  'unknown', 'not specified', 'provide missing', 'n/a', 'impact not specified',
];

function isValidGap(g: any): boolean {
  if (!g?.field || !g?.impact) return false;
  const combined = `${g.field} ${g.impact}`.toLowerCase();
  return !GENERIC_PHRASES.some(p => combined.includes(p));
}

/**
 * Coerce an "amount" value into a finite number.
 * Handles: numbers, numeric strings ("11000000"), strings with thousand
 * separators ("11,000,000", "11.000.000"), currency-prefixed strings
 * ("€11M", "$ 1.5K"), and shorthand suffixes (K/M/B). Returns null if the
 * value is null/undefined/unparseable. Returns 0 for an explicit zero.
 */
function parseAmount(raw: any): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string') return null;

  let s = raw.trim();
  if (!s) return null;

  // Strip currency symbols and letters except K/M/B suffixes
  s = s.replace(/[€$£¥₹]/g, '').trim();

  // Detect K/M/B/T suffix (case-insensitive)
  const suffixMatch = s.match(/([kmbt])\s*$/i);
  let multiplier = 1;
  if (suffixMatch) {
    const ch = suffixMatch[1].toLowerCase();
    multiplier = ch === 'k' ? 1e3 : ch === 'm' ? 1e6 : ch === 'b' ? 1e9 : 1e12;
    s = s.slice(0, suffixMatch.index).trim();
  }

  // Remove thousand separators (comma or space). Keep dot as decimal.
  s = s.replace(/[,\s]/g, '');

  const n = Number(s);
  return Number.isFinite(n) ? n * multiplier : null;
}

/**
 * Extract savings/reduction components for the Cost Breakdown dashboard.
 * Sources, in priority order:
 *  1. scenario_specific.savings_breakdown[] (S4 schema — { lever, annual_savings, ... })
 *  2. Quantified recommendations[] (parses €/%/K/M from action + financial_impact)
 *
 * % values are converted to absolute amounts using the gross cost as base when available.
 * Returns at most 6 entries to keep the dashboard legible.
 */
function extractReductionComponents(
  ss: Record<string, any>,
  recommendations: any[],
  costComponents: Array<{ name: string; value: number; type: 'cost' }>,
): Array<{ name: string; value: number; type: 'reduction' }> {
  const out: Array<{ name: string; value: number; type: 'reduction' }> = [];
  const grossCost = costComponents.reduce((s, c) => s + c.value, 0);

  // 1. S4 savings_breakdown (preferred, structured)
  const savingsBreakdown: any[] = Array.isArray(ss?.savings_breakdown) ? ss.savings_breakdown : [];
  for (const s of savingsBreakdown) {
    const annual = parseAmount(s?.annual_savings);
    const oneOff = parseAmount(s?.one_off_savings);
    const total = (annual ?? 0) + (oneOff ?? 0);
    if (s?.lever && total > 0) {
      out.push({ name: String(s.lever), value: total, type: 'reduction' });
    }
  }

  // 2. Fallback: parse quantified recommendations (€/$/£ amounts or % of gross)
  if (out.length === 0 && Array.isArray(recommendations)) {
    for (const r of recommendations) {
      if (!r?.action) continue;
      const text = `${r.financial_impact ?? ''} ${r.action}`;
      // Try absolute amounts first: €23,280 / $1.5M / EUR 100K
      const amountMatch = text.match(/(?:€|\$|£|EUR|USD|GBP)\s?([\d.,]+\s?[KMB]?)/i);
      let value: number | null = null;
      let label = String(r.action).slice(0, 60).trim();
      if (amountMatch) {
        value = parseAmount(amountMatch[1]);
      } else {
        // Try percentage range or single % — use midpoint of range, applied to gross cost
        const pctRange = text.match(/(\d+(?:\.\d+)?)\s?[-–]\s?(\d+(?:\.\d+)?)\s?%/);
        const pctSingle = !pctRange ? text.match(/(\d+(?:\.\d+)?)\s?%/) : null;
        if (pctRange && grossCost > 0) {
          const mid = (Number(pctRange[1]) + Number(pctRange[2])) / 2;
          value = (grossCost * mid) / 100;
        } else if (pctSingle && grossCost > 0) {
          value = (grossCost * Number(pctSingle[1])) / 100;
        }
      }
      if (value !== null && value > 0) {
        // Strip leading list markers/numbering for cleaner labels
        label = label.replace(/^[-•\d.\s\[\]]+/, '').replace(/^\[(?:high|medium|low|critical)\]\s*/i, '');
        out.push({ name: label.slice(0, 50), value, type: 'reduction' });
      }
    }
  }

  return out.slice(0, 6);
}

/**
 * Extract DashboardData from an EXOS Output Schema v1.0 envelope.
 * Accepts a pre-parsed object (frontend already has the parsed object).
 * Re-serialises internally to reuse the same extraction logic as the shared module.
 */
export function extractFromEnvelope(parsed: Record<string, unknown>): DashboardData | null {
  if (!parsed) return null;
  try {
    return extractFromEnvelopeRaw(JSON.stringify(parsed));
  } catch {
    return null;
  }
}

/**
 * Internal function — identical body to supabase/functions/_shared/dashboard-extractor.ts
 */
function extractFromEnvelopeRaw(rawString: string): DashboardData | null {
  let envelope: Record<string, any>;
  try {
    const p = JSON.parse(rawString);
    if (!['1.0','2.0'].includes(p?.schema_version)) return null;
    envelope = p;
  } catch {
    return null;
  }

  const group: string = envelope.group ?? '';
  const payload: Record<string, any> = envelope.payload ?? {};
  const ss: Record<string, any> = payload.scenario_specific ?? {};
  const recommendations: any[] = envelope.recommendations ?? [];
  const dataGaps: any[] = envelope.data_gaps ?? [];
  const result: DashboardData = {};

  // ── Universal: actionChecklist
  // Accept both object form ({ action, priority }) and plain-string form
  // ("Renegotiate vendor contract"). The AI sometimes returns recommendations
  // as bare strings — coerce these into the expected shape so the dashboard
  // does not silently drop them.
  const normalizedRecs = recommendations
    .map((r: any) => {
      if (typeof r === 'string' && r.trim()) {
        return { action: r.trim(), priority: 'medium' };
      }
      if (r && typeof r === 'object') {
        const action = r.action ?? r.recommendation ?? r.text ?? r.title;
        if (action && String(action).trim()) {
          return { ...r, action: String(action).trim() };
        }
      }
      return null;
    })
    .filter((r: any) => r !== null);
  if (normalizedRecs.length > 0) {
    result.actionChecklist = {
      actions: normalizedRecs.map((r: any) => ({
        action: r.action,
        priority: (['critical', 'high', 'medium', 'low'].includes(
          String(r.priority ?? '').toLowerCase()
        )
          ? String(r.priority).toLowerCase()
          : 'medium') as any,
        status: 'pending' as const,
      })),
    };
  }

  // ── Universal: dataQuality
  // Respect optional status/coverage hints from the AI. Items in data_gaps
  // are not necessarily fully missing — the model often flags fields with
  // partial detail. Default to 'partial' (coverage 2) so the dashboard does
  // not show "0 / 5" for inputs the user actually provided.
  const validGaps = dataGaps.filter(isValidGap);
  if (validGaps.length > 0) {
    const VALID_STATUSES = ['complete', 'partial', 'missing'] as const;
    result.dataQuality = {
      fields: validGaps.map((g: any) => {
        const rawCoverage = Number(g?.coverage);
        const hasCoverage = Number.isFinite(rawCoverage);
        const rawStatus = String(g?.status ?? '').toLowerCase();
        let status: 'complete' | 'partial' | 'missing';
        if (VALID_STATUSES.includes(rawStatus as any)) {
          status = rawStatus as 'complete' | 'partial' | 'missing';
        } else if (hasCoverage) {
          status = rawCoverage >= 4 ? 'complete' : rawCoverage >= 1 ? 'partial' : 'missing';
        } else {
          status = 'partial';
        }
        const coverage = hasCoverage
          ? Math.max(0, Math.min(5, rawCoverage))
          : status === 'complete' ? 5 : status === 'partial' ? 2 : 0;
        return { field: g.field, status, coverage };
      }),
      limitations: validGaps.map((g: any) => ({
        title: g.field,
        impact: g.impact,
      })),
    };
  }

  // ── Universal: costWaterfall
  // Filter BEFORE the length check — if AI returns items with null amounts,
  // we'd otherwise create costWaterfall with an empty components array, which
  // makes the dashboard render with all zeros instead of being hidden.
  // Coerce amount via parseAmount to handle strings with thousand separators
  // and currency symbols (e.g. "11,000,000", "€11M", "11000000").
  const costBreakdown: any[] = payload.financial_model?.cost_breakdown ?? [];
  const validCostComponents = costBreakdown
    .map((c: any) => {
      const amount = parseAmount(c?.amount);
      // Sanitiser: reject category labels that look like recommendation
      // sentences. Schema mandates short noun phrases for cost categories.
      if (!isValidCostLabel(c?.category) || amount === null) return null;
      return { name: String(c.category).trim(), value: amount, type: 'cost' as const };
    })
    .filter((c): c is { name: string; value: number; type: 'cost' } => c !== null);

  // Reduction components — extract from savings_breakdown (S4) and quantified recommendations.
  const reductionComponents = extractReductionComponents(ss, recommendations, validCostComponents);

  if (validCostComponents.length > 0 || reductionComponents.length > 0) {
    result.costWaterfall = {
      components: [...validCostComponents, ...reductionComponents],
      currency: payload.financial_model?.currency ?? 'EUR',
    };
  }

  // ── S7 saas-optimization: licenseTier from tools_inventory[]
  const licenseTier = extractLicenseTier(ss, payload.financial_model?.currency ?? 'EUR');
  if (licenseTier) {
    result.licenseTier = licenseTier;
  }

  // ── S5 spend-analysis-categorization: spendAnalysis
  const spendAnalysis = extractSpendAnalysis(ss, payload.financial_model?.currency ?? 'EUR');
  if (spendAnalysis) {
    result.spendAnalysis = spendAnalysis;
  }

  // ── S9 rfp-generator: rfpPackage
  const rfpPackage = extractRfpPackage(ss);
  if (rfpPackage) {
    result.rfpPackage = rfpPackage;
  }


  // ── Universal: kraljicQuadrant
  // Reads scenario_specific.kraljic_position (S20, S1 and any scenario emitting it).
  // Skip for S26 — Kraljic portfolio positioning is not relevant during a live crisis.
  const scenarioId = String((envelope as any)?.scenario_id ?? '').toUpperCase();
  const kraljicSrc: any = scenarioId === 'S26' ? null : ((ss as any)?.kraljic_position ?? (ss as any)?.kraljic ?? null);
  if (kraljicSrc && typeof kraljicSrc === 'object') {
    const sr = Number(kraljicSrc.supply_risk ?? kraljicSrc.supplyRisk);
    const bi = Number(kraljicSrc.business_impact ?? kraljicSrc.businessImpact);
    if (Number.isFinite(sr) && Number.isFinite(bi)) {
      const name = String(
        kraljicSrc.label ?? kraljicSrc.category ?? (ss as any)?.category_name ?? envelope.scenario_label ?? 'Category'
      );
      const scale = (v: number) => Math.max(0, Math.min(100, v <= 5 ? v * 20 : v));
      result.kraljicQuadrant = {
        items: [{
          id: '1',
          name,
          supplyRisk: scale(sr),
          businessImpact: scale(bi),
          spend: kraljicSrc.quadrant ? String(kraljicSrc.quadrant) : undefined,
        }],
      };
    }
  }

  // ── Group A: tcoComparison
  // Render with >= 1 vendor. Single-vendor TCO renders as a one-bar chart;
  // the AI is instructed to emit >= 2 vendors but we don't blank the dashboard
  // when it returns only one (e.g. user provided a single option to analyse).
  if (group === 'A') {
    const vendorOptions: any[] = ss.vendor_options ?? [];
    const validVendors = vendorOptions.filter(
      (v: any) => v?.vendor_label && v?.total_tco != null
    );
    if (validVendors.length >= 1) {
      const options = validVendors.map((v: any, i: number) => ({
        id: String(i),
        name: v.vendor_label,
        color: TCO_COLORS[i % TCO_COLORS.length],
        totalTCO: Number(v.total_tco),
      }));

      // Build year-by-year cumulative data so the area/line chart has >= 2 points.
      // Priority: explicit year_breakdown from AI → linear ramp from analysis_period_years → flat 5y default.
      const periodYears = Number(payload.financial_model?.analysis_period_years) || 5;
      const hasYearBreakdown = validVendors.every(
        (v: any) => Array.isArray(v.year_breakdown) && v.year_breakdown.length > 0
      );

      let data: Array<{ year: string; [key: string]: number | string }>;
      if (hasYearBreakdown) {
        // Collect distinct years across all vendors, sorted ascending
        const yearSet = new Set<number>();
        validVendors.forEach((v: any) => {
          v.year_breakdown.forEach((yb: any) => {
            const y = Number(yb?.year);
            if (Number.isFinite(y)) yearSet.add(y);
          });
        });
        const years = Array.from(yearSet).sort((a, b) => a - b);
        // Cumulative running totals per vendor
        const running: number[] = validVendors.map(() => 0);
        data = years.map((year) => {
          const row: { year: string; [key: string]: number | string } = { year: `Y${year}` };
          validVendors.forEach((v: any, i: number) => {
            const entry = v.year_breakdown.find((yb: any) => Number(yb?.year) === year);
            running[i] += Number(entry?.cost ?? 0);
            row[String(i)] = running[i];
          });
          return row;
        });
      } else {
        // Synthesize a linear ramp from 0 → totalTCO over analysis_period_years
        const n = Math.max(2, periodYears);
        data = Array.from({ length: n + 1 }, (_, k) => {
          const row: { year: string; [key: string]: number | string } = { year: `Y${k}` };
          validVendors.forEach((v: any, i: number) => {
            row[String(i)] = (Number(v.total_tco) * k) / n;
          });
          return row;
        });
      }

      result.tcoComparison = {
        options,
        data,
        currency: payload.financial_model?.currency ?? 'EUR',
      };
    }

    // ── S3 capex-vs-opex: scenario_specific.options[] + sensitivity[] + flexibility_matrix[]
    const capexOptions: any[] = Array.isArray(ss.options) ? ss.options : [];
    const validCapexOptions = capexOptions.filter(
      (o: any) => o?.option_label && (o?.total_capex_nominal != null || o?.total_opex_nominal != null || o?.npv != null)
    );
    if (validCapexOptions.length >= 1) {
      const tcoOpts = validCapexOptions.map((o: any, i: number) => {
        const total =
          Number(o.npv ?? 0) !== 0
            ? Math.abs(Number(o.npv))
            : Number(o.total_capex_nominal ?? 0) + Number(o.total_opex_nominal ?? 0);
        return {
          id: String(i),
          name: String(o.option_label),
          color: TCO_COLORS[i % TCO_COLORS.length],
          totalTCO: total,
        };
      });

      const yearSet = new Set<number>();
      validCapexOptions.forEach((o: any) => {
        (o.year_by_year ?? []).forEach((yb: any) => {
          const y = Number(yb?.year);
          if (Number.isFinite(y)) yearSet.add(y);
        });
      });
      const years = Array.from(yearSet).sort((a, b) => a - b);
      let capexData: Array<{ year: string; [key: string]: number | string }> = [];
      if (years.length > 0) {
        const running: number[] = validCapexOptions.map(() => 0);
        capexData = years.map((year) => {
          const row: { year: string; [key: string]: number | string } = { year: `Y${year}` };
          validCapexOptions.forEach((o: any, i: number) => {
            const yb = (o.year_by_year ?? []).find((x: any) => Number(x?.year) === year);
            const cf = Number(yb?.capex_cf ?? 0) + Number(yb?.opex_cf ?? 0);
            running[i] += cf;
            row[String(i)] = Math.abs(running[i]);
          });
          return row;
        });
      }
      if (capexData.length >= 2) {
        result.tcoComparison = {
          options: tcoOpts,
          data: capexData,
          currency: payload.financial_model?.currency ?? 'EUR',
        };
      }

      const sens: any[] = Array.isArray(ss.sensitivity) ? ss.sensitivity : [];
      const validSens = sens
        .map((s: any) => ({
          name: String(s?.variable ?? ''),
          baseCase: Number(s?.base),
          lowCase: Number(s?.low),
          highCase: Number(s?.high),
          unit: s?.unit ? String(s.unit) : undefined,
        }))
        .filter((s) => s.name && Number.isFinite(s.baseCase) && Number.isFinite(s.lowCase) && Number.isFinite(s.highCase));
      if (validSens.length > 0) {
        result.sensitivitySpider = {
          variables: validSens,
          baseCaseTotal: Number(validCapexOptions[0]?.npv ?? validCapexOptions[0]?.total_capex_nominal ?? 0) || undefined,
          currency: payload.financial_model?.currency ?? 'EUR',
        };
      }

      const flex: any[] = Array.isArray(ss.flexibility_matrix) ? ss.flexibility_matrix : [];
      if (flex.length > 0 && validCapexOptions.length >= 2) {
        const scenarios = validCapexOptions.slice(0, 2).map((o: any, i: number) => ({
          id: String(o.option_label).toLowerCase().replace(/\s+/g, '-'),
          name: String(o.option_label),
          color: TCO_COLORS[i % TCO_COLORS.length],
        }));
        const radarData = flex
          .map((f: any) => {
            const dim = f?.dimension;
            const cap = Number(f?.capex_score);
            const op = Number(f?.opex_score);
            if (!dim || !Number.isFinite(cap) || !Number.isFinite(op)) return null;
            return {
              metric: String(dim),
              [scenarios[0].name]: Math.max(0, Math.min(100, cap * 20)),
              [scenarios[1].name]: Math.max(0, Math.min(100, op * 20)),
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);
        const summary = flex
          .filter((f: any) => f?.dimension && f?.rationale)
          .map((f: any) => ({
            criteria: String(f.dimension),
            [scenarios[0].name]: String(f.rationale),
            [scenarios[1].name]: String(f.rationale),
          }));
        if (radarData.length > 0) {
          result.scenarioComparison = { scenarios, radarData, summary };
        }
      }
    }
  }

  // ── Group B: supplierScorecard
  if (group === 'B') {
    const scorecard: any[] = ss.scorecard ?? [];
    if (scorecard.length > 0) {
      const overallRag = String(ss.overall_rag ?? '').toLowerCase();
      const trend: 'up' | 'down' | 'stable' =
        overallRag === 'green' ? 'up' :
        overallRag === 'red' ? 'down' : 'stable';
      const kpisWithValues = scorecard.filter((k: any) => k?.actual_pct != null);
      const avgScore =
        kpisWithValues.length > 0
          ? Math.round(
              kpisWithValues.reduce((sum: number, k: any) => sum + Number(k.actual_pct), 0) /
                kpisWithValues.length
            )
          : ss.overall_score ?? 0;
      result.supplierScorecard = {
        suppliers: [
          {
            name: ss.supplier_label ?? 'Supplier A',
            score: avgScore,
            trend,
            spend: ss.review_period ?? '—',
          },
        ],
      };
    }
  }

  // ── Group C: riskMatrix + sowAnalysis
  if (group === 'C') {
    const riskSource = collectRiskSource(payload, ss);
    if (riskSource.length > 0) {
      const mapped = riskSource.map(mapRiskItem).filter((r): r is NonNullable<typeof r> => r !== null);
      if (mapped.length > 0) {
        // S18 RC-3: Reconcile traffic_light_status with actual item RAGs.
        // Server-side derived RAG from worst-case score wins over AI's claim.
        const ragRank = { GREEN: 0, AMBER: 1, RED: 2 } as const;
        let worstRag: 'RED' | 'AMBER' | 'GREEN' | undefined;
        for (const r of mapped) {
          if (r.rag && (!worstRag || ragRank[r.rag] > ragRank[worstRag])) {
            worstRag = r.rag;
          }
        }
        const declared = ss.traffic_light_status ?? {};
        const trafficLight = worstRag
          ? {
              rag: worstRag,
              rationale: declared.rationale ?? undefined,
              boardNotificationRequired:
                declared.board_notification_required ?? (worstRag === 'RED'),
            }
          : undefined;
        result.riskMatrix = { risks: mapped, ...(trafficLight && { trafficLight }) };

        // S18: hydrate action-checklist from mitigation_plan + per-risk mitigation
        // when the AI did not separately emit immediate_actions/recommendations.
        if (!result.actionChecklist) {
          const mitigationPlan: any[] = Array.isArray(ss.mitigation_plan) ? ss.mitigation_plan : [];
          const actions = mitigationPlan
            .map((m: any): ActionChecklistData['actions'][number] | null => {
              const text = m?.action ?? m?.task ?? m?.description ?? null;
              if (!text) return null;
              const pri = String(m?.priority ?? '').toLowerCase();
              const priority: 'critical' | 'high' | 'medium' | 'low' =
                pri === 'critical' ? 'critical' :
                pri === 'high' ? 'high' :
                pri === 'low' ? 'low' : 'medium';
              return {
                action: String(text),
                priority,
                status: 'pending',
                owner: m?.owner_role ?? m?.owner ?? undefined,
                dueDate: m?.target_date ?? undefined,
              };
            })
            .filter((a): a is ActionChecklistData['actions'][number] => a !== null);
          // Fallback: derive from per-risk mitigations when no plan was emitted.
          if (actions.length === 0) {
            for (const r of mapped) {
              if (!r.mitigation) continue;
              const sev = r.rag === 'RED' ? 'critical' : r.rag === 'AMBER' ? 'high' : 'medium';
              actions.push({
                action: r.mitigation,
                priority: sev as 'critical' | 'high' | 'medium' | 'low',
                status: 'pending',
                owner: r.owner,
              });
            }
          }
          if (actions.length > 0) {
            result.actionChecklist = { actions };
          }
        }
      }
    }


    const issues: any[] = ss.issues ?? ss.sow_issues ?? [];
    const missingClauses: any[] = ss.missing_clauses ?? ss.gaps ?? [];
    if (issues.length > 0 || missingClauses.length > 0) {
      const issueSections = issues
        .map((i: any) => {
          const name = i?.clause_reference ?? i?.clause ?? i?.title ?? i?.name ?? i?.issue_id ?? null;
          const note = i?.issue_description ?? i?.description ?? i?.recommended_fix ?? '';
          if (!name && !note) return null;
          const sev = String(i?.severity ?? '').toUpperCase();
          const status = sev === 'CRITICAL' || sev === 'HIGH' ? 'missing' : 'partial';
          return { name: name ?? 'Clause', status: status as 'missing' | 'partial', note };
        })
        .filter((s): s is { name: string; status: 'missing' | 'partial'; note: string } => s !== null);

      const missingSections = missingClauses
        .map((c: any) => {
          const name = c?.clause_type ?? c?.clause ?? c?.title ?? c?.name ?? null;
          const note = c?.risk_if_absent ?? c?.description ?? c?.note ?? '';
          if (!name && !note) return null;
          return { name: name ?? 'Missing clause', status: 'missing' as const, note };
        })
        .filter((s): s is { name: string; status: 'missing'; note: string } => s !== null);

      const sections = [...issueSections, ...missingSections];

      // Clarity is a 0–5 score (matches dashboard MAX_SCORE = 5).
      let clarity: number;
      if (sections.length > 0) {
        const partialCount = sections.filter((s) => s.status === 'partial').length;
        const missingCount = sections.filter((s) => s.status === 'missing').length;
        const completeCount = sections.length - partialCount - missingCount;
        const weighted = completeCount * 1 + partialCount * 0.5 + missingCount * 0;
        clarity = Math.max(0, Math.min(5, (weighted / sections.length) * 5));
      } else {
        const criticalCount = issues.filter(
          (i: any) => String(i?.severity ?? '').toUpperCase() === 'CRITICAL'
        ).length;
        const penalty = criticalCount * 1 + missingClauses.length * 0.5;
        clarity = Math.max(0, Math.min(5, 5 - penalty));
      }

      result.sowAnalysis = {
        clarity: Number(clarity.toFixed(1)),
        sections,
        recommendations: issues
          .map((i: any) => i?.recommended_fix ?? i?.recommendation ?? null)
          .filter((r: any): r is string => typeof r === 'string' && r.length > 0)
          .slice(0, 5),
      };
    }
  }

  // ── Group D: negotiationPrep + scenarioComparison + timelineRoadmap + decisionMatrix
  if (group === 'D') {
    // Accept multiple aliases the AI may emit; normalise BATNA to 0–5.
    const batnaRaw =
      ss.batna?.batna_strength_pct ??
      ss.batna?.strength_pct ??
      ss.batna?.strength ??
      ss.batna?.score ??
      null;
    const batnaStrength05 =
      batnaRaw == null
        ? null
        : Number(batnaRaw) > 5
          ? Math.max(0, Math.min(5, Number(batnaRaw) / 20))
          : Math.max(0, Math.min(5, Number(batnaRaw)));
    const batnaDescription: string | null =
      ss.batna?.buyer_batna_description ??
      ss.batna?.description ??
      ss.batna?.buyer_batna ??
      null;

    const leverageSource =
      (Array.isArray(ss.leverage_points) && ss.leverage_points.length > 0 && ss.leverage_points) ||
      (Array.isArray(ss.leverage_analysis?.buyer_leverage_factors) && ss.leverage_analysis.buyer_leverage_factors) ||
      [];
    const leveragePoints = leverageSource
      .map((lp: any) => {
        if (typeof lp === 'string') return { point: lp, tactic: '' };
        const point = lp?.title ?? lp?.point ?? lp?.factor ?? lp?.name ?? lp?.label ?? null;
        const tactic = lp?.description ?? lp?.tactic ?? lp?.detail ?? lp?.rationale ?? '';
        return point ? { point: String(point), tactic: String(tactic) } : null;
      })
      .filter((x: any): x is { point: string; tactic: string } => !!x);

    const sequenceSource =
      (Array.isArray(ss.negotiation_sequence) && ss.negotiation_sequence.length > 0 && ss.negotiation_sequence) ||
      (Array.isArray(ss.negotiation_tactics) && ss.negotiation_tactics) ||
      [];
    const sequence = sequenceSource
      .map((s: any) => {
        if (typeof s === 'string') return { step: s, detail: '' };
        const step = s?.step ?? s?.title ?? s?.name ?? s?.phase ?? null;
        const detail = s?.detail ?? s?.description ?? s?.action ?? '';
        return step ? { step: String(step), detail: String(detail) } : null;
      })
      .filter((x: any): x is { step: string; detail: string } => !!x);

    if (batnaStrength05 !== null || leveragePoints.length > 0 || sequence.length > 0) {
      result.negotiationPrep = {
        batna: {
          strength: batnaStrength05 ?? 0,
          description: batnaDescription ?? '',
        },
        leveragePoints,
        sequence,
      };
    }

    const negScenarios: any[] = (ss.negotiation_scenarios ?? []).filter(
      (s: any) => s?.name && s?.expected_savings_pct != null
    );
    if (negScenarios.length > 0) {
      const maxSavings = Math.max(...negScenarios.map((s: any) => Number(s.expected_savings_pct)));
      const maxTimeline = Math.max(
        ...negScenarios.map((s: any) => Number(s.estimated_timeline_months ?? 1))
      );
      const riskScore: Record<string, number> = { LOW: 90, MEDIUM: 60, HIGH: 25 };

      result.scenarioComparison = {
        scenarios: negScenarios.map((s: any) => ({
          id: String(s.name).toLowerCase(),
          name: s.name,
          color: SCENARIO_COLORS[s.name] ?? '#94a3b8',
        })),
        radarData: [
          {
            metric: 'Savings',
            ...Object.fromEntries(
              negScenarios.map((s: any) => [
                s.name,
                maxSavings > 0 ? Math.round((Number(s.expected_savings_pct) / maxSavings) * 100) : 0,
              ])
            ),
          },
          {
            metric: 'Risk',
            ...Object.fromEntries(
              negScenarios.map((s: any) => [
                s.name,
                riskScore[String(s.risk_level ?? '').toUpperCase()] ?? 50,
              ])
            ),
          },
          {
            metric: 'Flexibility',
            ...Object.fromEntries(
              negScenarios.map((s: any) => [
                s.name,
                maxTimeline > 0
                  ? Math.round((1 - Number(s.estimated_timeline_months ?? 1) / maxTimeline) * 100)
                  : 50,
              ])
            ),
          },
        ],
        summary: [
          {
            criteria: 'Est. Savings',
            ...Object.fromEntries(
              negScenarios.map((s: any) => [
                s.name,
                `${s.expected_savings_pct}%`,
              ])
            ),
          },
          {
            criteria: 'Timeline',
            ...Object.fromEntries(
              negScenarios.map((s: any) => [
                s.name,
                `${s.estimated_timeline_months ?? '?'} mo`,
              ])
            ),
          },
          {
            criteria: 'Risk Level',
            ...Object.fromEntries(
              negScenarios.map((s: any) => [s.name, s.risk_level ?? '—'])
            ),
          },
        ],
      };
    }

    // timelineRoadmap — S26 4-stage emergency response (priority over three_year_roadmap)
    const rp26: any = (ss as any).response_plan ?? null;
    if (scenarioId === 'S26' && rp26 && typeof rp26 === 'object') {
      const stageDefs: Array<{ key: string; name: string; actionKey: string }> = [
        { key: 'stage_1_assess',  name: 'Stage 1 — Assess',  actionKey: 'actions' },
        { key: 'stage_2_contain', name: 'Stage 2 — Contain', actionKey: 'immediate_actions' },
        { key: 'stage_3_recover', name: 'Stage 3 — Recover', actionKey: 'actions' },
        { key: 'stage_4_prevent', name: 'Stage 4 — Prevent', actionKey: 'recurrence_prevention_checklist' },
      ];
      const presentStages = stageDefs
        .map(s => ({ ...s, stage: rp26[s.key] as any }))
        .filter(s => s.stage && typeof s.stage === 'object');
      if (presentStages.length > 0) {
        let cursor = 1;
        result.timelineRoadmap = {
          phases: presentStages.map((s, i) => {
            const hours = Number(s.stage.target_duration_hours);
            const days = Number(s.stage.target_duration_days);
            const weeks = Number.isFinite(hours) && hours > 0 ? Math.max(1, Math.ceil(hours / (24 * 7)))
              : Number.isFinite(days) && days > 0 ? Math.max(1, Math.ceil(days / 7))
              : 1;
            const startWeek = cursor;
            const endWeek = cursor + weeks - 1;
            cursor = endWeek + 1;
            const actions: any[] = Array.isArray(s.stage[s.actionKey]) ? s.stage[s.actionKey]
              : Array.isArray(s.stage.actions) ? s.stage.actions : [];
            const milestones = actions
              .map(a => typeof a === 'string' ? a : (a?.action ?? a?.text ?? null))
              .filter((a: any): a is string => typeof a === 'string' && a.length > 0)
              .slice(0, 3);
            return {
              name: s.name,
              startWeek,
              endWeek,
              status: i === 0 ? ('in-progress' as const) : ('upcoming' as const),
              milestones,
            };
          }),
          totalWeeks: cursor - 1,
        };
      }
    }

    const roadmap: any[] = ss.three_year_roadmap ?? [];
    if (!result.timelineRoadmap && roadmap.length > 0) {
      let cursor = 1;
      result.timelineRoadmap = {
        phases: roadmap
          .filter((y: any) => y?.year)
          .map((y: any, i: number) => {
            const startWeek = cursor;
            const endWeek = cursor + 51;
            cursor = endWeek + 1;
            return {
              name: `Year ${y.year}`,
              startWeek,
              endWeek,
              status: i === 0 ? ('in-progress' as const) : ('upcoming' as const),
              milestones: Array.isArray(y.objectives) ? y.objectives.slice(0, 3) : [],
            };
          }),
        totalWeeks: roadmap.length * 52,
      };
    }

    const qualFactors: any[] = (ss.qualitative_factors ?? []).filter(
      (f: any) => f?.factor && f?.make_score != null && f?.buy_score != null
    );
    if (qualFactors.length > 0) {
      result.decisionMatrix = {
        criteria: qualFactors.map((f: any) => ({
          name: f.factor,
          weight: f.weight_pct ?? Math.round(100 / qualFactors.length),
        })),
        options: [
          { name: 'Make', scores: qualFactors.map((f: any) => Number(f.make_score)) },
          { name: 'Buy', scores: qualFactors.map((f: any) => Number(f.buy_score)) },
        ],
      };
    }
  }

  // ── Universal fallback: timelineRoadmap from phases[] (Group B project planning)
  // Accept multiple naming conventions the AI uses: name/heading/phase/title for
  // the label, and duration_weeks/duration_months/duration_days for the length.
  if (!result.timelineRoadmap) {
    const phases: any[] = ss.phases ?? ss.timeline ?? ss.roadmap ?? [];
    const getLabel = (p: any) => p?.name ?? p?.heading ?? p?.phase ?? p?.title ?? p?.label;
    const getDurationWeeks = (p: any): number => {
      if (typeof p?.duration_weeks === 'number') return p.duration_weeks;
      if (typeof p?.duration_months === 'number') return Math.max(1, Math.round(p.duration_months * 4));
      if (typeof p?.duration_days === 'number') return Math.max(1, Math.round(p.duration_days / 7));
      return 4;
    };
    if (phases.length > 0) {
      let cursor = 1;
      const validPhases = phases.filter((p: any) => getLabel(p));
      if (validPhases.length > 0) {
        result.timelineRoadmap = {
          phases: validPhases.map((p: any, i: number) => {
            const duration = getDurationWeeks(p);
            const startWeek = cursor;
            const endWeek = cursor + duration - 1;
            cursor = endWeek + 1;
            return {
              name: getLabel(p) ?? `Phase ${i + 1}`,
              startWeek,
              endWeek,
              status: (p.status === 'completed' ? 'completed' :
                       p.status === 'in-progress' ? 'in-progress' : 'upcoming') as any,
              milestones: Array.isArray(p.milestones) ? p.milestones.slice(0, 3) :
                          Array.isArray(p.deliverables) ? p.deliverables.slice(0, 3) : [],
            };
          }),
          totalWeeks: cursor - 1,
        };
      }
    }
  }

  // ── Universal fallback: riskMatrix — searches every known risk-bearing
  // array name across all 29 scenarios (see RISK_ARRAY_KEYS).
  if (!result.riskMatrix) {
    const riskSource = collectRiskSource(payload, ss);
    if (riskSource.length > 0) {
      const mapped = riskSource.map(mapRiskItem).filter((r): r is NonNullable<typeof r> => r !== null);
      if (mapped.length > 0) {
        result.riskMatrix = { risks: mapped };
      }
    }
  }

  // ── Wave 1: should-cost-gap (renderer-only, no schema bump)
  // Source: payload.scenario_specific.cost_decomposition[] +
  //         payload.scenario_specific.negotiation_anchor +
  //         payload.scenario_specific.estimated_supplier_margin_pct
  const shouldCostResult = extractShouldCostGap(payload, ss);
  if (shouldCostResult) result.shouldCostGap = shouldCostResult;

  // ── Wave 1: savings-realization-funnel (S4 — additive payload field)
  const watermark = Boolean(envelope.low_confidence_watermark);
  const funnelResult = extractSavingsRealizationFunnel(payload, ss, watermark);
  if (funnelResult) result.savingsRealizationFunnel = funnelResult;

  // ── Wave 2: working-capital-dpo (Group A base — payload.financial_model.working_capital)
  const wcResult = extractWorkingCapitalDpo(payload);
  if (wcResult) result.workingCapitalDpo = wcResult;

  // ── Wave 2: supplier-concentration-map (Group D scenario_specific.concentration)
  const concResult = extractSupplierConcentrationMap(payload, ss);
  if (concResult) result.supplierConcentrationMap = concResult;

  return Object.keys(result).length === 0 ? null : result;
}

/**
 * Cost-breakdown label hygiene — mirrors supabase/functions/_shared/dashboard-extractor.ts.
 * Reject labels that look like recommendations / sentences instead of cost categories.
 */
const COST_LABEL_VERB_PREFIX_RE = /^\s*(issue|renegotiate|consolidate|reduce|implement|launch|conduct|review|migrate|cancel|terminate|deploy|evaluate|assess|optimi[sz]e|negotiate|investigate|explore|analyse|analyze|consider|engage|adopt|standardi[sz]e|monitor|enforce|develop|create|establish|build|introduce|switch|replace|upgrade|downgrade|right[- ]?size|eliminate|require|enable|update)\b/i;

function isValidCostLabel(raw: any): boolean {
  if (raw === null || raw === undefined) return false;
  const s = String(raw).trim();
  if (!s) return false;
  if (s.length > 40) return false;
  if (/[.!?]/.test(s.replace(/\.$/, ''))) return false;
  if (COST_LABEL_VERB_PREFIX_RE.test(s)) return false;
  if (s.split(/\s+/).length > 5) return false;
  return true;
}

/**
 * Build licenseTier dashboard data from S7 scenario_specific.tools_inventory[].
 * Mirrors supabase/functions/_shared/dashboard-extractor.ts::extractLicenseTier.
 */
const LICENSE_TIER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
function extractLicenseTier(ss: Record<string, any>, currency: string): LicenseTierData | null {
  const inv: any[] = Array.isArray(ss?.tools_inventory) ? ss.tools_inventory : [];
  const valid = inv
    .map((t: any, i: number) => {
      const name = t?.tool_name ?? t?.name ?? t?.tier_label;
      const purchased = parseAmount(t?.licences_purchased ?? t?.licenses_purchased);
      const active = parseAmount(t?.licences_active ?? t?.licenses_active);
      const annual = parseAmount(t?.annual_cost_eur ?? t?.annual_cost);
      const cpu = parseAmount(t?.cost_per_user_eur ?? t?.cost_per_user);
      const recommended = parseAmount(t?.recommended_licences ?? t?.recommended_licenses);
      if (!name || purchased === null || annual === null) return null;
      const costPerUser = cpu !== null ? cpu : (purchased > 0 ? annual / purchased : 0);
      return {
        name: String(name),
        users: Number(purchased),
        costPerUser: Number(costPerUser),
        totalCost: Number(annual),
        color: LICENSE_TIER_COLORS[i % LICENSE_TIER_COLORS.length],
        recommended: recommended !== null ? Number(recommended) : (active !== null ? Number(active) : undefined),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  if (valid.length === 0) return null;
  return { tiers: valid, currency };
}

/**
 * Build spendAnalysis dashboard data from S5 scenario_specific.
 * Mirrors supabase/functions/_shared/dashboard-extractor.ts::extractSpendAnalysis.
 */
function extractSpendAnalysis(ss: Record<string, any>, currency: string): SpendAnalysisData | null {
  const taxRaw: any[] = Array.isArray(ss?.taxonomy_breakdown) ? ss.taxonomy_breakdown : [];
  const taxonomy = taxRaw
    .map((t: any) => {
      const annual = parseAmount(t?.annual_spend_eur ?? t?.annual_spend);
      if (!t?.level1 || annual === null) return null;
      return {
        level1: String(t.level1),
        level2: t?.level2 ? String(t.level2) : null,
        taxonomyCode: t?.taxonomy_code ? String(t.taxonomy_code) : null,
        annualSpend: Number(annual),
        sharePct: Number(parseAmount(t?.spend_share_pct ?? t?.share_pct) ?? 0),
        supplierCount: Number(parseAmount(t?.supplier_count) ?? 0),
        sampleSkus: Array.isArray(t?.sample_skus) ? t.sample_skus.map(String).slice(0, 5) : [],
        confidence: (['HIGH', 'MEDIUM', 'LOW'].includes(String(t?.confidence ?? '').toUpperCase())
          ? String(t.confidence).toUpperCase()
          : undefined) as 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const tailRaw = ss?.tail_spend && typeof ss.tail_spend === 'object' ? ss.tail_spend : null;
  let tailSpend: SpendAnalysisData['tailSpend'] = null;
  if (tailRaw) {
    const candidates = Array.isArray(tailRaw.candidates)
      ? tailRaw.candidates
          .map((c: any) => {
            const annual = parseAmount(c?.annual_spend_eur ?? c?.annual_spend);
            if (!c?.category || annual === null) return null;
            return {
              category: String(c.category),
              supplierCount: Number(parseAmount(c?.supplier_count) ?? 0),
              annualSpend: Number(annual),
              consolidationAction: String(c?.consolidation_action ?? 'AGGREGATE'),
            };
          })
          .filter((x: any) => x !== null)
      : [];
    tailSpend = {
      thresholdPctOfTotal: Number(parseAmount(tailRaw?.threshold_pct_of_total) ?? 80),
      spendInTail: Number(parseAmount(tailRaw?.spend_in_tail_eur ?? tailRaw?.spend_in_tail) ?? 0),
      spendInTailPct: Number(parseAmount(tailRaw?.spend_in_tail_pct) ?? 0),
      suppliersInTail: Number(parseAmount(tailRaw?.suppliers_in_tail) ?? 0),
      transactionsInTail: Number(parseAmount(tailRaw?.transactions_in_tail) ?? 0),
      addressableSavings: Number(parseAmount(tailRaw?.addressable_savings_eur ?? tailRaw?.addressable_savings) ?? 0),
      candidates,
    };
  }

  const vcRaw: any[] = Array.isArray(ss?.vendor_consolidation) ? ss.vendor_consolidation : [];
  const vendorConsolidation = vcRaw
    .map((v: any) => {
      const currentSpend = parseAmount(v?.current_spend_eur ?? v?.current_spend);
      const estSavings = parseAmount(v?.estimated_savings_eur ?? v?.estimated_savings);
      if (!v?.category || currentSpend === null) return null;
      const savingsPct = parseAmount(v?.savings_pct);
      const computedPct =
        savingsPct ?? (estSavings && currentSpend > 0 ? (estSavings / currentSpend) * 100 : 0);
      return {
        category: String(v.category),
        currentSuppliers: Number(parseAmount(v?.current_suppliers) ?? 0),
        targetSuppliers: Number(parseAmount(v?.target_suppliers) ?? 1),
        currentSpend: Number(currentSpend),
        estimatedSavings: Number(estSavings ?? 0),
        savingsPct: Number(computedPct),
        rationale: String(v?.rationale ?? ''),
        preferredSupplier: v?.preferred_supplier ? String(v.preferred_supplier) : null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const qwRaw: any[] = Array.isArray(ss?.quick_wins) ? ss.quick_wins : [];
  const quickWins = qwRaw
    .map((q: any) => {
      if (!q?.action) return null;
      const sav = parseAmount(q?.estimated_savings_eur ?? q?.estimated_savings);
      return {
        action: String(q.action).trim().slice(0, 140),
        ownerRole: String(q?.owner_role ?? 'Procurement'),
        weeksToValue: Number(parseAmount(q?.weeks_to_value) ?? 0),
        estimatedSavings: Number(sav ?? 0),
        effort: (['LOW', 'MEDIUM', 'HIGH'].includes(String(q?.effort ?? '').toUpperCase())
          ? String(q.effort).toUpperCase()
          : undefined) as 'LOW' | 'MEDIUM' | 'HIGH' | undefined,
        priority: (['HIGH', 'MEDIUM', 'LOW'].includes(String(q?.priority ?? '').toUpperCase())
          ? String(q.priority).toUpperCase()
          : undefined) as 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const sumRaw = ss?.savings_summary && typeof ss.savings_summary === 'object' ? ss.savings_summary : null;
  const savingsSummary = sumRaw
    ? {
        totalAddressableSpend: Number(parseAmount(sumRaw?.total_addressable_spend_eur) ?? 0),
        identifiedSavings: Number(parseAmount(sumRaw?.identified_savings_eur) ?? 0),
        savingsPctOfAddressable: Number(parseAmount(sumRaw?.savings_pct_of_addressable) ?? 0),
        confidence: (['HIGH', 'MEDIUM', 'LOW'].includes(String(sumRaw?.confidence ?? '').toUpperCase())
          ? String(sumRaw.confidence).toUpperCase()
          : undefined) as 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
      }
    : null;

  if (
    taxonomy.length === 0 &&
    !tailSpend &&
    vendorConsolidation.length === 0 &&
    quickWins.length === 0 &&
    !savingsSummary
  ) {
    return null;
  }

  return { taxonomy, tailSpend, vendorConsolidation, quickWins, savingsSummary, currency };
}

/**
 * Build rfpPackage dashboard data from S9 scenario_specific.
 * Mirrors supabase/functions/_shared/dashboard-extractor.ts::extractRfpPackage.
 */
function extractRfpPackage(ss: Record<string, any>): RfpPackageData | null {
  const eb = ss?.extracted_brief && typeof ss.extracted_brief === 'object' ? ss.extracted_brief : null;
  const td = ss?.tender_document && typeof ss.tender_document === 'object' ? ss.tender_document : null;
  const em = ss?.evaluation_matrix && typeof ss.evaluation_matrix === 'object' ? ss.evaluation_matrix : null;
  const clarRaw: any[] = Array.isArray(ss?.clarifications) ? ss.clarifications : [];
  const attRaw: any[] = Array.isArray(ss?.suggested_attachments) ? ss.suggested_attachments : [];

  if (!eb && !td && !em && clarRaw.length === 0 && attRaw.length === 0) return null;

  const PKG_TYPES = ['RFP', 'RFI', 'RFQ'] as const;
  const SCOPE_TYPES = ['GOODS', 'SERVICES', 'MIXED', 'WORKS'] as const;
  const SEV = ['HIGH', 'MEDIUM', 'LOW'] as const;
  const pickEnum = <T extends readonly string[]>(v: any, allowed: T, fallback: T[number]): T[number] => {
    const u = String(v ?? '').toUpperCase();
    return (allowed as readonly string[]).includes(u) ? (u as T[number]) : fallback;
  };

  const extractedBrief: RfpPackageData['extractedBrief'] = {
    summary: String(eb?.summary ?? '').trim(),
    scopeType: eb?.scope_type ? pickEnum(eb.scope_type, SCOPE_TYPES, 'SERVICES') : null,
    packageType: pickEnum(eb?.package_type ?? td?.type, PKG_TYPES, 'RFP'),
    volume: eb?.volume ? String(eb.volume) : null,
    locations: Array.isArray(eb?.locations) ? eb.locations.map((x: any) => String(x)).filter(Boolean) : [],
    annualBudgetEur: eb?.annual_budget_eur != null ? Number(parseAmount(eb.annual_budget_eur) ?? 0) || null : null,
    incumbentStatus: eb?.incumbent_status ? String(eb.incumbent_status) : null,
    mandatoryCompliance: Array.isArray(eb?.mandatory_compliance)
      ? eb.mandatory_compliance.map((x: any) => String(x)).filter(Boolean)
      : [],
    deadlines: {
      rfpIssue: eb?.deadlines?.rfp_issue ? String(eb.deadlines.rfp_issue) : null,
      questionsDue: eb?.deadlines?.questions_due ? String(eb.deadlines.questions_due) : null,
      submissionDue: eb?.deadlines?.submission_due ? String(eb.deadlines.submission_due) : null,
      awardTarget: eb?.deadlines?.award_target ? String(eb.deadlines.award_target) : null,
      goLiveTarget: eb?.deadlines?.go_live_target ? String(eb.deadlines.go_live_target) : null,
    },
  };

  const tenderDocument: RfpPackageData['tenderDocument'] = td && Array.isArray(td.sections) && td.sections.length > 0
    ? {
        type: pickEnum(td.type, PKG_TYPES, extractedBrief.packageType),
        title: String(td.title ?? `${extractedBrief.packageType} — Tender Package`),
        sections: td.sections
          .map((s: any) => ({
            heading: String(s?.heading ?? '').trim(),
            content: String(s?.content ?? '').trim(),
            mandatory: Boolean(s?.mandatory),
          }))
          .filter((s: any) => s.heading && s.content),
      }
    : null;

  let evaluationMatrix: RfpPackageData['evaluationMatrix'] = null;
  if (em && Array.isArray(em.criteria) && em.criteria.length > 0) {
    const criteria = em.criteria
      .map((c: any) => {
        const w = Number(parseAmount(c?.weight_pct) ?? 0);
        if (!c?.name || w <= 0) return null;
        return {
          name: String(c.name),
          weightPct: w,
          subCriteria: Array.isArray(c?.sub_criteria)
            ? c.sub_criteria
                .map((sc: any) => ({
                  name: String(sc?.name ?? '').trim(),
                  weightPct: Number(parseAmount(sc?.weight_pct) ?? 0),
                  scoringGuidance: sc?.scoring_guidance ? String(sc.scoring_guidance) : undefined,
                }))
                .filter((sc: any) => sc.name)
            : [],
        };
      })
      .filter((c: any): c is NonNullable<typeof c> => c !== null);
    const totalWeight = criteria.reduce((sum: number, c: any) => sum + c.weightPct, 0);
    evaluationMatrix = {
      scoringScale: String(em?.scoring_scale ?? '1-5'),
      criteria,
      totalWeightCheck: totalWeight,
      weightsBalanced: Math.abs(totalWeight - 100) <= 1,
      minimumQualifyingScore: em?.minimum_qualifying_score != null
        ? Number(parseAmount(em.minimum_qualifying_score) ?? 0)
        : null,
    };
  }

  const clarifications: RfpPackageData['clarifications'] = clarRaw
    .map((c: any) => {
      if (!c?.question) return null;
      return {
        question: String(c.question).trim(),
        whyItMatters: String(c?.why_it_matters ?? '').trim(),
        severity: pickEnum(c?.severity, SEV, 'MEDIUM'),
        field: c?.field ? String(c.field) : undefined,
      };
    })
    .filter((x: any): x is NonNullable<typeof x> => x !== null);

  const suggestedAttachments: RfpPackageData['suggestedAttachments'] = attRaw
    .map((a: any) => {
      if (!a?.name) return null;
      return {
        name: String(a.name).trim(),
        purpose: String(a?.purpose ?? '').trim(),
        templateAvailable: Boolean(a?.template_available),
      };
    })
    .filter((x: any): x is NonNullable<typeof x> => x !== null);

  const deliveredFlags: Record<string, boolean> = {
    'Extracted Brief Summary': Boolean(extractedBrief.summary),
    'Tender Document(s)': Boolean(tenderDocument && tenderDocument.sections.length >= 3),
    'Evaluation Matrix': Boolean(evaluationMatrix && evaluationMatrix.criteria.length > 0),
    'Clarifications & Recommendations': clarifications.length > 0,
    'Suggested Attachments & Templates': suggestedAttachments.length > 0,
  };
  const missing = Object.entries(deliveredFlags).filter(([, ok]) => !ok).map(([k]) => k);
  const delivered = Object.values(deliveredFlags).filter(Boolean).length;

  return {
    extractedBrief,
    tenderDocument,
    evaluationMatrix,
    clarifications,
    suggestedAttachments,
    deliverablesCoverage: { delivered, total: Object.keys(deliveredFlags).length, missing },
  };
}

import type {
  ShouldCostGapData,
  SavingsRealizationFunnelData,
  CFOAcceptance,
  ConfidenceLevel,
  WorkingCapitalData,
  ConcentrationData,
  HhiInterpretation,
} from './sentinel/types';
import { interpretHhi as _interpretHhi } from './sentinel/types';

const normaliseConfidence = (v: unknown): ConfidenceLevel => {
  const s = String(v ?? '').toUpperCase();
  return s === 'HIGH' || s === 'MEDIUM' || s === 'LOW' ? (s as ConfidenceLevel) : 'MEDIUM';
};

export function extractShouldCostGap(
  payload: Record<string, any>,
  ss: Record<string, any>
): ShouldCostGapData | null {
  if (!ss || typeof ss !== 'object') return null;
  const decomposition: any[] = Array.isArray(ss.cost_decomposition) ? ss.cost_decomposition : [];
  if (decomposition.length === 0) return null;

  const components = decomposition
    .filter((c: any) => c && c.component && c.estimated_pct != null)
    .map((c: any) => ({
      name: String(c.component),
      currentPricePct: Number(c.estimated_pct),
      benchmarkPct: c.benchmark_pct != null ? Number(c.benchmark_pct) : null,
      gapPct: c.gap_pct != null ? Number(c.gap_pct) : null,
      confidence: normaliseConfidence(c.confidence),
    }));

  if (components.length === 0) return null;

  const anchor = ss.negotiation_anchor ?? {};
  const benchmark = payload.financial_model?.benchmark_comparison ?? {};

  return {
    components,
    negotiationAnchor: {
      currentPrice: anchor.current_price != null ? Number(anchor.current_price) : null,
      shouldCostTarget: anchor.should_cost_target != null ? Number(anchor.should_cost_target) : null,
      headroomPct: anchor.headroom_pct != null ? Number(anchor.headroom_pct) : null,
      rationale: anchor.rationale ?? null,
    },
    supplierMarginPct:
      ss.estimated_supplier_margin_pct != null ? Number(ss.estimated_supplier_margin_pct) : null,
    benchmarkMarginPct:
      benchmark.industry_margin_pct != null ? Number(benchmark.industry_margin_pct) : null,
    currency: payload.financial_model?.currency ?? 'EUR',
  };
}

export function deriveCfoAcceptance(
  baselineVerified: boolean,
  hardPresent: boolean
): CFOAcceptance {
  if (!baselineVerified) return 'RED';
  if (hardPresent) return 'GREEN';
  return 'AMBER';
}

export function extractSavingsRealizationFunnel(
  payload: Record<string, any>,
  ss: Record<string, any>,
  lowConfidenceWatermark: boolean
): SavingsRealizationFunnelData | null {
  if (!ss || typeof ss !== 'object') return null;
  const sc = ss.savings_classification;
  if (!sc || typeof sc !== 'object') return null;

  const funnelRaw = sc.funnel ?? {};
  const identified = funnelRaw.identified;
  const committed = funnelRaw.committed;
  const realized = funnelRaw.realized;

  const hard = sc.hard ?? null;
  const soft = sc.soft ?? null;
  const avoided = sc.avoided ?? null;

  // Bail if every funnel value AND every class is empty.
  const funnelEmpty = identified == null && committed == null && realized == null;
  const classesEmpty = !hard && !soft && !avoided;
  if (funnelEmpty && classesEmpty) return null;
  if (funnelEmpty) return null;

  // Baseline = sum of class baselines (treat null as 0 only if at least one
  // class has data).
  const anyClassData = !!(hard || soft || avoided);
  const numOrZero = (n: unknown) =>
    anyClassData && n != null && Number.isFinite(Number(n)) ? Number(n) : 0;

  const baselineHard = anyClassData && hard ? numOrZero(hard.baseline_value) : 0;
  const baselineSoft = anyClassData && soft ? numOrZero(soft.baseline_value) : 0;
  const baselineAvoided = anyClassData && avoided ? numOrZero(avoided.baseline_adjusted_value) : 0;

  // Distribute each non-baseline stage proportionally across classes that have
  // annualised contributions, so the stacked bars stay readable.
  const hardWeight = hard ? numOrZero(hard.annualised_savings) : 0;
  const softWeight = soft ? numOrZero(soft.annualised_avoidance) : 0;
  const avoidedWeight = avoided ? numOrZero(avoided.protected_value) : 0;
  const totalWeight = hardWeight + softWeight + avoidedWeight;

  const split = (total: number | null | undefined) => {
    if (total == null || !Number.isFinite(Number(total))) {
      return { hard: 0, soft: 0, avoided: 0 };
    }
    const t = Number(total);
    if (totalWeight <= 0) {
      // No weights — attribute everything to the only present class, else hard.
      if (hard) return { hard: t, soft: 0, avoided: 0 };
      if (soft) return { hard: 0, soft: t, avoided: 0 };
      if (avoided) return { hard: 0, soft: 0, avoided: t };
      return { hard: t, soft: 0, avoided: 0 };
    }
    return {
      hard: (t * hardWeight) / totalWeight,
      soft: (t * softWeight) / totalWeight,
      avoided: (t * avoidedWeight) / totalWeight,
    };
  };

  const baselineVerified = Boolean(sc.baseline_verified);
  const cfoAcceptance = deriveCfoAcceptance(baselineVerified, !!hard);

  return {
    baselineVerified,
    cfoAcceptance,
    funnel: [
      {
        stage: 'Baseline',
        hard: baselineHard,
        soft: baselineSoft,
        avoided: baselineAvoided,
      },
      { stage: 'Identified', ...split(identified) },
      { stage: 'Committed', ...split(committed) },
      { stage: 'Realized', ...split(realized) },
    ],
    hardAnnualised: hard?.annualised_savings != null ? Number(hard.annualised_savings) : null,
    softAnnualised: soft?.annualised_avoidance != null ? Number(soft.annualised_avoidance) : null,
    avoidedProtected: avoided?.protected_value != null ? Number(avoided.protected_value) : null,
    currency: payload.financial_model?.currency ?? 'EUR',
    lowConfidenceWatermark,
  };
}

/**
 * Extracts structured dashboard data from AI response text.
 * Tries EXOS Output Schema v1.0 first, falls back to legacy XML.
 * @deprecated Legacy XML path — new responses use schema_version: "1.0"
 */
export function extractDashboardData(text: string): DashboardData | null {
  if (!text) return null;

  // Try structured EXOS Output Schema v1.0 first
  try {
    const parsed = JSON.parse(text);
    if (['1.0','2.0'].includes(parsed?.schema_version)) {
      return extractFromEnvelope(parsed);
    }
  } catch { /* not JSON, fall through to legacy */ }

  // Legacy XML path
  const match = text.match(DASHBOARD_DATA_REGEX);
  if (!match?.[1]) {
    if (text.length > 200) {
      console.warn('[dashboard-data] No <dashboard-data> block found in response');
    }
    return null;
  }

  try {
    const raw = match[1]
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

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

export interface RiskRegisterItem {
  name?: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category?: string;
}

function normaliseSeverityLabel(raw: unknown): 'Critical' | 'High' | 'Medium' | 'Low' {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v.includes('critical')) return 'Critical';
  if (v.includes('high')) return 'High';
  if (v.includes('low')) return 'Low';
  return 'Medium';
}

/**
 * Extracts the structured risk register from an EXOS envelope (schema_version 1.0/2.0).
 * Tries scenario_specific.risk_register, then risk_items, then payload.risk_summary.risks.
 * Returns [] if the input isn't a recognised envelope or no risk items are present.
 */
export function extractRiskRegisterItems(text: string): RiskRegisterItem[] {
  if (!text) return [];
  let envelope: Record<string, any> | null = null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && ['1.0', '2.0'].includes(parsed.schema_version)) {
      envelope = parsed;
    }
  } catch { /* not JSON envelope */ }
  if (!envelope) return [];

  const payload: Record<string, any> = envelope.payload ?? {};
  const ss: Record<string, any> = payload.scenario_specific ?? {};
  const raw: any[] =
    Array.isArray(ss.risk_register) && ss.risk_register.length > 0 ? ss.risk_register :
    Array.isArray(ss.risk_items) && ss.risk_items.length > 0 ? ss.risk_items :
    Array.isArray(payload.risk_summary?.risks) ? payload.risk_summary.risks : [];

  return raw
    .filter((r: any) => r && typeof r === 'object')
    .map((r: any): RiskRegisterItem | null => {
      const description = String(
        r.risk_description ?? r.description ?? r.label ?? r.risk ?? ''
      ).trim();
      const category = r.category ? String(r.category).trim() : undefined;
      const severity = normaliseSeverityLabel(
        r.severity ?? r.impact ?? r.likelihood ?? r.probability
      );
      const finalDescription = description || category || '';
      if (!finalDescription) return null;
      return {
        name: category,
        description: finalDescription,
        severity,
        category,
      };
    })
    .filter((r): r is RiskRegisterItem => r !== null);
}

// ============================================
// Wave 2 sub-extractors
// ============================================

/**
 * Extract working-capital-dpo dashboard data from the envelope.
 * Reads payload.financial_model.working_capital. If null, returns null.
 * If weighted DPO totals are missing but by_supplier[] has entries, computes
 * the spend-weighted current DPO client-side.
 */
export function extractWorkingCapitalDpo(
  payload: Record<string, any>
): WorkingCapitalData | null {
  const wc = payload?.financial_model?.working_capital;
  if (!wc || typeof wc !== 'object') return null;

  const bySupplierRaw: any[] = Array.isArray(wc.by_supplier) ? wc.by_supplier : [];
  const by_supplier = bySupplierRaw
    .filter((s: any) => s && s.supplier_label && s.payment_terms_days != null)
    .map((s: any) => {
      const days = Number(s.payment_terms_days);
      return {
        supplier_label: String(s.supplier_label),
        category: s.category ?? null,
        payment_terms_days: days,
        annual_spend: s.annual_spend != null ? Number(s.annual_spend) : null,
        late_payment_directive_risk:
          typeof s.late_payment_directive_risk === 'boolean'
            ? s.late_payment_directive_risk
            : days > 60,
      };
    });

  // Compute weighted DPO client-side if missing.
  let current_weighted_dpo: number | null =
    wc.current_weighted_dpo != null ? Number(wc.current_weighted_dpo) : null;
  if (current_weighted_dpo == null && by_supplier.length > 0) {
    const withSpend = by_supplier.filter((s) => s.annual_spend != null && s.annual_spend > 0);
    const totalSpend = withSpend.reduce((acc, s) => acc + (s.annual_spend ?? 0), 0);
    if (totalSpend > 0) {
      current_weighted_dpo =
        withSpend.reduce((acc, s) => acc + s.payment_terms_days * (s.annual_spend ?? 0), 0) /
        totalSpend;
    }
  }

  const target_weighted_dpo: number | null =
    wc.target_weighted_dpo != null ? Number(wc.target_weighted_dpo) : null;

  const annual_spend_eur: number | null =
    wc.annual_spend_eur != null ? Number(wc.annual_spend_eur) : null;

  let working_capital_delta_eur: number | null =
    wc.working_capital_delta_eur != null ? Number(wc.working_capital_delta_eur) : null;
  if (
    working_capital_delta_eur == null &&
    annual_spend_eur != null &&
    current_weighted_dpo != null &&
    target_weighted_dpo != null
  ) {
    working_capital_delta_eur =
      (annual_spend_eur * (target_weighted_dpo - current_weighted_dpo)) / 365;
  }

  const terms_distribution: WorkingCapitalData['terms_distribution'] = (
    Array.isArray(wc.terms_distribution) ? wc.terms_distribution : []
  )
    .filter((t: any) => t && t.term_label && t.spend_share_pct != null)
    .map((t: any) => ({
      term_label: String(t.term_label),
      spend_share_pct: Number(t.spend_share_pct),
      supplier_count: t.supplier_count != null ? Number(t.supplier_count) : null,
    }));

  const early_payment_discount_opportunities: WorkingCapitalData['early_payment_discount_opportunities'] =
    (Array.isArray(wc.early_payment_discount_opportunities)
      ? wc.early_payment_discount_opportunities
      : [])
      .filter((o: any) => o && o.supplier_label && o.discount_structure)
      .map((o: any) => ({
        supplier_label: String(o.supplier_label),
        discount_structure: String(o.discount_structure),
        annualised_value: o.annualised_value != null ? Number(o.annualised_value) : null,
      }));

  return {
    current_weighted_dpo,
    target_weighted_dpo,
    working_capital_delta_eur,
    annual_spend_eur,
    terms_distribution,
    by_supplier,
    early_payment_discount_opportunities,
    currency: payload?.financial_model?.currency ?? 'EUR',
  };
}

/**
 * Extract supplier-concentration-map dashboard data.
 * Reads payload.scenario_specific.concentration. Returns null if missing or
 * flows[] empty. Skips flows whose source/target don't resolve.
 */
export function extractSupplierConcentrationMap(
  payload: Record<string, any>,
  ss: Record<string, any>
): ConcentrationData | null {
  const c = ss?.concentration;
  if (!c || typeof c !== 'object') return null;

  const rawFlows: any[] = Array.isArray(c.flows) ? c.flows : [];
  if (rawFlows.length === 0) return null;

  const categoriesRaw: any[] = Array.isArray(c.categories) ? c.categories : [];
  const suppliersRaw: any[] = Array.isArray(c.suppliers) ? c.suppliers : [];

  const categoryIds = new Set(
    categoriesRaw
      .filter((cat: any) => cat?.category_id)
      .map((cat: any) => String(cat.category_id))
  );
  const supplierLabels = new Set(
    suppliersRaw
      .filter((s: any) => s?.supplier_label)
      .map((s: any) => String(s.supplier_label))
  );

  const flows = rawFlows
    .filter((f: any) => {
      if (!f || f.value == null) return false;
      const sourceOk = categoryIds.size === 0 || categoryIds.has(String(f.source));
      const targetOk = supplierLabels.size === 0 || supplierLabels.has(String(f.target));
      return sourceOk && targetOk;
    })
    .map((f: any) => ({
      source: String(f.source),
      target: String(f.target),
      value: Number(f.value),
      tier: (Number(f.tier) === 2 ? 2 : 1) as 1 | 2,
      single_source_flag: Boolean(f.single_source_flag),
    }));

  if (flows.length === 0) return null;

  const categories = categoriesRaw
    .filter((cat: any) => cat?.category_id && cat?.category_name)
    .map((cat: any) => {
      const hhiNum = cat.hhi != null ? Number(cat.hhi) : null;
      const interpretation: HhiInterpretation | null =
        cat.hhi_interpretation && ['LOW', 'MODERATE', 'HIGH', 'EXTREME'].includes(
          String(cat.hhi_interpretation).toUpperCase()
        )
          ? (String(cat.hhi_interpretation).toUpperCase() as HhiInterpretation)
          : _interpretHhi(hhiNum);
      return {
        category_id: String(cat.category_id),
        category_name: String(cat.category_name),
        hhi: hhiNum,
        hhi_interpretation: interpretation,
        annual_spend: cat.annual_spend != null ? Number(cat.annual_spend) : null,
      };
    });

  const suppliers = suppliersRaw
    .filter((s: any) => s?.supplier_label)
    .map((s: any) => ({
      supplier_label: String(s.supplier_label),
      geography: s.geography ?? null,
      total_spend: s.total_spend != null ? Number(s.total_spend) : 0,
      category_count: s.category_count != null ? Number(s.category_count) : 0,
      exit_cost_estimate: s.exit_cost_estimate != null ? Number(s.exit_cost_estimate) : null,
      exit_cost_rationale: s.exit_cost_rationale ?? null,
    }));

  const tier2Raw: any[] | null = Array.isArray(c.tier2_dependencies) ? c.tier2_dependencies : null;
  const tier2_dependencies =
    tier2Raw && tier2Raw.length > 0
      ? tier2Raw
          .filter((t: any) => t?.tier1_supplier && t?.tier2_supplier)
          .map((t: any) => ({
            tier1_supplier: String(t.tier1_supplier),
            tier2_supplier: String(t.tier2_supplier),
            dependency_description: t.dependency_description ?? null,
          }))
      : null;

  const geographic_concentration: ConcentrationData['geographic_concentration'] = (
    Array.isArray(c.geographic_concentration) ? c.geographic_concentration : []
  )
    .filter((g: any) => g?.country_code && g?.spend_share_pct != null)
    .map((g: any) => ({
      country_code: String(g.country_code),
      spend_share_pct: Number(g.spend_share_pct),
    }));

  return {
    categories,
    flows,
    suppliers,
    tier2_dependencies: tier2_dependencies && tier2_dependencies.length > 0 ? tier2_dependencies : null,
    geographic_concentration,
    currency: payload?.financial_model?.currency ?? c.currency ?? 'EUR',
  };
}
