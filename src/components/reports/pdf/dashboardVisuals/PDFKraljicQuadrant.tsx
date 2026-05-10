import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { KraljicData } from "@/lib/dashboard-data-parser";

type Quadrant = "strategic" | "leverage" | "bottleneck" | "noncritical";

const getQuadrant = (sr: number, bi: number): Quadrant => {
  if (sr >= 50 && bi >= 50) return "strategic";
  if (sr < 50 && bi >= 50) return "leverage";
  if (sr >= 50 && bi < 50) return "bottleneck";
  return "noncritical";
};

export const PDFKraljicQuadrant = ({ data, themeMode }: { data: KraljicData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const meta: Record<Quadrant, { label: string; strategy: string; color: string }> = {
    strategic: { label: "Strategic", strategy: "Partner & Collaborate", color: colors.destructive },
    leverage: { label: "Leverage", strategy: "Maximise Value", color: colors.primary },
    bottleneck: { label: "Bottleneck", strategy: "Secure Supply", color: colors.warning },
    noncritical: { label: "Non-Critical", strategy: "Simplify & Automate", color: colors.accent2 },
  };

  // 2x2 layout: top-left=Leverage, top-right=Strategic, bottom-left=Non-critical, bottom-right=Bottleneck
  const matrixOrder: Quadrant[] = ["leverage", "strategic", "noncritical", "bottleneck"];
  const order: Quadrant[] = ["strategic", "leverage", "bottleneck", "noncritical"];

  const itemsWithIds = data.items.map((it, i) => ({
    id: String.fromCharCode(65 + i), // A, B, C...
    name: it.name,
    quadrant: getQuadrant(it.supplyRisk, it.businessImpact),
    spend: it.spend || "",
  }));

  const grouped: Record<Quadrant, typeof itemsWithIds> = {
    strategic: [], leverage: [], bottleneck: [], noncritical: [],
  };
  itemsWithIds.forEach(it => grouped[it.quadrant].push(it));

  const counts = {
    strategic: grouped.strategic.length,
    leverage: grouped.leverage.length,
    bottleneck: grouped.bottleneck.length,
    noncritical: grouped.noncritical.length,
  };
  const total = itemsWithIds.length || 1;
  const highRisk = counts.strategic + counts.bottleneck;
  const portfolioRiskPct = Math.round((highRisk / total) * 100);
  const heroColor = portfolioRiskPct >= 50 ? meta.strategic.color : portfolioRiskPct >= 25 ? meta.bottleneck.color : meta.leverage.color;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Kraljic Matrix</Text>
          <Text style={styles.dashboardSubtitle}>Strategic positioning</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 15, fontWeight: 700, color: heroColor }}>{portfolioRiskPct}%</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>portfolio risk</Text>
        </View>
      </View>

      {/* Quadrant distribution bar */}
      <View style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
          <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>Quadrant distribution</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>{itemsWithIds.length} items</Text>
        </View>
        <View style={{ flexDirection: "row", height: 5, backgroundColor: colors.surfaceLight, overflow: "hidden" }}>
          {order.map(q => {
            const pct = (counts[q] / total) * 100;
            if (pct === 0) return null;
            return <View key={q} style={{ width: `${pct}%`, backgroundColor: meta[q].color }} />;
          })}
        </View>
      </View>

      {/* Two-column: matrix + side panel */}
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          {/* Y-axis */}
          <View style={{ flexDirection: "row" }}>
            <View style={{ width: 22, justifyContent: "space-between", alignItems: "center", paddingVertical: 4 }}>
              <Text style={{ fontSize: 7, color: colors.textMuted }}>High</Text>
              <Text style={{ fontSize: 6, color: colors.textMuted, textTransform: "uppercase" }}>Profit</Text>
              <Text style={{ fontSize: 7, color: colors.textMuted }}>Low</Text>
            </View>

            {/* 2x2 grid */}
            <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border }}>
              {[0, 1].map(row => (
                <View key={row} style={{ flexDirection: "row", flex: 1 }}>
                  {[0, 1].map(col => {
                    const q = matrixOrder[row * 2 + col];
                    const m = meta[q];
                    const qItems = grouped[q];
                    const sharePct = Math.round((qItems.length / total) * 100);
                    return (
                      <View
                        key={col}
                        style={{
                          flex: 1,
                          minHeight: 90,
                          borderRightWidth: col === 0 ? 1 : 0,
                          borderBottomWidth: row === 0 ? 1 : 0,
                          borderColor: colors.border,
                          backgroundColor: m.color + "12",
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 4, backgroundColor: m.color }}>
                          <Text style={{ fontSize: 8, fontWeight: 700, color: colors.textOnPrimary, textTransform: "uppercase" }}>{m.label}</Text>
                          <Text style={{ fontSize: 8, color: colors.textOnPrimary }}>{qItems.length} · {sharePct}%</Text>
                        </View>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", padding: 4 }}>
                          {qItems.map(it => (
                            <View
                              key={it.id}
                              style={{
                                width: 14, height: 14,
                                borderWidth: 1, borderColor: m.color,
                                backgroundColor: m.color + "25",
                                justifyContent: "center", alignItems: "center",
                                marginRight: 3, marginBottom: 3,
                              }}
                            >
                              <Text style={{ fontSize: 7, fontWeight: 700, color: m.color }}>{it.id}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
          {/* X-axis */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginLeft: 22, marginTop: 3 }}>
            <Text style={{ fontSize: 7, color: colors.textMuted }}>Low</Text>
            <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase" }}>Supply Risk</Text>
            <Text style={{ fontSize: 7, color: colors.textMuted }}>High</Text>
          </View>
        </View>

        {/* Side strategy panel */}
        <View style={{ width: 130, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceLight, padding: 7 }}>
          <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", marginBottom: 5 }}>Strategy summary</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
            <Text style={{ fontSize: 9, color: colors.textMuted }}>Total items</Text>
            <Text style={{ fontSize: 9, fontWeight: 700, color: colors.text }}>{itemsWithIds.length}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
            <Text style={{ fontSize: 9, color: colors.textMuted }}>High-risk</Text>
            <Text style={{ fontSize: 9, fontWeight: 700, color: colors.text }}>{highRisk} / {itemsWithIds.length}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ fontSize: 9, fontWeight: 600, color: colors.text }}>Portfolio risk</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: heroColor }}>{portfolioRiskPct}%</Text>
          </View>
          <View style={{ paddingTop: 5, marginTop: 5, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", marginBottom: 3 }}>Quadrants</Text>
            {order.map(q => (
              <View key={q} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 5, height: 5, backgroundColor: meta[q].color, marginRight: 4 }} />
                  <Text style={{ fontSize: 8, color: colors.textMuted }}>{meta[q].label}</Text>
                </View>
                <Text style={{ fontSize: 8, fontWeight: 700, color: meta[q].color }}>{counts[q]}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Item legend */}
      <View style={{ marginTop: 8, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ paddingHorizontal: 6, paddingVertical: 3, backgroundColor: colors.surfaceLight, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 8, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase" }}>Item legend</Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", padding: 5 }}>
          {order.flatMap(q => grouped[q].map(it => (
            <View key={it.id} style={{ width: "50%", flexDirection: "row", alignItems: "center", paddingVertical: 2, paddingRight: 4 }}>
              <View style={{ width: 1.5, height: 14, backgroundColor: meta[q].color, marginRight: 4 }} />
              <View style={{
                width: 14, height: 14, borderWidth: 1, borderColor: meta[q].color,
                backgroundColor: meta[q].color + "25",
                justifyContent: "center", alignItems: "center", marginRight: 4,
              }}>
                <Text style={{ fontSize: 7, fontWeight: 700, color: meta[q].color }}>{it.id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: colors.text }}>{it.name}</Text>
                {it.spend ? <Text style={{ fontSize: 7, color: colors.textMuted }}>{it.spend}</Text> : null}
              </View>
            </View>
          )))}
        </View>
      </View>
    </View>
  );
};
