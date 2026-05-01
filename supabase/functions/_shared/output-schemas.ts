/**
 * EXOS AI Output Schema v2.0 — Shared Module
 *
 * Centralises the scenario group registry, AI prompt contract,
 * group-specific schemas, and defensive JSON parser.
 *
 * v2.0 changes:
 *   - Group D S25/S26/S27 fully replaced (Supplier Dependency Planner /
 *     Disruption Management / Black Swan Scenario Simulation).
 *   - Additive: working_capital (Group A), savings_classification (S4),
 *     concentration (S20/S24/S25/S27).
 *   - schema_version now "2.0" on emit; "1.0" still accepted on read.
 *
 * Imported by: sentinel-analysis, market-intelligence
 */

// ── Schema version handling ────────────────────────────────────────
// v1.0 envelopes (historical reports) must continue to parse;
// new AI output emits "2.0".
export const SUPPORTED_SCHEMA_VERSIONS = ['1.0', '2.0'] as const;
export type SchemaVersion = typeof SUPPORTED_SCHEMA_VERSIONS[number];

export function validateSchemaVersion(envelope: { schema_version?: string } | null | undefined): boolean {
  if (!envelope?.schema_version) return false;
  return (SUPPORTED_SCHEMA_VERSIONS as readonly string[]).includes(envelope.schema_version);
}

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
  D: `You are a senior procurement strategist applying academic frameworks (BATNA, Kraljic, Porter's Five Forces, TCO, Make vs. Buy, RTO/RPO) to real commercial situations. Every framework output must reference the user's specific inputs — never produce generic textbook descriptions. Quantify financial impact wherever possible. Flag inside information risks (MAR) when strategy documents contain unannounced business plans. When supplier and category spend data are available, populate concentration using the HHI formula: sum of (supplier_spend_share_pct)² per category.`,
  E: `You are a market intelligence analyst powered by real-time web search. Every factual claim must be grounded in a cited source. Never state market data without a citation. Use null for any field where live search returned no reliable result.`,
};

// Scenario-specific instruction addenda (loaded ONLY for the active scenario
// to keep token budget tight). Add new entries keyed by S## code.
export const SCENARIO_INSTRUCTION_ADDENDA: Record<string, string> = {
  S21: `
S21 Negotiation Preparation — SPECIFIC RULES:
1. Populate batna with buyer_batna (specific best alternative identified), buyer_batna_value (quantified value where possible), supplier_batna_estimated, batna_strength_pct (0–100 integer reflecting how credible/ready the buyer's BATNA is), and batna_improvement_actions[] (2–4 concrete steps to strengthen BATNA — e.g. "Pre-qualify second alternative supplier", "Run sample pilot to validate quality").
2. Populate zopa with buyer_walk_away (kept confidential and masked in shared exports), buyer_target, supplier_likely_floor, and zopa_exists (boolean — true only if a positive zone exists).
3. leverage_analysis: list buyer_leverage_factors[] and supplier_leverage_factors[] referencing the user's specific inputs; set power_balance to BUYER_ADVANTAGE | BALANCED | SUPPLIER_ADVANTAGE.
4. negotiation_tactics[]: 3–6 tactical steps tailored to the user's situation — never generic advice. Each item: { "title": "...", "description": "..." }.
5. negotiation_sequence[]: REQUIRED. Provide exactly 3–5 ordered tactical moves covering opening / anchoring / value exchange / concession / closing. Each item: { "step": "Opening | Anchor | Value Exchange | Concession | Walk-away Trigger | Close", "detail": "specific action tied to the user's case" }.
6. counter_arguments[]: REQUIRED. 3–5 anticipated supplier objections with prepared responses. Each item: { "supplier_position": "what the supplier is likely to say", "buyer_response": "how to counter", "evidence": "fact / data point that supports the response" }.
7. walk_away_plan: REQUIRED. { "trigger_conditions": ["specific thresholds, e.g. price increase >3%, refusal to remove volume floor"], "exit_steps": ["sequenced actions if BATNA activates"], "communication_script": "one short paragraph the buyer can use to walk away professionally" }.
8. value_creation[]: REQUIRED. 2–4 win-win opportunities to expand the pie. Each item: { "opportunity": "...", "buyer_benefit": "...", "supplier_benefit": "..." }.
9. risk_register[]: REQUIRED. 3–5 negotiation risks. Each item: { "risk": "...", "likelihood": "HIGH | MEDIUM | LOW", "impact": "HIGH | MEDIUM | LOW", "mitigation": "..." }.
10. financial_outcome_range: optimistic / realistic / pessimistic monetary outcomes derived from the user's data.
11. ALL EIGHT WIZARD DELIVERABLES ARE MANDATORY: (1) leverage_analysis with non-empty buyer_leverage_factors[], supplier_leverage_factors[] and a non-template power_balance value; (2) batna with batna_strength_pct AND batna_improvement_actions[] (>=2); (3) risk_register[] (>=3); (4) opening_position + negotiation_sequence[] (>=4 steps); (5) counter_arguments[] (>=3); (6) walk_away_plan with all three sub-fields populated; (7) value_creation[] (>=2); (8) financial_outcome_range with numeric optimistic / realistic / pessimistic. An empty array or a literal "Conservative | Aggressive | Hybrid" placeholder is treated as a report failure.
12. TEXT FORMATTING: Use ASCII-safe comparators ("<=", ">=", "<", ">") in every text field — do NOT use the Unicode glyphs ≤ ≥ which fail to render in some PDF fonts.
13. JSON STRUCTURE — CRITICAL: scenario_specific MUST be a single JSON OBJECT (open with { and close with }), never an array. Each sub-key (batna, zopa, leverage_analysis, walk_away_plan, financial_outcome_range) is a single OBJECT closed with }. Only counter_arguments, value_creation, risk_register, negotiation_tactics, negotiation_sequence, batna_improvement_actions, buyer_leverage_factors, supplier_leverage_factors, trigger_conditions and exit_steps are ARRAYS closed with ]. Match every opening { with } and every opening [ with ] — mismatched closers (e.g. closing scenario_specific or payload with ]) will fail validation.`,
};

/** Return group instruction + only the active scenario's addendum (token-efficient). */
export function getScenarioInstructions(group: string | null | undefined, scenarioId: string | null | undefined): string {
  const base = group ? GROUP_AI_INSTRUCTIONS[group] || '' : '';
  if (!scenarioId) return base;
  const code = SCENARIO_ID_TO_CODE[scenarioId] || scenarioId;
  const addendum = SCENARIO_INSTRUCTION_ADDENDA[code];
  return addendum ? `${base}\n${addendum}` : base;
}


// ── Group Schemas ───────────────────────────────────────────────────
// Full JSON schema templates from EXOS_AI_Output_Schema_v2.md Sections 3-7.

// Reusable concentration block (S20, S24, S25, S27) — keeps the four
// scenario schemas in lock-step. Interpolated into Group C / Group D strings.
export const CONCENTRATION_SCHEMA_FRAGMENT = `"concentration": {
      "categories": [
        { "category_id": "CAT-001", "category_name": null, "hhi": null, "hhi_interpretation": "LOW | MODERATE | HIGH | EXTREME", "annual_spend": null }
      ],
      "flows": [
        { "source": "CAT-001", "target": "Supplier_001", "value": null, "tier": 1, "single_source_flag": false }
      ],
      "suppliers": [
        { "supplier_label": "Supplier_001", "geography": null, "total_spend": null, "category_count": null, "exit_cost_estimate": null, "exit_cost_rationale": null }
      ],
      "tier2_dependencies": null,
      "geographic_concentration": [
        { "country_code": "DE", "spend_share_pct": null }
      ],
      "currency": "EUR"
    }`;

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
      "benchmark_comparison": { "industry_benchmark": null, "user_value": null, "gap": null, "benchmark_source": null, "industry_margin_pct": null },
      "working_capital": {
        "current_weighted_dpo": null,
        "target_weighted_dpo": null,
        "working_capital_delta_eur": null,
        "annual_spend_eur": null,
        "terms_distribution": [
          { "term_label": "NET 30 | NET 45 | NET 60 | NET 90+", "spend_share_pct": null, "supplier_count": null }
        ],
        "by_supplier": [
          { "supplier_label": "string (tokenised)", "category": null, "payment_terms_days": null, "annual_spend": null, "late_payment_directive_risk": false }
        ],
        "early_payment_discount_opportunities": [
          { "supplier_label": "string (tokenised)", "discount_structure": "e.g. 2/10 NET 30", "annualised_value": null }
        ],
        "currency": "EUR"
      }
    },
    "scenario_specific": {}
  }
}
FINANCIAL_MODEL IS ALWAYS REQUIRED (independent of scenario_specific):
- payload.financial_model.cost_breakdown MUST always contain at least 3 cost categories with non-null numeric "amount" values. When the user provided exact figures, derive amounts from them. When the user provided only partial figures (e.g. unit price + annual spend, or total spend only), you MUST still emit numeric amounts by applying defensible industry-typical percentage splits for the named product/category and flag each estimated entry with confidence: "LOW" plus a "notes" field explaining the assumption. NEVER emit cost_breakdown items with amount: null — an estimated low-confidence breakdown is more useful than a hidden dashboard. Do NOT skip this section — it powers the Cost Breakdown dashboard for every Group A scenario.
- COST_BREAKDOWN LABEL HYGIENE (HARD RULE): each cost_breakdown[].category value MUST be a short noun phrase naming a cost CATEGORY (e.g. "Licences", "Implementation", "Support", "Training", "Materials", "Labour", "Tooling"). It MUST NOT be a sentence, recommendation, action, or verb phrase. NEVER emit values like "Issue RFP for...", "Renegotiate...", "Consolidate...", "Reduce...". Maximum 40 characters, no leading verb, no trailing punctuation. Recommendations belong in the recommendations[] array, not in cost_breakdown labels. The downstream Cost Breakdown chart will reject any cost item whose label looks like a recommendation.
- payload.financial_model.totals.total_cost MUST be the sum of cost_breakdown amounts.
- payload.financial_model.currency MUST be set (default "EUR").
- payload.financial_model.analysis_period_years MUST be set when the scenario involves a time horizon (TCO, Capex/Opex, Forecasting).

Then ALSO populate scenario_specific with the per-scenario structure below — this is in ADDITION to financial_model, never instead of it:

- tco-analysis (S1): scenario_specific.vendor_options MUST be an array of AT LEAST 2 objects, each with vendor_label (string), total_tco (number), year_breakdown (array of { year: number, cost: number }). If the user provided only one option to analyse, generate the comparison against a clearly-labelled status-quo / do-nothing / industry-benchmark alternative. Never return fewer than 2 vendor_options for tco-analysis. The financial_model.cost_breakdown for tco-analysis represents the categorical decomposition of the PRIMARY (recommended) option's total_tco.
- cost-breakdown (S2): use financial_model.cost_breakdown as the primary source AND populate scenario_specific with the should-cost decomposition described below — both are mandatory deliverables for this scenario.
  {
    "scenario_specific": {
      "cost_decomposition": [
        { "component": "Material | Labour | Tooling/Setup | Overhead | Logistics | Margin | …", "estimated_pct": null, "benchmark_pct": null, "gap_pct": null, "confidence": "HIGH | MEDIUM | LOW", "rationale": "string" }
      ],
      "negotiation_anchor": {
        "current_price": null,
        "should_cost_target": null,
        "headroom_pct": null,
        "rationale": "string"
      },
      "estimated_supplier_margin_pct": null,
      "top_cost_drivers_commentary": "string (optional)"
    }
  }
  S2 AI guidance: cost_decomposition[] MUST contain at least 4 components summing to ~100%. When the user supplies only a unit price, target price and/or annual spend WITHOUT a cost-structure breakdown, you MUST still emit cost_decomposition[] using a defensible industry-typical split for the named product/process (e.g. injection moulding ≈ 45% material / 20% labour+machine / 15% tooling+setup / 10% overhead / 10% margin; machined parts ≈ 35/30/15/10/10; electronics assembly ≈ 55/15/10/10/10) and flag every estimated component with confidence: "LOW" plus a rationale citing the assumed benchmark. NEVER skip cost_decomposition[] for S2 — an estimated low-confidence decomposition is more useful to the user than a hidden dashboard. Same rule applies to financial_model.cost_breakdown: when only a unit price + annual spend are known, derive amounts by applying the estimated_pct splits to total_cost and mark each entry confidence: "LOW". negotiation_anchor.headroom_pct = (current_price - should_cost_target) / current_price * 100. Always include a benchmark_pct on each component when you can cite an industry norm; leave null only when no defensible benchmark exists.
- savings-calculation (S4): scenario_specific.savings_breakdown — array of { lever (string), annual_savings (number), one_off_savings (number), confidence (HIGH|MEDIUM|LOW) }.
  ADDITIONALLY for S4, you MUST populate scenario_specific.savings_classification with the following structure (every field initialised to null when unknown):
  {
    "savings_classification": {
      "baseline_verified": false,
      "hard": {
        "baseline_value": null, "new_value": null, "annual_volume": null,
        "annualised_savings": null, "pnl_impact": null
      },
      "soft": {
        "baseline_value": null, "new_value": null,
        "annualised_avoidance": null, "justification": null
      },
      "avoided": {
        "inflation_index_applied": null, "inflation_rate_pct": null,
        "baseline_adjusted_value": null, "protected_value": null
      },
      "funnel": { "identified": null, "committed": null, "realized": null }
    }
  }
  Classify every savings figure into exactly one of three CIPS categories: HARD (direct P&L impact — price reduction on confirmed volume), SOFT (cost avoidance — benefit not reflected in P&L, e.g. scope reduction), or AVOIDED (inflation-adjusted baseline protection). Do not aggregate across categories. If the user has not specified a category, default to SOFT and add a data_gaps[] entry requesting classification confirmation. Set baseline_verified=true ONLY if the user provided a documented historical baseline, not an estimate.
- capex-vs-opex (S3): scenario_specific MUST contain ALL of the following structures:
  {
    "options": [
      {
        "option_label": "CAPEX (Buy) | OPEX (Lease) | string",
        "total_capex_nominal": number,         // total upfront + maintenance over period (nominal €)
        "total_opex_nominal": number,          // total lease/subscription + maintenance over period (nominal €)
        "npv": number,                         // net present value at WACC; negative = net cost
        "discount_rate_used_pct": number,      // WACC actually applied; if user gave none, use 8% and add data_gaps[] entry
        "residual_value": number,              // 0 for OPEX
        "ifrs16_on_balance_sheet": true | false,
        "year_by_year": [
          { "year": number, "capex_cf": number, "opex_cf": number, "discounted_capex": number, "discounted_opex": number }
        ]
      }
    ],
    "sensitivity": [
      // 4–6 variables. Recompute the recommended option's NPV at low/high. Never invent variables outside user inputs.
      { "variable": "WACC | Residual value | Lease rate | Maintenance inflation | Asset lifespan", "base": number, "low": number, "high": number, "unit": "% | € | years" }
    ],
    "flexibility_matrix": [
      // Score each dimension 1–5 for both options.
      { "dimension": "Upgrade flexibility | Exit cost | Balance-sheet impact | Cash preservation | Tax shield", "capex_score": 1-5, "opex_score": 1-5, "rationale": "string" }
    ],
    "cfo_recommendation": {
      "verdict": "BUY | LEASE | HYBRID",
      "cash_flow_rationale": "string — refer to year-1 cash impact and payback",
      "ifrs16_note": "string — on-balance-sheet vs off-balance-sheet implications",
      "wacc_assumed_pct": number
    }
  }
  Recommendations array MUST follow {priority: HIGH|MEDIUM|LOW, action, financial_impact, next_scenario} contract — DO NOT pad with filler MEDIUM/LOW recommendations to reach a count. Emit only recommendations supported by user-provided data. Never write phrases like "from CAPEX" or "from OPEX" as if they were vendor names — these are option labels, not entities.
