import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";

const variables = [
  { name: "Volume ±20%", low: -15, high: 18, baseValue: "100K units" },
  { name: "Price ±10%", low: -12, high: 10, baseValue: "$45/unit" },
  { name: "Exchange Rate ±5%", low: -8, high: 6, baseValue: "1.08 USD/EUR" },
  { name: "Lead Time ±30%", low: -5, high: 4, baseValue: "6 weeks" },
  { name: "Quality Defects ±50%", low: -3, high: 2, baseValue: "2%" },
];

const maxImpact = Math.max(...variables.map(v => Math.max(Math.abs(v.low), Math.abs(v.high))));
const scale = 40 / maxImpact;

export const PDFSensitivityAnalysis = () => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.dashboardTitle}>Sensitivity Analysis</Text>
        <Text style={styles.dashboardSubtitle}>Tornado chart: impact on total cost</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: colors.primary }}>±{maxImpact}%</Text>
        <Text style={{ fontSize: 6, color: colors.textMuted }}>max impact</Text>
      </View>
    </View>

    {/* Tornado Chart */}
    <View style={{ marginTop: 10 }}>
      {variables.map((v, i) => (
        <View key={i} style={styles.tornadoRow}>
          <View style={{ width: 84 }}>
            <Text style={styles.tornadoLabel}>{v.name}</Text>
            <Text style={{ fontSize: 6, color: colors.textMuted }}>{v.baseValue}</Text>
          </View>
          
          <View style={styles.tornadoChart}>
            {/* Left side (negative) */}
            <View style={styles.tornadoLeft}>
              <View style={[
                styles.tornadoBar, 
                { 
                  width: Math.abs(v.low) * scale, 
                  backgroundColor: colors.destructive,
                }
              ]} />
            </View>
            
            {/* Center line */}
            <View style={styles.tornadoCenter} />
            
            {/* Right side (positive) */}
            <View style={styles.tornadoRight}>
              <View style={[
                styles.tornadoBar, 
                { 
                  width: v.high * scale, 
                  backgroundColor: colors.success,
                }
              ]} />
            </View>
          </View>
          
          <View style={{ width: 48, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 7, color: colors.destructive }}>{v.low}%</Text>
            <Text style={{ fontSize: 7, color: colors.success }}>+{v.high}%</Text>
          </View>
        </View>
      ))}
    </View>

    {/* Scale indicator */}
    <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
      <Text style={{ fontSize: 6, color: colors.textMuted }}>← Decreases Cost</Text>
      <View style={{ width: 20 }} />
      <Text style={{ fontSize: 6, color: colors.textMuted }}>Increases Cost →</Text>
    </View>

    {/* Key insights */}
    <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Text style={{ fontSize: 7, color: colors.textMuted }}>
        <Text style={{ color: colors.primary, fontWeight: 600 }}>Key Driver: </Text>
        Volume and Price changes have the highest impact on total cost. Focus negotiation efforts on volume commitments and unit pricing.
      </Text>
    </View>

    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
        <Text style={styles.legendText}>Cost Reduction</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
        <Text style={styles.legendText}>Cost Increase</Text>
      </View>
    </View>
  </View>
);
