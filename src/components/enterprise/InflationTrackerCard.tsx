
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Package, Trash2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
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

  // Decorative left border uses the platform accent (copper) — never status colours,
  // to avoid clashing with the red/green semantics of "deteriorating"/"improving".
  const borderClass = "border-l-copper/60";

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
            {activeDrivers.map(d => {
              const StatusIcon =
                d.current_status === "deteriorating" ? TrendingDown :
                d.current_status === "improving" ? TrendingUp : Minus;
              const statusTextCls =
                d.current_status === "deteriorating" ? "text-destructive" :
                d.current_status === "improving" ? "text-success" :
                "text-muted-foreground";
              return (
                <HoverCard key={d.id} openDelay={120} closeDelay={80}>
                  <HoverCardTrigger asChild>
                    <span
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground cursor-default"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass[d.current_status] || "bg-muted-foreground"}`} />
                      {d.driver_name}
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="top"
                    align="start"
                    className="w-72 p-3 animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">{d.driver_name}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${statusTextCls} shrink-0`}>
                          <StatusIcon className="w-3 h-3" />
                          {d.current_status}
                        </span>
                      </div>
                      {d.rationale && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-4">
                          {d.rationale}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
                        <span className="text-[10px] text-muted-foreground/70">
                          {d.source ? `Source: ${d.source}` : "—"}
                        </span>
                        {d.last_scanned_at && (
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(d.last_scanned_at), "d MMM")}
                          </span>
                        )}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
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
