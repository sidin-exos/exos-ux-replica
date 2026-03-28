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
  keyMetrics: string[];
  whenToUse: string;
  questionsAnswered: string[];
}

export const dashboardConfigs: Record<DashboardType, DashboardConfig> = {
  "action-checklist": {
    id: "action-checklist",
    name: "Action Checklist",
    description: "Priority-grouped task tracking with status indicators",
    icon: "CheckCircle2",
    keyMetrics: ["Tasks by priority (critical/high/medium)", "Completion rate %", "Overdue items count", "Owner workload distribution"],
    whenToUse: "Use after any analysis to convert insights into trackable actions. Essential for post-negotiation follow-ups, supplier onboarding steps, and category strategy execution.",
    questionsAnswered: ["What needs to happen next and in what order?", "Who owns each action and are we on track?", "Which critical items are overdue?"],
  },
  "decision-matrix": {
    id: "decision-matrix",
    name: "Decision Matrix",
    description: "Weighted multi-criteria scoring and comparison",
    icon: "LayoutGrid",
    keyMetrics: ["Weighted score per option", "Criteria weight distribution", "Score gap between top options", "Sensitivity to weight changes"],
    whenToUse: "Use when you need to compare multiple options across weighted criteria — ideal for make-vs-buy, vendor selection, or technology choices.",
    questionsAnswered: ["Which option scores highest across all factors?", "How sensitive is the result to weight changes?", "Are there clear winners or is it a close call?"],
  },
  "cost-waterfall": {
    id: "cost-waterfall",
    name: "Cost Breakdown",
    description: "Waterfall chart showing cost components and reductions",
    icon: "TrendingDown",
    keyMetrics: ["Total cost build-up", "Individual cost components", "Savings / reductions applied", "Net total after adjustments"],
    whenToUse: "Use to visualize how individual cost elements stack up to a total — and where savings have been applied. Critical for TCO reviews, budget presentations, and spend transparency.",
    questionsAnswered: ["Where is the money actually going?", "Which cost components have the biggest impact?", "How much are we saving through discounts or credits?"],
  },
  "timeline-roadmap": {
    id: "timeline-roadmap",
    name: "Timeline Roadmap",
    description: "Gantt-style project phases and milestones",
    icon: "Calendar",
    keyMetrics: ["Phase duration & overlap", "Milestone dates", "Critical path dependencies", "Overall project timeline"],
    whenToUse: "Use for any multi-phase initiative — supplier transitions, contract implementations, RFP timelines, or category strategy rollouts.",
    questionsAnswered: ["What is the realistic timeline for this initiative?", "Which phases can run in parallel?", "Where are the key decision points?"],
  },
  "kraljic-quadrant": {
    id: "kraljic-quadrant",
    name: "Kraljic Matrix",
    description: "Strategic positioning by supply risk vs business impact",
    icon: "Grid3X3",
    keyMetrics: ["Items per quadrant (Leverage/Strategic/Bottleneck/Non-critical)", "Supply risk score", "Business impact score", "Category movement over time"],
    whenToUse: "Use to classify procurement categories by supply risk and business impact. Drives differentiated sourcing strategies and resource allocation.",
    questionsAnswered: ["Which categories require strategic partnerships vs. competitive bidding?", "Where are our supply chain vulnerabilities?", "How should we prioritize sourcing effort?"],
  },
  "tco-comparison": {
    id: "tco-comparison",
    name: "TCO Comparison",
    description: "Total cost of ownership over time across options",
    icon: "TrendingUp",
    keyMetrics: ["Cumulative TCO per option over time", "Break-even point", "Cost delta between options", "Hidden cost components"],
    whenToUse: "Use when comparing vendors or solutions that have different upfront vs. ongoing cost profiles. Essential for capex/opex decisions and long-term contracts.",
    questionsAnswered: ["Which option is cheapest over the full lifecycle?", "When does the higher upfront investment break even?", "What hidden costs change the ranking?"],
  },
  "license-tier": {
    id: "license-tier",
    name: "License Distribution",
    description: "User tier breakdown and optimization recommendations",
    icon: "Users",
    keyMetrics: ["Users per license tier", "Cost per user per tier", "Optimization savings potential", "Utilization rate by tier"],
    whenToUse: "Use for software and SaaS license reviews. Identifies over-provisioned tiers and rightsizing opportunities to reduce spend without losing functionality.",
    questionsAnswered: ["Are we paying for licenses we don't fully use?", "How much can we save by rightsizing?", "Which tier has the best cost-per-feature ratio?"],
  },
  "sensitivity-spider": {
    id: "sensitivity-spider",
    name: "Sensitivity Analysis",
    description: "Tornado chart showing variable impact on outcomes",
    icon: "Activity",
    keyMetrics: ["Impact range per variable (±%)", "Most influential variable", "Outcome swing from base case", "Confidence interval"],
    whenToUse: "Use to stress-test your assumptions. Shows which input variables have the biggest impact on the outcome — critical for budget planning and risk quantification.",
    questionsAnswered: ["Which assumption, if wrong, would hurt us the most?", "How robust is our business case?", "What's the range of possible outcomes?"],
  },
  "risk-matrix": {
    id: "risk-matrix",
    name: "Risk Matrix",
    description: "Probability vs impact risk assessment grid",
    icon: "Shield",
    keyMetrics: ["Risks by severity zone (critical/high/medium/low)", "Risk count per quadrant", "Top 3 risks by composite score", "Mitigation coverage %"],
    whenToUse: "Use to assess and prioritize risks before major procurement decisions. Maps probability against business impact to focus mitigation efforts where they matter most.",
    questionsAnswered: ["What are the top risks we need to mitigate?", "Are there high-impact risks we're underestimating?", "Where should we invest in contingency plans?"],
  },
  "scenario-comparison": {
    id: "scenario-comparison",
    name: "Scenario Comparison",
    description: "Radar chart comparing multiple strategic options",
    icon: "GitCompare",
    keyMetrics: ["Multi-dimension scores per scenario", "Relative strengths & weaknesses", "Overall scenario ranking", "Trade-off visualization"],
    whenToUse: "Use when evaluating 2-4 strategic options side by side. The radar chart reveals trade-offs that tables can't — showing where each option excels or falls short.",
    questionsAnswered: ["Which scenario offers the best balance across all dimensions?", "What are we giving up with each option?", "Is there a clearly dominant strategy?"],
  },
  "supplier-scorecard": {
    id: "supplier-scorecard",
    name: "Supplier Scorecard",
    description: "Performance metrics and trend indicators",
    icon: "Award",
    keyMetrics: ["Overall supplier score", "Performance by dimension (quality/delivery/cost/innovation)", "Trend direction (improving/declining)", "Benchmark vs. peers"],
    whenToUse: "Use for regular supplier performance reviews and before contract renewals. Provides evidence-based supplier ratings with trend analysis.",
    questionsAnswered: ["Is this supplier improving or declining?", "How does this supplier compare to alternatives?", "Which performance areas need attention?"],
  },
  "sow-analysis": {
    id: "sow-analysis",
    name: "SOW Analysis",
    description: "Document clause coverage and protection scoring",
    icon: "FileText",
    keyMetrics: ["Clause coverage score", "Protection level per section", "Ambiguous language flags", "Missing clause alerts"],
    whenToUse: "Use before signing any contract or SOW. Identifies gaps, ambiguous language, and missing protections that could expose the organization to risk.",
    questionsAnswered: ["Does this contract adequately protect our interests?", "Which clauses are ambiguous or missing?", "What's the risk of signing as-is?"],
  },
  "negotiation-prep": {
    id: "negotiation-prep",
    name: "Negotiation Prep",
    description: "BATNA analysis and tactical sequence flow",
    icon: "Handshake",
    keyMetrics: ["BATNA strength score", "Leverage points identified", "Tactical move sequence", "Target vs. walk-away positions"],
    whenToUse: "Use before entering any significant negotiation. Maps your alternatives, leverage points, and tactical sequence to maximize negotiation outcomes.",
    questionsAnswered: ["What's our best alternative if this negotiation fails?", "Where do we have leverage?", "What's the optimal sequence of moves?"],
  },
  "data-quality": {
    id: "data-quality",
    name: "Data Quality",
    description: "Analysis confidence and field coverage",
    icon: "Database",
    keyMetrics: ["Overall confidence score", "Field completeness %", "Data gaps identified", "Impact of gaps on analysis reliability"],
    whenToUse: "Use to understand how reliable the analysis output is. Shows which input fields were provided vs. missing, and how gaps affect confidence in the results.",
    questionsAnswered: ["How much can I trust this analysis?", "What data is missing and does it matter?", "Would providing more data significantly improve the results?"],
  },
};

