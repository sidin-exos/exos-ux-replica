import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";
import type { SupplierScorecardData } from "@/lib/dashboard-data-parser";

const defaultSuppliers = [
  { name: "Alpha Corp", score: 92, trend: "up" as const, spend: "$450K", category: "Strategic" },
  { name: "Beta Industries", score: 78, trend: "down" as const, spend: "$320K", category: "Leverage" },
  { name: "Gamma Tech", score: 85, trend: "stable" as const, spend: "$180K", category: "Strategic" },
  { name: "Delta Services", score: 61, trend: "down" as const, spend: "$275K", category: "Bottleneck" },
  { name: "Epsilon Materials", score: 88, trend: "up" as const, spend: "$210K", category: "Strategic" },
];

const getScoreColor = (score: number): string => {
  if (score >= 85) return colors.success;
  if (score >= 70) return colors.warning;
  return colors.destructive;
};

const getTrendSymbol = (trend: string): string => {
  switch (trend) { case "up": return "▲"; case "down": return "▼"; default: return "►"; }
};

const getTrendColor = (trend: string): string => {
  switch (trend) { case "up": return colors.success; case "down": return colors.destructive; default: return colors.textMuted; }
};

const tableStyles = {
  tableContainer: { marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 4, overflow: "hidden" as const },
  headerRow: { flexDirection: "row" as const, backgroundColor: colors.surfaceLight, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 8 },
  dataRow: { flexDirection: "row" as const, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 8, alignItems: "center" as const },
  lastRow: { borderBottomWidth: 0 },
  colSupplier: { width: "35%" as const },
  colScore: { width: "15%" as const, alignItems: "center" as const },
  colTrend: { width: "12%" as const, alignItems: "center" as const },
  colSpend: { width: "18%" as const, alignItems: "flex-end" as const },
  colCategory: { width: "20%" as const, alignItems: "flex-end" as const },
  headerText: { fontSize: 7, fontWeight: 700 as const, color: colors.textMuted, textTransform: "uppercase" as const },
  cellText: { fontSize: 8, color: colors.text },
};

export const PDFSupplierScorecard = ({ data }: { data?: SupplierScorecardData }) => {
  const suppliers = data?.suppliers
    ? data.suppliers.map(s => ({ name: s.name, score: s.score, trend: s.trend, spend: s.spend, category: "General" }))
    : defaultSuppliers;

  const avgScore = suppliers.length > 0 ? Math.round(suppliers.reduce((sum, s) => sum + s.score, 0) / suppliers.length) : 0;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Supplier Scorecard</Text>
          <Text style={styles.dashboardSubtitle}>Performance rankings & spend analysis</Text>
        </View>
        <Text style={{ fontSize: 7, color: colors.textMuted }}>{suppliers.length} suppliers</Text>
      </View>

      <View style={tableStyles.tableContainer}>
        <View style={tableStyles.headerRow}>
          <View style={tableStyles.colSupplier}><Text style={tableStyles.headerText}>Supplier</Text></View>
          <View style={tableStyles.colScore}><Text style={tableStyles.headerText}>Score</Text></View>
          <View style={tableStyles.colTrend}><Text style={tableStyles.headerText}>Trend</Text></View>
          <View style={tableStyles.colSpend}><Text style={tableStyles.headerText}>Spend</Text></View>
          <View style={tableStyles.colCategory}><Text style={tableStyles.headerText}>Category</Text></View>
        </View>

        {suppliers.map((supplier, i) => (
          <View key={i} style={[tableStyles.dataRow, i === suppliers.length - 1 && tableStyles.lastRow]}>
            <View style={tableStyles.colSupplier}><Text style={tableStyles.cellText}>{supplier.name}</Text></View>
            <View style={[tableStyles.colScore, { flexDirection: "row", justifyContent: "center" }]}>
              <View style={{ backgroundColor: getScoreColor(supplier.score) + "30", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                <Text style={{ fontSize: 8, fontWeight: 700, color: getScoreColor(supplier.score) }}>{supplier.score}</Text>
              </View>
            </View>
            <View style={tableStyles.colTrend}>
              <Text style={{ fontSize: 9, color: getTrendColor(supplier.trend) }}>{getTrendSymbol(supplier.trend)}</Text>
            </View>
            <View style={tableStyles.colSpend}><Text style={[tableStyles.cellText, { textAlign: "right" }]}>{supplier.spend}</Text></View>
            <View style={tableStyles.colCategory}><Text style={[tableStyles.cellText, { fontSize: 7, color: colors.textMuted }]}>{supplier.category}</Text></View>
          </View>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg Score</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>{avgScore}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Above Target</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{suppliers.filter(s => s.score >= 75).length}/{suppliers.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Spend</Text>
          <Text style={styles.statValue}>{suppliers.length > 0 ? suppliers[0].spend.replace(/[\d.]+/, '') : "$"}—</Text>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>≥85 Excellent</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>≥70 Good</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
          <Text style={styles.legendText}>&lt;70 At Risk</Text>
        </View>
      </View>
    </View>
  );
};
