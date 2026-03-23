import { ArrowLeft, Info, Mail } from "lucide-react";
import SiteFeedbackButton from "@/components/feedback/SiteFeedbackButton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Sample data for different scenarios
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

const DashboardShowcase = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm dark:bg-white/5 dark:border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/reports">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-xl font-semibold text-foreground">
                Dashboard Templates
              </h1>
              <p className="text-sm text-muted-foreground">
                Tableau-inspired visualization components
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-10">
        {/* Demo Mode Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <div className="text-sm">
            <span className="font-semibold text-blue-300">Demo Mode</span>
            <span className="text-blue-300/80"> — All data shown below is illustrative sample data for demonstration purposes. Run a scenario analysis to generate real insights.</span>
          </div>
        </div>
        {/* New Dashboards Section */}
        <section>
          <h2 className="text-lg font-display font-semibold text-foreground mb-2">
            New Dashboard Types
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            High-reuse templates designed for cross-scenario application
          </p>

          <Tabs defaultValue="checklist" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="checklist">Action Checklist</TabsTrigger>
              <TabsTrigger value="decision">Decision Matrix</TabsTrigger>
              <TabsTrigger value="waterfall">Cost Waterfall</TabsTrigger>
            </TabsList>

            <TabsContent value="checklist">
              <div className="grid lg:grid-cols-2 gap-6">
                <ActionChecklistDashboard
                  title="Volume Consolidation Actions"
                  subtitle="Supplier rationalization roadmap"
                  actions={volumeConsolidationActions}
                />
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-card border border-border/50">
                    <h3 className="font-medium text-foreground mb-2">Design Principles</h3>
                    <ul className="text-sm text-muted-foreground space-y-1.5">
                      <li>• Priority-grouped with visual hierarchy (Critical → Low)</li>
                      <li>• Status indicators with intuitive icons</li>
                      <li>• Progress tracking with completion percentage</li>
                      <li>• Owner & timeline metadata for accountability</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-border/50">
                    <h3 className="font-medium text-foreground mb-2">Scenario Usage</h3>
                    <p className="text-sm text-muted-foreground">
                      Used in <span className="text-primary font-medium">12 scenarios</span> including
                      Risk Assessment, Negotiation Prep, Project Planning, and Category Strategy.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="decision">
              <div className="grid lg:grid-cols-2 gap-6">
                <DecisionMatrixDashboard
                  title="Make vs Buy Analysis"
                  subtitle="Strategic sourcing decision"
                  criteria={makeVsBuyCriteria}
                  options={makeVsBuyOptions}
                />
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-card border border-border/50">
                    <h3 className="font-medium text-foreground mb-2">Design Principles</h3>
                    <ul className="text-sm text-muted-foreground space-y-1.5">
                      <li>• Weighted scoring with transparent calculation</li>
                      <li>• Color-coded performance indicators (5-point scale)</li>
                      <li>• Clear winner recommendation with visual emphasis</li>
                      <li>• Dot visualization for quick scanning</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-border/50">
                    <h3 className="font-medium text-foreground mb-2">Scenario Usage</h3>
                    <p className="text-sm text-muted-foreground">
                      Used in <span className="text-primary font-medium">9 scenarios</span> including
                      Make vs Buy, Supplier Discovery, Requirements Gathering, and SLA Definition.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="waterfall">
              <div className="grid lg:grid-cols-2 gap-6">
                <CostWaterfallDashboard
                  title="TCO Analysis: Industrial Equipment"
                  subtitle="5-year total cost of ownership"
                  components={tcoCostBreakdown}
                  currency="$"
                />
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-card border border-border/50">
                    <h3 className="font-medium text-foreground mb-2">Design Principles</h3>
                    <ul className="text-sm text-muted-foreground space-y-1.5">
                      <li>• Horizontal bar chart for easy comparison</li>
                      <li>• Visual distinction between costs and reductions</li>
                      <li>• Summary metrics with savings percentage</li>
                      <li>• Clean labeling with formatted currency values</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-border/50">
                    <h3 className="font-medium text-foreground mb-2">Scenario Usage</h3>
                    <p className="text-sm text-muted-foreground">
                      Used in <span className="text-primary font-medium">8 scenarios</span> including
                      TCO Analysis, Cost Breakdown, Make vs Buy, and Volume Consolidation.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Additional Dashboards */}
        <section>
          <h2 className="text-lg font-display font-semibold text-foreground mb-2">
            All Dashboard Templates
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Complete library of 14 visualization components
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            <RiskMatrixDashboard />
            <ScenarioComparisonDashboard />
            <SupplierPerformanceDashboard />
            <TimelineRoadmapDashboard />
            <KraljicQuadrantDashboard />
            <TCOComparisonDashboard />
            <LicenseTierDashboard />
            <SensitivitySpiderDashboard />
          </div>
        </section>

        <section className="text-center py-16 flex items-center justify-center gap-4 flex-wrap">
          <SiteFeedbackButton scenarioId="dashboard-showcase" />
          <a href="/pricing#contact">
            <Button size="lg" className="text-lg px-8 py-6 gap-2">
              Get in Touch
              <Mail className="w-5 h-5" />
            </Button>
          </a>
        </section>
      </main>
    </div>
  );
};

export default DashboardShowcase;
