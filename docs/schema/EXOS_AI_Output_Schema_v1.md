# EXOS AI Output Schema Architecture
## Version 1.0 — April 2026
**Internal Reference — Do Not Distribute Outside Development Team**
Cross-referenced to: Scenario Data Requirements v2 · Field Methodology v1 · INPUT_EVALUATOR_SPEC v1 · Security Posture Report (Feb 2026)

---

## 1. Design Principles

1. **Every AI response is JSON. No exceptions.** The Sentinel Pipeline must reject any non-JSON response and trigger the retry/fallback chain before surfacing an error to the user.
2. **The Universal Envelope wraps all 29 scenarios.** Group- and scenario-specific payloads live inside the `payload` field. This keeps the export layer's top-level parsing stable regardless of scenario.
3. **Confidence is a first-class field.** `confidence_level` and `low_confidence_watermark` drive UI treatment, export headers, and the DATA GAP banner — they must not live in prose.
4. **`null` is a valid value. Missing is not.** Every defined field must be present in the response. If data was not provided, the field is `null` with an entry in `data_gaps[]`. Absent fields break export parsers.
5. **Group-level schemas are the unit of AI instruction.** The Sentinel Pipeline passes the group schema as part of the system prompt. Scenario-specific fields are documented here for reference and for the export layer — the AI is not given per-scenario field lists, only the group schema.
6. **GDPR flags surface at the output layer.** The anonymisation pipeline runs upstream, but the AI is instructed to flag any output field that appears to contain unanonymised personal data, so the Edge Function can abort before writing to the DB.

---

## 2. Universal Envelope

Applies to every scenario. The `payload` field contains the group-specific schema.

```json
{
  "schema_version": "1.0",
  "scenario_id": "S1",
  "scenario_name": "TCO Analysis",
  "group": "A",
  "group_label": "Analytical Value",

  "confidence_level": "HIGH | MEDIUM | LOW",
  "low_confidence_watermark": false,
  "confidence_flags": [
    {
      "field": "npv",
      "reason": "WACC not provided. NPV calculation omitted.",
      "severity": "WARNING"
    }
  ],

  "summary": "2–3 sentence plain-language executive summary of the output.",
  "executive_bullets": [
    "Top finding 1",
    "Top finding 2",
    "Top finding 3"
  ],

  "data_gaps": [
    {
      "field": "wacc",
      "impact": "NPV cannot be calculated. Output is indicative only.",
      "resolution": "Provide WACC % (consult Finance Director or use industry benchmark of 8–10% for EU mid-market)."
    }
  ],

  "recommendations": [
    {
      "priority": "HIGH | MEDIUM | LOW",
      "action": "Actionable recommendation text.",
      "financial_impact": "Quantified or benchmarked impact where possible.",
      "next_scenario": "S3"
    }
  ],

  "gdpr_flags": [],

  "export_metadata": {
    "generated_at": "2026-04-03T12:00:00Z",
    "grounding_sources": ["Perplexity citation URL or description"],
    "model_used": "claude-sonnet-4-20250514",
    "langsmith_trace_id": "uuid-string-or-null"
  },

  "payload": {}
}
```

### 2.1 Confidence Level Rules

| `confidence_level` | Condition | UI Treatment |
|---|---|---|
| `HIGH` | All Minimum Required Inputs present + at least 1 Enhanced Input | No watermark. Full export enabled. |
| `MEDIUM` | All Minimum Required Inputs present, no Enhanced Inputs | Advisory tooltip in output. Watermark in PDF header only. |
| `LOW` | One or more Minimum Required Inputs absent (AI proceeded on partial data) | `low_confidence_watermark: true`. Banner in all export formats. Report locked from exec sharing until user acknowledges. |

---

## 3. Group A — Analytical Value (S1–S8)

**AI Instruction:** *"You are a deterministic financial calculation engine. Every numerical output must be derived from the user's inputs, not estimated. Where inputs are missing, return `null` for the affected field and add an entry to `confidence_flags`. Never invent financial figures."*

**Scenarios:** S1 TCO Analysis · S2 Cost Breakdown/Should-Cost · S3 CAPEX vs. OPEX · S4 Savings Calculation · S5 Spend Analysis · S6 Forecasting & Budgeting · S7 SaaS Optimisation · S8 Specification Optimisation

