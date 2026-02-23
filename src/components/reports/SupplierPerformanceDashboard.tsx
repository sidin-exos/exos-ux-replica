import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
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

const SupplierPerformanceDashboard = ({ parsedData }: SupplierPerformanceDashboardProps) => {
  const supplierData = parsedData?.suppliers || defaultSupplierData;
  const getScoreColor = (score: number) => {
    if (score >= 85) return "hsl(174, 72%, 50%)";
    if (score >= 70) return "hsl(38, 92%, 50%)";
    return "hsl(220, 15%, 45%)";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-success" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-muted-foreground" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

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
              <p className="text-xs text-muted-foreground">Performance rankings</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{supplierData.length} suppliers</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bar Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={supplierData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                hide
              />
              <ReferenceLine x={75} stroke="hsl(220, 15%, 30%)" strokeDasharray="2 2" />
              <Bar dataKey="score" radius={[0, 3, 3, 0]} barSize={12}>
                {supplierData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Supplier List */}
        <div className="space-y-2 pt-2 border-t border-border/30">
          {supplierData.map((supplier) => (
            <div
              key={supplier.name}
              className="flex items-center gap-3"
            >
              <span 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                style={{ 
                  backgroundColor: getScoreColor(supplier.score) + "20", 
                  color: getScoreColor(supplier.score) 
                }}
              >
                {supplier.score}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{supplier.name}</p>
                <p className="text-xs text-muted-foreground">{supplier.spend}</p>
              </div>
              {getTrendIcon(supplier.trend)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierPerformanceDashboard;
