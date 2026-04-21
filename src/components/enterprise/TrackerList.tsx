import { format } from "date-fns";
import { ChevronRight, FolderPlus, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MONITOR_TYPE_META } from "@/hooks/useEnterpriseTrackers";
import type { EnterpriseTracker, MonitorType, MonitorParameters } from "@/hooks/useEnterpriseTrackers";

interface TrackerListProps {
  trackers: EnterpriseTracker[];
  isLoading: boolean;
  onSelectTracker?: (tracker: EnterpriseTracker) => void;
}

type Status = "deteriorating" | "improving" | "stable";

const statusBorderClass: Record<string, string> = {
  deteriorating: "border-l-destructive",
  improving: "border-l-success",
  stable: "border-l-accent",
  none: "border-l-muted-foreground",
};

const statusDotClass: Record<string, string> = {
  deteriorating: "bg-destructive",
  improving: "bg-success",
  stable: "bg-accent",
};

const DETERIORATING_KEYWORDS = [
  "deteriorat", "declin", "worsen", "negative", "concern", "threat",
  "escala", "weaken", "vulnerab", "disrupt", "sanction", "tariff",
  "shortage", "downgrad", "default", "loss", "unstable", "volatile",
  "critical", "warning", "increase.*risk", "increased.*risk",
];

const IMPROVING_KEYWORDS = [
  "improv", "strengthen", "positive", "stabili", "recover", "growth",
  "opportunit", "favorable", "upgrad", "gain", "resili", "diversif",
  "mitigat", "progress", "expansion", "innovation", "efficien",
  "reduc.*risk", "reduced.*risk",
];

function classifyText(text: string): Status {
  const lower = text.toLowerCase();
  let det = 0;
  let imp = 0;
  for (const kw of DETERIORATING_KEYWORDS) {
    const m = lower.match(new RegExp(kw, "gi"));
    if (m) det += m.length;
  }
  for (const kw of IMPROVING_KEYWORDS) {
    const m = lower.match(new RegExp(kw, "gi"));
    if (m) imp += m.length;
  }
  if (det > imp * 1.2) return "deteriorating";
  if (imp > det * 1.2) return "improving";
  return "stable";
}

interface SubFactor {
  name: string;
  status: Status;
}

const DIRECTION_TO_STATUS: Record<string, Status> = {
  improving: "improving",
  stable: "stable",
  moderate: "stable",
  low: "stable",
  deteriorating: "deteriorating",
  critical: "deteriorating",
};

const GENERIC_NAMES = /^(risk area|topic|area|category|item|n\/a|—|-)$/i;

/** Extract risk-area names + direction from the report's "Risk Signals" markdown table. */
function extractSubFactors(content: string): SubFactor[] {
  if (!content) return [];
  const factors: SubFactor[] = [];
  const seen = new Set<string>();
  const lines = content.split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    // Markdown table row: | cell1 | cell2 | ...
    if (!line.startsWith("|") || !line.includes("|", 1)) continue;
    // Skip alignment separator rows like |---|---|
    if (/^\|\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line)) continue;

    const cells = line.split("|").map((c) => c.trim()).filter((c, i, arr) => !(i === 0 && c === "") && !(i === arr.length - 1 && c === ""));
    if (cells.length < 2) continue;

    const name = cells[0].replace(/\*\*/g, "").replace(/^[-–•*#>\s]+/, "").trim();
    if (!name || name.length < 3 || name.length > 80) continue;
    if (GENERIC_NAMES.test(name)) continue;
    // Skip header row
    if (/^risk\s+area$/i.test(name) || /^topic$/i.test(name)) continue;

    // Find direction keyword in any cell (usually 2nd)
    let status: Status | null = null;
    for (const cell of cells.slice(1)) {
      const stripped = cell.replace(/\*\*/g, "").trim().toLowerCase();
      if (DIRECTION_TO_STATUS[stripped]) {
        status = DIRECTION_TO_STATUS[stripped];
        break;
      }
    }
    // If no explicit direction, classify from row text
    if (!status) status = classifyText(cells.slice(1).join(" "));

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    factors.push({ name, status });
  }

  return factors.slice(0, 8);
}

const TrackerList = ({ trackers, isLoading, onSelectTracker }: TrackerListProps) => {
  const trackerIds = trackers.map((t) => t.id);

  const { data: latestReports = {} } = useQuery({
    queryKey: ["monitor_reports_latest_factors", trackerIds],
    enabled: trackerIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitor_reports" as any)
        .select("tracker_id, report_content, created_at")
        .in("tracker_id", trackerIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const map: Record<string, { factors: SubFactor[]; date: string; dominant: Status }> = {};
      for (const row of data ?? []) {
        const r = row as any;
        if (!map[r.tracker_id]) {
          const factors = extractSubFactors(r.report_content || "");
          // Determine dominant status for left border
          const counts: Record<string, number> = {};
          factors.forEach((f) => { counts[f.status] = (counts[f.status] || 0) + 1; });
          let dominant: Status = "stable";
          if (counts.deteriorating) dominant = "deteriorating";
          else if (counts.improving && !counts.deteriorating) dominant = "improving";
          map[r.tracker_id] = { factors, date: r.created_at, dominant };
        }
      }
      return map;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (trackers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderPlus className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No monitors yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first monitor from the "Set up New Monitor" tab to start tracking dynamics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trackers.map((t) => {
        const params = t.parameters as MonitorParameters;
        const monitorType = (params?.monitor_type ?? "DM-2") as MonitorType;
        const typeMeta = MONITOR_TYPE_META[monitorType];
        const latest = latestReports[t.id];
        const dominant = latest?.dominant ?? "none";
        const borderClass = statusBorderClass[dominant] || statusBorderClass.none;

        return (
          <div
            key={t.id}
            className={`flex items-center gap-4 p-3 rounded-md border border-border/50 border-l-[3px] ${borderClass} hover:border-primary/40 cursor-pointer transition-all group hover:shadow-sm`}
            onClick={() => onSelectTracker?.(t)}
          >
            {/* Name + sub-factor chips */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {t.name}
                </span>
                <span className="text-[10px] font-medium border rounded px-1.5 py-0.5 bg-iris/10 text-iris border-iris/30 shrink-0">
                  {typeMeta?.label}
                </span>
              </div>
              {!latest || latest.factors.length === 0 ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No signals yet. Run a scan to populate sub-factors.
                </p>
              ) : (
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {latest.factors.map((f, i) => (
                    <span
                      key={i}
                      title={`${f.name} — ${f.status}`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass[f.status] || "bg-muted-foreground"}`} />
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Dates column */}
            <div className="shrink-0 text-right space-y-1">
              <div className="text-[11px]">
                <span className="text-muted-foreground/60 block">Created</span>
                <span className="text-muted-foreground">{format(new Date(t.created_at), "MMM d, yyyy")}</span>
              </div>
              {latest && (
                <div className="text-[11px]">
                  <span className="text-muted-foreground/60 block">Updated</span>
                  <span className="text-muted-foreground">{format(new Date(latest.date), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        );
      })}
    </div>
  );
};

export default TrackerList;
