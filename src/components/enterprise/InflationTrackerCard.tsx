import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Package, Newspaper, RefreshCw, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import InflationDriverCard from "./InflationDriverCard";
import type { InflationTracker } from "@/hooks/useInflationTrackers";
import { useInflationTrackers } from "@/hooks/useInflationTrackers";

interface Props {
  tracker: InflationTracker;
}

const MOCK_NEWS = [
  { title: "Commodity prices stabilise amid mixed signals", date: "Mar 27, 2026", source: "Reuters" },
  { title: "EU tariff review expected to impact raw material costs", date: "Mar 25, 2026", source: "FT" },
  { title: "Supply chain disruptions ease in Asian ports", date: "Mar 23, 2026", source: "Bloomberg" },
];

const InflationTrackerCard = ({ tracker }: Props) => {
  const [open, setOpen] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const activeDrivers = tracker.drivers.filter(d => d.is_active);

  const handleScanNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsScanning(true);
    try {
      const { error } = await supabase.functions.invoke("run-inflation-scan", {
        body: { tracker_id: tracker.id },
      });
      if (error) throw error;
      toast({ title: "Scan complete", description: `Inflation scan completed for "${tracker.goods_definition}".` });
      queryClient.invalidateQueries({ queryKey: ["inflation_trackers"] });
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-4 pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-warning/10">
                  <Package className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{tracker.goods_definition}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(tracker.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={isScanning}
                  onClick={handleScanNow}
                >
                  {isScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Scan Now
                </Button>
                <Badge variant="secondary" className="text-xs">
                  {activeDrivers.length} driver{activeDrivers.length !== 1 ? "s" : ""}
                </Badge>
                {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-6 pb-4">
            {activeDrivers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No active drivers.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 2/3 — Driver list */}
                <div className="lg:col-span-2 space-y-2">
                  {activeDrivers.map(d => (
                    <InflationDriverCard key={d.id} driver={d} />
                  ))}
                </div>

                {/* 1/3 — Latest news sidebar */}
                <div>
                  <Card className="border-iris/25 bg-iris/5 dark:bg-surface sticky top-24">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5">
                        <Newspaper className="w-3.5 h-3.5" /> Latest Signals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {MOCK_NEWS.map((n, i) => (
                        <div key={i} className="space-y-0.5">
                          <p className="text-xs font-medium text-foreground leading-snug">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground">{n.source} · {n.date}</p>
                        </div>
                      ))}
                      <p className="text-[10px] text-muted-foreground/60 pt-1">
                        News will auto-update once scanning is live.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default InflationTrackerCard;
