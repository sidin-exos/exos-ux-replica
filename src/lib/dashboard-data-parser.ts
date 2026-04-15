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
 * Check whether a raw AI response string is EXOS Output Schema v1.0.
 */
export function isStructuredOutput(raw: string): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.schema_version === '1.0';
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
  const s = String(v ?? '').toLowerCase();
  if (s === 'high' || s === 'red') return 'high';
  if (s === 'low' || s === 'green') return 'low';
  return 'medium';
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
    if (p?.schema_version !== '1.0') return null;
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
  const validRecs = recommendations.filter((r: any) => r?.action);
  if (validRecs.length > 0) {
    result.actionChecklist = {
      actions: validRecs.map((r: any) => ({
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
  const validGaps = dataGaps.filter(isValidGap);
  if (validGaps.length > 0) {
    result.dataQuality = {
      fields: validGaps.map((g: any) => ({
        field: g.field,
        status: 'missing' as const,
        coverage: 0,
      })),
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
      return c?.category && amount !== null
        ? { name: String(c.category), value: amount, type: 'cost' as const }
        : null;
    })
    .filter((c): c is { name: string; value: number; type: 'cost' } => c !== null);
  if (validCostComponents.length > 0) {
    result.costWaterfall = {
      components: validCostComponents,
      currency: payload.financial_model?.currency ?? 'EUR',
    };
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
    const riskSource: any[] =
      (ss.risk_register ?? []).length > 0
        ? ss.risk_register
        : (ss.risk_items ?? []).length > 0
        ? ss.risk_items
        : payload.risk_summary?.risks ?? [];

    if (riskSource.length > 0) {
      result.riskMatrix = {
        risks: riskSource
          .filter((r: any) => r)
          .map((r: any) => ({
            supplier: r.risk_description ?? r.label ?? r.risk ?? 'Unknown risk',
            impact: normaliseRisk(r.impact),
            probability: normaliseRisk(r.likelihood ?? r.probability),
            category: r.category ?? 'Operational',
          })),
      };
    }

    const issues: any[] = ss.issues ?? [];
    const missingClauses: any[] = ss.missing_clauses ?? [];
    if (issues.length > 0 || missingClauses.length > 0) {
      const criticalCount = issues.filter(
        (i: any) => String(i?.severity ?? '').toUpperCase() === 'CRITICAL'
      ).length;
      const clarity = Math.max(0, 100 - criticalCount * 20 - missingClauses.length * 10);
      result.sowAnalysis = {
        clarity,
        sections: [
          ...issues
            .filter((i: any) => i?.clause_reference || i?.issue_description)
            .map((i: any) => ({
              name: i.clause_reference ?? i.issue_id ?? 'Clause',
              status: (String(i.severity ?? '').toUpperCase() === 'CRITICAL'
                ? 'missing'
                : 'partial') as any,
              note: i.issue_description ?? i.recommended_fix ?? '',
            })),
          ...missingClauses
            .filter((c: any) => c?.clause_type)
            .map((c: any) => ({
              name: c.clause_type,
              status: 'missing' as const,
              note: c.risk_if_absent ?? '',
            })),
        ],
        recommendations: issues
          .filter((i: any) => i?.recommended_fix)
          .map((i: any) => i.recommended_fix)
          .slice(0, 5),
      };
    }
  }

  // ── Group D: negotiationPrep + scenarioComparison + timelineRoadmap + decisionMatrix
  if (group === 'D') {
    const batnaStrengthPct: number | null = ss.batna?.batna_strength_pct ?? null;
    const batnaDescription: string | null = ss.batna?.buyer_batna_description ?? ss.batna?.description ?? null;
    const leveragePoints = (ss.leverage_points ?? [])
      .filter((lp: any) => lp?.title && lp?.description)
      .map((lp: any) => ({
        point: lp.title,
        tactic: lp.description,
      }));
    const sequence = (ss.negotiation_sequence ?? [])
      .filter((s: any) => s?.step && s?.detail)
      .map((s: any) => ({ step: s.step, detail: s.detail }));

    if (batnaStrengthPct !== null || leveragePoints.length > 0) {
      result.negotiationPrep = {
        batna: {
          strength: batnaStrengthPct ?? 0,
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

    const roadmap: any[] = ss.three_year_roadmap ?? [];
    if (roadmap.length > 0) {
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
  if (!result.timelineRoadmap) {
    const phases: any[] = ss.phases ?? [];
    if (phases.length > 0) {
      let cursor = 1;
      result.timelineRoadmap = {
        phases: phases
          .filter((p: any) => p?.name || p?.heading)
          .map((p: any, i: number) => {
            const duration = p.duration_weeks ?? 4;
            const startWeek = cursor;
            const endWeek = cursor + duration - 1;
            cursor = endWeek + 1;
            return {
              name: p.name ?? p.heading ?? `Phase ${i + 1}`,
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

  // ── Universal fallback: riskMatrix from risk_register / risk_items / risk_summary
  if (!result.riskMatrix) {
    const riskSource: any[] =
      (ss.risk_register ?? []).length > 0 ? ss.risk_register :
      (ss.risk_items ?? []).length > 0 ? ss.risk_items :
      (payload.risk_summary?.risks ?? []);
    if (riskSource.length > 0) {
      result.riskMatrix = {
        risks: riskSource
          .filter((r: any) => r)
          .map((r: any) => ({
            supplier: r.risk_description ?? r.label ?? r.risk ?? 'Unknown risk',
            impact: normaliseRisk(r.impact),
            probability: normaliseRisk(r.likelihood ?? r.probability),
            category: r.category ?? 'Operational',
          })),
      };
    }
  }

  return Object.keys(result).length === 0 ? null : result;
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
    if (parsed?.schema_version === '1.0') {
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
