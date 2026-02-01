import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";

// 5x5 grid with specific risks placed
const size = 5;
const risks = [
  { id: "R1", impact: 5, prob: 2, name: "Supply Disruption" },
  { id: "R2", impact: 4, prob: 4, name: "Price Volatility" },
  { id: "R3", impact: 3, prob: 5, name: "Quality Issues" },
  { id: "R4", impact: 2, prob: 4, name: "Delivery Delays" },
];

const getRiskColor = (impact: number, prob: number): string => {
  const score = impact * prob;
  if (score >= 16) return colors.destructive;
  if (score >= 10) return colors.warning;
  return colors.primary;
};

const getRiskAtCell = (impact: number, prob: number) => {
  return risks.find(r => r.impact === impact && r.prob === prob);
};

export const PDFRiskMatrix = () => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.dashboardTitle}>Risk Matrix</Text>
        <Text style={styles.dashboardSubtitle}>Probability × Impact assessment</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: colors.destructive }}>{risks.filter(r => r.impact * r.prob >= 16).length}</Text>
        <Text style={{ fontSize: 6, color: colors.textMuted }}>critical risks</Text>
      </View>
    </View>

    {/* Matrix Grid */}
    <View style={{ marginTop: 8, flexDirection: "row" }}>
      {/* Y-axis label */}
      <View style={{ width: 16, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 6, color: colors.textMuted, transform: "rotate(-90deg)" }}>Impact</Text>
      </View>
      
      <View style={{ flex: 1 }}>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
          {Array.from({ length: size }).map((_, r) => {
            const impact = size - r;
            return (
              <View
                key={r}
                style={{ 
                  flexDirection: "row", 
                  borderBottomWidth: r === size - 1 ? 0 : 1, 
                  borderBottomColor: colors.border 
                }}
              >
                {Array.from({ length: size }).map((__, c) => {
                  const prob = c + 1;
                  const risk = getRiskAtCell(impact, prob);
                  const bgColor = risk ? getRiskColor(impact, prob) : colors.surfaceLight;
                  
                  return (
                    <View
                      key={c}
                      style={{
                        flex: 1,
                        height: 20,
                        backgroundColor: bgColor,
                        borderRightWidth: c === size - 1 ? 0 : 1,
                        borderRightColor: colors.border,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {risk && (
                        <Text style={{ fontSize: 6, fontWeight: 700, color: colors.background }}>
                          {risk.id}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
        
        {/* X-axis label */}
        <Text style={{ fontSize: 6, color: colors.textMuted, textAlign: "center", marginTop: 4 }}>
          Probability →
        </Text>
      </View>
    </View>

    {/* Risk Legend */}
    <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
      {risks.map((risk, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <View style={{ 
            width: 16, 
            height: 12, 
            backgroundColor: getRiskColor(risk.impact, risk.prob), 
            borderRadius: 2,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 6
          }}>
            <Text style={{ fontSize: 6, fontWeight: 700, color: colors.background }}>{risk.id}</Text>
          </View>
          <Text style={{ fontSize: 7, color: colors.text, flex: 1 }}>{risk.name}</Text>
          <Text style={{ fontSize: 6, color: colors.textMuted }}>
            Impact: {risk.impact} × Prob: {risk.prob} = {risk.impact * risk.prob}
          </Text>
        </View>
      ))}
    </View>

    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
        <Text style={styles.legendText}>Low (&lt;10)</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
        <Text style={styles.legendText}>Medium (10-15)</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
        <Text style={styles.legendText}>High (≥16)</Text>
      </View>
    </View>
  </View>
);
