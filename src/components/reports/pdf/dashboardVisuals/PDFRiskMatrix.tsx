import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";
import type { RiskMatrixData } from "@/lib/dashboard-data-parser";

const defaultRisks = [
  { id: "R1", name: "Supply Chain Disruption", impact: 5, probability: 4, category: "Operations" },
  { id: "R2", name: "Price Volatility", impact: 4, probability: 4, category: "Financial" },
  { id: "R3", name: "Quality Non-Conformance", impact: 4, probability: 3, category: "Quality" },
  { id: "R4", name: "Regulatory Compliance Gap", impact: 5, probability: 2, category: "Compliance" },
  { id: "R5", name: "Single Supplier Dependency", impact: 4, probability: 3, category: "Strategic" },
  { id: "R6", name: "Delivery Delays", impact: 3, probability: 4, category: "Operations" },
];

const levelToNum = (level: string): number => {
  if (level === "high") return 5;
  if (level === "medium") return 3;
  return 1;
};

const getRiskScore = (impact: number, probability: number): number => impact * probability;

const getRiskSeverity = (score: number): { label: string; color: string; bgColor: string } => {
  if (score >= 16) return { label: "Critical", color: colors.background, bgColor: colors.destructive };
  if (score >= 10) return { label: "High", color: colors.background, bgColor: colors.warning };
  if (score >= 6) return { label: "Medium", color: colors.text, bgColor: colors.surfaceLight };
  return { label: "Low", color: colors.text, bgColor: colors.surfaceLight };
};

const tableStyles = {
  tableContainer: { marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 4, overflow: "hidden" as const },
  headerRow: { flexDirection: "row" as const, backgroundColor: colors.surfaceLight, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 8 },
  dataRow: { flexDirection: "row" as const, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 8, alignItems: "center" as const },
  lastRow: { borderBottomWidth: 0 },
  colSeverity: { width: "18%" as const, alignItems: "center" as const },
  colRisk: { width: "38%" as const },
  colImpact: { width: "14%" as const, alignItems: "center" as const },
  colProb: { width: "14%" as const, alignItems: "center" as const },
  colScore: { width: "16%" as const, alignItems: "center" as const },
  headerText: { fontSize: 7, fontWeight: 700 as const, color: colors.textMuted, textTransform: "uppercase" as const },
  cellText: { fontSize: 8, color: colors.text },
};

export const PDFRiskMatrix = ({ data }: { data?: RiskMatrixData }) => {
  const risks = data?.risks
    ? data.risks.map((r, idx) => ({
        id: `R${idx + 1}`,
        name: r.supplier,
        impact: levelToNum(r.impact),
        probability: levelToNum(r.probability),
        category: r.category || "Operations",
      }))
    : defaultRisks;

  const sortedRisks = [...risks].sort((a, b) => getRiskScore(b.impact, b.probability) - getRiskScore(a.impact, a.probability));
  const criticalCount = sortedRisks.filter(r => getRiskScore(r.impact, r.probability) >= 16).length;
  const highCount = sortedRisks.filter(r => { const s = getRiskScore(r.impact, r.probability); return s >= 10 && s < 16; }).length;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Risk Assessment Matrix</Text>
          <Text style={styles.dashboardSubtitle}>Impact × Probability analysis</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {criticalCount > 0 && (
            <View style={{ backgroundColor: colors.destructive, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, marginRight: 4 }}>
              <Text style={{ fontSize: 7, fontWeight: 700, color: colors.background }}>{criticalCount} Critical</Text>
            </View>
          )}
          {highCount > 0 && (
            <View style={{ backgroundColor: colors.warning, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
              <Text style={{ fontSize: 7, fontWeight: 700, color: colors.background }}>{highCount} High</Text>
            </View>
          )}
        </View>
      </View>

      <View style={tableStyles.tableContainer}>
        <View style={tableStyles.headerRow}>
          <View style={tableStyles.colSeverity}><Text style={tableStyles.headerText}>Severity</Text></View>
          <View style={tableStyles.colRisk}><Text style={tableStyles.headerText}>Risk Item</Text></View>
          <View style={tableStyles.colImpact}><Text style={tableStyles.headerText}>Impact</Text></View>
          <View style={tableStyles.colProb}><Text style={tableStyles.headerText}>Prob</Text></View>
          <View style={tableStyles.colScore}><Text style={tableStyles.headerText}>Score</Text></View>
        </View>

        {sortedRisks.map((risk, i) => {
          const score = getRiskScore(risk.impact, risk.probability);
          const severity = getRiskSeverity(score);
          return (
            <View key={risk.id} style={[tableStyles.dataRow, i === sortedRisks.length - 1 && tableStyles.lastRow]}>
              <View style={tableStyles.colSeverity}>
                <View style={{ backgroundColor: severity.bgColor, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, minWidth: 48, alignItems: "center" }}>
                  <Text style={{ fontSize: 7, fontWeight: 700, color: severity.color }}>{severity.label}</Text>
                </View>
              </View>
              <View style={tableStyles.colRisk}>
                <Text style={tableStyles.cellText}>{risk.name}</Text>
                <Text style={{ fontSize: 6, color: colors.textMuted, marginTop: 1 }}>{risk.category}</Text>
              </View>
              <View style={tableStyles.colImpact}><Text style={[tableStyles.cellText, { fontWeight: 600 }]}>{risk.impact}</Text></View>
              <View style={tableStyles.colProb}><Text style={[tableStyles.cellText, { fontWeight: 600 }]}>{risk.probability}</Text></View>
              <View style={tableStyles.colScore}>
                <Text style={[tableStyles.cellText, { fontWeight: 700, color: severity.bgColor === colors.surfaceLight ? colors.text : severity.bgColor }]}>{score}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Risks</Text>
          <Text style={styles.statValue}>{sortedRisks.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg Score</Text>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {sortedRisks.length > 0 ? Math.round(sortedRisks.reduce((sum, r) => sum + getRiskScore(r.impact, r.probability), 0) / sortedRisks.length) : 0}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Max Score</Text>
          <Text style={[styles.statValue, { color: colors.destructive }]}>
            {sortedRisks.length > 0 ? Math.max(...sortedRisks.map(r => getRiskScore(r.impact, r.probability))) : 0}
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
          <Text style={styles.legendText}>Critical (≥16)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>High (10-15)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.surfaceLight }]} />
          <Text style={styles.legendText}>Medium/Low (&lt;10)</Text>
        </View>
      </View>
    </View>
  );
};
