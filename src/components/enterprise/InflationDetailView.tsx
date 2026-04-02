import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, RefreshCw, Loader2, Tag, Package, FileDown } from "lucide-react";
import PDFPreviewModal from "@/components/reports/pdf/PDFPreviewModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import InflationDriverCard from "./InflationDriverCard";
import type { InflationTracker, DriverStatus } from "@/hooks/useInflationTrackers";

interface InflationDetailViewProps {
  tracker: InflationTracker;
  onBack: () => void;
}

const STATUS_COLOR: Record<DriverStatus, string> = {
  deteriorating: "text-destructive",
  improving: "text-highlight",
  stable: "text-info",
};

const InflationDetailView = ({ tracker, onBack }: InflationDetailViewProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);

  const activeDrivers = tracker.drivers.filter(d => d.is_active);

  const lastScanned = activeDrivers
    .map(d => d.last_scanned_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const handleScanNow = async () => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="p-2 rounded-md bg-warning/10">
            <Package className="w-5 h-5 text-warning" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-foreground truncate">{tracker.goods_definition}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px]">
                {activeDrivers.length} driver{activeDrivers.length !== 1 ? "s" : ""}
              </Badge>
              <span className="text-xs text-muted-foreground">Target: {tracker.driver_count_target} drivers</span>
            </div>
          </div>
        </div>
        <Button onClick={handleScanNow} disabled={isScanning} className="gap-1.5 shrink-0">
          {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Scan Now
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Parameters (1/3) */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4" /> Tracker Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="exos-label-caps">Goods / Service</p>
              <p className="text-sm text-foreground mt-0.5 leading-relaxed">
                {tracker.goods_definition}
              </p>
            </div>
            <div>
              <p className="exos-label-caps">Driver Target</p>
              <p className="text-sm text-foreground mt-0.5">
                {tracker.driver_count_target} drivers
              </p>
            </div>
            <Separator />
            <div>
              <p className="exos-label-caps">Status</p>
              <Badge variant="default" className="mt-1 capitalize">
                {tracker.is_active ? "Active" : "Paused"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="exos-label-caps">Created</p>
                <p className="text-sm text-foreground mt-0.5">
                  {format(new Date(tracker.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="exos-label-caps">Updated</p>
                <p className="text-sm text-foreground mt-0.5">
                  {lastScanned ? format(new Date(lastScanned), "MMM d, yyyy") : "—"}
                </p>
              </div>
            </div>
            <div>
              <p className="exos-label-caps">Driver Summary</p>
              <div className="mt-1 space-y-0.5">
                {(["deteriorating", "improving", "stable"] as DriverStatus[]).map(status => {
                  const count = activeDrivers.filter(d => d.current_status === status).length;
                  if (count === 0) return null;
                  return (
                    <p key={status} className={`text-xs font-medium capitalize ${STATUS_COLOR[status]}`}>
                      {count} {status}
                    </p>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Driver list (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Tag className="w-4 h-4" /> Active Drivers ({activeDrivers.length})
          </h3>

          {activeDrivers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No active drivers yet. Run a scan to generate inflation drivers.
                </p>
              </CardContent>
            </Card>
          ) : (
            activeDrivers.map(d => (
              <InflationDriverCard key={d.id} driver={d} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InflationDetailView;
