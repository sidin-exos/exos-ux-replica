import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Layers } from "lucide-react";
import Header from "@/components/layout/Header";
import PDFPreviewModal from "@/components/reports/pdf/PDFPreviewModal";
import type { DashboardType } from "@/lib/dashboard-mappings";

// ── Compact analysis (covers Executive Summary, Recs, Risks, Next Steps) ──
const ANALYSIS_PROSE = `## Analysis

This synthetic engagement bundles every EXOS dashboard surface into a single report so we can stress-test layout, typography, and theme behaviour against the full visual matrix. The fictitious procurement scope spans hardware, services, financing, and supplier-resilience workstreams.

### Cost & Commercial Drivers
1. **Material:** ADC12 aluminium dominates unit cost; benchmarks suggest 12–18% headroom.
2. **Margins:** Incumbent margin sits 4 pts above market; should-cost analysis confirms negotiation room.
3. **Working capital:** Weighted DPO at 38 days vs. 60-day target — ~€1.4M cash unlock available.
4. **Concentration:** Tier-1 spend HHI of 2,850 (HIGH) — single-source flag on critical sensor module.

### Strategic Alignment
The Balanced strategy weighs cost compression against compliance and supplier health. CFO acceptance for hard savings is GREEN once baseline is verified; soft and avoided savings tracked separately.

Confidence Level: High for cost gap and concentration; Medium for tier-2 dependencies.

## Recommendations

1. **Anchor negotiation on €36.00** using benchmark + cost model.
2. **Extend payment terms** with top 5 suppliers to 60 days NET.
3. **Dual-source critical sensor** to cut HHI below 2,000 within 12 months.
4. **Tier RFP** with weighted evaluation matrix (Price 40 / Quality 30 / Risk 20 / Sustainability 10).

## Risks

- **Supplier concentration (High):** Single-source dependency on Supplier_A for sensor module.
- **Compliance gap (Medium):** Supplier_B SOC2 status unverified.
- **FX volatility (Medium):** EUR/USD exposure on 22% of spend.

## Next Steps

1. Validate should-cost model with engineering.
2. Issue tender pack to qualified bidders within 14 days.
3. Initiate dual-source qualification for sensor module.
`;

