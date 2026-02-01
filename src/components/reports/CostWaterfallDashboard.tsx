import { TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface CostComponent {
  name: string;
  value: number;
  type: "cost" | "reduction" | "total";
}

interface CostWaterfallDashboardProps {
  title?: string;
  subtitle?: string;
  components?: CostComponent[];
  currency?: string;
}

const defaultComponents: CostComponent[] = [
  { name: "Base Materials", value: 450000, type: "cost" },
  { name: "Direct Labor", value: 180000, type: "cost" },
  { name: "Manufacturing OH", value: 95000, type: "cost" },
  { name: "Logistics", value: 62000, type: "cost" },
  { name: "Volume Discount", value: -48000, type: "reduction" },
  { name: "Contract Terms", value: -32000, type: "reduction" },
  { name: "Supplier Margin", value: 73000, type: "cost" },
];

const formatCurrency = (value: number, currency: string = "$"): string => {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `${currency}${(value / 1000000).toFixed(1)}M`;
  }
  if (absValue >= 1000) {
    return `${currency}${(value / 1000).toFixed(0)}K`;
  }
  return `${currency}${value}`;
};

const CostWaterfallDashboard = ({
  title = "Cost Breakdown",
  subtitle = "Component analysis",
  components = defaultComponents,
  currency = "$",
}: CostWaterfallDashboardProps) => {
  // Calculate running totals for waterfall effect
  let runningTotal = 0;
  const waterfallData = components.map((comp) => {
    const start = runningTotal;
    runningTotal += comp.value;
    return {
      ...comp,
      start,
      end: runningTotal,
      displayValue: comp.value,
    };
  });

  // Add total bar
  const totalValue = runningTotal;
  waterfallData.push({
    name: "Total Cost",
    value: totalValue,
    type: "total",
    start: 0,
    end: totalValue,
    displayValue: totalValue,
  });

  const maxValue = Math.max(...waterfallData.map((d) => d.end));
  const totalCosts = components.filter((c) => c.type === "cost").reduce((sum, c) => sum + c.value, 0);
  const totalReductions = Math.abs(components.filter((c) => c.type === "reduction").reduce((sum, c) => sum + c.value, 0));
  const reductionPercent = Math.round((totalReductions / totalCosts) * 100);

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(totalValue, currency)}
            </p>
            <p className="text-xs text-primary">
              {formatCurrency(totalReductions, currency)} saved ({reductionPercent}%)
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Horizontal Bar Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              layout="vertical"
              margin={{ top: 5, right: 60, left: 100, bottom: 5 }}
            >
              <XAxis
                type="number"
                domain={[0, maxValue * 1.1]}
                tickFormatter={(v) => formatCurrency(v, currency)}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={95}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="end" radius={[0, 4, 4, 0]} barSize={24}>
                {waterfallData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.type === "reduction"
                        ? "hsl(var(--primary))"
                        : entry.type === "total"
                        ? "hsl(var(--foreground) / 0.8)"
                        : "hsl(var(--muted-foreground) / 0.4)"
                    }
                  />
                ))}
                <LabelList
                  dataKey="displayValue"
                  position="right"
                  formatter={(value: number) => formatCurrency(value, currency)}
                  style={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Table */}
        <div className="pt-3 border-t border-border/30">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gross Costs</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(totalCosts, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reductions</p>
              <p className="text-sm font-semibold text-primary">
                -{formatCurrency(totalReductions, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Net Total</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(totalValue, currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Cost breakdown legend */}
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-muted-foreground/40" />
            <span className="text-muted-foreground">Cost Component</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-muted-foreground">Reduction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-foreground/80" />
            <span className="text-muted-foreground">Total</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostWaterfallDashboard;
