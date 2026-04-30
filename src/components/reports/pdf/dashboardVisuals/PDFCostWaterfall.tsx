import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { CostWaterfallData } from "@/lib/dashboard-data-parser";
import { splitCostComponents, formatAmount } from "@/lib/dashboard-contracts";

/**
 * PDF Cost Breakdown — mirrors CostWaterfallDashboard (web).
 *
 * Layout: two side-by-side panels
 *   • Maximum Cost (grey)            • Potential Improvements (teal)
 *   stacked horizontal segment bar   stacked horizontal segment bar
 *   legend rows with % + amount      legend rows with % + amount
 *
 * Footer: Gross Costs / Reductions / Net Total
 *
 * KPIs come from `splitCostComponents()` so web & PDF stay in lock-step.
 */
export const PDFCostWaterfall = ({
  data,
  themeMode,
}: {
  data: CostWaterfallData;
  themeMode?: PdfThemeMode;
}) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const split = splitCostComponents(data);
  const { costs, reductions, gross, totalReductions, net, reductionPercent, currency } = split;

  // Muted EXOS palette (web-aligned)
  const COLOR_TEAL = colors.primary;
  const COLOR_PLUM = "#a04545";
  const COLOR_AMBER = "#a37937";
  const GREY_PALETTE = [
    COLOR_PLUM,
    COLOR_AMBER,
    "#7d8696",
    "#9aa1ad",
    "#b3b8c2",
    "#c8ccd4",
    "#d6d9df",
  ];
  const TEAL_PALETTE = [COLOR_TEAL, "#4a8d85", "#6ba59e", "#8bbcb6"];

  const totalSegments = gross + totalReductions;

  const SegmentBar = ({
    items,
    palette,
    total,
  }: {
    items: { name: string; value: number }[];
    palette: string[];
    total: number;
  }) => (
    <View
      style={{
        flexDirection: "row",
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
        backgroundColor: colors.surfaceLight,
        marginBottom: 8,
      }}
    >
      {items.map((it, i) => {
        const pct = total > 0 ? (it.value / total) * 100 : 0;
        return (
          <View
            key={`${it.name}-${i}`}
            style={{ width: `${pct}%`, backgroundColor: palette[i % palette.length] }}
          />
        );
      })}
    </View>
  );

  const LegendRows = ({
    items,
    palette,
    total,
  }: {
    items: { name: string; value: number }[];
    palette: string[];
    total: number;
  }) => (
    <View>
      {items.map((it, i) => {
        const pct = total > 0 ? Math.round((it.value / total) * 100) : 0;
        return (
          <View
            key={`${it.name}-${i}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 3,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                marginRight: 5,
                backgroundColor: palette[i % palette.length],
              }}
            />
            <Text
              style={{ flex: 1, fontSize: 9, color: colors.text }}
              wrap={false}
            >
              {it.name.length > 38 ? `${it.name.slice(0, 36)}…` : it.name}
            </Text>
            <Text style={{ width: 28, fontSize: 9, color: colors.textMuted, textAlign: "right" }}>
              {pct}%
            </Text>
            <Text
              style={{
                width: 50,
                fontSize: 9,
                color: colors.text,
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              {formatAmount(it.value, currency)}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.dashboardCard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Cost Breakdown</Text>
          <Text style={styles.dashboardSubtitle}>Maximum cost vs. potential improvements</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
            {formatAmount(net, currency)}
          </Text>
          <Text style={{ fontSize: 8, color: COLOR_TEAL }}>
            {totalReductions > 0
              ? `−${formatAmount(totalReductions, currency)} saved (${reductionPercent}%)`
              : "Savings not quantified"}
          </Text>
        </View>
      </View>

      {/* Composite stacked bar: cost segments + savings tail */}
      {gross > 0 && (
        <View
          style={{
            flexDirection: "row",
            height: 6,
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: colors.surfaceLight,
            marginBottom: 12,
          }}
        >
          {costs.map((c, i) => (
            <View
              key={`comp-c-${i}`}
              style={{
                width: `${(c.value / totalSegments) * 100}%`,
                backgroundColor: GREY_PALETTE[i % GREY_PALETTE.length],
              }}
            />
          ))}
          {totalReductions > 0 && (
            <View
              style={{
                width: `${(totalReductions / totalSegments) * 100}%`,
                backgroundColor: COLOR_TEAL,
              }}
            />
          )}
        </View>
      )}

      {/* Two-column body */}
      <View style={{ flexDirection: "row", gap: 14 }}>
        {/* Maximum Cost — grey */}
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 8,
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.2,
              }}
            >
              Maximum Cost
            </Text>
            <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 1 }}>
              All cost components
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: colors.text,
                marginTop: 4,
              }}
            >
              {formatAmount(gross, currency)}
            </Text>
            <Text
              style={{
                fontSize: 7,
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Gross
            </Text>
          </View>
          {costs.length > 0 ? (
            <>
              <SegmentBar items={costs} palette={GREY_PALETTE} total={gross} />
              <LegendRows items={costs} palette={GREY_PALETTE} total={gross} />
            </>
          ) : (
            <Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center" }}>
              No cost components
            </Text>
          )}
        </View>

        {/* Potential Improvements — teal */}
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 8,
                color: COLOR_TEAL,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                fontWeight: 600,
              }}
            >
              Potential Improvements
            </Text>
            <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 1 }}>
              Identified savings levers
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: COLOR_TEAL,
                marginTop: 4,
              }}
            >
              −{formatAmount(totalReductions, currency)}
            </Text>
            <Text
              style={{
                fontSize: 7,
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Savings
            </Text>
          </View>
          {reductions.length > 0 ? (
            <>
              <SegmentBar items={reductions} palette={TEAL_PALETTE} total={totalReductions} />
              <LegendRows items={reductions} palette={TEAL_PALETTE} total={totalReductions} />
            </>
          ) : (
            <Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center" }}>
              No reductions identified
            </Text>
          )}
        </View>
      </View>

      {/* Footer summary — Gross / Reductions / Net Total */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Gross Costs</Text>
          <Text style={[styles.statValue, { color: colors.text, fontSize: 12 }]}>
            {formatAmount(gross, currency)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Reductions</Text>
          <Text style={[styles.statValue, { color: COLOR_TEAL, fontSize: 12 }]}>
            −{formatAmount(totalReductions, currency)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Net Total</Text>
          <Text style={[styles.statValue, { color: colors.text, fontSize: 12 }]}>
            {formatAmount(net, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
};
