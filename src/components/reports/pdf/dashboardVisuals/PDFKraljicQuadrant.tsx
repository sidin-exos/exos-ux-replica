import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { KraljicData } from "@/lib/dashboard-data-parser";

type Quadrant = "strategic" | "bottleneck" | "leverage" | "noncritical";

const deriveQuadrant = (supplyRisk: number, businessImpact: number): Quadrant => {
  if (supplyRisk >= 50 && businessImpact >= 50) return "strategic";
  if (supplyRisk >= 50 && businessImpact < 50) return "bottleneck";
  if (supplyRisk < 50 && businessImpact >= 50) return "leverage";
  return "noncritical";
};

export const PDFKraljicQuadrant = ({ data, themeMode }: { data: KraljicData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const quadrantInfo = {
    strategic: { label: "Strategic", color: colors.destructive, strategy: "Partner closely, secure supply" },
    bottleneck: { label: "Bottleneck", color: colors.warning, strategy: "Reduce risk, find alternatives" },
    leverage: { label: "Leverage", color: colors.primary, strategy: "Maximize value, negotiate hard" },
    noncritical: { label: "Non-critical", color: colors.textMuted, strategy: "Simplify, automate" },
  };

  const items = data.items.map(item => ({
    name: item.name,
    quadrant: deriveQuadrant(item.supplyRisk, item.businessImpact),
    x: item.supplyRisk,
    y: item.businessImpact,
    spend: item.spend || "",
  }));

  const renderQuadrant = (quadrant: Quadrant, isLastCol: boolean, isLastRow: boolean) => {
    const info = quadrantInfo[quadrant];
    const quadrantItems = items.filter(i => i.quadrant === quadrant);
    const cellStyles = [
      styles.quadrantCell,
      isLastCol && styles.quadrantCellLastCol,
      isLastRow && styles.quadrantCellLastRow,
      { backgroundColor: info.color + "15" },
    ].filter(Boolean);

    return (
      <View style={cellStyles}>
        <Text style={[styles.quadrantLabel, { color: info.color, fontWeight: 600 }]}>{info.label}</Text>
        <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>{quadrantItems.length} items</Text>
        {quadrantItems.slice(0, 2).map((item, idx) => (
          <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2, backgroundColor: info.color, marginRight: 3 }} />
            <Text style={{ fontSize: 8, color: colors.text }}>{item.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Kraljic Matrix</Text>
          <Text style={styles.dashboardSubtitle}>Supply risk vs business impact</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: colors.destructive }}>
            {items.filter(i => i.quadrant === "strategic").length}
          </Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>strategic items</Text>
        </View>
      </View>

      <View style={{ marginTop: 8, flexDirection: "row" }}>
        <View style={{ width: 14, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 8, color: colors.textMuted, transform: "rotate(-90deg)" }}>Profit Impact ↑</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.quadrantGrid}>
            <View style={styles.quadrantRow}>
              {renderQuadrant("strategic", false, false)}
              {renderQuadrant("bottleneck", true, false)}
            </View>
            <View style={styles.quadrantRow}>
              {renderQuadrant("leverage", false, true)}
              {renderQuadrant("noncritical", true, true)}
            </View>
          </View>
          <Text style={{ fontSize: 8, color: colors.textMuted, textAlign: "center", marginTop: 4 }}>Supply Risk →</Text>
        </View>
      </View>

      <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, fontWeight: 600, color: colors.text, marginBottom: 4 }}>Recommended Strategies:</Text>
        {Object.entries(quadrantInfo).map(([key, info], i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
            <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: info.color, marginRight: 6 }} />
            <Text style={{ fontSize: 9, color: colors.text, fontWeight: 500, width: 60 }}>{info.label}:</Text>
            <Text style={{ fontSize: 9, color: colors.textMuted }}>{info.strategy}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
