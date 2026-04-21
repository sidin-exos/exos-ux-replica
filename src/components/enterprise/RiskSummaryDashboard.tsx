import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown, TrendingUp, AlertTriangle, ArrowUpRight, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { EnterpriseTracker } from "@/hooks/useEnterpriseTrackers";

type Status = "deteriorating" | "improving" | "stable";

interface SignalItem {
  trackerName: string;
  monitorLabel: string;
  riskArea: string;
  trackerId: string;
  reportDate: string;
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

const DETERIORATING_KEYWORDS = [
  "deteriorat", "declin", "worsen", "negative", "concern", "threat",
  "escala", "weaken", "vulnerab", "disrupt", "sanction", "tariff",
  "shortage", "downgrad", "default", "loss", "unstable", "volatile",
  "critical", "warning",
];

const IMPROVING_KEYWORDS = [
  "improv", "strengthen", "positive", "stabili", "recover", "growth",
  "opportunit", "favorable", "upgrad", "gain", "resili", "diversif",
  "mitigat", "progress", "expansion", "innovation", "efficien",
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

/** Extract risk-area rows from the report's markdown tables, with status. */
function extractRiskAreas(content: string): { name: string; status: Status }[] {
  if (!content) return [];
  const out: { name: string; status: Status }[] = [];
  const seen = new Set<string>();
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("|") || !line.includes("|", 1)) continue;
    if (/^\|\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line)) continue;
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c, i, arr) => !(i === 0 && c === "") && !(i === arr.length - 1 && c === ""));
    if (cells.length < 2) continue;
    const name = cells[0].replace(/\*\*/g, "").replace(/^[-–•*#>\s]+/, "").trim();
    if (!name || name.length < 3 || name.length > 80) continue;
    if (GENERIC_NAMES.test(name)) continue;
    if (/^risk\s+area$/i.test(name) || /^topic$/i.test(name)) continue;

    let status: Status | null = null;
    for (const cell of cells.slice(1)) {
      const stripped = cell.replace(/\*\*/g, "").trim().toLowerCase();
      if (DIRECTION_TO_STATUS[stripped]) {
        status = DIRECTION_TO_STATUS[stripped];
        break;
      }
    }
    if (!status) status = classifyText(cells.slice(1).join(" "));

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, status });
  }
  return out;
}

interface Props {
  trackers: EnterpriseTracker[];
}

export default function RiskSummaryDashboard({ trackers }: Props) {
  const trackerIds = trackers.filter((t) => t.status === "active").map((t) => t.id);

  const { data, isLoading } = useQuery({
    queryKey: ["risk_summary_signals_v2", trackerIds.join(",")],
    enabled: trackerIds.length > 0,
    queryFn: async () => {
      const { data: reports, error } = await supabase
        .from("monitor_reports" as any)
        .select("tracker_id, report_content, created_at")
        .in("tracker_id", trackerIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error || !reports) return { deteriorating: [], improving: [] };

      const trackerMap = new Map(trackers.map((t) => [t.id, t]));
      const seenTracker = new Set<string>();
      const deteriorating: SignalItem[] = [];
      const improving: SignalItem[] = [];
      const areasByTracker = new Map<string, { name: string; status: Status }[]>();

      // Latest report per tracker
      for (const report of reports as any[]) {
        if (seenTracker.has(report.tracker_id)) continue;
        seenTracker.add(report.tracker_id);

        const tracker = trackerMap.get(report.tracker_id);
        const trackerName = tracker?.name || "Unknown";
        const monitorLabel = trackerName;

        const areas = extractRiskAreas(report.report_content || "");
        areasByTracker.set(report.tracker_id, areas);
        for (const a of areas) {
          const item: SignalItem = {
            trackerName,
            monitorLabel,
            riskArea: a.name,
            trackerId: report.tracker_id,
            reportDate: report.created_at,
          };
          if (a.status === "deteriorating") deteriorating.push(item);
          else if (a.status === "improving") improving.push(item);
        }
      }

      // Sort newest-first by report date
      const byDate = (a: SignalItem, b: SignalItem) =>
        new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
      deteriorating.sort(byDate);
      improving.sort(byDate);

      return {
        deteriorating: deteriorating.slice(0, 6),
        improving: improving.slice(0, 6),
        areasByTracker: Object.fromEntries(areasByTracker.entries()) as Record<string, { name: string; status: Status }[]>,
      };
    },
    staleTime: 60_000,
  });

  const hasNoData = !isLoading && trackerIds.length === 0;
  const hasNoReports =
    !isLoading && data && data.deteriorating.length === 0 && data.improving.length === 0 && trackerIds.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Latest Signals</h3>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {hasNoData && (
        <p className="text-xs text-muted-foreground py-2">Activate monitors to see signal summaries.</p>
      )}

      {hasNoReports && (
        <p className="text-xs text-muted-foreground py-2">Run your first scan to generate signals.</p>
      )}

      {/* Requiring Attention */}
      {data && data.deteriorating.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-medium text-destructive">Requiring Attention</span>
          </div>
          {data.deteriorating.map((item, i) => (
            <SignalRow key={`d-${i}`} item={item} tone="deteriorating" />
          ))}
        </div>
      )}

      {/* Improving */}
      {data && data.improving.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-600">Improving</span>
          </div>
          {data.improving.map((item, i) => (
            <SignalRow key={`i-${i}`} item={item} tone="improving" />
          ))}
        </div>
      )}
    </div>
  );
}

interface SignalRowProps {
  item: SignalItem;
  tone: "deteriorating" | "improving";
}

function SignalRow({ item, tone }: SignalRowProps) {
  const isDet = tone === "deteriorating";
  const containerCls = isDet
    ? "rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 transition-colors hover:bg-destructive/10 hover:border-destructive/30"
    : "rounded-md border border-emerald-600/20 bg-emerald-600/5 px-2.5 py-1.5 transition-colors hover:bg-emerald-600/10 hover:border-emerald-600/30";
  const Icon = isDet ? TrendingDown : TrendingUp;
  const textCls = isDet ? "text-destructive" : "text-emerald-600";

  return (
    <div className={containerCls} title={`${item.trackerName} — ${item.riskArea}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className={`w-3 h-3 ${textCls} flex-shrink-0`} />
          <span className={`text-[11px] font-medium ${textCls} truncate`}>
            {item.monitorLabel ? `${item.monitorLabel}: ` : ""}{item.riskArea}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {new Date(item.reportDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
      </div>
    </div>
  );
}
