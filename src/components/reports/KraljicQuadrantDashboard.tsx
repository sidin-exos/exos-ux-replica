import { Grid3X3, Shield, Filter, ClipboardList, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KraljicData } from "@/lib/dashboard-data-parser";

type Quadrant = "strategic" | "leverage" | "bottleneck" | "non-critical";

interface PositionedItem {
  id: string;
  name: string;
  supplyRisk: number;
  businessImpact: number;
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

const quadrantConfig: Record<Quadrant, {
  label: string;
  strategy: string;
  description: string;
  borderColor: string;
  bgClass: string;
  accentClass: string;
  icon: typeof Shield;
}> = {
  leverage: {
    label: "Leverage",
    strategy: "Maximize Value",
    description:
      "High profit impact with low supply risk. Use competitive tendering, consolidate spend across business units and renegotiate contracts to capture price reductions. Maintain a broad supplier base to preserve buyer power.",
    borderColor: "border-primary/60",
    bgClass: "bg-primary/5",
    accentClass: "text-primary",
    icon: Zap,
  },
  strategic: {
    label: "Strategic",
    strategy: "Partner & Collaborate",
    description:
      "High profit impact and high supply risk. Build deep, long-term partnerships with key suppliers and lock in multi-year contracts. Co-invest in joint innovation, capacity planning and risk mitigation to protect continuity.",
    borderColor: "border-warning/60",
    bgClass: "bg-warning/5",
    accentClass: "text-warning",
    icon: Shield,
  },
  "non-critical": {
    label: "Non-Critical",
    strategy: "Simplify & Automate",
    description:
      "Low profit impact and low supply risk. Standardise specifications, automate ordering through catalogues or P-cards and minimise administrative overhead. Focus on process efficiency rather than price negotiation.",
    borderColor: "border-muted-foreground/40",
    bgClass: "bg-muted/30",
    accentClass: "text-muted-foreground",
    icon: ClipboardList,
  },
  bottleneck: {
    label: "Bottleneck",
    strategy: "Secure Supply",
    description:
      "Low profit impact but high supply risk. Diversify sources, qualify alternative suppliers and maintain safety stock to protect operations. Explore substitution, redesign or insourcing to reduce dependency over time.",
    borderColor: "border-accent-foreground/40",
    bgClass: "bg-accent/30",
    accentClass: "text-accent-foreground",
    icon: Filter,
  },
};

const getQuadrant = (supplyRisk: number, businessImpact: number): Quadrant => {
  if (supplyRisk >= 50 && businessImpact >= 50) return "strategic";
  if (supplyRisk < 50 && businessImpact >= 50) return "leverage";
  if (supplyRisk >= 50 && businessImpact < 50) return "bottleneck";
  return "non-critical";
};

const quadrantOrder: [Quadrant, Quadrant, Quadrant, Quadrant] = ["leverage", "strategic", "non-critical", "bottleneck"];

const KraljicQuadrantDashboard = ({
  title = "Kraljic Matrix",
  subtitle = "Strategic positioning",
  items = defaultItems,
  parsedData,
}: KraljicQuadrantDashboardProps) => {
  const effectiveItems = parsedData?.items || items;

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

      <CardContent className="space-y-5">
        {/* Two-column layout: Matrix left, Strategies right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: 2x2 Matrix */}
          <div className="relative">
            {/* Y-axis label */}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-muted-foreground whitespace-nowrap tracking-wider uppercase">
              Profit Impact
            </div>
            {/* High / Low Y labels */}
            <div className="absolute left-3 top-1 text-[9px] text-muted-foreground/70">High</div>
            

            {/* Grid */}
            <div className="ml-8 grid grid-cols-2 grid-rows-2 border border-border/30 rounded-lg overflow-hidden">
              {quadrantOrder.map((q, idx) => {
                const config = quadrantConfig[q];
                const Icon = config.icon;
                const qItems = groupedItems[q] || [];
                return (
                  <div
                    key={q}
                    className={`relative p-3 min-h-[120px] flex flex-col border-2 ${config.borderColor} ${config.bgClass} ${
                      idx === 0 ? "rounded-tl-md border-r-0 border-b-0" :
                      idx === 1 ? "rounded-tr-md border-b-0" :
                      idx === 2 ? "rounded-bl-md border-r-0" :
                      "rounded-br-md"
                    }`}
                  >
                    <div className={`text-xs font-semibold ${config.accentClass} mb-1`}>{config.label}</div>
                    <div className="flex flex-wrap gap-1 mt-1 flex-1">
                      {qItems.map((item) => (
                        <Badge key={item.id} variant="outline" className="text-[10px] bg-background/60 h-5 px-1.5">
                          {item.id}
                        </Badge>
                      ))}
                    </div>
                    {/* Centered icon */}
                    <div className="absolute bottom-2 right-2">
                      <div className={`w-7 h-7 rounded-full bg-background/80 border ${config.borderColor} flex items-center justify-center`}>
                        <Icon className={`w-3.5 h-3.5 ${config.accentClass}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis */}
            <div className="ml-8 flex justify-between mt-1.5 px-1">
              <span className="text-[9px] text-muted-foreground/70">Low</span>
              <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">Supply Risk</span>
              <span className="text-[9px] text-muted-foreground/70">High</span>
            </div>
          </div>

          {/* Right: Strategy descriptions */}
          <div className="space-y-3">
            {(["strategic", "leverage", "bottleneck", "non-critical"] as Quadrant[]).map((q) => {
              const config = quadrantConfig[q];
              const count = (groupedItems[q] || []).length;
              return (
                <div key={q} className={`rounded-md border ${config.borderColor} p-3 ${config.bgClass}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-24 shrink-0">
                      <p className={`text-xs font-semibold ${config.accentClass}`}>
                        {config.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {count} item{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="flex-1 text-[11px] text-muted-foreground leading-relaxed">
                      {config.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Item Legend */}
        <div className="pt-3 border-t border-border/20">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {effectiveItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Badge variant="outline" className="w-5 h-5 rounded-full justify-center p-0 text-[10px]">
                  {item.id}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground truncate text-[11px]">{item.name}</p>
                  {item.spend && <p className="text-muted-foreground text-[10px]">{item.spend}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KraljicQuadrantDashboard;
