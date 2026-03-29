import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock, Radio } from "lucide-react";
import type { InflationDriver, DriverStatus } from "@/hooks/useInflationTrackers";

const STATUS_META: Record<DriverStatus, { label: string; className: string }> = {
  improving: { label: "Improving", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  stable: { label: "Stable", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  deteriorating: { label: "Deteriorating", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const CADENCE_LABELS: Record<string, string> = {
  daily: "Daily",
  twice_weekly: "2× / week",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
};

interface Props {
  driver: InflationDriver;
}

const InflationDriverCard = ({ driver }: Props) => {
  const status = STATUS_META[driver.current_status] ?? STATUS_META.stable;
  const cadenceLabel = CADENCE_LABELS[driver.scan_cadence] ?? driver.scan_cadence;

  return (
    <div className="rounded-lg border border-border/60 p-3 space-y-2">
      {/* Header: name + status + meta inline */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{driver.driver_name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Radio className="w-3 h-3" />{cadenceLabel}</span>
            {driver.weight != null && <span>Weight: <span className="font-medium text-foreground">{driver.weight}</span></span>}
            {driver.rationale && <span className="hidden sm:inline">· {driver.rationale}</span>}
          </div>
        </div>
        <Badge variant="outline" className={`shrink-0 ${status.className}`}>
          {status.label}
        </Badge>
      </div>

      {/* Rationale on mobile */}
      {driver.rationale && (
        <p className="text-xs text-muted-foreground leading-relaxed sm:hidden">{driver.rationale}</p>
      )}

      {/* Status summary */}
      <div className="rounded-md bg-muted/40 px-3 py-2 space-y-0.5">
        <p className="text-xs text-foreground leading-relaxed">
          {driver.context_summary
            ? driver.context_summary
            : driver.current_status === "stable"
              ? "No significant changes detected. Market conditions remain within expected range."
              : driver.current_status === "improving"
                ? "Positive trend detected. Conditions are moving favourably."
                : "Negative trend detected. Conditions require attention."}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Last updated: {driver.last_scanned_at
            ? new Date(driver.last_scanned_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
            : "Awaiting first scan"}
        </p>
      </div>

      {/* Trigger */}
      {driver.trigger_description && (
        <div className="rounded-md border border-border/40 px-3 py-2">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[11px] text-muted-foreground font-medium">Trigger</p>
            <p className="text-[10px] text-muted-foreground">
              {driver.last_scanned_at
                ? new Date(driver.last_scanned_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                : "Pending"}
            </p>
          </div>
          <p className="text-xs text-foreground">{driver.trigger_description}</p>
        </div>
      )}
    </div>
  );
};

export default InflationDriverCard;