```json
{
  "payload": {

    "financial_model": {
      "currency": "EUR",
      "analysis_period_years": null,
      "cost_breakdown": [
        {
          "category": "Acquisition / CAPEX",
          "amount": null,
          "percentage_of_total": null,
          "notes": null,
          "confidence": "HIGH | MEDIUM | LOW"
        }
      ],
      "totals": {
        "total_cost": null,
        "npv": null,
        "npv_discount_rate_pct": null,
        "annualised_cost": null
      },
      "top_cost_drivers": [
        {
          "rank": 1,
          "category": null,
          "amount": null,
          "percentage_of_total": null,
          "insight": null
        }
      ],
      "benchmark_comparison": {
        "industry_benchmark": null,
        "user_value": null,
        "gap": null,
        "benchmark_source": null
      }
    },

    "scenario_specific": {}
  }
}
```

### 3.1 S1 — TCO Analysis `scenario_specific`

```json
{
  "scenario_specific": {
    "asset_description": null,
    "lifecycle_years": null,
    "vendor_options": [
      {
        "vendor_label": "Vendor A",
        "capex": null,
        "total_opex": null,
        "total_tco": null,
        "tco_delta_vs_cheapest_pct": null
      }
    ],
    "opex_categories": [
      {
        "category": "Maintenance",
        "annual_cost": null,
        "lifecycle_total": null
      }
    ],
    "hidden_cost_alert": null,
    "ifrs_note": null
  }
}
```

### 3.2 S2 — Cost Breakdown / Should-Cost `scenario_specific`

```json
{
  "scenario_specific": {
    "product_or_service": null,
    "supplier_geography": null,
    "cost_decomposition": [
      {
        "component": "Raw Materials",
        "estimated_pct": null,
        "benchmark_pct": null,
        "gap_pct": null
      }
    ],
    "estimated_supplier_margin_pct": null,
    "negotiation_anchor": {
      "current_price": null,
      "should_cost_target": null,
      "headroom_pct": null,
      "rationale": null
    },
    "high_risk_components": []
  }
}
```

### 3.3 S3 — CAPEX vs. OPEX Analysis `scenario_specific`
**Type 1H — WACC and tax rate are mandatory for this schema to produce valid NPV.**

```json
{
  "scenario_specific": {
    "asset_description": null,
    "financial_lifespan_years": null,
    "wacc_pct": null,
    "tax_rate_pct": null,
    "capex_option": {
      "purchase_price": null,
      "depreciation_method": "straight-line | declining-balance | null",
      "annual_depreciation": null,
      "tax_shield_value": null,
      "salvage_value": null,
      "total_cost_of_ownership": null,
      "npv": null
    },
    "opex_option": {
      "annual_lease_payment": null,
      "lease_term_years": null,
      "buyout_residual_pct": null,
      "total_lease_cost": null,
      "npv": null,
      "ifrs16_balance_sheet_impact": null
    },
    "verdict": {
      "preferred_option": "CAPEX | OPEX | NEUTRAL",
      "npv_delta": null,
      "break_even_year": null,
      "sensitivity_note": null
    }
  }
}
```

### 3.4 S4 — Savings Calculation `scenario_specific`

```json
{
  "scenario_specific": {
    "baseline_description": null,
    "baseline_price": null,
    "new_price": null,
    "annual_volume": null,
    "savings_breakdown": {
      "hard_savings": {
        "amount": null,
        "annualised": null,
        "finance_accepted": null,
        "notes": null
      },
      "soft_savings": {
        "amount": null,
        "annualised": null,
        "finance_accepted": null,
        "notes": null
      },
      "cost_avoidance": {
        "amount": null,
        "annualised": null,
        "finance_accepted": null,
        "notes": null
      }
    },
    "total_savings_annualised": null,
    "savings_as_pct_of_baseline": null,
    "baseline_confidence": "VERIFIED | ESTIMATED | BENCHMARKED",
    "finance_risk_flags": []
  }
}
```

### 3.5 S5 — Spend Analysis `scenario_specific`
**Type 2 — Primary input is CSV/Excel upload. Schema reflects classified tabular output.**

