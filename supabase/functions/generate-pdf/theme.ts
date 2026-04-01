/**
 * EXOS Branded PDF theme (server-side) — dual light/dark mode.
 * Based on EXOS Brand Book v2.0 — Teal-first, neutral backgrounds.
 */

import { StyleSheet } from "npm:@react-pdf/renderer@4";
import type { PdfThemeMode } from "./types.ts";

/** Light mode palette — neutral backgrounds, teal accents */
export const lightColors = {
  primary: "#277169",
  primaryDark: "#184d48",
  background: "#f5f7f8",
  surface: "#FFFFFF",
  surfaceLight: "#edeff2",
  text: "#111621",
  textMuted: "#576274",
  textOnPrimary: "#FFFFFF",
  success: "#277c54",
  warning: "#ce8b16",
  destructive: "#ad2828",
  border: "#d5d9e1",
  badgeText: "#FFFFFF",
  option2: "#6ba5a8",
  option3: "#5ea090",
  accent1: "#184d48",
  accent2: "#3e988f",
  accent3: "#ce8b16",
  accent4: "#9b613a",
  riskCritical: "#ad2828",
  riskHigh: "#9b613a",
  riskMedium: "#ce8b16",
  stripe1: "#387e77",
  stripe2: "#549296",
  stripe3: "#4d897a",
  stripe4: "#69949f",
  stripe5: "#88a9a6",
  stripe6: "#25544f",
} as const;

/** Dark mode palette — dark neutral bg, dark cards */
export const darkColors = {
  primary: "#49aba1",
  primaryDark: "#2f7d75",
  background: "#0d0f16",
  surface: "#151922",
  surfaceLight: "#212630",
  text: "#ebeff4",
  textMuted: "#96a1b0",
  textOnPrimary: "#FFFFFF",
  success: "#379e6e",
  warning: "#d9931a",
  destructive: "#c93535",
  border: "#2c3443",
  badgeText: "#FFFFFF",
  option2: "#6ba5a8",
  option3: "#5ea090",
  accent1: "#49aba1",
  accent2: "#5ea090",
  accent3: "#d9931a",
  accent4: "#b78360",
  riskCritical: "#c93535",
  riskHigh: "#b78360",
  riskMedium: "#d9931a",
  stripe1: "#4ea69d",
  stripe2: "#6ba5a8",
  stripe3: "#5ea090",
  stripe4: "#7ea0a9",
  stripe5: "#96b0ad",
  stripe6: "#3a7c76",
} as const;

export const colors = lightColors;

export type PdfColorSet = { [K in keyof typeof lightColors]: string };

export function getPdfColors(mode?: PdfThemeMode): PdfColorSet {
  return mode === "dark" ? darkColors : lightColors;
}

function buildStyles(c: PdfColorSet) {
  return StyleSheet.create({
    // Reusable primitives
    card: {
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      padding: 12,
    },
    tableHeader: {
      backgroundColor: c.primary,
      flexDirection: "row",
    },
    tableRowAlt: {
      backgroundColor: c.surfaceLight,
    },
    badge: {
      fontSize: 7,
      paddingHorizontal: 4,
      paddingVertical: 2,
      color: c.badgeText,
    },
    metricCard: {
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      borderLeftWidth: 4,
      borderLeftColor: c.primary,
      padding: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: c.primary,
      marginBottom: 8,
      marginTop: 24,
      paddingBottom: 4,
      borderBottomWidth: 2,
      borderBottomColor: c.border,
    },
    divider: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      marginVertical: 10,
    },
    pageHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 8,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    pageFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 6,
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },

    // Dashboard card structure
    dashboardSection: { marginBottom: 16 },
    dashboardCard: {
      backgroundColor: c.surface,
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      marginBottom: 8,
    },
    dashboardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    dashboardIcon: {
      width: 0,
      height: 0,
    },
    dashboardTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      lineHeight: 1.4,
    },
    dashboardSubtitle: {
      fontSize: 9,
      color: c.textMuted,
      marginTop: 3,
      lineHeight: 1.3,
    },

    // Bar charts
    barContainer: { marginTop: 8 },
    barRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
    barLabel: { width: 100, fontSize: 9, color: c.text },
    barTrack: {
      flex: 1,
      height: 12,
      backgroundColor: c.surfaceLight,
      marginLeft: 8,
      marginRight: 8,
      flexDirection: "row",
      overflow: "hidden",
    },
    barFill: { height: 12 },
    barValue: {
      width: 56,
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: c.text,
      textAlign: "right",
    },

    // Tables / matrices
    matrixContainer: { marginTop: 8 },
    matrixRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    matrixHeader: {
      backgroundColor: c.primary,
    },
    matrixCell: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      fontSize: 9,
      color: c.text,
      textAlign: "center",
    },
    matrixCellLeft: { textAlign: "left" },
    scoreCell: {
      width: 26,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
    },
    scoreCellText: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: c.badgeText,
    },

    // Tornado / sensitivity charts
    tornadoRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
    tornadoLabel: { width: 90, fontSize: 9, color: c.text },
    tornadoChart: { flex: 1, flexDirection: "row", alignItems: "center", height: 14 },
    tornadoLeft: { flex: 1, alignItems: "flex-end" },
    tornadoRight: { flex: 1, alignItems: "flex-start" },
    tornadoCenter: { width: 1, height: 14, backgroundColor: c.textMuted },
    tornadoBar: { height: 12 },
    tornadoValue: {
      width: 44,
      fontSize: 8,
      color: c.textMuted,
      textAlign: "right",
    },

    // Legend
    legend: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      marginTop: 8,
      paddingTop: 7,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    legendItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 8, marginBottom: 2 },
    legendDot: { width: 8, height: 8, marginRight: 4 },
    legendText: { fontSize: 8, color: c.textMuted },

    // Stats row
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    statItem: { alignItems: "center", flex: 1 },
    statLabel: {
      fontSize: 8,
      color: c.textMuted,
      marginBottom: 3,
      textTransform: "uppercase",
    },
    statValue: {
      fontSize: 15,
      fontFamily: "Helvetica-Bold",
      color: c.primary,
    },

    // List rows
    listRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5 },
    listDot: { width: 8, height: 8, marginRight: 8, marginTop: 1 },
    listText: { flex: 1, fontSize: 9, color: c.text },
    listMeta: { fontSize: 8, color: c.textMuted, marginLeft: 8 },

    // Kraljic 2×2 quadrant grid
    quadrantGrid: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    quadrantRow: { flexDirection: "row" },
    quadrantCell: {
      flex: 1,
      height: 72,
      borderRightWidth: 1,
      borderRightColor: c.border,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      justifyContent: "flex-start",
      padding: 7,
    },
    quadrantCellLastCol: { borderRightWidth: 0 },
    quadrantCellLastRow: { borderBottomWidth: 0 },
    quadrantLabel: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: c.primary,
      marginBottom: 3,
    },
    quadrantDot: { width: 8, height: 8, marginTop: 4 },
  });
}

export const lightStyles = buildStyles(lightColors);
export const darkStylesBuilt = buildStyles(darkColors);
export const styles = lightStyles;

export function getPdfStyles(mode?: PdfThemeMode) {
  return mode === "dark" ? darkStylesBuilt : lightStyles;
}
