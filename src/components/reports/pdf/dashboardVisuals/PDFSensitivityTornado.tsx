import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { SensitivityData } from "@/lib/dashboard-data-parser";

export const PDFSensitivityAnalysis = ({ data, themeMode }: { data: SensitivityData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const variables = data.variables.map(v => {
    const baseCase = v.baseCase || 1;
    const low = Math.round(((v.lowCase - baseCase) / baseCase) * 100);
    const high = Math.round(((v.highCase - baseCase) / baseCase) * 100);
    return {
      name: v.name,
      low,
      high,
      baseValue: v.unit ? `${v.baseCase} ${v.unit}` : String(v.baseCase),
    };
  });

  const maxImpact = Math.max(1, ...variables.map(v => Math.max(Math.abs(v.low), Math.abs(v.high))));
  const scale = 40 / maxImpact;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Sensitivity Analysis</Text>
          <Text style={styles.dashboardSubtitle}>Tornado chart: impact on total cost</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>±{maxImpact}%</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>max impact</Text>
        </View>
      </View>

      <View style={{ marginTop: 10 }}>
        {variables.map((v, i) => (
          <View key={i} style={styles.tornadoRow}>
            <View style={{ width: 84 }}>
              <Text style={styles.tornadoLabel}>{v.name}</Text>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>{v.baseValue}</Text>
            </View>

            <View style={styles.tornadoChart}>
              <View style={styles.tornadoLeft}>
                <View style={[styles.tornadoBar, { width: Math.abs(v.low) * scale, backgroundColor: colors.destructive }]} />
              </View>
              <View style={styles.tornadoCenter} />
              <View style={styles.tornadoRight}>
                <View style={[styles.tornadoBar, { width: v.high * scale, backgroundColor: colors.success }]} />
              </View>
            </View>

            <View style={{ width: 48, flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 9, color: colors.destructive }}>{v.low}%</Text>
              <Text style={{ fontSize: 9, color: colors.success }}>+{v.high}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
        <Text style={{ fontSize: 8, color: colors.textMuted }}>← Decreases Cost</Text>
        <View style={{ width: 20 }} />
        <Text style={{ fontSize: 8, color: colors.textMuted }}>Increases Cost →</Text>
      </View>

      <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}>
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
};
