import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Package } from "lucide-react";
import InflationDriverCard from "./InflationDriverCard";
import type { InflationTracker } from "@/hooks/useInflationTrackers";

interface Props {
  tracker: InflationTracker;
}

const InflationTrackerCard = ({ tracker }: Props) => {
  const [open, setOpen] = useState(true);
  const activeDrivers = tracker.drivers.filter(d => d.is_active);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
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
                <Badge variant="secondary" className="text-xs">
                  {activeDrivers.length} driver{activeDrivers.length !== 1 ? "s" : ""}
                </Badge>
                {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-4 space-y-2">
            {activeDrivers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No active drivers.</p>
            ) : (
              activeDrivers.map(d => <InflationDriverCard key={d.id} driver={d} />)
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default InflationTrackerCard;
