

# Replace Scenario Descriptions with Tags + Smaller Icons

## Changes

### 1. Add `tags` field to Scenario interface (`src/lib/scenarios.ts`)
Add an optional `tags: string[]` field to the `Scenario` interface, and populate each scenario with 2-3 short keyword tags:

| Scenario | Tags |
|---|---|
| Total Cost of Ownership | `Lifecycle Cost`, `NPV`, `Asset Purchase` |
| Cost Breakdown | `Should-Cost`, `Negotiation`, `Benchmarking` |
| Capex vs Opex (Lease/Buy) | `NPV`, `Cash Flow`, `IFRS 16` |
| Savings Calculation | `Hard/Soft Savings`, `Audit-Ready`, `Inflation` |
| Spend Analysis & Categorization | `Tail Spend`, `Taxonomy`, `Consolidation` |
| Predictive Budgeting & Forecasting | `Forecasting`, `Scenarios`, `Inflation` |
| SaaS Optimization | `License Audit`, `Kill List`, `Overlap` |
| Specification Optimizer | `Gold Plating`, `Over-Spec`, `Cost Reduction` |
| RFP Generator | `Tender Package`, `Evaluation Matrix`, `Auto-Parse` |
| SLA Definition | `KPIs`, `Penalties`, `Escalation` |
| Negotiation Preparation | `BATNA`, `Leverage`, `Strategy` |
| Supplier Performance Review | `Scorecard`, `KPIs`, `QBR` |
| Procurement Project Planning | `SWOT`, `RACI`, `Critical Path` |
| SOW Critic | `Redlining`, `Scope Gaps`, `IP Protection` |
| Risk Assessment | `Heat Map`, `Regulatory`, `Mitigation` |
| Risk Matrix | `Probability/Impact`, `Heatmap`, `Controls` |
| Software Licensing Structure | `True-Up Traps`, `Tier Analysis`, `Lock-In` |
| Kraljic Matrix | `Portfolio`, `Segmentation`, `Strategy` |
| Contract Review | `Clause Analysis`, `Red Flags`, `Compliance` |
| Make vs Buy | `Decision Matrix`, `Break-Even`, `Outsourcing` |
| Volume Consolidation | `Supplier Ratio`, `Volume Discount`, `Dual-Source` |
| Supplier Dependency & Exit Planner | `Lock-In`, `Switching Cost`, `Exit Plan` |
| Disruption Management | `Crisis Response`, `Recovery`, `Alt Sourcing` |
| Black Swan Scenario Simulator | `Stress Test`, `BCP`, `Cascading Risk` |
| Market Snapshot | `Competitive Intel`, `Market Share`, `Real-Time` |
| Pre-flight Audit | `Due Diligence`, `Sanctions`, `Supplier Intel` |

### 2. Update `ScenarioCard` component (`src/components/dashboard/ScenarioCard.tsx`)
- Replace the `<p>` description text with a row of small `Badge` tags from `scenario.tags`
- Reduce icon container from `w-12 h-12` to `w-10 h-10` and icon from `w-6 h-6` to `w-5 h-5`
- Accept `tags?: string[]` prop instead of rendering `description`

### 3. Update `Index.tsx`
- Pass `tags={scenario.tags}` instead of (or alongside) `description` to `ScenarioCard`

## Technical Notes
- Tags render as `Badge variant="outline"` with `text-[10px]` sizing
- Icon size reduction is ~17% (close to requested 10%, but using standard Tailwind classes)
- No changes to the Scenario data model's `description` field — it stays for the preview panel

