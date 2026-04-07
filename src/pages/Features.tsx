import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Brain, Database, ArrowRight, Lock, Mail, Scale, DollarSign, ShieldAlert, CalendarClock, FileText, Layers, TrendingUp } from "lucide-react";
import SiteFeedbackButton from "@/components/feedback/SiteFeedbackButton";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataFlowDiagram from "@/components/features/DataFlowDiagram";
import SentinelCapabilities from "@/components/features/SentinelCapabilities";
import exosMark from "@/assets/exos-mark.svg";
import exosMarkDark from "@/assets/exos-mark-dark.svg";
import { useTheme } from "next-themes";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useUser } from "@/hooks/useUser";
import AuthPrompt from "@/components/auth/AuthPrompt";
import { dashboardConfigs, DashboardType } from "@/lib/dashboard-mappings";
import { getDashboardScenarioCount } from "@/lib/dashboard-scenario-mapping";
import DashboardContextCard from "@/components/reports/DashboardContextCard";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { LucideIcon } from "lucide-react";


// -- Dashboard sample data & config (moved from Reports) ---------------------

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

const Features = () => {
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const { isSuperAdmin } = useAdminAuth();
  const { user, isLoading: isAuthLoading } = useUser();
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardType>("decision-matrix");

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    }
  }, [location.hash]);

  const valuePropositions = [
    {
      icon: Layers,
      title: "Scenarios",
      description: "Pre-defined agentic AI flows enriched with procurement methodological layer, agentic loops, and custom LLM settings.",
      highlights: [
        "29 procurement-specific AI scenarios",
        "Multi-cycle Chain of Experts pipeline",
        "Methodology-driven agentic loops",
        "Custom LLM settings per scenario"
      ]
    },
    {
      icon: Database,
      title: "Market Intelligence & Knowledge Base",
      description: "Use Market Intelligence as a self-sufficient tool or inject live market context from our Knowledge Base directly into AI results — benchmarks, risks, pricing signals, regulatory shifts.",
      highlights: [
        "Live supplier & category intelligence",
        "30+ industry grounding profiles",
        "30+ category strategy frameworks",
        "Cited sources for full transparency"
      ]
    },
    {
      icon: TrendingUp,
      title: "Inflation Monitor & Risk Assessment Platform",
      description: "Continuously track the noise, surface what's changed, and flag only what requires your decision.",
      highlights: [
        "Automated inflation driver scanning",
        "Risk event detection & alerting",
        "Bridge scenario recommendations",
        "Continuous monitoring cadence"
      ]
    },
    {
      icon: Lock,
      title: "Commercial Data Safety",
      description: "Your sensitive commercial data is masked before reaching external APIs — then grounded and validated on the way back.",
      highlights: [
        "Semantic anonymization of commercial data",
        "PII and financial identifier masking",
        "Enterprise InfoSec Gate for traffic audit",
        "Full data restoration after AI processing"
      ],
      link: "/architecture"
    }
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />
      
      <Header />
      
      <main className="container py-8 relative">
        {/* Hero heading */}
        <section className="mb-10 animate-fade-up text-center">
          <div className="flex justify-center mb-4">
            <img src={resolvedTheme === 'dark' ? exosMarkDark : exosMark} <img src={resolvedTheme === 'dark' ? exosMarkDark : exosMark} alt="EXOS procurement platform logo" className="h-24 md:h-32 w-auto object-contain" /> className="h-24 md:h-32 w-auto object-contain" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            How EXOS <span className="text-gradient">Works</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto mb-4">
            Critical procurement decisions are often made without adequate preparation due to lack of time, knowledge, or a specialised function. EXOS gives you AI-powered analysis in minutes — cost breakdowns, negotiation scenarios, risk assessments — enriched with industry knowledge and online market intelligence.
          </p>
        </section>

        {/* Value Props */}
        <section className="mb-20">
          <div className="space-y-4">
            {valuePropositions.map((prop, index) => (
              <Card 
                key={prop.title} 
                className="card-elevated animate-fade-up border-border/50"
                style={{ animationDelay: `${100 + index * 80}ms` }}
              >
                <div className="flex items-start gap-4 p-5">
                  <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <prop.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold mb-1">{prop.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{prop.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {prop.highlights.map((h) => (
                        <span key={h} className="flex items-center gap-1.5 text-xs text-foreground/70">
                          <ArrowRight className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                          {h}
                        </span>
                      ))}
                    </div>
                    {"link" in prop && prop.link && (
                      <NavLink
                        to={prop.link as string}
                        className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        Learn about EXOS architecture
                        <ArrowRight className="w-3 h-3" />
                      </NavLink>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Sentinel Capabilities Section */}
        <section id="orchestration" className="mb-20 animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Fine-Tuned <span className="text-gradient">AI Agentic Orchestration</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our custom-trained intelligence layer validates, enriches, and orchestrates 
              best-in-class cloud AI—ensuring every recommendation is grounded in your reality.
            </p>
          </div>
          
          <SentinelCapabilities />
        </section>

        {/* Architecture Deep-Dive Section */}
        <section id="architecture" className="mb-20 animate-fade-up" style={{ animationDelay: "350ms" }}>
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Enterprise <span className="text-gradient">Architecture</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A purpose-built, privacy-first AI backend designed for high-stakes procurement decisions 
              in regulated European industries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="card-elevated border-border/50">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-2">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <CardTitle className="font-display text-lg">Agentic Structure & Chain of Experts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  EXOS employs an <strong className="text-foreground">agentic structure</strong> where 
                  specialized AI agents collaborate in a server-side <strong className="text-foreground">Chain of Experts</strong> pipeline. 
                  For complex financial scenarios, a 3-cycle flow — Analyst → Auditor → Synthesizer — ensures 
                  every recommendation is rigorously challenged, mathematically verified, and synthesized into 
                  actionable intelligence before reaching the user.
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated border-border/50">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-2">
                  <Lock className="w-5 h-5 text-primary-foreground" />
                </div>
                <CardTitle className="font-display text-lg">Anti-Hallucination & Grounding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every AI output passes through a multi-layer <strong className="text-foreground">anti-hallucination</strong> framework. 
                  Server-side <strong className="text-foreground">grounding</strong> injects live market data, industry KPIs, 
                  and regulatory context directly into prompts. Post-inference <strong className="text-foreground">validation</strong> cross-checks 
                  arithmetic (ROI, NPV, break-even), flags unsupported claims, and enforces separation 
                  of hard vs. soft savings — ensuring outputs you can trust in boardroom presentations.
                </p>
              </CardContent>
            </Card>
          </div>

          {isSuperAdmin && (
            <div className="text-center">
              <NavLink
                to="/architecture"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Explore full architecture diagram
                <ArrowRight className="w-4 h-4" />
              </NavLink>
            </div>
          )}
        </section>

        {/* Data Flow Section */}
        <section id="dataflow" className="mb-20 animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Privacy-First <span className="text-gradient">Data Flow</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Your data passes through multiple protection layers before reaching cloud AI, 
              ensuring sensitive commercial information never leaves your control.
            </p>
          </div>
          
          <DataFlowDiagram />
        </section>


        {/* Dashboards Section */}
        <section id="dashboards" className="mb-20 animate-fade-up" style={{ animationDelay: "450ms" }}>
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
              <span className="text-gradient">Dashboards</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              EXOS dashboards — empowering your decision-making with transparency.
            </p>
            <a href="/samples/EXOS_Specification_Optimizer_2026-02-28.pdf" download="EXOS_Report_Sample.pdf" className="inline-block mt-4">
              <Button variant="outline" size="sm" className="gap-2 shadow-[0_2px_0_0_hsl(var(--border)),0_4px_12px_-4px_hsl(var(--foreground)/0.08)] hover:shadow-[0_2px_0_0_hsl(var(--primary)/0.4),0_6px_16px_-4px_hsl(var(--primary)/0.12)] hover:border-primary/50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_1px_0_0_hsl(var(--border)),0_2px_4px_-2px_hsl(var(--foreground)/0.06)] transition-all duration-300">
                <FileText className="h-4 w-4" />
                Download Report Sample
              </Button>
            </a>
          </div>

          {/* Guide Me — 4-category cards */}
          <div className="mb-8">
            <h3 className="exos-label-caps mb-3">What are you trying to decide?</h3>
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
          </div>

          {/* Mobile: Grouped select dropdown */}
          <div className="md:hidden mb-6">
            <Select value={selectedDashboard} onValueChange={(v) => setSelectedDashboard(v as DashboardType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dashboardCategories.map((cat) => (
                  <SelectGroup key={cat.label}>
                    <SelectLabel className="exos-label-caps">{cat.label}</SelectLabel>
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
          <div className="hidden md:grid md:grid-cols-4 md:gap-8 mb-8">
            <nav className="md:col-span-1 space-y-6">
              {dashboardCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.label}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="exos-label-caps">{cat.label}</h3>
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
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{count}</Badge>
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
            <div className="md:col-span-3">
              <DashboardContextCard dashboardId={selectedDashboard} config={dashboardConfigs[selectedDashboard]} />
              {renderDashboard(selectedDashboard)}
            </div>
          </div>

          {/* Mobile content */}
          <div className="md:hidden mb-8">
            <DashboardContextCard dashboardId={selectedDashboard} config={dashboardConfigs[selectedDashboard]} />
            {renderDashboard(selectedDashboard)}
          </div>
        </section>

        <section className="text-center py-16 flex items-center justify-center gap-4 flex-wrap">
          <SiteFeedbackButton scenarioId="features" />
          <a href="/pricing#contact">
            <Button size="lg" className="text-lg px-8 py-6 gap-2">
              Get in Touch
              <Mail className="w-5 h-5" />
            </Button>
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Features;