// ── Mock data covering ALL 21 dashboards ──
const DASHBOARD_MOCK = {
  actionChecklist: {
    actions: [
      { action: "Validate should-cost model with engineering", priority: "critical", status: "in-progress", owner: "Procurement Lead", dueDate: "2026-05-20" },
      { action: "Issue RFP to qualified bidders", priority: "high", status: "pending", owner: "Category Manager", dueDate: "2026-05-25" },
      { action: "Run dual-source qualification", priority: "high", status: "pending", owner: "Supply Risk", dueDate: "2026-06-15" },
      { action: "Renegotiate payment terms with top-5 suppliers", priority: "medium", status: "pending", owner: "Treasury", dueDate: "2026-06-30" },
      { action: "Confirm Supplier_B SOC2 attestation", priority: "medium", status: "blocked", owner: "Compliance", dueDate: "2026-05-30" },
      { action: "Archive legacy contract templates", priority: "low", status: "done", owner: "Legal Ops", dueDate: "2026-05-01" },
    ],
  },
  decisionMatrix: {
    criteria: [
      { name: "Total Cost", weight: 0.35 },
      { name: "Quality", weight: 0.25 },
      { name: "Risk", weight: 0.20 },
      { name: "Lead Time", weight: 0.10 },
      { name: "Sustainability", weight: 0.10 },
    ],
    options: [
      { name: "Supplier A (Incumbent)", scores: [3, 4, 4, 5, 3] },
      { name: "Supplier B", scores: [4, 3, 3, 4, 4] },
      { name: "Supplier C", scores: [5, 3, 2, 3, 5] },
    ],
  },
  costWaterfall: {
    components: [
      { name: "Raw Materials (ADC12)", value: 225000, type: "cost" },
      { name: "Labor & CNC Finishing", value: 125000, type: "cost" },
      { name: "Overhead", value: 85000, type: "cost" },
      { name: "Logistics", value: 30000, type: "cost" },
      { name: "Profit Margin", value: 35000, type: "cost" },
      { name: "Negotiated Savings", value: 45000, type: "reduction" },
    ],
    currency: "€",
  },
  timelineRoadmap: {
    totalWeeks: 16,
    phases: [
      { name: "Discovery & Should-Cost", startWeek: 1, endWeek: 3, status: "completed", milestones: ["Cost model signed off"] },
      { name: "RFP Preparation", startWeek: 3, endWeek: 6, status: "in-progress", milestones: ["Bidder list locked", "Eval matrix approved"] },
      { name: "Bidder Engagement", startWeek: 6, endWeek: 10, status: "upcoming", milestones: ["Q&A closed", "Site visits"] },
      { name: "Negotiation & Award", startWeek: 10, endWeek: 14, status: "upcoming", milestones: ["BAFO", "Contract sign"] },
      { name: "Transition", startWeek: 14, endWeek: 16, status: "upcoming", milestones: ["Cutover"] },
    ],
  },
  kraljicQuadrant: {
    items: [
      { id: "A", name: "Sensor Module", supplyRisk: 85, businessImpact: 90, spend: "€2.1M" },
      { id: "B", name: "Aluminium Housing", supplyRisk: 40, businessImpact: 75, spend: "€1.4M" },
      { id: "C", name: "Cable Assemblies", supplyRisk: 70, businessImpact: 30, spend: "€350k" },
      { id: "D", name: "Office Supplies", supplyRisk: 15, businessImpact: 10, spend: "€85k" },
      { id: "E", name: "Cloud Hosting", supplyRisk: 60, businessImpact: 80, spend: "€900k" },
    ],
  },
  tcoComparison: {
    data: [
      { year: "Y0", optionA: 200000, optionB: 50000, optionC: 80000 },
      { year: "Y1", optionA: 285000, optionB: 220000, optionC: 240000 },
      { year: "Y2", optionA: 370000, optionB: 370000, optionC: 400000 },
      { year: "Y3", optionA: 420000, optionB: 460000, optionC: 520000 },
      { year: "Y5", optionA: 485000, optionB: 520000, optionC: 595000 },
    ],
    options: [
      { id: "optionA", name: "Buy Outright", color: "#4a8a74", totalTCO: 485000 },
      { id: "optionB", name: "3-Year Lease", color: "#6b9e8a", totalTCO: 520000 },
      { id: "optionC", name: "Subscription", color: "#c9a24d", totalTCO: 595000 },
    ],
    currency: "€",
  },
  licenseTier: {
    tiers: [
      { name: "Starter", users: 50, costPerUser: 12, totalCost: 7200, color: "#6ba5a8" },
      { name: "Professional", users: 180, costPerUser: 28, totalCost: 60480, color: "#3e988f", recommended: 180 },
      { name: "Enterprise", users: 25, costPerUser: 65, totalCost: 19500, color: "#184d48" },
    ],
    currency: "€",
  },
  sensitivitySpider: {
    baseCaseTotal: 500000,
    currency: "€",
    variables: [
      { name: "Aluminium price", baseCase: 2.40, lowCase: 2.10, highCase: 2.85, unit: "€/kg" },
      { name: "Labor rate", baseCase: 38, lowCase: 34, highCase: 44, unit: "€/hr" },
      { name: "Volume", baseCase: 12000, lowCase: 9500, highCase: 14000, unit: "units" },
      { name: "FX EUR/USD", baseCase: 1.08, lowCase: 1.02, highCase: 1.14 },
      { name: "Logistics", baseCase: 2.50, lowCase: 2.10, highCase: 3.20, unit: "€/unit" },
    ],
  },
  riskMatrix: {
    risks: [
      { supplier: "Supplier A", impact: "high", probability: "medium", category: "Concentration", score: 12, rag: "AMBER", owner: "Supply Risk", mitigation: "Dual source", confidence: "HIGH" },
      { supplier: "Supplier B", impact: "medium", probability: "low", category: "Compliance", score: 6, rag: "GREEN", confidence: "MEDIUM" },
      { supplier: "Logistics Co", impact: "high", probability: "high", category: "Lead time", score: 20, rag: "RED", owner: "Logistics", confidence: "HIGH" },
      { supplier: "Cloud Vendor", impact: "medium", probability: "medium", category: "Cyber", score: 9, rag: "AMBER", confidence: "MEDIUM" },
    ],
    trafficLight: { rag: "AMBER", rationale: "One critical RED on logistics; mitigation in flight.", boardNotificationRequired: false },
  },
  scenarioComparison: {
    scenarios: [
      { id: "Conservative", name: "Conservative", color: "#10b981" },
      { id: "Aggressive", name: "Aggressive", color: "#6366f1" },
      { id: "Hybrid", name: "Hybrid", color: "#8b5cf6" },
    ],
    radarData: [
      { metric: "Cost Saving", Conservative: 60, Aggressive: 95, Hybrid: 80 },
      { metric: "Risk", Conservative: 30, Aggressive: 75, Hybrid: 50 },
      { metric: "Speed", Conservative: 40, Aggressive: 90, Hybrid: 70 },
      { metric: "Quality", Conservative: 85, Aggressive: 60, Hybrid: 78 },
      { metric: "Flexibility", Conservative: 50, Aggressive: 80, Hybrid: 75 },
    ],
    summary: [
      { criteria: "Year-1 savings", Conservative: "€120k", Aggressive: "€280k", Hybrid: "€210k" },
      { criteria: "Implementation risk", Conservative: "Low", Aggressive: "High", Hybrid: "Medium" },
      { criteria: "Time to value", Conservative: "9 mo", Aggressive: "4 mo", Hybrid: "6 mo" },
    ],
  },
  supplierScorecard: {
    suppliers: [
      { name: "Supplier A", score: 82, trend: "up", spend: "€2.1M" },
      { name: "Supplier B", score: 74, trend: "stable", spend: "€1.4M" },
      { name: "Supplier C", score: 61, trend: "down", spend: "€900k" },
      { name: "Supplier D", score: 88, trend: "up", spend: "€450k" },
    ],
  },
  sowAnalysis: {
    clarity: 72,
    sections: [
      { name: "Scope of Work", status: "complete", note: "Clear deliverables with measurable outcomes." },
      { name: "Acceptance Criteria", status: "partial", note: "Defined for milestones 1-3; missing for 4-5." },
      { name: "Service Levels", status: "missing", note: "No quantified SLAs or penalty clauses." },
      { name: "Change Control", status: "complete", note: "Standard CR process referenced." },
      { name: "Pricing Model", status: "partial", note: "T&M caps unclear beyond Q2." },
    ],
    recommendations: [
      "Add quantitative SLAs with credit regime",
      "Tighten acceptance criteria for milestones 4-5",
      "Cap T&M with not-to-exceed ceilings per phase",
    ],
  },
  negotiationPrep: {
    batna: { strength: 7, description: "Supplier_B quoted €39.80 with comparable specs and 4-week lead time." },
    leveragePoints: [
      { point: "Volume commitment", tactic: "Offer 18-month forecast in exchange for step-down pricing." },
      { point: "Payment terms", tactic: "Trade 60-day terms for additional 2% discount." },
      { point: "Multi-year deal", tactic: "3-year term with annual CPI cap at 2%." },
    ],
    sequence: [
      { step: "1. Anchor", detail: "Open at €34.50 referencing should-cost model." },
      { step: "2. Trade", detail: "Concede on lead time in exchange for unit price." },
      { step: "3. Lock", detail: "Secure CPI cap before signing volume commitment." },
    ],
  },
  dataQuality: {
    fields: [
      { field: "Spend taxonomy", status: "complete", coverage: 96 },
      { field: "Supplier master", status: "partial", coverage: 78 },
      { field: "Tier-2 dependencies", status: "missing", coverage: 22 },
      { field: "Payment terms", status: "complete", coverage: 91 },
      { field: "Compliance attestations", status: "partial", coverage: 64 },
    ],
    limitations: [
      { title: "Tier-2 visibility", impact: "Concentration analysis relies on declared rather than verified flows." },
      { title: "Compliance freshness", impact: "12% of attestations older than 12 months." },
    ],
  },
  shouldCostGap: {
    components: [
      { name: "Raw material", currentPricePct: 42, benchmarkPct: 38, gapPct: 4, confidence: "HIGH" },
      { name: "Labor", currentPricePct: 24, benchmarkPct: 22, gapPct: 2, confidence: "MEDIUM" },
      { name: "Overhead", currentPricePct: 16, benchmarkPct: 14, gapPct: 2, confidence: "MEDIUM" },
      { name: "Logistics", currentPricePct: 6, benchmarkPct: 6, gapPct: 0, confidence: "HIGH" },
      { name: "Margin", currentPricePct: 12, benchmarkPct: 8, gapPct: 4, confidence: "HIGH" },
    ],
    negotiationAnchor: {
      currentPrice: 42.50,
      shouldCostTarget: 36.00,
      headroomPct: 15.3,
      rationale: "Benchmark + cost build justifies €36.00 anchor with comfortable supplier margin.",
    },
    supplierMarginPct: 12,
    benchmarkMarginPct: 8,
    currency: "€",
  },
  savingsRealizationFunnel: {
    baselineVerified: true,
    cfoAcceptance: "GREEN",
    funnel: [
      { stage: "Baseline", hard: 500000, soft: 0, avoided: 0 },
      { stage: "Identified", hard: 320000, soft: 80000, avoided: 60000 },
      { stage: "Committed", hard: 240000, soft: 60000, avoided: 50000 },
      { stage: "Realized", hard: 180000, soft: 35000, avoided: 40000 },
    ],
    hardAnnualised: 180000,
    softAnnualised: 35000,
    avoidedProtected: 40000,
    currency: "€",
    lowConfidenceWatermark: false,
  },
  workingCapitalDpo: {
    current_weighted_dpo: 38,
    target_weighted_dpo: 60,
    working_capital_delta_eur: 1400000,
    annual_spend_eur: 23000000,
    terms_distribution: [
      { term_label: "NET 14", spend_share_pct: 18, supplier_count: 24 },
      { term_label: "NET 30", spend_share_pct: 42, supplier_count: 86 },
      { term_label: "NET 45", spend_share_pct: 24, supplier_count: 32 },
      { term_label: "NET 60", spend_share_pct: 12, supplier_count: 18 },
      { term_label: "NET 90+", spend_share_pct: 4, supplier_count: 5 },
    ],
    by_supplier: [
      { supplier_label: "Supplier A", category: "Hardware", payment_terms_days: 30, annual_spend: 2100000, late_payment_directive_risk: false },
      { supplier_label: "Supplier B", category: "Hardware", payment_terms_days: 45, annual_spend: 1400000, late_payment_directive_risk: false },
      { supplier_label: "Logistics Co", category: "Services", payment_terms_days: 14, annual_spend: 900000, late_payment_directive_risk: true },
      { supplier_label: "Cloud Vendor", category: "SaaS", payment_terms_days: 30, annual_spend: 850000, late_payment_directive_risk: false },
    ],
    early_payment_discount_opportunities: [
      { supplier_label: "Supplier A", discount_structure: "2/10 NET 30", annualised_value: 38000 },
      { supplier_label: "Supplier B", discount_structure: "1/15 NET 45", annualised_value: 12000 },
    ],
    currency: "€",
  },
  supplierConcentrationMap: {
    categories: [
      { category_id: "hw", category_name: "Hardware", hhi: 2850, hhi_interpretation: "HIGH", annual_spend: 3500000 },
      { category_id: "svc", category_name: "Services", hhi: 1800, hhi_interpretation: "MODERATE", annual_spend: 1900000 },
      { category_id: "saas", category_name: "SaaS", hhi: 4200, hhi_interpretation: "HIGH", annual_spend: 1200000 },
    ],
    flows: [
      { source: "Supplier A", target: "EXOS", value: 2100000, tier: 1, single_source_flag: true },
      { source: "Supplier B", target: "EXOS", value: 1400000, tier: 1, single_source_flag: false },
      { source: "Foundry X", target: "Supplier A", value: 900000, tier: 2, single_source_flag: true },
    ],
    suppliers: [
      { supplier_label: "Supplier A", geography: "DE", total_spend: 2100000, category_count: 2, exit_cost_estimate: 350000, exit_cost_rationale: "Tooling + qualification" },
      { supplier_label: "Supplier B", geography: "PL", total_spend: 1400000, category_count: 1, exit_cost_estimate: 120000, exit_cost_rationale: "Re-qualification only" },
      { supplier_label: "Cloud Vendor", geography: "US", total_spend: 850000, category_count: 1, exit_cost_estimate: 220000, exit_cost_rationale: "Data egress + migration" },
    ],
    tier2_dependencies: [
      { tier1_supplier: "Supplier A", tier2_supplier: "Foundry X", dependency_description: "Sole foundry for ADC12 castings." },
    ],
    geographic_concentration: [
      { country_code: "DE", spend_share_pct: 48 },
      { country_code: "PL", spend_share_pct: 22 },
      { country_code: "US", spend_share_pct: 18 },
      { country_code: "CN", spend_share_pct: 12 },
    ],
    currency: "€",
  },
  rfpPackage: {
    extractedBrief: {
      summary: "Sourcing of custom aluminium sensor housings, 12k units/yr, 3-year term.",
      scopeType: "GOODS",
      packageType: "RFP",
      volume: "12,000 units/yr",
      locations: ["Southern Germany", "Poland"],
      annualBudgetEur: 510000,
      incumbentStatus: "Performance acceptable, price above benchmark",
      mandatoryCompliance: ["ISO 9001", "REACH", "RoHS"],
      deadlines: { rfpIssue: "2026-05-25", questionsDue: "2026-06-05", submissionDue: "2026-06-20", awardTarget: "2026-07-15", goLiveTarget: "2026-09-01" },
    },
    tenderDocument: {
      type: "RFP",
      title: "RFP — Custom Aluminium Sensor Housings",
      sections: [
        { heading: "1. Background & Objectives", content: "EXOS seeks a manufacturing partner for ADC12 housings with CNC finishing.", mandatory: true },
        { heading: "2. Scope of Supply", content: "Annual volume 12k units, 3-year term, optional 1+1 extension.", mandatory: true },
        { heading: "3. Technical Requirements", content: "Drawing pack DR-2026-114; tolerances ±0.05mm; anodised finish.", mandatory: true },
        { heading: "4. Commercial Terms", content: "Firm pricing Y1; CPI cap 2% Y2-Y3.", mandatory: true },
      ],
    },
    evaluationMatrix: {
      scoringScale: "1-5",
      criteria: [
        { name: "Price", weightPct: 40, subCriteria: [{ name: "Unit price", weightPct: 30 }, { name: "Tooling", weightPct: 10 }] },
        { name: "Quality", weightPct: 30, subCriteria: [{ name: "PPM history", weightPct: 15 }, { name: "Capability index", weightPct: 15 }] },
        { name: "Risk", weightPct: 20, subCriteria: [{ name: "Financial", weightPct: 10 }, { name: "Operational", weightPct: 10 }] },
        { name: "Sustainability", weightPct: 10, subCriteria: [{ name: "Recycled content", weightPct: 5 }, { name: "Energy mix", weightPct: 5 }] },
      ],
      totalWeightCheck: 100,
      weightsBalanced: true,
      minimumQualifyingScore: 60,
    },
    clarifications: [
      { question: "Is residual tooling owned by EXOS at end of term?", whyItMatters: "Affects switching cost.", severity: "HIGH", field: "Commercial" },
      { question: "Confirm capacity headroom for +20% volume.", whyItMatters: "Growth flexibility.", severity: "MEDIUM" },
    ],
    suggestedAttachments: [
      { name: "Drawing pack DR-2026-114", purpose: "Technical specification", templateAvailable: true },
      { name: "Pricing schedule template", purpose: "Standardised quote format", templateAvailable: true },
      { name: "Supplier qualification questionnaire", purpose: "Risk & compliance baseline", templateAvailable: true },
    ],
    deliverablesCoverage: { delivered: 9, total: 11, missing: ["Sustainability annex", "Cyber attestation"] },
  },
  npvWaterfall: {
    options: [
      { id: "buy", name: "Buy Outright", color: "#184d48", capexNominal: 480000, opexNominal: 90000, residualValue: 60000, npv: -420000, waccPct: 8, breakEvenYear: 4, ifrsOnBalanceSheet: true },
      { id: "lease", name: "3-Year Lease", color: "#3e988f", capexNominal: 0, opexNominal: 540000, residualValue: 0, npv: -460000, waccPct: 8, breakEvenYear: null, ifrsOnBalanceSheet: true },
      { id: "subs", name: "Subscription", color: "#ce8b16", capexNominal: 0, opexNominal: 620000, residualValue: 0, npv: -510000, waccPct: 8, breakEvenYear: null, ifrsOnBalanceSheet: false },
    ],
    preferredOptionId: "buy",
    verdict: "BUY",
    cashFlowRationale: "Buy delivers best NPV with manageable capex and tax shield benefit.",
    currency: "€",
  },
  ifrs16Impact: {
    options: [
      { id: "buy", name: "Buy Outright", color: "#184d48", onBalanceSheet: true, rightOfUseAsset: 0, leaseLiability: 0, taxShieldValue: 38000, plTreatment: "Depreciation + interest", balanceSheetImpact: "Asset capitalised, no lease liability." },
      { id: "lease", name: "3-Year Lease", color: "#3e988f", onBalanceSheet: true, rightOfUseAsset: 480000, leaseLiability: 480000, taxShieldValue: 22000, plTreatment: "Depreciation + interest", balanceSheetImpact: "ROU asset and matching liability under IFRS 16." },
      { id: "subs", name: "Subscription", color: "#ce8b16", onBalanceSheet: false, rightOfUseAsset: null, leaseLiability: null, taxShieldValue: 12000, plTreatment: "Operating expense", balanceSheetImpact: "Off-balance-sheet; pure opex." },
    ],
    ifrs16Note: "Subscription qualifies as a service contract — outside IFRS 16 scope.",
    currency: "€",
  },
};

