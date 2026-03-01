

## Plan: Update Scenario → Dashboard Mappings Based on Audit v1

### Context
The audit identifies structural mismatches in the current `scenarioDashboardMapping`. Several scenarios have dashboards assigned that are weak/no-fit, while strong matches are missing or misordered. The document also flags 10 new dashboard candidates (P1–P3) — those are **out of scope** for this change (they require new components). This plan only updates the mapping of existing 14 dashboards to existing 29 scenarios.

### File: `src/lib/dashboard-mappings.ts`

Update `scenarioDashboardMapping` to reflect audit findings. Changes grouped by audit verdict:

#### Group A — Analytical Value (8 scenarios)
| Scenario | Current | Audit Recommendation |
|---|---|---|
| `tco-analysis` | tco-comparison, cost-waterfall, sensitivity-spider, decision-matrix | **Remove** sensitivity-spider, decision-matrix. Keep: `tco-comparison, cost-waterfall, scenario-comparison` |
| `cost-breakdown` | cost-waterfall, sensitivity-spider, decision-matrix | **Remove** sensitivity-spider, decision-matrix. Set: `cost-waterfall, tco-comparison, data-quality` |
| `capex-vs-opex` | tco-comparison, cost-waterfall, sensitivity-spider, decision-matrix | **Replace** with: `scenario-comparison, sensitivity-spider` (audit primary + secondary) |
| `savings-calculation` | cost-waterfall, action-checklist, sensitivity-spider, data-quality | **Remove** sensitivity-spider, data-quality. Keep: `cost-waterfall, action-checklist` |
| `spend-analysis-categorization` | cost-waterfall, kraljic-quadrant, supplier-scorecard, data-quality | **Replace** with: `data-quality, cost-waterfall` (audit: weak fit, minimal mapping) |
| `forecasting-budgeting` | sensitivity-spider, cost-waterfall, timeline-roadmap, risk-matrix | **Replace** with: `scenario-comparison, sensitivity-spider` (audit primary + secondary) |
| `saas-optimization` | license-tier, cost-waterfall, action-checklist, data-quality | **Remove** action-checklist, data-quality. Keep: `license-tier, cost-waterfall` |
| `software-licensing` | license-tier, tco-comparison, scenario-comparison, risk-matrix | **Replace** with: `license-tier, cost-waterfall` (audit: Strong match) |

#### Group B — Workflow (8 scenarios)
| Scenario | Current | Audit Recommendation |
|---|---|---|
| `requirements-gathering` | action-checklist, timeline-roadmap, decision-matrix | **Replace** with: `action-checklist, data-quality` (audit: Weak, minimal) |
| `rfp-generator` | timeline-roadmap, decision-matrix, action-checklist, data-quality | **Replace** with: `action-checklist, data-quality` (audit: Weak/doc output) |
| `tail-spend-sourcing` | action-checklist, decision-matrix, data-quality | **Remove** decision-matrix. Keep: `action-checklist, data-quality` |
| `contract-template` | action-checklist, timeline-roadmap, data-quality | **Remove** timeline-roadmap. Keep: `action-checklist, data-quality` (audit: None fit) |
| `sow-critic` | sow-analysis, action-checklist, risk-matrix | **Replace** with: `sow-analysis, data-quality` (audit: Strong) |
| `supplier-review` | supplier-scorecard, risk-matrix, action-checklist, timeline-roadmap | **Replace** with: `supplier-scorecard, timeline-roadmap, action-checklist` (audit: Strong) |
| `procurement-project-planning` | timeline-roadmap, action-checklist, risk-matrix, sensitivity-spider | **Remove** sensitivity-spider. Keep: `timeline-roadmap, action-checklist, risk-matrix` |
| `sla-definition` | decision-matrix, action-checklist, timeline-roadmap | **Replace** with: `action-checklist, negotiation-prep` (audit: Weak, SLA-adjacent) |

#### Group D — Strategic Mentorship (7 scenarios)
| Scenario | Current | Audit Recommendation |
|---|---|---|
| `negotiation-preparation` | negotiation-prep, scenario-comparison, risk-matrix, action-checklist | **Remove** risk-matrix, action-checklist. Keep: `negotiation-prep, scenario-comparison` |
| `category-strategy` | kraljic-quadrant, scenario-comparison, timeline-roadmap, action-checklist | **Remove** scenario-comparison, action-checklist. Keep: `kraljic-quadrant, timeline-roadmap` |
| `make-vs-buy` | decision-matrix, cost-waterfall, scenario-comparison, risk-matrix | **Remove** risk-matrix. Keep: `decision-matrix, scenario-comparison, cost-waterfall` |
| `volume-consolidation` | scenario-comparison, supplier-scorecard, risk-matrix, cost-waterfall | **Remove** supplier-scorecard, risk-matrix. Keep: `scenario-comparison, cost-waterfall` |
| `supplier-dependency-planner` | risk-matrix, supplier-scorecard, scenario-comparison, timeline-roadmap | **Replace** with: `risk-matrix, sensitivity-spider` (audit primary + secondary) |
| `disruption-management` | timeline-roadmap, risk-matrix, scenario-comparison, action-checklist | **Reorder**: `action-checklist, timeline-roadmap, risk-matrix` (audit: Action Checklist is primary) |
| `black-swan-scenario` | risk-matrix, scenario-comparison, timeline-roadmap, action-checklist | **Replace** with: `risk-matrix, sensitivity-spider, scenario-comparison` |

#### Group E — Real-Time Knowledge (2 scenarios)
| Scenario | Current | Audit Recommendation |
|---|---|---|
| `market-snapshot` | supplier-scorecard, decision-matrix, risk-matrix, data-quality | **Replace** with: `data-quality, action-checklist` (audit: NONE fit — minimal fallback) |
| `pre-flight-audit` | supplier-scorecard, risk-matrix, action-checklist, data-quality | **Replace** with: `data-quality, risk-matrix` (audit: Weak, Data Quality primary) |

#### Unchanged (not in audit scope)
- `specification-optimizer` — keep current 4-dashboard mapping
- `risk-assessment` — keep current mapping
- `risk-matrix` (scenario) — keep current mapping
- `category-risk-evaluator` — keep current mapping

### What Stays Untouched
- `DashboardType` union, `dashboardConfigs` — no changes to the 14 existing dashboard definitions
- `getDashboardsForScenario()`, `getDashboardDisplayInfo()` — no logic changes
- All dashboard components, PDF visuals, renderer — unchanged
- Test contract (`2-4 dashboards per scenario`) — all updated mappings stay within 2–3 range
- New dashboard candidates (P1–P3 from audit) — deferred to separate implementation tickets

