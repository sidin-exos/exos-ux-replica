/**
 * PDF Dashboard Visuals — renders dashboards on dedicated pages,
 * 2 per page (paired), with break-avoid to prevent splitting.
 */

import { Page, View, Text, Image } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { DashboardType, dashboardConfigs } from "@/lib/dashboard-mappings";
import type { DashboardData } from "@/lib/dashboard-data-parser";
import exosLogo from "@/assets/logo-concept-layers.png";

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

// Page-level styles matching PDFReportDocument theme
const pageColors = {
  primary: "#6b9e8a",
  background: "#1e1e2e",
  border: "#3a3a4e",
  text: "#d4d4dc",
  textMuted: "#8b8b9e",
};

const pageStyles = {
  page: {
    backgroundColor: pageColors.background,
    padding: 40,
    fontFamily: "Courier" as const,
    color: pageColors.text,
  },
  accentBar: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: pageColors.primary,
  },
  gradientLayer1: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: "50%",
    backgroundColor: "#232338",
  },
  gradientLayer2: {
    position: "absolute" as const,
    top: "30%",
    left: 0,
    right: 0,
    bottom: "30%",
    backgroundColor: "rgba(107, 158, 138, 0.06)",
  },
  gradientLayer3: {
    position: "absolute" as const,
    top: "50%",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1a1a2a",
  },
  footer: {
    position: "absolute" as const,
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    borderTopWidth: 1,
    borderTopColor: pageColors.border,
    paddingTop: 15,
  },
  footerBrand: {
    fontSize: 9,
    fontFamily: "Courier" as const,
    color: "rgba(212, 212, 220, 0.35)",
    fontWeight: 400 as const,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    width: "100%",
  },
  footerText: {
    fontSize: 9,
    color: pageColors.textMuted,
  },
  pageNumber: {
    fontSize: 9,
    color: pageColors.textMuted,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  sectionLogoImage: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica" as const,
    fontWeight: 600 as const,
    color: pageColors.text,
  },
};

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
      <Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center" }}>
        This dashboard doesn't have a PDF visual yet.
      </Text>
    </View>
  </View>
);

/** Render a single dashboard by type */
const renderDashboard = (dashboardType: DashboardType, parsedData?: DashboardData | null): ReactNode => {
  switch (dashboardType) {
    case "action-checklist":
      return <PDFActionChecklist data={parsedData?.actionChecklist} />;
    case "decision-matrix":
      return <PDFDecisionMatrix data={parsedData?.decisionMatrix} />;
    case "cost-waterfall":
      return <PDFCostWaterfall data={parsedData?.costWaterfall} />;
    case "timeline-roadmap":
      return <PDFTimelineRoadmap data={parsedData?.timelineRoadmap} />;
    case "kraljic-quadrant":
      return <PDFKraljicQuadrant data={parsedData?.kraljicQuadrant} />;
    case "tco-comparison":
      return <PDFTCOComparison data={parsedData?.tcoComparison} />;
    case "license-tier":
      return <PDFLicenseTier data={parsedData?.licenseTier} />;
    case "sensitivity-spider":
      return <PDFSensitivityAnalysis data={parsedData?.sensitivitySpider} />;
    case "risk-matrix":
      return <PDFRiskMatrix data={parsedData?.riskMatrix} />;
    case "scenario-comparison":
      return <PDFScenarioComparison data={parsedData?.scenarioComparison} />;
    case "supplier-scorecard":
      return <PDFSupplierScorecard data={parsedData?.supplierScorecard} />;
    case "sow-analysis":
      return <PDFSOWAnalysis data={parsedData?.sowAnalysis} />;
    case "negotiation-prep":
      return <PDFNegotiationPrep data={parsedData?.negotiationPrep} />;
    case "data-quality":
      return <PDFDataQuality data={parsedData?.dataQuality} />;
    default: {
      const config = dashboardConfigs[dashboardType as DashboardType];
      return <PDFDashboardPlaceholder name={config?.name || String(dashboardType)} />;
    }
  }
};

/** Chunk array into pairs */
function chunkPairs<T>(arr: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    result.push(arr.slice(i, i + 2));
  }
  return result;
}

interface PDFDashboardVisualsProps {
  selectedDashboards: DashboardType[];
  parsedData?: DashboardData | null;
}

/**
 * Returns an array of <Page> elements, each containing 1-2 dashboards.
 * Must be rendered as direct children of <Document>.
 */
export const PDFDashboardPages = ({ selectedDashboards, parsedData }: PDFDashboardVisualsProps) => {
  if (!selectedDashboards || selectedDashboards.length === 0) return null;

  const pairs = chunkPairs(selectedDashboards);

  return (
    <>
      {pairs.map((pair, pairIdx) => (
        <Page key={`dash-page-${pairIdx}`} size="A4" style={pageStyles.page}>
          <View style={pageStyles.gradientLayer1} />
          <View style={pageStyles.gradientLayer2} />
          <View style={pageStyles.gradientLayer3} />
          <View style={pageStyles.accentBar} />

          <View style={pageStyles.sectionHeader}>
            <Image src={exosLogo} style={pageStyles.sectionLogoImage} />
            <Text style={pageStyles.sectionTitle}>
              Analysis Visualizations {pairs.length > 1 ? `(${pairIdx + 1}/${pairs.length})` : ""}
            </Text>
          </View>

          {pair.map((dashboardType, idx) => (
            <View
              key={dashboardType}
              style={{ marginBottom: idx === 0 && pair.length > 1 ? 16 : 0 }}
              minPresenceAhead={1}
              wrap={false}
            >
              {renderDashboard(dashboardType, parsedData)}
            </View>
          ))}

          <View style={pageStyles.footer} fixed>
            <Text style={pageStyles.footerBrand}>Powered by EXOS Procurement Intelligence</Text>
            <View style={pageStyles.footerRow}>
              <Text style={pageStyles.footerText}>
                Confidential • For internal use only
              </Text>
              <Text
                style={pageStyles.pageNumber}
                render={({ pageNumber, totalPages }) =>
                  `Page ${pageNumber} of ${totalPages}`
                }
              />
            </View>
          </View>
        </Page>
      ))}
    </>
  );
};

// Keep backward-compat default export
export default PDFDashboardPages;
