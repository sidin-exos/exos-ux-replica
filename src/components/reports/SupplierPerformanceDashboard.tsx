import { Users, Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

const supplierData = [
  { name: "Alpha Corp", score: 92, trend: "up", category: "Strategic", spend: 450000 },
  { name: "Beta Industries", score: 78, trend: "down", category: "Leverage", spend: 320000 },
  { name: "Gamma Tech", score: 85, trend: "stable", category: "Non-Critical", spend: 180000 },
  { name: "Delta Services", score: 61, trend: "down", category: "Bottleneck", spend: 275000 },
  { name: "Epsilon Materials", score: 88, trend: "up", category: "Leverage", spend: 210000 },
];

const kpiBreakdown = [
  { kpi: "On-Time Delivery", weight: 30 },
  { kpi: "Quality Score", weight: 25 },
  { kpi: "Cost Competitiveness", weight: 20 },
  { kpi: "Responsiveness", weight: 15 },
  { kpi: "Innovation", weight: 10 },
];

const SupplierPerformanceDashboard = () => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "hsl(174, 72%, 50%)";
    if (score >= 70) return "hsl(38, 92%, 50%)";
    return "hsl(0, 84%, 60%)";
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

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "Strategic":
        return "default";
      case "Leverage":
        return "secondary";
      case "Bottleneck":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Supplier Scorecard</CardTitle>
              <p className="text-sm text-muted-foreground">Performance Rankings</p>
            </div>
          </div>
          <Badge variant="outline" className="text-primary border-primary/30">
            <Star className="w-3 h-3 mr-1" />
            5 Suppliers
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bar Chart */}
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={supplierData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} stroke="hsl(220, 15%, 55%)" fontSize={10} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="hsl(220, 15%, 55%)" 
                fontSize={10}
                width={80}
                tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + "..." : value}
              />
              <Tooltip
                formatter={(value: number) => [`${value}/100`, "Score"]}
                contentStyle={{
                  backgroundColor: "hsl(220, 25%, 14%)",
                  border: "1px solid hsl(220, 20%, 22%)",
                  borderRadius: "0.5rem",
                }}
              />
              <ReferenceLine x={75} stroke="hsl(220, 15%, 35%)" strokeDasharray="3 3" />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {supplierData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Supplier Details Table */}
        <div className="space-y-2">
          {supplierData.map((supplier) => (
            <div
              key={supplier.name}
              className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: getScoreColor(supplier.score) + "33", color: getScoreColor(supplier.score) }}
                >
                  {supplier.score}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{supplier.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(supplier.spend)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(supplier.trend)}
                <Badge variant={getCategoryBadgeVariant(supplier.category)} className="text-[10px]">
                  {supplier.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* KPI Weights */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Score Composition
          </p>
          <div className="flex gap-1">
            {kpiBreakdown.map((kpi) => (
              <div
                key={kpi.kpi}
                className="flex-1 text-center p-1.5 rounded bg-secondary/50"
                style={{ flex: kpi.weight }}
                title={`${kpi.kpi}: ${kpi.weight}%`}
              >
                <p className="text-[9px] text-muted-foreground truncate">{kpi.kpi}</p>
                <p className="text-xs font-semibold text-foreground">{kpi.weight}%</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierPerformanceDashboard;
