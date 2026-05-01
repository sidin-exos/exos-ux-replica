import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { RiskMatrixData } from "@/lib/dashboard-data-parser";

/**
 * PDF Risk Matrix — mirrors the online RiskMatrixDashboard:
 *   - KPI header (% critical)
 *   - Action distribution bar
 *   - 3x3 Impact x Probability grid with numbered risk dots
 *   - Action-tier strategy cards (Escalate / Mitigate / Monitor / Accept)
 */

type Level = "low" | "medium" | "high";
type ActionTier = "escalate" | "mitigate" | "monitor" | "accept";

const IMPACT_SCORE: Record<Level, number> = { high: 3, medium: 2, low: 1 };
const PROB_SCORE: Record<Level, number> = { high: 3, medium: 2, low: 1 };

const normaliseLevel = (v: string): Level => {
  const x = (v || "").toLowerCase();
  if (x === "high" || x === "medium" || x === "low") return x as Level;
  return "low";
};

const getRiskScore = (impact: Level, probability: Level) =>
  IMPACT_SCORE[impact] * PROB_SCORE[probability];

const getActionTier = (score: number): ActionTier => {
  if (score >= 9) return "escalate";
  if (score >= 6) return "mitigate";
  if (score >= 3) return "monitor";
  return "accept";
};

const ACTION_META: Record<ActionTier, { label: string; color: string }> = {
  escalate: { label: "Escalate", color: "#A04848" },
  mitigate: { label: "Mitigate", color: "#9C7A3A" },
  monitor:  { label: "Monitor",  color: "#3F8D85" },
  accept:   { label: "Accept",   color: "#5F7191" },
};

const ACTION_ORDER: ActionTier[] = ["escalate", "mitigate", "monitor", "accept"];
const IMPACT_ROWS: Level[] = ["high", "medium", "low"];
const PROB_COLS: Level[] = ["low", "medium", "high"];

const cellAction = (impact: Level, prob: Level): ActionTier =>
  getActionTier(IMPACT_SCORE[impact] * PROB_SCORE[prob]);

// Light tint for cell backgrounds (~8% opacity equivalent on white)
const tint = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c * 0.12 + 255 * 0.88);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

