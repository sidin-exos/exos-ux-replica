import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { SensitivityData } from "@/lib/dashboard-data-parser";

const COLOR_FAVORABLE_KEY = "primary" as const;
const COLOR_UNFAVORABLE_KEY = "destructive" as const;

const formatCurrency = (value: number, currency = "$"): string => {
  if (!Number.isFinite(value)) return `${currency}0`;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}${currency}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${currency}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${currency}${abs.toFixed(0)}`;
};

const formatValue = (value: number, unit?: string): string => {
  if (unit === "$") return formatCurrency(value);
  if (unit === "%") return `${value}%`;
  if (unit === "units") return `${(value / 1000).toFixed(0)}K`;
  return value.toFixed(2);
};

export const PDFSensitivityAnalysis = ({ data, themeMode }: { data: SensitivityData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const favorable = colors[COLOR_FAVORABLE_KEY];
  const unfavorable = colors[COLOR_UNFAVORABLE_KEY];
  const tierHigh = colors.destructive;
  const tierMed = colors.warning;
  const tierLow = colors.primary;

  const tierFor = (maxPct: number) => {
    if (maxPct >= 20) return { label: "High", color: tierHigh };
    if (maxPct >= 10) return { label: "Medium", color: tierMed };
    return { label: "Low", color: tierLow };
  };

  const baseCaseTotal = (data as { baseCaseTotal?: number }).baseCaseTotal ?? 0;
  const currency = (data as { currency?: string }).currency ?? "$";

  const impacts = data.variables.map(v => {
    const lowImpact = v.lowCase - v.baseCase;
    const highImpact = v.highCase - v.baseCase;
    const base = Math.abs(v.baseCase) || 1;
    const lowPct = (lowImpact / base) * 100;
    const highPct = (highImpact / base) * 100;
    const maxPct = Math.max(Math.abs(lowPct), Math.abs(highPct));
    return { ...v, lowImpact, highImpact, lowPct, highPct, maxPct, tier: tierFor(maxPct) };
  });

  const sorted = [...impacts].sort((a, b) => b.maxPct - a.maxPct);
  const maxOverall = Math.max(...sorted.map(i => i.maxPct), 1);
  const total = sorted.length || 1;

  const tierOrder = [
    { label: "High", color: tierHigh },
    { label: "Medium", color: tierMed },
    { label: "Low", color: tierLow },
  ];
  const tierCounts = sorted.reduce<Record<string, number>>((acc, i) => {
    acc[i.tier.label] = (acc[i.tier.label] || 0) + 1;
    return acc;
  }, {});

  // Range summary (sum of pct deltas across vars, applied to monetary base)
  const favorablePctSum = sorted.reduce((s, v) => s + Math.abs(Math.min(v.lowPct, v.highPct, 0)), 0);
  const unfavorablePctSum = sorted.reduce((s, v) => s + Math.max(v.lowPct, v.highPct, 0), 0);
  const bestCase = baseCaseTotal * (1 - favorablePctSum / 100);
  const worstCase = baseCaseTotal * (1 + unfavorablePctSum / 100);

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Sensitivity Analysis</Text>
          <Text style={styles.dashboardSubtitle}>Impact on total cost</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>±{maxOverall.toFixed(1)}%</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>max impact</Text>
        </View>
      </View>

      {/* Tier distribution bar */}
      <View style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: "row", height: 5, backgroundColor: colors.surfaceLight, overflow: "hidden" }}>
          {tierOrder.map(t => {
            const pct = ((tierCounts[t.label] || 0) / total) * 100;
            if (pct === 0) return null;
            return <View key={t.label} style={{ width: `${pct}%`, backgroundColor: t.color }} />;
          })}
        </View>
        <View style={{ flexDirection: "row", marginTop: 4 }}>
          {tierOrder.map(t => (
            <View key={t.label} style={{ flexDirection: "row", alignItems: "center", marginRight: 10 }}>
              <View style={{ width: 6, height: 6, backgroundColor: t.color, marginRight: 3 }} />
              <Text style={{ fontSize: 8, color: colors.textMuted }}>{t.label} ({tierCounts[t.label] || 0})</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Two-column: tornado + Key Drivers */}
      <View style={{ flexDirection: "row", marginTop: 4 }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 8, color: colors.textMuted }}>Variable</Text>
            <Text style={{ fontSize: 8, color: colors.textMuted }}>% deviation from base</Text>
          </View>
          {sorted.map((v, i) => {
            const lowW = (Math.abs(v.lowPct) / maxOverall) * 50;
            const highW = (Math.abs(v.highPct) / maxOverall) * 50;
            return (
              <View key={i} style={styles.tornadoRow}>
                <Text style={[styles.tornadoLabel, { width: 70 }]}>{v.name}</Text>
                <View style={styles.tornadoChart}>
                  <View style={styles.tornadoLeft}>
                    <View style={[styles.tornadoBar, { width: `${lowW * 2}%`, backgroundColor: v.lowImpact < 0 ? unfavorable : favorable }]} />
                  </View>
                  <View style={styles.tornadoCenter} />
                  <View style={styles.tornadoRight}>
                    <View style={[styles.tornadoBar, { width: `${highW * 2}%`, backgroundColor: v.highImpact > 0 ? unfavorable : favorable }]} />
                  </View>
                </View>
                <View style={{ width: 64, flexDirection: "row", justifyContent: "flex-end" }}>
                  <Text style={{ fontSize: 8, color: colors.destructive }}>{Math.abs(v.lowPct).toFixed(1)}%</Text>
                  <Text style={{ fontSize: 8, color: colors.textMuted, marginHorizontal: 2 }}>/</Text>
                  <Text style={{ fontSize: 8, color: colors.primary }}>{Math.abs(v.highPct).toFixed(1)}%</Text>
                </View>
              </View>
            );
          })}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 10 }}>
              <View style={{ width: 7, height: 7, backgroundColor: favorable, marginRight: 3 }} />
              <Text style={{ fontSize: 8, color: colors.textMuted }}>Favorable</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 7, height: 7, backgroundColor: unfavorable, marginRight: 3 }} />
              <Text style={{ fontSize: 8, color: colors.textMuted }}>Unfavorable</Text>
            </View>
          </View>
        </View>

        {/* Key Drivers side panel */}
        <View style={{ width: 150 }}>
          <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Key Drivers
          </Text>
          {sorted.slice(0, 4).map((v, i) => (
            <View key={i} style={{ flexDirection: "row", borderWidth: 1, borderColor: colors.border, padding: 5, marginBottom: 4 }}>
              <View style={{ width: 2, backgroundColor: v.tier.color, marginRight: 5 }} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 9, fontWeight: 600, color: colors.text }}>{v.name}</Text>
                  <Text style={{ fontSize: 7, color: v.tier.color, fontWeight: 600 }}>±{v.maxPct.toFixed(1)}%</Text>
                </View>
                <Text style={{ fontSize: 7, color: colors.textMuted, marginTop: 1 }}>Base {formatValue(v.baseCase, v.unit)}</Text>
                <Text style={{ fontSize: 7, color: colors.textMuted }}>Range {formatValue(v.lowCase, v.unit)}–{formatValue(v.highCase, v.unit)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Range summary */}
      {baseCaseTotal > 0 && (
        <View style={{ flexDirection: "row", marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>Best Case</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: favorable, marginTop: 2 }}>{formatCurrency(Math.max(0, bestCase), currency)}</Text>
            <Text style={{ fontSize: 7, color: colors.textMuted }}>−{favorablePctSum.toFixed(1)}%</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>Base Case</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: colors.text, marginTop: 2 }}>{formatCurrency(baseCaseTotal, currency)}</Text>
            <Text style={{ fontSize: 7, color: colors.textMuted }}>reference</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>Worst Case</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: unfavorable, marginTop: 2 }}>{formatCurrency(worstCase, currency)}</Text>
            <Text style={{ fontSize: 7, color: colors.textMuted }}>+{unfavorablePctSum.toFixed(1)}%</Text>
          </View>
        </View>
      )}
    </View>
  );
};
