import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TimelineRoadmapData } from "@/lib/dashboard-data-parser";

type PhaseStatus = "completed" | "in-progress" | "upcoming";

interface Phase {
  id: number;
  name: string;
  startWeek: number;
  endWeek: number;
  status: PhaseStatus;
  milestones?: string[];
}

interface TimelineRoadmapDashboardProps {
  title?: string;
  subtitle?: string;
  phases?: Phase[];
  totalWeeks?: number;
  parsedData?: TimelineRoadmapData;
}

const defaultPhases: Phase[] = [
  { id: 1, name: "Discovery & Analysis", startWeek: 1, endWeek: 4, status: "completed", milestones: ["Requirements gathered", "Stakeholders aligned"] },
  { id: 2, name: "Supplier Selection", startWeek: 3, endWeek: 8, status: "in-progress", milestones: ["RFP issued", "Proposals evaluated"] },
  { id: 3, name: "Contract Negotiation", startWeek: 7, endWeek: 12, status: "upcoming", milestones: ["Terms finalized", "Contract signed"] },
  { id: 4, name: "Implementation", startWeek: 11, endWeek: 18, status: "upcoming", milestones: ["Pilot launch", "Full rollout"] },
  { id: 5, name: "Optimization", startWeek: 17, endWeek: 24, status: "upcoming", milestones: ["Performance review"] },
];

const statusConfig: Record<PhaseStatus, { label: string; className: string; barClass: string }> = {
  completed: { label: "Done", className: "bg-primary/15 text-primary border-primary/30", barClass: "bg-primary" },
  "in-progress": { label: "Active", className: "bg-warning/15 text-warning border-warning/30", barClass: "bg-warning" },
  upcoming: { label: "Planned", className: "bg-muted text-muted-foreground border-border", barClass: "bg-muted-foreground/30" },
};

const TimelineRoadmapDashboard = ({
  title = "Project Timeline",
  subtitle = "Implementation roadmap",
  phases = defaultPhases,
  totalWeeks = 24,
  parsedData,
}: TimelineRoadmapDashboardProps) => {
  const effectivePhases: Phase[] = parsedData?.phases
    ? parsedData.phases.map((p, i) => ({ id: i + 1, ...p }))
    : phases;
  const effectiveTotalWeeks = parsedData?.totalWeeks || totalWeeks;
  const completedPhases = effectivePhases.filter((p) => p.status === "completed").length;
  const activePhase = effectivePhases.find((p) => p.status === "in-progress");

  const weekMarkers = [1, Math.floor(effectiveTotalWeeks / 4), Math.floor(effectiveTotalWeeks / 2), Math.floor((3 * effectiveTotalWeeks) / 4), effectiveTotalWeeks];

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground">{completedPhases}/{effectivePhases.length}</p>
            <p className="text-xs text-muted-foreground">phases complete</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Week markers */}
        <div className="relative h-6 mb-2">
          <div className="absolute inset-x-0 top-3 h-px bg-border" />
          {weekMarkers.map((week) => (
            <div
              key={week}
              className="absolute flex flex-col items-center"
              style={{ left: `${((week - 1) / (effectiveTotalWeeks - 1)) * 100}%`, transform: "translateX(-50%)" }}
            >
              <span className="text-xs text-muted-foreground">W{week}</span>
              <div className="w-px h-2 bg-border mt-1" />
            </div>
          ))}
        </div>

        {/* Phase bars */}
        <div className="space-y-3">
          {effectivePhases.map((phase) => {
            const startPercent = ((phase.startWeek - 1) / (effectiveTotalWeeks - 1)) * 100;
            const widthPercent = ((phase.endWeek - phase.startWeek) / (effectiveTotalWeeks - 1)) * 100;

            return (
              <div key={phase.id} className="relative">
                {/* Phase label */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{phase.name}</span>
                  <Badge variant="outline" className={statusConfig[phase.status].className}>
                    {statusConfig[phase.status].label}
                  </Badge>
                </div>

                {/* Gantt bar */}
                <div className="relative h-6 bg-secondary/30 rounded">
                  <div
                    className={`absolute h-full rounded ${statusConfig[phase.status].barClass}`}
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  />
                </div>

                {/* Milestones */}
                {phase.milestones && phase.milestones.length > 0 && (
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {phase.milestones.map((milestone, idx) => (
                      <span key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {milestone}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Current status */}
        {activePhase && (
          <div className="pt-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              <span className="text-warning font-medium">Currently Active:</span> {activePhase.name}
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs pt-2">
          {(["completed", "in-progress", "upcoming"] as PhaseStatus[]).map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${statusConfig[status].barClass}`} />
              <span className="text-muted-foreground capitalize">{status.replace("-", " ")}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineRoadmapDashboard;
