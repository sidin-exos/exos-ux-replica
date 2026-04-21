/**
 * Reverse mapping: Dashboard -> Scenarios that use it.
 * Built from scenarioDashboardMapping in dashboard-mappings.ts.
 *
 * Group E (Real-Time Knowledge, S28–S29) dashboard policy:
 * - market-snapshot (S28): intentionally no dashboards — renders live
 *   Perplexity intelligence results directly in the scenario UI.
 * - pre-flight-audit (S29): DOES render dashboards (risk-heatmap,
 *   data-quality). Group E membership does not imply "no viz".
 * Do not generalise "Group E = no dashboards". It is per-scenario.
 *
 * All lookups go through resolveDashboardId so legacy ids stored in
 * persisted records (shared_reports, exports, etc.) still resolve to the
 * current canonical DashboardType.
 */

import {
  DashboardType,
  resolveDashboardId,
  scenarioDashboardMapping,
} from "./dashboard-mappings";
import { scenarios } from "./scenarios";

// Build reverse mapping: which scenarios use each dashboard
export const getDashboardScenarios = (dashboardId: string): string[] => {
  const canonicalId = resolveDashboardId(dashboardId);
  const scenarioIds: string[] = [];

  for (const [scenarioId, dashboards] of Object.entries(scenarioDashboardMapping)) {
    if (dashboards.includes(canonicalId)) {
      scenarioIds.push(scenarioId);
    }
  }

  return scenarioIds;
};

// Get scenario titles for a dashboard
export const getDashboardScenarioTitles = (dashboardId: string): string[] => {
  const scenarioIds = getDashboardScenarios(dashboardId);

  return scenarioIds.map((id) => {
    const scenario = scenarios.find((s) => s.id === id);
    return scenario?.title || id;
  });
};

// Get full scenario info (id, title, icon, category) for chips/cards
export const getDashboardScenarioInfo = (dashboardId: string) => {
  const scenarioIds = getDashboardScenarios(dashboardId);
  return scenarioIds
    .map((id) => scenarios.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({ id: s.id, title: s.title, icon: s.icon, category: s.category }));
};

// Get count of scenarios using this dashboard
export const getDashboardScenarioCount = (dashboardId: string): number => {
  return getDashboardScenarios(dashboardId).length;
};

// Re-export DashboardType for convenience at call sites that already import
// from this module.
export type { DashboardType };
