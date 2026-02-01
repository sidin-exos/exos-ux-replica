/**
 * Static PDF-renderable dashboard visuals using @react-pdf/renderer primitives.
 * These replace interactive React charts with simple bar/grid representations.
 */
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { DashboardType, dashboardConfigs } from "@/lib/dashboard-mappings";

const colors = {
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
};

const styles = StyleSheet.create({
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
    gap: 8,
  },
  dashboardIcon: {
    width: 20,
    height: 20,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
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
    width: 80,
    fontSize: 8,
    color: colors.text,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: "hidden",
    marginHorizontal: 8,
    flexDirection: "row",
  },
  barFill: {
    height: 12,
    borderRadius: 3,
  },
  barValue: {
    width: 50,
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
    width: 70,
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
    width: 45,
    fontSize: 7,
    color: colors.textMuted,
    textAlign: "right",
  },
  // Legend
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
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
});

// ========================
// Cost Waterfall Visual
// ========================
const costBreakdownData = [
  { name: "Materials", value: 45, color: colors.textMuted },
  { name: "Labor", value: 25, color: colors.textMuted },
  { name: "Overhead", value: 17, color: colors.textMuted },
  { name: "Logistics", value: 6, color: colors.textMuted },
  { name: "Profit", value: 23, color: colors.warning },
];

export const PDFCostWaterfall = () => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View>
        <Text style={styles.dashboardTitle}>Cost Breakdown</Text>
        <Text style={styles.dashboardSubtitle}>Component analysis (% of total)</Text>
      </View>
    </View>
    <View style={styles.barContainer}>
      {costBreakdownData.map((item, i) => (
        <View key={i} style={styles.barRow}>
          <Text style={styles.barLabel}>{item.name}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { flex: item.value, backgroundColor: item.color }]} />
            <View style={{ flex: Math.max(0, 100 - item.value) }} />
          </View>
          <Text style={styles.barValue}>{item.value}%</Text>
        </View>
      ))}
    </View>
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
        <Text style={styles.legendText}>Cost Component</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
        <Text style={styles.legendText}>Supplier Margin</Text>
      </View>
    </View>
  </View>
);

// ========================
// Decision Matrix Visual
// ========================
const matrixCriteria = ["Total Cost", "Quality", "Delivery", "Risk", "Innovation"];
const matrixWeights = [30, 25, 20, 15, 10];
const matrixOptions = [
  { name: "Option A", scores: [4, 5, 3, 4, 3], total: 82 },
  { name: "Option B", scores: [5, 4, 4, 3, 4], total: 84 },
  { name: "Option C", scores: [3, 4, 5, 5, 5], total: 83 },
];

const getScoreBg = (score: number): string => {
  if (score >= 5) return colors.primary;
  if (score >= 4) return colors.primaryDark;
  if (score >= 3) return colors.warning;
  return colors.destructive;
};

export const PDFDecisionMatrix = () => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View>
        <Text style={styles.dashboardTitle}>Decision Matrix</Text>
        <Text style={styles.dashboardSubtitle}>Weighted multi-criteria analysis</Text>
      </View>
    </View>
    <View style={styles.matrixContainer}>
      {/* Header row */}
      <View style={[styles.matrixRow, styles.matrixHeader]}>
        <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5 }]}>Criteria</Text>
        <Text style={styles.matrixCell}>Wt%</Text>
        {matrixOptions.map((opt, i) => (
          <Text key={i} style={styles.matrixCell}>
            {opt.name}
          </Text>
        ))}
      </View>
      {/* Data rows */}
      {matrixCriteria.map((criterion, idx) => (
        <View key={idx} style={styles.matrixRow}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5 }]}>{criterion}</Text>
          <Text style={styles.matrixCell}>{matrixWeights[idx]}%</Text>
          {matrixOptions.map((opt, i) => (
            <View key={i} style={styles.matrixCell}>
              <View style={[styles.scoreCell, { backgroundColor: getScoreBg(opt.scores[idx]) }]}>
                <Text style={styles.scoreCellText}>{opt.scores[idx]}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
      {/* Total row */}
      <View style={[styles.matrixRow, { borderBottomWidth: 0 }]}>
        <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, fontWeight: 600 }]}>
          Weighted Score
        </Text>
        <Text style={styles.matrixCell}>100%</Text>
        {matrixOptions.map((opt, i) => (
          <Text
            key={i}
            style={[
              styles.matrixCell,
              { fontWeight: 700, color: opt.total === 84 ? colors.primary : colors.text },
            ]}
          >
            {opt.total}
          </Text>
        ))}
      </View>
    </View>
  </View>
);

