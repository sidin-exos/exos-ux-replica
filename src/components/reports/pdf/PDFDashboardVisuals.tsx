/**
 * PDF Dashboard Visuals — renders dashboards on dedicated pages,
 * 2 per page (paired), with break-avoid to prevent splitting.
 */

import { Page, View, Text, Image } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { DashboardType, dashboardConfigs } from "@/lib/dashboard-mappings";
import type { DashboardData } from "@/lib/dashboard-data-parser";
import exosLogoDark from "@/assets/logo-concept-layers.png";
import exosLogoLight from "@/assets/logo-concept-layers-light.png";

import { styles, colors, getPdfColors, getPdfStyles, type PdfThemeMode } from "./dashboardVisuals/theme";
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

// ── Page-level style factory ──

function buildPageStyles(mode?: PdfThemeMode) {
  const c = getPdfColors(mode);
  const isLight = mode === "light";

  return {
    page: {
      backgroundColor: c.background,
      padding: 40,
      fontFamily: "Courier" as const,
      color: c.text,
    },
    accentBar: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: c.primary,
    },
    gradientLayer1: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: "50%",
      backgroundColor: isLight ? "#f5f4f0" : "#232338",
    },
    gradientLayer2: {
      position: "absolute" as const,
      top: "30%",
      left: 0,
      right: 0,
      bottom: "30%",
      backgroundColor: isLight ? "rgba(74, 138, 116, 0.04)" : "rgba(107, 158, 138, 0.06)",
    },
    gradientLayer3: {
      position: "absolute" as const,
      top: "50%",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isLight ? "#efeeea" : "#1a1a2a",
    },
    footer: {
      position: "absolute" as const,
      bottom: 30,
      left: 40,
      right: 40,
      flexDirection: "column" as const,
      alignItems: "center" as const,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 15,
    },
    footerBrand: {
      fontSize: 9,
      fontFamily: "Courier" as const,
      color: isLight ? "rgba(30, 30, 46, 0.25)" : "rgba(212, 212, 220, 0.35)",
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
      color: c.textMuted,
    },
    pageNumber: {
      fontSize: 9,
      color: c.textMuted,
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
      color: c.text,
    },
  };
}

const darkPageStyles = buildPageStyles("dark");
const lightPageStylesCache = buildPageStyles("light");

function getPageStyles(mode?: PdfThemeMode) {
  return mode === "light" ? lightPageStylesCache : darkPageStyles;
}

export const PDFDashboardPlaceholder = ({ name, themeMode }: { name: string; themeMode?: PdfThemeMode }) => {
  const s = getPdfStyles(themeMode);
  const c = getPdfColors(themeMode);
  return (
    <View style={s.dashboardCard}>
      <View style={s.dashboardHeader}>
        <View style={s.dashboardIcon} />
        <View>
          <Text style={s.dashboardTitle}>{name}</Text>
          <Text style={s.dashboardSubtitle}>Visualization unavailable</Text>
        </View>
      </View>
      <View style={{ padding: 12, alignItems: "center" }}>
        <Text style={{ fontSize: 9, color: c.textMuted, textAlign: "center" }}>
          This dashboard doesn't have a PDF visual yet.
        </Text>
      </View>
    </View>
  );
};