- saas-optimization (S7): scenario_specific MUST contain ALL of the following structures. This is the ONLY way the SaaS dashboards (license-tier, kill list, duplicate matrix, tier mismatch) can render — narrative text alone will be discarded.
  {
    "scenario_specific": {
      "tools_inventory": [
        {
          "tool_name": "string (tokenised vendor label, e.g. SAAS_TOOL_A)",
          "tier_label": "Enterprise | Business | Pro | Standard | Basic | string",
          "licences_purchased": number,
          "licences_active": number,
          "annual_cost_eur": number,
          "cost_per_user_eur": number,
          "renewal_date": "YYYY-MM-DD or null",
          "primary_use_case": "string (short)",
          "utilisation_pct": number | null,
          "recommended_licences": number,
          "confidence": "HIGH | MEDIUM | LOW"
        }
      ],
      "kill_list": [
        {
          "tool_name": "string (matches tools_inventory.tool_name)",
          "reason": "UNUSED | DUPLICATE | LOW_UTILISATION | AUTO_RENEWAL_TRAP | OUT_OF_SCOPE",
          "annual_savings_eur": number,
          "cancellation_deadline": "YYYY-MM-DD or null",
          "evidence": "string — one sentence citing the user's data"
        }
      ],
      "duplicate_matrix": [
        {
          "feature_area": "e.g. Project Management | File Storage | Video Conferencing",
          "tools": ["tool_name_a", "tool_name_b"],
          "overlap_pct": number,
          "consolidation_recommendation": "KEEP_A | KEEP_B | KEEP_BOTH | EVALUATE_THIRD",
          "annual_savings_eur": number
        }
      ],
      "tier_mismatch": [
        {
          "tool_name": "string",
          "current_tier": "string",
          "recommended_tier": "string",
          "reason": "string — feature usage gap",
          "monthly_savings_per_user_eur": number,
          "users_to_downgrade": number,
          "annual_savings_eur": number
        }
      ],
      "savings_summary": {
        "identified_annual_savings_eur": number,   // sum of kill_list + duplicate_matrix + tier_mismatch
        "target_annual_savings_eur": number,        // user-stated target if provided, else 25% of total spend (Gartner benchmark)
        "current_total_annual_spend_eur": number,
        "savings_pct_of_spend": number,
        "confidence": "HIGH | MEDIUM | LOW"
      }
    }
  }
  S7 AI guidance:
  • tools_inventory[] MUST contain one entry per SaaS tool the user listed in subscriptionDetails — do not collapse, summarise or drop tools.
  • For each tool, set licences_active from the user's data; if only utilisation % is given, derive licences_active = round(licences_purchased * utilisation_pct/100).
  • cost_per_user_eur = annual_cost_eur / licences_purchased.
  • recommended_licences = max(licences_active, ceil(licences_purchased * 0.85)) when utilisation is unknown; otherwise = licences_active rounded up to nearest 5.
  • kill_list[] MUST include every tool with utilisation_pct < 30% OR flagged as duplicate by the user. Set reason precisely.
  • duplicate_matrix[] is REQUIRED whenever the user mentions overlap or two tools share a primary_use_case — if no overlaps exist, emit an empty array, never omit the key.
  • tier_mismatch[] MUST flag every tool where users on Enterprise/Business tiers don't use tier-exclusive features. If the user did not provide feature data, emit an empty array — do not invent.
  • savings_summary.identified_annual_savings_eur MUST equal the sum of all kill_list[].annual_savings_eur + duplicate_matrix[].annual_savings_eur + tier_mismatch[].annual_savings_eur. Reconcile or the dashboard will flag inconsistency.
  • financial_model.cost_breakdown for S7 MUST list TOOL CATEGORIES (e.g. "CRM", "Collaboration", "Security", "Analytics", "DevOps") with the summed annual_cost_eur per category — NOT individual tool names and NEVER recommendation strings.
- spend-analysis-categorization (S5): scenario_specific MUST contain ALL of the following structures. This is the ONLY way the Spend Analysis dashboard (taxonomy, tail spend, vendor consolidation, quick wins) can render — narrative text alone will be discarded.
  {
    "scenario_specific": {
      "taxonomy_breakdown": [
        {
          "level1": "string (top-level category, e.g. 'Direct Materials', 'IT Services', 'Professional Services')",
          "level2": "string or null (sub-category, e.g. 'APIs', 'Cloud Hosting', 'Legal Counsel')",
          "taxonomy_code": "string or null (e.g. UNSPSC '51171500' or eCl@ss code if user-provided taxonomy used)",
          "annual_spend_eur": number,
          "spend_share_pct": number,
          "supplier_count": number,
          "sample_skus": ["string"],
          "confidence": "HIGH | MEDIUM | LOW"
        }
      ],
      "tail_spend": {
        "threshold_pct_of_total": number,
        "spend_in_tail_eur": number,
        "spend_in_tail_pct": number,
        "suppliers_in_tail": number,
        "transactions_in_tail": number,
        "addressable_savings_eur": number,
        "candidates": [
          {
            "category": "string",
            "supplier_count": number,
            "annual_spend_eur": number,
            "consolidation_action": "AGGREGATE | CATALOGUE | P_CARD | ELIMINATE | string"
          }
        ]
      },
      "vendor_consolidation": [
        {
          "category": "string",
          "current_suppliers": number,
          "target_suppliers": number,
          "current_spend_eur": number,
          "estimated_savings_eur": number,
          "savings_pct": number,
          "rationale": "string — why these suppliers are consolidation candidates",
          "preferred_supplier": "string or null (tokenised label)"
        }
      ],
      "quick_wins": [
        {
          "action": "string — short imperative (e.g. 'Move office supplies to P-card')",
          "owner_role": "Procurement | Finance | IT | Legal | Operations | string",
          "weeks_to_value": number,
          "estimated_savings_eur": number,
          "effort": "LOW | MEDIUM | HIGH",
          "priority": "HIGH | MEDIUM | LOW"
        }
      ],
      "savings_summary": {
        "total_addressable_spend_eur": number,
        "identified_savings_eur": number,
        "savings_pct_of_addressable": number,
        "confidence": "HIGH | MEDIUM | LOW"
      }
    }
  }
  S5 AI guidance:
  • taxonomy_breakdown[] MUST contain at least 3 level1 categories whose annual_spend_eur sums to ~100% of the user's total addressable spend. Use UNSPSC if the user nominated it; otherwise use clear English category names.
  • tail_spend.threshold_pct_of_total defaults to 80 (Pareto rule — bottom 20% of spend across the long tail of suppliers/transactions).
  • tail_spend.candidates[] MUST list at least 3 entries when total spend > 0; if the dataset has no clear tail (e.g. <10 suppliers), set suppliers_in_tail=0 and emit candidates: [].
  • vendor_consolidation[] MUST flag every category where the user has 3+ suppliers spending on the same level1/level2 category. estimated_savings_eur should be 5–12% of current_spend_eur depending on category leverage; never invent figures above 15% without explicit user evidence.
  • quick_wins[] MUST contain 3–6 actions, each with a quantified estimated_savings_eur and weeks_to_value <= 12. Quick wins are tactical (P-card moves, catalogue uploads, supplier consolidations), NOT strategic re-sourcing.
  • savings_summary.identified_savings_eur MUST equal sum(vendor_consolidation[].estimated_savings_eur) + sum(quick_wins[].estimated_savings_eur) + tail_spend.addressable_savings_eur. Reconcile or the dashboard will flag inconsistency.
  • financial_model.cost_breakdown for S5 MUST mirror taxonomy_breakdown[] — one entry per level1 category with the summed annual_spend_eur. Do NOT emit supplier names or recommendation strings as cost categories.
- For other Group A scenarios, populate scenario_specific with the most directly relevant structured data the dashboards can render.


WORKING CAPITAL (financial_model.working_capital) — OPTIONAL:
Populate working_capital ONLY if the user has provided payment terms data (e.g. NET 30, supplier payment schedules, DPO figures, or equivalent). Do not invent payment terms. If no terms data is present in the input, leave working_capital = null and do NOT add to data_gaps[] (this is optional, not mandatory).
Formula: working_capital_delta_eur = annual_spend_eur × (target_weighted_dpo - current_weighted_dpo) / 365.
Flag late_payment_directive_risk=true for any supplier whose payment_terms_days exceeds 60 (EU Late Payment Directive 2011/7 B2B statutory limit). Use tokenised supplier labels — never emit legal entity names.

Every numeric field must be derived from user inputs. Use null + confidence_flags entry ONLY when input is genuinely missing — do not use null as a shortcut to skip computation when you have the data.`,

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
Mark incomplete sections with [DATA NEEDED: description] in the content. Never fabricate document sections.

S9 RFP Generator — scenario_specific MUST contain ALL of the following structures (the five promised deliverables: Extracted Brief, Tender Document, Evaluation Matrix, Clarifications, Suggested Attachments):
{
  "extracted_brief": {
    "summary": "string — 2–3 sentences capturing the essence of the requirement",
    "scope_type": "GOODS | SERVICES | MIXED | WORKS",
    "package_type": "RFP | RFI | RFQ",
    "volume": "string | null — e.g. '450 users across 3 offices', '12,000 units/year'",
    "locations": ["string"],
    "annual_budget_eur": null,
    "incumbent_status": "string | null — e.g. 'In-house team of 6', 'Currently with [SUPPLIER_A]', 'No incumbent'",
    "mandatory_compliance": ["string — e.g. 'ISO 27001', 'GDPR', 'SOC2 Type 2'"],
    "deadlines": {
      "rfp_issue": "string | null",
      "questions_due": "string | null",
      "submission_due": "string | null",
      "award_target": "string | null",
      "go_live_target": "string | null"
    }
  },
  "tender_document": {
    "type": "RFP | RFI | RFQ",
    "title": "string",
    "sections": [
      { "heading": "string — e.g. 'Scope of Services', 'SLA Requirements', 'Pricing Schedule', 'Terms & Conditions'", "content": "string — full body text, not bullets", "mandatory": true | false }
    ]
  },
  "evaluation_matrix": {
    "scoring_scale": "1-5 | 1-10 | 0-100",
    "criteria": [
      {
        "name": "string — e.g. 'Quality', 'Price', 'Sustainability', 'References'",
        "weight_pct": 0-100,
        "sub_criteria": [
          { "name": "string", "weight_pct": 0-100, "scoring_guidance": "string — what earns max score" }
        ]
      }
    ],
    "total_weight_check": 100,
    "minimum_qualifying_score": null
  },
  "clarifications": [
    { "question": "string — what the buyer must clarify before issuing", "why_it_matters": "string — risk if unresolved", "severity": "HIGH | MEDIUM | LOW", "field": "string — which input field is incomplete" }
  ],
  "suggested_attachments": [
    { "name": "string — e.g. 'Pricing Schedule Template', 'Supplier Questionnaire', 'NDA Template', 'Reference Form'", "purpose": "string", "template_available": true | false }
  ]
}
S9 AI guidance — MANDATORY rules:
- extracted_brief MUST be populated by parsing the user's raw_brief verbatim. Do NOT invent volume/locations/budget — if absent, use null and add to clarifications[] with severity HIGH.
- tender_document.sections MUST contain at least 6 sections covering: Background & Context, Scope, Mandatory Requirements (compliance), Service Levels / Deliverables, Pricing Structure, Evaluation Process, Timeline, Terms & Conditions. Do not output single-line bullets — each section.content is a buyer-ready paragraph (3–8 sentences).
- evaluation_matrix.criteria[].weight_pct MUST sum to exactly 100. If the user supplied weighting in compliance_evaluation, use it verbatim. Otherwise propose a defensible split based on package_type (RFI = quality-heavy, RFQ = price-heavy, RFP = balanced) and flag confidence: "LOW" in a clarification.
- evaluation_matrix.total_weight_check MUST equal sum(criteria[].weight_pct). Server reconciles.
- clarifications[] MUST contain at least one entry per missing/null field in extracted_brief.
- suggested_attachments[] MUST contain 3–6 entries appropriate to package_type.
- Use tokenised supplier labels ([SUPPLIER_A], etc.) — never emit legal entity names. NEVER tokenise compliance standards (ISO, GDPR, SOC2, NIS2, TUPE, HIPAA, PCI-DSS) — these are framework names, not PII.
- Recommendations[] in the envelope MUST use a separate concise title (≤8 words) and body — do NOT prefix titles with "[High]" / "[Medium]"; severity belongs in the structured priority field.`,

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
Every risk must reference a regulatory standard or contractual clause. Use RAG status consistently.

S18 Risk Matrix — scenario_specific MUST contain the following structure (the three promised deliverables: Risk Heatmap, Mitigation Plan, Traffic Light Status):
{
  "risk_register": [
    {
      "id": "R1",
      "risk": "string — concise risk description",
      "category": "Operational | Financial | Compliance | Strategic | Reputational | Cyber | Supply | Commercial",
      "probability": 1-5,                          // 1 = rare, 5 = almost certain
      "impact": 1-5,                               // 1 = negligible, 5 = catastrophic
      "score": null,                               // = probability * impact (server reconciles)
      "current_control": "string",
      "owner_role": "string — role/function (never a person name)",
      "mitigation": "string — concrete next action",
      "target_residual_rag": "RED | AMBER | GREEN",
      "financial_impact_eur": null,                // single-loss exposure estimate
      "rag_status": "RED | AMBER | GREEN",
      "regulatory_reference": "string — e.g. GDPR Art. 32, NIS2 Art. 21, SOC2 CC6.1",
      "confidence": "HIGH | MEDIUM | LOW"
    }
  ],
  "mitigation_plan": [
    { "risk_id": "R1", "action": "string", "priority": "CRITICAL | HIGH | MEDIUM | LOW", "owner_role": "string", "target_date": "string | null", "expected_residual_rag": "RED | AMBER | GREEN" }
  ],
  "traffic_light_status": {
    "rag": "RED | AMBER | GREEN",
    "rationale": "string — 1–2 sentences citing the worst-scoring risks",
    "board_notification_required": true
  }
}
S18 AI guidance — MANDATORY rules:
- risk_register[] MUST contain AT LEAST 5 items. If the user supplied fewer than 5 explicit risks, infer additional plausible risks from the industry/category context (cyber, supply continuity, commercial stability, regulatory, reputational, geopolitical) and flag each inferred item with confidence: "LOW".
- probability and impact MUST be numeric 1–5 integers, NEVER all identical across the register. A degenerate matrix (every item scored the same) is a failure mode — spread the distribution to reflect real differentiation. If the user did not provide H/M/L ratings, infer them from the risk descriptions and benchmark prevalence, marking confidence: "LOW".
- score = probability * impact. The server will recompute and overwrite this field; emit your best estimate.
- rag_status MUST be derived from score: GREEN ≤ 6, AMBER 7–14, RED ≥ 15. Do not contradict the score with the label.
- traffic_light_status.rag MUST equal the highest rag_status in the register. Do not emit "RED" overall when no individual item is RED.
- owner_role MUST be a role/function ("Head of IT Security", "Procurement Director"), NEVER a personal name (GDPR Art. 5(1)(c) data minimisation).
- financial_impact_eur is OPTIONAL but strongly preferred — use industry benchmarks (e.g. GDPR fines up to 4% global turnover, average data breach cost €4.5M per IBM Cost of a Data Breach Report) when the user did not quantify exposure, and flag confidence: "LOW".
- mitigation_plan[] MUST contain at least one action per CRITICAL or HIGH risk; LOW/MEDIUM may be grouped.



S20 Category Risk Evaluator — scenario_specific MUST contain ALL of the following structures (eight promised deliverables):
{
  "category_risk_score": {
    "overall": 0-100,
    "rag": "RED | AMBER | GREEN",
    "decision": "PROCEED | PROCEED_WITH_CAUTION | HALT"
  },
  "score_breakdown": [
    // 5 dimensions, each scored 0-100. Always include all five.
    { "dimension": "Supply | Regulatory | Financial | Geopolitical | Demand", "score": 0-100, "rag": "RED|AMBER|GREEN", "rationale": "string" }
  ],
  "market_brief": {
    "dynamics": "string — 2-3 sentences on supply/demand balance",
    "price_outlook_pct": number,                       // expected 12-month price change %
    "key_trends": ["string", "..."]                     // 3-5 bullets
  },
  "supply_health": {
    "supplier_count": number | null,
    "top3_share_pct": number | null,
    "hhi": number | null,
    "single_point_failures": ["string", "..."]
  },
  "budget_risk_forecast": {
    "p10_pct": number,                                  // best-case variance vs budget
    "p50_pct": number,                                  // median variance
    "p90_pct": number,                                  // worst-case variance
    "drivers": ["string", "..."]
  },
  "sow_ambiguity_findings": [
    { "clause": "string", "severity": "CRITICAL|HIGH|MEDIUM|LOW", "recommended_fix": "string" }
  ],
  "recommended_contract_terms": [
    { "clause_type": "DPA | NIS2 compliance | AI Act | Exit | Audit | Price cap | SLA | Indexation", "rationale": "string", "priority": "MUST|SHOULD|NICE_TO_HAVE" }
  ],
  "kraljic_position": {
    "supply_risk": 1-5,                                 // 1 = abundant, 5 = scarce
    "business_impact": 1-5,                             // 1 = low spend/criticality, 5 = critical
    "quadrant": "Strategic | Leverage | Bottleneck | Routine"
  },
  "decision_readiness": {
    "score": 0-100,                                     // overall tender-readiness score
    "verdict": "GO | GO_WITH_CONDITIONS | HOLD | NO_GO",
    "rationale": "string — 1-2 sentences",
    "checklist": [
      // 4-6 yes/no readiness items, e.g. tooling ownership clarified, alt source qualified, budget contingency set
      { "item": "string", "status": "READY | PARTIAL | NOT_READY", "owner_role": "string" }
    ]
  },
  // Concentration — see fragment below; populate even when only relative shares are known.
  ${CONCENTRATION_SCHEMA_FRAGMENT}
}

Recommendations array MUST follow {priority: HIGH|MEDIUM|LOW, action, financial_impact, next_scenario}. Do NOT pad with filler MEDIUM/LOW items — emit only recommendations supported by user-provided data.`,

  D: `GROUP D PAYLOAD SCHEMA (Strategic Mentorship — S21–S27):
{
  "payload": {
    "framework_applied": null,
    "strategic_verdict": null,
    "scenario_specific": {}
  }
}
Populate scenario_specific based on the scenario, using the structures below verbatim.