```json
{
  "scenario_specific": {
    "taxonomy_applied": "UNSPSC | eCl@ss | custom | null",
    "total_spend_analysed": null,
    "currency": "EUR",
    "line_item_count": null,
    "classified_line_items": [
      {
        "supplier_token": "Supplier_001",
        "amount": null,
        "date": null,
        "original_description": null,
        "assigned_category": null,
        "classification_confidence": "HIGH | MEDIUM | LOW",
        "human_review_required": false
      }
    ],
    "spend_by_category": [
      {
        "category": null,
        "total_spend": null,
        "pct_of_total": null,
        "supplier_count": null
      }
    ],
    "consolidation_opportunities": [
      {
        "category": null,
        "current_supplier_count": null,
        "recommended_supplier_count": null,
        "estimated_saving_pct": null,
        "rationale": null
      }
    ],
    "maverick_spend": {
      "amount": null,
      "pct_of_total": null,
      "top_maverick_categories": []
    },
    "tail_spend": {
      "amount": null,
      "pct_of_total": null,
      "note": null
    },
    "low_confidence_line_items": []
  }
}
```

### 3.6 S6 — Forecasting & Budgeting `scenario_specific`

```json
{
  "scenario_specific": {
    "planning_horizon_years": null,
    "historical_baseline_years": null,
    "scenarios": {
      "base": {
        "year_1": null,
        "year_2": null,
        "year_3": null,
        "assumptions": []
      },
      "upside": {
        "year_1": null,
        "year_2": null,
        "year_3": null,
        "assumptions": []
      },
      "downside": {
        "year_1": null,
        "year_2": null,
        "year_3": null,
        "assumptions": []
      }
    },
    "macro_adjustments": [
      {
        "factor": "CPI inflation",
        "rate_applied_pct": null,
        "impact_on_base": null
      }
    ],
    "budget_risk_flags": []
  }
}
```

### 3.7 S7 — SaaS Optimisation `scenario_specific`

```json
{
  "scenario_specific": {
    "portfolio_size": null,
    "total_annual_spend": null,
    "tools": [
      {
        "tool_name": null,
        "vendor": null,
        "annual_cost": null,
        "licences_contracted": null,
        "licences_active": null,
        "utilisation_pct": null,
        "renewal_date": null,
        "days_to_renewal": null,
        "action": "OPTIMISE | CONSOLIDATE | CANCEL | RENEGOTIATE | MAINTAIN",
        "estimated_saving": null,
        "risk_if_cancelled": null
      }
    ],
    "consolidation_candidates": [],
    "total_recoverable_spend": null,
    "critical_renewal_alerts": []
  }
}
```

### 3.8 S8 — Specification Optimisation `scenario_specific`

```json
{
  "scenario_specific": {
    "item_description": null,
    "current_specification": null,
    "alternatives": [
      {
        "parameter": null,
        "current_value": null,
        "proposed_value": null,
        "cost_impact_pct": null,
        "quality_risk": "HIGH | MEDIUM | LOW | NONE",
        "rationale": null
      }
    ],
    "estimated_unit_cost_reduction_pct": null,
    "standards_alignment": null,
    "engineering_sign_off_required": false
  }
}
```

---

## 4. Group B — Workflow & Convenience (S9–S15)

**AI Instruction:** *"You are a procurement document generation engine. Output structured, ready-to-use documents. Every section must be explicitly labelled. Never produce prose summaries where structured sections were requested. Mark any section where insufficient input was provided with `[DATA NEEDED: description]` rather than fabricating content."*

**Scenarios:** S9 RFP Generator · S10 SLA Definition · S11 Tail Spend Sourcing · S12 Contract Template · S13 Requirements Gathering (BRD) · S14 Supplier Performance Review · S15 Procurement Project Planning

```json
{
  "payload": {
    "document": {
      "title": null,
      "document_type": null,
      "jurisdiction": null,
      "version": "1.0",
      "sections": [
        {
          "section_id": "1",
          "section_title": null,
          "content": null,
          "data_needed": false,
          "data_needed_note": null
        }
      ]
    },
    "scenario_specific": {}
  }
}
```

### 4.1 S9 — RFP Generator `scenario_specific`

```json
{
  "scenario_specific": {
    "rfp_title": null,
    "submission_deadline": null,
    "evaluation_criteria": [
      { "criterion": null, "weight_pct": null }
    ],
    "mandatory_compliance_clauses": [],
    "scope_summary": null
  }
}
```

