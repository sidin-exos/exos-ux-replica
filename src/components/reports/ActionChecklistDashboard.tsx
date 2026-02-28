import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  { id: 1, action: "Finalize supplier shortlist based on RFP responses", priority: "critical", status: "done", owner: "Procurement Lead", dueDate: "Completed" },
  { id: 2, action: "Schedule negotiation meetings with top 3 vendors", priority: "critical", status: "in-progress", owner: "Category Manager", dueDate: "This week" },
  { id: 3, action: "Validate cost breakdown assumptions with Finance", priority: "high", status: "pending", owner: "Finance Partner", dueDate: "Next week" },
  { id: 4, action: "Conduct site visits for quality assurance", priority: "high", status: "blocked", owner: "QA Team", dueDate: "TBD" },
  { id: 5, action: "Update contract templates with legal terms", priority: "medium", status: "pending", owner: "Legal", dueDate: "2 weeks" },
  { id: 6, action: "Prepare stakeholder presentation deck", priority: "medium", status: "pending", owner: "Project Lead", dueDate: "3 weeks" },
  { id: 7, action: "Document risk mitigation strategies", priority: "low", status: "pending", owner: "Risk Manager", dueDate: "End of month" },
];

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-destructive/15 text-destructive border-destructive/30" },
  high: { label: "High", className: "bg-warning/15 text-warning border-warning/30" },
  medium: { label: "Medium", className: "bg-primary/15 text-primary border-primary/30" },
  low: { label: "Low", className: "bg-muted text-muted-foreground border-border" },
};

const statusConfig: Record<Status, { icon: typeof CheckCircle2; className: string }> = {
  done: { icon: CheckCircle2, className: "text-primary" },
  "in-progress": { icon: Clock, className: "text-warning" },
  pending: { icon: Circle, className: "text-muted-foreground" },
  blocked: { icon: AlertCircle, className: "text-destructive" },
};

const ActionChecklistDashboard = ({
  title = "Action Checklist",
  subtitle = "Prioritized next steps",
  actions = defaultActions,
  parsedData,
}: ActionChecklistDashboardProps) => {
  // Use parsed AI data if available, otherwise fall back to props/defaults
  const effectiveActions: ActionItem[] = parsedData?.actions
    ? parsedData.actions.map((a, i) => ({ id: i + 1, ...a }))
    : actions;
  const completedCount = effectiveActions.filter((a) => a.status === "done").length;
  const totalCount = effectiveActions.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const groupedActions = {
    critical: effectiveActions.filter((a) => a.priority === "critical"),
    high: effectiveActions.filter((a) => a.priority === "high"),
    medium: effectiveActions.filter((a) => a.priority === "medium"),
    low: effectiveActions.filter((a) => a.priority === "low"),
  };

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
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
            <p className="text-lg font-semibold text-foreground">{completedCount}/{totalCount}</p>
            <p className="text-xs text-muted-foreground">{progressPercent}% complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {(["critical", "high", "medium", "low"] as Priority[]).map((priority) => {
          const items = groupedActions[priority];
          if (items.length === 0) return null;

          return (
            <div key={priority} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={priorityConfig[priority].className}>
                  {priorityConfig[priority].label}
                </Badge>
                <span className="text-xs text-muted-foreground">{items.length} items</span>
              </div>

              <div className="space-y-1.5">
                {items.map((item) => {
                  const config = statusConfig[item.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/30 ${
                        item.status === "done" ? "opacity-60" : ""
                      }`}
                    >
                      <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${config.className}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm text-foreground ${item.status === "done" ? "line-through" : ""}`}>
                          {item.action}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {item.owner && <span>{item.owner}</span>}
                          {item.dueDate && (
                            <>
                              <span>•</span>
                              <span>{item.dueDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ActionChecklistDashboard;
