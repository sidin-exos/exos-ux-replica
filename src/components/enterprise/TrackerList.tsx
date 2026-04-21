import { useState } from "react";
import { format } from "date-fns";
import { FolderPlus, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MONITOR_TYPE_META } from "@/hooks/useEnterpriseTrackers";
import type { EnterpriseTracker, MonitorType, MonitorParameters } from "@/hooks/useEnterpriseTrackers";

interface TrackerListProps {
  trackers: EnterpriseTracker[];
  isLoading: boolean;
  onSelectTracker?: (tracker: EnterpriseTracker) => void;
}

const statusDotClass: Record<string, string> = {
  deteriorating: "bg-destructive",
  improving: "bg-success",
  stable: "bg-accent",
};

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

function classifySignal(content: string): "deteriorating" | "improving" | "stable" {
  const lower = content.toLowerCase();
  let detScore = 0;
  let impScore = 0;
  for (const kw of DETERIORATING_KEYWORDS) {
    const matches = lower.match(new RegExp(kw, "gi"));
    if (matches) detScore += matches.length;
  }
  for (const kw of IMPROVING_KEYWORDS) {
    const matches = lower.match(new RegExp(kw, "gi"));
    if (matches) impScore += matches.length;
  }
  if (detScore > impScore * 1.3) return "deteriorating";
  if (impScore > detScore * 1.3) return "improving";
  return "stable";
}

const TrackerList = ({ trackers, isLoading, onSelectTracker }: TrackerListProps) => {
  const trackerIds = trackers.map((t) => t.id);

  const { data: latestReports = {} } = useQuery({
    queryKey: ["monitor_reports_latest", trackerIds],
    enabled: trackerIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitor_reports" as any)
        .select("tracker_id, report_content, created_at")
        .in("tracker_id", trackerIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const map: Record<string, { status: "deteriorating" | "improving" | "stable"; date: string }> = {};
      for (const row of data ?? []) {
        const r = row as any;
        if (!map[r.tracker_id]) {
          map[r.tracker_id] = {
            status: classifySignal(r.report_content || ""),
            date: r.created_at,
          };
        }
      }
      return map;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
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
    <div className="space-y-1.5">
      {trackers.map((t) => {
        const params = t.parameters as MonitorParameters;
        const monitorType = (params?.monitor_type ?? "DM-2") as MonitorType;
        const typeMeta = MONITOR_TYPE_META[monitorType];
        const latest = latestReports[t.id];
        const status = latest?.status;
        const dotClass = status ? statusDotClass[status] : "bg-muted-foreground/40";

        return (
          <div
            key={t.id}
            className="group flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/40 cursor-pointer transition-colors"
            onClick={() => onSelectTracker?.(t)}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`}
              title={status ? `Status: ${status}` : "No reports yet"}
            />
            <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate flex-1">
              {t.name}
            </span>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {typeMeta?.label}
            </span>
            {latest && (
              <span className="text-[11px] text-muted-foreground/70 shrink-0 hidden sm:inline">
                {format(new Date(latest.date), "MMM d")}
              </span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
          </div>
        );
      })}
    </div>
  );
};

export default TrackerList;