### 4.2 S10 — SLA Definition `scenario_specific`

```json
{
  "scenario_specific": {
    "service_description": null,
    "metrics": [
      {
        "metric": "Uptime",
        "target_pct": null,
        "measurement_period": null,
        "penalty_mechanism": null,
        "penalty_value": null
      }
    ],
    "escalation_tiers": [
      {
        "tier": 1,
        "trigger": null,
        "response_time": null,
        "escalation_contact": "Role-based reference only"
      }
    ],
    "review_frequency": null
  }
}
```

### 4.3 S11 — Tail Spend Sourcing `scenario_specific`

```json
{
  "scenario_specific": {
    "item_description": null,
    "quantity": null,
    "delivery_deadline": null,
    "sourcing_approach": "SPOT_BUY | CALL_OFF | FRAMEWORK | null",
    "recommended_supplier_types": [],
    "eu_sourcing_considerations": null
  }
}
```

### 4.4 S12 — Contract Template `scenario_specific`

```json
{
  "scenario_specific": {
    "agreement_type": null,
    "governing_law": null,
    "key_commercial_terms": {
      "payment_terms_days": null,
      "liability_cap": null,
      "termination_notice_days": null
    },
    "gdpr_dpa_required": false,
    "high_risk_clauses_flagged": []
  }
}
```

### 4.5 S13 — Requirements Gathering / BRD `scenario_specific`

```json
{
  "scenario_specific": {
    "project_goal": null,
    "requirements": [
      {
        "id": "REQ-001",
        "type": "FUNCTIONAL | NON_FUNCTIONAL | COMPLIANCE",
        "description": null,
        "priority": "MUST | SHOULD | COULD",
        "acceptance_criteria": null
      }
    ],
    "constraints": [],
    "assumptions": [],
    "out_of_scope": []
  }
}
```

### 4.6 S14 — Supplier Performance Review `scenario_specific`
**Type 1H — KPI percentages are mandatory. Without them, scorecard cannot be computed.**

```json
{
  "scenario_specific": {
    "supplier_label": "Supplier A",
    "review_period": null,
    "scorecard": [
      {
        "kpi": "On-Time Delivery (OTD)",
        "target_pct": null,
        "actual_pct": null,
        "variance_pct": null,
        "rag_status": "RED | AMBER | GREEN",
        "trend": "IMPROVING | STABLE | DECLINING"
      }
    ],
    "overall_score": null,
    "overall_rag": "RED | AMBER | GREEN",
    "performance_narrative": null,
    "corrective_actions": [
      {
        "issue": null,
        "action": null,
        "owner": "Role-based reference",
        "deadline": null
      }
    ]
  }
}
```

### 4.7 S15 — Procurement Project Planning `scenario_specific`

```json
{
  "scenario_specific": {
    "project_name": null,
    "total_duration_weeks": null,
    "phases": [
      {
        "phase": "Phase 1 — Requirements",
        "start_week": null,
        "duration_weeks": null,
        "milestones": [],
        "owners": ["Role-based reference"],
        "dependencies": []
      }
    ],
    "critical_path_items": [],
    "risk_flags": []
  }
}
```

---

## 5. Group C — Reliability & Compliance (S16–S20)

**AI Instruction:** *"You are a procurement risk and compliance auditor. Every identified issue must be explicitly referenced to the relevant regulatory standard or contractual clause. Never omit a risk because it is uncomfortable. Use RAG (Red/Amber/Green) status consistently. Mark sections where the input document was incomplete with `[INCOMPLETE INPUT — PARTIAL REVIEW ONLY]`."*

**Scenarios:** S16 SOW Critic · S17 Risk Assessment · S18 Risk Matrix · S19 Software Licensing Audit · S20 Category Risk Evaluation

```json
{
  "payload": {
    "risk_summary": {
      "total_risks_identified": null,
      "critical_count": null,
      "high_count": null,
      "medium_count": null,
      "low_count": null,
      "overall_rag": "RED | AMBER | GREEN"
    },
    "scenario_specific": {}
  }
}
```

### 5.1 S16 — SOW Critic `scenario_specific`
**Type 2 — Primary input is PDF/DOCX upload. Partial document noted in `input_completeness`.**

