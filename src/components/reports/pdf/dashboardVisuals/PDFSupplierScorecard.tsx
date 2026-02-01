import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";

const suppliers = [
  { name: "Alpha Corp", score: 92, trend: "up", spend: "$450K", color: colors.primary },
  { name: "Beta Industries", score: 78, trend: "down", spend: "$320K", color: colors.warning },
  { name: "Gamma Tech", score: 85, trend: "stable", spend: "$180K", color: colors.primary },
  { name: "Delta Services", score: 61, trend: "down", spend: "$275K", color: colors.textMuted },
  { name: "Epsilon Materials", score: 88, trend: "up", spend: "$210K", color: colors.primary },
];

const getScoreColor = (score: number): string => {
  if (score >= 85) return colors.primary;
  if (score >= 70) return colors.warning;
  return colors.textMuted;
};

const getTrendSymbol = (trend: string): string => {
  switch (trend) {
    case "up": return "↑";
    case "down": return "↓";
    default: return "→";
  }
};

const getTrendColor = (trend: string): string => {
  switch (trend) {
    case "up": return colors.success;
    case "down": return colors.textMuted;
    default: return colors.textMuted;
  }
};

export const PDFSupplierScorecard = () => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.dashboardTitle}>Supplier Scorecard</Text>
        <Text style={styles.dashboardSubtitle}>Performance rankings</Text>
      </View>
      <Text style={{ fontSize: 7, color: colors.textMuted }}>{suppliers.length} suppliers</Text>
    </View>

    {/* Score bars visualization */}
    <View style={{ marginTop: 8, marginBottom: 8 }}>
      {suppliers.map((supplier, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <View style={{ 
            flex: 1, 
            height: 10, 
            backgroundColor: colors.surfaceLight, 
            borderRadius: 2,
            overflow: "hidden",
            marginRight: 6
          }}>
            <View style={{ 
              height: 10, 
              backgroundColor: getScoreColor(supplier.score), 
              width: `${supplier.score}%`,
              borderRadius: 2
            }} />
          </View>
        </View>
      ))}
      {/* Reference line indicator */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
        <View style={{ flex: 0.75, borderRightWidth: 1, borderRightColor: colors.border, borderStyle: "dashed" }} />
        <Text style={{ fontSize: 6, color: colors.textMuted, marginLeft: 4 }}>Target: 75</Text>
      </View>
    </View>

    {/* Supplier list */}
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
      {suppliers.map((supplier, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          {/* Score badge */}
          <View style={{ 
            width: 22, 
            height: 22, 
            borderRadius: 11, 
            backgroundColor: getScoreColor(supplier.score) + "30",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 8
          }}>
            <Text style={{ fontSize: 7, fontWeight: 700, color: getScoreColor(supplier.score) }}>
              {supplier.score}
            </Text>
          </View>
          
          {/* Supplier info */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: colors.text }}>{supplier.name}</Text>
            <Text style={{ fontSize: 6, color: colors.textMuted }}>{supplier.spend}</Text>
          </View>
          
          {/* Trend indicator */}
          <Text style={{ fontSize: 10, color: getTrendColor(supplier.trend) }}>
            {getTrendSymbol(supplier.trend)}
          </Text>
        </View>
      ))}
    </View>

    {/* Legend */}
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
        <Text style={styles.legendText}>≥85 Excellent</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
        <Text style={styles.legendText}>≥70 Good</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
        <Text style={styles.legendText}>&lt;70 Needs Improvement</Text>
      </View>
    </View>
  </View>
);
