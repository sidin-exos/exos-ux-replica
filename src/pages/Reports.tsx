import { useState } from "react";
import Header from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { dashboardConfigs, DashboardType } from "@/lib/dashboard-mappings";
import { getDashboardScenarioCount } from "@/lib/dashboard-scenario-mapping";
import DashboardContextCard from "@/components/reports/DashboardContextCard";
import { Scale, DollarSign, ShieldAlert, CalendarClock, DatabaseZap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dashboard components
import ActionChecklistDashboard from "@/components/reports/ActionChecklistDashboard";
import DecisionMatrixDashboard from "@/components/reports/DecisionMatrixDashboard";
import CostWaterfallDashboard from "@/components/reports/CostWaterfallDashboard";
import TimelineRoadmapDashboard from "@/components/reports/TimelineRoadmapDashboard";
import KraljicQuadrantDashboard from "@/components/reports/KraljicQuadrantDashboard";
import TCOComparisonDashboard from "@/components/reports/TCOComparisonDashboard";
import LicenseTierDashboard from "@/components/reports/LicenseTierDashboard";
import SensitivitySpiderDashboard from "@/components/reports/SensitivitySpiderDashboard";
import RiskMatrixDashboard from "@/components/reports/RiskMatrixDashboard";
import ScenarioComparisonDashboard from "@/components/reports/ScenarioComparisonDashboard";
import SupplierPerformanceDashboard from "@/components/reports/SupplierPerformanceDashboard";
import SOWAnalysisDashboard from "@/components/reports/SOWAnalysisDashboard";
import NegotiationPrepDashboard from "@/components/reports/NegotiationPrepDashboard";
import DataQualityDashboard from "@/components/reports/DataQualityDashboard";

// Sample data for demos
const volumeConsolidationActions = [
  { id: 1, action: "Identify overlapping SKUs across suppliers", priority: "critical" as const, status: "done" as const, owner: "Category Lead", dueDate: "Completed" },
  { id: 2, action: "Request volume discount proposals from top 3 suppliers", priority: "critical" as const, status: "in-progress" as const, owner: "Sourcing", dueDate: "This week" },
  { id: 3, action: "Analyze transition risks for supplier consolidation", priority: "high" as const, status: "pending" as const, owner: "Risk Team", dueDate: "Next week" },
  { id: 4, action: "Develop dual-sourcing contingency plan", priority: "high" as const, status: "pending" as const, owner: "Operations", dueDate: "2 weeks" },
  { id: 5, action: "Negotiate extended payment terms", priority: "medium" as const, status: "pending" as const, owner: "Finance", dueDate: "3 weeks" },
];

const makeVsBuyCriteria = [
  { name: "Total Cost (5yr)", weight: 35 },
  { name: "Quality Control", weight: 25 },
  { name: "Time to Market", weight: 20 },
  { name: "Strategic Fit", weight: 12 },
  { name: "Flexibility", weight: 8 },
];

const makeVsBuyOptions = [
  { id: "make", name: "In-House", scores: [3, 5, 2, 4, 3] },
  { id: "buy", name: "Outsource", scores: [4, 4, 5, 3, 5] },
  { id: "hybrid", name: "Hybrid Model", scores: [4, 4, 4, 4, 4] },
];

const tcoCostBreakdown = [
  { name: "Equipment Purchase", value: 320000, type: "cost" as const },
  { name: "Installation", value: 45000, type: "cost" as const },
  { name: "Training", value: 28000, type: "cost" as const },
  { name: "Annual Maintenance (5yr)", value: 85000, type: "cost" as const },
  { name: "Energy Costs (5yr)", value: 62000, type: "cost" as const },
  { name: "Early Payment Discount", value: -16000, type: "reduction" as const },
  { name: "Trade-in Credit", value: -35000, type: "reduction" as const },
];

// All dashboard types for selection
const allDashboards: DashboardType[] = [
  "action-checklist",
  "decision-matrix",
  "cost-waterfall",
  "timeline-roadmap",
  "kraljic-quadrant",
  "tco-comparison",
  "license-tier",
  "sensitivity-spider",
  "risk-matrix",
  "scenario-comparison",
  "supplier-scorecard",
  "sow-analysis",
  "negotiation-prep",
  "data-quality",
];

// Guide Me categories
const guideCategories = [
  {
    label: "Compare Options",
    icon: Scale,
    dashboards: ["decision-matrix", "scenario-comparison", "tco-comparison"] as DashboardType[],
    description: "Evaluate vendors, make-vs-buy, or strategic alternatives",
  },
  {
    label: "Understand Costs",
    icon: DollarSign,
    dashboards: ["cost-waterfall", "tco-comparison", "sensitivity-spider"] as DashboardType[],
    description: "Break down spend, model TCO, and stress-test assumptions",
  },
  {
    label: "Manage Risk",
    icon: ShieldAlert,
    dashboards: ["risk-matrix", "supplier-scorecard", "sow-analysis"] as DashboardType[],
    description: "Assess supply risks, supplier health, and contract gaps",
  },
  {
    label: "Plan & Execute",
    icon: CalendarClock,
    dashboards: ["timeline-roadmap", "action-checklist", "negotiation-prep"] as DashboardType[],
    description: "Build timelines, track actions, and prepare negotiations",
  },
  {
    label: "Assess Data Quality",
    icon: DatabaseZap,
    dashboards: ["data-quality", "kraljic-quadrant"] as DashboardType[],
    description: "Understand analysis reliability and category positioning",
  },
];

const Reports = () => {
  const [selectedTab, setSelectedTab] = useState<DashboardType>("action-checklist");
  const [highlightedDashboards, setHighlightedDashboards] = useState<DashboardType[]>([]);

  const handleGuideClick = (dashboards: DashboardType[]) => {
    setHighlightedDashboards(dashboards);
    setSelectedTab(dashboards[0]);
    // Clear highlight after 3s
    setTimeout(() => setHighlightedDashboards([]), 3000);
  };

  return (
    <div className="min-h-screen gradient-hero">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      <Header />

      <main className="container py-8 relative">
        {/* Hero Section */}
        <section className="mb-8 animate-fade-up">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            <span className="text-gradient">Dashboards</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            EXOS dashboards — empowering your decision-making with transparency.
          </p>
          <a
            href="/samples/EXOS_Specification_Optimizer_2026-02-28.pdf"
            download="EXOS_Report_Sample.pdf"
            className="inline-block mt-4"
          >
            <Button variant="outline" size="sm" className="gap-2 shadow-[0_2px_0_0_hsl(var(--border)),0_4px_12px_-4px_hsl(var(--foreground)/0.08)] hover:shadow-[0_2px_0_0_hsl(var(--primary)/0.4),0_6px_16px_-4px_hsl(var(--primary)/0.12)] hover:border-primary/50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_1px_0_0_hsl(var(--border)),0_2px_4px_-2px_hsl(var(--foreground)/0.06)] transition-all duration-300">
              <FileText className="h-4 w-4" />
              Download Report Sample
            </Button>
          </a>
        </section>

        {/* Guide Me Section */}
        <section className="mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <h2 className="text-sm font-medium text-foreground/70 uppercase tracking-wide mb-3">
            What are you trying to decide?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {guideCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = highlightedDashboards.length > 0 &&
                cat.dashboards.some(d => highlightedDashboards.includes(d));
              return (
                <button
                  key={cat.label}
                  onClick={() => handleGuideClick(cat.dashboards)}
                  className={`group rounded-xl border p-3 text-left transition-all duration-300
                    bg-card shadow-[0_2px_0_0_hsl(var(--border)),0_4px_12px_-4px_hsl(var(--foreground)/0.08)]
                    hover:shadow-[0_2px_0_0_hsl(var(--primary)/0.4),0_6px_16px_-4px_hsl(var(--primary)/0.12)] hover:border-primary/50 hover:-translate-y-0.5
                    active:translate-y-0 active:shadow-[0_1px_0_0_hsl(var(--border)),0_2px_4px_-2px_hsl(var(--foreground)/0.06)]
                    ${isActive
                      ? "border-primary/60 bg-primary/10 ring-1 ring-primary/30 shadow-[0_2px_0_0_hsl(var(--primary)/0.5),0_6px_20px_-4px_hsl(var(--primary)/0.15)] glow-effect"
                      : "border-border/60"
                    }`}
                >
                  <Icon className={`h-5 w-5 mb-2 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                  }`} />
                  <p className="text-sm font-medium text-foreground">{cat.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden md:block">{cat.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Dashboard Tabs */}
        <section className="mb-8">
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as DashboardType)} className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-secondary/30 p-1">
              {allDashboards.map((dashboardId) => {
                const config = dashboardConfigs[dashboardId];
                const count = getDashboardScenarioCount(dashboardId);
                const isHighlighted = highlightedDashboards.includes(dashboardId);
                return (
                  <TabsTrigger
                    key={dashboardId}
                    value={dashboardId}
                    className={`text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all ${
                      isHighlighted ? "ring-2 ring-primary/50 bg-primary/10" : ""
                    }`}
                  >
                    {config.name}
                    {count > 0 && (
                      <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Action Checklist */}
            <TabsContent value="action-checklist">
              <DashboardContextCard dashboardId="action-checklist" config={dashboardConfigs["action-checklist"]} />
              <ActionChecklistDashboard
                title="Volume Consolidation Actions"
                subtitle="Supplier rationalization roadmap"
                actions={volumeConsolidationActions}
              />
            </TabsContent>

            {/* Decision Matrix */}
            <TabsContent value="decision-matrix">
              <DashboardContextCard dashboardId="decision-matrix" config={dashboardConfigs["decision-matrix"]} />
              <DecisionMatrixDashboard
                title="Make vs Buy Analysis"
                subtitle="Strategic sourcing decision"
                criteria={makeVsBuyCriteria}
                options={makeVsBuyOptions}
              />
            </TabsContent>

            {/* Cost Waterfall */}
            <TabsContent value="cost-waterfall">
              <DashboardContextCard dashboardId="cost-waterfall" config={dashboardConfigs["cost-waterfall"]} />
              <CostWaterfallDashboard
                title="TCO Analysis: Industrial Equipment"
                subtitle="5-year total cost of ownership"
                components={tcoCostBreakdown}
                currency="$"
              />
            </TabsContent>

            {/* Timeline Roadmap */}
            <TabsContent value="timeline-roadmap">
              <DashboardContextCard dashboardId="timeline-roadmap" config={dashboardConfigs["timeline-roadmap"]} />
              <TimelineRoadmapDashboard />
            </TabsContent>

            {/* Kraljic Quadrant */}
            <TabsContent value="kraljic-quadrant">
              <DashboardContextCard dashboardId="kraljic-quadrant" config={dashboardConfigs["kraljic-quadrant"]} />
              <KraljicQuadrantDashboard />
            </TabsContent>

            {/* TCO Comparison */}
            <TabsContent value="tco-comparison">
              <DashboardContextCard dashboardId="tco-comparison" config={dashboardConfigs["tco-comparison"]} />
              <TCOComparisonDashboard />
            </TabsContent>

            {/* License Tier */}
            <TabsContent value="license-tier">
              <DashboardContextCard dashboardId="license-tier" config={dashboardConfigs["license-tier"]} />
              <LicenseTierDashboard />
            </TabsContent>

            {/* Sensitivity Spider */}
            <TabsContent value="sensitivity-spider">
              <DashboardContextCard dashboardId="sensitivity-spider" config={dashboardConfigs["sensitivity-spider"]} />
              <SensitivitySpiderDashboard />
            </TabsContent>

            {/* Risk Matrix */}
            <TabsContent value="risk-matrix">
              <DashboardContextCard dashboardId="risk-matrix" config={dashboardConfigs["risk-matrix"]} />
              <RiskMatrixDashboard />
            </TabsContent>

            {/* Scenario Comparison */}
            <TabsContent value="scenario-comparison">
              <DashboardContextCard dashboardId="scenario-comparison" config={dashboardConfigs["scenario-comparison"]} />
              <ScenarioComparisonDashboard />
            </TabsContent>

            {/* Supplier Scorecard */}
            <TabsContent value="supplier-scorecard">
              <DashboardContextCard dashboardId="supplier-scorecard" config={dashboardConfigs["supplier-scorecard"]} />
              <SupplierPerformanceDashboard />
            </TabsContent>

            {/* SOW Analysis */}
            <TabsContent value="sow-analysis">
              <DashboardContextCard dashboardId="sow-analysis" config={dashboardConfigs["sow-analysis"]} />
              <SOWAnalysisDashboard />
            </TabsContent>

            {/* Negotiation Prep */}
            <TabsContent value="negotiation-prep">
              <DashboardContextCard dashboardId="negotiation-prep" config={dashboardConfigs["negotiation-prep"]} />
              <NegotiationPrepDashboard />
            </TabsContent>

            {/* Data Quality */}
            <TabsContent value="data-quality">
              <DashboardContextCard dashboardId="data-quality" config={dashboardConfigs["data-quality"]} />
              <DataQualityDashboard />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default Reports;
