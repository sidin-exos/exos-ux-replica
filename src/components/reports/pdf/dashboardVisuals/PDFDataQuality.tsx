import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";

const stats = [
  { label: "Coverage", value: "86%", color: colors.primary },
  { label: "Completeness", value: "78%", color: colors.warning },
  { label: "Confidence", value: "High", color: colors.success },
];

const fields = [
  { name: "Supplier list", value: 92, status: "Complete", missing: "-" },
  { name: "Volumes", value: 81, status: "Good", missing: "Q4 data pending" },
  { name: "Pricing", value: 74, status: "Partial", missing: "2 suppliers missing" },
  { name: "Terms", value: 63, status: "Partial", missing: "Renewal terms unclear" },
  { name: "Quality metrics", value: 88, status: "Good", missing: "-" },
];

const avgQuality = Math.round(fields.reduce((sum, f) => sum + f.value, 0) / fields.length);

const getScoreColor = (score: number): string => {
  if (score >= 80) return colors.success;
  if (score >= 70) return colors.warning;
  return colors.destructive;
};

export const PDFDataQuality = () => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.dashboardTitle}>Data Quality</Text>
        <Text style={styles.dashboardSubtitle}>Input coverage and confidence</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 12, fontWeight: 700, color: getScoreColor(avgQuality) }}>{avgQuality}%</Text>
        <Text style={{ fontSize: 6, color: colors.textMuted }}>avg quality</Text>
      </View>
    </View>

    {/* Summary stats */}
    <View style={styles.statsRow}>
      {stats.map((s, i) => (
        <View key={i} style={styles.statItem}>
          <Text style={styles.statLabel}>{s.label}</Text>
          <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
        </View>
      ))}
    </View>

    {/* Field breakdown table */}
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
              <View style={{ 
                width: 20, 
                height: 4, 
                backgroundColor: colors.surfaceLight, 
                borderRadius: 2, 
                marginRight: 4,
                overflow: "hidden"
              }}>
                <View style={{ 
                  width: `${item.value}%`, 
                  height: 4, 
                  backgroundColor: getScoreColor(item.value), 
                  borderRadius: 2 
                }} />
              </View>
              <Text style={{ fontSize: 7, color: getScoreColor(item.value), fontWeight: 600 }}>{item.value}%</Text>
            </View>
          </View>
          <View style={[styles.matrixCell, { alignItems: "center" }]}>
            <View style={{ 
              paddingHorizontal: 4, 
              paddingVertical: 1, 
              backgroundColor: getScoreColor(item.value) + "20", 
              borderRadius: 2 
            }}>
              <Text style={{ fontSize: 6, color: getScoreColor(item.value) }}>{item.status}</Text>
            </View>
          </View>
          <Text style={[styles.matrixCell, { flex: 1.5, fontSize: 7, color: item.missing === "-" ? colors.success : colors.textMuted }]}>
            {item.missing}
          </Text>
        </View>
      ))}
    </View>

    {/* Recommendations */}
    <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Text style={{ fontSize: 7, color: colors.textMuted }}>
        <Text style={{ color: colors.warning, fontWeight: 600 }}>Data Gap: </Text>
        Request missing supplier pricing and clarify renewal terms to improve analysis confidence.
      </Text>
    </View>
  </View>
);
