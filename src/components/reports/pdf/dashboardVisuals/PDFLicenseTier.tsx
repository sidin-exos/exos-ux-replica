import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { LicenseTierData } from "@/lib/dashboard-data-parser";

const formatCurrency = (value: number): string => {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

export const PDFLicenseTier = ({ data, themeMode }: { data: LicenseTierData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const tiers = data.tiers;

  const totalUsers = tiers.reduce((sum, t) => sum + t.users, 0);
  const totalCost = tiers.reduce((sum, t) => sum + t.totalCost, 0);
  const optimizedCost = tiers.reduce((sum, t) => sum + (t.recommended || t.users) * t.costPerUser, 0);
  const potentialSavings = totalCost - optimizedCost;
  const maxCost = Math.max(1, ...tiers.map(t => t.totalCost));

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>License Distribution</Text>
          <Text style={styles.dashboardSubtitle}>User tier analysis</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>{totalUsers}</Text>
          <Text style={{ fontSize: 9, color: colors.textMuted }}>total users</Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        {tiers.map((tier, i) => {
          const barWidth = (tier.totalCost / maxCost) * 100;
          const userDiff = (tier.recommended || tier.users) - tier.users;
          return (
            <View key={i} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 9, height: 9, backgroundColor: tier.color, marginRight: 6 }} />
                  <Text style={{ fontSize: 10, color: colors.text, fontWeight: 600 }}>{tier.name}</Text>
                  <Text style={{ fontSize: 9, color: colors.textMuted, marginLeft: 4 }}>({tier.users} users)</Text>
                </View>
                <Text style={{ fontSize: 10, color: colors.text, fontWeight: 600 }}>{formatCurrency(tier.totalCost)}</Text>
              </View>
              <View style={{ height: 16, backgroundColor: colors.surfaceLight, overflow: "hidden", position: "relative" }}>
                <View style={{ height: 16, backgroundColor: tier.color, width: `${barWidth}%` }} />
                <Text style={{ position: "absolute", left: 6, top: 3, fontSize: 9, color: colors.background, fontWeight: 600 }}>
                  ${tier.costPerUser}/user
                </Text>
              </View>
              {userDiff !== 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                  <View style={{ paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: userDiff > 0 ? colors.primary : colors.warning, marginRight: 4 }}>
                    <Text style={{ fontSize: 8, color: userDiff > 0 ? colors.primary : colors.warning }}>
                      {userDiff > 0 ? `+${userDiff}` : userDiff} users recommended
                    </Text>
                  </View>
                  <Text style={{ fontSize: 8, color: colors.textMuted }}>→ Save {formatCurrency(Math.abs(userDiff) * tier.costPerUser)}/mo</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current Cost</Text>
          <Text style={styles.statValue}>{formatCurrency(totalCost)}/mo</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Optimized Cost</Text>
          <Text style={styles.statValue}>{formatCurrency(optimizedCost)}/mo</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Potential Savings</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{formatCurrency(potentialSavings)}/mo</Text>
        </View>
      </View>

      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}>
          <Text style={{ color: colors.primary, fontWeight: 600 }}>Optimization: </Text>
          Downgrade underutilized users to lower tiers based on usage patterns
        </Text>
      </View>
    </View>
  );
};
