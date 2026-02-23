import { Grid3X3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KraljicData } from "@/lib/dashboard-data-parser";

type Quadrant = "strategic" | "leverage" | "bottleneck" | "non-critical";

interface PositionedItem {
  id: string;
  name: string;
  supplyRisk: number; // 0-100
  businessImpact: number; // 0-100
  spend?: string;
}

interface KraljicQuadrantDashboardProps {
  title?: string;
  subtitle?: string;
  items?: PositionedItem[];
  parsedData?: KraljicData;
}

const defaultItems: PositionedItem[] = [
  { id: "A", name: "Custom Electronics", supplyRisk: 85, businessImpact: 90, spend: "$2.1M" },
  { id: "B", name: "Specialty Chemicals", supplyRisk: 75, businessImpact: 70, spend: "$890K" },
  { id: "C", name: "Precision Motors", supplyRisk: 80, businessImpact: 35, spend: "$340K" },
  { id: "D", name: "Commodity Steel", supplyRisk: 25, businessImpact: 75, spend: "$1.5M" },
  { id: "E", name: "Office Supplies", supplyRisk: 15, businessImpact: 10, spend: "$45K" },
  { id: "F", name: "Standard Packaging", supplyRisk: 30, businessImpact: 25, spend: "$180K" },
];

const quadrantConfig: Record<Quadrant, { label: string; strategy: string; className: string }> = {
  strategic: { label: "Strategic", strategy: "Partner & Collaborate", className: "bg-primary/20 border-primary/40" },
  leverage: { label: "Leverage", strategy: "Maximize Value", className: "bg-success/20 border-success/40" },
  bottleneck: { label: "Bottleneck", strategy: "Secure Supply", className: "bg-warning/20 border-warning/40" },
  "non-critical": { label: "Non-Critical", strategy: "Simplify & Automate", className: "bg-muted border-border" },
};

const getQuadrant = (supplyRisk: number, businessImpact: number): Quadrant => {
  if (supplyRisk >= 50 && businessImpact >= 50) return "strategic";
  if (supplyRisk < 50 && businessImpact >= 50) return "leverage";
  if (supplyRisk >= 50 && businessImpact < 50) return "bottleneck";
  return "non-critical";
};

const KraljicQuadrantDashboard = ({
  title = "Kraljic Matrix",
  subtitle = "Strategic positioning",
  items = defaultItems,
  parsedData,
}: KraljicQuadrantDashboardProps) => {
  const effectiveItems = parsedData?.items || items;
  // Group items by quadrant
  const groupedItems = effectiveItems.reduce((acc, item) => {
    const quadrant = getQuadrant(item.supplyRisk, item.businessImpact);
    if (!acc[quadrant]) acc[quadrant] = [];
    acc[quadrant].push(item);
    return acc;
  }, {} as Record<Quadrant, PositionedItem[]>);

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <Grid3X3 className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <CardTitle className="font-display text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 2x2 Matrix Grid */}
        <div className="relative aspect-square max-h-64">
          {/* Axis labels */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground whitespace-nowrap">
            Supply Risk →
          </div>
          <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            Business Impact →
          </div>

          {/* Grid container */}
          <div className="ml-4 h-full grid grid-cols-2 grid-rows-2 gap-1">
            {/* Top row: Bottleneck | Strategic */}
            <div className={`rounded-tl-lg p-2 ${quadrantConfig.bottleneck.className} border`}>
              <div className="text-xs font-medium text-foreground mb-1">{quadrantConfig.bottleneck.label}</div>
              <div className="flex flex-wrap gap-1">
                {groupedItems.bottleneck?.map((item) => (
                  <Badge key={item.id} variant="outline" className="text-xs bg-background/50">
                    {item.id}
                  </Badge>
                ))}
              </div>
            </div>
            <div className={`rounded-tr-lg p-2 ${quadrantConfig.strategic.className} border`}>
              <div className="text-xs font-medium text-foreground mb-1">{quadrantConfig.strategic.label}</div>
              <div className="flex flex-wrap gap-1">
                {groupedItems.strategic?.map((item) => (
                  <Badge key={item.id} variant="outline" className="text-xs bg-background/50">
                    {item.id}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Bottom row: Non-Critical | Leverage */}
            <div className={`rounded-bl-lg p-2 ${quadrantConfig["non-critical"].className} border`}>
              <div className="text-xs font-medium text-foreground mb-1">{quadrantConfig["non-critical"].label}</div>
              <div className="flex flex-wrap gap-1">
                {groupedItems["non-critical"]?.map((item) => (
                  <Badge key={item.id} variant="outline" className="text-xs bg-background/50">
                    {item.id}
                  </Badge>
                ))}
              </div>
            </div>
            <div className={`rounded-br-lg p-2 ${quadrantConfig.leverage.className} border`}>
              <div className="text-xs font-medium text-foreground mb-1">{quadrantConfig.leverage.label}</div>
              <div className="flex flex-wrap gap-1">
                {groupedItems.leverage?.map((item) => (
                  <Badge key={item.id} variant="outline" className="text-xs bg-background/50">
                    {item.id}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Item Legend */}
        <div className="pt-3 border-t border-border/30">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {effectiveItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 rounded-full justify-center p-0">
                  {item.id}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground truncate">{item.name}</p>
                  {item.spend && <p className="text-muted-foreground">{item.spend}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Summary */}
        <div className="pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Recommended Strategies:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(["strategic", "leverage", "bottleneck", "non-critical"] as Quadrant[]).map((q) => (
              <div key={q} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded ${quadrantConfig[q].className.replace("/20", "")}`} />
                <span className="text-muted-foreground">{quadrantConfig[q].strategy}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KraljicQuadrantDashboard;
