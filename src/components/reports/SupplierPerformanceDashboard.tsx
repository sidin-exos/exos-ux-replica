import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupplierScorecardData } from "@/lib/dashboard-data-parser";

interface SupplierPerformanceDashboardProps {
  parsedData?: SupplierScorecardData;
}

const defaultSupplierData = [
  { name: "Alpha Corp", score: 92, trend: "up", spend: "$450K" },
  { name: "Beta Industries", score: 78, trend: "down", spend: "$320K" },
  { name: "Gamma Tech", score: 85, trend: "stable", spend: "$180K" },
  { name: "Delta Services", score: 61, trend: "down", spend: "$275K" },
  { name: "Epsilon Materials", score: 88, trend: "up", spend: "$210K" },
];

// Parse "$450K" / "$1.2M" → number in thousands
const parseSpend = (s: string): number => {
  const m = s.match(/([\d.]+)\s*([KMB]?)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  return unit === "M" ? n * 1000 : unit === "B" ? n * 1_000_000 : n;
};

const SupplierPerformanceDashboard = ({ parsedData }: SupplierPerformanceDashboardProps) => {
  const supplierData = parsedData?.suppliers || defaultSupplierData;

  const spends = supplierData.map((s) => parseSpend(s.spend));
  const maxSpend = Math.max(...spends, 1);

  const getTier = (score: number) => {
    if (score >= 85) return { color: "hsl(var(--success) / 0.55)", label: "≥85" };
    if (score >= 70) return { color: "hsl(var(--warning) / 0.55)", label: "70–84" };
    return { color: "hsl(var(--destructive) / 0.55)", label: "<70" };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-success" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-destructive" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  // Position points: x = spend / maxSpend, y = score / 100
  const points = supplierData.map((s, i) => {
    const x = (spends[i] / maxSpend) * 100;
    const y = s.score;
    return { ...s, x, y, tier: getTier(s.score) };
  });

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Users className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Supplier Scorecard</CardTitle>
              <p className="text-xs text-muted-foreground">Performance vs Spend</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{supplierData.length} suppliers</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quadrant Matrix */}
        <div className="relative pl-8 pb-6">
          <div className="relative h-56 border-l-2 border-b-2 border-border">
            {/* Axis labels */}
            <span className="absolute -left-7 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground origin-center whitespace-nowrap">
              Score →
            </span>
            <span className="absolute -bottom-5 right-0 text-[10px] text-muted-foreground">
              Spend →
            </span>

            {/* Quadrant zones */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="border-r border-b border-dashed border-border bg-success/5 relative">
                <span className="absolute top-1 left-1 text-[9px] font-medium text-success/80 uppercase tracking-wide">
                  Develop
                </span>
              </div>
              <div className="border-b border-dashed border-border bg-success/10 relative">
                <span className="absolute top-1 right-1 text-[9px] font-medium text-success/80 uppercase tracking-wide">
                  Strategic
                </span>
              </div>
              <div className="border-r border-dashed border-border bg-destructive/5 relative">
                <span className="absolute bottom-1 left-1 text-[9px] font-medium text-destructive/80 uppercase tracking-wide">
                  Phase out
                </span>
              </div>
              <div className="bg-warning/5 relative">
                <span className="absolute bottom-1 right-1 text-[9px] font-medium text-warning/80 uppercase tracking-wide">
                  Manage
                </span>
              </div>
            </div>

            {/* Plotted suppliers */}
            {points.map((p) => (
              <div
                key={p.name}
                className="absolute -translate-x-1/2 translate-y-1/2"
                style={{ left: `${p.x}%`, bottom: `${p.y}%` }}
              >
                <div
                  className="w-3 h-3 rounded-full ring-2 ring-background shadow-sm"
                  style={{ backgroundColor: p.tier.color }}
                  title={`${p.name} — ${p.score} / ${p.spend}`}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-foreground whitespace-nowrap">
                  {p.name} <span className="text-muted-foreground">{p.score}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(var(--success))" }} />
            ≥85 Excellent
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(var(--warning))" }} />
            70–84 Good
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(var(--destructive))" }} />
            &lt;70 At risk
          </span>
        </div>

        {/* Compact supplier list with trends */}
        <div className="space-y-1.5 pt-3 border-t border-border/30">
          {supplierData.map((supplier) => (
            <div key={supplier.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: getTier(supplier.score).color }}
              />
              <span className="flex-1 truncate text-foreground">{supplier.name}</span>
              <span className="tabular-nums font-medium text-foreground">{supplier.score}</span>
              <span className="text-muted-foreground tabular-nums w-12 text-right">{supplier.spend}</span>
              {getTrendIcon(supplier.trend)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierPerformanceDashboard;
