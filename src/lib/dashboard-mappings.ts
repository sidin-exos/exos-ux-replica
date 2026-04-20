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
  | "risk-heatmap"
  | "scenario-comparison"
  | "supplier-scorecard"
  | "sow-analysis"
  | "negotiation-prep"
  | "data-quality"
  | "should-cost-gap"
  | "savings-realization-funnel"
  | "working-capital-dpo"
  | "supplier-concentration-map";

/**
 * Backwards-compatibility alias map for renamed dashboard IDs.
 *
 * Persisted records (shared_reports, scenario_feedback, test_reports, export
 * metadata, etc.) may still reference legacy IDs. We resolve at read time
 * rather than migrating historical rows — this preserves the original audit
 * trail and avoids RLS / migration churn.
 *
 * Add a new entry whenever a dashboard ID is renamed.
 */
export const DASHBOARD_ID_ALIASES: Record<string, DashboardType> = {
  "risk-matrix": "risk-heatmap",
};

/**
 * Resolve a raw dashboard id (possibly a legacy alias) to its canonical
 * DashboardType. Unknown ids are returned unchanged so callers can decide
 * how to treat them. Use this anywhere a dashboard id may originate from a
 * persisted source.
 */
export const resolveDashboardId = (rawId: string): DashboardType => {
  return (DASHBOARD_ID_ALIASES[rawId] ?? rawId) as DashboardType;
};

/**
 * Convert a canonical DashboardType back to the legacy id expected by
 * downstream consumers that have not yet been migrated (e.g. PDF/Excel
 * edge function dashboard switches). Inverse of resolveDashboardId.
 */
const LEGACY_DASHBOARD_IDS: Partial<Record<DashboardType, string>> = {
  "risk-heatmap": "risk-matrix",
};

export const toLegacyDashboardId = (id: DashboardType): string => {
  return LEGACY_DASHBOARD_IDS[id] ?? id;
};

