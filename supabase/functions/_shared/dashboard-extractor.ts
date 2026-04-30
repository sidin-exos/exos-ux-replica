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
      // Wave 3 enrichment for S18 — optional fields kept backward-compatible.
      id?: string;
      score?: number;
      rag?: 'RED' | 'AMBER' | 'GREEN';
      owner?: string;
      mitigation?: string;
      currentControl?: string;
      targetResidualRag?: 'RED' | 'AMBER' | 'GREEN';
      financialImpactEur?: number | null;
      regulatoryReference?: string;
      confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
    }[];
    trafficLight?: {
      rag: 'RED' | 'AMBER' | 'GREEN';
      rationale?: string;
      boardNotificationRequired?: boolean;
    };
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

function mapRiskItem(r: any): NonNullable<DashboardData['riskMatrix']>['risks'][number] | null {
  if (!r) return null;
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
    r.issue ?? null;
  if (!title || !String(title).trim()) return null;
  const impactRaw =
    r.impact ?? r.severity ?? r.severity_if_triggered ?? r.consequence ??
    r.business_impact ?? r.financial_impact_score ?? r.rag_status;
  const probRaw =
    r.likelihood ?? r.probability ?? r.dependency_risk_score ??
    r.supply_risk_level ?? r.frequency ?? r.rag_status;

  // Wave 3: enriched S18 fields with RAG reconciliation against derived score.
  const probNum = toScoreNum(r.probability ?? r.likelihood);
  const impactNum = toScoreNum(r.impact ?? r.severity ?? r.business_impact);
  const rawScore = toFiniteNumber(r.score);
  const score = (probNum && impactNum) ? probNum * impactNum : rawScore;
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

  // ── Universal: kraljicQuadrant ─────────────────────────────────────────────
  // Reads scenario_specific.kraljic_position (S20, S1 and any scenario emitting it).
  // supply_risk and business_impact are 1-5; map to 0-100 for the quadrant chart.
  // Skip for S26 — Kraljic portfolio positioning is not relevant during a live crisis.
  const scenarioId = String(envelope.scenario_id ?? '').toUpperCase();
  const kraljicSrc = scenarioId === 'S26' ? null : (ss?.kraljic_position ?? ss?.kraljic ?? null);
  if (kraljicSrc && typeof kraljicSrc === 'object') {
    const sr = Number((kraljicSrc as any).supply_risk ?? (kraljicSrc as any).supplyRisk);
    const bi = Number((kraljicSrc as any).business_impact ?? (kraljicSrc as any).businessImpact);
    if (Number.isFinite(sr) && Number.isFinite(bi)) {
      const name = String(
        (kraljicSrc as any).label ?? (kraljicSrc as any).category ?? ss?.category_name ?? envelope.scenario_label ?? 'Category'
      );
      const scale = (v: number) => Math.max(0, Math.min(100, v <= 5 ? v * 20 : v));
      result.kraljicQuadrant = {
        items: [{
          id: '1',
          name,
          supplyRisk: scale(sr),
          businessImpact: scale(bi),
          spend: (kraljicSrc as any).quadrant ? String((kraljicSrc as any).quadrant) : undefined,
        }],
      };
    }
  }

  // NOTE: supplier-concentration-map for PDF requires the full Sankey shape
  // (categories[]/suppliers[]/flows[]) — handled by the frontend parser via
  // extractSupplierConcentrationMap. PDF dashboard for concentration is opt-in
  // and not currently rendered server-side.



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

    // ── S3 capex-vs-opex: scenario_specific.options[] + sensitivity[] + flexibility_matrix[]
    const capexOptions: any[] = Array.isArray(ss.options) ? ss.options : [];
    const validCapexOptions = capexOptions.filter(
      (o: any) => o?.option_label && (o?.total_capex_nominal != null || o?.total_opex_nominal != null || o?.npv != null)
    );
    if (validCapexOptions.length >= 1) {
      // tcoComparison: cumulative cash flow per option over years
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

      // sensitivitySpider: from sensitivity[]
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

      // scenarioComparison: from flexibility_matrix[]
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
    const riskSource = collectRiskSource(payload, ss);
    if (riskSource.length > 0) {
      const mapped = riskSource.map(mapRiskItem).filter((r): r is NonNullable<typeof r> => r !== null);
      if (mapped.length > 0) {
        result.riskMatrix = { risks: mapped };
      }
    }

    // sowAnalysis — from issues[] and missing_clauses[]
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
        .filter((s: any): s is { name: string; status: 'missing' | 'partial'; note: string } => s !== null);

      const missingSections = missingClauses
        .map((c: any) => {
          const name = c?.clause_type ?? c?.clause ?? c?.title ?? c?.name ?? null;
          const note = c?.risk_if_absent ?? c?.description ?? c?.note ?? '';
          if (!name && !note) return null;
          return { name: name ?? 'Missing clause', status: 'missing' as const, note };
        })
        .filter((s: any): s is { name: string; status: 'missing'; note: string } => s !== null);

      const sections = [...issueSections, ...missingSections];

      // Clarity on a 0–5 scale (matches dashboard contract MAX_SCORE = 5).
      // Derive from section mix when available so headline can't contradict the list.
      let clarity: number;
      if (sections.length > 0) {
        const completeCount = sections.filter((s) => s.status === ('complete' as any)).length;
        const partialCount = sections.filter((s) => s.status === 'partial').length;
        const missingCount = sections.filter((s) => s.status === 'missing').length;
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
    // negotiationPrep (S21) — accept multiple aliases the AI may emit and
    // normalise to a stable shape. Always express batna.strength on a 0–5 scale.
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

    // Leverage points: support leverage_points[], leverage_analysis.buyer_leverage_factors[],
    // and a generic factors[] / items[] fallback.
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

    // Sequence: support negotiation_sequence[] and negotiation_tactics[]
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

    // timelineRoadmap — S26 4-stage emergency response (priority over three_year_roadmap)
    const rp26: any = ss.response_plan ?? null;
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
        // Convert each stage's target duration to weeks (round up) — minimum 1 week per stage so the chart renders.
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

    // timelineRoadmap — from three_year_roadmap[] (S22)
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

  return Object.keys(result).length === 0 ? null : result;
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
