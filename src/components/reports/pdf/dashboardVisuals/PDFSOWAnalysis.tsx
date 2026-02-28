import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";
import type { SOWAnalysisData } from "@/lib/dashboard-data-parser";

const defaultClauses = [
  { name: "IP Ownership", score: 80, status: "Strong", risk: "Low", color: colors.success },
  { name: "Limitation of Liability", score: 55, status: "Weak", risk: "High", color: colors.destructive },
  { name: "Termination", score: 72, status: "Adequate", risk: "Medium", color: colors.warning },
  { name: "Data Protection", score: 66, status: "Adequate", risk: "Medium", color: colors.warning },
  { name: "SLAs", score: 61, status: "Weak", risk: "High", color: colors.destructive },
  { name: "Payment Terms", score: 78, status: "Strong", risk: "Low", color: colors.success },
];

const getScoreColor = (score: number): string => {
  if (score >= 70) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.destructive;
};

const statusToDisplay = (status: string): { label: string; risk: string } => {
  if (status === "complete") return { label: "Strong", risk: "Low" };
  if (status === "partial") return { label: "Adequate", risk: "Medium" };
  return { label: "Weak", risk: "High" };
};

export const PDFSOWAnalysis = ({ data }: { data?: SOWAnalysisData }) => {
  const clauses = data?.sections
    ? data.sections.map(s => {
        const display = statusToDisplay(s.status);
        const score = s.status === "complete" ? 80 : s.status === "partial" ? 65 : 45;
        return {
          name: s.name,
          score,
          status: display.label,
          risk: display.risk,
          color: s.status === "complete" ? colors.success : s.status === "partial" ? colors.warning : colors.destructive,
        };
      })
    : defaultClauses;

  const avgScore = data?.clarity || (clauses.length > 0 ? Math.round(clauses.reduce((sum, c) => sum + c.score, 0) / clauses.length) : 0);
  const highRiskCount = clauses.filter(c => c.risk === "High").length;

  const recommendations = data?.recommendations || [
    "Review Limitation of Liability and SLA clauses before signing. Consider legal consultation for high-risk items.",
  ];

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>SOW Analysis</Text>
          <Text style={styles.dashboardSubtitle}>Clause coverage score (0–100)</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(avgScore) }}>{avgScore}</Text>
          <Text style={{ fontSize: 7, color: colors.textMuted }}>avg score</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Clauses Reviewed</Text>
          <Text style={styles.statValue}>{clauses.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>High Risk Items</Text>
          <Text style={[styles.statValue, { color: colors.destructive }]}>{highRiskCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Overall Status</Text>
          <Text style={[styles.statValue, { color: avgScore >= 70 ? colors.success : colors.warning }]}>
            {avgScore >= 70 ? "Good" : "Needs Review"}
          </Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        {clauses.map((item, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 7, height: 7, borderRadius: 1, backgroundColor: item.color, marginRight: 4 }} />
                <Text style={{ fontSize: 9, color: colors.text }}>{item.name}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ paddingHorizontal: 3, paddingVertical: 1, backgroundColor: item.color + "20", borderRadius: 2, marginRight: 6 }}>
                  <Text style={{ fontSize: 7, color: item.color }}>{item.status}</Text>
                </View>
                <Text style={{ fontSize: 9, fontWeight: 600, color: item.color }}>{item.score}</Text>
              </View>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { flex: item.score, backgroundColor: item.color }]} />
              <View style={{ flex: Math.max(0, 100 - item.score) }} />
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 8, color: colors.textMuted }}>
          <Text style={{ color: colors.destructive, fontWeight: 600 }}>Action Required: </Text>
          {recommendations[0]}
        </Text>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>≥70 Strong</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>60-69 Adequate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
          <Text style={styles.legendText}>&lt;60 Weak</Text>
        </View>
      </View>
    </View>
  );
};
