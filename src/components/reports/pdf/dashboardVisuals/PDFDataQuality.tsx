import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { DataQualityData } from "@/lib/dashboard-data-parser";

const statusToDisplay = (status: string): { label: string; missing: string } => {
  if (status === "complete") return { label: "Complete", missing: "-" };
  if (status === "partial") return { label: "Partial", missing: "Data gaps present" };
  return { label: "Missing", missing: "Data not available" };
};

export const PDFDataQuality = ({ data, themeMode }: { data: DataQualityData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.success;
    if (score >= 70) return colors.warning;
    return colors.destructive;
  };

  const fields = data.fields.map(f => {
    const display = statusToDisplay(f.status);
    return {
      name: f.field,
      value: f.coverage,
      status: display.label,
      missing: display.missing,
    };
  });

  const avgQuality = fields.length > 0 ? Math.round(fields.reduce((sum, f) => sum + f.value, 0) / fields.length) : 0;

  const stats = [
    { label: "Coverage", value: `${avgQuality}%`, color: colors.primary },
    { label: "Completeness", value: `${fields.filter(f => f.value >= 80).length}/${fields.length}`, color: colors.warning },
    { label: "Confidence", value: avgQuality >= 75 ? "High" : avgQuality >= 60 ? "Medium" : "Low", color: avgQuality >= 75 ? colors.success : colors.warning },
  ];

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Data Quality</Text>
          <Text style={styles.dashboardSubtitle}>Input coverage and confidence</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 15, fontWeight: 700, color: getScoreColor(avgQuality) }}>{avgQuality}%</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>avg quality</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((s, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.2 }]}>Field</Text>
          <Text style={styles.matrixCell}>Score</Text>
          <Text style={styles.matrixCell}>Status</Text>
          <Text style={[styles.matrixCell, { flex: 1.5 }]}>Gap</Text>
        </View>
        {fields.map((item, i) => (
          <View key={i} style={styles.matrixRow}>
            <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.2 }]}>{item.name}</Text>
            <View style={[styles.matrixCell, { alignItems: "center" }]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 22, height: 5, backgroundColor: colors.surfaceLight, borderRadius: 2, marginRight: 4, overflow: "hidden" }}>
                  <View style={{ width: `${item.value}%`, height: 5, backgroundColor: getScoreColor(item.value), borderRadius: 2 }} />
                </View>
                <Text style={{ fontSize: 9, color: getScoreColor(item.value), fontWeight: 600 }}>{item.value}%</Text>
              </View>
            </View>
            <View style={[styles.matrixCell, { alignItems: "center" }]}>
              <View style={{ paddingHorizontal: 4, paddingVertical: 1, backgroundColor: getScoreColor(item.value) + "20", borderRadius: 2 }}>
                <Text style={{ fontSize: 8, color: getScoreColor(item.value) }}>{item.status}</Text>
              </View>
            </View>
            <Text style={[styles.matrixCell, { flex: 1.5, fontSize: 9, color: item.missing === "-" ? colors.success : colors.textMuted }]}>
              {item.missing}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}>
          <Text style={{ color: colors.warning, fontWeight: 600 }}>Data Gap: </Text>
          Request missing supplier pricing and clarify renewal terms to improve analysis confidence.
        </Text>
      </View>
    </View>
  );
};
