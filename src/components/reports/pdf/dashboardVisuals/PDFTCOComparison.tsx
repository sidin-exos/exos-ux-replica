import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { TCOComparisonData } from "@/lib/dashboard-data-parser";

const currencySymbol = (code?: string): string => {
  if (!code) return "$";
  const c = code.trim().toUpperCase();
  if (c === "EUR" || c === "€") return "€";
  if (c === "USD" || c === "$") return "$";
  if (c === "GBP" || c === "£") return "£";
  if (c === "JPY" || c === "¥") return "¥";
  if (c === "CHF") return "CHF ";
  return `${c} `;
};

const formatCurrency = (value: number, currency = "$"): string => {
  const sym = currencySymbol(currency);
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${sym}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${sym}${abs.toFixed(0)}`;
};

// Rank-based palette (matches web): best=teal, mid=amber, worst=plum
const PALETTE_BY_RANK = ["#3a8c82", "#a37937", "#a04545", "#5e7187"];

const yearOf = (label: string): number => {
  const m = label.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
};

export const PDFTCOComparison = ({ data, themeMode }: { data: TCOComparisonData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const currency = (data as { currency?: string }).currency ?? "$";

  // Apply rank-based colors
  const rawOptions = data.options;
  const ranked = [...rawOptions].sort((a, b) => a.totalTCO - b.totalTCO);
  const colorById = new Map(ranked.map((opt, i) => [opt.id ?? opt.name, PALETTE_BY_RANK[Math.min(i, PALETTE_BY_RANK.length - 1)]]));
  const options = rawOptions.map((opt) => ({ ...opt, color: colorById.get(opt.id ?? opt.name) || opt.color }));

  const sorted = [...options].sort((a, b) => a.totalTCO - b.totalTCO);
  const lowestTCO = sorted[0];
  const runnerUp = sorted[1];
  const highestTCO = sorted[sorted.length - 1];
  const savings = highestTCO.totalTCO - lowestTCO.totalTCO;

  const chartData = data.data
    ? data.data.map(row => {
        const values = options.map(opt => {
          const key: string = ("id" in opt && typeof opt.id === "string") ? opt.id : opt.name;
          const val = row[key];
          return typeof val === "number" ? val : 0;
        });
        return { year: row.year as string, values };
      })
    : [];
  const maxValue = Math.max(1, ...chartData.flatMap(d => d.values));

  // Crossover detection (mirrors web)
  const findCrossover = (): { years: number; months: number } | null => {
    if (!runnerUp || !data.data) return null;
    const aKey = (lowestTCO as any).id ?? lowestTCO.name;
    const bKey = (runnerUp as any).id ?? runnerUp.name;
    for (let i = 1; i < data.data.length; i++) {
      const prev = data.data[i - 1];
      const curr = data.data[i];
      const prevA = Number(prev[aKey] ?? 0);
      const prevB = Number(prev[bKey] ?? 0);
      const currA = Number(curr[aKey] ?? 0);
      const currB = Number(curr[bKey] ?? 0);
      if (prevA > prevB && currA <= currB) {
        const t = (prevA - prevB) / ((prevA - prevB) - (currA - currB));
        const y0 = yearOf(prev.year as string);
        const y1 = yearOf(curr.year as string);
        const exact = y0 + t * (y1 - y0);
        const years = Math.floor(exact);
        const months = Math.round((exact - years) * 12);
        return months === 12 ? { years: years + 1, months: 0 } : { years, months };
      }
    }
    return null;
  };
  const crossover = findCrossover();
  const conclusion = crossover
    ? `${lowestTCO.name} becomes the cheapest option after ${crossover.years} year${crossover.years === 1 ? "" : "s"}${
        crossover.months > 0 ? ` and ${crossover.months} month${crossover.months === 1 ? "" : "s"}` : ""
      }, saving ${formatCurrency(savings, currency)} over ${runnerUp ? runnerUp.name : highestTCO.name} across the full horizon.`
    : `${lowestTCO.name} is the cheapest option from day one, saving ${formatCurrency(savings, currency)} versus ${highestTCO.name} across the full horizon.`;

  const tealAccent = "#3a8c82";

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>TCO Comparison</Text>
          <Text style={styles.dashboardSubtitle}>Cumulative cost over time</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 14, fontWeight: 700, color: tealAccent }}>{formatCurrency(savings, currency)}</Text>
          <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>potential savings</Text>
        </View>
      </View>

      {/* Conclusion call-out */}
      <View
        style={{
          borderWidth: 1,
          borderColor: `${tealAccent}40`,
          backgroundColor: `${tealAccent}0F`,
          padding: 6,
          marginTop: 4,
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 7, color: tealAccent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Conclusion</Text>
        <Text style={{ fontSize: 8.5, color: colors.text, lineHeight: 1.35 }}>{conclusion}</Text>
      </View>

      <View style={{ flexDirection: "row", marginBottom: 10, flexWrap: "wrap" }}>
        {options.map((opt, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginRight: 12, marginBottom: 2 }}>
            <View style={{ width: 9, height: 9, backgroundColor: opt.color, marginRight: 4 }} />
            <Text style={{ fontSize: 9, color: colors.textMuted }}>{opt.name}</Text>
          </View>
        ))}
      </View>

      {chartData.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          {chartData.map((point, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
              <Text style={{ width: 22, fontSize: 9, color: colors.textMuted }}>{point.year}</Text>
              <View style={{ flex: 1, marginLeft: 6 }}>
                {point.values.map((val, j) => (
                  <View key={j} style={{ flexDirection: "row", alignItems: "center", marginBottom: 1 }}>
                    <View style={{ flex: 1, height: 5, backgroundColor: colors.surfaceLight }}>
                      <View style={{ width: `${(val / maxValue) * 100}%`, height: 5, backgroundColor: options[j]?.color || colors.textMuted }} />
                    </View>
                    <Text style={{ width: 50, fontSize: 7, color: colors.textMuted, textAlign: "right" }}>{formatCurrency(val, currency)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5 }]}>Option</Text>
          <Text style={styles.matrixCell}>5-Year TCO</Text>
          <Text style={styles.matrixCell}>vs. Best</Text>
        </View>
        {options.map((opt, i) => {
          const diff = opt.totalTCO - lowestTCO.totalTCO;
          const isBest = diff === 0;
          return (
            <View key={i} style={styles.matrixRow}>
              <View style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, flexDirection: "row", alignItems: "center" }]}>
                <View style={{ width: 7, height: 7, backgroundColor: opt.color, marginRight: 4 }} />
                <Text style={{ fontSize: 10, color: colors.text }}>{opt.name}</Text>
              </View>
              <Text style={[styles.matrixCell, { fontWeight: 600 }]}>{formatCurrency(opt.totalTCO, currency)}</Text>
              <Text style={[styles.matrixCell, { color: isBest ? tealAccent : colors.textMuted, fontWeight: isBest ? 700 : 400 }]}>
                {isBest ? "Best" : `+${formatCurrency(diff, currency)}`}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}>
          <Text style={{ color: tealAccent, fontWeight: 600 }}>Recommendation: </Text>
          {lowestTCO.name} offers the lowest total cost of ownership.
        </Text>
      </View>
    </View>
  );
};
