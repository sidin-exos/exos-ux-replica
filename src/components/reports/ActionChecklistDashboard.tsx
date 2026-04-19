import { CheckCircle2, Circle, Clock, AlertCircle, AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionChecklistData } from "@/lib/dashboard-data-parser";

type Priority = "critical" | "high" | "medium" | "low";
type Status = "done" | "in-progress" | "pending" | "blocked";

interface ActionItem {
  id: number;
  action: string;
  priority: Priority;
  status: Status;
  owner?: string;
  dueDate?: string;
}

interface ActionChecklistDashboardProps {
  title?: string;
  subtitle?: string;
  actions?: ActionItem[];
  parsedData?: ActionChecklistData;
}

const defaultActions: ActionItem[] = [
  { id: 1, action: "Finalise supplier shortlist based on RFP responses", priority: "critical", status: "done", owner: "Procurement Lead", dueDate: "Completed" },
  { id: 2, action: "Schedule negotiation meetings with top 3 vendors", priority: "critical", status: "in-progress", owner: "Category Manager", dueDate: "This week" },
  { id: 3, action: "Validate cost breakdown assumptions with Finance", priority: "high", status: "pending", owner: "Finance Partner", dueDate: "Next week" },
  { id: 4, action: "Conduct site visits for quality assurance", priority: "high", status: "blocked", owner: "QA Team", dueDate: "TBD" },
  { id: 5, action: "Update contract templates with legal terms", priority: "medium", status: "pending", owner: "Legal", dueDate: "2 weeks" },
  { id: 6, action: "Prepare stakeholder presentation deck", priority: "medium", status: "pending", owner: "Project Lead", dueDate: "3 weeks" },
  { id: 7, action: "Document risk mitigation strategies", priority: "low", status: "pending", owner: "Risk Manager", dueDate: "End of month" },
];

// Muted EXOS palette — matched to Data Quality / License Distribution / Timeline Roadmap
const STATUS_META: Record<
  Status,
  { label: string; color: string; icon: typeof CheckCircle2; opacity: number }
> = {
  done: { label: "Done", color: "hsl(174, 35%, 38%)", icon: CheckCircle2, opacity: 1 },
  "in-progress": { label: "In Progress", color: "hsl(35, 28%, 45%)", icon: Clock, opacity: 1 },
  pending: { label: "Pending", color: "hsl(220, 22%, 48%)", icon: Circle, opacity: 1 },
  blocked: { label: "Blocked", color: "hsl(358, 38%, 48%)", icon: AlertTriangle, opacity: 1 },
};

const STATUS_ORDER: Status[] = ["done", "in-progress", "pending", "blocked"];

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  critical: { label: "Critical", color: "hsl(358, 38%, 48%)" },
  high: { label: "High", color: "hsl(35, 28%, 45%)" },
  medium: { label: "Medium", color: "hsl(220, 22%, 48%)" },
  low: { label: "Low", color: "hsl(174, 35%, 38%)" },
};

const PRIORITY_ORDER: Priority[] = ["critical", "high", "medium", "low"];

