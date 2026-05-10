import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { TimelineRoadmapData } from "@/lib/dashboard-data-parser";

type PhaseStatus = "completed" | "in-progress" | "upcoming";

export const PDFTimelineRoadmap = ({ data, themeMode }: { data: TimelineRoadmapData; themeMode?: PdfThemeMode }) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const palette = [colors.primary, colors.accent2, colors.stripe4, colors.warning, colors.stripe5, colors.accent4];
  const colorFor = (i: number) => palette[i % palette.length];

  const phases = data.phases.map((p, i) => ({
    name: p.name,
    startWeek: p.startWeek,
    endWeek: p.endWeek,
    status: p.status as PhaseStatus,
    milestones: p.milestones || [],
    color: colorFor(i),
    duration: p.endWeek - p.startWeek + 1,
  }));

  const totalWeeks = data.totalWeeks || phases.reduce((m, p) => Math.max(m, p.endWeek), 0) || 1;
  const completedCount = phases.filter(p => p.status === "completed").length;
  const activePhase = phases.find(p => p.status === "in-progress");
  const score = phases.reduce((s, p) => s + (p.status === "completed" ? 1 : p.status === "in-progress" ? 0.5 : 0), 0);
  const progressPct = phases.length ? Math.round((score / phases.length) * 100) : 0;
  const heroColor = palette[0];

  const counts = {
    completed: phases.filter(p => p.status === "completed").length,
    "in-progress": phases.filter(p => p.status === "in-progress").length,
    upcoming: phases.filter(p => p.status === "upcoming").length,
  };

  const weekMarkers = [1, Math.floor(totalWeeks / 4), Math.floor(totalWeeks / 2), Math.floor((3 * totalWeeks) / 4), totalWeeks];
  const statusLabel: Record<PhaseStatus, string> = { completed: "Done", "in-progress": "Active", upcoming: "Planned" };

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Project Timeline</Text>
          <Text style={styles.dashboardSubtitle}>Implementation roadmap</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 15, fontWeight: 700, color: heroColor }}>{progressPct}%</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>overall progress</Text>
        </View>
      </View>

      {/* Phase progress bar */}
      <View style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
          <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>Phase progress</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase" }}>
            {completedCount}/{phases.length} complete · {totalWeeks} weeks
          </Text>
        </View>
        <View style={{ flexDirection: "row", height: 6, backgroundColor: colors.surfaceLight, overflow: "hidden" }}>
          {phases.map((p, i) => (
            <View
              key={i}
              style={{
                width: `${100 / phases.length}%`,
                backgroundColor: p.color,
                opacity: p.status === "completed" ? 1 : p.status === "in-progress" ? 0.6 : 0.25,
              }}
            />
          ))}
        </View>
      </View>

      {/* Two-column: gantt + side breakdown */}
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          {/* Week scale */}
          <View style={{ flexDirection: "row", marginLeft: 80, height: 10, marginBottom: 4 }}>
            {weekMarkers.map(w => (
              <View
                key={w}
                style={{
                  position: "absolute",
                  left: `${((w - 1) / Math.max(1, totalWeeks - 1)) * 100}%`,
                }}
              >
                <Text style={{ fontSize: 7, color: colors.textMuted }}>W{w}</Text>
              </View>
            ))}
          </View>

          {phases.map((phase, i) => {
            const startPct = ((phase.startWeek - 1) / Math.max(1, totalWeeks - 1)) * 100;
            const widthPct = ((phase.endWeek - phase.startWeek) / Math.max(1, totalWeeks - 1)) * 100;
            const opacity = phase.status === "completed" ? 1 : phase.status === "in-progress" ? 0.85 : 0.4;
            const isActive = phase.status === "in-progress";
            return (
              <View
                key={i}
                style={{
                  borderWidth: isActive ? 1.5 : 1,
                  borderColor: isActive ? phase.color : colors.border,
                  backgroundColor: isActive ? phase.color + "10" : "transparent",
                  padding: 5,
                  marginBottom: 4,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 2, backgroundColor: phase.color, marginRight: 5, alignSelf: "stretch" }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 10, fontWeight: 600, color: colors.text }}>{phase.name}</Text>
                      {isActive && (
                        <View style={{ marginLeft: 5, paddingHorizontal: 4, paddingVertical: 1, backgroundColor: colors.success }}>
                          <Text style={{ fontSize: 7, color: colors.textOnPrimary, fontWeight: 700 }}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 1 }}>
                      {statusLabel[phase.status]} · W{phase.startWeek}–W{phase.endWeek} · {phase.duration} wks
                    </Text>
                  </View>
                </View>

                {/* Gantt bar with proper position */}
                <View style={{ height: 5, backgroundColor: colors.surfaceLight, marginTop: 4, position: "relative" }}>
                  <View
                    style={{
                      position: "absolute",
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                      height: 5,
                      backgroundColor: phase.color,
                      opacity,
                    }}
                  />
                </View>

                {phase.milestones.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4, paddingTop: 3, borderTopWidth: 0.5, borderTopColor: colors.border }}>
                    {phase.milestones.map((m, mi) => (
                      <View key={mi} style={{ flexDirection: "row", alignItems: "center", marginRight: 8, marginBottom: 1 }}>
                        <View style={{ width: 4, height: 4, backgroundColor: phase.color, marginRight: 3 }} />
                        <Text style={{ fontSize: 8, color: colors.textMuted }}>{m}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Side status panel */}
        <View style={{ width: 130, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceLight, padding: 7 }}>
          <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", marginBottom: 5 }}>Status summary</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
            <Text style={{ fontSize: 9, color: colors.textMuted }}>Total phases</Text>
            <Text style={{ fontSize: 9, fontWeight: 700, color: colors.text }}>{phases.length}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
            <Text style={{ fontSize: 9, color: colors.textMuted }}>Duration</Text>
            <Text style={{ fontSize: 9, fontWeight: 700, color: colors.text }}>{totalWeeks} wks</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ fontSize: 9, fontWeight: 600, color: colors.text }}>Complete</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: heroColor }}>{progressPct}%</Text>
          </View>
          <View style={{ paddingTop: 5, marginTop: 5, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "uppercase", marginBottom: 3 }}>Phases</Text>
            {(["completed", "in-progress", "upcoming"] as PhaseStatus[]).map(s => (
              <View key={s} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={{ fontSize: 8, color: colors.textMuted, textTransform: "capitalize" }}>{s.replace("-", " ")}</Text>
                <Text style={{ fontSize: 8, fontWeight: 700, color: colors.text }}>{counts[s]}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {activePhase && (
        <View style={{ marginTop: 8, padding: 5, borderWidth: 1, borderColor: colors.success, backgroundColor: colors.success + "10" }}>
          <Text style={{ fontSize: 9, color: colors.text }}>
            <Text style={{ color: colors.success, fontWeight: 700 }}>Currently active: </Text>
            {activePhase.name} — running W{activePhase.startWeek}–W{activePhase.endWeek}.
          </Text>
        </View>
      )}
    </View>
  );
};