```json
{
  "scenario_specific": {
    "document_title": null,
    "engagement_type": null,
    "input_completeness": "FULL | PARTIAL | EXCERPT",
    "partial_review_disclaimer": null,
    "issues": [
      {
        "issue_id": "SOW-001",
        "severity": "CRITICAL | HIGH | MEDIUM | LOW",
        "clause_reference": null,
        "issue_description": null,
        "risk": null,
        "recommended_fix": null
      }
    ],
    "missing_clauses": [
      {
        "clause_type": "Acceptance Criteria",
        "risk_if_absent": null,
        "recommended_text": null
      }
    ],
    "ambiguous_language": [
      {
        "excerpt": null,
        "ambiguity_type": null,
        "recommendation": null
      }
    ],
    "overall_sow_rating": "COMPLIANT | NEEDS_REVISION | REJECT_AND_REDRAFT"
  }
}
```

### 5.2 S17 — Risk Assessment `scenario_specific`

```json
{
  "scenario_specific": {
    "risk_register": [
      {
        "risk_id": "RISK-001",
        "risk_description": null,
        "category": "Supply | Financial | Compliance | Operational | Reputational",
        "likelihood": "HIGH | MEDIUM | LOW",
        "impact": "HIGH | MEDIUM | LOW",
        "rag_status": "RED | AMBER | GREEN",
        "regulatory_reference": null,
        "mitigation": null,
        "owner": "Role-based reference",
        "residual_risk": "HIGH | MEDIUM | LOW"
      }
    ],
    "top_3_risks": [],
    "immediate_actions": []
  }
}
```

### 5.3 S18 — Risk Matrix `scenario_specific`
**Type 1 — Probability/impact ratings per risk are mandatory.**

```json
{
  "scenario_specific": {
    "matrix": {
      "axes": {
        "x_axis": "Likelihood",
        "y_axis": "Impact",
        "scale": "HIGH | MEDIUM | LOW"
      },
      "cells": {
        "HIGH_HIGH": [],
        "HIGH_MEDIUM": [],
        "HIGH_LOW": [],
        "MEDIUM_HIGH": [],
        "MEDIUM_MEDIUM": [],
        "MEDIUM_LOW": [],
        "LOW_HIGH": [],
        "LOW_MEDIUM": [],
        "LOW_LOW": []
      }
    },
    "risk_items": [
      {
        "risk_id": "R1",
        "label": null,
        "likelihood": "HIGH | MEDIUM | LOW",
        "impact": "HIGH | MEDIUM | LOW",
        "matrix_cell": "HIGH_HIGH",
        "rag_status": "RED | AMBER | GREEN"
      }
    ],
    "heat_map_narrative": null
  }
}
```

### 5.4 S19 — Software Licensing Audit `scenario_specific`
**Type 2 — Primary input is PDF/DOCX licence agreement.**

```json
{
  "scenario_specific": {
    "vendor": null,
    "product": null,
    "licence_metric": null,
    "input_completeness": "FULL | PARTIAL",
    "entitlements": [
      {
        "metric_type": null,
        "contracted_quantity": null,
        "deployed_quantity": null,
        "variance": null,
        "compliance_status": "COMPLIANT | OVER_DEPLOYED | UNDER_UTILISED"
      }
    ],
    "financial_exposure": {
      "true_up_risk": null,
      "optimisation_opportunity": null
    },
    "key_dates": {
      "renewal_date": null,
      "notice_deadline": null,
      "days_to_action": null
    },
    "compliance_gaps": [],
    "metric_mismatch_alert": null
  }
}
```

### 5.5 S20 — Category Risk Evaluation `scenario_specific`

```json
{
  "scenario_specific": {
    "category": null,
    "supply_market_structure": "COMPETITIVE | OLIGOPOLY | MONOPOLY | SPECIALIST",
    "geographic_risk": null,
    "supplier_dependency": {
      "primary_supplier_spend_pct": null,
      "single_source_risk": false
    },
    "risk_dimensions": [
      {
        "dimension": "Supply Continuity",
        "rag_status": "RED | AMBER | GREEN",
        "key_driver": null,
        "mitigation": null
      }
    ],
    "strategic_classification": "STRATEGIC | LEVERAGE | BOTTLENECK | NON_CRITICAL",
    "recommended_actions": []
  }
}
```

