import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { TimelineRoadmapData } from "@/lib/dashboard-data-parser";

const mapStatus = (s: string): string => {
  if (s === "completed") return "complete";
  if (s === "in-progress") return "active";
  return s;
};

export const PDFTimelineRoadmap = ({ data, themeMode }: { data: TimelineRoadmapData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const statusColorMap: Record<string, string> = {
    complete: colors.primary,
    completed: colors.primary,
    active: colors.primaryDark,
    "in-progress": colors.warning,
    upcoming: colors.success,
  };

  const phases = data.phases.map(p => {
    const status = mapStatus(p.status);
    const duration = p.endWeek - p.startWeek + 1;
    return {
      name: p.name,
      weeks: `Week ${p.startWeek}-${p.endWeek}`,
      duration,
      milestone: p.milestones?.[0] || "",
      color: statusColorMap[status] || colors.textMuted,
      status,
    };
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
          <Text style={{ fontSize: 13, fontWeight: 700, color: currentPhase.color }}>{currentPhase.name}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>current phase</Text>
        </View>
      </View>

      <View style={{ marginTop: 10, marginBottom: 6 }}>
        <View style={{ flexDirection: "row", marginBottom: 4, marginLeft: 80 }}>
          {Array.from({ length: totalWeeks }).map((_, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>W{i + 1}</Text>
            </View>
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
                {phase.status === "complete" && (
                  <Text style={{ position: "absolute", left: `${startPct + widthPct / 2 - 2}%`, top: 3, fontSize: 10, color: colors.background, fontWeight: 700 }}>✓</Text>
                )}
                {phase.status === "active" && (
                  <Text style={{ position: "absolute", left: `${startPct + widthPct / 2 - 2}%`, top: 3, fontSize: 10, color: colors.background, fontWeight: 700 }}>●</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.matrixContainer}>
        <View style={[styles.matrixRow, styles.matrixHeader]}>
          <Text style={[styles.matrixCell, styles.matrixCellLeft, { flex: 1.2 }]}>Phase</Text>
          <Text style={styles.matrixCell}>Duration</Text>
          <Text style={[styles.matrixCell, { flex: 1.5 }]}>Milestone</Text>
          <Text style={styles.matrixCell}>Status</Text>
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
                <Text style={{ fontSize: 8, color: phase.status === "complete" ? colors.success : phase.status === "active" ? colors.warning : colors.textMuted, textTransform: "capitalize" }}>
                  {phase.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Complete</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>Active</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
          <Text style={styles.legendText}>Upcoming</Text>
        </View>
      </View>
    </View>
  );
};
