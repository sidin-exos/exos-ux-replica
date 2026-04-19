import { Calendar, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Muted EXOS-aligned palette (matching License Distribution direction)
const phaseColors = [
  "hsl(174, 35%, 38%)", // teal
  "hsl(220, 22%, 48%)", // slate-blue
  "hsl(258, 22%, 50%)", // muted violet
  "hsl(35, 28%, 45%)",  // muted amber
  "hsl(195, 28%, 42%)", // muted cyan
  "hsl(280, 18%, 48%)", // muted plum
];

const defaultPhases: Phase[] = [
  { id: 1, name: "Discovery & Analysis", startWeek: 1, endWeek: 4, status: "completed", milestones: ["Requirements gathered", "Stakeholders aligned"] },
  { id: 2, name: "Supplier Selection", startWeek: 3, endWeek: 8, status: "in-progress", milestones: ["RFP issued", "Proposals evaluated"] },
  { id: 3, name: "Contract Negotiation", startWeek: 7, endWeek: 12, status: "upcoming", milestones: ["Terms finalised", "Contract signed"] },
  { id: 4, name: "Implementation", startWeek: 11, endWeek: 18, status: "upcoming", milestones: ["Pilot launch", "Full rollout"] },
  { id: 5, name: "Optimisation", startWeek: 17, endWeek: 24, status: "upcoming", milestones: ["Performance review"] },
];

const statusMeta: Record<PhaseStatus, { label: string; icon: typeof CheckCircle2 }> = {
  completed: { label: "Done", icon: CheckCircle2 },
  "in-progress": { label: "Active", icon: PlayCircle },
  upcoming: { label: "Planned", icon: Circle },
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

  // Overall progress: completed phases get 100%, active gets 50%
  const progressPct = useMemo(() => {
    const score = effectivePhases.reduce((sum, p) => {
      if (p.status === "completed") return sum + 1;
      if (p.status === "in-progress") return sum + 0.5;
      return sum;
    }, 0);
    return effectivePhases.length > 0 ? Math.round((score / effectivePhases.length) * 100) : 0;
  }, [effectivePhases]);

  const heroColor = phaseColors[0];
  const weekMarkers = [
    1,
    Math.floor(effectiveTotalWeeks / 4),
    Math.floor(effectiveTotalWeeks / 2),
    Math.floor((3 * effectiveTotalWeeks) / 4),
    effectiveTotalWeeks,
  ];

  // Phase color assignment (cycle through palette)
  const colorFor = (idx: number) => phaseColors[idx % phaseColors.length];

  // Status counts
  const counts = {
    completed: effectivePhases.filter((p) => p.status === "completed").length,
    "in-progress": effectivePhases.filter((p) => p.status === "in-progress").length,
    upcoming: effectivePhases.filter((p) => p.status === "upcoming").length,
  };

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
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
            <div className="text-2xl font-display font-semibold" style={{ color: heroColor }}>
              {progressPct}%
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              overall progress
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stacked progress bar (phases by status) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Phase progress
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
              {completedPhases}/{effectivePhases.length} complete · {effectiveTotalWeeks} weeks
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-muted">
            {effectivePhases.map((p, i) => {
              const pct = 100 / effectivePhases.length;
              const opacity =
                p.status === "completed" ? 1 : p.status === "in-progress" ? 0.55 : 0.18;
              return (
                <div
                  key={p.id}
                  style={{ width: `${pct}%`, backgroundColor: colorFor(i), opacity }}
                  title={`${p.name} — ${p.status}`}
                />
              );
            })}
          </div>
        </div>

        {/* Two-column: gantt + side breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          {/* Phase rows */}
          <div className="space-y-2">
            {/* Week scale */}
            <div className="relative h-4 px-2">
              <div className="absolute inset-x-2 top-2 h-px bg-border" />
              {weekMarkers.map((week) => (
                <div
                  key={week}
                  className="absolute top-0 flex flex-col items-center"
                  style={{
                    left: `calc(${((week - 1) / (effectiveTotalWeeks - 1)) * 100}% * (100% - 16px) / 100% + 8px)`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    W{week}
                  </span>
                </div>
              ))}
            </div>

            {effectivePhases.map((phase, idx) => {
              const color = colorFor(idx);
              const isActive = phase.status === "in-progress";
              const startPercent =
                ((phase.startWeek - 1) / (effectiveTotalWeeks - 1)) * 100;
              const widthPercent =
                ((phase.endWeek - phase.startWeek) / (effectiveTotalWeeks - 1)) * 100;
              const StatusIcon = statusMeta[phase.status].icon;
              const opacity =
                phase.status === "completed" ? 1 : phase.status === "in-progress" ? 0.85 : 0.35;

              return (
                <div
                  key={phase.id}
                  className={`rounded-md border p-2.5 ${isActive ? "border-2" : "border-border"}`}
                  style={
                    isActive
                      ? { borderColor: color, backgroundColor: `${color}10` }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-1 self-stretch rounded flex-shrink-0"
                      style={{ backgroundColor: color, minHeight: 36 }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {phase.name}
                        </span>
                        {isActive && (
                          <span
                            className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded text-background"
                            style={{ backgroundColor: "hsl(var(--success))" }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums flex items-center gap-1">
                        <StatusIcon className="w-3 h-3" style={{ color }} />
                        {statusMeta[phase.status].label} · W{phase.startWeek}–W{phase.endWeek} ·{" "}
                        {phase.endWeek - phase.startWeek + 1} wks
                      </div>
                    </div>
                  </div>

                  {/* Gantt bar */}
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden mt-2">
                    <div
                      className="absolute h-full rounded-full"
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: color,
                        opacity,
                      }}
                    />
                  </div>

                  {/* Milestones */}
                  {phase.milestones && phase.milestones.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-border/60">
                      {phase.milestones.map((milestone, mIdx) => (
                        <span
                          key={mIdx}
                          className="text-[11px] text-muted-foreground flex items-center gap-1"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {milestone}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Side breakdown panel */}
          <div className="rounded-md border border-border bg-muted/30 p-3 flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Status summary
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Total phases</span>
                <span className="font-semibold tabular-nums">{effectivePhases.length}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-semibold tabular-nums">{effectiveTotalWeeks} wks</span>
              </div>
              <div className="flex justify-between items-baseline text-xs pt-2 border-t border-border">
                <span className="text-foreground font-medium">Complete</span>
                <span
                  className="font-display font-semibold text-base tabular-nums"
                  style={{ color: heroColor }}
                >
                  {progressPct}%
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Phases
              </div>
              {(["completed", "in-progress", "upcoming"] as PhaseStatus[]).map((status) => {
                const StatusIcon = statusMeta[status].icon;
                return (
                  <div
                    key={status}
                    className="flex justify-between items-center text-xs px-1 py-0.5"
                  >
                    <span className="flex gap-1.5 items-center min-w-0 text-muted-foreground">
                      <StatusIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate capitalize">{status.replace("-", " ")}</span>
                    </span>
                    <span className="tabular-nums font-medium text-foreground">
                      {counts[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active phase banner */}
        {activePhase && (
          <div className="rounded-md border border-success/30 bg-success/5 px-3 py-2">
            <p className="text-xs text-foreground leading-snug">
              <span className="text-success font-semibold">Currently active:</span>{" "}
              {activePhase.name} — running W{activePhase.startWeek}–W{activePhase.endWeek}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineRoadmapDashboard;
