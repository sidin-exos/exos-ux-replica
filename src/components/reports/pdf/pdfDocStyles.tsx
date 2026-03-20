import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfThemeMode } from "./dashboardVisuals/theme";

// ── Color palettes ──

const darkColors = {
  primary: "#6b9e8a",
  primaryDark: "#5a8a76",
  background: "#1e1e2e",
  surface: "#262637",
  surfaceLight: "#2f2f42",
  text: "#d4d4dc",
  textMuted: "#8b8b9e",
  textSemiTransparent: "rgba(212, 212, 220, 0.6)",
  accent: "#6b9e8a",
  success: "#6bbf8a",
  warning: "#c9a24d",
  destructive: "#c06060",
  border: "#3a3a4e",
  footerBrand: "rgba(212, 212, 220, 0.35)",
  gradientLayer1: "#232338",
  gradientLayer2: "rgba(107, 158, 138, 0.06)",
  gradientLayer3: "#1a1a2a",
};

const lightColors = {
  primary: "#4a8a74",
  primaryDark: "#3d7563",
  background: "#f8f7f4",
  surface: "#ffffff",
  surfaceLight: "#f0efe8",
  text: "#1e1e2e",
  textMuted: "#6b6b7e",
  textSemiTransparent: "rgba(30, 30, 46, 0.5)",
  accent: "#4a8a74",
  success: "#3a9960",
  warning: "#b08930",
  destructive: "#c04040",
  border: "#d8d8e0",
  footerBrand: "rgba(30, 30, 46, 0.25)",
  gradientLayer1: "#f5f4f0",
  gradientLayer2: "rgba(74, 138, 116, 0.04)",
  gradientLayer3: "#efeeea",
};

export type DocColors = typeof darkColors;

export function getDocColors(mode?: PdfThemeMode): DocColors {
  return mode === "light" ? lightColors : darkColors;
}

export function getDocLogo(mode?: PdfThemeMode) {
  // Lazy import pattern — callers should pass the resolved image
  return mode === "light" ? "light" : "dark";
}

// ── Style factory ──

