import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";

// Quadrant positioning
const items = [
  { name: "Component A", quadrant: "strategic", x: 75, y: 80, spend: "$450K" },
  { name: "Component B", quadrant: "bottleneck", x: 85, y: 35, spend: "$120K" },
  { name: "Service C", quadrant: "leverage", x: 30, y: 75, spend: "$280K" },
  { name: "Material D", quadrant: "noncritical", x: 25, y: 25, spend: "$65K" },
  { name: "Material E", quadrant: "strategic", x: 65, y: 90, spend: "$380K" },
];

const quadrantInfo = {
  strategic: { label: "Strategic", color: colors.destructive, strategy: "Partner closely, secure supply" },
  bottleneck: { label: "Bottleneck", color: colors.warning, strategy: "Reduce risk, find alternatives" },
  leverage: { label: "Leverage", color: colors.primary, strategy: "Maximize value, negotiate hard" },
  noncritical: { label: "Non-critical", color: colors.textMuted, strategy: "Simplify, automate" },
};

export const PDFKraljicQuadrant = () => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.dashboardTitle}>Kraljic Matrix</Text>
        <Text style={styles.dashboardSubtitle}>Supply risk vs business impact</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: colors.destructive }}>
          {items.filter(i => i.quadrant === "strategic").length}
        </Text>
        <Text style={{ fontSize: 6, color: colors.textMuted }}>strategic items</Text>
      </View>
    </View>

    {/* 2x2 Matrix Grid */}
    <View style={{ marginTop: 8, flexDirection: "row" }}>
      {/* Y-axis label */}
      <View style={{ width: 14, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 6, color: colors.textMuted, transform: "rotate(-90deg)" }}>Profit Impact ↑</Text>
      </View>
      
      <View style={{ flex: 1 }}>
        <View style={styles.quadrantGrid}>
          {/* Top row: Strategic | Bottleneck */}
          <View style={styles.quadrantRow}>
            <View style={[styles.quadrantCell, { backgroundColor: quadrantInfo.strategic.color + "15" }]}>
              <Text style={[styles.quadrantLabel, { color: quadrantInfo.strategic.color, fontWeight: 600 }]}>
                Strategic
              </Text>
              <Text style={{ fontSize: 6, color: colors.textMuted, marginTop: 2 }}>
                {items.filter(i => i.quadrant === "strategic").length} items
              </Text>
              {items.filter(i => i.quadrant === "strategic").slice(0, 2).map((item, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: quadrantInfo.strategic.color, marginRight: 3 }} />
                  <Text style={{ fontSize: 6, color: colors.text }}>{item.name}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.quadrantCell, styles.quadrantCellLastCol, { backgroundColor: quadrantInfo.bottleneck.color + "15" }]}>
              <Text style={[styles.quadrantLabel, { color: quadrantInfo.bottleneck.color, fontWeight: 600 }]}>
                Bottleneck
              </Text>
              <Text style={{ fontSize: 6, color: colors.textMuted, marginTop: 2 }}>
                {items.filter(i => i.quadrant === "bottleneck").length} items
              </Text>
              {items.filter(i => i.quadrant === "bottleneck").slice(0, 2).map((item, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: quadrantInfo.bottleneck.color, marginRight: 3 }} />
                  <Text style={{ fontSize: 6, color: colors.text }}>{item.name}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Bottom row: Leverage | Non-critical */}
          <View style={styles.quadrantRow}>
            <View style={[styles.quadrantCell, styles.quadrantCellLastRow, { backgroundColor: quadrantInfo.leverage.color + "15" }]}>
              <Text style={[styles.quadrantLabel, { color: quadrantInfo.leverage.color, fontWeight: 600 }]}>
                Leverage
              </Text>
              <Text style={{ fontSize: 6, color: colors.textMuted, marginTop: 2 }}>
                {items.filter(i => i.quadrant === "leverage").length} items
              </Text>
              {items.filter(i => i.quadrant === "leverage").slice(0, 2).map((item, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: quadrantInfo.leverage.color, marginRight: 3 }} />
                  <Text style={{ fontSize: 6, color: colors.text }}>{item.name}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.quadrantCell, styles.quadrantCellLastCol, styles.quadrantCellLastRow, { backgroundColor: quadrantInfo.noncritical.color + "15" }]}>
              <Text style={[styles.quadrantLabel, { color: quadrantInfo.noncritical.color, fontWeight: 600 }]}>
                Non-critical
              </Text>
              <Text style={{ fontSize: 6, color: colors.textMuted, marginTop: 2 }}>
                {items.filter(i => i.quadrant === "noncritical").length} items
              </Text>
              {items.filter(i => i.quadrant === "noncritical").slice(0, 2).map((item, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: quadrantInfo.noncritical.color, marginRight: 3 }} />
                  <Text style={{ fontSize: 6, color: colors.text }}>{item.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        
        {/* X-axis label */}
        <Text style={{ fontSize: 6, color: colors.textMuted, textAlign: "center", marginTop: 4 }}>
          Supply Risk →
        </Text>
      </View>
    </View>

    {/* Strategy summary */}
    <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Text style={{ fontSize: 7, fontWeight: 600, color: colors.text, marginBottom: 4 }}>Recommended Strategies:</Text>
      {Object.entries(quadrantInfo).map(([key, info], i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: info.color, marginRight: 6 }} />
          <Text style={{ fontSize: 7, color: colors.text, fontWeight: 500, width: 60 }}>{info.label}:</Text>
          <Text style={{ fontSize: 7, color: colors.textMuted }}>{info.strategy}</Text>
        </View>
      ))}
    </View>
  </View>
);