— S21 Negotiation Preparation (§6.1):
{
  "scenario_specific": {
    "negotiation_subject": null,
    "batna": {
      "buyer_batna": null,
      "buyer_batna_value": null,
      "supplier_batna_estimated": null,
      "batna_strength_pct": null,
      "buyer_batna_description": null,
      "batna_improvement_actions": []
    },
    "zopa": {
      "buyer_walk_away": "[CONFIDENTIAL — MASK IN SHARED EXPORTS]",
      "buyer_target": null,
      "supplier_likely_floor": null,
      "zopa_exists": true
    },
    "opening_position": null,
    "negotiation_tactics": [
      { "title": null, "description": null }
    ],
    "negotiation_sequence": [
      { "step": "Opening | Anchor | Value Exchange | Concession | Walk-away Trigger | Close", "detail": null }
    ],
    "counter_arguments": [
      { "supplier_position": null, "buyer_response": null, "evidence": null }
    ],
    "walk_away_plan": {
      "trigger_conditions": [],
      "exit_steps": [],
      "communication_script": null
    },
    "value_creation": [
      { "opportunity": null, "buyer_benefit": null, "supplier_benefit": null }
    ],
    "risk_register": [
      { "risk": null, "likelihood": "HIGH | MEDIUM | LOW", "impact": "HIGH | MEDIUM | LOW", "mitigation": null }
    ],
    "leverage_analysis": {
      "buyer_leverage_factors": [],
      "supplier_leverage_factors": [],
      "power_balance": "BUYER_ADVANTAGE | BALANCED | SUPPLIER_ADVANTAGE"
    },
    "leverage_points": [
      { "title": null, "description": null }
    ],
    "negotiation_scenarios": [
      { "name": "Conservative | Aggressive | Hybrid", "expected_savings_pct": null, "estimated_timeline_months": null, "risk_level": "LOW | MEDIUM | HIGH" }
    ],
    "financial_outcome_range": {
      "optimistic": null,
      "realistic": null,
      "pessimistic": null
    },
    "mar_flag": false,
    "mar_note": null
  }
}

— S22 Category Strategy (§6.2):
{
  "scenario_specific": {
    "category": null,
    "annual_spend": null,
    "kraljic_position": {
      "current": "STRATEGIC | LEVERAGE | BOTTLENECK | NON_CRITICAL",
      "recommended": "STRATEGIC | LEVERAGE | BOTTLENECK | NON_CRITICAL",
      "movement_rationale": null
    },
    "porters_five_forces": {
      "supplier_power": { "rating": "HIGH | MEDIUM | LOW", "key_driver": null },
      "buyer_power": { "rating": "HIGH | MEDIUM | LOW", "key_driver": null },
      "threat_of_substitutes": { "rating": "HIGH | MEDIUM | LOW", "key_driver": null },
      "threat_of_new_entrants": { "rating": "HIGH | MEDIUM | LOW", "key_driver": null },
      "competitive_rivalry": { "rating": "HIGH | MEDIUM | LOW", "key_driver": null }
    },
    "three_year_roadmap": [
      { "year": 1, "objectives": [], "kpis": [] }
    ],
    "esg_considerations": null,
    "mar_flag": false
  }
}

— S23 Make vs. Buy Analysis (§6.3) — Type 1H, bilateral cost separation mandatory:
{
  "scenario_specific": {
    "item_or_capability": null,
    "make_option": {
      "direct_costs": null,
      "indirect_costs": null,
      "capex_required": null,
      "total_annual_cost": null,
      "break_even_years": null
    },
    "buy_option": {
      "quoted_price": null,
      "annual_volume": null,
      "total_annual_cost": null,
      "contract_term_years": null
    },
    "cost_delta": null,
    "qualitative_factors": [
      { "factor": "Core competency alignment", "make_score": null, "buy_score": null, "weight_pct": null }
    ],
    "verdict": {
      "recommendation": "MAKE | BUY | HYBRID | FURTHER_ANALYSIS_NEEDED",
      "financial_rationale": null,
      "strategic_rationale": null,
      "risk_caveat": null
    }
  }
}

— S24 Volume Consolidation (§6.4) — includes concentration block:
{
  "scenario_specific": {
    "category": null,
    "current_supplier_count": null,
    "current_total_spend": null,
    "consolidation_scenarios": [
      {
        "scenario_label": "2-Supplier Model",
        "supplier_count": null,
        "estimated_saving_pct": null,
        "estimated_saving_value": null,
        "supply_risk_level": "HIGH | MEDIUM | LOW",
        "implementation_complexity": "HIGH | MEDIUM | LOW"
      }
    ],
    "recommended_model": null,
    "volume_leverage_analysis": null,
    ${CONCENTRATION_SCHEMA_FRAGMENT}
  }
}

— S25 Supplier Dependency Planner (§6.5) — includes concentration:
{
  "scenario_specific": {
    "portfolio_scope": null,
    "dependency_portfolio": [
      {
        "dependency_id": "DEP-001",
        "vendor_label": "Supplier_001",
        "dependency_type": "SYSTEM | CONTRACT | DATA | CAPABILITY",
        "integration_depth": "HIGH | MEDIUM | LOW",
        "data_portability": "FULL | PARTIAL | NONE",
        "termination_provision": null,
        "estimated_switching_cost": null,
        "switching_cost_confidence": "HIGH | MEDIUM | LOW",
        "alternatives_available": null,
        "regulatory_constraints": null,
        "dependency_risk_score": null,
        "rag_status": "RED | AMBER | GREEN"
      }
    ],
    "heat_map_summary": {
      "high_risk_count": null,
      "medium_risk_count": null,
      "low_risk_count": null
    },
    "de_risking_plan": [
      {
        "phase": "Phase 1 — Stabilisation",
        "timeline": null,
        "actions": [],
        "target_dependencies": [],
        "owner": "Role-based reference"
      }
    ],
    "data_portability_assessment": {
      "critical_data_sources": [],
      "export_format_availability": null,
      "regulatory_retention_requirements": null
    },
    "hidden_switching_cost_alert": null,
    ${CONCENTRATION_SCHEMA_FRAGMENT}
  }
}
S25 AI guidance: flag hidden_switching_cost_alert when the user-provided switching cost appears more than 3× below the industry benchmark of 300–500% underestimation (per CIPS/Gartner). Never emit specific API keys, integration credentials, or internal system architecture details beyond what is necessary for dependency assessment (GDPR Art. 5(1)(c) + commercial sensitivity).

— S26 Disruption Management (§6.6) — MUST contain ALL of the following structures (the eight promised deliverables):
{
  "scenario_specific": {
    "disruption_type": "SUPPLIER_FAILURE | LOGISTICS | GEOPOLITICAL | FORCE_MAJEURE | CYBER | NATURAL_DISASTER | OTHER",
    "disruption_description": null,
    "affected_product_lines": [],
    "affected_categories": [],
    "current_inventory_buffer_days": null,
    "estimated_revenue_impact_per_day": null,
    "overall_urgency": "CRITICAL | HIGH | MEDIUM | LOW",
    "response_plan": {
      "stage_1_assess": {
        "actions": ["At least 2 specific assessment actions"],
        "owner": "Role-based reference",
        "target_duration_hours": null
      },
      "stage_2_contain": {
        "immediate_actions": ["At least 2 containment actions"],
        "customer_communication_template": "Full ready-to-send message body (>= 60 words) addressed to customers",
        "internal_communication_template": "Full ready-to-send message body (>= 60 words) addressed to internal stakeholders",
        "owner": "Role-based reference",
        "target_duration_hours": null
      },
      "stage_3_recover": {
        "alternative_supply_options": [
          {
            "option_label": null,
            "supplier_label": "Supplier_001",
            "lead_time_days": null,
            "cost_premium_pct": null,
            "capacity_available": null,
            "contractual_readiness": "READY | NEEDS_NEGOTIATION | NEW_QUALIFICATION_REQUIRED"
          }
        ],
        "owner": "Role-based reference",
        "target_duration_days": null
      },
      "stage_4_prevent": {
        "recurrence_prevention_checklist": ["At least 2 prevention items"],
        "process_changes": ["At least 1 process change"],
        "owner": "Role-based reference"
      }
    },
    "impact_scenarios": [
      { "delay_label": "1 week",   "delay_weeks": 1,  "revenue_loss": null, "cumulative_loss": null, "mitigation_cost": null, "net_impact": null },
      { "delay_label": "2 weeks",  "delay_weeks": 2,  "revenue_loss": null, "cumulative_loss": null, "mitigation_cost": null, "net_impact": null },
      { "delay_label": "4 weeks",  "delay_weeks": 4,  "revenue_loss": null, "cumulative_loss": null, "mitigation_cost": null, "net_impact": null },
      { "delay_label": "8 weeks",  "delay_weeks": 8,  "revenue_loss": null, "cumulative_loss": null, "mitigation_cost": null, "net_impact": null }
    ],
    "stakeholder_comms": [
      {
        "stakeholder_group": "Customers | Finance | Operations | Board | Regulator",
        "key_message": null,
        "delivery_channel": null,
        "timing": null
      }
    ],
    "claim_letter_template": {
      "addressee": "Counterparty / supplier name placeholder",
      "subject": "Formal subject line",
      "body": "Full ready-to-send claim or partner-assistance letter (>= 120 words) referencing the contractual basis, the disruption event, the financial exposure, the requested remedy and the response deadline",
      "cc": []
    },
    "root_cause_analysis": {
      "primary_cause": "string — single-sentence root cause hypothesis",
      "contributing_factors": ["3-5 contributing factors (process, supplier, external, internal control)"],
      "five_whys": ["Why 1: ...", "Why 2: ...", "Why 3: ...", "Why 4: ...", "Why 5: ..."],
      "evidence_quality": "STRONG | MODERATE | WEAK"
    },
    "blast_radius": {
      "directly_affected": ["operational areas, product lines or customers hit immediately"],
      "second_order_impacts": ["downstream P&L, working-capital, brand or compliance impacts within 30 days"],
      "third_order_impacts": ["strategic / multi-quarter consequences such as customer churn, covenant breach, audit findings"],
      "estimated_customers_affected": null,
      "estimated_revenue_at_risk": null,
      "geographic_spread": ["country / region codes"]
    },
    "recovery_probability": {
      "p_full_recovery_30d_pct": null,
      "p_full_recovery_90d_pct": null,
      "p_partial_recovery_30d_pct": null,
      "key_assumptions": ["3-4 assumptions the probabilities are conditioned on"],
      "confidence": "HIGH | MEDIUM | LOW"
    },
    "regulatory_exposure": [
      { "regime": "NIS2 | DORA | GDPR | CSRD | Sector-specific", "obligation": "specific clause or duty triggered", "deadline_hours": null, "notification_required": true, "potential_penalty": "string — fine band or sanction", "owner_role": "string" }
    ],
    "lessons_learned_for_playbook": [
      { "lesson": "string — observation we want institutional memory to capture", "playbook_change": "string — concrete update to standard operating procedure", "owner_role": "string", "due_in_days": null }
    ],
    "bridge_to_scenario": "S27"
  }
}
S26 AI guidance: this scenario has THREE headline deliverables that the UI promises and you MUST emit:
  (a) "Emergency Map" — the 4-stage response_plan with at least 2 concrete actions per stage and a target_duration on each stage. EVERY stage (including Stage 3 — Recover) MUST contain ≥2 specific actions; an empty stage breaks the visualization. Stage 4 (Prevent) MUST contain at least 2 recurrence_prevention_checklist items AND at least 1 process_change — never leave Stage 4 empty. For stage_3_recover, in addition to actions[], populate alternative_supply_options[] (this is separate from actions, not a substitute).
  (b) "Impact Table" — impact_scenarios[] MUST contain the four delay buckets (1/2/4/8 weeks) with numeric revenue_loss values; if estimated_revenue_impact_per_day is known, derive cumulative_loss = revenue_loss * delay_weeks * 7.
  (c) "Draft Letter" — claim_letter_template.body MUST be a full, sendable letter the user can copy-paste; never leave it null. Also fill stage_2_contain.customer_communication_template AND internal_communication_template as ready-to-send messages. NEVER use vague filler placeholders like "[Agreement portfolios]", "[Contract reference]", "the relevant portfolios" or "[X]". If a specific reference is unknown, use a concrete bracketed cue the user fills in (e.g. "[insert MSA dated YYYY-MM-DD]" or "[insert SLA section number]") — but never invent the word "portfolios" or other generic nouns as a stand-in.
Supporting tables — emit AT LEAST 3 rows in stage_3_recover.alternative_supply_options[] (mix of internal redeploy / partner / emergency-spot / new-qualification options where plausible) and AT LEAST 4 rows in stakeholder_comms[] covering Customers, Board, Operations and one of Finance/Regulator. Single-row supporting tables defeat the deliverable promise.
Owners (response_plan.stage_*.owner) MUST be the FULL role title — e.g. "Chief Information Security Officer (CISO)" not "CISO Chief Information"; "VP Procurement & Supply Chain" not "Procurement Director" alone. Never truncate role names mid-word.
Speed of output is the value — prioritise completeness of all three deliverables over depth of any single stage. Mask exact inventory depletion dates (commercially sensitive with customers) and specific emergency cash reserves (financially sensitive with lenders). If the user has not provided an inventory buffer, flag current_inventory_buffer_days = null and add to data_gaps[] — the response plan urgency cannot be calibrated without it. DO NOT emit kraljic_position for S26 — portfolio positioning is not relevant during a live crisis.
Analytical depth — in addition to the 3 headline deliverables, emit ALL FIVE analytical dimensions (root_cause_analysis, blast_radius, recovery_probability, regulatory_exposure[], lessons_learned_for_playbook[]). These dimensions transform the report from an operational checklist into a board-grade incident analysis. Specifically:
  - root_cause_analysis.five_whys MUST contain exactly 5 progressively deeper "Why" questions/answers — never fewer.
  - blast_radius MUST distinguish first / second / third-order impacts (operational → financial → strategic). Never collapse into a single list.
  - recovery_probability percentages MUST sum coherently (p_full_recovery_30d_pct ≤ p_partial_recovery_30d_pct ≤ 100). If insufficient data, emit confidence: "LOW" rather than null arrays.
  - regulatory_exposure[] MUST contain AT LEAST 1 entry when disruption_type ∈ {CYBER, SUPPLIER_FAILURE for critical infrastructure, FORCE_MAJEURE affecting EU operations}. Reference NIS2 (24h notification), DORA (4h for financial entities), GDPR Art. 33 (72h personal data breach) where applicable.
  - lessons_learned_for_playbook[] MUST contain AT LEAST 2 entries with concrete playbook_change strings — vague "improve monitoring" lessons are unacceptable.

— S27 Black Swan Scenario Simulation (§6.7) — includes concentration:
{
  "scenario_specific": {
    "scenario_type": "PANDEMIC | NATURAL_DISASTER | GEOPOLITICAL_EMBARGO | CYBER_ATTACK | FINANCIAL_SHOCK | COMPOSITE",
    "scenario_description": null,
    "scope": "SINGLE_CATEGORY | END_TO_END | GEOGRAPHY | ENTIRE_OPERATION",
    "historical_precedent": null,
    "bcp_status": "FORMAL_BCP | INFORMAL_BCP | NO_BCP",
    "supply_chain_nodes": [
      {
        "node_id": "NODE-001",
        "node_label": null,
        "node_type": "SUPPLIER | LOGISTICS_ROUTE | PRODUCTION_SITE | DATA_CENTRE | WAREHOUSE",
        "criticality": "SINGLE_POINT_OF_FAILURE | HIGH | MEDIUM | LOW",
        "geography": null,
        "alternative_available": false
      }
    ],
    "impact_model": {
      "direct_impact_estimate": null,
      "cascade_effects": [
        {
          "triggered_node": null,
          "delay_days": null,
          "revenue_at_risk": null,
          "cascade_confidence": "HIGH | MEDIUM | LOW"
        }
      ],
      "total_impact_estimate": null
    },
    "rto_rpo_analysis": {
      "target_rto_hours": null,
      "current_rto_estimate_hours": null,
      "rto_gap_hours": null,
      "target_rpo_hours": null,
      "current_rpo_estimate_hours": null,
      "rpo_gap_hours": null,
      "gap_commentary": null
    },
    "resilience_investments": [
      {
        "investment": null,
        "estimated_cost": null,
        "rto_improvement_hours": null,
        "risk_reduction_pct": null,
        "roi_rationale": null,
        "priority": "HIGH | MEDIUM | LOW"
      }
    ],
    "prioritised_vulnerabilities": [
      {
        "vulnerability": null,
        "associated_node": "NODE-001",
        "severity_if_triggered": "CRITICAL | HIGH | MEDIUM | LOW",
        "mitigation_available": null
      }
    ],
    "overall_resilience_rag": "RED | AMBER | GREEN",
    "early_warning_indicators": [
      {
        "indicator": null,
        "data_source": null,
        "threshold": null,
        "lead_time_days": null,
        "monitored_node": "NODE-001",
        "owner_role": null
      }
    ],
    "response_playbook": {
      "phase_1_detect":   { "owner_role": null, "trigger_signal": null, "actions": [], "target_duration_hours": null },
      "phase_2_activate": { "owner_role": null, "decision_authority": null, "actions": [], "target_duration_hours": null },
      "phase_3_contain":  { "owner_role": null, "actions": [], "alternative_supply_options": [], "target_duration_hours": null },
      "phase_4_recover":  { "owner_role": null, "actions": [], "rto_target_hours": null, "target_duration_hours": null },
      "phase_5_learn":    { "owner_role": null, "post_mortem_checklist": [], "process_changes": [] }
    },
    "diversification_strategy": {
      "current_concentration_summary": null,
      "target_state": null,
      "actions": [
        { "action": null, "category_id": "CAT-001", "horizon_months": null, "estimated_cost": null, "concentration_reduction_pct": null }
      ]
    },
    "monitoring_dashboard": {
      "kris": [
        { "kri_name": null, "current_value": null, "amber_threshold": null, "red_threshold": null, "owner_role": null, "review_frequency": "DAILY | WEEKLY | MONTHLY" }
      ],
      "trigger_points": [
        { "trigger": null, "automated_response": null, "escalation_path": null }
      ]
    },
    "bridge_to_scenario": "S26",
    ${CONCENTRATION_SCHEMA_FRAGMENT}
  }
}
S27 AI guidance: financial impact modelling accuracy depends on the user providing RTO/RPO targets and recovery cost estimates — if these are absent BUT a monetary anchor exists (annual_spend, category_spend, revenue_exposed, contract_value, or any € / $ / £ figure in user inputs), you MUST DERIVE quantitative estimates rather than emit null. Never emit exact critical cash reserve amounts or specific banking / credit facility details — use liquidity tier references ("Tier 1 reserve: 3 months OPEX") instead.