// Scenario to dashboard mapping
// Each scenario has 2-4 relevant dashboards, ordered by relevance
export const scenarioDashboardMapping: Record<string, DashboardType[]> = {
  // Analysis and Optimization
  "make-vs-buy": ["decision-matrix", "scenario-comparison", "cost-waterfall"],
  "supplier-review": ["supplier-scorecard", "timeline-roadmap", "action-checklist"],
  "tco-analysis": ["tco-comparison", "cost-waterfall", "scenario-comparison"],
  "software-licensing": ["license-tier", "cost-waterfall"],
  "volume-consolidation": ["scenario-comparison", "cost-waterfall"],
  "cost-breakdown": ["cost-waterfall", "tco-comparison", "data-quality"],
  "category-strategy": ["kraljic-quadrant", "timeline-roadmap"],
  "capex-vs-opex": ["scenario-comparison", "sensitivity-spider"],
  "savings-calculation": ["cost-waterfall", "action-checklist"],
  "saas-optimization": ["license-tier", "cost-waterfall"],
  "specification-optimizer": ["decision-matrix", "cost-waterfall", "action-checklist", "data-quality"],

  // Planning and Sourcing
  "tail-spend-sourcing": ["action-checklist", "data-quality"],
  "requirements-gathering": ["action-checklist", "data-quality"],
  "forecasting-budgeting": ["scenario-comparison", "sensitivity-spider"],
  "negotiation-preparation": ["negotiation-prep", "scenario-comparison"],
  "procurement-project-planning": ["timeline-roadmap", "action-checklist", "risk-matrix"],

  // Risk Management
  "disruption-management": ["action-checklist", "timeline-roadmap", "risk-matrix"],
  "risk-assessment": ["risk-matrix", "scenario-comparison", "action-checklist", "data-quality"],
  "risk-matrix": ["risk-matrix", "supplier-scorecard", "action-checklist"],
  "pre-flight-audit": ["data-quality", "risk-matrix"],
  "category-risk-evaluator": ["risk-matrix", "kraljic-quadrant", "sow-analysis", "action-checklist"],
  "supplier-dependency-planner": ["risk-matrix", "sensitivity-spider"],
  "black-swan-scenario": ["risk-matrix", "sensitivity-spider", "scenario-comparison"],

  // Documentation and Contracts
  "sow-critic": ["sow-analysis", "data-quality"],
  "sla-definition": ["action-checklist", "negotiation-prep"],
  "rfp-generator": ["action-checklist", "data-quality"],
  "contract-template": ["action-checklist", "data-quality"],

  // Spend Analysis
  "spend-analysis-categorization": ["data-quality", "cost-waterfall"],

  // Market Snapshot
  "market-snapshot": [],
};

// Get dashboards for a scenario with fallback
export const getDashboardsForScenario = (scenarioId: string): DashboardType[] => {
  return scenarioDashboardMapping[scenarioId] || ["action-checklist", "data-quality"];
};

// Get display info for selected dashboards
export const getDashboardDisplayInfo = (dashboardIds: DashboardType[]): DashboardConfig[] => {
  return dashboardIds.map((id) => dashboardConfigs[id]).filter(Boolean);
};
