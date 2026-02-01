import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";

const tiers = [
  { name: "Power Users", users: 85, costPerUser: 45, totalCost: 45900, recommended: 75, color: colors.primary },
  { name: "Regular Users", users: 210, costPerUser: 25, totalCost: 63000, recommended: 180, color: "#6366f1" },
  { name: "Occasional", users: 340, costPerUser: 10, totalCost: 40800, recommended: 380, color: "#8b5cf6" },
  { name: "View-Only", users: 180, costPerUser: 5, totalCost: 10800, recommended: 180, color: colors.warning },
];

const totalUsers = tiers.reduce((sum, t) => sum + t.users, 0);
const totalCost = tiers.reduce((sum, t) => sum + t.totalCost, 0);
const optimizedCost = tiers.reduce((sum, t) => sum + (t.recommended || t.users) * t.costPerUser, 0);
const potentialSavings = totalCost - optimizedCost;
const maxCost = Math.max(...tiers.map((t) => t.totalCost));

const formatCurrency = (value: number): string => {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

export const PDFLicenseTier = () => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.dashboardTitle}>License Distribution</Text>
        <Text style={styles.dashboardSubtitle}>User tier analysis</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{totalUsers}</Text>
        <Text style={{ fontSize: 7, color: colors.textMuted }}>total users</Text>
      </View>
    </View>

    <View style={styles.barContainer}>
      {tiers.map((tier, i) => {
        const barWidth = (tier.totalCost / maxCost) * 100;
        const userDiff = tier.recommended - tier.users;
        
        return (
          <View key={i} style={{ marginBottom: 8 }}>
            {/* Header row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: tier.color, marginRight: 6 }} />
                <Text style={{ fontSize: 8, color: colors.text, fontWeight: 600 }}>{tier.name}</Text>
                <Text style={{ fontSize: 7, color: colors.textMuted, marginLeft: 4 }}>({tier.users} users)</Text>
              </View>
              <Text style={{ fontSize: 8, color: colors.text, fontWeight: 600 }}>{formatCurrency(tier.totalCost)}</Text>
            </View>
            
            {/* Bar */}
            <View style={{ height: 14, backgroundColor: colors.surfaceLight, borderRadius: 3, overflow: "hidden", position: "relative" }}>
              <View style={{ height: 14, borderRadius: 3, backgroundColor: tier.color, width: `${barWidth}%` }} />
              <Text style={{ position: "absolute", left: 6, top: 3, fontSize: 7, color: colors.background, fontWeight: 600 }}>
                ${tier.costPerUser}/user
              </Text>
            </View>
            
            {/* Optimization hint */}
            {userDiff !== 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                <View style={{ 
                  paddingHorizontal: 4, 
                  paddingVertical: 1, 
                  borderRadius: 2, 
                  borderWidth: 1, 
                  borderColor: userDiff > 0 ? colors.primary : colors.warning,
                  marginRight: 4
                }}>
                  <Text style={{ fontSize: 6, color: userDiff > 0 ? colors.primary : colors.warning }}>
                    {userDiff > 0 ? `+${userDiff}` : userDiff} users recommended
                  </Text>
                </View>
                <Text style={{ fontSize: 6, color: colors.textMuted }}>
                  → Save {formatCurrency(Math.abs(userDiff) * tier.costPerUser)}/mo
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>

    {/* Summary Stats */}
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

    {/* Recommendation */}
    <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Text style={{ fontSize: 7, color: colors.textMuted }}>
        <Text style={{ color: colors.primary, fontWeight: 600 }}>Optimization: </Text>
        Downgrade 10 Power Users and 30 Regular Users to lower tiers based on usage patterns
      </Text>
    </View>
  </View>
);
