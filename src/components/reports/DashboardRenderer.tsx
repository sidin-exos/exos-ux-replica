import { type ReactNode, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { DashboardType, dashboardConfigs } from "@/lib/dashboard-mappings";
import { extractDashboardData, extractFromEnvelope, type DashboardData } from "@/lib/dashboard-data-parser";

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
import ShouldCostGapDashboard from "./ShouldCostGapDashboard";
import SavingsRealizationFunnelDashboard from "./SavingsRealizationFunnelDashboard";
import WorkingCapitalDpoDashboard from "./WorkingCapitalDpoDashboard";
import SupplierConcentrationMapDashboard from "./SupplierConcentrationMapDashboard";
import RfpPackageDashboard from "./RfpPackageDashboard";

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
  "risk-heatmap": "riskMatrix",
  "scenario-comparison": "scenarioComparison",
  "supplier-scorecard": "supplierScorecard",
  "sow-analysis": "sowAnalysis",
  "negotiation-prep": "negotiationPrep",
  "data-quality": "dataQuality",
  "should-cost-gap": "shouldCostGap",
  "savings-realization-funnel": "savingsRealizationFunnel",
  "working-capital-dpo": "workingCapitalDpo",
  "supplier-concentration-map": "supplierConcentrationMap",
  "rfp-package": "rfpPackage",
};

/**
 * Determine whether a given dashboard has real AI-generated data available
 * (as opposed to needing the hardcoded sample fallback). Used by report pages
 * to skip rendering dashboards with no real data and list them as skipped.
 */
export function dashboardHasRealData(
  dashboardType: DashboardType,
  analysisResult?: string,
  structuredData?: string,
): boolean {
  let parsed: DashboardData | null = null;
  let envelope: any = null;
  if (structuredData) {
    try {
      envelope = JSON.parse(structuredData);
      if (['1.0', '2.0'].includes(envelope?.schema_version)) {
        parsed = extractFromEnvelope(envelope);
      }
    } catch { /* fall through */ }
  }
  if (!parsed) {
    parsed = extractDashboardData(analysisResult || '');
  }
  const key = dashboardDataKey[dashboardType];
  if (parsed && key && parsed[key]) return true;

  // S27 Black Swan: accept dashboards when the envelope has the source data,
  // even if the parser hasn't produced the camelCase summary yet.
  const ss = envelope?.payload?.scenario_specific ?? {};
  const isS27 = envelope?.scenario_id === 'S27';
  if (isS27) {
    if (dashboardType === 'risk-heatmap' && Array.isArray(ss.supply_chain_nodes) && ss.supply_chain_nodes.length > 0) {
      return true;
    }
    if (dashboardType === 'sensitivity-spider') {
      const inv = Array.isArray(ss.resilience_investments) ? ss.resilience_investments : [];
      const cas = Array.isArray(envelope?.payload?.impact_model?.cascade_effects)
        ? envelope.payload.impact_model.cascade_effects : [];
      if (inv.length > 0 || cas.length > 0) return true;
    }
  }
  return false;
}

interface DashboardRendererProps {
  dashboardType: DashboardType;
  scenarioTitle?: string;
  analysisResult?: string;
  structuredData?: string;
  formData?: Record<string, string>;
}

const DashboardRenderer = ({
  dashboardType,
  scenarioTitle,
  analysisResult,
  structuredData,
  formData,
}: DashboardRendererProps) => {
  const parsedData = useMemo(() => {
    // Prefer structured envelope data when available
    if (structuredData) {
      try {
        const envelope = JSON.parse(structuredData);
        if (['1.0','2.0'].includes(envelope?.schema_version)) {
          return extractFromEnvelope(envelope);
        }
      } catch { /* fall through to legacy */ }
    }
    return extractDashboardData(analysisResult || '');
  }, [structuredData, analysisResult]);

  const dataKey = dashboardDataKey[dashboardType];
  const hasRealData = !!(parsedData && dataKey && parsedData[dataKey]);
  const config = dashboardConfigs[dashboardType];
  const allowSampleFallback = config?.showSampleDataFallback !== false;

  const wrapWithFallbackBanner = (element: ReactNode) => {
    if (hasRealData) return element;
    // Some dashboards (e.g. working-capital-dpo) opt out of the sample-data
    // fallback because misleading placeholder figures could be mistaken for
    // real benchmarks. They render their own empty state instead.
    if (!allowSampleFallback) return element;
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

    case "risk-heatmap":
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

    case "should-cost-gap":
      return wrapWithFallbackBanner(<ShouldCostGapDashboard parsedData={parsedData?.shouldCostGap} />);

    case "savings-realization-funnel":
      return wrapWithFallbackBanner(<SavingsRealizationFunnelDashboard parsedData={parsedData?.savingsRealizationFunnel} />);

    case "working-capital-dpo":
      // No fallback banner — component renders its own empty state when parsedData missing.
      return <WorkingCapitalDpoDashboard parsedData={parsedData?.workingCapitalDpo} />;

    case "supplier-concentration-map":
      return wrapWithFallbackBanner(<SupplierConcentrationMapDashboard parsedData={parsedData?.supplierConcentrationMap} />);

    case "rfp-package":
      // No sample fallback — component renders its own empty state.
      return <RfpPackageDashboard parsedData={parsedData?.rfpPackage} />;

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