const ActionChecklistDashboard = ({
  title = "Action Checklist",
  subtitle = "Status-grouped next steps",
  actions = defaultActions,
  parsedData,
}: ActionChecklistDashboardProps) => {
  const effectiveActions: ActionItem[] = parsedData?.actions
    ? parsedData.actions.map((a, i) => ({ id: i + 1, ...a }))
    : actions;

  const grouped = useMemo(() => {
    const map: Record<Status, ActionItem[]> = {
      done: [],
      "in-progress": [],
      pending: [],
      blocked: [],
    };
    effectiveActions.forEach((a) => {
      const s = (STATUS_ORDER.includes(a.status) ? a.status : "pending") as Status;
      map[s].push(a);
    });
    // sort each group by priority order
    (Object.keys(map) as Status[]).forEach((s) => {
      map[s].sort(
        (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
      );
    });
    return map;
  }, [effectiveActions]);

  const counts = {
    done: grouped.done.length,
    "in-progress": grouped["in-progress"].length,
    pending: grouped.pending.length,
    blocked: grouped.blocked.length,
  };

  const total = effectiveActions.length;
  const completionPct = total ? Math.round((counts.done / total) * 100) : 0;

  const priorityCounts = useMemo(() => {
    const map: Record<Priority, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    effectiveActions.forEach((a) => {
      if (PRIORITY_ORDER.includes(a.priority)) map[a.priority]++;
    });
    return map;
  }, [effectiveActions]);

  // Blockers callout
  const blockers = grouped.blocked;

  const heroColor = STATUS_META.done.color;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-semibold" style={{ color: heroColor }}>
              {completionPct}%
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              completion
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stacked status bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Status distribution
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
              {total} actions
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-muted">
            {STATUS_ORDER.map((s) => {
              const pct = total ? (counts[s] / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={s}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: STATUS_META[s].color,
                    opacity: STATUS_META[s].opacity,
                  }}
                  title={`${STATUS_META[s].label}: ${counts[s]}`}
                />
              );
            })}
          </div>
        </div>

        {/* Two-column: status groups + side panel */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          {/* Grouped sections */}
          <div className="space-y-2">
            {STATUS_ORDER.map((status) => {
              const items = grouped[status];
              if (items.length === 0) return null;
              const meta = STATUS_META[status];
              const Icon = meta.icon;

              return (
                <div
                  key={status}
                  className="rounded-md border border-border overflow-hidden"
                >
                  {/* Group header */}
                  <div
                    className="flex items-center justify-between px-2.5 py-1.5 text-background"
                    style={{ backgroundColor: meta.color, opacity: meta.opacity }}
                  >
                    <span className="text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Icon className="w-3 h-3" />
                      {meta.label} ({items.length})
                    </span>
                    <span className="text-[10px] uppercase tracking-wider tabular-nums">
                      {Math.round((items.length / total) * 100)}%
                    </span>
                  </div>
                  {/* Action rows */}
                  <div className="divide-y divide-border/60">
                    {items.map((item) => {
                      const pMeta = PRIORITY_META[item.priority];
                      const isDone = status === "done";
                      return (
                        <div
                          key={item.id}
                          className="flex items-start px-2.5 py-2 gap-2 text-xs"
                        >
                          {/* Priority stripe */}
                          <div
                            className="w-0.5 self-stretch rounded-full flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: pMeta.color }}
                            aria-hidden
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`leading-snug ${
                                isDone
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground"
                              }`}
                            >
                              {item.action}
                            </p>
                            {(item.owner || item.dueDate) && (
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                                {item.owner && <span>{item.owner}</span>}
                                {item.owner && item.dueDate && <span>•</span>}
                                {item.dueDate && <span>{item.dueDate}</span>}
                              </div>
                            )}
                          </div>
                          <span
                            className="text-[10px] uppercase tracking-wider tabular-nums px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                            style={{
                              color: pMeta.color,
                              backgroundColor: `${pMeta.color}1a`,
                            }}
                          >
                            {pMeta.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side panel */}
          <div className="rounded-md border border-border bg-muted/30 p-3 flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Progress summary
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Total actions</span>
                <span className="font-semibold tabular-nums">{total}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold tabular-nums">
                  {counts.done} / {total}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs pt-2 border-t border-border">
                <span className="text-foreground font-medium">Completion</span>
                <span
                  className="font-display font-semibold text-base tabular-nums"
                  style={{ color: heroColor }}
                >
                  {completionPct}%
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-2 space-y-1 mb-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Status
              </div>
              {STATUS_ORDER.map((s) => {
                const meta = STATUS_META[s];
                const Icon = meta.icon;
                return (
                  <div
                    key={s}
                    className="flex justify-between items-center text-xs px-1 py-0.5"
                  >
                    <span className="flex gap-1.5 items-center min-w-0 text-muted-foreground">
                      <Icon className="w-3 h-3 flex-shrink-0" style={{ color: meta.color }} />
                      <span className="truncate">{meta.label}</span>
                    </span>
                    <span
                      className="tabular-nums font-medium"
                      style={{ color: meta.color }}
                    >
                      {counts[s]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Priority
              </div>
              {PRIORITY_ORDER.map((p) => {
                const meta = PRIORITY_META[p];
                if (priorityCounts[p] === 0) return null;
                return (
                  <div
                    key={p}
                    className="flex justify-between items-center text-xs px-1 py-0.5"
                  >
                    <span className="flex gap-1.5 items-center min-w-0 text-muted-foreground">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="truncate">{meta.label}</span>
                    </span>
                    <span
                      className="tabular-nums font-medium"
                      style={{ color: meta.color }}
                    >
                      {priorityCounts[p]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Blockers banner */}
        {blockers.length > 0 && (
          <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-warning flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              Blocked items requiring attention
            </p>
            {blockers.map((item) => (
              <p key={item.id} className="text-xs text-foreground leading-snug">
                <span className="font-medium">{item.action}</span>
                {item.owner && (
                  <span className="text-muted-foreground"> — owner: {item.owner}</span>
                )}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionChecklistDashboard;
