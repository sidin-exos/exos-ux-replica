/**
 * Enterprise print-ready theme for PDF dashboard visuals (server-side).
 * White background, black text, minimal color — McKinsey/BCG quality.
 */

import { StyleSheet } from "npm:@react-pdf/renderer@4";
import type { PdfThemeMode } from "./types.ts";

/** Enterprise print palette — used for ALL PDF output */
export const lightColors = {
  primary: "#1B2A4A",       // navy — headings only
  primaryDark: "#162038",   // darker navy
  background: "#FFFFFF",    // white — always
  surface: "#F8FAFC",       // off-white — KPI backgrounds
  surfaceLight: "#F9FAFB",  // ice gray — alternating rows
  text: "#1A1A1A",          // near-black — body text
  textMuted: "#6B7280",     // medium gray — labels, captions
  success: "#15803D",       // dark green — positive values
  warning: "#B45309",       // dark amber — caution values
  destructive: "#B91C1C",   // dark red — negative/risk values
  border: "#E5E7EB",        // light gray — borders, dividers
  badgeText: "#FFFFFF",     // white text on colored badges
  option2: "#94A3B8",       // slate — secondary chart color
  option3: "#6B7280",       // gray — tertiary chart color
} as const;

/** Dark colors = same enterprise palette (kept for API compat) */
export const colors = { ...lightColors } as const;

export type PdfColorSet = { [K in keyof typeof colors]: string };

export function getPdfColors(_mode?: PdfThemeMode): PdfColorSet {
  return lightColors;
}

function buildStyles(c: PdfColorSet) {
  return StyleSheet.create({
    // ─── Reusable primitives ───────────────────────────────────────────────
    card: {
      backgroundColor: c.background,
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

    // ─── Dashboard card structure ──────────────────────────────────────────
    dashboardSection: { marginBottom: 16 },
    dashboardCard: {
      backgroundColor: c.background,
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

    // ─── Bar charts ────────────────────────────────────────────────────────
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

    // ─── Tables / matrices ─────────────────────────────────────────────────
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

    // ─── Tornado / sensitivity charts ──────────────────────────────────────
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

    // ─── Legend ────────────────────────────────────────────────────────────
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

    // ─── Stats row ─────────────────────────────────────────────────────────
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

    // ─── List rows ─────────────────────────────────────────────────────────
    listRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5 },
    listDot: { width: 8, height: 8, marginRight: 8, marginTop: 1 },
    listText: { flex: 1, fontSize: 9, color: c.text },
    listMeta: { fontSize: 8, color: c.textMuted, marginLeft: 8 },

    // ─── Kraljic 2×2 quadrant grid ─────────────────────────────────────────
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
export const styles = lightStyles;

export function getPdfStyles(_mode?: PdfThemeMode) {
  return lightStyles;
}