S27 COST DERIVATION RULES (D1) — when the user provides ANY monetary anchor (call it SPEND), you MUST populate the following with derived figures and add a "derived_from: <anchor>" note in roi_rationale / gap_commentary:
  • impact_model.direct_impact_estimate → SPEND × disruption_duration_share (e.g. 30-day outage on annual SPEND ≈ SPEND × 30/365). Express as a € / $ / £ range.
  • impact_model.total_impact_estimate → direct_impact + Σ cascade_effects.revenue_at_risk. Never leave null when SPEND is known.
  • impact_model.cascade_effects[].revenue_at_risk → derive per-node share of SPEND scaled by criticality (SINGLE_POINT_OF_FAILURE = 60–100%, HIGH = 30–60%, MEDIUM = 10–30%, LOW = <10%) × delay_days/30.
  • resilience_investments[].estimated_cost → benchmark to 1–8% of SPEND for tactical mitigations, 8–20% for structural redesigns; never null when SPEND is known.
  • diversification_strategy.actions[].estimated_cost → 0.5–5% of category SPEND per dual-sourcing / qualification action.
Only fall back to null + data_gaps[] when NO monetary anchor of any kind appears in user inputs.

S27 DELIVERABLE COVERAGE — populate ALL of the following structures (these are the ten promised deliverables surfaced in the user-facing report). Items marked [MANDATORY] must NEVER be empty arrays — derive from scenario_type, supply_chain_nodes, and industry norms if user input is sparse:
1. Black Swan Risk Map → supply_chain_nodes[] (5–10 entries with criticality + alternative_available). [MANDATORY]
2. Scenario Simulation Results → impact_model.direct_impact_estimate + total_impact_estimate (apply D1 derivation when SPEND known).
3. Vulnerability Assessment → prioritised_vulnerabilities[] (3–6 ranked items, each tied to a node). [MANDATORY]
4. Cascading Failure Analysis → impact_model.cascade_effects[] (3–6 entries with delay_days + revenue_at_risk; apply D1 derivation).
5. Early Warning Indicators → early_warning_indicators[] (4–8 measurable signals with thresholds, lead_time_days, owner_role). [MANDATORY — derive from scenario_type if user did not specify: e.g. PANDEMIC → WHO outbreak alerts, supplier absenteeism %, port throughput; CYBER_ATTACK → CVE feeds, anomalous auth attempts, SOC tickets; GEOPOLITICAL → sanctions watchlist, FX volatility, shipping insurance premia].
6. Response Playbook → response_playbook (all five phases populated, 2–5 actions each). [MANDATORY]
7. Mitigation Roadmap → resilience_investments[] (4–8 prioritised investments with estimated_cost via D1). [MANDATORY]
8. Diversification Strategy → diversification_strategy.actions[] + concentration block.
9. Investment Recommendation → resilience_investments[] (each with estimated_cost + risk_reduction_pct + roi_rationale referencing the anchor used).
10. Monitoring Dashboard → monitoring_dashboard.kris[] (4–8 KRIs with current_value, amber_threshold, red_threshold, owner_role, review_frequency) + trigger_points[] (3–5 triggers with automated_response + escalation_path). [MANDATORY — derive industry-standard KRIs from scenario_type if user did not specify].
Emit null + a data_gaps[] entry ONLY for individual field values genuinely unknowable — never omit structural keys, and never return an empty array for [MANDATORY] deliverables.

CONCENTRATION RULES (S20, S24, S25, S27):
Populate concentration when supplier and category spend data is available. Calculate HHI per category as sum of (supplier_spend_share_pct)^2.
Interpret HHI: <1500 = LOW (competitive), 1500-2500 = MODERATE, 2500-5000 = HIGH, >5000 = EXTREME (monopolistic / near-sole-source).
Set single_source_flag=true for any supplier holding >70% of a single category's spend.
Use tokenised supplier_label references — do not emit legal entity names (these will be restored by the de-anonymisation layer). Use ISO 3166-1 alpha-2 country codes for geography.

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

// ── Scenario-sliced schema (token optimisation) ─────────────────────
//
// Group D ships 7 sub-schemas (S21–S27) totalling ~10k chars. The model
// only needs the one matching the active scenario. This helper returns
// the group preamble + the matching sub-section + the shared footer
// (concentration rules + closing line). Saves ~2k input tokens per call
// for Group D scenarios with no quality loss.
//
// Group A's per-scenario rules are short bullets and are kept intact —
// slicing them yielded < 200 token savings and risked breaking the
// shared financial_model contract.

const SCENARIO_ID_TO_CODE: Record<string, string> = {
  'negotiation-preparation': 'S21',
  'category-strategy': 'S22',
  'make-vs-buy': 'S23',
  'volume-consolidation': 'S24',
  'supplier-dependency-planner': 'S25',
  'disruption-management': 'S26',
  'black-swan-scenario': 'S27',
};

/**
 * Returns a scenario-specific slice of GROUP_SCHEMAS for the active scenario.
 * Falls back to the full group schema if slicing is not supported for the
 * group/scenario or if the regex match fails (defensive — never strip blindly).
 */
export function getScenarioSchema(group: string | null | undefined, scenarioId: string | null | undefined): string {
  const full = group ? GROUP_SCHEMAS[group] : '';
  if (!full) return '';

  // Only Group D benefits meaningfully from slicing today.
  if (group !== 'D' || !scenarioId) return full;

  const code = SCENARIO_ID_TO_CODE[scenarioId];
  if (!code) return full;

  // Group D layout:
  //   <preamble through "structures below verbatim.">
  //   — S21 ... { ... }
  //   — S22 ... { ... }
  //   ...
  //   — S27 ... { ... }
  //   <CONCENTRATION RULES + closing line>
  const preambleMatch = full.match(/^([\s\S]*?structures below verbatim\.\s*\n)/);
  const footerMatch = full.match(/\n(CONCENTRATION RULES[\s\S]*)$/);
  if (!preambleMatch || !footerMatch) return full;

  // Match the target sub-scenario block: from "— S## …" up to (but not
  // including) the next "— S##" or the CONCENTRATION RULES footer.
  const blockRe = new RegExp(`(— ${code}\\b[\\s\\S]*?)(?=\\n— S\\d+\\b|\\nCONCENTRATION RULES)`, 'm');
  const blockMatch = full.match(blockRe);
  if (!blockMatch) return full;

  return `${preambleMatch[1]}\n${blockMatch[1].trim()}\n\n${footerMatch[1]}`;
}

// ── AI Prompt Contract ──────────────────────────────────────────────

