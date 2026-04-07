/**
 * EXOS AI Output Schema v1.0 — Shared Module
 *
 * Centralises the scenario group registry, AI prompt contract,
 * group-specific schemas, and defensive JSON parser.
 *
 * Imported by: sentinel-analysis, market-intelligence
 */

// ── Scenario Group Registry ─────────────────────────────────────────
// Server-side only. Never accept group from client request.

export const SCENARIO_GROUP_REGISTRY: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'> = {
  'tco-analysis': 'A',
  'cost-breakdown': 'A',
  'capex-vs-opex': 'A',
  'savings-calculation': 'A',
  'spend-analysis-categorization': 'A',
  'forecasting-budgeting': 'A',
  'saas-optimization': 'A',
  'specification-optimizer': 'A',
  'rfp-generator': 'B',
  'sla-definition': 'B',
  'tail-spend-sourcing': 'B',
  'contract-template': 'B',
  'requirements-gathering': 'B',
  'supplier-review': 'B',
  'procurement-project-planning': 'B',
  'sow-critic': 'C',
  'risk-assessment': 'C',
  'risk-matrix': 'C',
  'software-licensing': 'C',
  'category-risk-evaluator': 'C',
  'negotiation-preparation': 'D',
  'category-strategy': 'D',
  'make-vs-buy': 'D',
  'volume-consolidation': 'D',
  'supplier-dependency-planner': 'D',
  'disruption-management': 'D',
  'black-swan-scenario': 'D',
  'market-snapshot': 'E',
  'pre-flight-audit': 'E',
};

export const SCENARIO_ID_REGISTRY: Record<string, string> = {
  'tco-analysis': 'S1', 'cost-breakdown': 'S2', 'capex-vs-opex': 'S3',
  'savings-calculation': 'S4', 'spend-analysis-categorization': 'S5',
  'forecasting-budgeting': 'S6', 'saas-optimization': 'S7',
  'specification-optimizer': 'S8', 'rfp-generator': 'S9',
  'sla-definition': 'S10', 'tail-spend-sourcing': 'S11',
  'contract-template': 'S12', 'requirements-gathering': 'S13',
  'supplier-review': 'S14', 'procurement-project-planning': 'S15',
  'sow-critic': 'S16', 'risk-assessment': 'S17', 'risk-matrix': 'S18',
  'software-licensing': 'S19', 'category-risk-evaluator': 'S20',
  'negotiation-preparation': 'S21', 'category-strategy': 'S22',
  'make-vs-buy': 'S23', 'volume-consolidation': 'S24',
  'supplier-dependency-planner': 'S25', 'disruption-management': 'S26',
  'black-swan-scenario': 'S27', 'market-snapshot': 'S28',
  'pre-flight-audit': 'S29',
};

export const GROUP_LABELS: Record<string, string> = {
  A: 'Analytical Value',
  B: 'Workflow & Convenience',
  C: 'Reliability & Compliance',
  D: 'Strategic Mentorship',
  E: 'Real-Time Knowledge',
};

// ── Group AI Instructions ───────────────────────────────────────────

export const GROUP_AI_INSTRUCTIONS: Record<string, string> = {
  A: `You are a deterministic financial calculation engine. Every numerical output must be derived from the user's inputs, not estimated. Where inputs are missing, return null for the affected field and add an entry to confidence_flags. Never invent financial figures.`,
  B: `You are a procurement document generation engine. Output structured, ready-to-use documents. Every section must be explicitly labelled. Mark any section where insufficient input was provided with [DATA NEEDED: description] rather than fabricating content.`,
  C: `You are a procurement risk and compliance auditor. Every identified issue must be explicitly referenced to the relevant regulatory standard or contractual clause. Never omit a risk. Use RAG status consistently.`,
  D: `You are a senior procurement strategist applying academic frameworks (BATNA, Kraljic, Porter's Five Forces) to real commercial situations. Every framework output must reference the user's specific inputs — never produce generic textbook descriptions.

S21 Negotiation Preparation — SPECIFIC RULES:
1. batna_strength_pct: Calculate deterministically 0–100 (cap at 95). Formula: start at 50, +10 if ≥2 alternative suppliers mentioned, +10 if switching cost <15% of contract value, +10 if contract is non-critical (leverage/routine in Kraljic), +5 if market is buyer-favourable, −15 if sole-source/monopoly. Clamp to [5, 95].
2. leverage_points[]: Return 2–6 items. Each must have title (≤8 words), description (1–2 sentences referencing user data), and impact ("high"|"medium"|"low"). Forbidden: generic phrases like "Use competitive pressure" without specifics.
3. negotiation_scenarios[]: Always return exactly 3 objects: Conservative, Balanced, Aggressive. Each has name, description, expected_savings_pct (number), risk_level ("low"|"medium"|"high"), and recommended (boolean — exactly one must be true).`,
  E: `You are a market intelligence analyst powered by real-time web search. Every factual claim must be grounded in a cited source. Never state market data without a citation. Use null for any field where live search returned no reliable result.`,
};

