import { View, Text } from "npm:@react-pdf/renderer@4";
import { getPdfColors, getPdfStyles, type PdfColorSet } from "./theme.ts";
import type {
  PdfThemeMode,
  CostWaterfallData,
  DecisionMatrixData,
  SensitivityData,
  ActionChecklistData,
  TimelineRoadmapData,
  RiskMatrixData,
  KraljicData,
  TCOComparisonData,
  LicenseTierData,
  ScenarioComparisonData,
  SupplierScorecardData,
  SOWAnalysisData,
  NegotiationPrepData,
  DataQualityData,
  NpvWaterfallData,
  Ifrs16ImpactData,
} from "./types.ts";

// ── Helpers ──

const currencySymbol = (code?: string): string => {
  if (!code) return "$";
  const c = String(code).trim().toUpperCase();
  if (c === "EUR" || c === "€") return "€";
  if (c === "USD" || c === "$") return "$";
  if (c === "GBP" || c === "£") return "£";
  if (c === "JPY" || c === "¥") return "¥";
  if (c === "CHF") return "CHF ";
  // Already a symbol or unknown code → pass through with trailing space if alpha.
  return /^[A-Z]+$/.test(c) ? `${c} ` : c;
};

const formatAmount = (value: number, currency: string = "$", decimals: number = 1): string => {
  const sym = currencySymbol(currency);
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1000) return `${sign}${sym}${(abs / 1000).toFixed(0)}K`;
  const rounded = Math.round(abs * 100) / 100;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `${sign}${sym}${display}`;
};

const formatCurrency = formatAmount;

// ══════════════════════════════════════════
// 1. Cost Waterfall
// ══════════════════════════════════════════

