import { describe, it, expect } from "vitest";
import { scenarios } from "@/lib/scenarios";
import {
  scenarioDashboardMapping,
  dashboardConfigs,
  resolveDashboardId,
  toLegacyDashboardId,
  DASHBOARD_ID_ALIASES,
  type DashboardType,
} from "@/lib/dashboard-mappings";
import { getDashboardScenarios } from "@/lib/dashboard-scenario-mapping";

const scenarioIds = scenarios.map((s) => s.id);
const validDashboardTypes = Object.keys(dashboardConfigs) as DashboardType[];

describe("scenarioDashboardMapping contract", () => {
  it("every scenario ID has a dashboard mapping", () => {
    for (const id of scenarioIds) {
      expect(
        scenarioDashboardMapping,
        `Scenario "${id}" is missing from scenarioDashboardMapping`
      ).toHaveProperty(id);
    }
  });

  it("each mapping has 1-4 valid dashboards (or 0 for market-snapshot)", () => {
    for (const [key, dashboards] of Object.entries(scenarioDashboardMapping)) {
      // market-snapshot is intentionally empty (Group E, S28).
      if (key === "market-snapshot") {
        expect(dashboards.length).toBe(0);
        continue;
      }
      expect(
        dashboards.length,
        `"${key}" has ${dashboards.length} dashboards (expected 1-5)`
      ).toBeGreaterThanOrEqual(1);
      expect(
        dashboards.length,
        `"${key}" has ${dashboards.length} dashboards (expected 1-5)`
      ).toBeLessThanOrEqual(5);

      for (const db of dashboards) {
        expect(
          validDashboardTypes,
          `"${key}" maps to invalid dashboard "${db}"`
        ).toContain(db);
      }
    }
  });

  it("no orphaned keys in mapping", () => {
    for (const key of Object.keys(scenarioDashboardMapping)) {
      expect(
        scenarioIds,
        `Mapping key "${key}" does not exist in scenarios`
      ).toContain(key);
    }
  });
});

describe("resolveDashboardId (legacy alias resolver)", () => {
  it("maps legacy 'risk-matrix' → 'risk-heatmap'", () => {
    expect(resolveDashboardId("risk-matrix")).toBe("risk-heatmap");
  });

  it("returns canonical 'risk-heatmap' unchanged", () => {
    expect(resolveDashboardId("risk-heatmap")).toBe("risk-heatmap");
  });

  it("returns unrelated ids unchanged", () => {
    expect(resolveDashboardId("tco-comparison")).toBe("tco-comparison");
  });

  it("alias map declares risk-matrix → risk-heatmap", () => {
    expect(DASHBOARD_ID_ALIASES["risk-matrix"]).toBe("risk-heatmap");
  });

  it("toLegacyDashboardId is the inverse for renamed ids", () => {
    expect(toLegacyDashboardId("risk-heatmap")).toBe("risk-matrix");
    expect(toLegacyDashboardId("tco-comparison")).toBe("tco-comparison");
  });
});

describe("getDashboardScenarios — wiring fixes", () => {
  it("'risk-heatmap' is used by all 8 risk-related scenarios", () => {
    const expected = [
      "procurement-project-planning",
      "disruption-management",
      "risk-assessment",
      "risk-matrix",
      "pre-flight-audit",
      "category-risk-evaluator",
      "supplier-dependency-planner",
      "black-swan-scenario",
    ];
    const actual = getDashboardScenarios("risk-heatmap");
    for (const id of expected) {
      expect(actual, `risk-heatmap should be used by "${id}"`).toContain(id);
    }
  });

  it("legacy 'risk-matrix' lookup resolves through alias", () => {
    expect(getDashboardScenarios("risk-matrix")).toEqual(
      getDashboardScenarios("risk-heatmap")
    );
  });

  it("'supplier-scorecard' is NOT wired to scenario 'risk-matrix' (S18)", () => {
    expect(getDashboardScenarios("supplier-scorecard")).not.toContain("risk-matrix");
  });

  it("'sow-analysis' is NOT wired to 'category-risk-evaluator' (S20)", () => {
    expect(getDashboardScenarios("sow-analysis")).not.toContain("category-risk-evaluator");
  });

  it("'sensitivity-spider' is NOT wired to 'supplier-dependency-planner' (S25)", () => {
    expect(getDashboardScenarios("sensitivity-spider")).not.toContain("supplier-dependency-planner");
  });
});

describe("audit cull — 6 weak-fit scenario wirings removed", () => {
  it("tco-comparison drops cost-breakdown but keeps tco-analysis", () => {
    const scenarios = getDashboardScenarios("tco-comparison");
    expect(scenarios).not.toContain("cost-breakdown");
    expect(scenarios).toContain("tco-analysis");
  });

  it("should-cost-gap drops savings-calculation but keeps cost-breakdown and negotiation-preparation", () => {
    const scenarios = getDashboardScenarios("should-cost-gap");
    expect(scenarios).not.toContain("savings-calculation");
    expect(scenarios).toContain("cost-breakdown");
    expect(scenarios).toContain("negotiation-preparation");
  });

  it("working-capital-dpo drops forecasting-budgeting and category-strategy but keeps savings-calculation and spend-analysis-categorization", () => {
    const scenarios = getDashboardScenarios("working-capital-dpo");
    expect(scenarios).not.toContain("forecasting-budgeting");
    expect(scenarios).not.toContain("category-strategy");
    expect(scenarios).toContain("savings-calculation");
    expect(scenarios).toContain("spend-analysis-categorization");
  });

  it("timeline-roadmap drops supplier-review but keeps category-strategy, procurement-project-planning, disruption-management", () => {
    const scenarios = getDashboardScenarios("timeline-roadmap");
    expect(scenarios).not.toContain("supplier-review");
    expect(scenarios).toContain("category-strategy");
    expect(scenarios).toContain("procurement-project-planning");
    expect(scenarios).toContain("disruption-management");
  });

  it("savings-realization-funnel drops volume-consolidation but keeps savings-calculation and category-strategy", () => {
    const scenarios = getDashboardScenarios("savings-realization-funnel");
    expect(scenarios).not.toContain("volume-consolidation");
    expect(scenarios).toContain("savings-calculation");
    expect(scenarios).toContain("category-strategy");
  });
});
