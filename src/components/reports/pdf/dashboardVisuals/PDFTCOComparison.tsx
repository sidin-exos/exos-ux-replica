import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";
import type { TCOComparisonData } from "@/lib/dashboard-data-parser";

const defaultOptions = [
  { name: "Buy Outright", totalTCO: 485000, color: colors.primary },
  { name: "3-Year Lease", totalTCO: 520000, color: "#6366f1" },
  { name: "Subscription", totalTCO: 595000, color: "#8b5cf6" },
];

const defaultData = [
  { year: "Y0", values: [350, 50, 80] },
  { year: "Y1", values: [380, 170, 175] },
  { year: "Y2", values: [410, 290, 280] },
  { year: "Y3", values: [435, 410, 390] },
  { year: "Y4", values: [460, 480, 505] },
  { year: "Y5", values: [485, 520, 595] },
];

const formatCurrency = (value: number): string => {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

export const PDFTCOComparison = ({ data }: { data?: TCOComparisonData }) => {
  const options = data?.options || defaultOptions;

  const chartData = data?.data
    ? data.data.map(row => {
        const values = options.map(opt => {
          const key: string = ("id" in opt && typeof opt.id === "string") ? opt.id : opt.name;
          const val = row[key];
          return typeof val === "number" ? val : 0;
        });
        return { year: row.year as string, values };
      })
    : defaultData;

  const lowestTCO = options.reduce((min, opt) => opt.totalTCO < min.totalTCO ? opt : min, options[0]);
  const highestTCO = options.reduce((max, opt) => opt.totalTCO > max.totalTCO ? opt : max, options[0]);
  const savings = highestTCO.totalTCO - lowestTCO.totalTCO;
  const maxValue = Math.max(1, ...chartData.flatMap(d => d.values));

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>TCO Comparison</Text>
          <Text style={styles.dashboardSubtitle}>Cumulative cost over time</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: colors.primary }}>{formatCurrency(savings)}</Text>
          <Text style={{ fontSize: 6, color: colors.textMuted }}>potential savings</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", marginTop: 6, marginBottom: 10 }}>
        {options.map((opt, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginRight: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: opt.color, marginRight: 4 }} />
            <Text style={{ fontSize: 7, color: colors.textMuted }}>{opt.name}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginBottom: 10 }}>
        {chartData.map((point, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ width: 20, fontSize: 7, color: colors.textMuted }}>{point.year}</Text>
            <View style={{ flex: 1, flexDirection: "row", height: 8, marginLeft: 6 }}>
              {point.values.map((val, j) => (
                <View key={j} style={{ width: `${(val / maxValue) * 100}%`, height: 4, backgroundColor: options[j]?.color || colors.textMuted, marginTop: j * 2, borderRadius: 1, position: "absolute", left: 0 }} />
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5 }]}>Option</Text>
          <Text style={styles.matrixCell}>5-Year TCO</Text>
          <Text style={styles.matrixCell}>vs. Best</Text>
        </View>
        {options.map((opt, i) => {
          const diff = opt.totalTCO - lowestTCO.totalTCO;
          return (
            <View key={i} style={styles.matrixRow}>
              <View style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, flexDirection: "row", alignItems: "center" }]}>
                <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: opt.color, marginRight: 4 }} />
                <Text style={{ fontSize: 8, color: colors.text }}>{opt.name}</Text>
              </View>
              <Text style={[styles.matrixCell, { fontWeight: 600 }]}>{formatCurrency(opt.totalTCO)}</Text>
              <Text style={[styles.matrixCell, { color: diff === 0 ? colors.primary : colors.textMuted }]}>
                {diff === 0 ? "Best" : `+${formatCurrency(diff)}`}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 7, color: colors.textMuted }}>
          <Text style={{ color: colors.primary, fontWeight: 600 }}>Recommendation: </Text>
          {lowestTCO.name} offers the lowest total cost of ownership
        </Text>
      </View>
    </View>
  );
};