const MOCK_ANALYSIS = `${ANALYSIS_PROSE}\n\n<dashboard-data>${JSON.stringify(DASHBOARD_MOCK)}</dashboard-data>\n`;

const MOCK_FORM_DATA: Record<string, string> = {
  "Industry Context":
    "Mid-market industrial SaaS provider with hardware-enabled IoT product line. Series B, expanding across EU, SOC2 Type 2 mandated.",
  "Product Specification":
    "Custom aluminium housing for industrial sensor • Material: ADC12 • Weight: 850g • Manufacturing: Die-cast + CNC • Anodised • ±0.05mm.",
  "Supplier Quote":
    "€42.50 per unit • MOQ 1,000 • Lead time 6-8 weeks • NET 30 • Tooling €15,000 • Southern Germany.",
  "Competitor Benchmark": "Supplier_B €39.80 / Supplier_C €38.40",
  "Target Price": "€36.00 per unit",
  "Strategy": "Balanced — maintain supplier relationship while achieving cost savings",
};

// Compact 2-dashboard preset (existing flow)
const COMPACT_DASHBOARDS: DashboardType[] = ["cost-waterfall", "tco-comparison"];

// Full set — every dashboard in alphabetical UI order
const ALL_DASHBOARDS: DashboardType[] = [
  "action-checklist",
  "cost-waterfall",
  "data-quality",
  "decision-matrix",
  "ifrs16-impact",
  "kraljic-quadrant",
  "license-tier",
  "negotiation-prep",
  "npv-waterfall",
  "rfp-package",
  "risk-heatmap",
  "savings-realization-funnel",
  "scenario-comparison",
  "sensitivity-spider",
  "should-cost-gap",
  "sow-analysis",
  "supplier-concentration-map",
  "supplier-scorecard",
  "tco-comparison",
  "timeline-roadmap",
  "working-capital-dpo",
];

