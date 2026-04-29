// supabase/functions/_shared/dashboard-extractor.ts
// Canonical dashboard data extractor — shared by generate-pdf and generate-excel.
// INPUT:  rawString — raw JSON string (ExosOutput envelope, schema_version "1.0")
// OUTPUT: DashboardData | null
//
// The frontend (src/lib/dashboard-data-parser.ts) cannot import from this path directly.
// It maintains a manual sync copy. When this file changes, update the frontend copy too.

export interface DashboardData {
  actionChecklist?: {
    actions: {
      action: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      status: 'done' | 'in-progress' | 'pending' | 'blocked';
      owner?: string;
      dueDate?: string;
    }[];
  };
  decisionMatrix?: {
    criteria: { name: string; weight: number }[];
    options: { name: string; scores: number[] }[];
  };
  costWaterfall?: {
    components: { name: string; value: number; type: 'cost' | 'reduction' }[];
    currency?: string;
  };
  timelineRoadmap?: {
    phases: {
      name: string;
      startWeek: number;
      endWeek: number;
      status: 'completed' | 'in-progress' | 'upcoming';
      milestones?: string[];
    }[];
    totalWeeks?: number;
  };
  kraljicQuadrant?: {
    items: {
      id: string;
      name: string;
      supplyRisk: number;
      businessImpact: number;
      spend?: string;
    }[];
  };
  tcoComparison?: {
    data: { year: string; [key: string]: number | string }[];
    options: { id: string; name: string; color: string; totalTCO: number }[];
    currency?: string;
  };
  licenseTier?: {
    tiers: {
      name: string;
      users: number;
      costPerUser: number;
      totalCost: number;
      color: string;
      recommended?: number;
    }[];
    currency?: string;
  };
  sensitivitySpider?: {
    variables: {
      name: string;
      baseCase: number;
      lowCase: number;
      highCase: number;
      unit?: string;
    }[];
    baseCaseTotal?: number;
    currency?: string;
  };
  riskMatrix?: {
    risks: {
      supplier: string;
      impact: 'high' | 'medium' | 'low';
      probability: 'high' | 'medium' | 'low';
      category: string;
    }[];
  };
  scenarioComparison?: {
    scenarios: { id: string; name: string; color: string }[];
    radarData: { metric: string; [key: string]: number | string }[];
    summary: { criteria: string; [key: string]: string }[];
  };
  supplierScorecard?: {
    suppliers: {
      name: string;
      score: number;
      trend: 'up' | 'down' | 'stable';
      spend: string;
    }[];
  };
  sowAnalysis?: {
    clarity: number;
    sections: { name: string; status: 'complete' | 'partial' | 'missing'; note: string }[];
    recommendations?: string[];
  };
  negotiationPrep?: {
    batna: { strength: number; description: string };
    leveragePoints: { point: string; tactic: string }[];
    sequence: { step: string; detail: string }[];
  };
  dataQuality?: {
    fields: {
      field: string;
      status: 'complete' | 'partial' | 'missing';
      coverage: number;
    }[];
    limitations?: { title: string; impact: string }[];
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SCENARIO_COLORS: Record<string, string> = {
  Conservative: '#10b981',
  Aggressive: '#6366f1',
  Hybrid: '#8b5cf6',
};

const TCO_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

function normaliseRisk(v: unknown): 'high' | 'medium' | 'low' {
  if (typeof v === 'number' && Number.isFinite(v)) {
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
] as const;

function collectRiskSource(payload: Record<string, any>, ss: Record<string, any>): any[] {
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
  return [];
}

function mapRiskItem(r: any): { supplier: string; impact: 'high' | 'medium' | 'low'; probability: 'high' | 'medium' | 'low'; category: string } | null {
  if (!r) return null;
  if (typeof r === 'string') {
    const t = r.trim();
    if (!t) return null;
    return { supplier: t, impact: 'medium', probability: 'medium', category: 'Operational' };
  }
  if (typeof r !== 'object') return null;
  const title =
    r.risk_description ?? r.label ?? r.risk ?? r.vulnerability ?? r.dimension ??
    r.name ?? r.title ?? r.description ?? r.factor ?? r.threat ?? r.hazard ??
    r.issue ?? null;
  if (!title || !String(title).trim()) return null;
  const impactRaw =
    r.impact ?? r.severity ?? r.severity_if_triggered ?? r.consequence ??
    r.business_impact ?? r.financial_impact_score ?? r.rag_status;
  const probRaw =
    r.likelihood ?? r.probability ?? r.dependency_risk_score ??
    r.supply_risk_level ?? r.frequency ?? r.rag_status;
  return {
    supplier: String(title).trim(),
    impact: normaliseRisk(impactRaw),
    probability: normaliseRisk(probRaw),
    category: r.category ?? r.risk_category ?? r.type ?? 'Operational',
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
 * Sources: (1) ss.savings_breakdown[] (S4); (2) quantified recommendations[].
 * Kept in sync with src/lib/dashboard-data-parser.ts::extractReductionComponents.
 */
function extractReductionComponents(
  ss: Record<string, any>,
  recommendations: any[],
  costComponents: Array<{ name: string; value: number; type: 'cost' }>,
): Array<{ name: string; value: number; type: 'reduction' }> {
  const out: Array<{ name: string; value: number; type: 'reduction' }> = [];
  const grossCost = costComponents.reduce((s, c) => s + c.value, 0);

  const savingsBreakdown: any[] = Array.isArray(ss?.savings_breakdown) ? ss.savings_breakdown : [];
  for (const s of savingsBreakdown) {
    const annual = parseAmount(s?.annual_savings);
    const oneOff = parseAmount(s?.one_off_savings);
    const total = (annual ?? 0) + (oneOff ?? 0);
    if (s?.lever && total > 0) {
      out.push({ name: String(s.lever), value: total, type: 'reduction' });
    }
  }

  if (out.length === 0 && Array.isArray(recommendations)) {
    for (const r of recommendations) {
      if (!r?.action) continue;
      const text = `${r.financial_impact ?? ''} ${r.action}`;
      const amountMatch = text.match(/(?:€|\$|£|EUR|USD|GBP)\s?([\d.,]+\s?[KMB]?)/i);
      let value: number | null = null;
      let label = String(r.action).slice(0, 60).trim();
      if (amountMatch) {
        value = parseAmount(amountMatch[1]);
      } else {
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
        label = label.replace(/^[-•\d.\s\[\]]+/, '').replace(/^\[(?:high|medium|low|critical)\]\s*/i, '');
        out.push({ name: label.slice(0, 50), value, type: 'reduction' });
      }
    }
  }

  return out.slice(0, 6);
}

// ── Main export ──────────────────────────────────────────────────────────────

export function extractFromEnvelope(rawString: string): DashboardData | null {
  let envelope: Record<string, any>;
  try {
    const parsed = JSON.parse(rawString);
    if (!['1.0','2.0'].includes(parsed?.schema_version)) return null;
    envelope = parsed;
  } catch {
    return null;
  }

  const group: string = envelope.group ?? '';
  const payload: Record<string, any> = envelope.payload ?? {};
  const ss: Record<string, any> = payload.scenario_specific ?? {};
  const recommendations: any[] = envelope.recommendations ?? [];
  const dataGaps: any[] = envelope.data_gaps ?? [];
  const result: DashboardData = {};

  // ── Universal: actionChecklist ─────────────────────────────────────────────
  // Accept both object form ({ action, priority }) and plain-string form
  // ("Renegotiate vendor contract"). Coerce strings into the expected shape.
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

  // ── Universal: dataQuality ─────────────────────────────────────────────────
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

  // ── Universal: costWaterfall ───────────────────────────────────────────────
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

  const reductionComponents = extractReductionComponents(ss, recommendations, validCostComponents);

  if (validCostComponents.length > 0 || reductionComponents.length > 0) {
    result.costWaterfall = {
      components: [...validCostComponents, ...reductionComponents],
      currency: payload.financial_model?.currency ?? 'EUR',
    };
  }

  // ── Group A: tcoComparison ─────────────────────────────────────────────────
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

  // ── Group B: supplierScorecard ─────────────────────────────────────────────
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

  // ── Group C: riskMatrix + sowAnalysis ──────────────────────────────────────
  if (group === 'C') {
    // riskMatrix — check BOTH paths
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

    // sowAnalysis — from issues[] and missing_clauses[]
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
    // negotiationPrep (S21)
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

    // scenarioComparison — derived from negotiation_scenarios[] (S21)
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

    // timelineRoadmap — from three_year_roadmap[] (S22)
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

    // decisionMatrix — from qualitative_factors[] (S23)
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
