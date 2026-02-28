import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";
import type { ScenarioComparisonData } from "@/lib/dashboard-data-parser";

const defaultCriteria = [
  { name: "Cost", weight: 25, a: 82, b: 74 },
  { name: "Risk", weight: 20, a: 68, b: 77 },
  { name: "Speed", weight: 20, a: 71, b: 63 },
  { name: "Quality", weight: 20, a: 79, b: 73 },
  { name: "Flexibility", weight: 15, a: 66, b: 70 },
];

const getScoreColor = (score: number, otherScore: number): string => {
  if (score > otherScore) return colors.primary;
  if (score < otherScore) return colors.textMuted;
  return colors.text;
};

export const PDFScenarioComparison = ({ data }: { data?: ScenarioComparisonData }) => {
  const scenarioNames = data?.scenarios?.slice(0, 2) || [
    { id: "a", name: "Scenario A", color: colors.primary },
    { id: "b", name: "Scenario B", color: colors.option2 },
  ];
  const scA = scenarioNames[0] || { id: "a", name: "Scenario A", color: colors.primary };
  const scB = scenarioNames[1] || { id: "b", name: "Scenario B", color: colors.option2 };

  const criteria = data?.radarData
    ? data.radarData.map(r => {
        const aVal = typeof r[scA.id] === "number" ? (r[scA.id] as number) : 50;
        const bVal = typeof r[scB.id] === "number" ? (r[scB.id] as number) : 50;
        return { name: r.metric as string, weight: 20, a: aVal, b: bVal };
      })
    : defaultCriteria;

  const equalWeight = criteria.length > 0 ? Math.round(100 / criteria.length) : 20;
  const effectiveCriteria = data?.radarData ? criteria.map(c => ({ ...c, weight: equalWeight })) : criteria;

  const weightedA = effectiveCriteria.reduce((sum, c) => sum + (c.a * c.weight / 100), 0).toFixed(1);
  const weightedB = effectiveCriteria.reduce((sum, c) => sum + (c.b * c.weight / 100), 0).toFixed(1);
  const winner = Number(weightedA) >= Number(weightedB)
    ? { ...scA, weighted: weightedA }
    : { ...scB, weighted: weightedB };

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Scenario Comparison</Text>
          <Text style={styles.dashboardSubtitle}>Score-by-criterion (0–100)</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: winner.color }}>{winner.name}</Text>
          <Text style={{ fontSize: 7, color: colors.textMuted }}>recommended</Text>
        </View>
      </View>

      <View style={{ marginTop: 8, marginBottom: 8 }}>
        {effectiveCriteria.map((c, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={{ fontSize: 8, color: colors.text }}>{c.name}</Text>
              <Text style={{ fontSize: 7, color: colors.textMuted }}>Wt: {c.weight}%</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, height: 9, backgroundColor: colors.surfaceLight, borderRadius: 2, overflow: "hidden" }}>
                  <View style={{ width: `${c.a}%`, height: 9, backgroundColor: scA.color, borderRadius: 2 }} />
                </View>
                <Text style={{ width: 22, fontSize: 8, color: getScoreColor(c.a, c.b), textAlign: "right", marginLeft: 4 }}>{c.a}</Text>
              </View>
              <View style={{ width: 16 }} />
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, height: 9, backgroundColor: colors.surfaceLight, borderRadius: 2, overflow: "hidden" }}>
                  <View style={{ width: `${c.b}%`, height: 9, backgroundColor: scB.color, borderRadius: 2 }} />
                </View>
                <Text style={{ width: 22, fontSize: 8, color: getScoreColor(c.b, c.a), textAlign: "right", marginLeft: 4 }}>{c.b}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4 }]}>Metric</Text>
          <View style={[styles.matrixCell, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
            <View style={{ width: 7, height: 7, borderRadius: 1, backgroundColor: scA.color, marginRight: 3 }} />
            <Text style={{ fontSize: 8 }}>{scA.name}</Text>
          </View>
          <View style={[styles.matrixCell, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
            <View style={{ width: 7, height: 7, borderRadius: 1, backgroundColor: scB.color, marginRight: 3 }} />
            <Text style={{ fontSize: 8 }}>{scB.name}</Text>
          </View>
        </View>
        {effectiveCriteria.map((c, i) => (
          <View key={i} style={styles.matrixRow}>
            <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4 }]}>{c.name}</Text>
            <Text style={[styles.matrixCell, { color: getScoreColor(c.a, c.b), fontWeight: c.a > c.b ? 600 : 400 }]}>{c.a}</Text>
            <Text style={[styles.matrixCell, { color: getScoreColor(c.b, c.a), fontWeight: c.b > c.a ? 600 : 400 }]}>{c.b}</Text>
          </View>
        ))}
        <View style={[styles.matrixRow, { backgroundColor: colors.surfaceLight, borderBottomWidth: 0 }]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4, fontWeight: 700 }]}>Weighted Score</Text>
          <Text style={[styles.matrixCell, { fontWeight: 700, color: Number(weightedA) >= Number(weightedB) ? colors.primary : colors.text }]}>{weightedA}</Text>
          <Text style={[styles.matrixCell, { fontWeight: 700, color: Number(weightedB) > Number(weightedA) ? colors.primary : colors.text }]}>{weightedB}</Text>
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
};
