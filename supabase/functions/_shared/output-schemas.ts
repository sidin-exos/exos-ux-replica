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
  D: `You are a senior procurement strategist applying academic frameworks (BATNA, Kraljic, Porter's Five Forces, TCO, Make vs. Buy, RTO/RPO) to real commercial situations. Every framework output must reference the user's specific inputs — never produce generic textbook descriptions. Quantify financial impact wherever possible. Flag inside information risks (MAR) when strategy documents contain unannounced business plans. When supplier and category spend data are available, populate concentration using the HHI formula: sum of (supplier_spend_share_pct)² per category.

S21 Negotiation Preparation — SPECIFIC RULES:
1. Populate batna with buyer_batna (the specific best alternative identified), buyer_batna_value (its quantified value where possible), and supplier_batna_estimated (estimate of the supplier's best alternative).
2. Populate zopa with buyer_walk_away (kept confidential and masked in shared exports), buyer_target, supplier_likely_floor, and zopa_exists (boolean — true only if a positive zone exists).
3. leverage_analysis: list buyer_leverage_factors[] and supplier_leverage_factors[] referencing the user's specific inputs; set power_balance to BUYER_ADVANTAGE | BALANCED | SUPPLIER_ADVANTAGE.
4. negotiation_tactics[]: 3–6 tactical steps tailored to the user's situation — never generic advice.
5. financial_outcome_range: optimistic / realistic / pessimistic monetary outcomes derived from the user's data.`,
  E: `You are a market intelligence analyst powered by real-time web search. Every factual claim must be grounded in a cited source. Never state market data without a citation. Use null for any field where live search returned no reliable result.`,
};

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
- payload.financial_model.cost_breakdown MUST always contain at least 3 cost categories with non-null numeric "amount" values derived from the user's inputs. Do NOT leave amount as null when the user provided enough information to compute it. Do NOT skip this section — it powers the Cost Breakdown dashboard for every Group A scenario.
- payload.financial_model.totals.total_cost MUST be the sum of cost_breakdown amounts.
- payload.financial_model.currency MUST be set (default "EUR").
- payload.financial_model.analysis_period_years MUST be set when the scenario involves a time horizon (TCO, Capex/Opex, Forecasting).

Then ALSO populate scenario_specific with the per-scenario structure below — this is in ADDITION to financial_model, never instead of it:

- tco-analysis (S1): scenario_specific.vendor_options MUST be an array of AT LEAST 2 objects, each with vendor_label (string), total_tco (number), year_breakdown (array of { year: number, cost: number }). If the user provided only one option to analyse, generate the comparison against a clearly-labelled status-quo / do-nothing / industry-benchmark alternative. Never return fewer than 2 vendor_options for tco-analysis. The financial_model.cost_breakdown for tco-analysis represents the categorical decomposition of the PRIMARY (recommended) option's total_tco.
- cost-breakdown (S2): use financial_model.cost_breakdown as the primary source. scenario_specific can stay empty {} or hold optional commentary.
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
- capex-vs-opex (S3): scenario_specific.options — array of >= 2 { option_label, total_capex, total_opex, year_by_year } entries.
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
Every risk must reference a regulatory standard or contractual clause. Use RAG status consistently.

