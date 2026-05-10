import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { ShouldCostGapData } from "@/lib/sentinel/types";

const formatCurrency = (value: number | null, currency: string): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${currency}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${currency}${(value / 1_000).toFixed(0)}K`;
  return `${currency}${Math.round(value)}`;
};

/**
 * PDF Should-Cost Gap — mirrors ShouldCostGapDashboard (web).
 * Layout: grouped horizontal bars (current vs benchmark vs gap) per component,
 * followed by negotiation anchor block and supplier-vs-benchmark margin row.
 */
export const PDFShouldCostGap = ({
  data,
  themeMode,
}: {
  data: ShouldCostGapData;
  themeMode?: PdfThemeMode;
}) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const COLOR_CURRENT = colors.textMuted;
  const COLOR_BENCHMARK = colors.primary;
  const COLOR_HEADROOM = colors.destructive;
  const COLOR_BELOW = colors.success;

  // Scale: max of all current %, benchmark % values
  const max = Math.max(
    1,
    ...data.components.map((c) =>
      Math.max(c.currentPricePct, c.benchmarkPct ?? 0, Math.abs(c.gapPct ?? 0))
    )
  );

  const marginRedFlag =
    data.supplierMarginPct != null &&
    data.benchmarkMarginPct != null &&
    data.supplierMarginPct - data.benchmarkMarginPct > 20;

  return (
    <View style={styles.dashboardCard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Should-Cost Gap</Text>
          <Text style={styles.dashboardSubtitle}>
            Current price vs benchmark vs should-cost — per component
          </Text>
        </View>
        {marginRedFlag && (
          <View
            style={{
              backgroundColor: `${COLOR_HEADROOM}22`,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 7, fontWeight: 700, color: COLOR_HEADROOM }}>
              MARGIN RED FLAG
            </Text>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: "row", marginBottom: 8, gap: 12 }}>
        {[
          { color: COLOR_CURRENT, label: "Current %" },
          { color: COLOR_BENCHMARK, label: "Benchmark %" },
          { color: COLOR_HEADROOM, label: "Headroom (gap %)" },
        ].map((l) => (
          <View key={l.label} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 7, height: 7, backgroundColor: l.color, marginRight: 4 }} />
            <Text style={{ fontSize: 8, color: colors.textMuted }}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* Per-component grouped bars */}
      <View style={{ marginBottom: 10 }}>
        {data.components.map((c) => {
          const gap = c.gapPct ?? 0;
          const Bar = ({ value, color }: { value: number; color: string }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 2,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 6,
                  backgroundColor: colors.surfaceLight,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${Math.min(100, (Math.abs(value) / max) * 100)}%`,
                    height: 6,
                    backgroundColor: color,
                  }}
                />
              </View>
              <Text
                style={{
                  width: 40,
                  textAlign: "right",
                  fontSize: 8,
                  color: colors.text,
                  marginLeft: 6,
                }}
              >
                {value.toFixed(1)}%
              </Text>
            </View>
          );
          return (
            <View
              key={c.name}
              style={{ marginBottom: 6 }}
              wrap={false}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={{ fontSize: 9, color: colors.text, fontWeight: 600 }}>
                  {c.name}
                </Text>
                <Text style={{ fontSize: 7, color: colors.textMuted }}>
                  {c.confidence}
                </Text>
              </View>
              <Bar value={c.currentPricePct} color={COLOR_CURRENT} />
              {c.benchmarkPct != null && <Bar value={c.benchmarkPct} color={COLOR_BENCHMARK} />}
              {c.gapPct != null && (
                <Bar value={gap} color={gap > 0 ? COLOR_HEADROOM : COLOR_BELOW} />
              )}
            </View>
          );
        })}
      </View>

      {/* Negotiation anchor */}
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceLight,
          padding: 8,
          marginBottom: 6,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontSize: 7,
              color: colors.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Negotiation Anchor
          </Text>
          {data.negotiationAnchor.headroomPct != null && (
            <Text style={{ fontSize: 8, fontWeight: 700, color: COLOR_HEADROOM }}>
              {data.negotiationAnchor.headroomPct.toFixed(1)}% headroom
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 7, color: colors.textMuted }}>Current price</Text>
            <Text style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>
              {formatCurrency(data.negotiationAnchor.currentPrice, data.currency)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 7, color: colors.textMuted }}>Should-cost target</Text>
            <Text style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>
              {formatCurrency(data.negotiationAnchor.shouldCostTarget, data.currency)}
            </Text>
          </View>
        </View>
        {data.negotiationAnchor.rationale && (
          <Text style={{ fontSize: 8, color: colors.textMuted, lineHeight: 1.4 }}>
            {data.negotiationAnchor.rationale}
          </Text>
        )}
      </View>

      {/* Margin comparison */}
      {(data.supplierMarginPct != null || data.benchmarkMarginPct != null) && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ fontSize: 8, color: colors.textMuted }}>Supplier margin</Text>
          <Text style={{ fontSize: 8, color: colors.text }}>
            {data.supplierMarginPct != null ? `${data.supplierMarginPct.toFixed(1)}%` : "—"}
            <Text style={{ color: colors.textMuted }}>
              {" "}
              vs benchmark{" "}
              {data.benchmarkMarginPct != null
                ? `${data.benchmarkMarginPct.toFixed(1)}%`
                : "—"}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
};
