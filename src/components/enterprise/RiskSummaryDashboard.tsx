import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown, TrendingUp, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { EnterpriseTracker } from "@/hooks/useEnterpriseTrackers";
import { MONITOR_TYPE_META } from "@/hooks/useEnterpriseTrackers";
import type { MonitorType } from "@/hooks/useEnterpriseTrackers";

interface SignalItem {
  trackerName: string;
  monitorLabel: string;
  signal: string;
  trackerId: string;
}

const DETERIORATING_KEYWORDS = [
  "deteriorat", "declin", "worsen", "increas.*risk", "negative",
  "concern", "threat", "escala", "weaken", "vulnerab", "disrupt",
  "sanction", "tariff", "shortage", "downgrad", "default", "loss",
  "unstable", "volatile", "critical", "warning",
];

const IMPROVING_KEYWORDS = [
  "improv", "strengthen", "positive", "stabili", "recover",
  "growth", "opportunit", "favorable", "upgrad", "gain",
  "resili", "diversif", "mitigat", "progress", "expansion",
  "innovation", "efficien", "reduc.*risk",
];

function extractSignals(content: string, keywords: string[], maxCount: number): string[] {
  const sentences = content.split(/[.!?\n]/).filter((s) => {
    const t = s.trim();
    // Skip table rows, headers, short fragments, and markdown artifacts
    if (t.length < 20 || t.length > 180) return false;
    if (t.startsWith("|") || t.includes(" | ")) return false;
    if (t.startsWith("#")) return false;
    if (t.startsWith("---") || t.startsWith("***")) return false;
    return true;
  });
  const matches: string[] = [];

  for (const sentence of sentences) {
    if (matches.length >= maxCount) break;
    const lower = sentence.toLowerCase();
    const found = keywords.some((kw) => new RegExp(kw, "i").test(lower));
    if (found) {
      const trimmed = sentence.trim().replace(/^[-–•*#>\s]+/, "").trim();
      if (trimmed.length > 15) {
        matches.push(trimmed);
      }
    }
  }
  return matches;
}

interface Props {
  trackers: EnterpriseTracker[];
}

export default function RiskSummaryDashboard({ trackers }: Props) {
  const trackerIds = trackers.filter((t) => t.status === "active").map((t) => t.id);

  const { data, isLoading } = useQuery({
    queryKey: ["risk_summary_signals", trackerIds.join(",")],
    enabled: trackerIds.length > 0,
    queryFn: async () => {
      // Get the latest report per tracker
      const { data: reports, error } = await supabase
        .from("monitor_reports" as any)
        .select("tracker_id, report_content, created_at")
        .in("tracker_id", trackerIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error || !reports) return { deteriorating: [], improving: [], lastUpdate: null };

      const trackerMap = new Map(trackers.map((t) => [t.id, t.name]));
      const seen = new Set<string>();
      const deteriorating: SignalItem[] = [];
      const improving: SignalItem[] = [];
      let lastUpdate: string | null = null;

      for (const report of reports as any[]) {
        if (!lastUpdate) lastUpdate = report.created_at;
        if (seen.has(report.tracker_id)) continue;
        seen.add(report.tracker_id);

        const content = report.report_content || "";
        const trackerName = trackerMap.get(report.tracker_id) || "Unknown";

        const detSignals = extractSignals(content, DETERIORATING_KEYWORDS, 1);
        for (const s of detSignals) {
          if (deteriorating.length < 3) {
            deteriorating.push({ trackerName, signal: s, trackerId: report.tracker_id });
          }
        }

        const impSignals = extractSignals(content, IMPROVING_KEYWORDS, 1);
        for (const s of impSignals) {
          if (improving.length < 3) {
            improving.push({ trackerName, signal: s, trackerId: report.tracker_id });
          }
        }
      }

      return { deteriorating, improving, lastUpdate };
    },
    staleTime: 60_000,
  });

  const hasNoData = !isLoading && trackerIds.length === 0;
  const hasNoReports = !isLoading && data && data.deteriorating.length === 0 && data.improving.length === 0 && trackerIds.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Latest Signals</h3>
        {data?.lastUpdate && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(data.lastUpdate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {hasNoData && (
        <p className="text-xs text-muted-foreground py-2">
          Activate monitors to see signal summaries.
        </p>
      )}

      {hasNoReports && (
        <p className="text-xs text-muted-foreground py-2">
          Run your first scan to generate signals.
        </p>
      )}

      {/* Requiring Attention */}
      {data && data.deteriorating.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-medium text-destructive">Requiring Attention</span>
          </div>
          {data.deteriorating.map((item, i) => (
            <div
              key={i}
              className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3 text-destructive flex-shrink-0" />
                <span className="text-[11px] font-medium text-destructive truncate">
                  {item.trackerName}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {item.signal}
              </p>
            </div>
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
            <div
              key={i}
              className="rounded-md border border-emerald-600/20 bg-emerald-600/5 p-2.5 space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span className="text-[11px] font-medium text-emerald-600 truncate">
                  {item.trackerName}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {item.signal}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