function buildDocStyles(c: DocColors) {
  return StyleSheet.create({
    page: {
      backgroundColor: c.background,
      padding: 40,
      fontFamily: "Helvetica",
      color: c.text,
    },
    pageWithHeader: {
      backgroundColor: c.background,
      paddingTop: 50,
      paddingLeft: 40,
      paddingRight: 40,
      paddingBottom: 40,
      fontFamily: "Helvetica",
      color: c.text,
    },
    runningHeader: {
      position: "absolute",
      top: 0,
      left: 40,
      right: 40,
      paddingTop: 10,
      paddingBottom: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    runningHeaderText: {
      fontSize: 8,
      color: c.textMuted,
      fontFamily: "Helvetica",
    },
    tocSection: {
      marginBottom: 10,
    },
    tocRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 3,
    },
    tocLabel: {
      fontSize: 9,
      color: c.primary,
      fontFamily: "Helvetica-Bold",
      textDecoration: "none",
    },
    tocLeader: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomStyle: "dashed",
      borderBottomColor: c.border + "60",
      marginHorizontal: 10,
      marginBottom: 3,
    },
    tocPageHint: {
      fontSize: 8,
      color: c.textMuted,
      fontFamily: "Helvetica",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingBottom: 12,
    },
    logoSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    logoImage: {
      width: 40,
      height: 40,
      marginRight: 12,
    },
    brandName: {
      fontSize: 23,
      fontFamily: "Helvetica-Bold",
      fontWeight: 700,
      color: c.text,
      letterSpacing: 1,
    },
    brandTagline: {
      fontSize: 9,
      color: c.textMuted,
      marginTop: 2,
    },
    reportMeta: {
      textAlign: "right",
    },
    reportBadge: {
      backgroundColor: c.surfaceLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginBottom: 4,
    },
    reportBadgeText: {
      fontSize: 8,
      color: c.primary,
      fontWeight: 600,
    },
    reportDate: {
      fontSize: 9,
      color: c.textMuted,
    },
    titleSection: {
      marginBottom: 14,
    },
    reportTitle: {
      fontSize: 22,
      fontFamily: "Helvetica-Bold",
      fontWeight: 700,
      color: c.primary,
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    reportSubtitle: {
      fontSize: 10,
      color: c.textMuted,
    },
    section: {
      marginBottom: 14,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      fontWeight: 600,
      color: c.text,
      letterSpacing: 0.5,
    },
    sectionContent: {
      backgroundColor: c.surface,
      borderRadius: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    keyPointText: {
      flex: 1,
      fontSize: 9.5,
      color: c.text,
      lineHeight: 1.4,
    },
    analysisText: {
      fontSize: 12,
      color: c.text,
      lineHeight: 1.6,
      marginBottom: 8,
    },
    analysisTextHighlight: {
      fontSize: 12,
      color: c.primary,
      lineHeight: 1.6,
      marginBottom: 8,
      fontWeight: 700,
      fontFamily: "Helvetica-Bold",
      backgroundColor: c.primary + "15",
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 3,
    },
    analysisSubHeader: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      fontWeight: 600,
      color: c.text,
      marginTop: 4,
      marginBottom: 3,
    },
    sectionBlockBase: {
      backgroundColor: c.surface,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 15,
    },
    sectionBlockRecommendations: {
      backgroundColor: c.surface,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
      marginBottom: 15,
    },
    sectionBlockRisks: {
      backgroundColor: c.destructive + "10",
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: c.destructive + "30",
      marginBottom: 15,
    },
    sectionBlockNextSteps: {
      backgroundColor: c.surface,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 15,
    },
    sectionBlockCostDrivers: {
      backgroundColor: c.surfaceLight,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 15,
    },
    sectionBlockHeader: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      fontWeight: 700,
      color: c.text,
      marginBottom: 10,
    },
    parameterBlock: {
      marginBottom: 10,
    },
    parameterLabel: {
      fontSize: 9,
      color: c.textMuted,
      fontFamily: "Helvetica",
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    parameterValue: {
      fontSize: 10,
      color: c.text,
      fontFamily: "Helvetica-Bold",
      lineHeight: 1.4,
    },
    parameterTagRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 4,
      marginTop: 2,
    },
    parameterTag: {
      backgroundColor: c.surfaceLight,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginBottom: 2,
    },
    parameterTagText: {
      fontSize: 9,
      color: c.text,
      fontFamily: "Helvetica-Bold",
    },
    numberedItem: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      marginBottom: 8,
    },
    numberedBullet: {
      width: 20,
      height: 20,
      backgroundColor: c.primary,
      borderRadius: 10,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginRight: 10,
      marginTop: 1,
    },
    numberedBulletText: {
      color: "#ffffff",
      fontSize: 9,
      fontWeight: 700,
    },
    checklistItem: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      marginBottom: 8,
    },
    checkBox: {
      width: 14,
      height: 14,
      borderWidth: 1.5,
      borderColor: c.primary,
      borderRadius: 2,
      marginRight: 10,
      marginTop: 2,
    },
    warningIcon: {
      fontSize: 14,
      marginRight: 6,
    },
    riskHeaderRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginBottom: 10,
    },
    auditTrail: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: c.border,
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      flexDirection: "column",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 15,
    },
    footerBrand: {
      fontSize: 9,
      fontFamily: "Helvetica",
      color: c.footerBrand,
      fontWeight: 400,
      marginBottom: 8,
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
    accentBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: c.primary,
    },
    gradientLayer1: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: "50%",
      backgroundColor: c.gradientLayer1,
    },
    gradientLayer2: {
      position: "absolute",
      top: "30%",
      left: 0,
      right: 0,
      bottom: "30%",
      backgroundColor: c.gradientLayer2,
    },
    gradientLayer3: {
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.gradientLayer3,
    },
  });
}

const darkDocStyles = buildDocStyles(darkColors);
const lightDocStyles = buildDocStyles(lightColors);

export type DocStyles = ReturnType<typeof buildDocStyles>;

export function getDocStyles(mode?: PdfThemeMode): DocStyles {
  return mode === "light" ? lightDocStyles : darkDocStyles;
}

// ── Reusable running header ──

export const RunningHeader = ({ scenarioTitle, dateStr, styles: s }: { scenarioTitle: string; dateStr: string; styles: DocStyles }) => (
  <View style={s.runningHeader} fixed>
    <Text style={s.runningHeaderText}>EXOS | {scenarioTitle} Analysis</Text>
    <Text style={s.runningHeaderText}>{dateStr}</Text>
  </View>
);

// ── Reusable footer ──

export const ReportFooter = ({ reportHash, styles: s }: { reportHash: string; styles: DocStyles }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerBrand}>Powered by EXOS Procurement Intelligence</Text>
    <View style={s.footerRow}>
      <Text style={s.footerText}>Confidential • For internal use only</Text>
      <Text
        style={s.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages} • ID: ${reportHash}`
        }
      />
    </View>
  </View>
);
