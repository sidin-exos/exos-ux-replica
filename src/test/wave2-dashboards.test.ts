import { describe, it, expect } from "vitest";
import {
  extractWorkingCapitalDpo,
  extractSupplierConcentrationMap,
} from "@/lib/dashboard-data-parser";
import { interpretHhi } from "@/lib/sentinel/types";
import { getDashboardScenarios } from "@/lib/dashboard-scenario-mapping";
import { dashboardConfigs } from "@/lib/dashboard-mappings";
import type { ConcentrationData, WorkingCapitalData } from "@/lib/sentinel/types";

// ────────────────────────────────────────────────────────────────────────────
// working-capital-dpo
// ────────────────────────────────────────────────────────────────────────────

describe("working-capital-dpo parser", () => {
  it("(1) returns null when financial_model.working_capital is null", () => {
    expect(extractWorkingCapitalDpo({ financial_model: { working_capital: null } })).toBeNull();
    expect(extractWorkingCapitalDpo({ financial_model: {} })).toBeNull();
    expect(extractWorkingCapitalDpo({})).toBeNull();
  });

  it("(2) computes weighted DPO client-side when by_supplier[] populated but DPO fields null", () => {
    const result = extractWorkingCapitalDpo({
      financial_model: {
        currency: "EUR",
        working_capital: {
          current_weighted_dpo: null,
          target_weighted_dpo: null,
          by_supplier: [
            { supplier_label: "S1", payment_terms_days: 30, annual_spend: 1_000_000 },
            { supplier_label: "S2", payment_terms_days: 60, annual_spend: 1_000_000 },
          ],
          terms_distribution: [],
        },
      },
    });
    // Weighted DPO = (30*1M + 60*1M) / 2M = 45
    expect(result).not.toBeNull();
    expect(result!.current_weighted_dpo).toBe(45);
  });

  it("(3) flags late_payment_directive_risk for suppliers with terms > 60 days", () => {
    const result = extractWorkingCapitalDpo({
      financial_model: {
        working_capital: {
          by_supplier: [
            { supplier_label: "OK", payment_terms_days: 45, annual_spend: 100_000 },
            { supplier_label: "RISK", payment_terms_days: 90, annual_spend: 100_000 },
          ],
          terms_distribution: [],
        },
      },
    })!;
    expect(result.by_supplier.find((s) => s.supplier_label === "OK")!.late_payment_directive_risk).toBe(false);
    expect(result.by_supplier.find((s) => s.supplier_label === "RISK")!.late_payment_directive_risk).toBe(true);
  });

  it("(4) verifies WC delta formula: 10M × (45-30)/365 ≈ 410,959 EUR", () => {
    const result = extractWorkingCapitalDpo({
      financial_model: {
        working_capital: {
          current_weighted_dpo: 30,
          target_weighted_dpo: 45,
          annual_spend_eur: 10_000_000,
          by_supplier: [],
          terms_distribution: [],
        },
      },
    })!;
    expect(result.working_capital_delta_eur).toBeCloseTo(410_958.9, 0);
  });

  it("(5) getDashboardScenarios('working-capital-dpo') returns the four wired scenarios", () => {
    const scenarios = getDashboardScenarios("working-capital-dpo");
    expect(scenarios).toEqual(
      expect.arrayContaining([
        "savings-calculation",
        "spend-analysis-categorization",
        "category-strategy",
        "forecasting-budgeting",
      ])
    );
  });

  it("(6) dashboard config has showSampleDataFallback=false", () => {
    expect(dashboardConfigs["working-capital-dpo"].showSampleDataFallback).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// supplier-concentration-map
// ────────────────────────────────────────────────────────────────────────────

describe("supplier-concentration-map parser", () => {
  const baseSuppliers = [
    { supplier_label: "SUP-A", total_spend: 500_000, category_count: 1 },
    { supplier_label: "SUP-B", total_spend: 300_000, category_count: 1 },
  ];
  const baseCategories = [
    { category_id: "CAT-1", category_name: "IT Services", hhi: 3000, annual_spend: 800_000 },
  ];

  it("(7) returns null when concentration is null or flows[] is empty", () => {
    expect(extractSupplierConcentrationMap({}, { concentration: null })).toBeNull();
    expect(
      extractSupplierConcentrationMap(
        {},
        { concentration: { flows: [], categories: baseCategories, suppliers: baseSuppliers } }
      )
    ).toBeNull();
  });

  it("(8) HHI interpretation maps boundary thresholds correctly", () => {
    expect(interpretHhi(1499)).toBe("LOW");
    expect(interpretHhi(1500)).toBe("MODERATE");
    expect(interpretHhi(2499)).toBe("MODERATE");
    expect(interpretHhi(2500)).toBe("HIGH");
    expect(interpretHhi(5000)).toBe("HIGH");
    expect(interpretHhi(5001)).toBe("EXTREME");
    expect(interpretHhi(null)).toBeNull();
  });

  it("(9) preserves single_source_flag on flows", () => {
    const result = extractSupplierConcentrationMap(
      {},
      {
        concentration: {
          categories: baseCategories,
          suppliers: baseSuppliers,
          flows: [
            { source: "CAT-1", target: "SUP-A", value: 500_000, tier: 1, single_source_flag: true },
            { source: "CAT-1", target: "SUP-B", value: 300_000, tier: 1, single_source_flag: false },
          ],
        },
      }
    )!;
    expect(result.flows[0].single_source_flag).toBe(true);
    expect(result.flows[1].single_source_flag).toBe(false);
  });

  it("(10) getDashboardScenarios('supplier-concentration-map') returns the four wired scenarios", () => {
    const scenarios = getDashboardScenarios("supplier-concentration-map");
    expect(scenarios).toEqual(
      expect.arrayContaining([
        "category-risk-evaluator",
        "volume-consolidation",
        "supplier-dependency-planner",
        "black-swan-scenario",
      ])
    );
  });

  it("(11) skips flows with unresolved source or target", () => {
    const result = extractSupplierConcentrationMap(
      {},
      {
        concentration: {
          categories: baseCategories,
          suppliers: baseSuppliers,
          flows: [
            { source: "CAT-1", target: "SUP-A", value: 500_000, tier: 1, single_source_flag: false },
            { source: "CAT-UNKNOWN", target: "SUP-A", value: 100_000, tier: 1, single_source_flag: false },
            { source: "CAT-1", target: "GHOST-SUP", value: 100_000, tier: 1, single_source_flag: false },
          ],
        },
      }
    )!;
    expect(result.flows).toHaveLength(1);
    expect(result.flows[0].source).toBe("CAT-1");
    expect(result.flows[0].target).toBe("SUP-A");
  });

  it("(12) tier2_dependencies is null when source array is null or empty", () => {
    const baseFlows = [
      { source: "CAT-1", target: "SUP-A", value: 500_000, tier: 1, single_source_flag: false },
    ];
    const nullCase = extractSupplierConcentrationMap(
      {},
      {
        concentration: {
          categories: baseCategories,
          suppliers: baseSuppliers,
          flows: baseFlows,
          tier2_dependencies: null,
        },
      }
    )!;
    const emptyCase = extractSupplierConcentrationMap(
      {},
      {
        concentration: {
          categories: baseCategories,
          suppliers: baseSuppliers,
          flows: baseFlows,
          tier2_dependencies: [],
        },
      }
    )!;
    expect(nullCase.tier2_dependencies).toBeNull();
    expect(emptyCase.tier2_dependencies).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Schema (compile-time) sanity
// ────────────────────────────────────────────────────────────────────────────

describe("Wave 2 schema compatibility", () => {
  it("(13) Group A working_capital populated compiles", () => {
    const wc: WorkingCapitalData = {
      current_weighted_dpo: 30,
      target_weighted_dpo: 45,
      working_capital_delta_eur: 410_959,
      annual_spend_eur: 10_000_000,
      terms_distribution: [{ term_label: "NET 30", spend_share_pct: 60, supplier_count: 5 }],
      by_supplier: [
        { supplier_label: "SUP-A", category: null, payment_terms_days: 30, annual_spend: 5_000_000, late_payment_directive_risk: false },
      ],
      early_payment_discount_opportunities: [],
      currency: "EUR",
    };
    expect(wc.current_weighted_dpo).toBe(30);
  });

  it("(14) Group A working_capital=null compiles (backwards compatibility)", () => {
    const fm: { working_capital: WorkingCapitalData | null } = { working_capital: null };
    expect(fm.working_capital).toBeNull();
  });

  it("(15) Group D concentration populated compiles", () => {
    const conc: ConcentrationData = {
      categories: [{ category_id: "CAT-1", category_name: "IT", hhi: 3000, hhi_interpretation: "HIGH", annual_spend: 1_000_000 }],
      flows: [{ source: "CAT-1", target: "SUP-A", value: 500_000, tier: 1, single_source_flag: false }],
      suppliers: [{ supplier_label: "SUP-A", geography: "DE", total_spend: 500_000, category_count: 1, exit_cost_estimate: null, exit_cost_rationale: null }],
      tier2_dependencies: null,
      geographic_concentration: [{ country_code: "DE", spend_share_pct: 60 }],
      currency: "EUR",
    };
    expect(conc.categories).toHaveLength(1);
  });

  it("(16) Group D concentration=null compiles (backwards compatibility)", () => {
    const ss: { concentration: ConcentrationData | null } = { concentration: null };
    expect(ss.concentration).toBeNull();
  });
});