export interface DashboardConfig {
  id: DashboardType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  keyMetrics: string[];
  whenToUse: string;
  questionsAnswered: string[];
  /**
   * Whether DashboardRenderer should fall back to the dashboard's hardcoded
   * sample data when AI envelope data is missing. Defaults to true.
   * Set to false for finance-sensitive dashboards where misleading sample
   * figures could be mistaken for real benchmarks (e.g. working-capital-dpo).
   */
  showSampleDataFallback?: boolean;
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
  "risk-heatmap": {
    id: "risk-heatmap",
    name: "Risk Heatmap",
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
  "should-cost-gap": {
    id: "should-cost-gap",
    name: "Should-Cost Gap",
    description: "Component-level price vs benchmark vs should-cost target",
    icon: "Scale",
    keyMetrics: ["Current price % per component", "Benchmark % per component", "Headroom (gap) %", "Supplier margin vs benchmark margin"],
    whenToUse: "Use to expose the negotiation headroom on each component of a quoted price. Pairs the cost decomposition with a should-cost anchor and a benchmark margin check.",
    questionsAnswered: ["Where is the supplier overpriced vs benchmark?", "What is a defensible should-cost target?", "Is the supplier's margin out of line with the industry?"],
  },
  "savings-realization-funnel": {
    id: "savings-realization-funnel",
    name: "Savings Realization Funnel",
    description: "CIPS Hard / Soft / Avoided savings across the funnel",
    icon: "Filter",
    keyMetrics: ["Hard / Soft / Avoided segmentation", "Identified → Committed → Realized progression", "CFO-acceptance indicator", "Baseline verification status"],
    whenToUse: "Use to report savings in a way Finance will accept. Separates Hard P&L impact from Soft cost avoidance and inflation-protected (Avoided) value, and shows how much of identified savings actually realised.",
    questionsAnswered: ["How much of our reported savings is Finance-grade?", "Where does value leak between identified and realized?", "Is our baseline verified or estimated?"],
  },
  "working-capital-dpo": {
    id: "working-capital-dpo",
    name: "Working Capital & DPO",
    description: "Payment-terms distribution and working-capital release potential",
    icon: "Wallet",
    keyMetrics: ["Current vs target weighted DPO", "Working capital impact (€)", "Payment terms distribution by spend share", "EU Late Payment Directive risk flags"],
    whenToUse: "Use to surface the working-capital release available from a DPO extension and to flag suppliers whose terms exceed the EU 60-day B2B statutory limit.",
    questionsAnswered: ["How much working capital can we release by extending payment terms?", "Which suppliers are above the EU 60-day Late Payment Directive limit?", "Are there early-payment discount opportunities worth taking?"],
    showSampleDataFallback: false,
  },
  "supplier-concentration-map": {
    id: "supplier-concentration-map",
    name: "Supplier Concentration Map",
    description: "Category → supplier flow with HHI and single-source flags",
    icon: "Network",
    keyMetrics: ["HHI per category (LOW / MODERATE / HIGH / EXTREME)", "Single-source flags (>70% of category spend)", "Tier-2 dependencies", "Geographic concentration"],
    whenToUse: "Use to expose concentration risk at category, supplier, and geography level — and to surface tier-2 dependencies hidden behind tier-1 suppliers.",
    questionsAnswered: ["Where are we dangerously concentrated on a single supplier?", "Which categories have monopolistic supply structures?", "Where do tier-2 dependencies create hidden risk?"],
  },
};

// Scenario to dashboard mapping
// Each scenario has 2-4 relevant dashboards, ordered by relevance
export const scenarioDashboardMapping: Record<string, DashboardType[]> = {
  // Analysis and Optimization
  // Wave 1 additions:
  // - should-cost-gap is wired to S2 (primary), S21 (negotiation anchor), S4 (validation baseline).
  // - savings-realization-funnel is wired to S4 (primary), S22 (ROI), S24 (consolidation reporting).
  // cost-waterfall is intentionally retained on S2 + S4 + S24 for backwards
  // compatibility with historical runs that lack the new payload fields.
  "make-vs-buy": ["decision-matrix", "scenario-comparison", "cost-waterfall"],
  "supplier-review": ["supplier-scorecard", "timeline-roadmap", "action-checklist"],
  "tco-analysis": ["tco-comparison", "cost-waterfall", "scenario-comparison"],
  "software-licensing": ["license-tier", "cost-waterfall"],
  "volume-consolidation": ["scenario-comparison", "cost-waterfall", "savings-realization-funnel"],
  "cost-breakdown": ["should-cost-gap", "cost-waterfall", "data-quality"],
  "category-strategy": ["kraljic-quadrant", "timeline-roadmap", "savings-realization-funnel"],
  "capex-vs-opex": ["scenario-comparison", "sensitivity-spider"],
  "savings-calculation": ["savings-realization-funnel", "cost-waterfall", "should-cost-gap", "action-checklist"],
  "saas-optimization": ["license-tier", "cost-waterfall"],
  "specification-optimizer": ["decision-matrix", "cost-waterfall", "action-checklist", "data-quality"],

  // Planning and Sourcing
  "tail-spend-sourcing": ["action-checklist", "data-quality"],
  "requirements-gathering": ["action-checklist", "data-quality"],
  "forecasting-budgeting": ["scenario-comparison", "sensitivity-spider"],
  "negotiation-preparation": ["negotiation-prep", "scenario-comparison", "should-cost-gap"],
  "procurement-project-planning": ["timeline-roadmap", "action-checklist", "risk-heatmap"],

  // Risk Management
  // NOTE: the scenario id "risk-matrix" (S18) is unrelated to the dashboard
  // formerly named "risk-matrix" (now "risk-heatmap"). The collision is the
  // reason the dashboard was renamed — see DASHBOARD_ID_ALIASES.
  // S18 ("risk-matrix") is a risk-positioning scenario, not a supplier-perf
  // review, so supplier-scorecard is intentionally NOT mapped here.
  "disruption-management": ["action-checklist", "timeline-roadmap", "risk-heatmap"],
  "risk-assessment": ["risk-heatmap", "scenario-comparison", "action-checklist", "data-quality"],
  "risk-matrix": ["risk-heatmap", "action-checklist"],
  "pre-flight-audit": ["data-quality", "risk-heatmap"],
  "category-risk-evaluator": ["risk-heatmap", "kraljic-quadrant", "action-checklist"],
  "supplier-dependency-planner": ["risk-heatmap"],
  "black-swan-scenario": ["risk-heatmap", "sensitivity-spider", "scenario-comparison"],

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
