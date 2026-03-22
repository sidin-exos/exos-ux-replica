import { type ReactNode, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { DashboardType } from "@/lib/dashboard-mappings";
import { extractDashboardData, type DashboardData } from "@/lib/dashboard-data-parser";

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

/** Map dashboard type slug to the corresponding key in DashboardData */
const dashboardDataKey: Record<string, keyof DashboardData> = {
  "action-checklist": "actionChecklist",
  "decision-matrix": "decisionMatrix",
  "cost-waterfall": "costWaterfall",
  "timeline-roadmap": "timelineRoadmap",
  "kraljic-quadrant": "kraljicQuadrant",
  "tco-comparison": "tcoComparison",
  "license-tier": "licenseTier",
  "sensitivity-spider": "sensitivitySpider",
  "risk-matrix": "riskMatrix",
  "scenario-comparison": "scenarioComparison",
  "supplier-scorecard": "supplierScorecard",
  "sow-analysis": "sowAnalysis",
  "negotiation-prep": "negotiationPrep",
  "data-quality": "dataQuality",
};

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

  const dataKey = dashboardDataKey[dashboardType];
  const hasRealData = !!(parsedData && dataKey && parsedData[dataKey]);

  const wrapWithFallbackBanner = (element: ReactNode) => {
    if (hasRealData) return element;
    return (
      <div>
        <div className="bg-warning/10 text-warning border border-warning/30 rounded-lg px-3 py-2 text-xs mb-2 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Sample data shown — AI-generated data unavailable for this dashboard.
        </div>
        {element}
      </div>
    );
  };

  switch (dashboardType) {
    case "action-checklist":
      return wrapWithFallbackBanner(<ActionChecklistDashboard parsedData={parsedData?.actionChecklist} />);

    case "decision-matrix":
      return wrapWithFallbackBanner(<DecisionMatrixDashboard parsedData={parsedData?.decisionMatrix} />);

    case "cost-waterfall":
      return wrapWithFallbackBanner(<CostWaterfallDashboard parsedData={parsedData?.costWaterfall} />);

    case "timeline-roadmap":
      return wrapWithFallbackBanner(<TimelineRoadmapDashboard parsedData={parsedData?.timelineRoadmap} />);

    case "kraljic-quadrant":
      return wrapWithFallbackBanner(<KraljicQuadrantDashboard parsedData={parsedData?.kraljicQuadrant} />);

    case "tco-comparison":
      return wrapWithFallbackBanner(<TCOComparisonDashboard parsedData={parsedData?.tcoComparison} />);

    case "license-tier":
      return wrapWithFallbackBanner(<LicenseTierDashboard parsedData={parsedData?.licenseTier} />);

    case "sensitivity-spider":
      return wrapWithFallbackBanner(<SensitivitySpiderDashboard parsedData={parsedData?.sensitivitySpider} />);

    case "risk-matrix":
      return wrapWithFallbackBanner(<RiskMatrixDashboard parsedData={parsedData?.riskMatrix} />);

    case "scenario-comparison":
      return wrapWithFallbackBanner(<ScenarioComparisonDashboard parsedData={parsedData?.scenarioComparison} />);

    case "supplier-scorecard":
      return wrapWithFallbackBanner(<SupplierPerformanceDashboard parsedData={parsedData?.supplierScorecard} />);

    case "sow-analysis":
      return wrapWithFallbackBanner(<SOWAnalysisDashboard parsedData={parsedData?.sowAnalysis} />);

    case "negotiation-prep":
      return wrapWithFallbackBanner(<NegotiationPrepDashboard parsedData={parsedData?.negotiationPrep} />);

    case "data-quality":
      return wrapWithFallbackBanner(<DataQualityDashboard parsedData={parsedData?.dataQuality} />);

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
