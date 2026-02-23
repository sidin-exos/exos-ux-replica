import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";
import type { CostWaterfallData } from "@/lib/dashboard-data-parser";

const defaultBreakdown = [
  { name: "Materials", value: 45, amount: "$225K", color: colors.textMuted },
  { name: "Labor", value: 25, amount: "$125K", color: colors.textMuted },
  { name: "Overhead", value: 17, amount: "$85K", color: colors.textMuted },
  { name: "Logistics", value: 6, amount: "$30K", color: colors.textMuted },
  { name: "Profit Margin", value: 7, amount: "$35K", color: colors.warning },
];

const formatAmount = (value: number, currency: string = "$"): string => {
  if (value >= 1_000_000) return `${currency}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${currency}${(value / 1000).toFixed(0)}K`;
  return `${currency}${value}`;
};

export const PDFCostWaterfall = ({ data }: { data?: CostWaterfallData }) => {
  const currency = data?.currency || "$";

  const costBreakdownData = data?.components
    ? (() => {
        const total = data.components.reduce((s, c) => s + Math.abs(c.value), 0) || 1;
        return data.components.map(c => ({
          name: c.name,
          value: Math.round((Math.abs(c.value) / total) * 100),
          amount: formatAmount(Math.abs(c.value), currency),
          color: c.type === "reduction" ? colors.warning : colors.textMuted,
        }));
      })()
    : defaultBreakdown;

  const totalRaw = data?.components
    ? data.components.filter(c => c.type === "cost").reduce((s, c) => s + c.value, 0)
    : 500000;
  const savingsRaw = data?.components
    ? data.components.filter(c => c.type === "reduction").reduce((s, c) => s + Math.abs(c.value), 0)
    : 45000;

  const totalAmount = formatAmount(totalRaw, currency);
  const savingsOpportunity = formatAmount(savingsRaw, currency);

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Cost Breakdown</Text>
          <Text style={styles.dashboardSubtitle}>Component analysis</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{totalAmount}</Text>
          <Text style={{ fontSize: 6, color: colors.textMuted }}>total spend</Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        {costBreakdownData.map((item, i) => (
          <View key={i} style={styles.barRow}>
            <View style={{ flexDirection: "row", alignItems: "center", width: 82 }}>
              <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: item.color, marginRight: 4 }} />
              <Text style={{ fontSize: 8, color: colors.text }}>{item.name}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { flex: item.value, backgroundColor: item.color }]} />
              <View style={{ flex: Math.max(0, 100 - item.value) }} />
            </View>
            <View style={{ width: 54, alignItems: "flex-end" }}>
              <Text style={{ fontSize: 8, color: colors.text, fontWeight: 600 }}>{item.amount}</Text>
              <Text style={{ fontSize: 6, color: colors.textMuted }}>{item.value}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Cost</Text>
          <Text style={styles.statValue}>{totalAmount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Savings Opportunity</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{savingsOpportunity}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Target Margin</Text>
          <Text style={styles.statValue}>5-7%</Text>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
          <Text style={styles.legendText}>Cost Component</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>Supplier Margin (negotiable)</Text>
        </View>
      </View>
    </View>
  );
};
