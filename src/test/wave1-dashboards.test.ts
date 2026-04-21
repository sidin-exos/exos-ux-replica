import { describe, it, expect } from "vitest";
import {
  extractShouldCostGap,
  extractSavingsRealizationFunnel,
  deriveCfoAcceptance,
} from "@/lib/dashboard-data-parser";
import { getDashboardScenarios } from "@/lib/dashboard-scenario-mapping";
import type { ExosOutput, SavingsClassification } from "@/lib/sentinel/types";

// ────────────────────────────────────────────────────────────────────────────
// should-cost-gap
// ────────────────────────────────────────────────────────────────────────────

describe("should-cost-gap parser", () => {
  const baseFinancial = { currency: "USD", benchmark_comparison: { industry_margin_pct: 12 } };

  it("(1) returns null when scenario_specific is missing", () => {
    expect(
      extractShouldCostGap({ financial_model: baseFinancial }, undefined as any)
    ).toBeNull();
    expect(extractShouldCostGap({ financial_model: baseFinancial }, {})).toBeNull();
  });

  it("(2) returns null when cost_decomposition is empty", () => {
    expect(
      extractShouldCostGap({ financial_model: baseFinancial }, { cost_decomposition: [] })
    ).toBeNull();
  });

  it("(3) maps a 3-component input with mixed null values", () => {
    const ss = {
      cost_decomposition: [
        { component: "Materials", estimated_pct: 40, benchmark_pct: 36, gap_pct: 4, confidence: "HIGH" },
        { component: "Labor", estimated_pct: 25, benchmark_pct: null, gap_pct: null, confidence: "MEDIUM" },
        { component: "Margin", estimated_pct: 15, benchmark_pct: 10, gap_pct: 5, confidence: "LOW" },
      ],
      negotiation_anchor: {
        current_price: 1_000_000,
        should_cost_target: 900_000,
        headroom_pct: 10,
        rationale: "Margin gap drives 5pp headroom.",
      },
      estimated_supplier_margin_pct: 15,
    };
    const result = extractShouldCostGap({ financial_model: baseFinancial }, ss);
    expect(result).not.toBeNull();
    expect(result!.components).toHaveLength(3);
    expect(result!.components[1].benchmarkPct).toBeNull();
    expect(result!.components[1].gapPct).toBeNull();
    expect(result!.negotiationAnchor.headroomPct).toBe(10);
    expect(result!.supplierMarginPct).toBe(15);
    expect(result!.benchmarkMarginPct).toBe(12);
    expect(result!.currency).toBe("USD");
  });

  it("(4) preserves headroom sign — positive gap = above benchmark, negative = below", () => {
    const ss = {
      cost_decomposition: [
        { component: "Above", estimated_pct: 40, benchmark_pct: 30, gap_pct: 10, confidence: "HIGH" },
        { component: "Below", estimated_pct: 20, benchmark_pct: 25, gap_pct: -5, confidence: "MEDIUM" },
      ],
    };
    const result = extractShouldCostGap({ financial_model: baseFinancial }, ss)!;
    expect(result.components[0].gapPct).toBeGreaterThan(0);
    expect(result.components[1].gapPct).toBeLessThan(0);
  });

  it("(5) getDashboardScenarios('should-cost-gap') returns the three wired scenarios", () => {
    const scenarios = getDashboardScenarios("should-cost-gap");
    expect(scenarios).toEqual(
      expect.arrayContaining(["cost-breakdown", "negotiation-preparation", "savings-calculation"])
    );
    expect(scenarios).toHaveLength(3);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// savings-realization-funnel
// ────────────────────────────────────────────────────────────────────────────

describe("savings-realization-funnel parser", () => {
  const payload = { financial_model: { currency: "EUR" } };

  it("(6) returns null when savings_classification is null", () => {
    expect(
      extractSavingsRealizationFunnel(payload, { savings_classification: null }, false)
    ).toBeNull();
  });

  it("(7) returns null when funnel values are all null", () => {
    const sc: SavingsClassification = {
      baseline_verified: true,
      hard: { baseline_value: 100, new_value: 80, annual_volume: 10, annualised_savings: 200, pnl_impact: 200 },
      soft: null,
      avoided: null,
      funnel: { identified: null, committed: null, realized: null },
    };
    expect(
      extractSavingsRealizationFunnel(payload, { savings_classification: sc }, false)
    ).toBeNull();
  });

  it("(8) handles Hard-only population (Soft and Avoided null)", () => {
    const sc: SavingsClassification = {
      baseline_verified: true,
      hard: { baseline_value: 1_000_000, new_value: 800_000, annual_volume: 100, annualised_savings: 200_000, pnl_impact: 200_000 },
      soft: null,
      avoided: null,
      funnel: { identified: 200_000, committed: 150_000, realized: 120_000 },
    };
    const result = extractSavingsRealizationFunnel(payload, { savings_classification: sc }, false)!;
    expect(result).not.toBeNull();
    // All non-baseline stages must attribute fully to Hard.
    for (const stage of result.funnel.filter((s) => s.stage !== "Baseline")) {
      expect(stage.soft).toBe(0);
      expect(stage.avoided).toBe(0);
      expect(stage.hard).toBeGreaterThan(0);
    }
    expect(result.cfoAcceptance).toBe("GREEN");
  });

  it("(9) CFO indicator is GREEN only when baseline_verified AND hard present", () => {
    expect(deriveCfoAcceptance(true, true)).toBe("GREEN");
    expect(deriveCfoAcceptance(true, false)).toBe("AMBER");
    expect(deriveCfoAcceptance(false, true)).toBe("RED");
  });

  it("(10) CFO indicator is RED when baseline_verified=false regardless of class distribution", () => {
    expect(deriveCfoAcceptance(false, true)).toBe("RED");
    expect(deriveCfoAcceptance(false, false)).toBe("RED");
  });

  it("(11) getDashboardScenarios('savings-realization-funnel') returns the three wired scenarios", () => {
    const scenarios = getDashboardScenarios("savings-realization-funnel");
    expect(scenarios).toEqual(
      expect.arrayContaining(["savings-calculation", "category-strategy", "volume-consolidation"])
    );
    expect(scenarios).toHaveLength(3);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Schema (compile-time) sanity — populated and null both compile
// ────────────────────────────────────────────────────────────────────────────

describe("S4 envelope schema compatibility", () => {
  it("(12) populated savings_classification compiles into ExosOutput.payload", () => {
    const populated: SavingsClassification = {
      baseline_verified: true,
      hard: { baseline_value: 1_000_000, new_value: 900_000, annual_volume: 50, annualised_savings: 100_000, pnl_impact: 100_000 },
      soft: { baseline_value: 200_000, new_value: 180_000, annualised_avoidance: 20_000, justification: "Scope reduction" },
      avoided: { inflation_index_applied: "CPI-EU", inflation_rate_pct: 4.5, baseline_adjusted_value: 1_045_000, protected_value: 45_000 },
      funnel: { identified: 165_000, committed: 130_000, realized: 110_000 },
    };
    const env: ExosOutput = {
      schema_version: "1.0",
      scenario_id: "savings-calculation",
      scenario_name: "Savings Calculation",
      group: "A",
      group_label: "Analytical Value",
      confidence_level: "HIGH",
      low_confidence_watermark: false,
      confidence_flags: [],
      summary: "",
      executive_bullets: [],
      data_gaps: [],
      recommendations: [],
      gdpr_flags: [],
      export_metadata: {
        generated_at: new Date().toISOString(),
        grounding_sources: [],
        model_used: "test",
        langsmith_trace_id: null,
      },
      payload: { scenario_specific: { savings_classification: populated } },
    };
    expect(env.payload).toBeDefined();
  });

  it("(13) savings_classification=null also compiles (backwards compatibility)", () => {
    const env: ExosOutput = {
      schema_version: "1.0",
      scenario_id: "savings-calculation",
      scenario_name: "Savings Calculation",
      group: "A",
      group_label: "Analytical Value",
      confidence_level: "HIGH",
      low_confidence_watermark: false,
      confidence_flags: [],
      summary: "",
      executive_bullets: [],
      data_gaps: [],
      recommendations: [],
      gdpr_flags: [],
      export_metadata: {
        generated_at: new Date().toISOString(),
        grounding_sources: [],
        model_used: "test",
        langsmith_trace_id: null,
      },
      payload: { scenario_specific: { savings_classification: null } },
    };
    expect(env.payload).toBeDefined();
  });
});
