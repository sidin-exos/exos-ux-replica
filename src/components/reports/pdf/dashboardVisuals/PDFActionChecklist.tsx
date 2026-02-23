import { View, Text } from "@react-pdf/renderer";
import { colors, styles } from "./theme";
import type { ActionChecklistData } from "@/lib/dashboard-data-parser";

const defaultTasks = [
  { task: "Confirm scope & stakeholders", status: "Done", priority: "High", owner: "Procurement Lead", color: colors.success },
  { task: "Collect supplier quotes", status: "In Progress", priority: "High", owner: "Category Manager", color: colors.warning },
  { task: "Validate demand forecast", status: "In Progress", priority: "Medium", owner: "Operations", color: colors.warning },
  { task: "Model savings scenarios", status: "To Do", priority: "Medium", owner: "Analyst", color: colors.textMuted },
  { task: "Align legal terms", status: "To Do", priority: "Low", owner: "Legal", color: colors.textMuted },
  { task: "Finalize award recommendation", status: "To Do", priority: "High", owner: "Procurement Lead", color: colors.textMuted },
];

export const PDFActionChecklist = ({ data }: { data?: ActionChecklistData }) => {
  const tasks = data?.actions?.map(a => ({
    task: a.action,
    status: a.status === "done" ? "Done" : a.status === "in-progress" ? "In Progress" : a.status === "blocked" ? "Blocked" : "To Do",
    priority: a.priority.charAt(0).toUpperCase() + a.priority.slice(1),
    owner: a.owner || "Unassigned",
    color: a.status === "done" ? colors.success : a.status === "in-progress" ? colors.warning : colors.textMuted,
  })) || defaultTasks;

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
          <Text style={{ fontSize: 12, fontWeight: 700, color: colors.primary }}>{progressPct}%</Text>
          <Text style={{ fontSize: 6, color: colors.textMuted }}>complete</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ marginTop: 6, marginBottom: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
          <Text style={{ fontSize: 7, color: colors.textMuted }}>
            {stats.done} of {tasks.length} tasks completed
          </Text>
          <Text style={{ fontSize: 7, color: colors.textMuted }}>
            {stats.inProgress} in progress
          </Text>
        </View>
        <View style={{ height: 6, backgroundColor: colors.surfaceLight, borderRadius: 3, overflow: "hidden", flexDirection: "row" }}>
          <View style={{ width: `${tasks.length > 0 ? (stats.done / tasks.length) * 100 : 0}%`, height: 6, backgroundColor: colors.success }} />
          <View style={{ width: `${tasks.length > 0 ? (stats.inProgress / tasks.length) * 100 : 0}%`, height: 6, backgroundColor: colors.warning }} />
        </View>
      </View>

      {/* Task list */}
      <View style={{ marginTop: 4 }}>
        {tasks.map((t, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6, paddingBottom: 6, borderBottomWidth: i < tasks.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: t.color + "30", borderWidth: 2, borderColor: t.color, marginRight: 8, marginTop: 1, justifyContent: "center", alignItems: "center" }}>
              {t.status === "Done" && (
                <Text style={{ fontSize: 8, color: t.color, fontWeight: 700 }}>✓</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8, color: colors.text, fontWeight: t.status === "Done" ? 400 : 500 }}>{t.task}</Text>
              <View style={{ flexDirection: "row", marginTop: 2 }}>
                <Text style={{ fontSize: 6, color: colors.textMuted }}>{t.owner}</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={{ paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2, backgroundColor: t.color + "20" }}>
                <Text style={{ fontSize: 6, color: t.color, fontWeight: 600 }}>{t.status}</Text>
              </View>
              <Text style={{ fontSize: 6, color: colors.textMuted, marginTop: 2 }}>{t.priority}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Done ({stats.done})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>In Progress ({stats.inProgress})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
          <Text style={styles.legendText}>To Do ({stats.todo})</Text>
        </View>
      </View>
    </View>
  );
};
