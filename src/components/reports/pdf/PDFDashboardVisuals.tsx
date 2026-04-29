/**
 * PDF Dashboard Visuals — renders dashboards on dedicated pages,
 * 2 per page (paired), with break-avoid to prevent splitting.
 * Enterprise print-ready: white background, no decorative elements.
 */

import { Page, View, Text } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { DashboardType, dashboardConfigs } from "@/lib/dashboard-mappings";
import type { DashboardData } from "@/lib/dashboard-data-parser";

import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./dashboardVisuals/theme";
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

// ── Enterprise print colors ──

const C = {
  text: "#1A1A1A",
  heading: "#1B2A4A",
  muted: "#6B7280",
  border: "#E5E7EB",
  background: "#FFFFFF",
};

// ── Page styles ──

const pageStyle = {
  backgroundColor: C.background,
  paddingTop: 56,
  paddingLeft: 48,
  paddingRight: 48,
  paddingBottom: 64,
  fontFamily: "Helvetica" as const,
  color: C.text,
};

const runningHeaderStyle = {
  position: "absolute" as const,
  top: 0,
  left: 48,
  right: 48,
  paddingTop: 12,
  paddingBottom: 8,
  borderBottomWidth: 1,
  borderBottomColor: C.border,
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  alignItems: "center" as const,
};

const footerStyle = {
  position: "absolute" as const,
  bottom: 20,
  left: 48,
  right: 48,
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  alignItems: "center" as const,
  borderTopWidth: 1,
  borderTopColor: C.border,
  paddingTop: 8,
};

const sectionTitleWrapperStyle = {
  borderBottomWidth: 2,
  borderBottomColor: C.border,
  marginBottom: 12,
  paddingBottom: 4,
};

export const PDFDashboardPlaceholder = (_props: { name: string; themeMode?: PdfThemeMode }) => null;

const PDFNoDataPlaceholder = (_props: { name: string; themeMode?: PdfThemeMode }) => null;

/** Map dashboard type to the corresponding key in DashboardData */
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

/** Render a single dashboard by type */
const renderDashboard = (dashboardType: DashboardType, parsedData?: DashboardData | null, themeMode?: PdfThemeMode): ReactNode => {
  const placeholder = () => {
    const config = dashboardConfigs[dashboardType as DashboardType];
    return <PDFNoDataPlaceholder name={config?.name || String(dashboardType)} themeMode={themeMode} />;
  };

  switch (dashboardType) {
    case "action-checklist": {
      const data = parsedData?.actionChecklist;
      return data ? <PDFActionChecklist data={data} themeMode={themeMode} /> : placeholder();
    }
    case "decision-matrix": {
      const data = parsedData?.decisionMatrix;
      return data ? <PDFDecisionMatrix data={data} themeMode={themeMode} /> : placeholder();
    }
    case "cost-waterfall": {
      const data = parsedData?.costWaterfall;
      return data ? <PDFCostWaterfall data={data} themeMode={themeMode} /> : placeholder();
    }
    case "timeline-roadmap": {
      const data = parsedData?.timelineRoadmap;
      return data ? <PDFTimelineRoadmap data={data} themeMode={themeMode} /> : placeholder();
    }
    case "kraljic-quadrant": {
      const data = parsedData?.kraljicQuadrant;
      return data ? <PDFKraljicQuadrant data={data} themeMode={themeMode} /> : placeholder();
    }
    case "tco-comparison": {
      const data = parsedData?.tcoComparison;
      return data ? <PDFTCOComparison data={data} themeMode={themeMode} /> : placeholder();
    }
    case "license-tier": {
      const data = parsedData?.licenseTier;
      return data ? <PDFLicenseTier data={data} themeMode={themeMode} /> : placeholder();
    }
    case "sensitivity-spider": {
      const data = parsedData?.sensitivitySpider;
      return data ? <PDFSensitivityAnalysis data={data} themeMode={themeMode} /> : placeholder();
    }
    case "risk-heatmap": {
      const data = parsedData?.riskMatrix;
      return data ? <PDFRiskMatrix data={data} themeMode={themeMode} /> : placeholder();
    }
    case "scenario-comparison": {
      const data = parsedData?.scenarioComparison;
      return data ? <PDFScenarioComparison data={data} themeMode={themeMode} /> : placeholder();
    }
    case "supplier-scorecard": {
      const data = parsedData?.supplierScorecard;
      return data ? <PDFSupplierScorecard data={data} themeMode={themeMode} /> : placeholder();
    }
    case "sow-analysis": {
      const data = parsedData?.sowAnalysis;
      return data ? <PDFSOWAnalysis data={data} themeMode={themeMode} /> : placeholder();
    }
    case "negotiation-prep": {
      const data = parsedData?.negotiationPrep;
      return data ? <PDFNegotiationPrep data={data} themeMode={themeMode} /> : placeholder();
    }
    case "data-quality": {
      const data = parsedData?.dataQuality;
      return data ? <PDFDataQuality data={data} themeMode={themeMode} /> : placeholder();
    }
    default: {
      const config = dashboardConfigs[dashboardType as DashboardType];
      return <PDFDashboardPlaceholder name={config?.name || String(dashboardType)} themeMode={themeMode} />;
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
  pdfTheme?: PdfThemeMode;
  scenarioTitle?: string;
  reportDate?: string;
  reportHash?: string;
}

/**
 * Returns an array of <Page> elements, each containing 1-2 dashboards.
 * Must be rendered as direct children of <Document>.
 */
export const PDFDashboardPages = ({ selectedDashboards, parsedData, pdfTheme, reportDate }: PDFDashboardVisualsProps) => {
  if (!selectedDashboards || selectedDashboards.length === 0) return null;

  const pairs = chunkPairs(selectedDashboards);

  return (
    <>
      {pairs.map((pair, pairIdx) => (
        <Page key={`dash-page-${pairIdx}`} size="A4" style={pageStyle}>
          {/* Running header */}
          <View style={runningHeaderStyle} fixed>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.heading }}>EXOS</Text>
            <Text style={{ fontSize: 8, color: C.muted }}>PROCUREMENT ANALYSIS REPORT</Text>
          </View>

          {pairIdx === 0 && (
            <View style={sectionTitleWrapperStyle} id="section-visualizations">
              <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: C.heading }}>
                Analysis Visualizations
              </Text>
            </View>
          )}

          {pair.map((dashboardType, idx) => (
            <View
              key={dashboardType}
              style={{ marginBottom: idx === 0 && pair.length > 1 ? 16 : 0 }}
              minPresenceAhead={1}
              wrap={false}
            >
              {renderDashboard(dashboardType, parsedData, pdfTheme)}
            </View>
          ))}

          <View style={footerStyle} fixed>
            <Text style={{ fontSize: 8, color: C.muted }}>Confidential — EXOS</Text>
            <Text style={{ fontSize: 8, color: C.muted }} render={({ pageNumber }) => `Page ${pageNumber}`} />
            <Text style={{ fontSize: 8, color: C.muted }}>{reportDate || ""}</Text>
          </View>
        </Page>
      ))}
    </>
  );
};

export default PDFDashboardPages;
