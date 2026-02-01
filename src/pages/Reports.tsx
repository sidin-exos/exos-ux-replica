import { useState } from "react";
import Header from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { dashboardConfigs, DashboardType } from "@/lib/dashboard-mappings";
import { getDashboardScenarioTitles, getDashboardScenarioCount } from "@/lib/dashboard-scenario-mapping";

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

// Component to render scenario annotation
const ScenarioAnnotation = ({ dashboardId }: { dashboardId: DashboardType }) => {
  const scenarioTitles = getDashboardScenarioTitles(dashboardId);
  const totalCount = getDashboardScenarioCount(dashboardId);
  
  if (scenarioTitles.length === 0) return null;
  
  const displayTitles = scenarioTitles.slice(0, 3);
  const remaining = totalCount - displayTitles.length;
  
  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground/70">Available for scenarios:</span>{" "}
        {displayTitles.join(", ")}
        {remaining > 0 && <span className="text-muted-foreground/70"> +{remaining} more</span>}
      </p>
    </div>
  );
};

// Dashboard wrapper with annotation
const DashboardWithAnnotation = ({ 
  dashboardId, 
  children 
}: { 
  dashboardId: DashboardType; 
  children: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col">
      {children}
      <div className="px-4 pb-4">
        <ScenarioAnnotation dashboardId={dashboardId} />
      </div>
    </div>
  );
};

const Reports = () => {
  const [selectedTab, setSelectedTab] = useState<DashboardType>("action-checklist");

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
            Dashboards library — Tableau-inspired visualization components for procurement analysis.
          </p>
        </section>

        {/* Top Dashboard Selector */}
        <section className="mb-8">
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as DashboardType)} className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-secondary/30 p-1">
              {allDashboards.map((dashboardId) => {
                const config = dashboardConfigs[dashboardId];
                return (
                  <TabsTrigger 
                    key={dashboardId} 
                    value={dashboardId}
                    className="text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {config.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Action Checklist */}
            <TabsContent value="action-checklist">
              <DashboardWithAnnotation dashboardId="action-checklist">
                <ActionChecklistDashboard
                  title="Volume Consolidation Actions"
                  subtitle="Supplier rationalization roadmap"
                  actions={volumeConsolidationActions}
                />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* Decision Matrix */}
            <TabsContent value="decision-matrix">
              <DashboardWithAnnotation dashboardId="decision-matrix">
                <DecisionMatrixDashboard
                  title="Make vs Buy Analysis"
                  subtitle="Strategic sourcing decision"
                  criteria={makeVsBuyCriteria}
                  options={makeVsBuyOptions}
                />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* Cost Waterfall */}
            <TabsContent value="cost-waterfall">
              <DashboardWithAnnotation dashboardId="cost-waterfall">
                <CostWaterfallDashboard
                  title="TCO Analysis: Industrial Equipment"
                  subtitle="5-year total cost of ownership"
                  components={tcoCostBreakdown}
                  currency="$"
                />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* Timeline Roadmap */}
            <TabsContent value="timeline-roadmap">
              <DashboardWithAnnotation dashboardId="timeline-roadmap">
                <TimelineRoadmapDashboard />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* Kraljic Quadrant */}
            <TabsContent value="kraljic-quadrant">
              <DashboardWithAnnotation dashboardId="kraljic-quadrant">
                <KraljicQuadrantDashboard />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* TCO Comparison */}
            <TabsContent value="tco-comparison">
              <DashboardWithAnnotation dashboardId="tco-comparison">
                <TCOComparisonDashboard />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* License Tier */}
            <TabsContent value="license-tier">
              <DashboardWithAnnotation dashboardId="license-tier">
                <LicenseTierDashboard />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* Sensitivity Spider */}
            <TabsContent value="sensitivity-spider">
              <DashboardWithAnnotation dashboardId="sensitivity-spider">
                <SensitivitySpiderDashboard />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* Risk Matrix */}
            <TabsContent value="risk-matrix">
              <DashboardWithAnnotation dashboardId="risk-matrix">
                <RiskMatrixDashboard />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* Scenario Comparison */}
            <TabsContent value="scenario-comparison">
              <DashboardWithAnnotation dashboardId="scenario-comparison">
                <ScenarioComparisonDashboard />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* Supplier Scorecard */}
            <TabsContent value="supplier-scorecard">
              <DashboardWithAnnotation dashboardId="supplier-scorecard">
                <SupplierPerformanceDashboard />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* SOW Analysis */}
            <TabsContent value="sow-analysis">
              <DashboardWithAnnotation dashboardId="sow-analysis">
                <SOWAnalysisDashboard />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* Negotiation Prep */}
            <TabsContent value="negotiation-prep">
              <DashboardWithAnnotation dashboardId="negotiation-prep">
                <NegotiationPrepDashboard />
              </DashboardWithAnnotation>
            </TabsContent>

            {/* Data Quality */}
            <TabsContent value="data-quality">
              <DashboardWithAnnotation dashboardId="data-quality">
                <DataQualityDashboard />
              </DashboardWithAnnotation>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default Reports;
