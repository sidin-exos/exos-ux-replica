import { format } from "date-fns";
import { Eye, FolderPlus, ArrowUp, ArrowDown, ArrowRight, ChevronsUp, ChevronsDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDrsBand, DRS_BAND_META, MONITOR_TYPE_META } from "@/hooks/useEnterpriseTrackers";
import type { EnterpriseTracker, MonitorType, MonitorParameters } from "@/hooks/useEnterpriseTrackers";

interface TrackerListProps {
  trackers: EnterpriseTracker[];
  isLoading: boolean;
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  setup: "secondary",
  paused: "outline",
};

/** Renders a Δ arrow indicator — placeholder until backend scoring is live */
const DeltaIndicator = ({ delta }: { delta?: number }) => {
  if (delta === undefined || delta === null) {
    return <span className="text-xs text-muted-foreground italic">Awaiting data</span>;
  }

  if (delta > 10) return <span className="flex items-center gap-0.5 text-emerald-600 font-semibold text-sm"><ChevronsUp className="w-4 h-4" />+{delta}</span>;
  if (delta > 3) return <span className="flex items-center gap-0.5 text-emerald-600 font-medium text-sm"><ArrowUp className="w-4 h-4" />+{delta}</span>;
  if (delta >= -3) return <span className="flex items-center gap-0.5 text-muted-foreground font-medium text-sm"><ArrowRight className="w-4 h-4" />{delta >= 0 ? `+${delta}` : delta}</span>;
  if (delta >= -10) return <span className="flex items-center gap-0.5 text-amber-600 font-medium text-sm"><ArrowDown className="w-4 h-4" />{delta}</span>;
  return <span className="flex items-center gap-0.5 text-destructive font-semibold text-sm"><ChevronsDown className="w-4 h-4" />{delta}</span>;
};

/** Renders DRS score badge with band color */
const DrsScoreBadge = ({ score }: { score?: number }) => {
  if (score === undefined || score === null) {
    return <Badge variant="outline" className="text-[10px]">DRS —</Badge>;
  }
  const band = getDrsBand(score);
  const meta = DRS_BAND_META[band];
  return (
    <Badge variant="outline" className={`text-[10px] ${meta.color} border-current/30`}>
      DRS {score} · Band {band}
    </Badge>
  );
};

const TrackerList = ({ trackers, isLoading }: TrackerListProps) => {
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
          Create your first monitor from the "New Monitor" tab to start tracking dynamics.
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
        // DRS and delta are placeholder — will come from backend snapshots
        const drsScore = (params as any)?.drs_score as number | undefined;
        const delta = (params as any)?.delta as number | undefined;

        return (
          <Card key={t.id}>
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <div className="min-w-0">
                <CardTitle className="text-base leading-snug">{t.name}</CardTitle>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="secondary" className="text-[10px]">{monitorType}</Badge>
                  {params?.entity_type && (
                    <span className="text-[10px] text-muted-foreground capitalize">{String(params.entity_type)}</span>
                  )}
                </div>
              </div>
              <Badge variant={statusVariant[t.status] ?? "secondary"} className="shrink-0 capitalize">
                {t.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Delta + DRS row */}
              <div className="flex items-center justify-between">
                <DeltaIndicator delta={delta} />
                {typeMeta?.drs && <DrsScoreBadge score={drsScore} />}
                {!typeMeta?.drs && <Badge variant="outline" className="text-[10px]">Evidence Balance</Badge>}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Created {format(new Date(t.created_at), "MMM d, yyyy")}
                </span>
                <Button variant="ghost" size="sm" className="gap-1.5" disabled>
                  <Eye className="w-4 h-4" /> View
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TrackerList;