---

## 6. Group D — Strategic Mentorship (S21–S27)

**AI Instruction:** *"You are a senior procurement strategist applying academic frameworks (BATNA, Kraljic, Porter's Five Forces, TCO, Make vs. Buy) to real commercial situations. Every framework output must reference the user's specific inputs — never produce generic textbook descriptions. Quantify financial impact wherever possible. Flag inside information risks (MAR) when strategy documents contain unannounced business plans."*

**Scenarios:** S21 Negotiation Preparation · S22 Category Strategy · S23 Make vs. Buy · S24 Volume Consolidation · S25 Supplier Relationship Management · S26 Total Value Delivery · S27 Procurement Maturity Assessment

```json
{
  "payload": {
    "framework_applied": null,
    "strategic_verdict": null,
    "scenario_specific": {}
  }
}
```

### 6.1 S21 — Negotiation Preparation `scenario_specific`

```json
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
```

### 6.2 S22 — Category Strategy `scenario_specific`

```json
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
      {
        "year": 1,
        "objectives": [],
        "kpis": []
      }
    ],
    "esg_considerations": null,
    "mar_flag": false
  }
}
```

### 6.3 S23 — Make vs. Buy Analysis `scenario_specific`
**Type 1H — Bilateral cost separation is mandatory. Without separate make-cost and buy-cost, comparison is impossible.**

```json
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
      {
        "factor": "Core competency alignment",
        "make_score": null,
        "buy_score": null,
        "weight_pct": null
      }
    ],
    "verdict": {
      "recommendation": "MAKE | BUY | HYBRID | FURTHER_ANALYSIS_NEEDED",
      "financial_rationale": null,
      "strategic_rationale": null,
      "risk_caveat": null
    }
  }
}
```

### 6.4 S24 — Volume Consolidation `scenario_specific`

```json
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
    "volume_leverage_analysis": null
  }
}
```

### 6.5 S25 — Supplier Relationship Management `scenario_specific`

```json
{
  "scenario_specific": {
    "supplier_label": "Supplier A",
    "relationship_tier": "STRATEGIC_PARTNER | PREFERRED | APPROVED | TRANSACTIONAL",
    "current_state_assessment": null,
    "development_plan": [
      {
        "objective": null,
        "actions": [],
        "timeline": null,
        "owner": "Role-based reference"
      }
    ],
    "joint_value_opportunities": [],
    "risk_to_relationship": null
  }
}
```

### 6.6 S26 — Total Value Delivery `scenario_specific`

```json
{
  "scenario_specific": {
    "value_dimensions": [
      {
        "dimension": "Cost",
        "current_score": null,
        "target_score": null,
        "gap": null,
        "initiatives": []
      }
    ],
    "total_value_score": null,
    "value_leakage_identified": null,
    "priority_initiatives": []
  }
}
```

### 6.7 S27 — Procurement Maturity Assessment `scenario_specific`

```json
{
  "scenario_specific": {
    "maturity_model": "CIPS | custom",
    "dimensions": [
      {
        "dimension": "Strategy",
        "current_level": null,
        "target_level": null,
        "gap": null,
        "actions": []
      }
    ],
    "overall_maturity_level": null,
    "benchmark_vs_sector": null,
    "roadmap_to_next_level": []
  }
}
```

---

## 7. Group E — Real-Time Knowledge (S28–S29)

**AI Instruction:** *"You are a market intelligence analyst powered by real-time web search. Every factual claim must be grounded in a cited source. Never state market data without a citation. Use `null` for any field where live search returned no reliable result — do not substitute with training knowledge for market figures. Flag source recency for all citations."*

**Scenarios:** S28 Market Intelligence · S29 Pre-Flight Supplier Audit

```json
{
  "payload": {
    "query_interpreted": null,
    "search_timestamp": null,
    "sources_consulted": [
      {
        "source_id": "SRC-001",
        "title": null,
        "url": null,
        "published_date": null,
        "recency_flag": "CURRENT | RECENT | DATED"
      }
    ],
    "scenario_specific": {}
  }
}
```

### 7.1 S28 — Market Intelligence `scenario_specific`

