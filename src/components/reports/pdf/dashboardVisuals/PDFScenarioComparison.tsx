import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { ScenarioComparisonData } from "@/lib/dashboard-data-parser";

export const PDFScenarioComparison = ({ data, themeMode }: { data: ScenarioComparisonData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  // Support all scenarios dynamically (not just 2)
  const allScenarios = data.scenarios || [];
  if (allScenarios.length === 0) {
    return (
      <View style={styles.dashboardCard}>
        <Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Scenario Comparison: insufficient data</Text>
      </View>
    );
  }

  const criteria = data.radarData
    ? data.radarData.map(r => {
        const scores: Record<string, number> = {};
        for (const sc of allScenarios) {
          scores[sc.id] = typeof r[sc.id] === "number" ? (r[sc.id] as number) : 50;
        }
        return { name: r.metric as string, scores };
      })
    : [];

  const equalWeight = criteria.length > 0 ? Math.round(100 / criteria.length) : 20;

  // Calculate weighted scores for each scenario
  const weightedScores: Record<string, number> = {};
  for (const sc of allScenarios) {
    weightedScores[sc.id] = criteria.reduce((sum, c) => sum + ((c.scores[sc.id] ?? 50) * equalWeight / 100), 0);
  }

  const winnerId = allScenarios.reduce((best, sc) => (weightedScores[sc.id] ?? 0) > (weightedScores[best.id] ?? 0) ? sc : best, allScenarios[0]);

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Scenario Comparison</Text>
          <Text style={styles.dashboardSubtitle}>Score-by-criterion (0–100)</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: winnerId.color }}>{winnerId.name}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>recommended</Text>
        </View>
      </View>

      {/* Bar comparison for each criterion — show first two scenarios side-by-side */}
      {allScenarios.length <= 2 && (
        <View style={{ marginTop: 8, marginBottom: 8 }}>
          {criteria.map((c, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={{ fontSize: 9, color: colors.text }}>{c.name}</Text>
                <Text style={{ fontSize: 8, color: colors.textMuted }}>Wt: {equalWeight}%</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {allScenarios.map((sc, si) => (
                  <View key={sc.id} style={{ flex: 1, flexDirection: "row", alignItems: "center", marginLeft: si > 0 ? 16 : 0 }}>
                    <View style={{ flex: 1, height: 9, backgroundColor: colors.surfaceLight, overflow: "hidden" }}>
                      <View style={{ width: `${c.scores[sc.id] ?? 50}%`, height: 9, backgroundColor: sc.color }} />
                    </View>
                    <Text style={{ width: 22, fontSize: 9, color: colors.text, textAlign: "right", marginLeft: 4 }}>{c.scores[sc.id] ?? 50}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Summary table with dynamic columns */}
      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4 }]}>Metric</Text>
          {allScenarios.map((sc) => (
            <View key={sc.id} style={[styles.matrixCell, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
              <View style={{ width: 7, height: 7, backgroundColor: sc.color, marginRight: 3 }} />
              <Text style={{ fontSize: 9 }}>{sc.name}</Text>
            </View>
          ))}
        </View>
        {criteria.map((c, i) => {
          const maxScore = Math.max(...allScenarios.map(sc => c.scores[sc.id] ?? 0));
          return (
            <View key={i} style={[styles.matrixRow, i % 2 === 1 ? { backgroundColor: colors.surface } : {}]}>
              <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4 }]}>{c.name}</Text>
              {allScenarios.map((sc) => {
                const val = c.scores[sc.id] ?? 50;
                const isMax = val === maxScore && maxScore > 0;
                return (
                  <Text key={sc.id} style={[styles.matrixCell, { color: isMax ? colors.primary : colors.text, fontWeight: isMax ? 600 : 400 }]}>{val}</Text>
                );
              })}
            </View>
          );
        })}
        <View style={[styles.matrixRow, { backgroundColor: colors.surfaceLight, borderBottomWidth: 0 }]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4, fontWeight: 700 }]}>Weighted Score</Text>
          {allScenarios.map((sc) => (
            <Text key={sc.id} style={[styles.matrixCell, { fontWeight: 700, color: sc.id === winnerId.id ? colors.primary : colors.text }]}>
              {(weightedScores[sc.id] ?? 0).toFixed(1)}
            </Text>
          ))}
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