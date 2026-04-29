import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { NegotiationPrepData } from "@/lib/dashboard-data-parser";

export const PDFNegotiationPrep = ({ data, themeMode }: { data: NegotiationPrepData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const steps = data.sequence
    ? data.sequence.map((s, i) => ({
        label: s.step,
        meta: "",
        details: s.detail,
        status: i === 0 ? "complete" : i === 1 ? "active" : "upcoming",
      }))
    : [];

  // BATNA strength is normalised on a 0–5 scale; legacy >5 values are treated as percentages.
  const rawStrength = Number(data.batna?.strength ?? 0);
  const strength05 = rawStrength > 5 ? Math.max(0, Math.min(5, rawStrength / 20)) : Math.max(0, Math.min(5, rawStrength));
  const keyMetrics = [
    { label: "BATNA Score", value: `${strength05.toFixed(1).replace(/\.0$/, '')}/5` },
    { label: "Leverage", value: data.leveragePoints?.[0]?.point || "—" },
    { label: "Supplier Power", value: data.leveragePoints?.[1]?.point || "—" },
  ];

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Negotiation Prep</Text>
          <Text style={styles.dashboardSubtitle}>Recommended sequencing</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>{steps.length} Steps</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>to success</Text>
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

      {steps.length > 0 && (
        <View style={{ marginTop: 12 }}>
          {steps.map((s, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 8 }}>
              <View style={{ width: 26, alignItems: "center" }}>
                <View style={{
                  width: 20, height: 20,
                  backgroundColor: s.status === "complete" ? colors.success : s.status === "active" ? colors.primary : colors.surfaceLight,
                  borderWidth: s.status === "upcoming" ? 1 : 0,
                  borderColor: colors.border,
                  justifyContent: "center", alignItems: "center",
                }}>
                  <Text style={{ fontSize: 10, fontWeight: 700, color: s.status === "upcoming" ? colors.textMuted : colors.background }}>
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
                    <Text style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>{s.label}</Text>
                    <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 1 }}>{s.details}</Text>
                  </View>
                  {s.meta ? (
                    <View style={{ paddingHorizontal: 4, paddingVertical: 2, backgroundColor: colors.surfaceLight }}>
                      <Text style={{ fontSize: 8, color: colors.primary }}>{s.meta}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}>
          <Text style={{ color: colors.primary, fontWeight: 600 }}>Tip: </Text>
          Use as a guide; adjust timing for stakeholder constraints and supplier responsiveness.
        </Text>
      </View>
    </View>
  );
};
