import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import AuthPrompt from "@/components/auth/AuthPrompt";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { dashboardConfigs, DashboardType } from "@/lib/dashboard-mappings";
import { getDashboardScenarioCount } from "@/lib/dashboard-scenario-mapping";
import DashboardContextCard from "@/components/reports/DashboardContextCard";
import { Scale, DollarSign, ShieldAlert, CalendarClock, FileText, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

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

// Category grouping
interface DashboardCategory {
  label: string;
  icon: LucideIcon;
  description: string;
  dashboards: { id: DashboardType; subtitle: string }[];
}

const dashboardCategories: DashboardCategory[] = [
  {
    label: "Decision Support",
    icon: Scale,
    description: "Evaluate vendors, make-vs-buy, or strategic alternatives",
    dashboards: [
      { id: "decision-matrix", subtitle: "Weighted criteria scoring" },
      { id: "scenario-comparison", subtitle: "Side-by-side scenario analysis" },
      { id: "kraljic-quadrant", subtitle: "Supplier strategic positioning" },
      { id: "negotiation-prep", subtitle: "Leverage & BATNA planning" },
    ],
  },
  {
    label: "Cost Analysis",
    icon: DollarSign,
    description: "Break down spend, model TCO, and stress-test assumptions",
    dashboards: [
      { id: "cost-waterfall", subtitle: "Component cost breakdown" },
      { id: "tco-comparison", subtitle: "Total cost of ownership" },
      { id: "license-tier", subtitle: "License cost distribution" },
      { id: "sensitivity-spider", subtitle: "Assumption stress testing" },
    ],
  },
  {
    label: "Risk & Compliance",
    icon: ShieldAlert,
    description: "Assess supply risks, contract gaps, and data reliability",
    dashboards: [
      { id: "risk-matrix", subtitle: "Probability × impact mapping" },
      { id: "sow-analysis", subtitle: "Scope & contract gap analysis" },
      { id: "data-quality", subtitle: "Analysis reliability scoring" },
    ],
  },
  {
    label: "Planning & Performance",
    icon: CalendarClock,
    description: "Build timelines, track actions, and monitor suppliers",
    dashboards: [
      { id: "action-checklist", subtitle: "Prioritized action tracking" },
      { id: "timeline-roadmap", subtitle: "Implementation milestones" },
      { id: "supplier-scorecard", subtitle: "Supplier performance metrics" },
    ],
  },
];

// Render the active dashboard content
const renderDashboard = (id: DashboardType) => {
  switch (id) {
    case "action-checklist":
      return <ActionChecklistDashboard title="Volume Consolidation Actions" subtitle="Supplier rationalization roadmap" actions={volumeConsolidationActions} />;
    case "decision-matrix":
      return <DecisionMatrixDashboard title="Make vs Buy Analysis" subtitle="Strategic sourcing decision" criteria={makeVsBuyCriteria} options={makeVsBuyOptions} />;
    case "cost-waterfall":
      return <CostWaterfallDashboard title="TCO Analysis: Industrial Equipment" subtitle="5-year total cost of ownership" components={tcoCostBreakdown} currency="$" />;
    case "timeline-roadmap":
      return <TimelineRoadmapDashboard />;
    case "kraljic-quadrant":
      return <KraljicQuadrantDashboard />;
    case "tco-comparison":
      return <TCOComparisonDashboard />;
    case "license-tier":
      return <LicenseTierDashboard />;
    case "sensitivity-spider":
      return <SensitivitySpiderDashboard />;
    case "risk-matrix":
      return <RiskMatrixDashboard />;
    case "scenario-comparison":
      return <ScenarioComparisonDashboard />;
    case "supplier-scorecard":
      return <SupplierPerformanceDashboard />;
    case "sow-analysis":
      return <SOWAnalysisDashboard />;
    case "negotiation-prep":
      return <NegotiationPrepDashboard />;
    case "data-quality":
      return <DataQualityDashboard />;
    default:
      return null;
  }
};

const Reports = () => {
  const { user, isLoading: isAuthLoading } = useUser();
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardType>("decision-matrix");

  if (isAuthLoading) {
    return (
      <div className="min-h-screen gradient-hero">
        <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
        <Header />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen gradient-hero">
        <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
        <Header />
        <main className="container py-16 relative">
          <AuthPrompt
            feature="Reports & Dashboards"
            description="View your procurement analysis reports and performance dashboards"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
      <Header />

      <main className="container py-8 relative">
        {/* Hero */}
        <section className="mb-8 animate-fade-up">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            <span className="text-gradient">Dashboards</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            EXOS dashboards — empowering your decision-making with transparency.
          </p>
          <a href="/samples/EXOS_Specification_Optimizer_2026-02-28.pdf" download="EXOS_Report_Sample.pdf" className="inline-block mt-4">
            <Button variant="outline" size="sm" className="gap-2 shadow-[0_2px_0_0_hsl(var(--border)),0_4px_12px_-4px_hsl(var(--foreground)/0.08)] hover:shadow-[0_2px_0_0_hsl(var(--primary)/0.4),0_6px_16px_-4px_hsl(var(--primary)/0.12)] hover:border-primary/50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_1px_0_0_hsl(var(--border)),0_2px_4px_-2px_hsl(var(--foreground)/0.06)] transition-all duration-300">
              <FileText className="h-4 w-4" />
              Download Report Sample
            </Button>
          </a>
        </section>

        {/* Guide Me — 4-category cards */}
        <section className="mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <h2 className="exos-label-caps mb-3">
            What are you trying to decide?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {dashboardCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.dashboards.some((d) => d.id === selectedDashboard);
              return (
                <button
                  key={cat.label}
                  onClick={() => setSelectedDashboard(cat.dashboards[0].id)}
                  className={`group rounded-xl border p-3 text-left transition-all duration-300
                    bg-card shadow-[0_2px_0_0_hsl(var(--border)),0_4px_12px_-4px_hsl(var(--foreground)/0.08)]
                    hover:shadow-[0_2px_0_0_hsl(var(--primary)/0.4),0_6px_16px_-4px_hsl(var(--primary)/0.12)] hover:border-primary/50 hover:-translate-y-0.5
                    active:translate-y-0 active:shadow-[0_1px_0_0_hsl(var(--border)),0_2px_4px_-2px_hsl(var(--foreground)/0.06)]
                    ${isActive ? "border-primary/60 bg-primary/10 ring-1 ring-primary/30" : "border-border/60"}`}
                >
                  <Icon className={`h-5 w-5 mb-2 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"}`} />
                  <p className="text-sm font-medium text-foreground">{cat.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden md:block">{cat.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Mobile: Grouped select dropdown */}
        <div className="md:hidden mb-6">
          <Select value={selectedDashboard} onValueChange={(v) => setSelectedDashboard(v as DashboardType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dashboardCategories.map((cat) => (
                <SelectGroup key={cat.label}>
                  <SelectLabel className="exos-label-caps">
                    {cat.label}
                  </SelectLabel>
                  {cat.dashboards.map((d) => {
                    const config = dashboardConfigs[d.id];
                    const count = getDashboardScenarioCount(d.id);
                    return (
                      <SelectItem key={d.id} value={d.id}>
                        {config.name}{count > 0 ? ` (${count})` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Master-detail layout */}
        <section className="hidden md:grid md:grid-cols-4 md:gap-8 mb-8">
          {/* Sidebar */}
          <nav className="md:col-span-1 space-y-6">
            {dashboardCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="exos-label-caps">
                      {cat.label}
                    </h3>
                  </div>
                  <div className="space-y-0.5">
                    {cat.dashboards.map((d) => {
                      const isActive = selectedDashboard === d.id;
                      const config = dashboardConfigs[d.id];
                      const count = getDashboardScenarioCount(d.id);
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDashboard(d.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 border-l-2 ${
                            isActive
                              ? "border-l-primary bg-muted text-foreground"
                              : "border-l-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{config.name}</span>
                            {count > 0 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                {count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{d.subtitle}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Content */}
          <div className="md:col-span-3">
            <DashboardContextCard dashboardId={selectedDashboard} config={dashboardConfigs[selectedDashboard]} />
            {renderDashboard(selectedDashboard)}
          </div>
        </section>

        {/* Mobile content */}
        <section className="md:hidden mb-8">
          <DashboardContextCard dashboardId={selectedDashboard} config={dashboardConfigs[selectedDashboard]} />
          {renderDashboard(selectedDashboard)}
        </section>
      </main>
    </div>
  );
};

export default Reports;
