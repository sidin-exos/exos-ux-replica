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
} from "./types.ts";

// ── Helpers ──

const formatAmount = (value: number, currency: string = "$"): string => {
  if (value >= 1_000_000) return `${currency} ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${currency} ${(value / 1000).toFixed(0)}K`;
  return `${currency} ${value}`;
};

const formatCurrency = (value: number, currency: string = "$"): string => {
  if (value >= 1000) return `${currency} ${(value / 1000).toFixed(0)}K`;
  return `${currency} ${value}`;
};

// ══════════════════════════════════════════
// 1. Cost Waterfall
// ══════════════════════════════════════════

export const PDFCostWaterfall = ({ data, themeMode }: { data: CostWaterfallData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const currency = data.currency || "$";
  if (!data.components?.length) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>Cost Breakdown: insufficient data</Text></View>;
  const total = data.components.reduce((s, c) => s + Math.abs(c.value), 0) || 1;
  const costBreakdownData = data.components.map(c => ({
    name: c.name,
    value: Math.round((Math.abs(c.value) / total) * 100),
    amount: formatAmount(Math.abs(c.value), currency),
    color: c.type === "reduction" ? colors.success : colors.primary,
  }));
  const totalRaw = data.components.filter(c => c.type === "cost").reduce((s, c) => s + c.value, 0);
  const savingsRaw = data.components.filter(c => c.type === "reduction").reduce((s, c) => s + Math.abs(c.value), 0);
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
          <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: colors.text }}>{totalAmount}</Text>
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
            <View style={{ width: 68, alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, color: colors.text, fontFamily: "Helvetica-Bold" }}>{item.amount}</Text>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>{item.value}%</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}><Text style={styles.statLabel}>Total Cost</Text><Text style={styles.statValue}>{totalAmount}</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Savings Opportunity</Text><Text style={[styles.statValue, { color: colors.primary }]}>{savingsOpportunity}</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Target Margin</Text><Text style={styles.statValue}>5-7%</Text></View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Cost Component</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Savings / Reduction</Text></View>
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
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: colors.primary }}>{winner.name}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>recommended</Text>
        </View>
      </View>
      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Criteria</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Wt%</Text>
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
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, fontFamily: "Helvetica-Bold", fontSize: 10 }]}>Weighted Score</Text>
          <Text style={[styles.matrixCell, { fontFamily: "Helvetica-Bold" }]}>100%</Text>
          {matrixOptions.map((opt, i) => (
            <Text key={i} style={[styles.matrixCell, { fontFamily: "Helvetica-Bold", fontSize: 11, color: opt.weighted === winner.weighted ? colors.primary : colors.text }]}>{opt.weighted}</Text>
          ))}
        </View>
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
  const variables = data.variables.map(v => {
    const baseCase = v.baseCase || 1;
    const low = Math.round(((v.lowCase - baseCase) / baseCase) * 100);
    const high = Math.round(((v.highCase - baseCase) / baseCase) * 100);
    return { name: v.name, low, high, baseValue: v.unit ? `${v.baseCase} ${v.unit}` : String(v.baseCase) };
  });
  const maxImpact = Math.max(1, ...variables.map(v => Math.max(Math.abs(v.low), Math.abs(v.high))));
  const scale = 40 / maxImpact;

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Sensitivity Analysis</Text>
          <Text style={styles.dashboardSubtitle}>Tornado chart: impact on total cost</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: colors.primary }}>±{maxImpact}%</Text>
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
        <Text style={{ fontSize: 8, color: colors.textMuted }}>← Decreases Cost</Text>
        <View style={{ width: 20 }} />
        <Text style={{ fontSize: 8, color: colors.textMuted }}>Increases Cost →</Text>
      </View>
      <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}>
          <Text style={{ color: colors.primary, fontFamily: "Helvetica-Bold" }}>Key Driver: </Text>
          Volume and Price changes have the highest impact on total cost. Focus negotiation efforts on volume commitments and unit pricing.
        </Text>
      </View>
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
          <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: colors.primary }}>{progressPct}%</Text>
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
            <View style={{ width: 16, height: 16, backgroundColor: t.statusColor + "30", borderWidth: 2, borderColor: t.statusColor, marginRight: 8, marginTop: 1, justifyContent: "center", alignItems: "center" }}>
              {t.status === "Done" && <Text style={{ fontSize: 9, color: t.statusColor, fontFamily: "Helvetica-Bold" }}>✓</Text>}
              {t.status === "Blocked" && <Text style={{ fontSize: 9, color: t.statusColor, fontFamily: "Helvetica-Bold" }}>✗</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, color: colors.text }}>{t.task}</Text>
              <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 1 }}>{t.owner}</Text>
            </View>
            <View style={{ alignItems: "flex-end", marginLeft: 6 }}>
              <View style={{ paddingHorizontal: 5, paddingVertical: 2, backgroundColor: t.priorityColor, marginBottom: 2 }}>
                <Text style={{ fontSize: 7, color: colors.badgeText, fontFamily: "Helvetica-Bold" }}>{t.priority.toUpperCase()}</Text>
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
    return { name: p.name, weeks: `Week ${p.startWeek}-${p.endWeek}`, duration, milestone: p.milestones?.[0] || "", color: statusColorMap[status] || colors.textMuted, status };
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
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: currentPhase.color }}>{currentPhase.name}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>current phase</Text>
        </View>
      </View>
      <View style={{ marginTop: 10, marginBottom: 6 }}>
        <View style={{ flexDirection: "row", marginBottom: 4, marginLeft: 80 }}>
          {Array.from({ length: totalWeeks }).map((_, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center" }}><Text style={{ fontSize: 8, color: colors.textMuted }}>W{i + 1}</Text></View>
          ))}
        </View>
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
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.2, color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Phase</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Duration</Text>
          <Text style={[styles.matrixCell, { flex: 1.5, color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Milestone</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Status</Text>
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
          {criticalCount > 0 && <View style={{ backgroundColor: colors.destructive, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText }}>{criticalCount} Critical</Text></View>}
          {highCount > 0 && <View style={{ backgroundColor: colors.warning, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText }}>{highCount} High</Text></View>}
        </View>
      </View>
      <View style={{ marginTop: 8, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
        <View style={{ flexDirection: "row", backgroundColor: colors.primary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 8 }}>
          <View style={{ width: "18%" }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText, textTransform: "uppercase" }}>Severity</Text></View>
          <View style={{ width: "38%" }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText, textTransform: "uppercase" }}>Risk Item</Text></View>
          <View style={{ width: "14%", alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText, textTransform: "uppercase" }}>Impact</Text></View>
          <View style={{ width: "14%", alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText, textTransform: "uppercase" }}>Prob</Text></View>
          <View style={{ width: "16%", alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText, textTransform: "uppercase" }}>Score</Text></View>
        </View>
        {sortedRisks.map((risk, i) => {
          const score = getRiskScore(risk.impact, risk.probability);
          const severity = getRiskSeverity(score, colors);
          return (
            <View key={risk.id} style={{ flexDirection: "row", borderBottomWidth: i === sortedRisks.length - 1 ? 0 : 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 8, alignItems: "center", backgroundColor: i % 2 === 1 ? colors.surface : colors.background }}>
              <View style={{ width: "18%", alignItems: "center" }}><View style={{ backgroundColor: severity.bgColor, paddingHorizontal: 6, paddingVertical: 2, minWidth: 48, alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: severity.color }}>{severity.label}</Text></View></View>
              <View style={{ width: "38%" }}><Text style={{ fontSize: 10, color: colors.text }}>{risk.name}</Text><Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 1 }}>{risk.category}</Text></View>
              <View style={{ width: "14%", alignItems: "center" }}><Text style={{ fontSize: 10, color: colors.text, fontFamily: "Helvetica-Bold" }}>{risk.impact}</Text></View>
              <View style={{ width: "14%", alignItems: "center" }}><Text style={{ fontSize: 10, color: colors.text, fontFamily: "Helvetica-Bold" }}>{risk.probability}</Text></View>
              <View style={{ width: "16%", alignItems: "center" }}><Text style={{ fontSize: 10, color: colors.text, fontFamily: "Helvetica-Bold" }}>{score}</Text></View>
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
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.destructive }]} /><Text style={styles.legendText}>Critical (≥16)</Text></View>
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
        <Text style={[styles.quadrantLabel, { color: info.color, fontFamily: "Helvetica-Bold" }]}>{info.label}</Text>
        <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>{quadrantItems.length} items</Text>
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
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: colors.destructive }}>{items.filter(i => i.quadrant === "strategic").length}</Text>
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
        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.text, marginBottom: 4 }}>Recommended Strategies:</Text>
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
  const options = data.options || [];
  if (options.length === 0) return <View style={styles.dashboardCard}><Text style={{ fontSize: 9, color: colors.textMuted, textAlign: "center", padding: 20 }}>TCO Comparison: insufficient data (missing options)</Text></View>;
  const chartData = data.data ? data.data.map(row => { const values = options.map(opt => { const key = ("id" in opt && typeof opt.id === "string") ? opt.id : opt.name; const val = row[key]; return typeof val === "number" ? val : 0; }); return { year: row.year as string, values }; }) : [];
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
          <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: colors.primary }}>{formatCurrency(savings, currency)}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>potential savings</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", marginTop: 6, marginBottom: 10 }}>
        {options.map((opt, i) => (<View key={i} style={{ flexDirection: "row", alignItems: "center", marginRight: 12 }}><View style={{ width: 9, height: 9, backgroundColor: opt.color, marginRight: 4 }} /><Text style={{ fontSize: 9, color: colors.textMuted }}>{opt.name}</Text></View>))}
      </View>
      {chartData.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          {chartData.map((point, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ width: 24, fontSize: 9, color: colors.textMuted }}>{point.year}</Text>
              <View style={{ flex: 1, marginLeft: 6 }}>
                {point.values.map((val, j) => (
                  <View key={j} style={{ flexDirection: "row", alignItems: "center", marginBottom: j < point.values.length - 1 ? 2 : 0 }}>
                    <View style={{ width: `${(val / maxValue) * 100}%`, height: 6, backgroundColor: options[j]?.color || colors.textMuted }} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Option</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>5-Year TCO</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>vs. Best</Text>
        </View>
        {options.map((opt, i) => {
          const diff = opt.totalTCO - lowestTCO.totalTCO;
          return (
            <View key={i} style={[styles.matrixRow, diff === 0 ? { borderLeftWidth: 4, borderLeftColor: colors.success } : {}]}>
              <View style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.5, flexDirection: "row", alignItems: "center" }]}>
                <View style={{ width: 7, height: 7, backgroundColor: opt.color, marginRight: 4 }} />
                <Text style={{ fontSize: 9, color: colors.text }}>{opt.name}</Text>
              </View>
              <Text style={[styles.matrixCell, { fontFamily: "Helvetica-Bold" }]}>{formatCurrency(opt.totalTCO, currency)}</Text>
              <Text style={[styles.matrixCell, { color: diff === 0 ? colors.success : colors.textMuted, fontFamily: diff === 0 ? "Helvetica-Bold" : "Helvetica" }]}>{diff === 0 ? "★ Best" : `+${formatCurrency(diff, currency)}`}</Text>
            </View>
          );
        })}
      </View>
      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}><Text style={{ color: colors.primary, fontFamily: "Helvetica-Bold" }}>Recommendation: </Text>{lowestTCO.name} offers the lowest total cost of ownership</Text>
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
          <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: colors.text }}>{totalUsers}</Text>
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
                  <Text style={{ fontSize: 10, color: colors.text, fontFamily: "Helvetica-Bold" }}>{tier.name}</Text>
                  <Text style={{ fontSize: 9, color: colors.textMuted, marginLeft: 4 }}>({tier.users} users)</Text>
                </View>
                <Text style={{ fontSize: 10, color: colors.text, fontFamily: "Helvetica-Bold" }}>{formatCurrency(tier.totalCost)}</Text>
              </View>
              <View style={{ height: 16, backgroundColor: colors.surfaceLight, overflow: "hidden", position: "relative" }}>
                <View style={{ height: 16, backgroundColor: tier.color, width: `${barWidth}%` }} />
                <Text style={{ position: "absolute", left: 6, top: 3, fontSize: 9, color: colors.background, fontFamily: "Helvetica-Bold" }}>{formatCurrency(tier.costPerUser, data.currency || "$")}/user</Text>
              </View>
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
        <Text style={{ fontSize: 9, color: colors.textMuted }}><Text style={{ color: colors.primary, fontFamily: "Helvetica-Bold" }}>Optimization: </Text>Downgrade underutilized users to lower tiers based on usage patterns</Text>
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
  const getScoreColor = (score: number, otherScore: number): string => { if (score > otherScore) return colors.primary; if (score < otherScore) return colors.textMuted; return colors.text; };
  const scenarioNames = data.scenarios?.slice(0, 2) || [];
  const scA = scenarioNames[0] || { id: "a", name: "Scenario A", color: colors.primary };
  const scB = scenarioNames[1] || { id: "b", name: "Scenario B", color: colors.option2 };
  const criteria = data.radarData ? data.radarData.map(r => { const aVal = typeof r[scA.id] === "number" ? (r[scA.id] as number) : 50; const bVal = typeof r[scB.id] === "number" ? (r[scB.id] as number) : 50; return { name: r.metric as string, weight: 20, a: aVal, b: bVal }; }) : [];
  const equalWeight = criteria.length > 0 ? Math.round(100 / criteria.length) : 20;
  const effectiveCriteria = criteria.map(c => ({ ...c, weight: equalWeight }));
  const weightedA = effectiveCriteria.reduce((sum, c) => sum + (c.a * c.weight / 100), 0).toFixed(1);
  const weightedB = effectiveCriteria.reduce((sum, c) => sum + (c.b * c.weight / 100), 0).toFixed(1);
  const winner = Number(weightedA) >= Number(weightedB) ? { ...scA, weighted: weightedA } : { ...scB, weighted: weightedB };

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Scenario Comparison</Text>
          <Text style={styles.dashboardSubtitle}>Score-by-criterion (0–100)</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: winner.color }}>{winner.name}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>recommended</Text>
        </View>
      </View>
      <View style={{ marginTop: 8, marginBottom: 8 }}>
        {effectiveCriteria.map((c, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={{ fontSize: 9, color: colors.text }}>{c.name}</Text>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>Wt: {c.weight}%</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, height: 9, backgroundColor: colors.surfaceLight, overflow: "hidden" }}><View style={{ width: `${c.a}%`, height: 9, backgroundColor: scA.color }} /></View>
                <Text style={{ width: 22, fontSize: 9, color: getScoreColor(c.a, c.b), textAlign: "right", marginLeft: 4 }}>{c.a}</Text>
              </View>
              <View style={{ width: 16 }} />
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, height: 9, backgroundColor: colors.surfaceLight, overflow: "hidden" }}><View style={{ width: `${c.b}%`, height: 9, backgroundColor: scB.color }} /></View>
                <Text style={{ width: 22, fontSize: 9, color: getScoreColor(c.b, c.a), textAlign: "right", marginLeft: 4 }}>{c.b}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4, color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Metric</Text>
          <View style={[styles.matrixCell, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}><View style={{ width: 7, height: 7, backgroundColor: colors.badgeText, opacity: 0.7, marginRight: 3 }} /><Text style={{ fontSize: 9, color: colors.badgeText }}>{scA.name}</Text></View>
          <View style={[styles.matrixCell, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}><View style={{ width: 7, height: 7, backgroundColor: colors.badgeText, opacity: 0.5, marginRight: 3 }} /><Text style={{ fontSize: 9, color: colors.badgeText }}>{scB.name}</Text></View>
        </View>
        {effectiveCriteria.map((c, i) => (
          <View key={i} style={[styles.matrixRow, i % 2 === 1 ? { backgroundColor: colors.surface } : {}]}>
            <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4 }]}>{c.name}</Text>
            <Text style={[styles.matrixCell, { color: getScoreColor(c.a, c.b), fontFamily: c.a > c.b ? "Helvetica-Bold" : "Helvetica" }]}>{c.a}</Text>
            <Text style={[styles.matrixCell, { color: getScoreColor(c.b, c.a), fontFamily: c.b > c.a ? "Helvetica-Bold" : "Helvetica" }]}>{c.b}</Text>
          </View>
        ))}
        <View style={[styles.matrixRow, { backgroundColor: colors.surfaceLight, borderBottomWidth: 0 }]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.4, fontFamily: "Helvetica-Bold" }]}>Weighted Score</Text>
          <Text style={[styles.matrixCell, { fontFamily: "Helvetica-Bold", color: Number(weightedA) >= Number(weightedB) ? colors.primary : colors.text }]}>{weightedA}</Text>
          <Text style={[styles.matrixCell, { fontFamily: "Helvetica-Bold", color: Number(weightedB) > Number(weightedA) ? colors.primary : colors.text }]}>{weightedB}</Text>
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
  const getTrendSymbol = (trend: string): string => { switch (trend) { case "up": return "▲"; case "down": return "▼"; default: return "►"; } };
  const getTrendColor = (trend: string): string => { switch (trend) { case "up": return colors.success; case "down": return colors.destructive; default: return colors.textMuted; } };
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
          <View style={{ width: "35%" }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText, textTransform: "uppercase" }}>Supplier</Text></View>
          <View style={{ width: "15%", alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText, textTransform: "uppercase" }}>Score</Text></View>
          <View style={{ width: "12%", alignItems: "center" }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText, textTransform: "uppercase" }}>Trend</Text></View>
          <View style={{ width: "18%", alignItems: "flex-end" }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText, textTransform: "uppercase" }}>Spend</Text></View>
          <View style={{ width: "20%", alignItems: "flex-end" }}><Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText, textTransform: "uppercase" }}>Category</Text></View>
        </View>
        {suppliers.map((supplier, i) => (
          <View key={i} style={{ flexDirection: "row", borderBottomWidth: i === suppliers.length - 1 ? 0 : 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 8, alignItems: "center", backgroundColor: i % 2 === 1 ? colors.surface : colors.background }}>
            <View style={{ width: "35%" }}><Text style={{ fontSize: 10, color: colors.text }}>{supplier.name}</Text></View>
            <View style={{ width: "15%", alignItems: "center", flexDirection: "row", justifyContent: "center" }}>
              <View style={{ backgroundColor: getScColor(supplier.score) + "30", paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: getScColor(supplier.score) }}>{supplier.score}</Text>
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
        <View style={styles.statItem}><Text style={styles.statLabel}>Total Spend</Text><Text style={styles.statValue}>{suppliers.length > 0 ? suppliers[0].spend.replace(/[\d.]+/, "") : "$"}—</Text></View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>≥85 Excellent</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>≥70 Good</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.destructive }]} /><Text style={styles.legendText}>&lt;70 At Risk</Text></View>
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
          <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: getScColor(avgScore) }}>{avgScore}</Text>
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
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: item.color }}>{item.score}</Text>
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
        <Text style={{ fontSize: 9, color: colors.textMuted }}><Text style={{ color: colors.destructive, fontFamily: "Helvetica-Bold" }}>Action Required: </Text>{recommendations[0]}</Text>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>≥70 Strong</Text></View>
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
  const keyMetrics = [
    { label: "BATNA Score", value: `${data.batna?.strength || 0}/100` },
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
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: colors.primary }}>{steps.length} Steps</Text>
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
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.badgeText }}>{s.status === "complete" ? "✓" : i + 1}</Text>
                </View>
                {i < steps.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: s.status === "complete" ? colors.success : colors.border, marginTop: 2 }} />}
              </View>
              <View style={{ flex: 1, marginLeft: 8, paddingBottom: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.text }}>{s.label}</Text>
                    <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 1 }}>{s.details}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={{ marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}><Text style={{ color: colors.primary, fontFamily: "Helvetica-Bold" }}>Tip: </Text>Use as a guide; adjust timing for stakeholder constraints and supplier responsiveness.</Text>
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
    const missing = f.status === "complete" ? "-" : f.status === "partial" ? "Data gaps present" : "Data not available";
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
          <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: getScColor(avgQuality) }}>{avgQuality}%</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>avg quality</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        {stats.map((s, i) => (<View key={i} style={styles.statItem}><Text style={styles.statLabel}>{s.label}</Text><Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text></View>))}
      </View>
      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.2, color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Field</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Score</Text>
          <Text style={[styles.matrixCell, { color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Status</Text>
          <Text style={[styles.matrixCell, { flex: 1.5, color: colors.badgeText, fontFamily: "Helvetica-Bold" }]}>Gap</Text>
        </View>
        {fields.map((item, i) => (
          <View key={i} style={[styles.matrixRow, i % 2 === 1 ? { backgroundColor: colors.surface } : {}]}>
            <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.2 }]}>{item.name}</Text>
            <View style={[styles.matrixCell, { alignItems: "center" }]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 22, height: 5, backgroundColor: colors.surfaceLight, marginRight: 4, overflow: "hidden" }}><View style={{ width: `${item.value}%`, height: 5, backgroundColor: getScColor(item.value) }} /></View>
                <Text style={{ fontSize: 9, color: getScColor(item.value), fontFamily: "Helvetica-Bold" }}>{item.value}%</Text>
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
        <Text style={{ fontSize: 9, color: colors.textMuted }}><Text style={{ color: colors.warning, fontFamily: "Helvetica-Bold" }}>Data Gap: </Text>Request missing supplier pricing and clarify renewal terms to improve analysis confidence.</Text>
      </View>
    </View>
  );
};
