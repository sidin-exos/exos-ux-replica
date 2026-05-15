/**
 * EXOS Branded PDF theme — dual light/dark mode.
 * Based on EXOS Brand Book v2.0 — Teal-first, neutral backgrounds.
 */

import { StyleSheet } from "@react-pdf/renderer";

export type PdfThemeMode = "light" | "dark";

/** Light mode palette — neutral backgrounds, teal accents */
export const lightColors = {
  primary: "#277169",       // teal — headings, accents, header bar
  primaryDark: "#184d48",   // darker teal — hover/emphasis
  background: "#f5f7f8",    // neutral light gray (was sage)
  surface: "#FFFFFF",       // white — card backgrounds
  surfaceLight: "#edeff2",  // neutral light gray — alternating rows
  text: "#111621",          // near-black — body text
  textMuted: "#576274",     // medium gray — labels, captions
  textOnPrimary: "#FFFFFF", // white text on teal backgrounds
  success: "#277c54",       // dark green — positive values
  warning: "#ce8b16",       // dark amber — caution values
  destructive: "#ad2828",   // dark red — negative/risk values
  border: "#d5d9e1",        // neutral border
  badgeText: "#FFFFFF",     // white text on colored badges
  option2: "#6ba5a8",       // chart-2 teal-family
  option3: "#5ea090",       // chart-3 teal-family
  // Accent colors for cards/borders
  accent1: "#184d48",       // dark teal
  accent2: "#3e988f",       // mid teal
  accent3: "#ce8b16",       // warning amber
  accent4: "#9b613a",       // copper (restricted)
  // Risk severity colors
  riskCritical: "#ad2828",
  riskHigh: "#9b613a",      // copper
  riskMedium: "#ce8b16",    // warning
  // Chart stripe colors — teal-family muted
  stripe1: "#387e77",       // chart-1
  stripe2: "#549296",       // chart-2
  stripe3: "#4d897a",       // chart-3
  stripe4: "#69949f",       // chart-4
  stripe5: "#88a9a6",       // chart-5
  stripe6: "#25544f",       // chart-6
} as const;

/** Dark mode palette — dark neutral bg, dark cards */
export const darkColors = {
  primary: "#49aba1",       // bright teal — headings, accents
  primaryDark: "#2f7d75",   // slightly darker teal
  background: "#0d0f16",    // very dark neutral page background
  surface: "#151922",       // dark card backgrounds
  surfaceLight: "#212630",  // slightly lighter — alternating rows
  text: "#ebeff4",          // light gray — body text
  textMuted: "#96a1b0",     // medium slate — labels, captions
  textOnPrimary: "#FFFFFF", // white text on teal backgrounds
  success: "#379e6e",       // bright green — positive values
  warning: "#d9931a",       // bright amber — caution values
  destructive: "#c93535",   // bright red — negative/risk values
  border: "#2c3443",        // dark neutral border
  badgeText: "#FFFFFF",     // white text on colored badges
  option2: "#6ba5a8",       // chart-2
  option3: "#5ea090",       // chart-3
  // Accent colors for cards/borders
  accent1: "#49aba1",
  accent2: "#5ea090",
  accent3: "#d9931a",       // warning
  accent4: "#b78360",       // copper
  // Risk severity colors
  riskCritical: "#c93535",
  riskHigh: "#b78360",      // copper
  riskMedium: "#d9931a",    // warning
  // Chart stripe colors — teal-family
  stripe1: "#4ea69d",       // chart-1
  stripe2: "#6ba5a8",       // chart-2
  stripe3: "#5ea090",       // chart-3
  stripe4: "#7ea0a9",       // chart-4
  stripe5: "#96b0ad",       // chart-5
  stripe6: "#3a7c76",       // chart-6
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
      fontFamily: "Inter", fontWeight: 700,
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
      fontFamily: "Inter", fontWeight: 700,
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
      fontFamily: "Inter",
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
      fontFamily: "Inter", fontWeight: 700,
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
      fontFamily: "Inter", fontWeight: 700,
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
      fontFamily: "Inter",
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
      fontFamily: "Inter", fontWeight: 700,
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
