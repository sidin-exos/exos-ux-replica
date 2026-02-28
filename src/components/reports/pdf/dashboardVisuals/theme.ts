/**
 * Shared theme + styles for PDF-renderable dashboard visuals.
 * Note: @react-pdf/renderer supports a limited flexbox subset; avoid `gap`.
 */

import { StyleSheet } from "@react-pdf/renderer";

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
  /** Muted option colors for multi-series charts */
  option2: "#7a7fa0",
  option3: "#8a7d9b",
} as const;

export const styles = StyleSheet.create({
  dashboardSection: {
    marginBottom: 20,
  },
  dashboardCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dashboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dashboardIcon: {
    width: 22,
    height: 22,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  dashboardTitle: {
    fontSize: 13,
    fontFamily: "Helvetica",
    fontWeight: 600,
    color: colors.text,
  },
  dashboardSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Bar chart styles
  barContainer: {
    marginTop: 8,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  barLabel: {
    width: 92,
    fontSize: 9,
    color: colors.text,
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: "hidden",
    marginLeft: 8,
    marginRight: 8,
    flexDirection: "row",
  },
  barFill: {
    height: 14,
    borderRadius: 3,
  },
  barValue: {
    width: 54,
    fontSize: 9,
    fontFamily: "Courier",
    color: colors.textMuted,
    textAlign: "right",
  },

  // Grid/matrix styles
  matrixContainer: {
    marginTop: 8,
  },
  matrixRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  matrixHeader: {
    backgroundColor: colors.surfaceLight,
  },
  matrixCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: colors.text,
    textAlign: "center",
  },
  matrixCellLeft: {
    textAlign: "left",
  },
  scoreCell: {
    width: 26,
    height: 20,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  scoreCellText: {
    fontSize: 8,
    fontFamily: "Courier",
    fontWeight: 700,
    color: colors.background,
  },

  // Tornado chart styles
  tornadoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tornadoLabel: {
    width: 84,
    fontSize: 9,
    color: colors.text,
  },
  tornadoChart: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 16,
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
    height: 16,
    backgroundColor: colors.border,
  },
  tornadoBar: {
    height: 14,
    borderRadius: 2,
  },
  tornadoValue: {
    width: 48,
    fontSize: 8,
    fontFamily: "Courier",
    color: colors.textMuted,
    textAlign: "right",
  },

  // Legend
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 8,
    color: colors.textMuted,
  },

  // Summary stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontFamily: "Courier",
    fontWeight: 600,
    color: colors.text,
  },

  // Simple list/steps
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  listDot: {
    width: 9,
    height: 9,
    borderRadius: 2,
    marginRight: 8,
  },
  listText: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: colors.text,
  },
  listMeta: {
    fontSize: 8,
    color: colors.textMuted,
    marginLeft: 8,
  },

  // 2x2 quadrant
  quadrantGrid: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  quadrantRow: {
    flexDirection: "row",
  },
  quadrantCell: {
    flex: 1,
    height: 70,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: "flex-start",
    padding: 6,
  },
  quadrantCellLastCol: {
    borderRightWidth: 0,
  },
  quadrantCellLastRow: {
    borderBottomWidth: 0,
  },
  quadrantLabel: {
    fontSize: 8,
    color: colors.textMuted,
  },
  quadrantDot: {
    width: 9,
    height: 9,
    borderRadius: 4,
    marginTop: 6,
  },
});
