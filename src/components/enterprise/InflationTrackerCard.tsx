import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Package, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { InflationTracker } from "@/hooks/useInflationTrackers";

interface Props {
  tracker: InflationTracker;
  onSelect?: (tracker: InflationTracker) => void;
  onDelete?: (trackerId: string) => void;
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

/** Get dominant status for border colour */
const getDominantStatus = (tracker: InflationTracker): string => {
  const activeDrivers = tracker.drivers.filter(d => d.is_active);
  if (activeDrivers.length === 0) return "none";
  const counts: Record<string, number> = {};
  activeDrivers.forEach(d => { counts[d.current_status] = (counts[d.current_status] || 0) + 1; });
  if (counts.deteriorating && counts.deteriorating > 0) return "deteriorating";
  if (counts.improving && counts.improving > 0) return "improving";
  return "stable";
};

const statusBorderClass: Record<string, string> = {
  deteriorating: "border-l-destructive",
  improving: "border-l-success",
  stable: "border-l-accent",
  none: "border-l-muted-foreground",
};

const statusBadgeClass: Record<string, string> = {
  deteriorating: "bg-destructive/15 text-destructive border-destructive/30",
  improving: "bg-success/15 text-success border-success/30",
  stable: "bg-accent/15 text-accent border-accent/30",
};

const InflationTrackerCard = ({ tracker, onSelect, onDelete }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const activeDrivers = tracker.drivers.filter(d => d.is_active);
  const preview = buildPreview(tracker);

  const lastScanned = activeDrivers
    .map(d => d.last_scanned_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const dominantStatus = getDominantStatus(tracker);
  const borderClass = statusBorderClass[dominantStatus] || statusBorderClass.none;

  // Build per-status mini badges
  const statusCounts = activeDrivers.reduce(
    (acc, d) => { acc[d.current_status] = (acc[d.current_status] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-md border border-border/50 border-l-[3px] ${borderClass} hover:border-primary/40 cursor-pointer transition-all group hover:shadow-sm`}
      onClick={() => onSelect?.(tracker)}
    >
      {/* Icon */}
      <div className="p-1.5 rounded-md bg-copper/10 shrink-0">
        <Package className="w-4 h-4 text-copper" />
      </div>

      {/* Name + preview */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {tracker.goods_definition}
          </span>
          <span className="text-[10px] font-medium border rounded px-1.5 py-0.5 bg-iris/10 text-iris border-iris/30 shrink-0">
            {activeDrivers.length} driver{activeDrivers.length !== 1 ? "s" : ""}
          </span>
          {Object.entries(statusCounts).map(([status, count]) => (
            <span
              key={status}
              className={`text-[10px] font-medium border rounded-full px-2 py-0.5 capitalize shrink-0 ${statusBadgeClass[status] || "bg-muted text-muted-foreground border-border"}`}
            >
              {count} {status}
            </span>
          ))}
        </div>
        <p
          className={`text-xs text-muted-foreground leading-relaxed mt-1.5 ${expanded ? "" : "line-clamp-2"}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {preview}
        </p>
        {!expanded && preview.length > 120 && (
          <button
            className="text-[11px] font-semibold text-primary hover:text-primary/80 underline underline-offset-2 mt-0.5"
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
        <div className="text-[11px]">
          <span className="text-muted-foreground/60 block">Created</span>
          <span className="text-muted-foreground">{format(new Date(tracker.created_at), "MMM d, yyyy")}</span>
        </div>
        {lastScanned && (
          <div className="text-[11px]">
            <span className="text-muted-foreground/60 block">Updated</span>
            <span className="text-muted-foreground">{format(new Date(lastScanned), "MMM d, yyyy")}</span>
          </div>
        )}
      </div>

      {/* Delete button */}
      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
              title="Delete tracker"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete tracker</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{tracker.goods_definition}"? This will also remove all associated drivers and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(tracker.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </div>
  );
};

export default InflationTrackerCard;
