// Reverse mapping: Dashboard -> Scenarios that use it
// Built from scenarioDashboardMapping in dashboard-mappings.ts

import { DashboardType, scenarioDashboardMapping } from "./dashboard-mappings";
import { scenarios } from "./scenarios";

// Build reverse mapping: which scenarios use each dashboard
export const getDashboardScenarios = (dashboardId: DashboardType): string[] => {
  const scenarioIds: string[] = [];
  
  for (const [scenarioId, dashboards] of Object.entries(scenarioDashboardMapping)) {
    if (dashboards.includes(dashboardId)) {
      scenarioIds.push(scenarioId);
    }
  }
  
  return scenarioIds;
};

// Get scenario titles for a dashboard
export const getDashboardScenarioTitles = (dashboardId: DashboardType): string[] => {
  const scenarioIds = getDashboardScenarios(dashboardId);
  
  return scenarioIds.map(id => {
    const scenario = scenarios.find(s => s.id === id);
    return scenario?.title || id;
  });
};

// Get full scenario info (id, title, icon, category) for chips/cards
export const getDashboardScenarioInfo = (dashboardId: DashboardType) => {
  const scenarioIds = getDashboardScenarios(dashboardId);
  return scenarioIds
    .map(id => scenarios.find(s => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map(s => ({ id: s.id, title: s.title, icon: s.icon, category: s.category }));
};

// Get count of scenarios using this dashboard
export const getDashboardScenarioCount = (dashboardId: DashboardType): number => {
  return getDashboardScenarios(dashboardId).length;
};
