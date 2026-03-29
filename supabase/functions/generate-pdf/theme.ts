/**
 * EXOS Branded PDF theme (server-side) — dual light/dark mode.
 * Matches EXOS_Report_Template_Light.pdf and EXOS_Report_Template_Dark.pdf.
 */

import { StyleSheet } from "npm:@react-pdf/renderer@4";
import type { PdfThemeMode } from "./types.ts";

/** Light mode palette — sage page bg, white cards */
export const lightColors = {
  primary: "#3D7A6E",
  primaryDark: "#2D5F55",
  background: "#E8F0EA",
  surface: "#FFFFFF",
  surfaceLight: "#F3F7F4",
  text: "#1A1A1A",
  textMuted: "#6B7280",
  textOnPrimary: "#FFFFFF",
  success: "#15803D",
  warning: "#B45309",
  destructive: "#B91C1C",
  border: "rgba(229, 231, 235, 0.6)",
  badgeText: "#FFFFFF",
  option2: "#94A3B8",
  option3: "#6B7280",
  accent1: "#2D5F55",
  accent2: "#3B8574",
  accent3: "#EAB308",
  accent4: "#DC7548",
  riskCritical: "#B91C1C",
  riskHigh: "#DC7548",
  riskMedium: "#3B82F6",
  stripe1: "#3D7A6E",
  stripe2: "#3B82F6",
  stripe3: "#22C55E",
  stripe4: "#EAB308",
  stripe5: "#DC7548",
  stripe6: "#DC2626",
} as const;

/** Dark mode palette — charcoal bg, dark cards */
export const darkColors = {
  primary: "#4DB6AC",
  primaryDark: "#3D9B91",
  background: "#1C2B3A",
  surface: "#243447",
  surfaceLight: "#2A3B4E",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textOnPrimary: "#FFFFFF",
  success: "#4ADE80",
  warning: "#FBBF24",
  destructive: "#F87171",
  border: "rgba(148, 163, 184, 0.25)",
  badgeText: "#FFFFFF",
  option2: "#64748B",
  option3: "#475569",
  accent1: "#4DB6AC",
  accent2: "#81C784",
  accent3: "#FFD54F",
  accent4: "#FF8A65",
  riskCritical: "#F87171",
  riskHigh: "#FF8A65",
  riskMedium: "#60A5FA",
  stripe1: "#4DB6AC",
  stripe2: "#60A5FA",
  stripe3: "#4ADE80",
  stripe4: "#FBBF24",
  stripe5: "#FF8A65",
  stripe6: "#F87171",
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
