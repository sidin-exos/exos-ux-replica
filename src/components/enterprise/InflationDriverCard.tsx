import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarClock } from "lucide-react";
import type { InflationDriver, DriverStatus } from "@/hooks/useInflationTrackers";

const STATUS_META: Record<DriverStatus, { label: string; className: string }> = {
  improving: { label: "Improving", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  stable: { label: "Stable", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  deteriorating: { label: "Deteriorating", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

interface Props {
  driver: InflationDriver;
}

const InflationDriverCard = ({ driver }: Props) => {
  const status = STATUS_META[driver.current_status] ?? STATUS_META.stable;

  return (
    <Card className="border-border/60">
      <CardContent className="pt-4 pb-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">{driver.driver_name}</p>
            {driver.rationale && (
              <p className="text-xs text-muted-foreground line-clamp-2">{driver.rationale}</p>
            )}
          </div>
          <Badge variant="outline" className={`shrink-0 ${status.className}`}>
            {status.label}
          </Badge>
        </div>

        {driver.weight != null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Weight</span>
              <span className="text-xs font-medium text-foreground">{driver.weight}</span>
            </div>
            <Progress value={driver.weight} className="h-1.5" />
          </div>
        )}

        {driver.context_summary && (
          <p className="text-xs text-muted-foreground line-clamp-2">{driver.context_summary}</p>
        )}

        {driver.last_scanned_at && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="w-3 h-3" />
            <span>Last scan: {new Date(driver.last_scanned_at).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InflationDriverCard;
