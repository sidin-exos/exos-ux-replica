/**
 * EXOS Branded PDF theme — dual light/dark mode.
 * Matches EXOS_Report_Template_Light.pdf and EXOS_Report_Template_Dark.pdf.
 */

import { StyleSheet } from "@react-pdf/renderer";

export type PdfThemeMode = "light" | "dark";

/** Light mode palette — sage page bg, white cards */
export const lightColors = {
  primary: "#3D7A6E",       // teal — headings, accents, header bar
  primaryDark: "#2D5F55",   // darker teal — hover/emphasis
  background: "#E8F0EA",    // sage/mint page background
  surface: "#FFFFFF",       // white — card backgrounds
  surfaceLight: "#F3F7F4",  // light sage — alternating rows
  text: "#1A1A1A",          // near-black — body text
  textMuted: "#6B7280",     // medium gray — labels, captions
  textOnPrimary: "#FFFFFF", // white text on teal backgrounds
  success: "#15803D",       // dark green — positive values
  warning: "#B45309",       // dark amber — caution values
  destructive: "#B91C1C",   // dark red — negative/risk values
  border: "rgba(229, 231, 235, 0.6)", // semi-transparent borders
  badgeText: "#FFFFFF",     // white text on colored badges
  option2: "#94A3B8",       // slate — secondary chart color
  option3: "#6B7280",       // gray — tertiary chart color
  // Accent colors for cards/borders
  accent1: "#2D5F55",       // dark teal
  accent2: "#3B8574",       // medium teal
  accent3: "#EAB308",       // amber/yellow
  accent4: "#DC7548",       // coral/orange
  // Risk severity colors
  riskCritical: "#B91C1C",
  riskHigh: "#DC7548",
  riskMedium: "#3B82F6",
  // Bottom stripe colors
  stripe1: "#3D7A6E",
  stripe2: "#3B82F6",
  stripe3: "#22C55E",
  stripe4: "#EAB308",
  stripe5: "#DC7548",
  stripe6: "#DC2626",
} as const;

/** Dark mode palette — dark charcoal bg, dark cards */
export const darkColors = {
  primary: "#4DB6AC",       // bright teal — headings, accents
  primaryDark: "#3D9B91",   // slightly darker teal
  background: "#1C2B3A",   // dark charcoal page background
  surface: "#243447",       // dark card backgrounds
  surfaceLight: "#2A3B4E",  // slightly lighter — alternating rows
  text: "#E2E8F0",          // light gray — body text
  textMuted: "#94A3B8",     // medium slate — labels, captions
  textOnPrimary: "#FFFFFF", // white text on teal backgrounds
  success: "#4ADE80",       // bright green — positive values
  warning: "#FBBF24",       // bright amber — caution values
  destructive: "#F87171",   // bright red — negative/risk values
  border: "rgba(148, 163, 184, 0.25)", // semi-transparent borders
  badgeText: "#FFFFFF",     // white text on colored badges
  option2: "#64748B",       // slate — secondary chart color
  option3: "#475569",       // darker slate — tertiary chart color
  // Accent colors for cards/borders
  accent1: "#4DB6AC",
  accent2: "#81C784",
  accent3: "#FFD54F",
  accent4: "#FF8A65",
  // Risk severity colors
  riskCritical: "#F87171",
  riskHigh: "#FF8A65",
  riskMedium: "#60A5FA",
  // Bottom stripe colors
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
    dashboardSection: {
      marginBottom: 20,
    },
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
      flex: 1,
    },
    dashboardSubtitle: {
      fontSize: 9,
      color: c.textMuted,
      marginTop: 2,
    },

    // Bar chart styles
    barContainer: {
      marginTop: 8,
    },
    barRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
    },
    barLabel: {
      width: 100,
      fontSize: 9,
      color: c.text,
    },
    barTrack: {
      flex: 1,
      height: 12,
      backgroundColor: c.surfaceLight,
      marginLeft: 8,
      marginRight: 8,
      flexDirection: "row",
      overflow: "hidden",
    },
    barFill: {
      height: 12,
    },
    barValue: {
      width: 56,
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: c.text,
      textAlign: "right",
    },

    // Grid/matrix styles
    matrixContainer: {
      marginTop: 8,
    },
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
      fontFamily: "Helvetica",
      color: c.text,
      textAlign: "center",
    },
    matrixCellLeft: {
      textAlign: "left",
    },
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

    // Tornado chart styles
    tornadoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 7,
    },
    tornadoLabel: {
      width: 90,
      fontSize: 9,
      color: c.text,
    },
    tornadoChart: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      height: 14,
    },
    tornadoLeft: {
      flex: 1,
      alignItems: "flex-end",
    },
    tornadoRight: {
      flex: 1,
      alignItems: "flex-start",
    },
    tornadoCenter: {
      width: 1,
      height: 14,
      backgroundColor: c.textMuted,
    },
    tornadoBar: {
      height: 12,
    },
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
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 8,
      marginBottom: 2,
    },
    legendDot: {
      width: 8,
      height: 8,
      marginRight: 4,
    },
    legendText: {
      fontSize: 8,
      color: c.textMuted,
    },

    // Summary stats
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    statItem: {
      alignItems: "center",
      flex: 1,
    },
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

    // Simple list/steps
    listRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 5,
    },
    listDot: {
      width: 8,
      height: 8,
      marginRight: 8,
      marginTop: 1,
    },
    listText: {
      flex: 1,
      fontSize: 9,
      fontFamily: "Helvetica",
      color: c.text,
    },
    listMeta: {
      fontSize: 8,
      color: c.textMuted,
      marginLeft: 8,
    },

    // 2x2 quadrant
    quadrantGrid: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    quadrantRow: {
      flexDirection: "row",
    },
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
    quadrantCellLastCol: {
      borderRightWidth: 0,
    },
    quadrantCellLastRow: {
      borderBottomWidth: 0,
    },
    quadrantLabel: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: c.primary,
      marginBottom: 3,
    },
    quadrantDot: {
      width: 8,
      height: 8,
      marginTop: 4,
    },
  });
}

/** Light styles */
export const lightStyles = buildStyles(lightColors);
/** Dark styles */
export const darkStyles = buildStyles(darkColors);
/** Default export (light) */
export const styles = lightStyles;

export function getPdfStyles(mode?: PdfThemeMode) {
  return mode === "dark" ? darkStyles : lightStyles;
}