// ── Group Schemas ───────────────────────────────────────────────────
// Full JSON schema templates from EXOS_AI_Output_Schema_v1.md Sections 3-7

export const GROUP_SCHEMAS: Record<string, string> = {
  A: `GROUP A PAYLOAD SCHEMA (Analytical Value — S1–S8):
{
  "payload": {
    "financial_model": {
      "currency": "EUR",
      "analysis_period_years": null,
      "cost_breakdown": [
        { "category": "string", "amount": null, "percentage_of_total": null, "notes": null, "confidence": "HIGH | MEDIUM | LOW" }
      ],
      "totals": { "total_cost": null, "npv": null, "npv_discount_rate_pct": null, "annualised_cost": null },
      "top_cost_drivers": [
        { "rank": 1, "category": null, "amount": null, "percentage_of_total": null, "insight": null }
      ],
      "benchmark_comparison": { "industry_benchmark": null, "user_value": null, "gap": null, "benchmark_source": null }
    },
    "scenario_specific": {}
  }
}
Populate scenario_specific based on the scenario being analysed (e.g. vendor_options for TCO, cost_decomposition for Should-Cost, savings_breakdown for Savings Calculation, etc.).
Every numeric field must be derived from user inputs. Use null + confidence_flags entry if input is missing.`,

  B: `GROUP B PAYLOAD SCHEMA (Workflow & Convenience — S9–S15):
{
  "payload": {
    "document": {
      "title": null,
      "sections": [
        { "heading": "string", "content": "string", "data_needed_flags": [] }
      ]
    },
    "scenario_specific": {}
  }
}
Populate scenario_specific based on the scenario (e.g. evaluation_criteria for RFP, metrics for SLA, requirements for BRD, scorecard for Supplier Performance, phases for Project Planning, etc.).
Mark incomplete sections with [DATA NEEDED: description] in the content. Never fabricate document sections.`,

  C: `GROUP C PAYLOAD SCHEMA (Reliability & Compliance — S16–S20):
{
  "payload": {
    "risk_summary": {
      "total_risks_identified": null,
      "critical_count": null, "high_count": null, "medium_count": null, "low_count": null,
      "overall_rag": "RED | AMBER | GREEN"
    },
    "scenario_specific": {}
  }
}
Populate scenario_specific based on the scenario (e.g. issues/missing_clauses for SOW Critic, risk_register for Risk Assessment, risk items with rag_status for Risk Matrix, entitlements/compliance_gaps for Licensing Audit, risk_dimensions for Category Risk).
Every risk must reference a regulatory standard or contractual clause. Use RAG status consistently.`,

  D: `GROUP D PAYLOAD SCHEMA (Strategic Mentorship — S21–S27):
{
  "payload": {
    "framework_applied": null,
    "strategic_verdict": null,
    "scenario_specific": {
      // S21 Negotiation Preparation:
      "batna": {
        "batna_strength_pct": 0,
        "description": "string — 1-2 sentences explaining the BATNA assessment",
        "best_alternative": "string — the specific best alternative identified"
      },
      "zopa": { "low": null, "high": null, "currency": "EUR" },
      "leverage_points": [
        { "title": "string ≤8 words", "description": "string referencing user data", "impact": "high | medium | low" }
      ],
      "negotiation_sequence": [
        { "step": "string — short action label", "detail": "string — 1-2 sentences on execution" }
      ],
      "negotiation_scenarios": [
        { "name": "Conservative | Balanced | Aggressive", "description": "string", "expected_savings_pct": 0, "risk_level": "low | medium | high", "recommended": false }
      ]
    }
  }
}
Populate scenario_specific based on the scenario:
- S21 Negotiation Prep: batna (with batna_strength_pct), zopa, leverage_points[], negotiation_scenarios[] (always 3, exactly one recommended).
- S22 Category Strategy: kraljic_position, porters_five_forces.
- S23 Make vs Buy: make_cost, buy_cost, verdict.
- S24 Volume Consolidation: consolidation_scenarios.
- S25 SRM: development_plan.
- S26 Total Value: value_dimensions.
- S27 Maturity Assessment: maturity dimensions.
All framework outputs must reference the user's specific inputs. Never produce generic textbook descriptions.`,

  E: `GROUP E PAYLOAD SCHEMA (Real-Time Knowledge — S28–S29):
{
  "payload": {
    "query_interpreted": null,
    "search_timestamp": null,
    "sources_consulted": [
      { "source_id": "SRC-001", "title": null, "url": null, "published_date": null, "recency_flag": "CURRENT | RECENT | DATED" }
    ],
    "scenario_specific": {}
  }
}
Populate scenario_specific based on the scenario (e.g. intelligence_blocks/key_market_signals for Market Intelligence, audit_dimensions/entity_verified/proceed_recommendation for Pre-Flight Supplier Audit).
Every factual claim must reference a source_id. Use null for any field where search returned no reliable result.`,
};