export const AI_PROMPT_CONTRACT = `
CRITICAL OUTPUT INSTRUCTION:
Return a single valid JSON object. No prose, no markdown fences.

ENVELOPE (required top-level keys): schema_version="2.0", scenario_id, scenario_name, group, group_label, confidence_level, low_confidence_watermark, summary, executive_bullets, recommendations, payload.
OPTIONAL top-level keys (include ONLY if non-empty): confidence_flags, data_gaps, gdpr_flags, export_metadata.

PAYLOAD OMISSION RULES (token-efficiency):
- Within payload (and any nested object), OMIT any leaf field whose value would be null, empty string, empty array, or empty object. Do NOT emit "field": null placeholders.
- KEEP a field whenever you have a real value (number, non-empty string, non-empty array/object, or boolean).
- KEEP arrays only when they contain at least one populated row.
- Exceptions (always emit, even if empty): currency, scenario_id, scenario_name, group, group_label, schema_version, confidence_level, summary.
- low_confidence_watermark = true if confidence_level == "LOW".

DATA_GAPS (omit array entirely when empty; otherwise max 3 entries):
- Each entry: { "field": "<exact form-field name>", "impact": "<concrete analytical consequence>", "resolution": "<specific actionable tip>" }.
- FORBIDDEN values: "Unknown field", "Impact not specified", "Provide missing data", "Not available", "N/A". Omit the entry instead.
- Tone: coaching ("Add X to unlock Y"), never punitive. Do NOT prefix with "To strengthen this analysis".

GDPR_FLAGS: include only when real PII slipped in; otherwise omit. Set the offending field to nothing (omit) and document in gdpr_flags.

RECOMMENDATIONS (always required, ≥1 entry):
- Each entry: { "priority": "CRITICAL|HIGH|MEDIUM|LOW", "action": "<specific imperative>", "financial_impact": "<quantified delta>"|null, "next_scenario": "S##"|null }.
- Calibrate priorities honestly:
  - CRITICAL = act this week; contract loss / compliance breach / supply outage / >10% margin hit.
  - HIGH = act within 30 days; >5% spend impact or hard quarterly deadline.
  - MEDIUM = act this quarter; meaningful improvement, no cliff.
  - LOW = nice-to-have / opportunistic / dependent.
- Mix priorities — flagging every item MEDIUM is a calibration failure.
- action = specific imperative ("Issue RFP to 3 vendors by 15 May"), not generic theme.
- financial_impact = quantified € delta when spend/budget data exists; null only when no numeric basis.

DASHBOARD-SUPPORTING FIELDS:
- S4: populate savings_breakdown + savings_classification (hard|soft|avoided). baseline_verified=true only with documented baseline; default unspecified categories to "soft" with a data_gaps entry.
- Group A: populate financial_model.working_capital ONLY when payment-terms data given. Compute working_capital_delta_eur = annual_spend × (target_dpo - current_dpo) / 365. Flag late_payment_directive_risk=true for payment_terms_days > 60 (EU 2011/7).
- S20/S24/S25/S27: populate scenario_specific.concentration when supplier-spend data given. HHI = Σ(supplier_spend_share_pct)². Bands: <1500 LOW, 1500–2500 MODERATE, 2500–5000 HIGH, >5000 EXTREME. single_source_flag=true when one supplier holds >70% of a category. Use tokenised supplier_label, ISO-3166-1 alpha-2 country codes.

ENTITY TOKEN INTEGRITY (anonymisation contract — applies to ALL scenarios):
- The user input may contain bracketed tokens like [SUPPLIER_A], [COMPANY_B], [EMAIL], [SUPPLIER_C2], etc. These are placeholders for real entities; a downstream layer restores them.
- PRESERVE every token EXACTLY as received — same brackets, same suffix letter/number. Never rename [SUPPLIER_A] to "Supplier A", "Vendor 1", "the incumbent", or any free-text label, and never swap one token for another.
- When you need to reference a NEW hypothetical entity the user did NOT provide (e.g. an alternative supplier proposed in stage_3_recover.alternative_supply_options, a candidate vendor in an RFP shortlist, a fallback partner), use the dedicated namespace [ALT_SUPPLIER_1], [ALT_SUPPLIER_2], … (or [ALT_PARTNER_1], [ALT_VENDOR_1] when semantically clearer). Never reuse a token already present in the input for a different entity.
- Be consistent within a single response: the same alternative entity must keep the same [ALT_*] token across every section, table row, draft letter and recommendation it appears in. Inconsistent labelling breaks the deliverable.
- In draft letters, addressee fields, and supporting tables, refer to entities by their token only (e.g. "Dear [SUPPLIER_A] team,") — never substitute a generic noun.

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

/**
 * Brace-balance scanner: walks the string tracking string-literal state and
 * brace depth, returning the largest valid JSON object substring (closing braces
 * appended if the source was truncated mid-object). Used to salvage partial
 * envelopes when a fallback model truncated output mid-payload.
 */
function salvageTruncatedJson(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  let lastValidEnd = -1;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = false; }
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) lastValidEnd = i;
    }
  }
  if (lastValidEnd > 0) return raw.slice(start, lastValidEnd + 1);
  // Truncated mid-object: try padding closing braces (drop trailing partial token)
  if (depth > 0 && !inString) {
    // Trim trailing comma or partial token
    let end = raw.length - 1;
    while (end > start && /[,\s:"]/.test(raw[end])) end--;
    const padded = raw.slice(start, end + 1).replace(/,\s*$/, '') + '}'.repeat(depth);
    try { JSON.parse(padded); return padded; } catch { /* give up */ }
  }
  return null;
}

/**
 * Repair bracket-TYPE mismatches in malformed JSON envelopes. Gemini occasionally
 * closes an object with `]` or an array with `}` — particularly in deeply nested
 * S21 / S26 schemas. We walk the bracket stack and rewrite each mismatched
 * closer to the type that the matching opener expects. Strings are skipped.
 */
function repairBracketTypes(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start < 0) return null;
  const chars = raw.split('');
  const stack: Array<'{' | '['> = [];
  let inString = false;
  let escape = false;
  let mutated = false;
  for (let i = start; i < chars.length; i++) {
    const ch = chars[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{' || ch === '[') { stack.push(ch); continue; }
    if (ch === '}' || ch === ']') {
      const opener = stack.pop();
      if (!opener) continue;
      const expected = opener === '{' ? '}' : ']';
      if (ch !== expected) {
        chars[i] = expected;
        mutated = true;
      }
    }
  }
  if (!mutated) return null;
  return chars.join('');
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

  // Attempt 3: bracket-TYPE repair for envelopes where the model closed an
  // object with `]` or vice versa. Common in deeply nested S21/S26 schemas.
  const bracketFixed = repairBracketTypes(raw);
  if (bracketFixed) {
    try {
      const parsed = JSON.parse(bracketFixed);
      console.warn('[EXOS] AI response salvaged via bracket-type repair');
      return parsed;
    } catch (_) { /* fall through */ }
    // Try the regex-extracted slice of the fixed string too
    const fixedMatch = bracketFixed.match(/\{[\s\S]*\}/);
    if (fixedMatch) {
      try {
        const parsed = JSON.parse(fixedMatch[0]);
        console.warn('[EXOS] AI response salvaged via bracket-type repair + slice');
        return parsed;
      } catch (_) { /* fall through */ }
    }
  }

  // Attempt 4: brace-balance salvage for truncated/malformed envelopes
  const salvaged = salvageTruncatedJson(raw);
  if (salvaged) {
    try {
      const parsed = JSON.parse(salvaged);
      console.warn('[EXOS] AI response salvaged via brace-balance scanner');
      return parsed;
    } catch (_) { /* fall through */ }
  }

  // Attempt 5: log and return null for retry
  console.error('[EXOS] AI response failed JSON parsing — triggering retry');
  return null;
}

/**
 * Recursively strip null, undefined, empty string, empty array, and empty object
 * leaves from an envelope payload. Models inconsistently emit `"field": null`
 * placeholders despite prompt instructions; this is the deterministic enforcement.
 *
 * Preserves: false, 0, and structural top-level keys of the envelope itself
 * (so the schema shape stays stable for downstream consumers).
 */
const ENVELOPE_TOP_KEYS_PRESERVE = new Set([
  'schema_version', 'scenario_id', 'scenario_name', 'group', 'group_label',
  'confidence_level', 'low_confidence_watermark', 'summary', 'export_metadata',
]);

/**
 * Server-side defensive synthesis. Models inconsistently leave optional
 * tables and arrays empty even when enough adjacent data exists to derive a
 * sensible value. This pass backfills the most painful gaps (S26 impact_scenarios,
 * S26 actions, S20 score_breakdown) so the report never ships hollow.
 *
 * IDEMPOTENT: re-running the function on already-populated payloads is a no-op.
 * NEVER overwrites AI-emitted content; only fills `null`, `undefined`, `[]`.
 */
export function synthesizeMissingContent<T extends ExosOutputParsed | null | undefined>(envelope: T): T {
  if (!envelope || typeof envelope !== 'object') return envelope;
  const env = envelope as ExosOutputParsed;
  const ss = (env.payload?.scenario_specific ?? {}) as Record<string, any>;

  // ── S26 Disruption Management ────────────────────────────────────────────
  if (env.scenario_id === 'S26' && ss && typeof ss === 'object') {
    // Backfill impact_scenarios from estimated_revenue_impact_per_day
    const dailyImpact = Number(ss.estimated_revenue_impact_per_day);
    const hasDailyImpact = Number.isFinite(dailyImpact) && dailyImpact > 0;
    if (hasDailyImpact) {
      const buckets = [1, 2, 4, 8];
      const existing = Array.isArray(ss.impact_scenarios) ? ss.impact_scenarios : [];
      const byWeeks = new Map<number, any>();
      existing.forEach((row: any) => {
        const w = Number(row?.delay_weeks);
        if (Number.isFinite(w)) byWeeks.set(w, row);
      });
      ss.impact_scenarios = buckets.map(weeks => {
        const row = byWeeks.get(weeks) ?? { delay_label: `${weeks} week${weeks > 1 ? 's' : ''}`, delay_weeks: weeks };
        if (row.revenue_loss == null) row.revenue_loss = dailyImpact * weeks * 7;
        if (row.cumulative_loss == null) row.cumulative_loss = row.revenue_loss;
        if (row.net_impact == null && row.mitigation_cost != null) {
          row.net_impact = Number(row.revenue_loss) + Number(row.mitigation_cost);
        }
        return row;
      });
    }

    // Backfill empty Stage 3 actions from alternative_supply_options
    const rp = (ss.response_plan ?? {}) as Record<string, any>;
    const stage3 = rp.stage_3_recover as Record<string, any> | undefined;
    if (stage3 && (!Array.isArray(stage3.actions) || stage3.actions.length === 0)) {
      const opts = Array.isArray(stage3.alternative_supply_options) ? stage3.alternative_supply_options : [];
      if (opts.length > 0) {
        stage3.actions = opts.slice(0, 3).map((o: any) => {
          const name = o?.option_label ?? o?.supplier_label ?? 'alternative supplier';
          const lt = o?.lead_time_days != null ? ` (lead time ${o.lead_time_days}d)` : '';
          return `Fast-track qualification and emergency PO with ${name}${lt}.`;
        });
      }
    }

    // Backfill regulatory_exposure for cyber/critical-infra disruptions
    const dt = String(ss.disruption_type ?? '').toUpperCase();
    if ((!Array.isArray(ss.regulatory_exposure) || ss.regulatory_exposure.length === 0) && dt === 'CYBER') {
      ss.regulatory_exposure = [
        { regime: 'NIS2', obligation: 'Significant incident notification to competent authority', deadline_hours: 24, notification_required: true, potential_penalty: 'Up to €10M or 2% global turnover (essential entities)', owner_role: 'Chief Information Security Officer (CISO)' },
        { regime: 'GDPR Art. 33', obligation: 'Personal data breach notification to supervisory authority (where personal data implicated)', deadline_hours: 72, notification_required: true, potential_penalty: 'Up to €20M or 4% global turnover', owner_role: 'Data Protection Officer (DPO)' },
      ];
    }

    // Backfill recovery_probability if entirely empty (low-confidence default)
    if (!ss.recovery_probability || (typeof ss.recovery_probability === 'object' && Object.keys(ss.recovery_probability).length === 0)) {
      const buffer = Number(ss.current_inventory_buffer_days);
      if (Number.isFinite(buffer) && buffer > 0) {
        const p30 = Math.min(95, Math.max(20, Math.round((buffer / 30) * 60)));
        ss.recovery_probability = {
          p_full_recovery_30d_pct: p30,
          p_partial_recovery_30d_pct: Math.min(99, p30 + 25),
          p_full_recovery_90d_pct: Math.min(99, p30 + 35),
          key_assumptions: [
            `Inventory buffer of ${buffer} days holds with no further disruption.`,
            'Alternative supply options qualify within stated lead times.',
            'No second-order disruption (logistics, geopolitical) compounds the event.',
          ],
          confidence: 'LOW',
        };
      }
    }

    env.payload = { ...(env.payload ?? {}), scenario_specific: ss };
  }

  // ── S20 Category Risk Evaluator ──────────────────────────────────────────
  if (env.scenario_id === 'S20' && ss && typeof ss === 'object') {
    // Derive helpers from existing structures so backfills are data-aware
    const crs = (ss.category_risk_score ?? null) as Record<string, any> | null;
    const overall = Number(crs?.overall);
    const overallScore = Number.isFinite(overall) ? overall : null;
    const ragFromScore = (n: number | null): string =>
      n == null ? 'AMBER' : n >= 70 ? 'RED' : n >= 40 ? 'AMBER' : 'GREEN';

    const concCats: any[] = Array.isArray(ss?.concentration?.categories) ? ss.concentration!.categories : [];
    const topHHI = concCats.reduce((m, c) => Math.max(m, Number(c?.hhi) || 0), 0);
    const supplyRiskFromHHI = topHHI >= 5000 ? 85 : topHHI >= 2500 ? 65 : topHHI >= 1500 ? 45 : 25;

    // 1) score_breakdown — ensure all 5 dimensions, with data-aware defaults
    const requiredDims = ['Supply', 'Regulatory', 'Financial', 'Geopolitical', 'Demand'];
    const existing = Array.isArray(ss.score_breakdown) ? ss.score_breakdown : [];
    const byDim = new Map<string, any>();
    existing.forEach((d: any) => {
      const key = String(d?.dimension ?? '').trim();
      if (key) byDim.set(key, d);
    });
    if (existing.length < 5) {
      const baseScore = overallScore ?? 50;
      const dimDefault = (dim: string): number => {
        if (dim === 'Supply') return Math.max(supplyRiskFromHHI, baseScore);
        return baseScore;
      };
      ss.score_breakdown = requiredDims.map(dim => {
        const found = byDim.get(dim);
        if (found && (found.score != null || found.rationale)) return found;
        const score = dimDefault(dim);
        return {
          dimension: dim,
          score,
          rag: ragFromScore(score),
          rationale: dim === 'Supply' && topHHI > 0
            ? `Derived from supplier concentration (HHI ${topHHI}). Validate with category specialists.`
            : `Default rating — no explicit ${dim.toLowerCase()} signal in input. Treat as provisional.`,
        };
      });
    }

    // 2) budget_risk_forecast — backfill P10/P50/P90 from overall risk if absent
    const brf = (ss.budget_risk_forecast ?? null) as Record<string, any> | null;
    const hasForecast = brf && (brf.p10_pct != null || brf.p50_pct != null || brf.p90_pct != null);
    if (!hasForecast) {
      const sev = overallScore ?? 50;
      // Higher overall risk → wider variance band
      const p50 = Math.round(sev / 10);              // e.g. score 80 → +8% median
      const p90 = Math.round(sev / 4);               // e.g. score 80 → +20% worst case
      const p10 = -Math.max(2, Math.round(sev / 20)); // mild best-case savings
      ss.budget_risk_forecast = {
        p10_pct: p10,
        p50_pct: p50,
        p90_pct: p90,
        drivers: Array.isArray(brf?.drivers) && brf.drivers.length > 0
          ? brf.drivers
          : ['Commodity / energy price volatility', 'Single-source supplier pricing power', 'FX & logistics exposure'],
        confidence: 'LOW',
      };
    }

    // 3) decision_readiness — backfill if absent so the 8th deliverable always renders
    const dr = (ss.decision_readiness ?? null) as Record<string, any> | null;
    const hasReadiness = dr && (dr.score != null || dr.verdict || (Array.isArray(dr.checklist) && dr.checklist.length > 0));
    if (!hasReadiness) {
      const sev = overallScore ?? 50;
      // Inverse of risk — high risk = low readiness
      const readinessScore = Math.max(0, 100 - sev);
      const verdict = readinessScore >= 70 ? 'GO'
        : readinessScore >= 50 ? 'GO_WITH_CONDITIONS'
        : readinessScore >= 30 ? 'HOLD'
        : 'NO_GO';
      ss.decision_readiness = {
        score: readinessScore,
        verdict,
        rationale: `Readiness derived from overall risk score (${sev}/100). ${
          verdict === 'GO' ? 'Tender may proceed with standard controls.'
          : verdict === 'GO_WITH_CONDITIONS' ? 'Proceed only after listed mitigations are in place.'
          : verdict === 'HOLD' ? 'Defer tender until critical risks are addressed.'
          : 'Do not proceed until structural risks are resolved.'
        }`,
        checklist: [
          { item: 'Tooling & IP ownership clarified in SOW', status: 'NOT_READY', owner_role: 'Legal / Category Lead' },
          { item: 'At least one alternative supplier qualified', status: topHHI >= 2500 ? 'NOT_READY' : 'PARTIAL', owner_role: 'Sourcing Manager' },
          { item: 'Budget contingency reserved (≥ P50 variance)', status: 'PARTIAL', owner_role: 'Finance Business Partner' },
          { item: 'Regulatory compliance evidence on file (REACH / CSDDD / NIS2 as applicable)', status: 'PARTIAL', owner_role: 'Compliance Officer' },
          { item: 'Exit / step-in clauses drafted', status: 'NOT_READY', owner_role: 'Legal' },
        ],
      };
    }

    env.payload = { ...(env.payload ?? {}), scenario_specific: ss };
  }

  // ── S21 Preparing for Negotiation ────────────────────────────────────────
  if (env.scenario_id === 'S21' && ss && typeof ss === 'object') {
    const batna = (ss.batna ?? {}) as Record<string, any>;
    const zopa = (ss.zopa ?? {}) as Record<string, any>;
    const lev = (ss.leverage_analysis ?? {}) as Record<string, any>;
    const buyerTarget = Number(zopa.buyer_target);
    const supplierFloor = Number(zopa.supplier_likely_floor);
    const buyerWalkAway = Number(zopa.buyer_walk_away);
    const batnaStrength = Number(batna.batna_strength_pct);
    const buyerFactors: any[] = Array.isArray(lev.buyer_leverage_factors) ? lev.buyer_leverage_factors : [];
    const supplierFactors: any[] = Array.isArray(lev.supplier_leverage_factors) ? lev.supplier_leverage_factors : [];

    // 1) batna_improvement_actions — guarantee 2 generic if empty
    if (!Array.isArray(batna.batna_improvement_actions) || batna.batna_improvement_actions.length === 0) {
      batna.batna_improvement_actions = [
        'Pre-qualify a second alternative supplier so the BATNA is operationally ready, not just theoretical.',
        'Run a small pilot or sample order with the alternative to validate quality, lead time, and total cost.',
      ];
    }
    ss.batna = batna;

    // 2) leverage_analysis.power_balance — derive from BATNA strength + factor counts
    if (!lev.power_balance || lev.power_balance.includes('|')) {
      const buyerScore = (Number.isFinite(batnaStrength) ? batnaStrength : 50) + buyerFactors.length * 5 - supplierFactors.length * 5;
      lev.power_balance = buyerScore >= 60 ? 'BUYER_ADVANTAGE' : buyerScore <= 40 ? 'SUPPLIER_ADVANTAGE' : 'BALANCED';
    }
    ss.leverage_analysis = lev;

    // 3) counter_arguments — backfill 3 standard objections if empty
    const ca: any[] = Array.isArray(ss.counter_arguments) ? ss.counter_arguments : [];
    if (ca.filter(c => c && (c.supplier_position || c.buyer_response)).length === 0) {
      ss.counter_arguments = [
        {
          supplier_position: 'Our cost base does not allow a price reduction at your target level.',
          buyer_response: 'Share our internal benchmark and at least one competing quote, then ask the supplier to open the cost structure on the 2–3 largest line items.',
          evidence: 'Independent market benchmark and quoted alternative supplier prices.',
        },
        {
          supplier_position: 'Volume is not large enough to justify a discount.',
          buyer_response: 'Re-frame around multi-year committed volume and a pipeline of additional sites/SKUs that the alternative supplier would otherwise win.',
          evidence: 'Forecast of committed volume over the contract term and BATNA value.',
        },
        {
          supplier_position: 'Removing auto-renewal and adding penalties is non-standard.',
          buyer_response: 'Offer to extend the contract length in exchange for explicit exit rights, KPI-linked pricing, and a capped escalation clause.',
          evidence: 'Standard buyer-side clauses in comparable enterprise contracts.',
        },
      ];
    }

    // 4) walk_away_plan — backfill all three sub-fields when empty
    const wap = (ss.walk_away_plan ?? {}) as Record<string, any>;
    const triggers: any[] = Array.isArray(wap.trigger_conditions) ? wap.trigger_conditions : [];
    const exitSteps: any[] = Array.isArray(wap.exit_steps) ? wap.exit_steps : [];
    if (triggers.length === 0) {
      wap.trigger_conditions = [
        Number.isFinite(buyerWalkAway) ? `Total contract value exceeds ${formatCurrencyEUR(buyerWalkAway)} (the buyer walk-away threshold).` : 'Supplier refuses to move below the buyer walk-away threshold.',
        'Supplier refuses to remove auto-renewal escalation or accept KPI-linked penalties.',
        'Supplier cannot commit to the required compliance / SLA evidence within the negotiation window.',
      ];
    }
    if (exitSteps.length === 0) {
      wap.exit_steps = [
        'Notify the supplier in writing that the proposal is outside the approved envelope and pause further sessions.',
        'Activate the qualified BATNA: issue an emergency RFQ to the pre-qualified alternative supplier(s).',
        'Brief internal stakeholders (Finance, Legal, Operations) on the switch plan and timeline.',
        'Communicate transition risk and mitigation to affected business units before any operational impact.',
      ];
    }
    if (!wap.communication_script) {
      wap.communication_script = 'Thank you for the discussions to date. The latest proposal sits outside the parameters we are able to approve internally, and we are not in a position to close on these terms. We will be pausing the negotiation and progressing our alternative options. Please let us know in writing within 5 working days if there is a materially revised offer; otherwise, we will move to award elsewhere.';
    }
    ss.walk_away_plan = wap;

    // 5) value_creation — backfill 2 standard win-wins if empty
    const vc: any[] = Array.isArray(ss.value_creation) ? ss.value_creation : [];
    if (vc.filter(v => v && (v.opportunity || v.buyer_benefit)).length === 0) {
      ss.value_creation = [
        {
          opportunity: 'Extend contract length in exchange for a price lock and KPI-linked rebate.',
          buyer_benefit: 'Predictable cost base and protection from market price increases.',
          supplier_benefit: 'Longer guaranteed revenue stream supporting capacity planning and investment.',
        },
        {
          opportunity: 'Joint operational improvement programme (e.g. demand forecasting, packaging, logistics).',
          buyer_benefit: 'Lower total cost of ownership beyond unit price.',
          supplier_benefit: 'Reduced cost-to-serve and a stronger reference case for similar accounts.',
        },
      ];
    }

    // 6) financial_outcome_range — derive from ZOPA when numbers are present
    const fr = (ss.financial_outcome_range ?? {}) as Record<string, any>;
    const hasFr = fr.optimistic != null || fr.realistic != null || fr.pessimistic != null;
    if (!hasFr && Number.isFinite(buyerTarget) && (Number.isFinite(supplierFloor) || Number.isFinite(buyerWalkAway))) {
      const realistic = Number.isFinite(supplierFloor)
        ? (buyerTarget + supplierFloor) / 2
        : buyerTarget;
      ss.financial_outcome_range = {
        optimistic: Number.isFinite(supplierFloor) ? supplierFloor : buyerTarget,
        realistic,
        pessimistic: Number.isFinite(buyerWalkAway) ? buyerWalkAway : buyerTarget * 1.1,
      };
    }

    // 7) risk_register — guarantee 3 negotiation risks if empty
    const rr: any[] = Array.isArray(ss.risk_register) ? ss.risk_register : [];
    if (rr.filter(r => r && r.risk).length === 0) {
      ss.risk_register = [
        { risk: 'Supplier walks away after a hard anchor and forces an emergency switch.', likelihood: 'MEDIUM', impact: 'HIGH', mitigation: 'Pre-qualify the alternative supplier and validate lead time before opening price negotiation.' },
        { risk: 'Internal stakeholders escalate to accept supplier terms under operational pressure.', likelihood: 'MEDIUM', impact: 'MEDIUM', mitigation: 'Pre-align the walk-away threshold and the BATNA with Finance, Legal and Operations before the first session.' },
        { risk: 'Auto-renewal or volume-floor clauses survive the redline and erode the negotiated savings.', likelihood: 'MEDIUM', impact: 'MEDIUM', mitigation: 'Treat removal of auto-renewal and any volume floor as a MUST-HAVE redline; do not trade them for price.' },
      ];
    }

    env.payload = { ...(env.payload ?? {}), scenario_specific: ss };
  }

  return env as T;
}

function formatCurrencyEUR(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toFixed(0)}`;
}

