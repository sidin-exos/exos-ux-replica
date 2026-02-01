/**
 * Shared theme + styles for PDF-renderable dashboard visuals.
 * Note: @react-pdf/renderer supports a limited flexbox subset; avoid `gap`.
 */

import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  primary: "#14b8a6",
  primaryDark: "#0d9488",
  background: "#0c1220",
  surface: "#111827",
  surfaceLight: "#1f2937",
  text: "#f9fafb",
  textMuted: "#9ca3af",
  success: "#22c55e",
  warning: "#f59e0b",
  destructive: "#ef4444",
  border: "#374151",
} as const;

export const styles = StyleSheet.create({
  dashboardSection: {
    marginBottom: 20,
  },
  dashboardCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dashboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dashboardIcon: {
    width: 20,
    height: 20,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  dashboardTitle: {
    fontSize: 11,
    fontFamily: "Helvetica",
    fontWeight: 600,
    color: colors.text,
  },
  dashboardSubtitle: {
    fontSize: 8,
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
    fontSize: 8,
    color: colors.text,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: "hidden",
    marginLeft: 8,
    marginRight: 8,
    flexDirection: "row",
  },
  barFill: {
    height: 12,
    borderRadius: 3,
  },
  barValue: {
    width: 54,
    fontSize: 8,
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
    fontSize: 8,
    color: colors.text,
    textAlign: "center",
  },
  matrixCellLeft: {
    textAlign: "left",
  },
  scoreCell: {
    width: 24,
    height: 18,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  scoreCellText: {
    fontSize: 7,
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
    fontSize: 8,
    color: colors.text,
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
    backgroundColor: colors.border,
  },
  tornadoBar: {
    height: 12,
    borderRadius: 2,
  },
  tornadoValue: {
    width: 48,
    fontSize: 7,
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
    width: 8,
    height: 8,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 7,
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
    fontSize: 7,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 10,
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
    width: 8,
    height: 8,
    borderRadius: 2,
    marginRight: 8,
  },
  listText: {
    flex: 1,
    fontSize: 8,
    color: colors.text,
  },
  listMeta: {
    fontSize: 7,
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
    fontSize: 7,
    color: colors.textMuted,
  },
  quadrantDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
});
