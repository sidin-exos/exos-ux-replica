import { useState } from "react";
import { format } from "date-fns";
import { FolderPlus, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
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

const TrackerList = ({ trackers, isLoading, onSelectTracker }: TrackerListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scanningId, setScanningId] = useState<string | null>(null);

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trackers.map((t) => {
        const params = t.parameters as MonitorParameters;
        const monitorType = (params?.monitor_type ?? "DM-2") as MonitorType;
        const typeMeta = MONITOR_TYPE_META[monitorType];

        return (
          <Card
            key={t.id}
            className="cursor-pointer hover:border-primary/40 transition-colors group"
            onClick={() => onSelectTracker?.(t)}
          >
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <div className="min-w-0">
                <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">{t.name}</CardTitle>
                <span className="text-[10px] text-muted-foreground mt-1">{typeMeta?.label}</span>
              </div>
              <Badge variant={statusVariant[t.status] ?? "secondary"} className="shrink-0 capitalize">
                {t.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Created {format(new Date(t.created_at), "MMM d, yyyy")}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    disabled={scanningId === t.id}
                    onClick={(e) => handleScanNow(e, t)}
                  >
                    {scanningId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Scan Now
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TrackerList;
