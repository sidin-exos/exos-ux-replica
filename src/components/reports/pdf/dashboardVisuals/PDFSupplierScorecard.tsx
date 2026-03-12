import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { SupplierScorecardData } from "@/lib/dashboard-data-parser";

const getScoreColor = (score: number, c: ReturnType<typeof getPdfColors>): string => {
  if (score >= 85) return c.success;
  if (score >= 70) return c.warning;
  return c.destructive;
};

const getTrendSymbol = (trend: string): string => {
  switch (trend) { case "up": return "▲"; case "down": return "▼"; default: return "►"; }
};

const getTrendColor = (trend: string, c: ReturnType<typeof getPdfColors>): string => {
  switch (trend) { case "up": return c.success; case "down": return c.destructive; default: return c.textMuted; }
};

function buildTableStyles(c: ReturnType<typeof getPdfColors>) {
  return {
    tableContainer: { marginTop: 8, borderWidth: 1, borderColor: c.border, borderRadius: 4, overflow: "hidden" as const },
    headerRow: { flexDirection: "row" as const, backgroundColor: c.surfaceLight, borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 6, paddingHorizontal: 8 },
    dataRow: { flexDirection: "row" as const, borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 6, paddingHorizontal: 8, alignItems: "center" as const },
    lastRow: { borderBottomWidth: 0 },
    colSupplier: { width: "35%" as const },
    colScore: { width: "15%" as const, alignItems: "center" as const },
    colTrend: { width: "12%" as const, alignItems: "center" as const },
    colSpend: { width: "18%" as const, alignItems: "flex-end" as const },
    colCategory: { width: "20%" as const, alignItems: "flex-end" as const },
    headerText: { fontSize: 9, fontWeight: 700 as const, color: c.textMuted, textTransform: "uppercase" as const },
    cellText: { fontSize: 10, color: c.text },
  };
}

export const PDFSupplierScorecard = ({ data, themeMode }: { data: SupplierScorecardData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const tableStyles = buildTableStyles(colors);

  const suppliers = data.suppliers.map(s => ({ name: s.name, score: s.score, trend: s.trend, spend: s.spend, category: "General" }));

  const avgScore = suppliers.length > 0 ? Math.round(suppliers.reduce((sum, s) => sum + s.score, 0) / suppliers.length) : 0;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Supplier Scorecard</Text>
          <Text style={styles.dashboardSubtitle}>Performance rankings & spend analysis</Text>
        </View>
        <Text style={{ fontSize: 9, color: colors.textMuted }}>{suppliers.length} suppliers</Text>
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
              <View style={{ backgroundColor: getScoreColor(supplier.score, colors) + "30", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: 700, color: getScoreColor(supplier.score, colors) }}>{supplier.score}</Text>
              </View>
            </View>
            <View style={tableStyles.colTrend}>
              <Text style={{ fontSize: 11, color: getTrendColor(supplier.trend, colors) }}>{getTrendSymbol(supplier.trend)}</Text>
            </View>
            <View style={tableStyles.colSpend}><Text style={[tableStyles.cellText, { textAlign: "right" }]}>{supplier.spend}</Text></View>
            <View style={tableStyles.colCategory}><Text style={[tableStyles.cellText, { fontSize: 9, color: colors.textMuted }]}>{supplier.category}</Text></View>
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