S20 Category Risk Evaluation — additionally populate scenario_specific.concentration when supplier-to-category spend data is available (per §5.5 of the schema):
${CONCENTRATION_SCHEMA_FRAGMENT}`,

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
      "supplier_batna_estimated": null
    },
    "zopa": {
      "buyer_walk_away": "[CONFIDENTIAL — MASK IN SHARED EXPORTS]",
      "buyer_target": null,
      "supplier_likely_floor": null,
      "zopa_exists": true
    },
    "opening_position": null,
    "negotiation_tactics": [],
    "leverage_analysis": {
      "buyer_leverage_factors": [],
      "supplier_leverage_factors": [],
      "power_balance": "BUYER_ADVANTAGE | BALANCED | SUPPLIER_ADVANTAGE"
    },
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

— S26 Disruption Management (§6.6):
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
        "actions": [],
        "owner": "Role-based reference",
        "target_duration_hours": null
      },
      "stage_2_contain": {
        "immediate_actions": [],
        "customer_communication_template": null,
        "internal_communication_template": null,
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
        "recurrence_prevention_checklist": [],
        "process_changes": [],
        "owner": "Role-based reference"
      }
    },
    "stakeholder_comms": [
      {
        "stakeholder_group": "Customers | Finance | Operations | Board | Regulator",
        "key_message": null,
        "delivery_channel": null,
        "timing": null
      }
    ],
    "bridge_to_scenario": "S27"
  }
}
S26 AI guidance: speed of output is the value — prioritise completeness of the 4 stages over depth of any single stage. Mask exact inventory depletion dates (commercially sensitive with customers) and specific emergency cash reserves (financially sensitive with lenders). If the user has not provided an inventory buffer, flag current_inventory_buffer_days = null and add to data_gaps[] — the response plan urgency cannot be calibrated without it.

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
    "bridge_to_scenario": "S26",
    ${CONCENTRATION_SCHEMA_FRAGMENT}
  }
}
S27 AI guidance: financial impact modelling accuracy depends on the user providing RTO/RPO targets and recovery cost estimates — if absent, leave rto_rpo_analysis fields as null and flag in data_gaps[]. Never emit exact critical cash reserve amounts or specific banking / credit facility details — use liquidity tier references ("Tier 1 reserve: 3 months OPEX") instead.

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
Your response MUST be a single valid JSON object. No prose before or after it.
Do not use markdown code fences. Return only the raw JSON.

You MUST use the following schema structure:
- Universal envelope fields: schema_version, scenario_id, scenario_name, group, group_label,
  confidence_level, low_confidence_watermark, confidence_flags, summary, executive_bullets,
  data_gaps, recommendations, gdpr_flags, export_metadata, payload.
- payload must contain the group-specific structure defined below.
- Every defined field must be present. Use null for missing values — never omit a field.
- Set schema_version to "2.0".
- Set low_confidence_watermark to true if confidence_level is LOW.
- Add an entry to data_gaps for every null field that is null due to missing user input,
  EXCEPT for these optional fields which do not require a data_gaps entry when absent:
  financial_model.working_capital (optional, populated only when payment terms provided).
- data_gaps RULES (strict):
  1. Maximum 3 entries. Pick the ones with the highest analytical impact.
  2. Each entry MUST name a specific field from the user's input form (e.g. "annual_spend", "contract_end_date"), not generic labels like "Unknown field".
  3. "impact" MUST describe the concrete analytical consequence (e.g. "Cannot calculate NPV without discount rate"), never "Impact not specified".
  4. "resolution" MUST be a specific, actionable coaching tip (e.g. "Add your annual spend figure to unlock cost-per-unit calculations"), never "Provide missing data".
  5. FORBIDDEN placeholder values: "Unknown field", "Impact not specified", "Provide missing data", "Not available", "N/A". If you cannot write a specific entry, omit it entirely.
  6. Tone: helpful coaching, not punitive. Frame as "Add [specific field] to unlock [specific benefit]" rather than "Missing: [field]". Do NOT start resolutions with "To strengthen this analysis" — the UI already provides that heading.
- Add an entry to gdpr_flags if any field you are about to write appears to contain
  unanonymised personal data (real names, email addresses, phone numbers, salary amounts).
  Set that field to null and explain in gdpr_flags instead.
- recommendations RULES (strict):
  1. Every entry MUST be a JSON object: { "priority": "...", "action": "...", "financial_impact": "..." | null, "next_scenario": "S##" | null }. Never emit plain strings.
  2. priority MUST be one of: CRITICAL, HIGH, MEDIUM, LOW. Calibrate honestly — do not default everything to MEDIUM.
     - CRITICAL = must act this week; failure causes contract loss, compliance breach, supply outage, or >10% margin hit.
     - HIGH = act within 30 days; material savings/risk-reduction (>5% spend impact) or hard deadline within the quarter.
     - MEDIUM = act this quarter; meaningful improvement but no immediate cliff.
     - LOW = nice-to-have, opportunistic, or dependent on other actions completing first.
  3. Aim for a realistic mix. A 4-item list should typically span at least two priority levels; flagging every item MEDIUM is a calibration failure.
  4. action MUST be a specific imperative ("Issue RFP to 3 shortlisted vendors by 15 May"), not a generic theme.
  5. financial_impact MUST be a quantified delta when the user provided spend/budget data ("~€120k annual saving" or "Avoids €40k late-payment penalty"); use null only when no numeric basis exists.

DASHBOARD-SUPPORTING FIELD RULES:
- For S4 (Savings Calculation): you MUST populate both savings_breakdown and
  savings_classification. Classify every savings figure into exactly one of hard, soft,
  or avoided. Set baseline_verified=true only if a documented historical baseline was
  provided — never for estimates. If the user has not specified a category, default to
  soft and add a data_gaps[] entry requesting classification confirmation.
- For any Group A scenario: populate financial_model.working_capital ONLY when the user
  provides payment-terms data (DPO figures, NET terms, supplier payment schedules).
  Compute working_capital_delta_eur = annual_spend × (target_dpo - current_dpo) / 365.
  Flag late_payment_directive_risk=true for any supplier with payment_terms_days > 60
  (EU Late Payment Directive 2011/7 statutory B2B limit).
- For S20, S24, S25, S27: populate scenario_specific.concentration when supplier-to-
  category spend data is available. Compute HHI per category as sum of
  (supplier_spend_share_pct)^2. Interpret HHI:
    <1500 = LOW (competitive)
    1500-2500 = MODERATE
    2500-5000 = HIGH
    >5000 = EXTREME (monopolistic or near-sole-source)
  Set single_source_flag=true for any supplier holding >70% of a single category's
  spend. Use tokenised supplier_label references only — never legal entity names.
  Use ISO 3166-1 alpha-2 country codes.

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

  if (parsed.executive_bullets?.length > 0) {
    parts.push('### Key Findings');
    parsed.executive_bullets.forEach(b => {
      const text = coerceToString(b).trim();
      if (text && text !== '[object Object]') parts.push(`- ${text}`);
    });
    parts.push('');
  }

  if (parsed.recommendations?.length > 0) {
    parts.push('### Recommendations');
    let idx = 0;
    parsed.recommendations.forEach((r) => {
      const isObj = r && typeof r === 'object';
      const priority = (isObj && typeof (r as { priority?: unknown }).priority === 'string')
        ? (r as { priority: string }).priority
        : 'Medium';
      const actionRaw = isObj ? (r as { action?: unknown }).action : r;
      const action = (coerceToString(actionRaw).trim() || coerceToString(r).trim());
      if (!action || action === '[object Object]' || action === 'See details') return;
      const fi = isObj ? (r as { financial_impact?: unknown }).financial_impact : null;
      const impact = fi ? ` — ${coerceToString(fi)}` : '';
      idx += 1;
      parts.push(`${idx}. **[${priority}]** ${action}${impact}`);
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
      // Strip redundant prefix that duplicates the heading
      const cleaned = g.resolution.replace(/^To strengthen this analysis,?\s*/i, '');
      // Capitalise the first letter after stripping
      const resolution = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      parts.push(`- ${resolution}`);
    });
    parts.push('');
  }

  return parts.join('\n');
}
