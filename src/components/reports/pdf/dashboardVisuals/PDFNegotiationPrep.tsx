import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";
import type { NegotiationPrepData } from "@/lib/dashboard-data-parser";

const defaultSteps = [
  { label: "Preparation", meta: "BATNA / targets", details: "Define walk-away points and target outcomes", status: "complete" },
  { label: "Opening", meta: "Frame value", details: "Establish partnership tone and shared goals", status: "active" },
  { label: "Anchoring", meta: "Initial offer", details: "Present data-backed starting position", status: "upcoming" },
  { label: "Concessions", meta: "Trade-offs", details: "Prioritize high-value, low-cost trades", status: "upcoming" },
  { label: "Close", meta: "Terms & timeline", details: "Lock in commitments and next steps", status: "upcoming" },
];

const defaultMetrics = [
  { label: "BATNA Score", value: "72/100" },
  { label: "Leverage", value: "Medium" },
  { label: "Supplier Power", value: "Low" },
];

export const PDFNegotiationPrep = ({ data }: { data?: NegotiationPrepData }) => {
  const steps = data?.sequence
    ? data.sequence.map((s, i) => ({
        label: s.step,
        meta: "",
        details: s.detail,
        status: i === 0 ? "complete" : i === 1 ? "active" : "upcoming",
      }))
    : defaultSteps;

  const keyMetrics = data
    ? [
        { label: "BATNA Score", value: `${data.batna?.strength || 0}/100` },
        { label: "Leverage", value: data.leveragePoints?.[0]?.point || "—" },
        { label: "Supplier Power", value: data.leveragePoints?.[1]?.point || "—" },
      ]
    : defaultMetrics;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Negotiation Prep</Text>
          <Text style={styles.dashboardSubtitle}>Recommended sequencing</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: colors.primary }}>{steps.length} Steps</Text>
          <Text style={{ fontSize: 7, color: colors.textMuted }}>to success</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {keyMetrics.map((m, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={styles.statLabel}>{m.label}</Text>
            <Text style={styles.statValue}>{m.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 12 }}>
        {steps.map((s, i) => (
          <View key={i} style={{ flexDirection: "row", marginBottom: 8 }}>
            <View style={{ width: 26, alignItems: "center" }}>
              <View style={{
                width: 20, height: 20, borderRadius: 10,
                backgroundColor: s.status === "complete" ? colors.success : s.status === "active" ? colors.primary : colors.surfaceLight,
                borderWidth: s.status === "upcoming" ? 1 : 0,
                borderColor: colors.border,
                justifyContent: "center", alignItems: "center",
              }}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: s.status === "upcoming" ? colors.textMuted : colors.background }}>
                  {s.status === "complete" ? "✓" : i + 1}
                </Text>
              </View>
              {i < steps.length - 1 && (
                <View style={{ width: 2, flex: 1, backgroundColor: s.status === "complete" ? colors.success : colors.surfaceLight, marginTop: 2 }} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 8, paddingBottom: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View>
                  <Text style={{ fontSize: 10, fontWeight: 600, color: colors.text }}>{s.label}</Text>
                  <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 1 }}>{s.details}</Text>
                </View>
                {s.meta ? (
                  <View style={{ paddingHorizontal: 4, paddingVertical: 2, backgroundColor: colors.surfaceLight, borderRadius: 2 }}>
                    <Text style={{ fontSize: 7, color: colors.primary }}>{s.meta}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 8, color: colors.textMuted }}>
          <Text style={{ color: colors.primary, fontWeight: 600 }}>Tip: </Text>
          Use as a guide; adjust timing for stakeholder constraints and supplier responsiveness.
        </Text>
      </View>
    </View>
  );
};