const DASHBOARD_BATCHES: DashboardType[][] = [
  ALL_DASHBOARDS.slice(0, 7),
  ALL_DASHBOARDS.slice(7, 14),
  ALL_DASHBOARDS.slice(14),
];

const PdfTestPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<DashboardType[]>(DASHBOARD_BATCHES[0]);

  const openWith = (dashboards: DashboardType[]) => {
    setSelected(dashboards);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold text-foreground">PDF Formatting Test</h1>
          <p className="text-muted-foreground">
            Generate actual PDF previews against synthetic data. The full suite is
            split into CPU-safe batches so every dashboard renderer can be inspected.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button size="lg" variant="outline" className="gap-2" onClick={() => openWith(COMPACT_DASHBOARDS)}>
              <FileText className="w-5 h-5" />
              Compact (2 dashboards)
            </Button>
            <Button size="lg" className="gap-2" onClick={() => openWith(DASHBOARD_BATCHES[0])}>
              <Layers className="w-5 h-5" />
              Batch 1 ({DASHBOARD_BATCHES[0].length})
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {DASHBOARD_BATCHES.map((batch, index) => (
              <Button key={index} variant="secondary" className="gap-2" onClick={() => openWith(batch)}>
                <Layers className="w-4 h-4" />
                Batch {index + 1} ({batch.length})
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            Synthetic scenario — not tied to any real engagement. Open each batch to
            inspect all {ALL_DASHBOARDS.length} dashboards without exhausting edge compute.
          </p>
        </div>
      </main>

      <PDFPreviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        scenarioTitle="EXOS Design QA — Full Dashboard Suite"
        analysisResult={MOCK_ANALYSIS}
        formData={MOCK_FORM_DATA}
        timestamp={new Date().toISOString()}
        selectedDashboards={selected}
      />
    </div>
  );
};

export default PdfTestPage;