export const PDFCostWaterfall = ({ data, themeMode }: { data: CostWaterfallData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const currency = data.currency || "$";
  if (!data.components?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Cost Breakdown: insufficient data</Text></View>;
  // F9: percentages must be relative to total *cost* base only — including
  // "reduction" rows in the denominator skews the cost share for every line.
  const costBase = data.components.filter(c => c.type === "cost").reduce((s, c) => s + Math.abs(c.value), 0) || 1;
  const costBreakdownData = data.components.map(c => ({
    name: c.name,
    value: Math.round((Math.abs(c.value) / costBase) * 100),
    amount: formatAmount(Math.abs(c.value), currency),
    color: c.type === "reduction" ? colors.success : colors.primary,
  }));
  const totalRaw = data.components.filter(c => c.type === "cost").reduce((s, c) => s + c.value, 0);
  const savingsRaw = data.components.filter(c => c.type === "reduction").reduce((s, c) => s + Math.abs(c.value), 0);
  const hasSavings = savingsRaw > 0;
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
          <Text style={{ fontSize: 15, fontFamily: "Inter", fontWeight: 700, color: colors.text }}>{totalAmount}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>total spend</Text>
        </View>
      </View>
      <View style={styles.barContainer}>
        {costBreakdownData.map((item, i) => (
          <View key={i} style={styles.barRow}>
            <View style={{ flexDirection: "row", alignItems: "center", width: 110 }}>
              <View style={{ width: 7, height: 7, backgroundColor: item.color, marginRight: 5 }} />
              <Text style={{ fontSize: 9, color: colors.text, lineHeight: 1.3 }}>{item.name}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { flex: item.value, backgroundColor: item.color }]} />
              <View style={{ flex: Math.max(0, 100 - item.value) }} />
            </View>
            <View style={{ width: 48, alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, color: colors.text, fontFamily: "Inter", fontWeight: 700 }}>{item.amount}</Text>
            </View>
            <View style={{ width: 32, alignItems: "flex-end" }}>
              <Text style={{ fontSize: 9, color: colors.textMuted }}>{item.value}%</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}><Text style={styles.statLabel}>Total Cost</Text><Text style={styles.statValue}>{totalAmount}</Text></View>
        {hasSavings && (
          <View style={styles.statItem}><Text style={styles.statLabel}>Savings Opportunity</Text><Text style={[styles.statValue, { color: colors.primary }]}>{savingsOpportunity}</Text></View>
        )}
        <View style={styles.statItem}><Text style={styles.statLabel}>Target Margin</Text><Text style={styles.statValue}>5-7%</Text></View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Cost Component</Text></View>
        {hasSavings && (
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Savings / Reduction</Text></View>
        )}
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 2. Decision Matrix
// ══════════════════════════════════════════

const optionColors = (c: PdfColorSet) => [c.primary, c.option2, c.option3, c.warning, c.success];
const getScoreBg = (score: number, c: PdfColorSet): string => {
  if (score >= 5) return c.primary;
  if (score >= 4) return c.primaryDark;
  if (score >= 3) return c.warning;
  return c.destructive;
};

export const PDFDecisionMatrix = ({ data, themeMode }: { data: DecisionMatrixData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const oc = optionColors(colors);
  if (!data.criteria?.length || !data.options?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Decision Matrix: insufficient data</Text></View>;
  const matrixCriteria = data.criteria;
  const matrixOptions = data.options.map((opt, idx) => {
    const weighted = matrixCriteria.reduce((sum, c, ci) => sum + ((opt.scores[ci] || 0) * c.weight) / 5, 0);
    return { name: opt.name, scores: opt.scores, weighted: Math.round(weighted), color: oc[idx % oc.length] };
  });
  const winner = matrixOptions.reduce((max, opt) => opt.weighted > max.weighted ? opt : max, matrixOptions[0]);

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Decision Matrix</Text>
          <Text style={styles.dashboardSubtitle}>Weighted multi-criteria analysis</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontFamily: "Inter", fontWeight: 700, color: colors.primary }}>{winner.name}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>recommended</Text>
        </View>
      </View>
      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Criteria</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Wt%</Text>
          {matrixOptions.map((opt, i) => (
            <View key={i} style={[styles.matrixCell, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
              <View style={{ width: 7, height: 7, backgroundColor: colors.badgeText, opacity: 0.7, marginRight: 3 }} />
              <Text style={{ fontSize: 9, color: colors.badgeText }}>{opt.name}</Text>
            </View>
          ))}
        </View>
        {matrixCriteria.map((criterion, idx) => (
          <View key={idx} style={[styles.matrixRow, idx % 2 === 1 ? { backgroundColor: colors.surface } : {}]}>
            <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5 }]}>{criterion.name}</Text>
            <Text style={styles.matrixCell}>{criterion.weight}%</Text>
            {matrixOptions.map((opt, i) => (
              <View key={i} style={[styles.matrixCell, { alignItems: "center" }]}>
                <View style={[styles.scoreCell, { backgroundColor: getScoreBg(opt.scores[idx] || 0, colors) }]}>
                  <Text style={styles.scoreCellText}>{opt.scores[idx] || 0}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
        <View style={[styles.matrixRow, { borderBottomWidth: 0, backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, fontFamily: "Inter", fontWeight: 700, fontSize: 10 }]}>Weighted Score</Text>
          <Text style={[styles.matrixCell, { fontFamily: "Inter", fontWeight: 700 }]}>100%</Text>
          {matrixOptions.map((opt, i) => (
            <Text key={i} style={[styles.matrixCell, { fontFamily: "Inter", fontWeight: 700, fontSize: 11, color: opt.weighted === winner.weighted ? colors.primary : colors.text }]}>{opt.weighted}</Text>
          ))}
        </View>
      </View>
      {/* Standings */}
      <View style={{ marginTop: 8, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ paddingHorizontal: 6, paddingVertical: 3, backgroundColor: colors.surfaceLight, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 8, fontFamily: "Inter", fontWeight: 700, color: colors.textMuted, textTransform: "uppercase" }}>Standings</Text>
        </View>
        {[...matrixOptions].sort((a, b) => b.weighted - a.weighted).map((opt, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 4, borderBottomWidth: i < matrixOptions.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
            <Text style={{ width: 20, fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: i === 0 ? colors.primary : colors.textMuted }}>#{i + 1}</Text>
            <View style={{ width: 7, height: 7, backgroundColor: opt.color, marginRight: 6 }} />
            <Text style={{ flex: 1, fontSize: 10, color: colors.text, fontFamily: "Inter", fontWeight: i === 0 ? 700 : 400 }}>{opt.name}</Text>
            <Text style={{ fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: i === 0 ? colors.primary : colors.text }}>{opt.weighted}</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>5 = Best</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primaryDark }]} /><Text style={styles.legendText}>4 = Good</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>3 = Average</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.destructive }]} /><Text style={styles.legendText}>1-2 = Poor</Text></View>
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 3. Sensitivity Tornado
// ══════════════════════════════════════════

export const PDFSensitivityAnalysis = ({ data, themeMode }: { data: SensitivityData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  if (!data.variables?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Sensitivity Analysis: insufficient data</Text></View>;
  const baseCaseTotal = (data as { baseCaseTotal?: number }).baseCaseTotal ?? 0;
  const currency = (data as { currency?: string }).currency ?? "EUR";
  const sym = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : `${currency} `;
  const fmtMoney = (n: number) => {
    const v = Math.abs(n);
    return v >= 1_000_000 ? `${sym}${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${sym}${Math.round(v / 1_000)}K` : `${sym}${Math.round(v)}`;
  };
  const variables = data.variables.map(v => {
    const baseCase = v.baseCase || 1;
    const low = Math.round(((v.lowCase - baseCase) / baseCase) * 100);
    const high = Math.round(((v.highCase - baseCase) / baseCase) * 100);
    // For percentage-unit drivers (e.g. wage index =100), show the impact on
    // total spend in € rather than the meaningless "100 %" placeholder.
    let baseValue: string;
    if (v.unit === "%" && baseCaseTotal > 0) {
      baseValue = `Base ${fmtMoney(baseCaseTotal)}`;
    } else if (v.unit === "%") {
      baseValue = `${v.baseCase}%`;
    } else if (!v.unit && Math.abs(v.baseCase) >= 1000) {
      // Unit-less large number → format as money (likely a monetary driver)
      baseValue = `Base ${fmtMoney(v.baseCase)}`;
    } else if (v.unit) {
      baseValue = `${v.baseCase} ${v.unit}`;
    } else {
      baseValue = String(v.baseCase);
    }
    return { name: v.name, low, high, baseValue };
  });
  const maxImpact = Math.max(1, ...variables.map(v => Math.max(Math.abs(v.low), Math.abs(v.high))));
  const scale = 40 / maxImpact;
  const favorablePctSum = variables.reduce((s, v) => s + Math.abs(Math.min(v.low, v.high, 0)), 0);
  const unfavorablePctSum = variables.reduce((s, v) => s + Math.max(v.low, v.high, 0), 0);
  const bestCase = baseCaseTotal > 0 ? baseCaseTotal * (1 - favorablePctSum / 100) : 0;
  const worstCase = baseCaseTotal > 0 ? baseCaseTotal * (1 + unfavorablePctSum / 100) : 0;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Sensitivity Analysis</Text>
          <Text style={styles.dashboardSubtitle}>Tornado chart: impact on total cost</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontFamily: "Inter", fontWeight: 700, color: colors.primary }}>±{maxImpact}%</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>max impact</Text>
        </View>
      </View>
      <View style={{ marginTop: 10 }}>
        {variables.map((v, i) => (
          <View key={i} style={styles.tornadoRow}>
            <View style={{ width: 84 }}>
              <Text style={styles.tornadoLabel}>{v.name}</Text>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>{v.baseValue}</Text>
            </View>
            <View style={styles.tornadoChart}>
              <View style={styles.tornadoLeft}><View style={[styles.tornadoBar, { width: Math.abs(v.low) * scale, backgroundColor: colors.success }]} /></View>
              <View style={styles.tornadoCenter} />
              <View style={styles.tornadoRight}><View style={[styles.tornadoBar, { width: v.high * scale, backgroundColor: colors.destructive }]} /></View>
            </View>
            <View style={{ width: 48, flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 9, color: colors.success }}>{v.low}%</Text>
              <Text style={{ fontSize: 9, color: colors.destructive }}>+{v.high}%</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
        <Text style={{ fontSize: 8, color: colors.success }}>Decreases cost (favorable)</Text>
        <View style={{ width: 20 }} />
        <Text style={{ fontSize: 8, color: colors.destructive }}>Increases cost (unfavorable)</Text>
      </View>
      {(() => {
        const ranked = variables
          .map(v => ({ name: v.name, swing: Math.abs(v.low) + Math.abs(v.high) }))
          .sort((a, b) => b.swing - a.swing);
        const top = ranked.slice(0, 2).map(v => v.name).filter(Boolean);
        if (top.length === 0) return null;
        const driverText = top.length === 1
          ? `${top[0]} has the largest impact on total cost.`
          : `${top[0]} and ${top[1]} have the largest impact on total cost.`;
        return (
          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ fontSize: 9, color: colors.textMuted }}>
              <Text style={{ color: colors.primary, fontFamily: "Inter", fontWeight: 700 }}>Key Driver: </Text>
              {driverText} Focus mitigation and negotiation effort on these variables.
            </Text>
          </View>
        );
      })()}
      {baseCaseTotal > 0 && (
        <View style={{ flexDirection: "row", marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>Best Case</Text>
            <Text style={{ fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: colors.success, marginTop: 2 }}>{fmtMoney(Math.max(0, bestCase))}</Text>
            <Text style={{ fontSize: 7, color: colors.textMuted }}>−{favorablePctSum.toFixed(1)}%</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>Base Case</Text>
            <Text style={{ fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: colors.text, marginTop: 2 }}>{fmtMoney(baseCaseTotal)}</Text>
            <Text style={{ fontSize: 7, color: colors.textMuted }}>reference</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>Worst Case</Text>
            <Text style={{ fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: colors.destructive, marginTop: 2 }}>{fmtMoney(worstCase)}</Text>
            <Text style={{ fontSize: 7, color: colors.textMuted }}>+{unfavorablePctSum.toFixed(1)}%</Text>
          </View>
        </View>
      )}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Cost Reduction</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.destructive }]} /><Text style={styles.legendText}>Cost Increase</Text></View>
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 4. Action Checklist
// ══════════════════════════════════════════

export const PDFActionChecklist = ({ data, themeMode }: { data: ActionChecklistData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const priorityColor = (p: string): string => {
    const lower = p.toLowerCase();
    if (lower === "high") return colors.destructive;
    if (lower === "medium" || lower === "med") return colors.warning;
    return colors.success;
  };
  if (!data.actions?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Action Checklist: insufficient data</Text></View>;
  const tasks = data.actions
    .slice()
    .sort((a, b) => { const order: Record<string, number> = { high: 0, medium: 1, med: 1, low: 2 }; return (order[a.priority?.toLowerCase()] ?? 3) - (order[b.priority?.toLowerCase()] ?? 3); })
    .map(a => ({
      task: a.action,
      status: a.status === "done" ? "Done" : a.status === "in-progress" ? "In Progress" : a.status === "blocked" ? "Blocked" : "To Do",
      priority: a.priority ? (a.priority.charAt(0).toUpperCase() + a.priority.slice(1)) : "Low",
      owner: a.owner || "Unassigned",
      statusColor: a.status === "done" ? colors.success : a.status === "in-progress" ? colors.warning : a.status === "blocked" ? colors.destructive : colors.textMuted,
      priorityColor: priorityColor(a.priority || "low"),
    }));
  const stats = {
    done: tasks.filter(t => t.status === "Done").length,
    inProgress: tasks.filter(t => t.status === "In Progress").length,
    todo: tasks.filter(t => t.status !== "Done" && t.status !== "In Progress").length,
  };
  const progressPct = tasks.length > 0 ? Math.round((stats.done / tasks.length) * 100) : 0;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Action Checklist</Text>
          <Text style={styles.dashboardSubtitle}>Priority tasks & current status</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter", fontWeight: 700, color: colors.primary }}>{progressPct}%</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>complete</Text>
        </View>
      </View>
      <View style={{ marginTop: 6, marginBottom: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
          <Text style={{ fontSize: 9, color: colors.textMuted }}>{stats.done} of {tasks.length} tasks completed</Text>
          <Text style={{ fontSize: 9, color: colors.textMuted }}>{stats.inProgress} in progress</Text>
        </View>
        <View style={{ height: 7, backgroundColor: colors.surfaceLight, overflow: "hidden", flexDirection: "row" }}>
          <View style={{ width: `${tasks.length > 0 ? (stats.done / tasks.length) * 100 : 0}%`, height: 7, backgroundColor: colors.success }} />
          <View style={{ width: `${tasks.length > 0 ? (stats.inProgress / tasks.length) * 100 : 0}%`, height: 7, backgroundColor: colors.warning }} />
        </View>
      </View>
      <View style={{ marginTop: 4 }}>
        {tasks.map((t, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 5, paddingBottom: 5, borderBottomWidth: i < tasks.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
            <View style={{ width: 16, height: 16, backgroundColor: t.status === "Done" ? t.statusColor : (t.status === "In Progress" ? t.statusColor : "transparent"), borderWidth: 1.5, borderColor: t.statusColor, marginRight: 8, marginTop: 1, justifyContent: "center", alignItems: "center" }}>
              {t.status === "Done" && <Text style={{ fontSize: 10, color: colors.background, fontFamily: "Inter", fontWeight: 700, lineHeight: 1 }}>✓</Text>}
              {t.status === "In Progress" && <Text style={{ fontSize: 10, color: colors.background, fontFamily: "Inter", fontWeight: 700, lineHeight: 1 }}>•</Text>}
              {t.status === "Blocked" && <Text style={{ fontSize: 10, color: t.statusColor, fontFamily: "Inter", fontWeight: 700, lineHeight: 1 }}>✗</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, color: colors.text }}>{t.task}</Text>
              <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 1 }}>{t.owner}</Text>
            </View>
            <View style={{ alignItems: "flex-end", marginLeft: 6 }}>
              <View style={{ paddingHorizontal: 5, paddingVertical: 2, backgroundColor: t.priorityColor, marginBottom: 2 }}>
                <Text style={{ fontSize: 7, color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }}>{t.priority.toUpperCase()}</Text>
              </View>
              <View style={{ paddingHorizontal: 4, paddingVertical: 1, backgroundColor: t.statusColor + "25" }}>
                <Text style={{ fontSize: 7, color: t.statusColor }}>{t.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Done ({stats.done})</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>In Progress ({stats.inProgress})</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.destructive }]} /><Text style={styles.legendText}>Blocked</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} /><Text style={styles.legendText}>To Do ({stats.todo})</Text></View>
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 5. Timeline Roadmap
// ══════════════════════════════════════════

const mapStatus = (s: string): string => {
  if (s === "completed") return "complete";
  if (s === "in-progress") return "active";
  return s;
};

export const PDFTimelineRoadmap = ({ data, themeMode }: { data: TimelineRoadmapData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const statusColorMap: Record<string, string> = { complete: colors.primary, completed: colors.primary, active: colors.warning, "in-progress": colors.warning, upcoming: colors.border };
  if (!data.phases?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Timeline: insufficient data</Text></View>;
  const phases = data.phases.map(p => {
    const status = mapStatus(p.status);
    const duration = p.endWeek - p.startWeek + 1;
    const milestoneText = (p.milestones ?? []).filter(Boolean).slice(0, 3).join(" · ");
    return { name: p.name, weeks: `Week ${p.startWeek}-${p.endWeek}`, duration, milestone: milestoneText, color: statusColorMap[status] || colors.textMuted, status };
  });
  const totalWeeks = data.totalWeeks || phases.reduce((sum, p) => sum + p.duration, 0);
  const currentPhase = phases.find(p => p.status === "active") || phases[0];

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Timeline Roadmap</Text>
          <Text style={styles.dashboardSubtitle}>Phases and indicative duration</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontFamily: "Inter", fontWeight: 700, color: currentPhase.color }}>{currentPhase.name}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>current phase</Text>
        </View>
      </View>
      <View style={{ marginTop: 10, marginBottom: 6 }}>
        {(() => {
          // Adaptive ticks: cap at ~12 labels regardless of horizon length so
          // multi-year roadmaps (e.g. S22 156-week / 3-year plans) don't render
          // hundreds of overlapping "W-" labels.
          const MAX_TICKS = 12;
          const tickCount = Math.min(MAX_TICKS, Math.max(1, totalWeeks));
          const useYearLabels = totalWeeks >= 104; // 2+ years → year markers
          const useQuarterLabels = !useYearLabels && totalWeeks > 13; // >1 quarter → quarter markers
          const ticks = Array.from({ length: tickCount }, (_, i) => {
            const weekNum = Math.round(((i + 1) / tickCount) * totalWeeks);
            if (useYearLabels) return `Y${Math.max(1, Math.ceil(weekNum / 52))}`;
            if (useQuarterLabels) return `Q${Math.max(1, Math.ceil(weekNum / 13))}`;
            return `W${weekNum}`;
          });
          // Deduplicate consecutive identical labels (e.g. Y1,Y1,Y1 → Y1,'',''):
          const seen = new Set<string>();
          const labels = ticks.map(t => { if (seen.has(t)) return ""; seen.add(t); return t; });
          return (
            <View style={{ flexDirection: "row", marginBottom: 4, marginLeft: 80 }}>
              {labels.map((label, i) => (
                <View key={i} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 8, color: colors.textMuted }}>{label}</Text>
                </View>
              ))}
            </View>
          );
        })()}
        {phases.map((phase, i) => {
          const startWeek = phases.slice(0, i).reduce((sum, p) => sum + p.duration, 0);
          const startPct = totalWeeks > 0 ? (startWeek / totalWeeks) * 100 : 0;
          const widthPct = totalWeeks > 0 ? (phase.duration / totalWeeks) * 100 : 0;
          return (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ width: 76, fontSize: 10, color: colors.text }}>{phase.name}</Text>
              <View style={{ flex: 1, height: 18, position: "relative" }}>
                <View style={{ position: "absolute", left: 0, right: 0, height: 18, backgroundColor: colors.surfaceLight }} />
                <View style={{ position: "absolute", left: `${startPct}%`, width: `${widthPct}%`, height: 18, backgroundColor: phase.color, opacity: phase.status === "upcoming" ? 0.6 : 1 }} />
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.2, color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Phase</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Duration</Text>
          <Text style={[styles.matrixCell, { flex: 1.5, color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Milestone</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Status</Text>
        </View>
        {phases.map((phase, i) => (
          <View key={i} style={styles.matrixRow}>
            <View style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.2, flexDirection: "row", alignItems: "center" }]}>
              <View style={{ width: 7, height: 7, backgroundColor: phase.color, marginRight: 4 }} />
              <Text style={{ fontSize: 10, color: colors.text }}>{phase.name}</Text>
            </View>
            <Text style={styles.matrixCell}>{phase.weeks}</Text>
            <Text style={[styles.matrixCell, { flex: 1.5 }]}>{phase.milestone}</Text>
            <View style={[styles.matrixCell, { alignItems: "center" }]}>
              <View style={{ paddingHorizontal: 4, paddingVertical: 1, backgroundColor: phase.status === "complete" ? colors.success + "20" : phase.status === "active" ? colors.warning + "20" : colors.surfaceLight }}>
                <Text style={{ fontSize: 8, color: phase.status === "complete" ? colors.success : phase.status === "active" ? colors.warning : colors.textMuted, textTransform: "capitalize" }}>{phase.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Complete</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>Active</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} /><Text style={styles.legendText}>Upcoming</Text></View>
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 6. Risk Matrix
// ══════════════════════════════════════════

const levelToNum = (level: string): number => { if (level === "high") return 5; if (level === "medium") return 3; return 1; };
const getRiskScore = (impact: number, probability: number): number => impact * probability;
const getRiskSeverity = (score: number, c: PdfColorSet) => {
  if (score >= 16) return { label: "Critical", color: c.badgeText, bgColor: c.destructive };
  if (score >= 10) return { label: "High", color: c.badgeText, bgColor: c.warning };
  if (score >= 6) return { label: "Medium", color: c.text, bgColor: c.surfaceLight };
  return { label: "Low", color: c.text, bgColor: c.surfaceLight };
};

export const PDFRiskMatrix = ({ data, themeMode }: { data: RiskMatrixData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  if (!data.risks?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Risk Matrix: insufficient data</Text></View>;
  const risks = data.risks.map((r, idx) => ({ id: `R${idx + 1}`, name: r.supplier, impact: levelToNum(r.impact), probability: levelToNum(r.probability), category: r.category || "Operations" }));
  const sortedRisks = [...risks].sort((a, b) => getRiskScore(b.impact, b.probability) - getRiskScore(a.impact, a.probability));
  const criticalCount = sortedRisks.filter(r => getRiskScore(r.impact, r.probability) >= 16).length;
  const highCount = sortedRisks.filter(r => { const s = getRiskScore(r.impact, r.probability); return s >= 10 && s < 16; }).length;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Risk Assessment Matrix</Text>
          <Text style={styles.dashboardSubtitle}>Impact × Probability analysis</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {criticalCount > 0 && <View style={{ backgroundColor: colors.destructive, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText }}>{criticalCount} Critical</Text></View>}
          {highCount > 0 && <View style={{ backgroundColor: colors.warning, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText }}>{highCount} High</Text></View>}
        </View>
      </View>
      <View style={{ marginTop: 8, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
        <View style={{ flexDirection: "row", backgroundColor: colors.primary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 8 }}>
          <View style={{ width: "18%" }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText, textTransform: "uppercase" }}>Severity</Text></View>
          <View style={{ width: "38%" }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText, textTransform: "uppercase" }}>Risk Item</Text></View>
          <View style={{ width: "14%", alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText, textTransform: "uppercase" }}>Impact</Text></View>
          <View style={{ width: "14%", alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText, textTransform: "uppercase" }}>Prob</Text></View>
          <View style={{ width: "16%", alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText, textTransform: "uppercase" }}>Score</Text></View>
        </View>
        {sortedRisks.map((risk, i) => {
          const score = getRiskScore(risk.impact, risk.probability);
          const severity = getRiskSeverity(score, colors);
          return (
            <View key={risk.id} style={{ flexDirection: "row", borderBottomWidth: i === sortedRisks.length - 1 ? 0 : 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 8, alignItems: "center", backgroundColor: i % 2 === 1 ? colors.surface : colors.background }}>
              <View style={{ width: "18%", alignItems: "center" }}><View style={{ backgroundColor: severity.bgColor, paddingHorizontal: 6, paddingVertical: 2, minWidth: 48, alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: severity.color }}>{severity.label}</Text></View></View>
              <View style={{ width: "38%" }}><Text style={{ fontSize: 10, color: colors.text }}>{risk.name}</Text><Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 1 }}>{risk.category}</Text></View>
              <View style={{ width: "14%", alignItems: "center" }}><Text style={{ fontSize: 10, color: colors.text, fontFamily: "Inter", fontWeight: 700 }}>{risk.impact}</Text></View>
              <View style={{ width: "14%", alignItems: "center" }}><Text style={{ fontSize: 10, color: colors.text, fontFamily: "Inter", fontWeight: 700 }}>{risk.probability}</Text></View>
              <View style={{ width: "16%", alignItems: "center" }}><Text style={{ fontSize: 10, color: colors.text, fontFamily: "Inter", fontWeight: 700 }}>{score}</Text></View>
            </View>
          );
        })}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}><Text style={styles.statLabel}>Total Risks</Text><Text style={styles.statValue}>{sortedRisks.length}</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Avg Score</Text><Text style={[styles.statValue, { color: colors.warning }]}>{sortedRisks.length > 0 ? Math.round(sortedRisks.reduce((sum, r) => sum + getRiskScore(r.impact, r.probability), 0) / sortedRisks.length) : 0}</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Max Score</Text><Text style={[styles.statValue, { color: colors.destructive }]}>{sortedRisks.length > 0 ? Math.max(...sortedRisks.map(r => getRiskScore(r.impact, r.probability))) : 0}</Text></View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.destructive }]} /><Text style={styles.legendText}>Critical (16+)</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>High (10-15)</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.surfaceLight }]} /><Text style={styles.legendText}>Medium/Low (&lt;10)</Text></View>
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 7. Kraljic Quadrant
// ══════════════════════════════════════════

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
  if (!data.items?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Kraljic Matrix: insufficient data</Text></View>;
  const items = data.items.map(item => ({ name: item.name, quadrant: deriveQuadrant(item.supplyRisk, item.businessImpact), x: item.supplyRisk, y: item.businessImpact, spend: item.spend || "" }));

  const renderQuadrant = (quadrant: Quadrant, isLastCol: boolean, isLastRow: boolean) => {
    const info = quadrantInfo[quadrant];
    const quadrantItems = items.filter(i => i.quadrant === quadrant);
    const cellStyles = [styles.quadrantCell, isLastCol && styles.quadrantCellLastCol, isLastRow && styles.quadrantCellLastRow, { backgroundColor: info.color + "15" }].filter(Boolean);
    return (
      <View style={cellStyles}>
        <Text style={[styles.quadrantLabel, { color: info.color, fontFamily: "Inter", fontWeight: 700 }]}>{info.label}</Text>
        <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>{quadrantItems.length} item{quadrantItems.length === 1 ? "" : "s"}</Text>
        {quadrantItems.slice(0, 2).map((item, idx) => (
          <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <View style={{ width: 5, height: 5, backgroundColor: info.color, marginRight: 3 }} />
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
          <Text style={{ fontSize: 13, fontFamily: "Inter", fontWeight: 700, color: colors.destructive }}>{items.filter(i => i.quadrant === "strategic").length}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>strategic items</Text>
        </View>
      </View>
      <View style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 8, color: colors.textMuted, marginBottom: 4, textAlign: "left" }}>Business impact (high)</Text>
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
        <Text style={{ fontSize: 8, color: colors.textMuted, textAlign: "right", marginTop: 4 }}>Supply risk (high)</Text>
      </View>
      <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.text, marginBottom: 4 }}>Recommended Strategies:</Text>
        {Object.entries(quadrantInfo).map(([key, info], i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
            <View style={{ width: 9, height: 9, backgroundColor: info.color, marginRight: 6 }} />
            <Text style={{ fontSize: 9, color: colors.text, width: 60 }}>{info.label}:</Text>
            <Text style={{ fontSize: 9, color: colors.textMuted }}>{info.strategy}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 8. TCO Comparison
// ══════════════════════════════════════════

export const PDFTCOComparison = ({ data, themeMode }: { data: TCOComparisonData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const currency = data.currency || "$";
  const rawOptions = data.options || [];
  if (rawOptions.length === 0) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>TCO Comparison: insufficient data (missing options)</Text></View>;

  // Rank-based palette (matches web): best=teal, mid=amber, worst=plum.
  const PALETTE_BY_RANK = ["#3a8c82", "#a37937", "#a04545", "#5e7187"];
  const ranked = [...rawOptions].sort((a, b) => a.totalTCO - b.totalTCO);
  const colorById = new Map(ranked.map((opt, i) => [(opt as any).id ?? opt.name, PALETTE_BY_RANK[Math.min(i, PALETTE_BY_RANK.length - 1)]]));
  const options = rawOptions.map((opt) => ({ ...opt, color: colorById.get((opt as any).id ?? opt.name) || opt.color }));

  const chartData = data.data ? data.data.map(row => { const values = options.map(opt => { const key = ("id" in opt && typeof (opt as any).id === "string") ? (opt as any).id : opt.name; const val = row[key]; return typeof val === "number" ? val : 0; }); return { year: row.year as string, values }; }) : [];
  const sorted = [...options].sort((a, b) => a.totalTCO - b.totalTCO);
  const lowestTCO = sorted[0];
  const runnerUp = sorted[1];
  const highestTCO = sorted[sorted.length - 1];
  const savings = highestTCO.totalTCO - lowestTCO.totalTCO;
  const maxValue = Math.max(1, ...chartData.flatMap(d => d.values));

  // Crossover detection (matches web)
  const yearOf = (label: string): number => { const m = String(label).match(/(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
  const findCrossover = (): { years: number; months: number } | null => {
    if (!runnerUp || !data.data) return null;
    const aKey: any = (lowestTCO as any).id ?? lowestTCO.name;
    const bKey: any = (runnerUp as any).id ?? runnerUp.name;
    for (let i = 1; i < data.data.length; i++) {
      const prev: any = data.data[i - 1]; const curr: any = data.data[i];
      const prevA = Number(prev[aKey] ?? 0), prevB = Number(prev[bKey] ?? 0);
      const currA = Number(curr[aKey] ?? 0), currB = Number(curr[bKey] ?? 0);
      if (prevA > prevB && currA <= currB) {
        const t = (prevA - prevB) / ((prevA - prevB) - (currA - currB));
        const y0 = yearOf(prev.year), y1 = yearOf(curr.year);
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
    ? `${lowestTCO.name} becomes the cheapest option after ${crossover.years} year${crossover.years === 1 ? "" : "s"}${crossover.months > 0 ? ` and ${crossover.months} month${crossover.months === 1 ? "" : "s"}` : ""}, saving ${formatCurrency(savings, currency)} over ${runnerUp ? runnerUp.name : highestTCO.name} across the full horizon.`
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
          <Text style={{ fontSize: 14, fontFamily: "Inter", fontWeight: 700, color: tealAccent }}>{formatCurrency(savings, currency)}</Text>
          <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>potential savings</Text>
        </View>
      </View>

      {/* Conclusion call-out */}
      <View style={{ borderWidth: 1, borderColor: `${tealAccent}40`, backgroundColor: `${tealAccent}0F`, padding: 6, marginTop: 4, marginBottom: 8 }}>
        <Text style={{ fontSize: 7, color: tealAccent, fontFamily: "Inter", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Conclusion</Text>
        <Text style={{ fontSize: 8.5, color: colors.text, lineHeight: 1.35 }}>{conclusion}</Text>
      </View>

      <View style={{ flexDirection: "row", marginBottom: 10, flexWrap: "wrap" }}>
        {options.map((opt, i) => (<View key={i} style={{ flexDirection: "row", alignItems: "center", marginRight: 12, marginBottom: 2 }}><View style={{ width: 9, height: 9, backgroundColor: opt.color, marginRight: 4 }} /><Text style={{ fontSize: 9, color: colors.textMuted }}>{opt.name}</Text></View>))}
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
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Option</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>5-Year TCO</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>vs. Best</Text>
        </View>
        {options.map((opt, i) => {
          const diff = opt.totalTCO - lowestTCO.totalTCO;
          const isBest = diff === 0;
          return (
            <View key={i} style={styles.matrixRow}>
              <View style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, flexDirection: "row", alignItems: "center" }]}>
                <View style={{ width: 7, height: 7, backgroundColor: opt.color, marginRight: 4 }} />
                <Text style={{ fontSize: 9, color: colors.text }}>{opt.name}</Text>
              </View>
              <Text style={[styles.matrixCell, { fontFamily: "Inter", fontWeight: 700 }]}>{formatCurrency(opt.totalTCO, currency)}</Text>
              <Text style={[styles.matrixCell, { color: isBest ? tealAccent : colors.textMuted, fontFamily: "Inter", fontWeight: isBest ? 700 : 400 }]}>{isBest ? "Best" : `+${formatCurrency(diff, currency)}`}</Text>
            </View>
          );
        })}
      </View>
      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}><Text style={{ color: tealAccent, fontFamily: "Inter", fontWeight: 700 }}>Recommendation: </Text>{lowestTCO.name} offers the lowest total cost of ownership.</Text>
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 9. License Tier
// ══════════════════════════════════════════

export const PDFLicenseTier = ({ data, themeMode }: { data: LicenseTierData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  if (!data.tiers?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>License Distribution: insufficient data</Text></View>;
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
          <Text style={{ fontSize: 15, fontFamily: "Inter", fontWeight: 700, color: colors.text }}>{totalUsers}</Text>
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
                  <Text style={{ fontSize: 10, color: colors.text, fontFamily: "Inter", fontWeight: 700 }}>{tier.name}</Text>
                  <Text style={{ fontSize: 9, color: colors.textMuted, marginLeft: 4 }}>({tier.users} users)</Text>
                </View>
                <Text style={{ fontSize: 10, color: colors.text, fontFamily: "Inter", fontWeight: 700 }}>{formatCurrency(tier.totalCost)}</Text>
              </View>
              <View style={{ height: 10, backgroundColor: colors.surfaceLight, overflow: "hidden" }}>
                <View style={{ height: 10, backgroundColor: tier.color, width: `${barWidth}%` }} />
              </View>
              <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>{formatCurrency(tier.costPerUser, data.currency || "$")}/user</Text>
              {userDiff !== 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                  <View style={{ paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: userDiff > 0 ? colors.primary : colors.warning, marginRight: 4 }}>
                    <Text style={{ fontSize: 8, color: userDiff > 0 ? colors.primary : colors.warning }}>{userDiff > 0 ? `+${userDiff}` : userDiff} users recommended</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: colors.textMuted }}>→ Save {formatCurrency(Math.abs(userDiff) * tier.costPerUser)}/mo</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}><Text style={styles.statLabel}>Current Cost</Text><Text style={styles.statValue}>{formatCurrency(totalCost)}/mo</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Optimized Cost</Text><Text style={styles.statValue}>{formatCurrency(optimizedCost)}/mo</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Potential Savings</Text><Text style={[styles.statValue, { color: colors.primary }]}>{formatCurrency(potentialSavings)}/mo</Text></View>
      </View>
      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}><Text style={{ color: colors.primary, fontFamily: "Inter", fontWeight: 700 }}>Optimization: </Text>Downgrade underutilized users to lower tiers based on usage patterns</Text>
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 10. Scenario Comparison
// ══════════════════════════════════════════

export const PDFScenarioComparison = ({ data, themeMode }: { data: ScenarioComparisonData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const allScenarios = data.scenarios || [];
  const criteria = data.radarData ? data.radarData.map(r => {
    const scores: Record<string, number> = {};
    for (const sc of allScenarios) { scores[sc.id] = typeof r[sc.id] === "number" ? (r[sc.id] as number) : 50; }
    return { name: r.metric as string, scores };
  }) : [];
  // Hide entire card when there's nothing meaningful to show — avoids
  // rendering an empty "Scenario Comparison" header with no rows.
  if (allScenarios.length === 0 || criteria.length === 0) {
    return null;
  }

  const equalWeight = criteria.length > 0 ? Math.round(100 / criteria.length) : 20;
  const weightedScores: Record<string, number> = {};
  for (const sc of allScenarios) { weightedScores[sc.id] = criteria.reduce((sum, c) => sum + ((c.scores[sc.id] ?? 50) * equalWeight / 100), 0); }
  const scoreWinner = allScenarios.reduce((best, sc) => (weightedScores[sc.id] ?? 0) > (weightedScores[best.id] ?? 0) ? sc : best, allScenarios[0]);
  // Allow upstream extractor to force the recommended scenario so the page-3
  // badge stays in lockstep with the Executive-Summary CFO verdict.
  const ovr = (data as { recommendedOverride?: { id?: string; name?: string } }).recommendedOverride;
  const winnerId = (ovr?.id && allScenarios.find(s => s.id === ovr.id))
    ?? (ovr?.name && allScenarios.find(s => s.name === ovr.name))
    ?? scoreWinner;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Scenario Comparison</Text>
          <Text style={styles.dashboardSubtitle}>Score-by-criterion (0–100)</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontFamily: "Inter", fontWeight: 700, color: winnerId.color }}>{winnerId.name}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>recommended</Text>
        </View>
      </View>
      {allScenarios.length <= 2 && (
        <View style={{ marginTop: 8, marginBottom: 8 }}>
          {criteria.map((c, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={{ fontSize: 9, color: colors.text }}>{c.name}</Text>
                <Text style={{ fontSize: 8, color: colors.textMuted }}>Wt: {equalWeight}%</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {allScenarios.map((sc, si) => (
                  <View key={sc.id} style={{ flex: 1, flexDirection: "row", alignItems: "center", marginLeft: si > 0 ? 16 : 0 }}>
                    <View style={{ flex: 1, height: 9, backgroundColor: colors.surfaceLight, overflow: "hidden" }}><View style={{ width: `${c.scores[sc.id] ?? 50}%`, height: 9, backgroundColor: sc.color }} /></View>
                    <Text style={{ width: 22, fontSize: 9, color: colors.text, textAlign: "right", marginLeft: 4 }}>{c.scores[sc.id] ?? 50}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4, color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Metric</Text>
          {allScenarios.map((sc) => (
            <View key={sc.id} style={[styles.matrixCell, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
              <View style={{ width: 7, height: 7, backgroundColor: sc.color, marginRight: 3 }} />
              <Text style={{ fontSize: 9, color: colors.badgeText }}>{sc.name}</Text>
            </View>
          ))}
        </View>
        {criteria.map((c, i) => {
          const maxScore = Math.max(...allScenarios.map(sc => c.scores[sc.id] ?? 0));
          return (
            <View key={i} style={[styles.matrixRow, i % 2 === 1 ? { backgroundColor: colors.surface } : {}]}>
              <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4 }]}>{c.name}</Text>
              {allScenarios.map((sc) => {
                const val = c.scores[sc.id] ?? 50;
                const isMax = val === maxScore && maxScore > 0;
                return <Text key={sc.id} style={[styles.matrixCell, { color: isMax ? colors.primary : colors.text, fontFamily: "Inter", fontWeight: isMax ? 700 : 400 }]}>{val}</Text>;
              })}
            </View>
          );
        })}
        <View style={[styles.matrixRow, { backgroundColor: colors.surfaceLight, borderBottomWidth: 0 }]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4, fontFamily: "Inter", fontWeight: 700 }]}>Weighted Score</Text>
          {allScenarios.map((sc) => (
            <Text key={sc.id} style={[styles.matrixCell, { fontFamily: "Inter", fontWeight: 700, color: sc.id === winnerId.id ? colors.primary : colors.text }]}>{(weightedScores[sc.id] ?? 0).toFixed(1)}</Text>
          ))}
        </View>
      </View>
      <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Higher score wins per criterion</Text></View></View>
    </View>
  );
};

// ══════════════════════════════════════════
// 11. Supplier Scorecard
// ══════════════════════════════════════════

export const PDFSupplierScorecard = ({ data, themeMode }: { data: SupplierScorecardData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const getScColor = (score: number): string => { if (score >= 85) return colors.success; if (score >= 70) return colors.warning; return colors.destructive; };
  const getTrendSymbol = (trend: string): string => { switch (trend) { case "up": return "▲"; case "down": return "▼"; default: return "—"; } };
  const getTrendColor = (trend: string): string => { switch (trend) { case "up": return colors.success; case "down": return colors.destructive; default: return colors.textMuted; } };
  const parseSpend = (s: string): number => {
    if (!s) return 0;
    const m = String(s).replace(/[,\s]/g, "").match(/([\d.]+)\s*([kmbKMB]?)/);
    if (!m) return 0;
    const n = parseFloat(m[1]);
    const mult = ({ k: 1e3, m: 1e6, b: 1e9 } as Record<string, number>)[m[2].toLowerCase()] || 1;
    return n * mult;
  };
  const formatSpend = (n: number, sym: string): string => {
    if (n >= 1e9) return `${sym}${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${sym}${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${sym}${(n / 1e3).toFixed(0)}k`;
    return `${sym}${Math.round(n)}`;
  };
  if (!data.suppliers?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Supplier Scorecard: insufficient data</Text></View>;
  const suppliers = data.suppliers.map(s => ({ name: s.name, score: s.score, trend: s.trend, spend: s.spend, category: "General" }));
  const avgScore = suppliers.length > 0 ? Math.round(suppliers.reduce((sum, s) => sum + s.score, 0) / suppliers.length) : 0;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Supplier Scorecard</Text>
          <Text style={styles.dashboardSubtitle}>Performance rankings & spend analysis</Text>
        </View>
        <Text style={{ fontSize: 9, color: colors.textMuted }}>{suppliers.length} suppliers</Text>
      </View>
      <View style={{ marginTop: 8, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
        <View style={{ flexDirection: "row", backgroundColor: colors.primary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 8 }}>
          <View style={{ width: "35%" }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText, textTransform: "uppercase" }}>Supplier</Text></View>
          <View style={{ width: "15%", alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText, textTransform: "uppercase" }}>Score</Text></View>
          <View style={{ width: "12%", alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText, textTransform: "uppercase" }}>Trend</Text></View>
          <View style={{ width: "18%", alignItems: "flex-end" }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText, textTransform: "uppercase" }}>Spend</Text></View>
          <View style={{ width: "20%", alignItems: "flex-end" }}><Text style={{ fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText, textTransform: "uppercase" }}>Category</Text></View>
        </View>
        {suppliers.map((supplier, i) => (
          <View key={i} style={{ flexDirection: "row", borderBottomWidth: i === suppliers.length - 1 ? 0 : 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 8, alignItems: "center", backgroundColor: i % 2 === 1 ? colors.surface : colors.background }}>
            <View style={{ width: "35%" }}><Text style={{ fontSize: 10, color: colors.text }}>{supplier.name}</Text></View>
            <View style={{ width: "15%", alignItems: "center", flexDirection: "row", justifyContent: "center" }}>
              <View style={{ backgroundColor: getScColor(supplier.score) + "30", paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: getScColor(supplier.score) }}>{supplier.score}</Text>
              </View>
            </View>
            <View style={{ width: "12%", alignItems: "center" }}><Text style={{ fontSize: 11, color: getTrendColor(supplier.trend) }}>{getTrendSymbol(supplier.trend)}</Text></View>
            <View style={{ width: "18%", alignItems: "flex-end" }}><Text style={{ fontSize: 10, color: colors.text, textAlign: "right" }}>{supplier.spend}</Text></View>
            <View style={{ width: "20%", alignItems: "flex-end" }}><Text style={{ fontSize: 9, color: colors.textMuted }}>{supplier.category}</Text></View>
          </View>
        ))}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}><Text style={styles.statLabel}>Avg Score</Text><Text style={[styles.statValue, { color: colors.success }]}>{avgScore}</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Above Target</Text><Text style={[styles.statValue, { color: colors.primary }]}>{suppliers.filter(s => s.score >= 75).length}/{suppliers.length}</Text></View>
        {(() => {
          const sym = suppliers.length > 0 ? (String(suppliers[0].spend).match(/^[^\d.\s,]+/)?.[0] || "$") : "$";
          const total = suppliers.reduce((sum, s) => sum + parseSpend(String(s.spend)), 0);
          return <View style={styles.statItem}><Text style={styles.statLabel}>Total Spend</Text><Text style={styles.statValue}>{formatSpend(total, sym)}</Text></View>;
        })()}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>85+ Excellent</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>70-84 Good</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.destructive }]} /><Text style={styles.legendText}>Below 70 At Risk</Text></View>
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 12. SOW Analysis
// ══════════════════════════════════════════

export const PDFSOWAnalysis = ({ data, themeMode }: { data: SOWAnalysisData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const getScColor = (score: number): string => { if (score >= 70) return colors.success; if (score >= 60) return colors.warning; return colors.destructive; };
  if (!data.sections?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>SOW Analysis: insufficient data</Text></View>;
  const clauses = data.sections.map(s => {
    const label = s.status === "complete" ? "Strong" : s.status === "partial" ? "Adequate" : "Weak";
    const risk = s.status === "complete" ? "Low" : s.status === "partial" ? "Medium" : "High";
    const score = s.status === "complete" ? 80 : s.status === "partial" ? 65 : 45;
    return { name: s.name, score, status: label, risk, color: s.status === "complete" ? colors.success : s.status === "partial" ? colors.warning : colors.destructive };
  });
  const avgScore = data.clarity || (clauses.length > 0 ? Math.round(clauses.reduce((sum, c) => sum + c.score, 0) / clauses.length) : 0);
  const highRiskCount = clauses.filter(c => c.risk === "High").length;
  const recommendations = data.recommendations || ["Review high-risk clauses before signing."];

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>SOW Analysis</Text>
          <Text style={styles.dashboardSubtitle}>Clause coverage score (0–100)</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter", fontWeight: 700, color: getScColor(avgScore) }}>{avgScore}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>avg score</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}><Text style={styles.statLabel}>Clauses Reviewed</Text><Text style={styles.statValue}>{clauses.length}</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>High Risk Items</Text><Text style={[styles.statValue, { color: colors.destructive }]}>{highRiskCount}</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Overall Status</Text><Text style={[styles.statValue, { color: avgScore >= 70 ? colors.success : colors.warning }]}>{avgScore >= 70 ? "Good" : "Needs Review"}</Text></View>
      </View>
      <View style={styles.barContainer}>
        {clauses.map((item, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 7, height: 7, backgroundColor: item.color, marginRight: 4 }} />
                <Text style={{ fontSize: 10, color: colors.text }}>{item.name}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ paddingHorizontal: 3, paddingVertical: 1, backgroundColor: item.color + "20", marginRight: 6 }}><Text style={{ fontSize: 8, color: item.color }}>{item.status}</Text></View>
                <Text style={{ fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: item.color }}>{item.score}</Text>
              </View>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { flex: item.score, backgroundColor: item.color }]} />
              <View style={{ flex: Math.max(0, 100 - item.score) }} />
            </View>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}><Text style={{ color: colors.destructive, fontFamily: "Inter", fontWeight: 700 }}>Action Required: </Text>{recommendations[0]}</Text>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>70+ Strong</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>60-69 Adequate</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.destructive }]} /><Text style={styles.legendText}>&lt;60 Weak</Text></View>
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 13. Negotiation Prep
// ══════════════════════════════════════════

export const PDFNegotiationPrep = ({ data, themeMode }: { data: NegotiationPrepData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  if (!data.sequence?.length && !data.leveragePoints?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Negotiation Prep: insufficient data</Text></View>;
  const steps = data.sequence ? data.sequence.map((s, i) => ({ label: s.step, meta: "", details: s.detail, status: i === 0 ? "complete" : i === 1 ? "active" : "upcoming" })) : [];
  const rawStrength = Number(data.batna?.strength ?? 0);
  // Normalize to 0–10 scale: accept inputs in 0–1, 0–5, or 0–10 ranges.
  const strength10 = rawStrength <= 1
    ? Math.round(rawStrength * 10 * 10) / 10
    : rawStrength <= 5
      ? Math.round(rawStrength * 2 * 10) / 10
      : Math.max(0, Math.min(10, Math.round(rawStrength * 10) / 10));
  const keyMetrics = [
    { label: "BATNA Score", value: `${strength10.toFixed(1).replace(/\.0$/, '')}/10` },
    { label: "Leverage", value: data.leveragePoints?.[0]?.point || "—" },
    { label: "Supplier Power", value: data.leveragePoints?.[1]?.point || "—" },
  ];

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Negotiation Prep</Text>
          <Text style={styles.dashboardSubtitle}>Recommended sequencing</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontFamily: "Inter", fontWeight: 700, color: colors.primary }}>{steps.length} Steps</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>to success</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        {keyMetrics.map((m, i) => (<View key={i} style={styles.statItem}><Text style={styles.statLabel}>{m.label}</Text><Text style={styles.statValue}>{m.value}</Text></View>))}
      </View>
      {steps.length > 0 && (
        <View style={{ marginTop: 12 }}>
          {steps.map((s, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 8 }}>
              <View style={{ width: 26, alignItems: "center" }}>
                <View style={{ width: 20, height: 20, backgroundColor: s.status === "complete" ? colors.success : s.status === "active" ? colors.warning : colors.primary, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: colors.badgeText }}>{i + 1}</Text>
                </View>
                {i < steps.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: s.status === "complete" ? colors.success : colors.border, marginTop: 2 }} />}
              </View>
              <View style={{ flex: 1, marginLeft: 8, paddingBottom: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: "Inter", fontWeight: 700, color: colors.text }}>{s.label}</Text>
                    <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 1 }}>{s.details}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={{ marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}><Text style={{ color: colors.primary, fontFamily: "Inter", fontWeight: 700 }}>Tip: </Text>Use as a guide; adjust timing for stakeholder constraints and supplier responsiveness.</Text>
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 14. Data Quality
// ══════════════════════════════════════════

export const PDFDataQuality = ({ data, themeMode }: { data: DataQualityData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const getScColor = (score: number): string => { if (score >= 80) return colors.success; if (score >= 70) return colors.warning; return colors.destructive; };
  if (!data.fields?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Data Quality: insufficient data</Text></View>;
  const fields = data.fields.map(f => {
    const label = f.status === "complete" ? "Complete" : f.status === "partial" ? "Partial" : "Missing";
    const missing = f.status === "complete" ? "-" : f.status === "partial" ? "Additional data would improve results" : "Data not available";
    return { name: f.field, value: f.coverage, status: label, missing };
  });
  const avgQuality = fields.length > 0 ? Math.round(fields.reduce((sum, f) => sum + f.value, 0) / fields.length) : 0;
  const stats = [
    { label: "Coverage", value: `${avgQuality}%`, color: colors.primary },
    { label: "Completeness", value: `${fields.filter(f => f.value >= 80).length}/${fields.length}`, color: colors.warning },
    { label: "Confidence", value: avgQuality >= 75 ? "High" : avgQuality >= 60 ? "Medium" : "Low", color: avgQuality >= 75 ? colors.success : colors.warning },
  ];

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Data Quality</Text>
          <Text style={styles.dashboardSubtitle}>Input coverage and confidence</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter", fontWeight: 700, color: getScColor(avgQuality) }}>{avgQuality}%</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>avg quality</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        {stats.map((s, i) => (<View key={i} style={styles.statItem}><Text style={styles.statLabel}>{s.label}</Text><Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text></View>))}
      </View>
      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.2, color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Field</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Score</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Status</Text>
          <Text style={[styles.matrixCell, { flex: 1.5, color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Gap</Text>
        </View>
        {fields.map((item, i) => (
          <View key={i} style={[styles.matrixRow, i % 2 === 1 ? { backgroundColor: colors.surface } : {}]}>
            <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.2 }]}>{item.name}</Text>
            <View style={[styles.matrixCell, { alignItems: "center" }]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 22, height: 5, backgroundColor: colors.surfaceLight, marginRight: 4, overflow: "hidden" }}><View style={{ width: `${item.value}%`, height: 5, backgroundColor: getScColor(item.value) }} /></View>
                <Text style={{ fontSize: 9, color: getScColor(item.value), fontFamily: "Inter", fontWeight: 700 }}>{item.value}%</Text>
              </View>
            </View>
            <View style={[styles.matrixCell, { alignItems: "center" }]}>
              <View style={{ paddingHorizontal: 4, paddingVertical: 1, backgroundColor: getScColor(item.value) + "20" }}><Text style={{ fontSize: 8, color: getScColor(item.value) }}>{item.status}</Text></View>
            </View>
            <Text style={[styles.matrixCell, { flex: 1.5, fontSize: 9, color: item.missing === "-" ? colors.success : colors.textMuted }]}>{item.missing}</Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}><Text style={{ color: colors.warning, fontFamily: "Inter", fontWeight: 700 }}>Tip: </Text>Adding more input details will strengthen the analysis and increase confidence scores.</Text>
      </View>
    </View>
  );
};

// ══════════════════════════════════════════
// 15. NPV Waterfall (S3 Capex vs Opex)
// ══════════════════════════════════════════

export const PDFNpvWaterfall = ({ data, themeMode }: { data: NpvWaterfallData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const currency = data.currency || "$";
  const options = data.options || [];
  if (options.length === 0) {
    return (
      <View style={styles.dashboardCard}>
        <Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>NPV Waterfall: insufficient data</Text>
      </View>
    );
  }

  // Detect cost-comparison mode: when all NPVs are negative (or zero) we are
  // comparing present value of costs, so "preferred" = least-negative (max),
  // and the alternative we contrast against is the most-negative (min).
  // When NPVs are positive, higher is better as usual.
  const allNonPositive = options.every(o => (o.npv ?? 0) <= 0);
  const preferred = data.preferredOptionId
    ? options.find(o => o.id === data.preferredOptionId) || options[0]
    : options.reduce((best, o) => (o.npv > best.npv ? o : best), options[0]);
  // Alternative = the option furthest from preferred (largest absolute gap),
  // excluding preferred itself. This avoids the collision where preferred
  // also has the min NPV in cost-mode.
  const alternatives = options.filter(o => o.id !== preferred.id);
  const worst = alternatives.length > 0
    ? alternatives.reduce((w, o) => (Math.abs(o.npv - preferred.npv) > Math.abs(w.npv - preferred.npv) ? o : w), alternatives[0])
    : preferred;
  // In cost-mode, "advantage" = how much less negative preferred is vs alternative.
  const npvSpread = allNonPositive
    ? Math.abs(worst.npv) - Math.abs(preferred.npv)
    : preferred.npv - worst.npv;
  

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>NPV Waterfall</Text>
          <Text style={styles.dashboardSubtitle}>Discounted cash-flow comparison{preferred.waccPct ? ` · WACC ${preferred.waccPct}%` : ""}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter", fontWeight: 700, color: colors.primary }}>{formatCurrency(npvSpread, currency)}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>NPV advantage</Text>
        </View>
      </View>

      {/* Per-option component breakdown bars (mirrors web PDFNPVWaterfall) */}
      {(() => {
        const maxBar = Math.max(
          1,
          ...options.flatMap(o => [
            o.capexNominal || 0,
            o.opexNominal || 0,
            o.residualValue || 0,
            Math.abs(o.npv || 0),
          ])
        );
        return (
          <View style={{ marginTop: 6 }}>
            {options.map((opt, i) => {
              const isPreferred = opt.id === preferred.id;
              const components: { label: string; value: number; type: "cost" | "credit" | "result" }[] = [
                ...((opt.capexNominal || 0) > 0
                  ? [{ label: "CAPEX (nominal)", value: opt.capexNominal || 0, type: "cost" as const }]
                  : []),
                ...((opt.opexNominal || 0) > 0
                  ? [{ label: "OPEX (nominal)", value: opt.opexNominal || 0, type: "cost" as const }]
                  : []),
                ...((opt.residualValue || 0) > 0
                  ? [{ label: "Residual value", value: opt.residualValue || 0, type: "credit" as const }]
                  : []),
                { label: "NPV (signed)", value: opt.npv || 0, type: "result" as const },
              ];
              return (
                <View
                  key={i}
                  style={{ borderWidth: 1, borderColor: colors.border, padding: 6, marginBottom: 6 }}
                  wrap={false}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 8, height: 8, backgroundColor: opt.color || colors.primary, marginRight: 4 }} />
                      <Text style={{ fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: colors.text }}>{opt.name}</Text>
                      {isPreferred && (
                        <View style={{ marginLeft: 6, paddingHorizontal: 4, paddingVertical: 1, backgroundColor: colors.primary }}>
                          <Text style={{ fontSize: 7, fontFamily: "Inter", fontWeight: 700, color: colors.textOnPrimary }}>CFO PICK</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: "row" }}>
                      {opt.breakEvenYear != null && (
                        <Text style={{ fontSize: 8, color: colors.textMuted, marginLeft: 8 }}>Break-even Y{opt.breakEvenYear}</Text>
                      )}
                      {opt.ifrsOnBalanceSheet != null && (
                        <Text style={{ fontSize: 8, color: colors.textMuted, marginLeft: 8 }}>
                          {opt.ifrsOnBalanceSheet ? "On balance sheet" : "Off balance sheet"}
                        </Text>
                      )}
                    </View>
                  </View>

                  {components.map((c) => {
                    const width = Math.max(2, (Math.abs(c.value) / maxBar) * 100);
                    const fill =
                      c.type === "credit"
                        ? colors.success
                        : c.type === "result"
                          ? c.value < 0
                            ? colors.destructive
                            : (opt.color || colors.primary)
                          : (opt.color || colors.primary);
                    return (
                      <View key={c.label} style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                        <Text style={{ width: 90, fontSize: 8, color: colors.textMuted }}>{c.label}</Text>
                        <View style={{ flex: 1, height: 7, backgroundColor: colors.surfaceLight, overflow: "hidden" }}>
                          <View style={{ width: `${width}%`, height: 7, backgroundColor: fill, opacity: c.type === "result" ? 1 : 0.75 }} />
                        </View>
                        <Text style={{ width: 64, textAlign: "right", fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: colors.text, marginLeft: 4 }}>
                          {c.type === "credit"
                            ? `−${formatCurrency(Math.abs(c.value), currency, 1)}`
                            : c.type === "result"
                              ? formatCurrency(c.value, currency, 2)
                              : formatCurrency(Math.abs(c.value), currency, 1)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        );
      })()}

      {(data.verdict || data.cashFlowRationale || preferred) && (
        <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={{ fontSize: 9, color: colors.textMuted }}>
            <Text style={{ color: colors.primary, fontFamily: "Inter", fontWeight: 700 }}>CFO recommendation: </Text>
            {(() => {
              const verdictWord = data.verdict ? `${data.verdict} — ` : "";
              const advText = npvSpread !== 0
                ? `${preferred.name} delivers ${formatCurrency(Math.abs(npvSpread), currency)} better present value than ${worst.name}${preferred.waccPct ? ` at ${preferred.waccPct}% WACC` : ""}.`
                : `${preferred.name} is the recommended option.`;
              return `${verdictWord}${advText}${data.cashFlowRationale ? ` ${data.cashFlowRationale}` : ""}`;
            })()}
          </Text>
        </View>
      )}
    </View>
  );
};

// ══════════════════════════════════════════
// 16. IFRS 16 Impact (S3 Capex vs Opex)
// ══════════════════════════════════════════

export const PDFIfrs16Impact = ({ data, themeMode }: { data: Ifrs16ImpactData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const currency = data.currency || "$";
  const options = data.options || [];
  if (options.length === 0) {
    return (
      <View style={styles.dashboardCard}>
        <Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>IFRS 16 Impact: insufficient data</Text>
      </View>
    );
  }

  const onBalCount = options.filter(o => o.onBalanceSheet === true).length;
  const offBalCount = options.filter(o => o.onBalanceSheet === false).length;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>IFRS 16 Impact</Text>
          <Text style={styles.dashboardSubtitle}>Accounting treatment & balance-sheet effect</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontFamily: "Inter", fontWeight: 700, color: colors.text }}>{onBalCount} / {options.length}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>on balance sheet</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}><Text style={styles.statLabel}>On B/S</Text><Text style={[styles.statValue, { color: colors.warning }]}>{onBalCount}</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Off B/S</Text><Text style={[styles.statValue, { color: colors.success }]}>{offBalCount}</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Options</Text><Text style={styles.statValue}>{options.length}</Text></View>
      </View>

      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.3, color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Option</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Treatment</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>RoU Asset</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Lease Liab.</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Inter", fontWeight: 700 }]}>Tax Shield</Text>
        </View>
        {options.map((opt, i) => {
          // Distinguish owned/capitalised assets from true IFRS 16 leases.
          // Owned (capex) = no lease liability and no right-of-use asset.
          const hasLeaseFootprint = (opt.leaseLiability ?? 0) > 0 || (opt.rightOfUseAsset ?? 0) > 0;
          const isOwned = opt.onBalanceSheet === true && !hasLeaseFootprint;
          const treatment = isOwned
            ? "Owned (cap.)"
            : opt.onBalanceSheet === true ? "Lease (On B/S)" : opt.onBalanceSheet === false ? "Off B/S" : "—";
          const treatmentColor = isOwned
            ? colors.primary
            : opt.onBalanceSheet === true ? colors.warning : opt.onBalanceSheet === false ? colors.success : colors.textMuted;
          return (
            <View key={i} style={[styles.matrixRow, i % 2 === 1 ? { backgroundColor: colors.surface } : {}]}>
              <View style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.3, flexDirection: "row", alignItems: "center" }]}>
                <View style={{ width: 7, height: 7, backgroundColor: opt.color || colors.primary, marginRight: 4 }} />
                <Text style={{ fontSize: 9, color: colors.text }}>{opt.name}</Text>
              </View>
              <View style={[styles.matrixCell, { alignItems: "center" }]}>
                <View style={{ paddingHorizontal: 4, paddingVertical: 1, backgroundColor: treatmentColor + "20" }}>
                  <Text style={{ fontSize: 8, color: treatmentColor, fontFamily: "Inter", fontWeight: 700 }}>{treatment}</Text>
                </View>
              </View>
              <Text style={[styles.matrixCell, { fontSize: 9, color: isOwned ? colors.textMuted : colors.text }]}>{isOwned ? "n/a" : opt.rightOfUseAsset != null ? formatCurrency(opt.rightOfUseAsset, currency) : "—"}</Text>
              <Text style={[styles.matrixCell, { fontSize: 9, color: isOwned ? colors.textMuted : colors.text }]}>{isOwned ? "n/a" : opt.leaseLiability != null ? formatCurrency(opt.leaseLiability, currency) : "—"}</Text>
              <Text style={[styles.matrixCell, { fontSize: 9 }]}>{opt.taxShieldValue != null ? formatCurrency(opt.taxShieldValue, currency) : "—"}</Text>
            </View>
          );
        })}
      </View>

      {options.some(o => o.plTreatment) && (
        <View style={{ marginTop: 6 }}>
          {options.filter(o => o.plTreatment).map((o, i) => (
            <Text key={i} style={{ fontSize: 8, color: colors.textMuted, marginBottom: 1 }}>
              <Text style={{ fontFamily: "Inter", fontWeight: 700, color: colors.text }}>{o.name}: </Text>{o.plTreatment}
            </Text>
          ))}
        </View>
      )}

      {data.ifrs16Note && (
        <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={{ fontSize: 9, color: colors.textMuted }}>
            <Text style={{ color: colors.primary, fontFamily: "Inter", fontWeight: 700 }}>IFRS 16 note: </Text>{data.ifrs16Note}
          </Text>
        </View>
      )}
    </View>
  );
};

// ── Wave 1: Savings Realization Funnel (S4) ──
type SavingsRealizationFunnelDataPdf = {
  baselineVerified: boolean;
  cfoAcceptance: 'GREEN' | 'AMBER' | 'RED';
  funnel: Array<{ stage: string; hard: number; soft: number; avoided: number }>;
  hardAnnualised: number | null;
  softAnnualised: number | null;
  avoidedProtected: number | null;
  currency: string;
  lowConfidenceWatermark: boolean;
};

const fmtCur = (v: number | null, cur: string) => {
  if (v == null || !Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${cur}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}${cur}${(abs / 1000).toFixed(0)}K`;
  return `${sign}${cur}${Math.round(abs)}`;
};

export const PDFSavingsRealizationFunnel = ({ data, themeMode }: { data: SavingsRealizationFunnelDataPdf; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const COLOR_HARD = colors.primary;
  const COLOR_SOFT = colors.accent3;
  const COLOR_AVOIDED = colors.textMuted;
  const tone: Record<string, { bg: string; fg: string; label: string }> = {
    GREEN: { bg: `${colors.success}22`, fg: colors.success, label: "CFO-grade — verified baseline + hard P&L impact" },
    AMBER: { bg: `${colors.warning}22`, fg: colors.warning, label: "Conditional — verified baseline but soft / avoided only" },
    RED: { bg: `${colors.destructive}22`, fg: colors.destructive, label: "Not CFO-grade — baseline is estimated, not verified" },
  };
  const acc = tone[data.cfoAcceptance] ?? tone.AMBER;
  const max = Math.max(1, ...data.funnel.map((f) => f.hard + f.soft + f.avoided));
  const ClassCard = ({ title, value, color }: { title: string; value: number | null; color: string }) => (
    <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceLight, padding: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
        <View style={{ width: 6, height: 6, backgroundColor: color, marginRight: 4 }} />
        <Text style={{ fontSize: 8, color: colors.text, fontWeight: 600 }}>{title}</Text>
      </View>
      <Text style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>{fmtCur(value, data.currency)}</Text>
      <Text style={{ fontSize: 7, color: colors.textMuted }}>annualised</Text>
    </View>
  );
  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Savings Realization Funnel</Text>
          <Text style={styles.dashboardSubtitle}>CIPS classification across the savings funnel</Text>
        </View>
        <View style={{ backgroundColor: acc.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
          <Text style={{ fontSize: 7, fontWeight: 700, color: acc.fg }}>CFO {data.cfoAcceptance}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 8, color: colors.textMuted, marginBottom: 8 }}>{acc.label}</Text>
      <View style={{ marginBottom: 10 }}>
        {data.funnel.map((stage) => {
          const total = stage.hard + stage.soft + stage.avoided;
          const widthPct = (total / max) * 100;
          const seg = (val: number, color: string) =>
            val <= 0 || total <= 0 ? null : (
              <View style={{ width: `${(val / total) * 100}%`, backgroundColor: color, height: 12 }} />
            );
          return (
            <View key={stage.stage} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ width: 60, fontSize: 8, color: colors.text }}>{stage.stage}</Text>
              <View style={{ flex: 1, height: 12, backgroundColor: colors.surfaceLight, flexDirection: "row", overflow: "hidden" }}>
                <View style={{ width: `${widthPct}%`, height: 12, flexDirection: "row" }}>
                  {seg(stage.hard, COLOR_HARD)}
                  {seg(stage.soft, COLOR_SOFT)}
                  {seg(stage.avoided, COLOR_AVOIDED)}
                </View>
              </View>
              <Text style={{ width: 60, textAlign: "right", fontSize: 8, color: colors.text, fontWeight: 600, marginLeft: 6 }}>
                {fmtCur(total, data.currency)}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
        {[{ color: COLOR_HARD, label: "Hard" }, { color: COLOR_SOFT, label: "Soft" }, { color: COLOR_AVOIDED, label: "Avoided" }].map((l) => (
          <View key={l.label} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 7, height: 7, backgroundColor: l.color, marginRight: 4 }} />
            <Text style={{ fontSize: 8, color: colors.textMuted }}>{l.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <ClassCard title="Hard" value={data.hardAnnualised} color={COLOR_HARD} />
        <ClassCard title="Soft" value={data.softAnnualised} color={COLOR_SOFT} />
        <ClassCard title="Avoided" value={data.avoidedProtected} color={COLOR_AVOIDED} />
      </View>
    </View>
  );
};

// ── Wave 2: Working Capital & DPO ──
type WorkingCapitalDataPdf = {
  current_weighted_dpo: number | null;
  target_weighted_dpo: number | null;
  working_capital_delta_eur: number | null;
  annual_spend_eur: number | null;
  terms_distribution: Array<{ term_label: string; spend_share_pct: number; supplier_count: number | null }>;
  by_supplier: Array<{ supplier_label: string; category: string | null; payment_terms_days: number; annual_spend: number | null; late_payment_directive_risk: boolean }>;
  early_payment_discount_opportunities: Array<{ supplier_label: string; discount_structure: string; annualised_value: number | null }>;
  currency: string;
};

export const PDFWorkingCapitalDpo = ({ data, themeMode }: { data: WorkingCapitalDataPdf; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const TERM_COLOR: Record<string, string> = {
    "NET 30": colors.primary, "NET 45": colors.accent2, "NET 60": colors.textMuted, "NET 90+": colors.destructive,
  };
  const dpoDelta =
    data.target_weighted_dpo != null && data.current_weighted_dpo != null
      ? data.target_weighted_dpo - data.current_weighted_dpo
      : null;
  const flagged = data.by_supplier.filter((s) => s.late_payment_directive_risk).slice(0, 6);
  const Kpi = ({ label, value, positive }: { label: string; value: string; positive?: boolean }) => (
    <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceLight, padding: 6 }}>
      <Text style={{ fontSize: 7, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: positive ? colors.success : colors.text }}>{value}</Text>
    </View>
  );
  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Working Capital &amp; DPO</Text>
          <Text style={styles.dashboardSubtitle}>Payment terms distribution and working-capital release potential</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
        <Kpi label="Current DPO" value={data.current_weighted_dpo != null ? `${data.current_weighted_dpo.toFixed(0)}d` : "—"} />
        <Kpi label="Target DPO" value={data.target_weighted_dpo != null ? `${data.target_weighted_dpo.toFixed(0)}d` : "—"} />
        <Kpi label="Δ DPO" value={dpoDelta != null ? `${dpoDelta > 0 ? "+" : ""}${dpoDelta.toFixed(0)}d` : "—"} positive={dpoDelta != null && dpoDelta > 0} />
        <Kpi label="WC impact" value={fmtCur(data.working_capital_delta_eur, data.currency)} positive={data.working_capital_delta_eur != null && data.working_capital_delta_eur > 0} />
      </View>
      {data.terms_distribution.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 7, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Spend share by payment terms</Text>
          <View style={{ flexDirection: "row", height: 12, backgroundColor: colors.surfaceLight, overflow: "hidden", marginBottom: 4 }}>
            {data.terms_distribution.map((t) => (
              <View key={t.term_label} style={{ width: `${t.spend_share_pct}%`, height: 12, backgroundColor: TERM_COLOR[t.term_label] ?? colors.textMuted }} />
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {data.terms_distribution.map((t) => (
              <View key={t.term_label} style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 7, height: 7, backgroundColor: TERM_COLOR[t.term_label] ?? colors.textMuted, marginRight: 4 }} />
                <Text style={{ fontSize: 8, color: colors.textMuted }}>{t.term_label} · {t.spend_share_pct.toFixed(0)}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {flagged.length > 0 && (
        <View style={{ borderWidth: 1, borderColor: colors.destructive, backgroundColor: `${colors.destructive}11`, padding: 6 }}>
          <Text style={{ fontSize: 8, fontWeight: 700, color: colors.destructive, marginBottom: 4 }}>Suppliers above 60-day EU Late Payment Directive limit</Text>
          {flagged.map((s) => (
            <View key={s.supplier_label} style={{ flexDirection: "row", paddingVertical: 2 }}>
              <Text style={{ flex: 2, fontSize: 8, color: colors.text }}>{s.supplier_label}</Text>
              <Text style={{ flex: 1.5, fontSize: 8, color: colors.textMuted }}>{s.category ?? "—"}</Text>
              <Text style={{ width: 40, fontSize: 8, color: colors.text, textAlign: "right" }}>{s.payment_terms_days}d</Text>
              <Text style={{ width: 60, fontSize: 8, color: colors.text, textAlign: "right" }}>{fmtCur(s.annual_spend, data.currency)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