```json
{
  "scenario_specific": {
    "market_scope": null,
    "intelligence_blocks": [
      {
        "theme": "Price Trends",
        "finding": null,
        "source_ids": ["SRC-001"],
        "confidence": "HIGH | MEDIUM | LOW",
        "procurement_implication": null
      }
    ],
    "key_market_signals": [],
    "recommended_actions": [],
    "knowledge_gaps": []
  }
}
```

### 7.2 S29 — Pre-Flight Supplier Audit `scenario_specific`
**Type 1H — Formal legal entity name is mandatory. Brand name produces wrong entity intelligence.**

```json
{
  "scenario_specific": {
    "entity_name_queried": null,
    "entity_verified": false,
    "entity_verification_note": null,
    "audit_dimensions": {
      "financial_health": {
        "summary": null,
        "signals": [],
        "rag_status": "RED | AMBER | GREEN",
        "source_ids": []
      },
      "operational_capacity": {
        "summary": null,
        "signals": [],
        "rag_status": "RED | AMBER | GREEN",
        "source_ids": []
      },
      "compliance_and_legal": {
        "summary": null,
        "signals": [],
        "rag_status": "RED | AMBER | GREEN",
        "source_ids": []
      },
      "esg_and_reputation": {
        "summary": null,
        "signals": [],
        "rag_status": "RED | AMBER | GREEN",
        "source_ids": []
      },
      "market_position": {
        "summary": null,
        "signals": [],
        "rag_status": "RED | AMBER | GREEN",
        "source_ids": []
      }
    },
    "overall_supplier_rag": "RED | AMBER | GREEN",
    "proceed_recommendation": "PROCEED | PROCEED_WITH_CAUTION | FURTHER_DUE_DILIGENCE | DO_NOT_PROCEED",
    "red_flags": [],
    "data_limitations": []
  }
}
```

---

## 8. AI Prompt Contract

### 8.1 System Prompt Fragment — Include in Every Sentinel Analysis Call

Add the following to the end of every scenario's system prompt block in `sentinel-analysis/index.ts`:

```
CRITICAL OUTPUT INSTRUCTION:
Your response MUST be a single valid JSON object. No prose before or after it.
Do not use markdown code fences (no ```json). Return only the raw JSON.

You MUST use the following schema structure:
- Universal envelope fields: schema_version, scenario_id, scenario_name, group, group_label,
  confidence_level, low_confidence_watermark, confidence_flags, summary, executive_bullets,
  data_gaps, recommendations, gdpr_flags, export_metadata, payload.
- payload must contain the group-specific structure defined below.
- Every defined field must be present. Use null for missing values — never omit a field.
- Set low_confidence_watermark to true if confidence_level is LOW.
- Add an entry to data_gaps for every null field that is null due to missing user input.
- Add an entry to gdpr_flags if any field you are about to write appears to contain
  unanonymised personal data (real names, email addresses, phone numbers, salary amounts).
  Set that field to null and explain in gdpr_flags instead.

[GROUP SCHEMA INSERTED HERE BY EDGE FUNCTION]
```

### 8.2 Edge Function Schema Injection

In `sentinel-analysis/index.ts`, select the correct group schema based on `scenarioGroup` and inject it into the system prompt:

```typescript
const GROUP_SCHEMAS: Record<string, string> = {
  A: `/* paste Group A schema string */`,
  B: `/* paste Group B schema string */`,
  C: `/* paste Group C schema string */`,
  D: `/* paste Group D schema string */`,
  E: `/* paste Group E schema string */`,
};

