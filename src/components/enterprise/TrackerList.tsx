import { useState } from "react";
import { format } from "date-fns";
import { FolderPlus, ChevronRight, RefreshCw, Loader2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  setup: "secondary",
  paused: "outline",
};

/** Truncate to ~first 2 sentences or 120 chars */
const summarise = (content: string): string => {
  const cleaned = content.replace(/^#+\s.+$/gm, "").replace(/\*\*/g, "").trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).slice(0, 5).join(" ");
  return sentences.length > 350 ? sentences.slice(0, 347) + "…" : sentences;
};

const TrackerList = ({ trackers, isLoading, onSelectTracker }: TrackerListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scanningId, setScanningId] = useState<string | null>(null);

  const trackerIds = trackers.map((t) => t.id);

  // Fetch latest report per tracker in one query
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

      // Keep only the latest per tracker
      const map: Record<string, { summary: string; date: string }> = {};
      for (const row of data ?? []) {
        const r = row as any;
        if (!map[r.tracker_id]) {
          map[r.tracker_id] = {
            summary: summarise(r.report_content),
            date: r.created_at,
          };
        }
      }
      return map;
    },
  });

  const handleScanNow = async (e: React.MouseEvent, tracker: EnterpriseTracker) => {
    e.stopPropagation();
    setScanningId(tracker.id);
    try {
      const { error } = await supabase.functions.invoke("run-monitor-scan", {
        body: { tracker_id: tracker.id },
      });
      if (error) throw error;
      toast({ title: "Scan complete", description: `Report generated for "${tracker.name}".` });
      queryClient.invalidateQueries({ queryKey: ["enterprise_trackers"] });
      queryClient.invalidateQueries({ queryKey: ["monitor_reports", tracker.id] });
      queryClient.invalidateQueries({ queryKey: ["monitor_reports_latest"] });
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setScanningId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
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

        return (
          <div
            key={t.id}
            className="flex items-center gap-4 p-3 rounded-md border border-border/50 hover:border-primary/40 cursor-pointer transition-colors group"
            onClick={() => onSelectTracker?.(t)}
          >
            {/* Name + summary */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{t.name}</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 shrink-0">{typeMeta?.label}</span>
                <Badge variant={statusVariant[t.status] ?? "secondary"} className="capitalize text-[10px] shrink-0">
                  {t.status}
                </Badge>
              </div>
              {latest && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-5">
                  {latest.summary}
                </p>
              )}
            </div>

            {/* Dates column */}
            <div className="shrink-0 text-right space-y-1">
              <div className="text-[10px] text-muted-foreground/70">
                <span className="text-muted-foreground/50">Created</span>
                <br />
                {format(new Date(t.created_at), "MMM d, yyyy")}
              </div>
              {latest && (
                <div className="text-[10px] text-muted-foreground/70">
                  <span className="text-muted-foreground/50">Updated</span>
                  <br />
                  {format(new Date(latest.date), "MMM d, yyyy")}
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