/** No-data placeholder shown when parsed data is missing for a dashboard */
const PDFNoDataPlaceholder = ({ name, themeMode }: { name: string; themeMode?: PdfThemeMode }) => {
  const isLight = themeMode === "light";
  return (
    <View style={{
      backgroundColor: isLight ? "#f3f4f6" : "#2a2a3a",
      padding: 20,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 80,
    }}>
      <Text style={{ fontSize: 11, fontFamily: "Helvetica", fontWeight: 600, color: isLight ? "#374151" : "#9ca3af", marginBottom: 6 }}>
        {name}
      </Text>
      <Text style={{ fontSize: 10, fontFamily: "Helvetica", color: "#6b7280", textAlign: "center", lineHeight: 1.4 }}>
        Visualization data could not be extracted automatically. Please refer to the detailed analysis below.
      </Text>
    </View>
  );
};

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
  // Gate: if no parsed data exists for this dashboard type, show placeholder
  const dataKey = dashboardDataKey[dashboardType];
  if (dataKey && (!parsedData || !parsedData[dataKey])) {
    const config = dashboardConfigs[dashboardType as DashboardType];
    return <PDFNoDataPlaceholder name={config?.name || String(dashboardType)} themeMode={themeMode} />;
  }

  switch (dashboardType) {
    case "action-checklist":
      return <PDFActionChecklist data={parsedData!.actionChecklist!} themeMode={themeMode} />;
    case "decision-matrix":
      return <PDFDecisionMatrix data={parsedData!.decisionMatrix!} themeMode={themeMode} />;
    case "cost-waterfall":
      return <PDFCostWaterfall data={parsedData!.costWaterfall!} themeMode={themeMode} />;
    case "timeline-roadmap":
      return <PDFTimelineRoadmap data={parsedData!.timelineRoadmap!} themeMode={themeMode} />;
    case "kraljic-quadrant":
      return <PDFKraljicQuadrant data={parsedData!.kraljicQuadrant!} themeMode={themeMode} />;
    case "tco-comparison":
      return <PDFTCOComparison data={parsedData!.tcoComparison!} themeMode={themeMode} />;
    case "license-tier":
      return <PDFLicenseTier data={parsedData!.licenseTier!} themeMode={themeMode} />;
    case "sensitivity-spider":
      return <PDFSensitivityAnalysis data={parsedData!.sensitivitySpider!} themeMode={themeMode} />;
    case "risk-matrix":
      return <PDFRiskMatrix data={parsedData!.riskMatrix!} themeMode={themeMode} />;
    case "scenario-comparison":
      return <PDFScenarioComparison data={parsedData!.scenarioComparison!} themeMode={themeMode} />;
    case "supplier-scorecard":
      return <PDFSupplierScorecard data={parsedData!.supplierScorecard!} themeMode={themeMode} />;
    case "sow-analysis":
      return <PDFSOWAnalysis data={parsedData!.sowAnalysis!} themeMode={themeMode} />;
    case "negotiation-prep":
      return <PDFNegotiationPrep data={parsedData!.negotiationPrep!} themeMode={themeMode} />;
    case "data-quality":
      return <PDFDataQuality data={parsedData!.dataQuality!} themeMode={themeMode} />;
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
export const PDFDashboardPages = ({ selectedDashboards, parsedData, pdfTheme, scenarioTitle, reportDate, reportHash }: PDFDashboardVisualsProps) => {
  if (!selectedDashboards || selectedDashboards.length === 0) return null;

  const pairs = chunkPairs(selectedDashboards);
  const pageStyles = getPageStyles(pdfTheme);
  const exosLogo = pdfTheme === "light" ? exosLogoLight : exosLogoDark;
  const c = getPdfColors(pdfTheme);
  const isLight = pdfTheme === "light";

  const runningHeaderStyle = {
    position: "absolute" as const,
    top: 0,
    left: 40,
    right: 40,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  };
  const runningHeaderTextStyle = {
    fontSize: 8,
    color: isLight ? "rgba(30, 30, 46, 0.5)" : "rgba(212, 212, 220, 0.6)",
    fontFamily: "Helvetica" as const,
  };

  // Use pageWithHeader padding for dashboard pages
  const dashPageStyle = {
    ...pageStyles.page,
    paddingTop: 50,
  };

  return (
    <>
      {pairs.map((pair, pairIdx) => (
        <Page key={`dash-page-${pairIdx}`} size="A4" style={dashPageStyle}>
          <View style={pageStyles.gradientLayer1} />
          <View style={pageStyles.gradientLayer2} />
          <View style={pageStyles.gradientLayer3} />
          <View style={pageStyles.accentBar} />

          {/* Running header */}
          <View style={runningHeaderStyle} fixed>
            <Text style={runningHeaderTextStyle}>EXOS | {scenarioTitle || "Report"} Analysis</Text>
            <Text style={runningHeaderTextStyle}>{reportDate || ""}</Text>
          </View>

          <View style={pairIdx === 0 ? { ...pageStyles.sectionHeader } : pageStyles.sectionHeader} id={pairIdx === 0 ? "section-visualizations" : undefined}>
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
              {renderDashboard(dashboardType, parsedData, pdfTheme)}
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
                  `Page ${pageNumber} of ${totalPages}${reportHash ? ` • ID: ${reportHash}` : ""}`
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