const groupSchema = GROUP_SCHEMAS[scenario.group];
const systemPrompt = buildSystemPrompt(scenario) + AI_PROMPT_CONTRACT + groupSchema;
```

### 8.3 Defensive Parsing in Edge Function

```typescript
function parseAIResponse(raw: string): ExosOutput | null {
  // Attempt 1: direct JSON parse
  try {
    return JSON.parse(raw);
  } catch (_) {}

  // Attempt 2: extract JSON block if AI added prose or code fences despite instructions
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  // Attempt 3: log to LangSmith and return null (triggers retry chain)
  console.error('[EXOS] AI response failed JSON parsing — triggering retry');
  return null;
}
```

---

## 9. Export Format Binding

How Universal Envelope fields map to each export format. The export layer reads from JSON only — never from AI prose.

| JSON Field | Excel | PDF | Jira |
|---|---|---|---|
| `confidence_level` | Column header suffix: ` [MEDIUM CONFIDENCE]` | Header badge | `[CONFIDENCE: MEDIUM]` label in ticket |
| `low_confidence_watermark` | Watermark text in row 1: `LOW CONFIDENCE — KEY DATA MISSING` | Diagonal watermark on every page | `⚠ LOW CONFIDENCE` at top of Jira description |
| `summary` | Sheet tab "Executive Summary", cell A1 | First section | Jira ticket description field |
| `executive_bullets` | Bulleted list below summary | Highlighted call-out box | Jira description bullets |
| `data_gaps[].field` | "Data Gaps" sheet, column A | Data Gap banner sidebar | `[DATA GAP]` label in Jira |
| `data_gaps[].resolution` | "Data Gaps" sheet, column B | Data Gap banner body | Jira comment on data gap label |
| `recommendations[]` | "Recommendations" sheet | Recommendations section | Jira sub-tasks (one per recommendation) |
| `financial_model.cost_breakdown` | "Cost Breakdown" sheet, tabular | Cost waterfall chart | Jira table in description |
| `sources_consulted` (Group E) | "Sources" sheet | Footnotes | Jira links block |
| `gdpr_flags` | Admin log only — never exported | Admin log only — never exported | Admin log only — never in Jira |
| `export_metadata` | Hidden sheet "_meta" | Footer (generated_at only) | Jira description footer |

---

## 10. TypeScript Type Definitions (Reference)

Add to `src/lib/sentinel/types.ts`:

```typescript
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type RAGStatus = 'RED' | 'AMBER' | 'GREEN';

export interface ConfidenceFlag {
  field: string;
  reason: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

export interface DataGap {
  field: string;
  impact: string;
  resolution: string;
}

export interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  financial_impact: string | null;
  next_scenario: string | null;
}

export interface ExportMetadata {
  generated_at: string;
  grounding_sources: string[];
  model_used: string;
  langsmith_trace_id: string | null;
}

export interface ExosOutput {
  schema_version: string;
  scenario_id: string;
  scenario_name: string;
  group: 'A' | 'B' | 'C' | 'D' | 'E';
  group_label: string;
  confidence_level: ConfidenceLevel;
  low_confidence_watermark: boolean;
  confidence_flags: ConfidenceFlag[];
  summary: string;
  executive_bullets: string[];
  data_gaps: DataGap[];
  recommendations: Recommendation[];
  gdpr_flags: string[];
  export_metadata: ExportMetadata;
  payload: Record<string, unknown>; // typed per group via generics
}
```

---

## 11. Implementation Checklist

| # | Task | Owner | Priority | Linear Ticket |
|---|---|---|---|---|
| 1 | Add Universal Envelope to `sentinel/types.ts` | Tech Lead | P0 | `[ARCH-01]` |
| 2 | Add AI Prompt Contract fragment to `sentinel-analysis/index.ts` | Head of AI | P0 | `[ARCH-02]` |
| 3 | Implement group schema injection per scenario in Edge Function | Architect | P0 | `[ARCH-03]` |
| 4 | Implement defensive JSON parsing with retry trigger | Architect | P0 | `[ARCH-04]` |
| 5 | Refactor `report-export-excel.ts` to read from JSON fields (not prose) | Tech Lead | P0 | `[ARCH-05]` |
| 6 | Refactor `report-export-jira.ts` to read from JSON fields | Tech Lead | P0 | `[ARCH-06]` |
| 7 | Add `low_confidence_watermark` rendering to PDF export | Tech Lead | P1 | `[ARCH-07]` |
| 8 | Add `gdpr_flags` interception in Edge Function (abort if non-empty) | Auditor | P0 | `[ARCH-08]` |
| 9 | Add schema version validation on DB write (reject schema_version mismatch) | Architect | P1 | `[ARCH-09]` |
| 10 | LangSmith trace: log `confidence_level` and `data_gaps.length` as span metadata | Head of AI | P1 | `[ARCH-10]` |

---

*EXOS — Procurement Exoskeleton · AI Output Schema Architecture v1.0 · April 2026*
*Internal Reference — Do Not Distribute Outside Development Team*
*Next Review: When Scenario count changes or new export format is added*
