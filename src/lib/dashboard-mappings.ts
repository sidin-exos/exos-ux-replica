// Dashboard type definitions and scenario mappings
// Based on the dashboard design strategy for EXOS scenarios

export type DashboardType =
  | "action-checklist"
  | "decision-matrix"
  | "cost-waterfall"
  | "timeline-roadmap"
  | "kraljic-quadrant"
  | "tco-comparison"
  | "license-tier"
  | "sensitivity-spider"
  | "risk-matrix"
  | "scenario-comparison"
  | "supplier-scorecard"
  | "sow-analysis"
  | "negotiation-prep"
  | "data-quality";

export interface DashboardConfig {
  id: DashboardType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
}

export const dashboardConfigs: Record<DashboardType, DashboardConfig> = {
  "action-checklist": {
    id: "action-checklist",
    name: "Action Checklist",
    description: "Priority-grouped task tracking with status indicators",
    icon: "CheckCircle2",
  },
  "decision-matrix": {
    id: "decision-matrix",
    name: "Decision Matrix",
    description: "Weighted multi-criteria scoring and comparison",
    icon: "LayoutGrid",
  },
  "cost-waterfall": {
    id: "cost-waterfall",
    name: "Cost Breakdown",
    description: "Waterfall chart showing cost components and reductions",
    icon: "TrendingDown",
  },
  "timeline-roadmap": {
    id: "timeline-roadmap",
    name: "Timeline Roadmap",
    description: "Gantt-style project phases and milestones",
    icon: "Calendar",
  },
  "kraljic-quadrant": {
    id: "kraljic-quadrant",
    name: "Kraljic Matrix",
    description: "Strategic positioning by supply risk vs business impact",
    icon: "Grid3X3",
  },
  "tco-comparison": {
    id: "tco-comparison",
    name: "TCO Comparison",
    description: "Total cost of ownership over time across options",
    icon: "TrendingUp",
  },
  "license-tier": {
    id: "license-tier",
    name: "License Distribution",
    description: "User tier breakdown and optimization recommendations",
    icon: "Users",
  },
  "sensitivity-spider": {
    id: "sensitivity-spider",
    name: "Sensitivity Analysis",
    description: "Tornado chart showing variable impact on outcomes",
    icon: "Activity",
  },
  "risk-matrix": {
    id: "risk-matrix",
    name: "Risk Matrix",
    description: "Probability vs impact risk assessment grid",
    icon: "Shield",
  },
  "scenario-comparison": {
    id: "scenario-comparison",
    name: "Scenario Comparison",
    description: "Radar chart comparing multiple strategic options",
    icon: "GitCompare",
  },
  "supplier-scorecard": {
    id: "supplier-scorecard",
    name: "Supplier Scorecard",
    description: "Performance metrics and trend indicators",
    icon: "Award",
  },
  "sow-analysis": {
    id: "sow-analysis",
    name: "SOW Analysis",
    description: "Document clause coverage and protection scoring",
    icon: "FileText",
  },
  "negotiation-prep": {
    id: "negotiation-prep",
    name: "Negotiation Prep",
    description: "BATNA analysis and tactical sequence flow",
    icon: "Handshake",
  },
  "data-quality": {
    id: "data-quality",
    name: "Data Quality",
    description: "Analysis confidence and field coverage",
    icon: "Database",
  },
};

// Scenario to dashboard mapping
// Each scenario has 2-4 relevant dashboards, ordered by relevance
export const scenarioDashboardMapping: Record<string, DashboardType[]> = {
  // Analysis and Optimization
  "make-vs-buy": ["decision-matrix", "cost-waterfall", "scenario-comparison", "risk-matrix"],
  "supplier-review": ["supplier-scorecard", "risk-matrix", "action-checklist", "timeline-roadmap"],
  "tco-analysis": ["tco-comparison", "cost-waterfall", "sensitivity-spider", "decision-matrix"],
  "software-licensing": ["license-tier", "tco-comparison", "scenario-comparison", "risk-matrix"],
  "volume-consolidation": ["scenario-comparison", "supplier-scorecard", "risk-matrix", "cost-waterfall"],
  "spend-cube-analysis": ["cost-waterfall", "supplier-scorecard", "kraljic-quadrant", "data-quality"],
  "license-optimization": ["license-tier", "cost-waterfall", "action-checklist"],
  "cost-breakdown": ["cost-waterfall", "sensitivity-spider", "decision-matrix"],
  "category-strategy": ["kraljic-quadrant", "scenario-comparison", "timeline-roadmap", "action-checklist"],

  // Planning and Sourcing
  "tail-spend-sourcing": ["action-checklist", "decision-matrix", "data-quality"],
  "requirements-gathering": ["action-checklist", "timeline-roadmap", "decision-matrix"],
  "supplier-discovery": ["supplier-scorecard", "decision-matrix", "risk-matrix"],
  "forecasting-budgeting": ["sensitivity-spider", "cost-waterfall", "timeline-roadmap", "risk-matrix"],
  "negotiation-preparation": ["negotiation-prep", "scenario-comparison", "risk-matrix", "action-checklist"],
  "project-planning": ["timeline-roadmap", "action-checklist", "risk-matrix", "sensitivity-spider"],

  // Risk Management
  "disruption-management": ["timeline-roadmap", "risk-matrix", "scenario-comparison", "action-checklist"],
  "risk-assessment": ["risk-matrix", "scenario-comparison", "action-checklist", "data-quality"],
  "risk-matrix": ["risk-matrix", "supplier-scorecard", "action-checklist"],

  // Documentation and Contracts
  "sow-critic": ["sow-analysis", "action-checklist", "risk-matrix"],
  "sla-definition": ["decision-matrix", "action-checklist", "timeline-roadmap"],
  "rfp-generator": ["timeline-roadmap", "decision-matrix", "action-checklist", "data-quality"],

  // Spend Analysis
  "spend-analysis-categorization": ["cost-waterfall", "kraljic-quadrant", "supplier-scorecard", "data-quality"],

  // Market Snapshot (Perplexity-powered research)
  "market-snapshot": ["supplier-scorecard", "decision-matrix", "risk-matrix", "data-quality"],
};

// Get dashboards for a scenario with fallback
export const getDashboardsForScenario = (scenarioId: string): DashboardType[] => {
  return scenarioDashboardMapping[scenarioId] || ["action-checklist", "data-quality"];
};

// Get display info for selected dashboards
export const getDashboardDisplayInfo = (dashboardIds: DashboardType[]): DashboardConfig[] => {
  return dashboardIds.map((id) => dashboardConfigs[id]).filter(Boolean);
};