// ========================
// Sensitivity Analysis (Tornado) Visual
// ========================
const sensitivityData = [
  { name: "Material Cost", lowPct: 35, highPct: 40, impact: "±$70K" },
  { name: "Labor Rate", lowPct: 20, highPct: 25, impact: "±$45K" },
  { name: "Volume", lowPct: 25, highPct: 20, impact: "±$20K" },
  { name: "Exchange Rate", lowPct: 18, highPct: 15, impact: "±$15K" },
  { name: "Overhead %", lowPct: 12, highPct: 18, impact: "±$10K" },
];

export const PDFSensitivityAnalysis = () => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View>
        <Text style={styles.dashboardTitle}>Sensitivity Analysis</Text>
        <Text style={styles.dashboardSubtitle}>Impact of variable changes on total cost</Text>
      </View>
    </View>
    <View style={{ marginTop: 8 }}>
      {sensitivityData.map((item, i) => (
        <View key={i} style={styles.tornadoRow}>
          <Text style={styles.tornadoLabel}>{item.name}</Text>
          <View style={styles.tornadoChart}>
            <View style={styles.tornadoLeft}>
              <View style={{ width: "100%", flexDirection: "row" }}>
                <View style={{ flex: Math.max(0, 100 - item.lowPct) }} />
                <View
                  style={[
                    styles.tornadoBar,
                    {
                      flex: item.lowPct,
                      backgroundColor: item.lowPct > 20 ? colors.destructive : colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.tornadoCenter} />
            <View style={styles.tornadoRight}>
              <View style={{ width: "100%", flexDirection: "row" }}>
                <View
                  style={[
                    styles.tornadoBar,
                    {
                      flex: item.highPct,
                      backgroundColor: item.highPct > 20 ? colors.destructive : colors.primary,
                    },
                  ]}
                />
                <View style={{ flex: Math.max(0, 100 - item.highPct) }} />
              </View>
            </View>
          </View>
          <Text style={styles.tornadoValue}>{item.impact}</Text>
        </View>
      ))}
    </View>
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
        <Text style={styles.legendText}>Favorable</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
        <Text style={styles.legendText}>Unfavorable</Text>
      </View>
    </View>
  </View>
);

// ========================
// Generic placeholder for other dashboard types
// ========================
export const PDFDashboardPlaceholder = ({ name }: { name: string }) => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View>
        <Text style={styles.dashboardTitle}>{name}</Text>
        <Text style={styles.dashboardSubtitle}>Visualization available in web report</Text>
      </View>
    </View>
    <View style={{ padding: 12, alignItems: "center" }}>
      <Text style={{ fontSize: 8, color: colors.textMuted, textAlign: "center" }}>
        Interactive chart available via the shareable web link.
      </Text>
    </View>
  </View>
);

// ========================
// Main Renderer
// ========================
interface PDFDashboardVisualsProps {
  selectedDashboards: DashboardType[];
}

export const PDFDashboardVisuals = ({ selectedDashboards }: PDFDashboardVisualsProps) => {
  if (!selectedDashboards || selectedDashboards.length === 0) {
    return null;
  }

  return (
    <View style={styles.dashboardSection}>
      {selectedDashboards.map((dashboardType) => {
        const config = dashboardConfigs[dashboardType];
        switch (dashboardType) {
          case "cost-waterfall":
            return (
              <View key={dashboardType} style={{ marginBottom: 12 }}>
                <PDFCostWaterfall />
              </View>
            );
          case "decision-matrix":
            return (
              <View key={dashboardType} style={{ marginBottom: 12 }}>
                <PDFDecisionMatrix />
              </View>
            );
          case "sensitivity-spider":
            return (
              <View key={dashboardType} style={{ marginBottom: 12 }}>
                <PDFSensitivityAnalysis />
              </View>
            );
          default:
            return (
              <View key={dashboardType} style={{ marginBottom: 12 }}>
                <PDFDashboardPlaceholder name={config?.name || dashboardType} />
              </View>
            );
        }
      })}
    </View>
  );
};

export default PDFDashboardVisuals;
