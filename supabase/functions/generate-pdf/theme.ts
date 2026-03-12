/**
 * Shared theme + styles for PDF dashboard visuals (server-side).
 */

import { StyleSheet } from "npm:@react-pdf/renderer@4";
import type { PdfThemeMode } from "./types.ts";

/** Dark theme colors (default) */
export const colors = {
  primary: "#6b9e8a",
  primaryDark: "#5a8a76",
  background: "#1e1e2e",
  surface: "#262637",
  surfaceLight: "#2f2f42",
  text: "#d4d4dc",
  textMuted: "#8b8b9e",
  success: "#6bbf8a",
  warning: "#c9a24d",
  destructive: "#c06060",
  border: "#3a3a4e",
  badgeText: "#1e1e2e",
  option2: "#7a7fa0",
  option3: "#8a7d9b",
} as const;

/** Light theme colors */
export const lightColors = {
  primary: "#4a8a74",
  primaryDark: "#3d7563",
  background: "#f8f7f4",
  surface: "#ffffff",
  surfaceLight: "#f0efe8",
  text: "#1e1e2e",
  textMuted: "#6b6b7e",
  success: "#3a9960",
  warning: "#b08930",
  destructive: "#c04040",
  border: "#d8d8e0",
  badgeText: "#1e1e2e",
  option2: "#6a6f90",
  option3: "#7a6d8b",
} as const;

export type PdfColorSet = { [K in keyof typeof colors]: string };

export function getPdfColors(mode?: PdfThemeMode): PdfColorSet {
  return mode === "light" ? lightColors : colors;
}

function buildStyles(c: PdfColorSet) {
  return StyleSheet.create({
    dashboardSection: { marginBottom: 20 },
    dashboardCard: { backgroundColor: c.surface, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: c.border },
    dashboardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    dashboardIcon: { width: 22, height: 22, backgroundColor: c.surfaceLight, borderRadius: 4, justifyContent: "center", alignItems: "center", marginRight: 8 },
    dashboardTitle: { fontSize: 15, fontFamily: "Helvetica", fontWeight: 600, color: c.text },
    dashboardSubtitle: { fontSize: 10, color: c.textMuted, marginTop: 2 },
    barContainer: { marginTop: 8 },
    barRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    barLabel: { width: 92, fontSize: 10, color: c.text },
    barTrack: { flex: 1, height: 14, backgroundColor: c.surfaceLight, borderRadius: 3, overflow: "hidden", marginLeft: 8, marginRight: 8, flexDirection: "row" },
    barFill: { height: 14, borderRadius: 3 },
    barValue: { width: 54, fontSize: 10, fontFamily: "Courier", color: c.textMuted, textAlign: "right" },
    matrixContainer: { marginTop: 8 },
    matrixRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.border },
    matrixHeader: { backgroundColor: c.surfaceLight },
    matrixCell: { flex: 1, padding: 6, fontSize: 10, fontFamily: "Helvetica", color: c.text, textAlign: "center" },
    matrixCellLeft: { textAlign: "left" },
    scoreCell: { width: 26, height: 20, borderRadius: 3, justifyContent: "center", alignItems: "center", alignSelf: "center" },
    scoreCellText: { fontSize: 9, fontFamily: "Courier", fontWeight: 700, color: c.badgeText },
    tornadoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    tornadoLabel: { width: 84, fontSize: 10, color: c.text },
    tornadoChart: { flex: 1, flexDirection: "row", alignItems: "center", height: 16 },
    tornadoLeft: { flex: 1, alignItems: "flex-end" },
    tornadoRight: { flex: 1, alignItems: "flex-start" },
    tornadoCenter: { width: 1, height: 16, backgroundColor: c.border },
    tornadoBar: { height: 14, borderRadius: 2 },
    tornadoValue: { width: 48, fontSize: 9, fontFamily: "Courier", color: c.textMuted, textAlign: "right" },
    legend: { flexDirection: "row", justifyContent: "center", marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.border },
    legendItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 8 },
    legendDot: { width: 9, height: 9, borderRadius: 2, marginRight: 4 },
    legendText: { fontSize: 9, color: c.textMuted },
    statsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.border },
    statItem: { alignItems: "center" },
    statLabel: { fontSize: 9, color: c.textMuted, marginBottom: 2 },
    statValue: { fontSize: 14, fontFamily: "Courier", fontWeight: 600, color: c.text },
    listRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    listDot: { width: 9, height: 9, borderRadius: 2, marginRight: 8 },
    listText: { flex: 1, fontSize: 10, fontFamily: "Helvetica", color: c.text },
    listMeta: { fontSize: 9, color: c.textMuted, marginLeft: 8 },
    quadrantGrid: { marginTop: 10, borderWidth: 1, borderColor: c.border, borderRadius: 6, overflow: "hidden" },
    quadrantRow: { flexDirection: "row" },
    quadrantCell: { flex: 1, height: 70, borderRightWidth: 1, borderRightColor: c.border, borderBottomWidth: 1, borderBottomColor: c.border, justifyContent: "flex-start", padding: 6 },
    quadrantCellLastCol: { borderRightWidth: 0 },
    quadrantCellLastRow: { borderBottomWidth: 0 },
    quadrantLabel: { fontSize: 9, color: c.textMuted },
    quadrantDot: { width: 9, height: 9, borderRadius: 4, marginTop: 6 },
  });
}

export const styles = buildStyles(colors);
export const lightStyles = buildStyles(lightColors);

export function getPdfStyles(mode?: PdfThemeMode) {
  return mode === "light" ? lightStyles : styles;
}
