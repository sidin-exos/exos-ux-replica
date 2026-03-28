import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Package, Newspaper } from "lucide-react";
import InflationDriverCard from "./InflationDriverCard";
import type { InflationTracker } from "@/hooks/useInflationTrackers";

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
  const activeDrivers = tracker.drivers.filter(d => d.is_active);

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
