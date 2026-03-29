import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Package } from "lucide-react";
import type { InflationTracker } from "@/hooks/useInflationTrackers";

interface Props {
  tracker: InflationTracker;
  onSelect?: (tracker: InflationTracker) => void;
}

/** Summarise driver info into a short preview string */
const buildPreview = (tracker: InflationTracker): string => {
  const activeDrivers = tracker.drivers.filter(d => d.is_active);
  if (activeDrivers.length === 0) return "No active drivers configured yet. Open to set up inflation monitoring.";

  const driverNames = activeDrivers.slice(0, 3).map(d => d.driver_name).join(", ");
  const statusCounts = activeDrivers.reduce(
    (acc, d) => {
      acc[d.current_status] = (acc[d.current_status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusParts: string[] = [];
  if (statusCounts.deteriorating) statusParts.push(`${statusCounts.deteriorating} deteriorating`);
  if (statusCounts.improving) statusParts.push(`${statusCounts.improving} improving`);
  if (statusCounts.stable) statusParts.push(`${statusCounts.stable} stable`);

  const statusSummary = statusParts.length > 0 ? ` Status: ${statusParts.join(", ")}.` : "";
  const moreCount = activeDrivers.length > 3 ? ` +${activeDrivers.length - 3} more.` : "";

  return `Tracking ${activeDrivers.length} inflation driver${activeDrivers.length !== 1 ? "s" : ""}: ${driverNames}${moreCount}${statusSummary}`;
};

const InflationTrackerCard = ({ tracker, onSelect }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const activeDrivers = tracker.drivers.filter(d => d.is_active);
  const preview = buildPreview(tracker);

  const lastScanned = activeDrivers
    .map(d => d.last_scanned_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return (
    <div
      className="flex items-center gap-4 p-3 rounded-md border border-border/50 hover:border-primary/40 cursor-pointer transition-colors group"
      onClick={() => onSelect?.(tracker)}
    >
      {/* Icon */}
      <div className="p-1.5 rounded-md bg-warning/10 shrink-0">
        <Package className="w-4 h-4 text-warning" />
      </div>

      {/* Name + preview */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {tracker.goods_definition}
          </span>
          <Badge variant="secondary" className="text-xs shrink-0">
            {activeDrivers.length} driver{activeDrivers.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <p
          className={`text-xs text-muted-foreground leading-relaxed mt-1 ${expanded ? "" : "line-clamp-2"}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {preview}
        </p>
        {!expanded && preview.length > 120 && (
          <button
            className="text-[10px] text-primary hover:underline mt-0.5"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
          >
            Show more
          </button>
        )}
      </div>

      {/* Dates column */}
      <div className="shrink-0 text-right space-y-1">
        <div className="text-xs text-muted-foreground/70">
          <span className="text-muted-foreground/50">Created</span>
          <br />
          {format(new Date(tracker.created_at), "MMM d, yyyy")}
        </div>
        {lastScanned && (
          <div className="text-xs text-muted-foreground/70">
            <span className="text-muted-foreground/50">Updated</span>
            <br />
            {format(new Date(lastScanned), "MMM d, yyyy")}
          </div>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </div>
  );
};

export default InflationTrackerCard;
