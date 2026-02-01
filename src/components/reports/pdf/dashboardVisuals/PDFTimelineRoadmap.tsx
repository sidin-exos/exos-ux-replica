import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";

const phases = [
  { name: "Discovery", weeks: "Week 1-2", duration: 2, milestone: "Requirements finalized", color: colors.primary, status: "complete" },
  { name: "RFP/RFQ", weeks: "Week 3-5", duration: 3, milestone: "Proposals received", color: colors.primaryDark, status: "active" },
  { name: "Negotiation", weeks: "Week 6-7", duration: 2, milestone: "Terms agreed", color: colors.warning, status: "upcoming" },
  { name: "Award & Onboard", weeks: "Week 8-9", duration: 2, milestone: "Contract signed", color: colors.success, status: "upcoming" },
];

const totalWeeks = phases.reduce((sum, p) => sum + p.duration, 0);
const currentPhase = phases.find(p => p.status === "active") || phases[0];

export const PDFTimelineRoadmap = () => (
  <View style={styles.dashboardCard}>
    <View style={styles.dashboardHeader}>
      <View style={styles.dashboardIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.dashboardTitle}>Timeline Roadmap</Text>
        <Text style={styles.dashboardSubtitle}>Phases and indicative duration</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: currentPhase.color }}>{currentPhase.name}</Text>
        <Text style={{ fontSize: 6, color: colors.textMuted }}>current phase</Text>
      </View>
    </View>

    {/* Gantt-style timeline */}
    <View style={{ marginTop: 10, marginBottom: 6 }}>
      {/* Week headers */}
      <View style={{ flexDirection: "row", marginBottom: 4, marginLeft: 80 }}>
        {Array.from({ length: totalWeeks }).map((_, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 6, color: colors.textMuted }}>W{i + 1}</Text>
          </View>
        ))}
      </View>
      
      {/* Timeline bars */}
      {phases.map((phase, i) => {
        const startWeek = phases.slice(0, i).reduce((sum, p) => sum + p.duration, 0);
        const startPct = (startWeek / totalWeeks) * 100;
        const widthPct = (phase.duration / totalWeeks) * 100;
        
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ width: 76, fontSize: 8, color: colors.text }}>{phase.name}</Text>
            <View style={{ flex: 1, height: 16, position: "relative" }}>
              {/* Background track */}
              <View style={{ position: "absolute", left: 0, right: 0, height: 16, backgroundColor: colors.surfaceLight, borderRadius: 3 }} />
              {/* Phase bar */}
              <View style={{ 
                position: "absolute", 
                left: `${startPct}%`, 
                width: `${widthPct}%`, 
                height: 16, 
                backgroundColor: phase.color,
                borderRadius: 3,
                opacity: phase.status === "upcoming" ? 0.6 : 1
              }} />
              {/* Status indicator */}
              {phase.status === "complete" && (
                <Text style={{ position: "absolute", left: `${startPct + widthPct/2 - 2}%`, top: 3, fontSize: 8, color: colors.background, fontWeight: 700 }}>✓</Text>
              )}
              {phase.status === "active" && (
                <Text style={{ position: "absolute", left: `${startPct + widthPct/2 - 2}%`, top: 3, fontSize: 8, color: colors.background, fontWeight: 700 }}>●</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>

    {/* Phase details table */}
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
            <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: phase.color, marginRight: 4 }} />
            <Text style={{ fontSize: 8, color: colors.text }}>{phase.name}</Text>
          </View>
          <Text style={styles.matrixCell}>{phase.weeks}</Text>
          <Text style={[styles.matrixCell, { flex: 1.5 }]}>{phase.milestone}</Text>
          <View style={[styles.matrixCell, { alignItems: "center" }]}>
            <View style={{ 
              paddingHorizontal: 4, 
              paddingVertical: 1, 
              borderRadius: 2, 
              backgroundColor: phase.status === "complete" ? colors.success + "20" : phase.status === "active" ? colors.warning + "20" : colors.surfaceLight
            }}>
              <Text style={{ 
                fontSize: 6, 
                color: phase.status === "complete" ? colors.success : phase.status === "active" ? colors.warning : colors.textMuted,
                textTransform: "capitalize"
              }}>
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