export function pruneEmptyBranches<T>(input: T, isTopLevel = true): T {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) {
    const cleaned = input
      .map((item) => pruneEmptyBranches(item, false))
      .filter((item) => {
        if (item === null || item === undefined || item === '') return false;
        if (Array.isArray(item) && item.length === 0) return false;
        if (typeof item === 'object' && item !== null && Object.keys(item).length === 0) return false;
        return true;
      });
    return cleaned as unknown as T;
  }
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      const pruned = pruneEmptyBranches(v, false);
      const isEmpty =
        pruned === null ||
        pruned === undefined ||
        pruned === '' ||
        (Array.isArray(pruned) && pruned.length === 0) ||
        (typeof pruned === 'object' && pruned !== null && !Array.isArray(pruned) && Object.keys(pruned).length === 0);
      if (isEmpty && !(isTopLevel && ENVELOPE_TOP_KEYS_PRESERVE.has(k))) continue;
      out[k] = pruned;
    }
    return out as T;
  }
  return input;
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

  // Defensive coercion: AI sometimes emits objects where strings are expected.
  // Extract a sensible string field rather than letting `${obj}` render as "[object Object]".
  const coerceToString = (v: unknown): string => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const candidate = o.text ?? o.finding ?? o.bullet ?? o.description ?? o.summary ?? o.title ?? o.action ?? o.label;
      if (typeof candidate === 'string') return candidate;
      try { return JSON.stringify(v); } catch { return ''; }
    }
    return String(v);
  };

  // Replace Unicode comparators that some PDF fonts cannot render reliably.
  // Em/en dashes and × are intentionally NOT touched — they are part of the brand voice.
  const sanitiseAscii = (s: string): string =>
    s.replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '!=');

  if (parsed.executive_bullets?.length > 0) {
    parts.push('### Key Findings');
    parsed.executive_bullets.forEach(b => {
      const text = sanitiseAscii(coerceToString(b).trim());
      if (text && text !== '[object Object]') parts.push(`- ${text}`);
    });
    parts.push('');
  }

  if (parsed.recommendations?.length > 0) {
    parts.push('### Recommendations');
    const normalisePriority = (raw: unknown): string => {
      if (typeof raw !== 'string') return '';
      const v = raw.trim().toLowerCase();
      if (!v) return '';
      if (/(critical|p0|urgent|immediate|blocker|severe)/.test(v)) return 'Critical';
      if (/(high|mandatory|must|p1|important)/.test(v)) return 'High';
      if (/(low|nice[- ]?to[- ]?have|optional|p3|minor)/.test(v)) return 'Low';
      if (/(medium|moderate|should|p2)/.test(v)) return 'Medium';
      // Numeric scales: 1 = highest
      const n = Number(v);
      if (!Number.isNaN(n)) {
        if (n <= 1) return 'Critical';
        if (n === 2) return 'High';
        if (n === 3) return 'Medium';
        return 'Low';
      }
      // Unknown label: title-case it rather than discarding
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    };
    // Heuristic priority inference for plain-string recommendations.
    const inferPriority = (action: string): string => {
      const a = action.toLowerCase();
      if (/(immediately|halt|stop|urgent|critical|breach|before .* (deadline|expir)|by next week|this week)/.test(a)) return 'High';
      if (/(must|required|mandatory|do not|cannot|avoid|prevent|eliminate|prior to)/.test(a)) return 'High';
      if (/(consider|explore|investigate|evaluate|review|assess|nice[- ]to[- ]have|where possible|opportunistic)/.test(a)) return 'Low';
      return 'Medium';
    };
    let idx = 0;
    parsed.recommendations.forEach((r) => {
      const isObj = r && typeof r === 'object';
      const rawPriority = isObj ? (r as { priority?: unknown }).priority : undefined;
      const actionRaw = isObj ? (r as { action?: unknown }).action : r;
      const action = (coerceToString(actionRaw).trim() || coerceToString(r).trim());
      if (!action || action === '[object Object]' || action === 'See details') return;
      const normalised = normalisePriority(rawPriority);
      const priority = normalised || inferPriority(action);
      const fi = isObj ? (r as { financial_impact?: unknown }).financial_impact : null;
      const impact = fi ? ` — ${coerceToString(fi)}` : '';
      idx += 1;
      parts.push(`${idx}. **[${priority}]** ${sanitiseAscii(action)}${sanitiseAscii(impact)}`);
    });
    parts.push('');
  }

  // ── S26 Disruption Management — render the three promised deliverables.
  // (Emergency Map / Impact Table / Draft Letter + alt sourcing & comms matrices.)
  if (parsed.scenario_id === 'S26') {
    const ss = (parsed.payload?.scenario_specific ?? {}) as Record<string, unknown>;
    const fmtMoney = (v: unknown): string => {
      const n = Number(v);
      if (!Number.isFinite(n)) return '—';
      if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
      if (Math.abs(n) >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
      return `€${n.toFixed(0)}`;
    };
    const rp = (ss.response_plan ?? {}) as Record<string, any>;
    const stages: Array<{ key: string; label: string; iconWords: string }> = [
      { key: 'stage_1_assess', label: 'Stage 1 — Assess', iconWords: 'actions' },
      { key: 'stage_2_contain', label: 'Stage 2 — Contain', iconWords: 'immediate_actions' },
      { key: 'stage_3_recover', label: 'Stage 3 — Recover', iconWords: 'actions' },
      { key: 'stage_4_prevent', label: 'Stage 4 — Prevent', iconWords: 'recurrence_prevention_checklist' },
    ];
    const stagesPresent = stages.some(s => rp[s.key]);
    if (stagesPresent) {
      parts.push('### Emergency Map — 4-Stage Response Plan');
      stages.forEach(s => {
        const stage = rp[s.key] as Record<string, any> | undefined;
        if (!stage) return;
        const owner = stage.owner ? ` _(Owner: ${stage.owner})_` : '';
        const dur = stage.target_duration_hours
          ? ` _(Target: ${stage.target_duration_hours}h)_`
          : stage.target_duration_days
            ? ` _(Target: ${stage.target_duration_days}d)_`
            : '';
        parts.push(`**${s.label}**${owner}${dur}`);
        let actions: unknown[] = Array.isArray(stage.actions) ? stage.actions
          : Array.isArray(stage.immediate_actions) ? stage.immediate_actions
          : Array.isArray(stage.recurrence_prevention_checklist) ? stage.recurrence_prevention_checklist
          : [];
        // Stage 3 fallback: if AI emitted no actions[], derive procurement
        // actions from the alternative_supply_options shortlist so the stage
        // never renders as a header with no body content.
        if (s.key === 'stage_3_recover' && actions.length === 0 && Array.isArray(stage.alternative_supply_options)) {
          const opts = stage.alternative_supply_options as any[];
          actions = opts.slice(0, 3).map((o) => {
            const name = o.option_label ?? o.supplier_label ?? 'alternative supplier';
            const lt = o.lead_time_days != null ? ` (lead time ${o.lead_time_days}d)` : '';
            return `Fast-track qualification and emergency PO with ${name}${lt}.`;
          });
        }
        actions.slice(0, 6).forEach(a => {
          const t = sanitiseAscii(coerceToString(a).trim());
          if (t) parts.push(`- ${t}`);
        });
        if (s.key === 'stage_4_prevent' && Array.isArray(stage.process_changes)) {
          stage.process_changes.slice(0, 4).forEach((p: unknown) => {
            const t = sanitiseAscii(coerceToString(p).trim());
            if (t) parts.push(`- _Process change:_ ${t}`);
          });
        }
        parts.push('');
      });
    }

    // Alternative supply shortlist
    const altOptions: any[] = Array.isArray(rp.stage_3_recover?.alternative_supply_options)
      ? rp.stage_3_recover.alternative_supply_options
      : [];
    const validAlts = altOptions.filter(o => o && (o.supplier_label || o.option_label));
    if (validAlts.length > 0) {
      parts.push('### Alternative Sourcing Shortlist');
      parts.push('| Option | Lead time | Cost premium | Capacity | Readiness |');
      parts.push('|---|---|---|---|---|');
      validAlts.slice(0, 8).forEach(o => {
        const name = sanitiseAscii(coerceToString(o.option_label ?? o.supplier_label));
        const lt = o.lead_time_days != null ? `${o.lead_time_days}d` : '—';
        const cp = o.cost_premium_pct != null ? `+${o.cost_premium_pct}%` : '—';
        const cap = o.capacity_available != null ? sanitiseAscii(coerceToString(o.capacity_available)) : '—';
        const rd = o.contractual_readiness ? sanitiseAscii(coerceToString(o.contractual_readiness)).replace(/_/g, ' ') : '—';
        parts.push(`| ${name} | ${lt} | ${cp} | ${cap} | ${rd} |`);
      });
      parts.push('');
    }

    // Impact Table
    const impactRows: any[] = Array.isArray(ss.impact_scenarios) ? ss.impact_scenarios : [];
    const validImpact = impactRows.filter(r => r && (r.delay_label || r.delay_weeks != null));
    if (validImpact.length > 0) {
      parts.push('### Impact Table — Financial Loss by Delay Scenario');
      parts.push('| Delay | Revenue loss | Cumulative loss | Mitigation cost | Net impact |');
      parts.push('|---|---|---|---|---|');
      validImpact.slice(0, 8).forEach(r => {
        const label = sanitiseAscii(coerceToString(r.delay_label ?? `${r.delay_weeks}w`));
        parts.push(`| ${label} | ${fmtMoney(r.revenue_loss)} | ${fmtMoney(r.cumulative_loss)} | ${fmtMoney(r.mitigation_cost)} | ${fmtMoney(r.net_impact)} |`);
      });
      parts.push('');
    }

    // Stakeholder communications matrix
    const comms: any[] = Array.isArray(ss.stakeholder_comms) ? ss.stakeholder_comms : [];
    const validComms = comms.filter(c => c && (c.stakeholder_group || c.key_message));
    if (validComms.length > 0) {
      parts.push('### Stakeholder Communications Matrix');
      parts.push('| Stakeholder | Key message | Channel | Timing |');
      parts.push('|---|---|---|---|');
      validComms.slice(0, 8).forEach(c => {
        const sg = sanitiseAscii(coerceToString(c.stakeholder_group ?? '—'));
        const km = sanitiseAscii(coerceToString(c.key_message ?? '—'));
        const ch = sanitiseAscii(coerceToString(c.delivery_channel ?? '—'));
        const tm = sanitiseAscii(coerceToString(c.timing ?? '—'));
        parts.push(`| ${sg} | ${km} | ${ch} | ${tm} |`);
      });
      parts.push('');
    }

    // Draft Letters — claim letter + customer + internal comms templates
    const claim = (ss.claim_letter_template ?? null) as Record<string, any> | null;
    const custTpl = sanitiseAscii(coerceToString(rp.stage_2_contain?.customer_communication_template ?? ''));
    const intTpl = sanitiseAscii(coerceToString(rp.stage_2_contain?.internal_communication_template ?? ''));
    const claimBody = sanitiseAscii(coerceToString(claim?.body ?? ''));
    if (claimBody || custTpl || intTpl) {
      parts.push('### Draft Letters & Communications');
      if (claimBody) {
        parts.push(`**Claim / Partner-Assistance Letter**`);
        if (claim?.addressee) parts.push(`_Addressee: ${sanitiseAscii(coerceToString(claim.addressee))}_`);
        if (claim?.subject) parts.push(`_Subject: ${sanitiseAscii(coerceToString(claim.subject))}_`);
        parts.push('');
        parts.push(claimBody);
        parts.push('');
      }
      if (custTpl) {
        parts.push('**Customer Communication Template**');
        parts.push('');
        parts.push(custTpl);
        parts.push('');
      }
      if (intTpl) {
        parts.push('**Internal Communication Template**');
        parts.push('');
        parts.push(intTpl);
        parts.push('');
      }
    }

    // ── S26 analytical depth — 5 new dimensions ─────────────────────────────
    const rca = (ss.root_cause_analysis ?? null) as Record<string, any> | null;
    if (rca && (rca.primary_cause || (Array.isArray(rca.five_whys) && rca.five_whys.length > 0))) {
      parts.push('### Root Cause Analysis');
      if (rca.primary_cause) parts.push(`**Primary cause:** ${sanitiseAscii(coerceToString(rca.primary_cause))}`);
      if (rca.evidence_quality) parts.push(`_Evidence quality: ${sanitiseAscii(coerceToString(rca.evidence_quality))}_`);
      if (Array.isArray(rca.contributing_factors) && rca.contributing_factors.length > 0) {
        parts.push('');
        parts.push('**Contributing factors:**');
        rca.contributing_factors.slice(0, 6).forEach((f: unknown) => {
          const t = sanitiseAscii(coerceToString(f).trim());
          if (t) parts.push(`- ${t}`);
        });
      }
      if (Array.isArray(rca.five_whys) && rca.five_whys.length > 0) {
        parts.push('');
        parts.push('**Five Whys:**');
        rca.five_whys.slice(0, 5).forEach((w: unknown, i: number) => {
          const t = sanitiseAscii(coerceToString(w).trim());
          if (t) parts.push(`${i + 1}. ${t.replace(/^why\s*\d+\s*:\s*/i, '')}`);
        });
      }
      parts.push('');
    }

    const br = (ss.blast_radius ?? null) as Record<string, any> | null;
    const hasBlast = br && (
      (Array.isArray(br.directly_affected) && br.directly_affected.length > 0) ||
      (Array.isArray(br.second_order_impacts) && br.second_order_impacts.length > 0) ||
      (Array.isArray(br.third_order_impacts) && br.third_order_impacts.length > 0)
    );
    if (hasBlast) {
      parts.push('### Blast Radius');
      if (br!.estimated_revenue_at_risk != null) {
        parts.push(`- **Revenue at risk:** ${fmtMoney(br!.estimated_revenue_at_risk)}`);
      }
      if (br!.estimated_customers_affected != null) {
        parts.push(`- **Customers affected:** ${sanitiseAscii(coerceToString(br!.estimated_customers_affected))}`);
      }
      if (Array.isArray(br!.geographic_spread) && br!.geographic_spread.length > 0) {
        parts.push(`- **Geographic spread:** ${br!.geographic_spread.map((g: unknown) => sanitiseAscii(coerceToString(g))).join(', ')}`);
      }
      const tiers: Array<[string, unknown]> = [
        ['Directly affected (now)', br!.directly_affected],
        ['Second-order impacts (<=30 days)', br!.second_order_impacts],
        ['Third-order impacts (strategic)', br!.third_order_impacts],
      ];
      tiers.forEach(([label, arr]) => {
        if (Array.isArray(arr) && arr.length > 0) {
          parts.push('');
          parts.push(`**${label}:**`);
          arr.slice(0, 6).forEach((x: unknown) => {
            const t = sanitiseAscii(coerceToString(x).trim());
            if (t) parts.push(`- ${t}`);
          });
        }
      });
      parts.push('');
    }

    const rp2 = (ss.recovery_probability ?? null) as Record<string, any> | null;
    if (rp2 && (rp2.p_full_recovery_30d_pct != null || rp2.p_full_recovery_90d_pct != null || rp2.p_partial_recovery_30d_pct != null)) {
      parts.push('### Recovery Probability');
      parts.push('| Outcome | Probability |');
      parts.push('|---|---|');
      const fmtPct = (v: unknown) => v == null ? '—' : `${v}%`;
      parts.push(`| Full recovery within 30 days | ${fmtPct(rp2.p_full_recovery_30d_pct)} |`);
      parts.push(`| Partial recovery within 30 days | ${fmtPct(rp2.p_partial_recovery_30d_pct)} |`);
      parts.push(`| Full recovery within 90 days | ${fmtPct(rp2.p_full_recovery_90d_pct)} |`);
      if (rp2.confidence) {
        parts.push('');
        parts.push(`_Confidence: ${sanitiseAscii(coerceToString(rp2.confidence))}_`);
      }
      if (Array.isArray(rp2.key_assumptions) && rp2.key_assumptions.length > 0) {
        parts.push('');
        parts.push('**Key assumptions:**');
        rp2.key_assumptions.slice(0, 5).forEach((a: unknown) => {
          const t = sanitiseAscii(coerceToString(a).trim());
          if (t) parts.push(`- ${t}`);
        });
      }
      parts.push('');
    }

    const reg: any[] = Array.isArray(ss.regulatory_exposure) ? ss.regulatory_exposure : [];
    const validReg = reg.filter(r => r && (r.regime || r.obligation));
    if (validReg.length > 0) {
      parts.push('### Regulatory Exposure');
      parts.push('| Regime | Obligation | Deadline | Penalty | Owner |');
      parts.push('|---|---|---|---|---|');
      validReg.slice(0, 8).forEach(r => {
        const dl = r.deadline_hours != null ? `${r.deadline_hours}h` : '—';
        parts.push(`| ${sanitiseAscii(coerceToString(r.regime ?? '—'))} | ${sanitiseAscii(coerceToString(r.obligation ?? '—'))} | ${dl} | ${sanitiseAscii(coerceToString(r.potential_penalty ?? '—'))} | ${sanitiseAscii(coerceToString(r.owner_role ?? '—'))} |`);
      });
      parts.push('');
    }

    const lessons: any[] = Array.isArray(ss.lessons_learned_for_playbook) ? ss.lessons_learned_for_playbook : [];
    const validLessons = lessons.filter(l => l && (l.lesson || l.playbook_change));
    if (validLessons.length > 0) {
      parts.push('### Lessons Learned for Playbook');
      parts.push('| Lesson | Playbook change | Owner | Due |');
      parts.push('|---|---|---|---|');
      validLessons.slice(0, 8).forEach(l => {
        const due = l.due_in_days != null ? `${l.due_in_days}d` : '—';
        parts.push(`| ${sanitiseAscii(coerceToString(l.lesson ?? '—'))} | ${sanitiseAscii(coerceToString(l.playbook_change ?? '—'))} | ${sanitiseAscii(coerceToString(l.owner_role ?? '—'))} | ${due} |`);
      });
      parts.push('');
    }
  }

  // ── S21 Preparing for Negotiation — render the eight promised deliverables.
  if (parsed.scenario_id === 'S21') {
    const ss = (parsed.payload?.scenario_specific ?? {}) as Record<string, any>;
    const fmtMoney = (v: unknown): string => {
      const n = Number(v);
      if (!Number.isFinite(n)) return '—';
      if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
      if (Math.abs(n) >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
      return `€${n.toFixed(0)}`;
    };
    const fmtCell = (v: unknown): string => {
      if (v == null || v === '') return '—';
      return sanitiseAscii(coerceToString(v)).replace(/\|/g, '\\|');
    };

    // 1. Power Balance Analysis
    const lev = (ss.leverage_analysis ?? {}) as Record<string, any>;
    const pb = String(lev.power_balance ?? '').toUpperCase();
    if (pb && !pb.includes('|')) {
      parts.push('### Power Balance Analysis');
      parts.push(`- **Verdict:** ${pb.replace(/_/g, ' ')}`);
      const buyerFactors: any[] = Array.isArray(lev.buyer_leverage_factors) ? lev.buyer_leverage_factors : [];
      const supplierFactors: any[] = Array.isArray(lev.supplier_leverage_factors) ? lev.supplier_leverage_factors : [];
      if (buyerFactors.length > 0 || supplierFactors.length > 0) {
        const rows = Math.max(buyerFactors.length, supplierFactors.length);
        parts.push('');
        parts.push('| Buyer leverage | Supplier leverage |');
        parts.push('|---|---|');
        for (let i = 0; i < rows; i++) {
          parts.push(`| ${fmtCell(buyerFactors[i] ?? '')} | ${fmtCell(supplierFactors[i] ?? '')} |`);
        }
      }
      parts.push('');
    }

    // 2. BATNA & ZOPA
    const batna = (ss.batna ?? {}) as Record<string, any>;
    const zopa = (ss.zopa ?? {}) as Record<string, any>;
    const hasBatna = batna.buyer_batna || batna.batna_strength_pct != null || batna.supplier_batna_estimated;
    const hasZopa = zopa.buyer_target != null || zopa.supplier_likely_floor != null || zopa.zopa_exists != null;
    if (hasBatna || hasZopa) {
      parts.push('### BATNA & ZOPA');
      if (batna.buyer_batna) parts.push(`- **Buyer BATNA:** ${fmtCell(batna.buyer_batna)}`);
      if (batna.buyer_batna_value != null) parts.push(`- **Buyer BATNA value:** ${fmtMoney(batna.buyer_batna_value)}`);
      if (batna.batna_strength_pct != null) parts.push(`- **BATNA strength:** ${batna.batna_strength_pct}%`);
      if (batna.supplier_batna_estimated) parts.push(`- **Supplier BATNA (estimated):** ${fmtCell(batna.supplier_batna_estimated)}`);
      if (zopa.buyer_target != null) parts.push(`- **Buyer target:** ${fmtMoney(zopa.buyer_target)}`);
      if (zopa.supplier_likely_floor != null) parts.push(`- **Supplier likely floor:** ${fmtMoney(zopa.supplier_likely_floor)}`);
      if (typeof zopa.buyer_walk_away === 'number') {
        parts.push(`- **Buyer walk-away:** ${fmtMoney(zopa.buyer_walk_away)} _(confidential — masked in shared exports)_`);
      }
      if (zopa.zopa_exists != null) parts.push(`- **Positive ZOPA exists:** ${zopa.zopa_exists ? 'Yes' : 'No'}`);
      const actions: any[] = Array.isArray(batna.batna_improvement_actions) ? batna.batna_improvement_actions : [];
      if (actions.length > 0) {
        parts.push('');
        parts.push('**BATNA improvement actions:**');
        actions.slice(0, 6).forEach((a: unknown) => {
          const t = sanitiseAscii(coerceToString(a).trim());
          if (t) parts.push(`- ${t}`);
        });
      }
      parts.push('');
    }

    // 3. Counter-Argument Preparation
    const counters: any[] = Array.isArray(ss.counter_arguments) ? ss.counter_arguments : [];
    const validCounters = counters.filter(c => c && (c.supplier_position || c.buyer_response));
    if (validCounters.length > 0) {
      parts.push('### Counter-Argument Preparation');
      parts.push('| Supplier position | Buyer response | Evidence |');
      parts.push('|---|---|---|');
      validCounters.slice(0, 6).forEach(c => {
        parts.push(`| ${fmtCell(c.supplier_position)} | ${fmtCell(c.buyer_response)} | ${fmtCell(c.evidence)} |`);
      });
      parts.push('');
    }

    // 4. Walk-Away Plan
    const wap = (ss.walk_away_plan ?? null) as Record<string, any> | null;
    if (wap && (wap.trigger_conditions || wap.exit_steps || wap.communication_script)) {
      parts.push('### Walk-Away Plan');
      const triggers: any[] = Array.isArray(wap.trigger_conditions) ? wap.trigger_conditions : [];
      if (triggers.length > 0) {
        parts.push('**Trigger conditions:**');
        triggers.slice(0, 6).forEach((t: unknown) => {
          const txt = sanitiseAscii(coerceToString(t).trim());
          if (txt) parts.push(`- ${txt}`);
        });
        parts.push('');
      }
      const exitSteps: any[] = Array.isArray(wap.exit_steps) ? wap.exit_steps : [];
      if (exitSteps.length > 0) {
        parts.push('**Exit steps:**');
        exitSteps.slice(0, 6).forEach((s: unknown, i: number) => {
          const txt = sanitiseAscii(coerceToString(s).trim());
          if (txt) parts.push(`${i + 1}. ${txt}`);
        });
        parts.push('');
      }
      if (wap.communication_script) {
        parts.push('**Walk-away script:**');
        parts.push('');
        parts.push(`> ${sanitiseAscii(coerceToString(wap.communication_script))}`);
        parts.push('');
      }
    }

    // 5. Value Creation Opportunities
    const vc: any[] = Array.isArray(ss.value_creation) ? ss.value_creation : [];
    const validVc = vc.filter(v => v && (v.opportunity || v.buyer_benefit));
    if (validVc.length > 0) {
      parts.push('### Value Creation Opportunities');
      parts.push('| Opportunity | Buyer benefit | Supplier benefit |');
      parts.push('|---|---|---|');
      validVc.slice(0, 6).forEach(v => {
        parts.push(`| ${fmtCell(v.opportunity)} | ${fmtCell(v.buyer_benefit)} | ${fmtCell(v.supplier_benefit)} |`);
      });
      parts.push('');
    }

    // 6. Financial Outcome Range
    const fr = (ss.financial_outcome_range ?? null) as Record<string, any> | null;
    if (fr && (fr.optimistic != null || fr.realistic != null || fr.pessimistic != null)) {
      parts.push('### Financial Outcome Range');
      parts.push('| Scenario | Outcome |');
      parts.push('|---|---|');
      parts.push(`| Optimistic | ${fmtMoney(fr.optimistic)} |`);
      parts.push(`| Realistic | ${fmtMoney(fr.realistic)} |`);
      parts.push(`| Pessimistic | ${fmtMoney(fr.pessimistic)} |`);
      parts.push('');
    }

    // 7. Negotiation Risk Register
    const rr: any[] = Array.isArray(ss.risk_register) ? ss.risk_register : [];
    const validRr = rr.filter(r => r && r.risk);
    if (validRr.length > 0) {
      parts.push('### Negotiation Risk Register');
      parts.push('| Risk | Likelihood | Impact | Mitigation |');
      parts.push('|---|---|---|---|');
      validRr.slice(0, 8).forEach(r => {
        parts.push(`| ${fmtCell(r.risk)} | ${fmtCell(r.likelihood)} | ${fmtCell(r.impact)} | ${fmtCell(r.mitigation)} |`);
      });
      parts.push('');
    }

    // 8. Negotiation Scenario Comparison
    const negSc: any[] = Array.isArray(ss.negotiation_scenarios) ? ss.negotiation_scenarios : [];
    const validNegSc = negSc.filter(n => n && n.name && n.expected_savings_pct != null);
    if (validNegSc.length > 0) {
      parts.push('### Negotiation Scenario Comparison');
      parts.push('| Strategy | Expected savings | Timeline | Risk |');
      parts.push('|---|---|---|---|');
      validNegSc.slice(0, 6).forEach(n => {
        const sav = n.expected_savings_pct != null ? `${n.expected_savings_pct}%` : '—';
        const tl = n.estimated_timeline_months != null ? `${n.estimated_timeline_months} months` : '—';
        parts.push(`| ${fmtCell(n.name)} | ${sav} | ${tl} | ${fmtCell(n.risk_level)} |`);
      });
      parts.push('');
    }
  }

  // ── S20 Category Risk Evaluator — render the eight promised deliverables.
  if (parsed.scenario_id === 'S20') {
    const ss = (parsed.payload?.scenario_specific ?? {}) as Record<string, any>;
    const fmtMoney = (v: unknown): string => {
      const n = Number(v);
      if (!Number.isFinite(n)) return '—';
      if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
      if (Math.abs(n) >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
      return `€${n.toFixed(0)}`;
    };
    const fmtCell = (v: unknown): string => {
      if (v == null || v === '') return '—';
      return sanitiseAscii(coerceToString(v)).replace(/\|/g, '\\|');
    };

    // 1. Headline Category Risk Score
    const crs = (ss.category_risk_score ?? null) as Record<string, any> | null;
    if (crs && (crs.overall != null || crs.rag || crs.decision)) {
      parts.push('### Category Risk Score');
      if (crs.overall != null) parts.push(`- **Overall score:** ${crs.overall} / 100`);
      if (crs.rag) parts.push(`- **RAG status:** ${sanitiseAscii(coerceToString(crs.rag))}`);
      if (crs.decision) parts.push(`- **Decision recommendation:** ${sanitiseAscii(coerceToString(crs.decision)).replace(/_/g, ' ')}`);
      parts.push('');
    }

    // 2. Score Breakdown — 5 dimensions
    const breakdown: any[] = Array.isArray(ss.score_breakdown) ? ss.score_breakdown : [];
    const validBreakdown = breakdown.filter(b => b && b.dimension);
    if (validBreakdown.length > 0) {
      parts.push('### Risk Dimensions');
      parts.push('| Dimension | Score | RAG | Rationale |');
      parts.push('|---|---|---|---|');
      validBreakdown.slice(0, 5).forEach(b => {
        const score = b.score != null ? `${b.score} / 100` : '—';
        parts.push(`| ${fmtCell(b.dimension)} | ${score} | ${fmtCell(b.rag)} | ${fmtCell(b.rationale)} |`);
      });
      parts.push('');
    }

    // 3. Market Brief
    const mb = (ss.market_brief ?? null) as Record<string, any> | null;
    if (mb && (mb.dynamics || mb.price_outlook_pct != null || (Array.isArray(mb.key_trends) && mb.key_trends.length > 0))) {
      parts.push('### Market Brief');
      if (mb.dynamics) parts.push(sanitiseAscii(coerceToString(mb.dynamics)));
      if (mb.price_outlook_pct != null) {
        const sign = Number(mb.price_outlook_pct) >= 0 ? '+' : '';
        parts.push('');
        parts.push(`- **12-month price outlook:** ${sign}${mb.price_outlook_pct}%`);
      }
      if (Array.isArray(mb.key_trends) && mb.key_trends.length > 0) {
        parts.push('');
        parts.push('**Key trends:**');
        mb.key_trends.slice(0, 5).forEach((t: unknown) => {
          const txt = sanitiseAscii(coerceToString(t).trim());
          if (txt) parts.push(`- ${txt}`);
        });
      }
      parts.push('');
    }

    // 4. Supply Health
    const sh = (ss.supply_health ?? null) as Record<string, any> | null;
    if (sh && (sh.supplier_count != null || sh.top3_share_pct != null || sh.hhi != null || (Array.isArray(sh.single_point_failures) && sh.single_point_failures.length > 0))) {
      parts.push('### Supply Health');
      if (sh.supplier_count != null) parts.push(`- **Supplier count:** ${sh.supplier_count}`);
      if (sh.top3_share_pct != null) parts.push(`- **Top-3 supplier share:** ${sh.top3_share_pct}%`);
      if (sh.hhi != null) parts.push(`- **HHI:** ${sh.hhi}`);
      if (Array.isArray(sh.single_point_failures) && sh.single_point_failures.length > 0) {
        parts.push('');
        parts.push('**Single points of failure:**');
        sh.single_point_failures.slice(0, 6).forEach((f: unknown) => {
          const t = sanitiseAscii(coerceToString(f).trim());
          if (t) parts.push(`- ${t}`);
        });
      }
      parts.push('');
    }

    // 5. Budget Risk Forecast
    const brf = (ss.budget_risk_forecast ?? null) as Record<string, any> | null;
    if (brf && (brf.p10_pct != null || brf.p50_pct != null || brf.p90_pct != null)) {
      parts.push('### Budget Risk Forecast');
      parts.push('| Scenario | Variance vs budget |');
      parts.push('|---|---|');
      const fmtPct = (v: unknown) => v == null ? '—' : `${Number(v) >= 0 ? '+' : ''}${v}%`;
      parts.push(`| P10 (best case) | ${fmtPct(brf.p10_pct)} |`);
      parts.push(`| P50 (median) | ${fmtPct(brf.p50_pct)} |`);
      parts.push(`| P90 (worst case) | ${fmtPct(brf.p90_pct)} |`);
      if (Array.isArray(brf.drivers) && brf.drivers.length > 0) {
        parts.push('');
        parts.push('**Variance drivers:**');
        brf.drivers.slice(0, 5).forEach((d: unknown) => {
          const t = sanitiseAscii(coerceToString(d).trim());
          if (t) parts.push(`- ${t}`);
        });
      }
      parts.push('');
    }

    // 6. SOW Ambiguity Findings
    const sow: any[] = Array.isArray(ss.sow_ambiguity_findings) ? ss.sow_ambiguity_findings : [];
    const validSow = sow.filter(s => s && (s.clause || s.recommended_fix));
    if (validSow.length > 0) {
      parts.push('### SOW Ambiguity Findings');
      parts.push('| Clause | Severity | Recommended fix |');
      parts.push('|---|---|---|');
      validSow.slice(0, 8).forEach(s => {
        parts.push(`| ${fmtCell(s.clause)} | ${fmtCell(s.severity)} | ${fmtCell(s.recommended_fix)} |`);
      });
      parts.push('');
    }

    // 7. Recommended Contract Terms
    const terms: any[] = Array.isArray(ss.recommended_contract_terms) ? ss.recommended_contract_terms : [];
    const validTerms = terms.filter(t => t && (t.clause_type || t.rationale));
    if (validTerms.length > 0) {
      parts.push('### Recommended Contract Terms');
      parts.push('| Clause type | Priority | Rationale |');
      parts.push('|---|---|---|');
      const priorityOrder: Record<string, number> = { MUST: 0, SHOULD: 1, NICE_TO_HAVE: 2 };
      const sortedTerms = [...validTerms].sort((a, b) =>
        (priorityOrder[String(a.priority ?? '').toUpperCase()] ?? 3) -
        (priorityOrder[String(b.priority ?? '').toUpperCase()] ?? 3)
      );
      sortedTerms.slice(0, 10).forEach(t => {
        parts.push(`| ${fmtCell(t.clause_type)} | ${fmtCell(String(t.priority ?? '').replace(/_/g, ' '))} | ${fmtCell(t.rationale)} |`);
      });
      parts.push('');
    }

    // 8. Kraljic Position
    const kp = (ss.kraljic_position ?? null) as Record<string, any> | null;
    if (kp && (kp.quadrant || kp.supply_risk != null || kp.business_impact != null)) {
      parts.push('### Kraljic Position');
      if (kp.quadrant) parts.push(`- **Quadrant:** ${sanitiseAscii(coerceToString(kp.quadrant))}`);
      if (kp.supply_risk != null) parts.push(`- **Supply risk:** ${kp.supply_risk} / 5`);
      if (kp.business_impact != null) parts.push(`- **Business impact:** ${kp.business_impact} / 5`);
      parts.push('');
    }

    // 9. Decision Readiness — promised deliverable, always rendered when present
    const dr = (ss.decision_readiness ?? null) as Record<string, any> | null;
    if (dr && (dr.score != null || dr.verdict || (Array.isArray(dr.checklist) && dr.checklist.length > 0))) {
      parts.push('### Decision Readiness');
      if (dr.score != null) parts.push(`- **Readiness score:** ${dr.score} / 100`);
      if (dr.verdict) parts.push(`- **Verdict:** ${sanitiseAscii(coerceToString(dr.verdict)).replace(/_/g, ' ')}`);
      if (dr.rationale) {
        parts.push('');
        parts.push(sanitiseAscii(coerceToString(dr.rationale)));
      }
      const checklist: any[] = Array.isArray(dr.checklist) ? dr.checklist : [];
      const validChecklist = checklist.filter(c => c && c.item);
      if (validChecklist.length > 0) {
        parts.push('');
        parts.push('| Readiness item | Status | Owner |');
        parts.push('|---|---|---|');
        validChecklist.slice(0, 8).forEach(c => {
          parts.push(`| ${fmtCell(c.item)} | ${fmtCell(String(c.status ?? '').replace(/_/g, ' '))} | ${fmtCell(c.owner_role)} |`);
        });
      }
      parts.push('');
    }

    // Concentration shared block
    const conc = (ss.concentration ?? null) as Record<string, any> | null;
    const concCats: any[] = Array.isArray(conc?.categories) ? conc!.categories : [];
    if (concCats.length > 0) {
      parts.push('### Supplier Concentration');
      parts.push('| Category | HHI | Concentration | Annual spend |');
      parts.push('|---|---|---|---|');
      concCats.slice(0, 8).forEach(c => {
        parts.push(`| ${fmtCell(c.category_name ?? c.category_id)} | ${fmtCell(c.hhi)} | ${fmtCell(c.hhi_interpretation)} | ${fmtMoney(c.annual_spend)} |`);
      });
      parts.push('');
    }
  }

  // ── S27 Black Swan Scenario Simulation — render the ten promised deliverables.
  if (parsed.scenario_id === 'S27') {
    const ss = (parsed.payload?.scenario_specific ?? {}) as Record<string, any>;
    const fmtMoney = (v: unknown): string => {
      const n = Number(v);
      if (!Number.isFinite(n)) return '—';
      if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
      if (Math.abs(n) >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
      return `€${n.toFixed(0)}`;
    };
    const fmtCell = (v: unknown, suffix = ''): string => {
      if (v == null || v === '') return '—';
      const s = sanitiseAscii(coerceToString(v)).replace(/\|/g, '\\|');
      return s + suffix;
    };

    // 1. Black Swan Risk Map — supply chain nodes & criticality
    const nodes: any[] = Array.isArray(ss.supply_chain_nodes) ? ss.supply_chain_nodes : [];
    const validNodes = nodes.filter(n => n && (n.node_label || n.node_id));
    if (validNodes.length > 0) {
      parts.push('### Black Swan Risk Map');
      parts.push('| Node | Type | Criticality | Geography | Alternative |');
      parts.push('|---|---|---|---|---|');
      validNodes.slice(0, 12).forEach(n => {
        parts.push(`| ${fmtCell(n.node_label ?? n.node_id)} | ${fmtCell(String(n.node_type ?? '').replace(/_/g, ' '))} | ${fmtCell(String(n.criticality ?? '').replace(/_/g, ' '))} | ${fmtCell(n.geography)} | ${n.alternative_available ? 'Yes' : 'No'} |`);
      });
      parts.push('');
    }

    // 2. Scenario Simulation Results — impact model
    const im = (ss.impact_model ?? {}) as Record<string, any>;
    if (im.direct_impact_estimate != null || im.total_impact_estimate != null) {
      parts.push('### Scenario Simulation Results');
      if (im.direct_impact_estimate != null) parts.push(`- **Direct impact estimate:** ${fmtMoney(im.direct_impact_estimate)}`);
      if (im.total_impact_estimate != null)  parts.push(`- **Total impact estimate (incl. cascades):** ${fmtMoney(im.total_impact_estimate)}`);
      if (ss.scenario_description) parts.push(`- **Scenario:** ${sanitiseAscii(coerceToString(ss.scenario_description))}`);
      if (ss.overall_resilience_rag) parts.push(`- **Overall resilience posture:** ${sanitiseAscii(coerceToString(ss.overall_resilience_rag))}`);
      parts.push('');
    }

    // 3. Vulnerability Assessment — single points of failure
    const vulns: any[] = Array.isArray(ss.prioritised_vulnerabilities) ? ss.prioritised_vulnerabilities : [];
    const validVulns = vulns.filter(v => v && v.vulnerability);
    if (validVulns.length > 0) {
      parts.push('### Vulnerability Assessment');
      parts.push('| Vulnerability | Node | Severity if triggered | Mitigation available |');
      parts.push('|---|---|---|---|');
      validVulns.slice(0, 10).forEach(v => {
        parts.push(`| ${fmtCell(v.vulnerability)} | ${fmtCell(v.associated_node)} | ${fmtCell(String(v.severity_if_triggered ?? '').replace(/_/g, ' '))} | ${fmtCell(v.mitigation_available)} |`);
      });
      parts.push('');
    }

    // 4. Cascading Failure Analysis
    const cascades: any[] = Array.isArray(im.cascade_effects) ? im.cascade_effects : [];
    const validCascades = cascades.filter(c => c && (c.triggered_node || c.delay_days != null));
    if (validCascades.length > 0) {
      parts.push('### Cascading Failure Analysis');
      parts.push('| Triggered node | Delay | Revenue at risk | Confidence |');
      parts.push('|---|---|---|---|');
      validCascades.slice(0, 10).forEach(c => {
        const delay = c.delay_days != null ? `${c.delay_days}d` : '—';
        parts.push(`| ${fmtCell(c.triggered_node)} | ${delay} | ${fmtMoney(c.revenue_at_risk)} | ${fmtCell(c.cascade_confidence)} |`);
      });
      parts.push('');
    }

    // 5. Early Warning Indicators
    const ewis: any[] = Array.isArray(ss.early_warning_indicators) ? ss.early_warning_indicators : [];
    const validEwis = ewis.filter(e => e && e.indicator);
    if (validEwis.length > 0) {
      parts.push('### Early Warning Indicators');
      parts.push('| Indicator | Data source | Threshold | Lead time | Owner |');
      parts.push('|---|---|---|---|---|');
      validEwis.slice(0, 10).forEach(e => {
        const lt = e.lead_time_days != null ? `${e.lead_time_days}d` : '—';
        parts.push(`| ${fmtCell(e.indicator)} | ${fmtCell(e.data_source)} | ${fmtCell(e.threshold)} | ${lt} | ${fmtCell(e.owner_role)} |`);
      });
      parts.push('');
    }

    // 6. Response Playbook — 5 phases
    const rp = (ss.response_playbook ?? {}) as Record<string, any>;
    const phases: Array<{ key: string; label: string }> = [
      { key: 'phase_1_detect',   label: 'Phase 1 — Detect' },
      { key: 'phase_2_activate', label: 'Phase 2 — Activate' },
      { key: 'phase_3_contain',  label: 'Phase 3 — Contain' },
      { key: 'phase_4_recover',  label: 'Phase 4 — Recover' },
      { key: 'phase_5_learn',    label: 'Phase 5 — Learn' },
    ];
    const phasesPresent = phases.some(p => rp[p.key]);
    if (phasesPresent) {
      parts.push('### Response Playbook');
      phases.forEach(ph => {
        const phase = rp[ph.key] as Record<string, any> | undefined;
        if (!phase) return;
        const owner = phase.owner_role ? ` _(Owner: ${sanitiseAscii(coerceToString(phase.owner_role))})_` : '';
        const dur = phase.target_duration_hours
          ? ` _(Target: ${phase.target_duration_hours}h)_`
          : phase.rto_target_hours
            ? ` _(RTO target: ${phase.rto_target_hours}h)_`
            : '';
        parts.push(`**${ph.label}**${owner}${dur}`);
        if (phase.trigger_signal) parts.push(`- _Trigger:_ ${sanitiseAscii(coerceToString(phase.trigger_signal))}`);
        if (phase.decision_authority) parts.push(`- _Decision authority:_ ${sanitiseAscii(coerceToString(phase.decision_authority))}`);
        const acts: unknown[] = Array.isArray(phase.actions) ? phase.actions : [];
        acts.slice(0, 6).forEach(a => {
          const t = sanitiseAscii(coerceToString(a).trim());
          if (t) parts.push(`- ${t}`);
        });
        if (Array.isArray(phase.post_mortem_checklist)) {
          phase.post_mortem_checklist.slice(0, 4).forEach((p: unknown) => {
            const t = sanitiseAscii(coerceToString(p).trim());
            if (t) parts.push(`- _Post-mortem:_ ${t}`);
          });
        }
        if (Array.isArray(phase.process_changes)) {
          phase.process_changes.slice(0, 4).forEach((p: unknown) => {
            const t = sanitiseAscii(coerceToString(p).trim());
            if (t) parts.push(`- _Process change:_ ${t}`);
          });
        }
        if (Array.isArray(phase.alternative_supply_options) && phase.alternative_supply_options.length > 0) {
          parts.push(`- _Alternative supply options:_ ${phase.alternative_supply_options.length} identified (see Mitigation Roadmap)`);
        }
        parts.push('');
      });
    }

    // 7 + 9. Mitigation Roadmap (prioritised) AND Investment Recommendation (cost-benefit)
    const inv: any[] = Array.isArray(ss.resilience_investments) ? ss.resilience_investments : [];
    const validInv = inv.filter(i => i && i.investment);
    if (validInv.length > 0) {
      const priorityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const sorted = [...validInv].sort((a, b) =>
        (priorityOrder[String(a.priority ?? '').toUpperCase()] ?? 3) -
        (priorityOrder[String(b.priority ?? '').toUpperCase()] ?? 3)
      );
      parts.push('### Mitigation Roadmap');
      parts.push('| Priority | Investment | Est. cost | RTO improvement | Risk reduction |');
      parts.push('|---|---|---|---|---|');
      sorted.slice(0, 12).forEach(i => {
        const rto = i.rto_improvement_hours != null ? `${i.rto_improvement_hours}h` : '—';
        const rr  = i.risk_reduction_pct != null ? `${i.risk_reduction_pct}%` : '—';
        parts.push(`| ${fmtCell(i.priority)} | ${fmtCell(i.investment)} | ${fmtMoney(i.estimated_cost)} | ${rto} | ${rr} |`);
      });
      parts.push('');

      parts.push('### Investment Recommendation — Cost-Benefit');
      parts.push('| Investment | Cost | Risk reduction | ROI rationale |');
      parts.push('|---|---|---|---|');
      sorted.slice(0, 10).forEach(i => {
        const rr = i.risk_reduction_pct != null ? `${i.risk_reduction_pct}%` : '—';
        parts.push(`| ${fmtCell(i.investment)} | ${fmtMoney(i.estimated_cost)} | ${rr} | ${fmtCell(i.roi_rationale)} |`);
      });
      parts.push('');
    }

    // 8. Diversification Strategy
    const ds = (ss.diversification_strategy ?? {}) as Record<string, any>;
    const dsActions: any[] = Array.isArray(ds.actions) ? ds.actions : [];
    const conc = (ss.concentration ?? {}) as Record<string, any>;
    const concCats: any[] = Array.isArray(conc.categories) ? conc.categories : [];
    const concSuppliers: any[] = Array.isArray(conc.suppliers) ? conc.suppliers : [];
    if (dsActions.length > 0 || concCats.length > 0 || ds.current_concentration_summary || ds.target_state) {
      parts.push('### Diversification Strategy');
      if (ds.current_concentration_summary) parts.push(`- **Current state:** ${sanitiseAscii(coerceToString(ds.current_concentration_summary))}`);
      if (ds.target_state)                  parts.push(`- **Target state:** ${sanitiseAscii(coerceToString(ds.target_state))}`);
      if (concCats.length > 0) {
        parts.push('');
        parts.push('| Category | HHI | Concentration | Annual spend |');
        parts.push('|---|---|---|---|');
        concCats.slice(0, 8).forEach(c => {
          parts.push(`| ${fmtCell(c.category_name ?? c.category_id)} | ${fmtCell(c.hhi)} | ${fmtCell(c.hhi_interpretation)} | ${fmtMoney(c.annual_spend)} |`);
        });
      }
      const flows: any[] = Array.isArray(conc.flows) ? conc.flows : [];
      const singleSource = flows.filter(f => f?.single_source_flag);
      if (singleSource.length > 0) {
        parts.push('');
        parts.push(`**⚠ Single-source dependencies:** ${singleSource.length} flow(s) flagged. Suppliers: ${singleSource.slice(0, 5).map(f => sanitiseAscii(coerceToString(f.target))).join(', ')}.`);
      }
      if (dsActions.length > 0) {
        parts.push('');
        parts.push('**Diversification actions:**');
        dsActions.slice(0, 8).forEach(a => {
          const horizon = a.horizon_months != null ? ` _(${a.horizon_months}mo)_` : '';
          const reduction = a.concentration_reduction_pct != null ? ` — reduces concentration by ${a.concentration_reduction_pct}%` : '';
          const cost = a.estimated_cost != null ? ` (cost: ${fmtMoney(a.estimated_cost)})` : '';
          parts.push(`- ${sanitiseAscii(coerceToString(a.action))}${horizon}${reduction}${cost}`);
        });
      }
      parts.push('');
    }

    // 10. Monitoring Dashboard — KRIs and trigger points
    const md = (ss.monitoring_dashboard ?? {}) as Record<string, any>;
    const kris: any[] = Array.isArray(md.kris) ? md.kris : [];
    const triggers: any[] = Array.isArray(md.trigger_points) ? md.trigger_points : [];
    const validKris = kris.filter(k => k && k.kri_name);
    const validTriggers = triggers.filter(t => t && t.trigger);
    if (validKris.length > 0 || validTriggers.length > 0) {
      parts.push('### Monitoring Dashboard');
      if (validKris.length > 0) {
        parts.push('**Key Risk Indicators**');
        parts.push('');
        parts.push('| KRI | Current | Amber | Red | Owner | Frequency |');
        parts.push('|---|---|---|---|---|---|');
        validKris.slice(0, 10).forEach(k => {
          parts.push(`| ${fmtCell(k.kri_name)} | ${fmtCell(k.current_value)} | ${fmtCell(k.amber_threshold)} | ${fmtCell(k.red_threshold)} | ${fmtCell(k.owner_role)} | ${fmtCell(k.review_frequency)} |`);
        });
        parts.push('');
      }
      if (validTriggers.length > 0) {
        parts.push('**Trigger Points & Escalation**');
        parts.push('');
        parts.push('| Trigger | Automated response | Escalation path |');
        parts.push('|---|---|---|');
        validTriggers.slice(0, 8).forEach(t => {
          parts.push(`| ${fmtCell(t.trigger)} | ${fmtCell(t.automated_response)} | ${fmtCell(t.escalation_path)} |`);
        });
        parts.push('');
      }
    }

    // RTO/RPO gap callout (supports Scenario Simulation Results)
    const rr = (ss.rto_rpo_analysis ?? {}) as Record<string, any>;
    if (rr.target_rto_hours != null || rr.target_rpo_hours != null || rr.gap_commentary) {
      parts.push('### RTO / RPO Gap Analysis');
      parts.push('| Metric | Target | Current | Gap |');
      parts.push('|---|---|---|---|');
      const fmtH = (v: unknown) => v == null ? '—' : `${v}h`;
      parts.push(`| RTO | ${fmtH(rr.target_rto_hours)} | ${fmtH(rr.current_rto_estimate_hours)} | ${fmtH(rr.rto_gap_hours)} |`);
      parts.push(`| RPO | ${fmtH(rr.target_rpo_hours)} | ${fmtH(rr.current_rpo_estimate_hours)} | ${fmtH(rr.rpo_gap_hours)} |`);
      if (rr.gap_commentary) {
        parts.push('');
        parts.push(sanitiseAscii(coerceToString(rr.gap_commentary)));
      }
      parts.push('');
    }
  }

  const GENERIC_PHRASES = ['not specified', 'unknown', 'provide missing data', 'not available', 'n/a'];
  const validGaps = (parsed.data_gaps ?? []).filter(g => {
    if (!g?.field || !g?.impact || !g?.resolution) return false;
    const combined = `${g.field} ${g.impact} ${g.resolution}`.toLowerCase();
    return !GENERIC_PHRASES.some(p => combined.includes(p));
  });

  if (validGaps.length > 0) {
    parts.push('');
    parts.push('**To strengthen this analysis:**');
    validGaps.slice(0, 3).forEach(g => {
      // Strip redundant prefix that duplicates the heading
      const cleaned = sanitiseAscii(g.resolution.replace(/^To strengthen this analysis,?\s*/i, ''));
      // Capitalise the first letter after stripping
      const resolution = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      parts.push(`- ${resolution}`);
    });
    parts.push('');
  }

  return parts.join('\n');
}