export const PDFRiskMatrix = ({ data, themeMode }: { data: RiskMatrixData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const enriched = data.risks.map((r, i) => {
    const impact = normaliseLevel(r.impact);
    const probability = normaliseLevel(r.probability);
    const score = getRiskScore(impact, probability);
    return {
      id: i + 1,
      supplier: r.supplier,
      category: r.category || "Uncategorised",
      impact,
      probability,
      score,
      action: getActionTier(score),
    };
  });

  const total = enriched.length;
  const counts: Record<ActionTier, number> = { escalate: 0, mitigate: 0, monitor: 0, accept: 0 };
  enriched.forEach((r) => { counts[r.action] += 1; });

  const criticalPct = total ? Math.round((counts.escalate / total) * 100) : 0;
  const heroColor =
    criticalPct >= 30 ? ACTION_META.escalate.color
    : criticalPct > 0 ? ACTION_META.mitigate.color
    : ACTION_META.monitor.color;

  const grouped: Record<ActionTier, typeof enriched> = { escalate: [], mitigate: [], monitor: [], accept: [] };
  enriched.forEach((r) => grouped[r.action].push(r));
  ACTION_ORDER.forEach((k) => grouped[k].sort((a, b) => b.score - a.score));

  return (
    <View style={styles.dashboardCard}>
      {/* Header with KPI */}
      <View style={[styles.dashboardHeader, { alignItems: "flex-start" }]}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Risk Matrix</Text>
          <Text style={styles.dashboardSubtitle}>Supplier risk assessment</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: heroColor }}>
            {criticalPct}%
          </Text>
          <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>
            Critical risk
          </Text>
        </View>
      </View>

      {/* Action distribution bar */}
      <View style={{ marginTop: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
          <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>
            Action distribution
          </Text>
          <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>
            {total} risk{total === 1 ? "" : "s"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: colors.surfaceLight }}>
          {ACTION_ORDER.map((a) => {
            const pct = total ? (counts[a] / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <View
                key={a}
                style={{ width: `${pct}%`, backgroundColor: ACTION_META[a].color }}
              />
            );
          })}
        </View>
      </View>

      {/* Two-column: matrix + tier cards */}
      <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
        {/* Matrix */}
        <View style={{ flex: 1, flexDirection: "row" }}>
          {/* Y-axis label */}
          <View style={{ width: 12, justifyContent: "center", alignItems: "center" }}>
            <Text style={{
              fontSize: 7, color: colors.textMuted, fontFamily: "Helvetica-Bold",
              textTransform: "uppercase", letterSpacing: 0.8, transform: "rotate(-90deg)",
            }}>
              Impact
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            {/* 3x3 grid */}
            {IMPACT_ROWS.map((impact, rowIdx) => (
              <View key={impact} style={{ flexDirection: "row", marginBottom: rowIdx < 2 ? 3 : 0 }}>
                {PROB_COLS.map((prob, colIdx) => {
                  const action = cellAction(impact, prob);
                  const meta = ACTION_META[action];
                  const cellRisks = enriched.filter((r) => r.impact === impact && r.probability === prob);
                  return (
                    <View
                      key={`${impact}-${prob}`}
                      style={{
                        flex: 1,
                        height: 38,
                        marginRight: colIdx < 2 ? 3 : 0,
                        borderRadius: 3,
                        borderWidth: 0.5,
                        borderColor: colors.border,
                        backgroundColor: tint(meta.color),
                        flexDirection: "row",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 2,
                      }}
                    >
                      {cellRisks.map((r) => (
                        <View
                          key={r.id}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: meta.color,
                            margin: 1,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#FFFFFF" }}>
                            R{r.id}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            ))}

            {/* X-axis labels */}
            <View style={{ flexDirection: "row", marginTop: 3 }}>
              {PROB_COLS.map((p) => (
                <View key={p} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 7, color: colors.textMuted }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={{
              fontSize: 7, color: colors.textMuted, fontFamily: "Helvetica-Bold",
              textTransform: "uppercase", letterSpacing: 0.8, textAlign: "center", marginTop: 2,
            }}>
              Probability
            </Text>
          </View>
        </View>

        {/* Action-tier strategy cards */}
        <View style={{ width: 150 }}>
          {ACTION_ORDER.map((tier) => {
            const meta = ACTION_META[tier];
            const items = grouped[tier];
            const top = items[0];
            const sharePct = total ? Math.round((items.length / total) * 100) : 0;
            return (
              <View
                key={tier}
                style={{
                  flexDirection: "row",
                  borderWidth: 0.5,
                  borderColor: colors.border,
                  borderRadius: 3,
                  padding: 4,
                  marginBottom: 3,
                  backgroundColor: colors.surfaceLight,
                }}
              >
                <View style={{ width: 2, backgroundColor: meta.color, borderRadius: 1, marginRight: 5 }} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: meta.color }}>
                      {meta.label}
                    </Text>
                    <Text style={{ fontSize: 7, color: meta.color, fontFamily: "Helvetica-Bold" }}>
                      {items.length} - {sharePct}%
                    </Text>
                  </View>
                  {top ? (
                    <Text style={{ fontSize: 7, color: colors.textMuted, marginTop: 1 }}>
                      Top: <Text style={{ color: colors.text }}>{top.supplier.length > 22 ? top.supplier.slice(0, 22) + "..." : top.supplier}</Text> (score {top.score})
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 7, color: colors.textMuted, fontStyle: "italic", marginTop: 1 }}>
                      No risks in this tier
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Priority register */}
      <View style={{ marginTop: 8, borderWidth: 0.5, borderColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
        <View style={{
          flexDirection: "row", justifyContent: "space-between",
          paddingHorizontal: 6, paddingVertical: 3,
          backgroundColor: colors.surfaceLight, borderBottomWidth: 0.5, borderBottomColor: colors.border,
        }}>
          <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>
            Priority register
          </Text>
          <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>
            {total} risk{total === 1 ? "" : "s"}
          </Text>
        </View>
        {ACTION_ORDER.flatMap((tier) => {
          const items = grouped[tier];
          if (items.length === 0) return [];
          const meta = ACTION_META[tier];
          return items.map((r, idx) => (
            <View
              key={`${tier}-${r.id}`}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 6, paddingVertical: 3,
                borderBottomWidth: idx === items.length - 1 && tier === "accept" ? 0 : 0.5,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ width: 2, height: 14, backgroundColor: meta.color, borderRadius: 1, marginRight: 5 }} />
              <View style={{
                width: 14, height: 14, borderRadius: 7,
                borderWidth: 0.5, borderColor: meta.color,
                backgroundColor: tint(meta.color),
                alignItems: "center", justifyContent: "center", marginRight: 5,
              }}>
                <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: meta.color }}>{r.id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: colors.text }}>{r.supplier}</Text>
                <Text style={{ fontSize: 7, color: colors.textMuted, marginTop: 0.5 }}>
                  {r.category} - {r.impact} impact - {r.probability} probability
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: meta.color }}>{r.score}</Text>
                <Text style={{ fontSize: 6, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {meta.label}
                </Text>
              </View>
            </View>
          ));
        })}
      </View>
    </View>
  );
};
