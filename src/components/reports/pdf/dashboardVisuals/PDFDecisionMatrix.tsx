import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { DecisionMatrixData } from "@/lib/dashboard-data-parser";

const optionColors = (c: ReturnType<typeof getPdfColors>) => [c.primary, c.option2, c.option3, c.warning, c.success];

const getScoreBg = (score: number, c: ReturnType<typeof getPdfColors>): string => {
  if (score >= 5) return c.primary;
  if (score >= 4) return c.primaryDark;
  if (score >= 3) return c.warning;
  return c.destructive;
};

export const PDFDecisionMatrix = ({ data, themeMode }: { data: DecisionMatrixData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const oc = optionColors(colors);
  const matrixCriteria = data.criteria;

  const matrixOptions = data.options.map((opt, idx) => {
    const weighted = matrixCriteria.reduce(
      (sum, c, ci) => sum + ((opt.scores[ci] || 0) * c.weight) / 5,
      0
    );
    return { name: opt.name, scores: opt.scores, weighted: Math.round(weighted), color: oc[idx % oc.length] };
  });

  const winner = matrixOptions.reduce((max, opt) => opt.weighted > max.weighted ? opt : max, matrixOptions[0]);

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Decision Matrix</Text>
          <Text style={styles.dashboardSubtitle}>Weighted multi-criteria analysis</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>{winner.name}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>recommended</Text>
        </View>
      </View>

      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5 }]}>Criteria</Text>
          <Text style={styles.matrixCell}>Wt%</Text>
          {matrixOptions.map((opt, i) => (
            <View key={i} style={[styles.matrixCell, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
              <View style={{ width: 7, height: 7, borderRadius: 1, backgroundColor: opt.color, marginRight: 3 }} />
              <Text style={{ fontSize: 9, color: colors.text }}>{opt.name}</Text>
            </View>
          ))}
        </View>

        {matrixCriteria.map((criterion, idx) => (
          <View key={idx} style={styles.matrixRow}>
            <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5 }]}>{criterion.name}</Text>
            <Text style={styles.matrixCell}>{criterion.weight}%</Text>
            {matrixOptions.map((opt, i) => (
              <View key={i} style={[styles.matrixCell, { alignItems: "center" }]}>
                <View style={[styles.scoreCell, { backgroundColor: getScoreBg(opt.scores[idx] || 0, colors) }]}>
                  <Text style={styles.scoreCellText}>{opt.scores[idx] || 0}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={[styles.matrixRow, { borderBottomWidth: 0, backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, fontWeight: 700, fontSize: 10 }]}>Weighted Score</Text>
          <Text style={[styles.matrixCell, { fontWeight: 600 }]}>100%</Text>
          {matrixOptions.map((opt, i) => (
            <Text key={i} style={[styles.matrixCell, { fontWeight: 700, fontSize: 11, color: opt.weighted === winner.weighted ? colors.primary : colors.text }]}>
              {opt.weighted}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>5 = Best</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primaryDark }]} />
          <Text style={styles.legendText}>4 = Good</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>3 = Average</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
          <Text style={styles.legendText}>1-2 = Poor</Text>
        </View>
      </View>
    </View>
  );
};