// ── AI Prompt Contract ──────────────────────────────────────────────

export const AI_PROMPT_CONTRACT = `
CRITICAL OUTPUT INSTRUCTION:
Your response MUST be a single valid JSON object. No prose before or after it.
Do not use markdown code fences. Return only the raw JSON.

You MUST use the following schema structure:
- Universal envelope fields: schema_version, scenario_id, scenario_name, group, group_label,
  confidence_level, low_confidence_watermark, confidence_flags, summary, executive_bullets,
  data_gaps, recommendations, gdpr_flags, export_metadata, payload.
- schema_version must always be exactly the string "1.0".
- payload must contain the group-specific structure defined below.
- Every defined field must be present. Use null for missing values — never omit a field.
- Set low_confidence_watermark to true if confidence_level is LOW.
- data_gaps RULES (strict):
  1. Maximum 3 entries. Pick the ones with the highest analytical impact.
  2. Each entry MUST name a specific field from the user's input form (e.g. "annual_spend", "contract_end_date"), not generic labels like "Unknown field".
  3. "impact" MUST describe the concrete analytical consequence (e.g. "Cannot calculate NPV without discount rate"), never "Impact not specified".
  4. "resolution" MUST be a specific, actionable coaching tip (e.g. "Add your annual spend figure to unlock cost-per-unit calculations"), never "Provide missing data".
  5. FORBIDDEN placeholder values: "Unknown field", "Impact not specified", "Provide missing data", "Not available", "N/A". If you cannot write a specific entry, omit it entirely.
  6. Tone: helpful coaching, not punitive. Frame as "To strengthen this analysis, add [field]" rather than "Missing: [field]".
- Add an entry to gdpr_flags if any output field appears to contain unanonymised personal
  data (real names, email addresses, phone numbers, salary amounts). Set that field to null
  and explain in gdpr_flags. Never write PII into any output field.

GROUP INSTRUCTION AND SCHEMA:
`;

// ── Defensive JSON Parser ───────────────────────────────────────────

export interface ExosOutputParsed {
  schema_version: string;
  scenario_id: string;
  scenario_name: string;
  group: string;
  group_label: string;
  confidence_level: string;
  low_confidence_watermark: boolean;
  confidence_flags: Array<{ field: string; reason: string; severity: string }>;
  summary: string;
  executive_bullets: string[];
  data_gaps: Array<{ field: string; impact: string; resolution: string }>;
  recommendations: Array<{ priority: string; action: string; financial_impact: string | null; next_scenario: string | null }>;
  gdpr_flags: string[];
  export_metadata: {
    generated_at: string;
    grounding_sources: string[];
    model_used: string;
    langsmith_trace_id: string | null;
  };
  payload: Record<string, unknown>;
}

export function parseAIResponse(raw: string): ExosOutputParsed | null {
  // Attempt 1: direct JSON parse
  try {
    return JSON.parse(raw);
  } catch (_) { /* fall through */ }

  // Attempt 2: extract JSON block if AI added prose or code fences
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) { /* fall through */ }
  }

  // Attempt 3: log and return null for retry
  console.error('[EXOS] AI response failed JSON parsing — triggering retry');
  return null;
}

/**
 * Build a backward-compatible markdown summary from the structured output.
 * Used to populate the `content` field for existing UI rendering.
 */
export function buildMarkdownFromEnvelope(parsed: ExosOutputParsed): string {
  const parts: string[] = [];

  parts.push(`## ${parsed.scenario_name}\n`);
  parts.push(parsed.summary);
  parts.push('');

  if (parsed.executive_bullets?.length > 0) {
    parts.push('### Key Findings');
    parsed.executive_bullets.forEach(b => parts.push(`- ${b}`));
    parts.push('');
  }

  if (parsed.recommendations?.length > 0) {
    parts.push('### Recommendations');
    parsed.recommendations.forEach((r, i) => {
      const priority = r?.priority ?? 'Medium';
      const action = r?.action ?? (typeof r === 'string' ? r : 'See details');
      const impact = r?.financial_impact ? ` — ${r.financial_impact}` : '';
      parts.push(`${i + 1}. **[${priority}]** ${action}${impact}`);
    });
    parts.push('');
  }

  const GENERIC_PHRASES = ['not specified', 'unknown', 'provide missing data', 'not available', 'n/a'];
  const validGaps = (parsed.data_gaps ?? []).filter(g => {
    if (!g?.field || !g?.impact || !g?.resolution) return false;
    const combined = `${g.field} ${g.impact} ${g.resolution}`.toLowerCase();
    return !GENERIC_PHRASES.some(p => combined.includes(p));
  });

  if (validGaps.length > 0) {
    parts.push('');
    parts.push('💡 **To strengthen this analysis:**');
    validGaps.slice(0, 3).forEach(g => {
      parts.push(`- ${g.resolution}`);
    });
    parts.push('');
  }

  return parts.join('\n');
}
