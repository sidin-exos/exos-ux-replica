
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

const statusDotClass: Record<string, string> = {
  deteriorating: "bg-destructive",
  improving: "bg-success",
  stable: "bg-accent",
};

const InflationTrackerCard = ({ tracker, onSelect, onDelete }: Props) => {
  const activeDrivers = tracker.drivers.filter(d => d.is_active);

  const lastScanned = activeDrivers
    .map(d => d.last_scanned_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const dominantStatus = getDominantStatus(tracker);
  const borderClass = statusBorderClass[dominantStatus] || statusBorderClass.none;

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-md border border-border/50 border-l-[3px] ${borderClass} hover:border-primary/40 cursor-pointer transition-all group hover:shadow-sm`}
      onClick={() => onSelect?.(tracker)}
    >
      {/* Icon */}
      <div className="p-1.5 rounded-md bg-copper/10 shrink-0">
        <Package className="w-4 h-4 text-copper" />
      </div>

      {/* Name + driver chips */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {tracker.goods_definition}
          </span>
          <span className="text-[10px] font-medium border rounded px-1.5 py-0.5 bg-iris/10 text-iris border-iris/30 shrink-0">
            {activeDrivers.length} driver{activeDrivers.length !== 1 ? "s" : ""}
          </span>
        </div>
        {activeDrivers.length === 0 ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            No active drivers configured yet. Open to set up inflation monitoring.
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {activeDrivers.map(d => (
              <span
                key={d.id}
                title={`${d.driver_name} — ${d.current_status}`}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass[d.current_status] || "bg-muted-foreground"}`} />
                {d.driver_name}
              </span>
            ))}
          </div>
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
