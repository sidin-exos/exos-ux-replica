/**
 * Static PDF-renderable dashboard visuals using @react-pdf/renderer primitives.
 * Goal: provide vector-only "image" representations for every dashboard type.
 */

import { View, Text } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { DashboardType, dashboardConfigs } from "@/lib/dashboard-mappings";
import type { DashboardData } from "@/lib/dashboard-data-parser";

import { styles, colors } from "./dashboardVisuals/theme";
import { PDFCostWaterfall } from "./dashboardVisuals/PDFCostWaterfall";
import { PDFDecisionMatrix } from "./dashboardVisuals/PDFDecisionMatrix";
import { PDFSensitivityAnalysis } from "./dashboardVisuals/PDFSensitivityTornado";
import { PDFActionChecklist } from "./dashboardVisuals/PDFActionChecklist";
import { PDFTimelineRoadmap } from "./dashboardVisuals/PDFTimelineRoadmap";
import { PDFRiskMatrix } from "./dashboardVisuals/PDFRiskMatrix";
import { PDFKraljicQuadrant } from "./dashboardVisuals/PDFKraljicQuadrant";
import { PDFTCOComparison } from "./dashboardVisuals/PDFTCOComparison";
import { PDFLicenseTier } from "./dashboardVisuals/PDFLicenseTier";
import { PDFScenarioComparison } from "./dashboardVisuals/PDFScenarioComparison";
import { PDFSupplierScorecard } from "./dashboardVisuals/PDFSupplierScorecard";
import { PDFSOWAnalysis } from "./dashboardVisuals/PDFSOWAnalysis";
import { PDFNegotiationPrep } from "./dashboardVisuals/PDFNegotiationPrep";
import { PDFDataQuality } from "./dashboardVisuals/PDFDataQuality";

export const PDFDashboardPlaceholder = ({ name }: { name: string }) => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View>
        <Text style={styles.dashboardTitle}>{name}</Text>
        <Text style={styles.dashboardSubtitle}>Visualization unavailable</Text>
      </View>
    </View>
    <View style={{ padding: 12, alignItems: "center" }}>
      <Text style={{ fontSize: 8, color: colors.textMuted, textAlign: "center" }}>
        This dashboard doesn't have a PDF visual yet.
      </Text>
    </View>
  </View>
);

interface PDFDashboardVisualsProps {
  selectedDashboards: DashboardType[];
  parsedData?: DashboardData | null;
}

export const PDFDashboardVisuals = ({ selectedDashboards, parsedData }: PDFDashboardVisualsProps) => {
  if (!selectedDashboards || selectedDashboards.length === 0) return null;

  return (
    <View style={styles.dashboardSection}>
      {selectedDashboards.map((dashboardType) => {
        const config = dashboardConfigs[dashboardType];

        const wrap = (node: ReactNode) => (
          <View key={dashboardType} style={{ marginBottom: 12 }}>
            {node}
          </View>
        );

        switch (dashboardType) {
          case "action-checklist":
            return wrap(<PDFActionChecklist data={parsedData?.actionChecklist} />);
          case "decision-matrix":
            return wrap(<PDFDecisionMatrix data={parsedData?.decisionMatrix} />);
          case "cost-waterfall":
            return wrap(<PDFCostWaterfall data={parsedData?.costWaterfall} />);
          case "timeline-roadmap":
            return wrap(<PDFTimelineRoadmap data={parsedData?.timelineRoadmap} />);
          case "kraljic-quadrant":
            return wrap(<PDFKraljicQuadrant data={parsedData?.kraljicQuadrant} />);
          case "tco-comparison":
            return wrap(<PDFTCOComparison data={parsedData?.tcoComparison} />);
          case "license-tier":
            return wrap(<PDFLicenseTier data={parsedData?.licenseTier} />);
          case "sensitivity-spider":
            return wrap(<PDFSensitivityAnalysis data={parsedData?.sensitivitySpider} />);
          case "risk-matrix":
            return wrap(<PDFRiskMatrix data={parsedData?.riskMatrix} />);
          case "scenario-comparison":
            return wrap(<PDFScenarioComparison data={parsedData?.scenarioComparison} />);
          case "supplier-scorecard":
            return wrap(<PDFSupplierScorecard data={parsedData?.supplierScorecard} />);
          case "sow-analysis":
            return wrap(<PDFSOWAnalysis data={parsedData?.sowAnalysis} />);
          case "negotiation-prep":
            return wrap(<PDFNegotiationPrep data={parsedData?.negotiationPrep} />);
          case "data-quality":
            return wrap(<PDFDataQuality data={parsedData?.dataQuality} />);
          default:
            return wrap(<PDFDashboardPlaceholder name={config?.name || dashboardType} />);
        }
      })}
    </View>
  );
};

export default PDFDashboardVisuals;
