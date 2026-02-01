import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";

const criteria = [
  { name: "Cost", weight: 25, a: 82, b: 74 },
  { name: "Risk", weight: 20, a: 68, b: 77 },
  { name: "Speed", weight: 20, a: 71, b: 63 },
  { name: "Quality", weight: 20, a: 79, b: 73 },
  { name: "Flexibility", weight: 15, a: 66, b: 70 },
];

const scenarioA = { 
  name: "Scenario A", 
  color: colors.primary,
  weighted: criteria.reduce((sum, c) => sum + (c.a * c.weight / 100), 0).toFixed(1)
};
const scenarioB = { 
  name: "Scenario B", 
  color: "#6366f1",
  weighted: criteria.reduce((sum, c) => sum + (c.b * c.weight / 100), 0).toFixed(1)
};

const winner = Number(scenarioA.weighted) >= Number(scenarioB.weighted) ? scenarioA : scenarioB;

const getScoreColor = (score: number, otherScore: number): string => {
  if (score > otherScore) return colors.primary;
  if (score < otherScore) return colors.textMuted;
  return colors.text;
};

export const PDFScenarioComparison = () => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.dashboardTitle}>Scenario Comparison</Text>
        <Text style={styles.dashboardSubtitle}>Score-by-criterion (0–100)</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: winner.color }}>{winner.name}</Text>
        <Text style={{ fontSize: 6, color: colors.textMuted }}>recommended</Text>
      </View>
    </View>

    {/* Visual comparison bars */}
    <View style={{ marginTop: 8, marginBottom: 8 }}>
      {criteria.map((c, i) => (
        <View key={i} style={{ marginBottom: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
            <Text style={{ fontSize: 7, color: colors.text }}>{c.name}</Text>
            <Text style={{ fontSize: 6, color: colors.textMuted }}>Wt: {c.weight}%</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Scenario A bar */}
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1, height: 8, backgroundColor: colors.surfaceLight, borderRadius: 2, overflow: "hidden" }}>
                <View style={{ width: `${c.a}%`, height: 8, backgroundColor: scenarioA.color, borderRadius: 2 }} />
              </View>
              <Text style={{ width: 20, fontSize: 7, color: getScoreColor(c.a, c.b), textAlign: "right", marginLeft: 4 }}>
                {c.a}
              </Text>
            </View>
            
            <View style={{ width: 16 }} />
            
            {/* Scenario B bar */}
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1, height: 8, backgroundColor: colors.surfaceLight, borderRadius: 2, overflow: "hidden" }}>
                <View style={{ width: `${c.b}%`, height: 8, backgroundColor: scenarioB.color, borderRadius: 2 }} />
              </View>
              <Text style={{ width: 20, fontSize: 7, color: getScoreColor(c.b, c.a), textAlign: "right", marginLeft: 4 }}>
                {c.b}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>

    {/* Summary Table */}
    <View style={styles.matrixContainer}>
      <View style={[styles.matrixRow, styles.matrixHeader]}>
        <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4 }]}>Metric</Text>
        <View style={[styles.matrixCell, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
          <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: scenarioA.color, marginRight: 3 }} />
          <Text style={{ fontSize: 7 }}>Scenario A</Text>
        </View>
        <View style={[styles.matrixCell, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
          <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: scenarioB.color, marginRight: 3 }} />
          <Text style={{ fontSize: 7 }}>Scenario B</Text>
        </View>
      </View>
      {criteria.map((c, i) => (
        <View key={i} style={styles.matrixRow}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4 }]}>{c.name}</Text>
          <Text style={[styles.matrixCell, { color: getScoreColor(c.a, c.b), fontWeight: c.a > c.b ? 600 : 400 }]}>
            {c.a}
          </Text>
          <Text style={[styles.matrixCell, { color: getScoreColor(c.b, c.a), fontWeight: c.b > c.a ? 600 : 400 }]}>
            {c.b}
          </Text>
        </View>
      ))}
      {/* Weighted total */}
      <View style={[styles.matrixRow, { backgroundColor: colors.surfaceLight, borderBottomWidth: 0 }]}>
        <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4, fontWeight: 700 }]}>Weighted Score</Text>
        <Text style={[styles.matrixCell, { fontWeight: 700, color: winner === scenarioA ? colors.primary : colors.text }]}>
          {scenarioA.weighted}
        </Text>
        <Text style={[styles.matrixCell, { fontWeight: 700, color: winner === scenarioB ? colors.primary : colors.text }]}>
          {scenarioB.weighted}
        </Text>
      </View>
    </View>

    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
        <Text style={styles.legendText}>Higher score wins per criterion</Text>
      </View>
    </View>
  </View>
);
