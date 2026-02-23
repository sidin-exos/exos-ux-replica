import { useMemo } from "react";
import { DashboardType } from "@/lib/dashboard-mappings";
import { extractDashboardData } from "@/lib/dashboard-data-parser";

// Dashboard components
import ActionChecklistDashboard from "./ActionChecklistDashboard";
import DecisionMatrixDashboard from "./DecisionMatrixDashboard";
import CostWaterfallDashboard from "./CostWaterfallDashboard";
import TimelineRoadmapDashboard from "./TimelineRoadmapDashboard";
import KraljicQuadrantDashboard from "./KraljicQuadrantDashboard";
import TCOComparisonDashboard from "./TCOComparisonDashboard";
import LicenseTierDashboard from "./LicenseTierDashboard";
import SensitivitySpiderDashboard from "./SensitivitySpiderDashboard";
import RiskMatrixDashboard from "./RiskMatrixDashboard";
import ScenarioComparisonDashboard from "./ScenarioComparisonDashboard";
import SupplierPerformanceDashboard from "./SupplierPerformanceDashboard";
import SOWAnalysisDashboard from "./SOWAnalysisDashboard";
import NegotiationPrepDashboard from "./NegotiationPrepDashboard";
import DataQualityDashboard from "./DataQualityDashboard";

interface DashboardRendererProps {
  dashboardType: DashboardType;
  scenarioTitle?: string;
  analysisResult?: string;
  formData?: Record<string, string>;
}

const DashboardRenderer = ({
  dashboardType,
  scenarioTitle,
  analysisResult,
  formData,
}: DashboardRendererProps) => {
  const parsedData = useMemo(
    () => extractDashboardData(analysisResult || ''),
    [analysisResult]
  );

  switch (dashboardType) {
    case "action-checklist":
      return <ActionChecklistDashboard parsedData={parsedData?.actionChecklist} />;
    
    case "decision-matrix":
      return <DecisionMatrixDashboard parsedData={parsedData?.decisionMatrix} />;
    
    case "cost-waterfall":
      return <CostWaterfallDashboard parsedData={parsedData?.costWaterfall} />;
    
    case "timeline-roadmap":
      return <TimelineRoadmapDashboard parsedData={parsedData?.timelineRoadmap} />;
    
    case "kraljic-quadrant":
      return <KraljicQuadrantDashboard parsedData={parsedData?.kraljicQuadrant} />;
    
    case "tco-comparison":
      return <TCOComparisonDashboard parsedData={parsedData?.tcoComparison} />;
    
    case "license-tier":
      return <LicenseTierDashboard parsedData={parsedData?.licenseTier} />;
    
    case "sensitivity-spider":
      return <SensitivitySpiderDashboard parsedData={parsedData?.sensitivitySpider} />;
    
    case "risk-matrix":
      return <RiskMatrixDashboard parsedData={parsedData?.riskMatrix} />;
    
    case "scenario-comparison":
      return <ScenarioComparisonDashboard parsedData={parsedData?.scenarioComparison} />;
    
    case "supplier-scorecard":
      return <SupplierPerformanceDashboard parsedData={parsedData?.supplierScorecard} />;
    
    case "sow-analysis":
      return <SOWAnalysisDashboard parsedData={parsedData?.sowAnalysis} />;
    
    case "negotiation-prep":
      return <NegotiationPrepDashboard parsedData={parsedData?.negotiationPrep} />;
    
    case "data-quality":
      return <DataQualityDashboard parsedData={parsedData?.dataQuality} />;
    
    default:
      return (
        <div className="p-4 rounded-lg border border-border bg-secondary/20 text-center">
          <p className="text-muted-foreground">
            Dashboard "{dashboardType}" is not yet implemented
          </p>
        </div>
      );
  }
};

export default DashboardRenderer;
