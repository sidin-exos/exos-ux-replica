import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type {
  ConcentrationData,
  HhiInterpretation,
} from "@/lib/sentinel/types";

const formatCurrency = (value: number | null, currency: string): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${currency}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${currency}${(abs / 1_000).toFixed(0)}K`;
  return `${currency}${Math.round(abs)}`;
};

/**
 * PDF Supplier Concentration Map — mirrors SupplierConcentrationMapDashboard (web).
 * Sankey is impractical in print, so we render:
 *   • HHI by category (sorted, with interpretation badge)
 *   • Category → top supplier flows table with single-source flag
 *   • Top exit-cost cards
 *   • Geographic concentration horizontal bars
 */
export const PDFSupplierConcentrationMap = ({
  data,
  themeMode,
}: {
  data: ConcentrationData;
  themeMode?: PdfThemeMode;
}) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const HHI_TONE: Record<HhiInterpretation, { fg: string; bg: string }> = {
    LOW: { fg: colors.success, bg: `${colors.success}1F` },
    MODERATE: { fg: colors.textMuted, bg: colors.surfaceLight },
    HIGH: { fg: colors.warning, bg: `${colors.warning}1F` },
    EXTREME: { fg: colors.destructive, bg: `${colors.destructive}1F` },
  };

  const sortedCategories = [...data.categories].sort(
    (a, b) => (b.hhi ?? 0) - (a.hhi ?? 0)
  );

  const categoryNameMap = new Map(
    data.categories.map((c) => [c.category_id, c.category_name])
  );

  // Build category -> supplier flows, sorted by value desc per category
  const flowsByCategory = new Map<string, typeof data.flows>();
  data.flows.forEach((f) => {
    const arr = flowsByCategory.get(f.source) ?? [];
    arr.push(f);
    flowsByCategory.set(f.source, arr);
  });
  flowsByCategory.forEach((arr) => arr.sort((a, b) => b.value - a.value));

  const topExitCosts = [...data.suppliers]
    .filter((s) => s.exit_cost_estimate != null)
    .sort((a, b) => (b.exit_cost_estimate ?? 0) - (a.exit_cost_estimate ?? 0))
    .slice(0, 3);

  const sortedGeo = [...data.geographic_concentration].sort(
    (a, b) => b.spend_share_pct - a.spend_share_pct
  );

  return (
    <View style={styles.dashboardCard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Supplier Concentration Map</Text>
          <Text style={styles.dashboardSubtitle}>
            Spend flow with HHI and single-source flags
          </Text>
        </View>
      </View>

      {/* HHI by category */}
      {sortedCategories.length > 0 && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceLight,
            padding: 6,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 7,
              color: colors.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 4,
            }}
          >
            HHI by category
          </Text>
          {sortedCategories.map((c) => {
            const tone = c.hhi_interpretation ? HHI_TONE[c.hhi_interpretation] : null;
            return (
              <View
                key={c.category_id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 2,
                }}
              >
                <Text style={{ fontSize: 8, color: colors.text, flex: 1 }}>
                  {c.category_name}
                </Text>
                <Text
                  style={{
                    fontSize: 8,
                    color: colors.textMuted,
                    width: 50,
                    textAlign: "right",
                  }}
                >
                  {c.hhi != null ? c.hhi.toFixed(0) : "—"}
                </Text>
                {c.hhi_interpretation && tone && (
                  <View
                    style={{
                      backgroundColor: tone.bg,
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: 6,
                      marginLeft: 6,
                      width: 60,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 7, fontWeight: 700, color: tone.fg }}>
                      {c.hhi_interpretation}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Category → supplier flows */}
      {flowsByCategory.size > 0 && (
        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 7,
              color: colors.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 4,
            }}
          >
            Top supplier flows
          </Text>
          {Array.from(flowsByCategory.entries()).map(([catId, flows]) => {
            const catTotal = flows.reduce((sum, f) => sum + f.value, 0);
            return (
              <View key={catId} style={{ marginBottom: 4 }} wrap={false}>
                <Text style={{ fontSize: 8, fontWeight: 600, color: colors.text }}>
                  {categoryNameMap.get(catId) ?? catId}
                </Text>
                {flows.slice(0, 4).map((f, i) => {
                  const pct = catTotal > 0 ? (f.value / catTotal) * 100 : 0;
                  return (
                    <View
                      key={`${f.target}-${i}`}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 1,
                      }}
                    >
                      <Text
                        style={{
                          width: 90,
                          fontSize: 8,
                          color: colors.text,
                          paddingLeft: 6,
                        }}
                      >
                        {f.target}
                      </Text>
                      <View
                        style={{
                          flex: 1,
                          height: 5,
                          backgroundColor: colors.surfaceLight,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${pct}%`,
                            height: 5,
                            backgroundColor: f.single_source_flag
                              ? colors.destructive
                              : colors.primary,
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          width: 50,
                          textAlign: "right",
                          fontSize: 7,
                          color: colors.textMuted,
                          marginLeft: 4,
                        }}
                      >
                        {pct.toFixed(0)}%
                      </Text>
                      {f.single_source_flag && (
                        <Text
                          style={{
                            fontSize: 6,
                            fontWeight: 700,
                            color: colors.destructive,
                            marginLeft: 4,
                          }}
                        >
                          ⚑
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      )}

      {/* Top exit-cost cards */}
      {topExitCosts.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 7,
              color: colors.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 4,
            }}
          >
            Top exit-cost estimates
          </Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {topExitCosts.map((s) => (
              <View
                key={s.supplier_label}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceLight,
                  padding: 6,
                }}
              >
                <Text style={{ fontSize: 8, fontWeight: 600, color: colors.text }}>
                  {s.supplier_label}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: 700, color: colors.text, marginTop: 2 }}>
                  {formatCurrency(s.exit_cost_estimate, data.currency)}
                </Text>
                {s.exit_cost_rationale && (
                  <Text
                    style={{
                      fontSize: 7,
                      color: colors.textMuted,
                      marginTop: 2,
                      lineHeight: 1.3,
                    }}
                  >
                    {s.exit_cost_rationale.length > 90
                      ? `${s.exit_cost_rationale.slice(0, 88)}…`
                      : s.exit_cost_rationale}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Geographic concentration */}
      {sortedGeo.length > 0 && (
        <View>
          <Text
            style={{
              fontSize: 7,
              color: colors.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 4,
            }}
          >
            Geographic concentration
          </Text>
          {sortedGeo.map((g) => (
            <View
              key={g.country_code}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}
            >
              <Text style={{ width: 30, fontSize: 8, color: colors.text }}>
                {g.country_code}
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 5,
                  backgroundColor: colors.surfaceLight,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${g.spend_share_pct}%`,
                    height: 5,
                    backgroundColor: colors.primary,
                  }}
                />
              </View>
              <Text
                style={{
                  width: 40,
                  textAlign: "right",
                  fontSize: 8,
                  color: colors.textMuted,
                  marginLeft: 4,
                }}
              >
                {g.spend_share_pct.toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
