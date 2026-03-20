import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TCOComparisonData } from "@/lib/dashboard-data-parser";

interface TCODataPoint {
  year: string;
  optionA: number;
  optionB: number;
  optionC?: number;
}

interface TCOOption {
  id: string;
  name: string;
  color: string;
  totalTCO: number;
}

interface TCOComparisonDashboardProps {
  title?: string;
  subtitle?: string;
  data?: TCODataPoint[];
  options?: TCOOption[];
  currency?: string;
  parsedData?: TCOComparisonData;
}

const defaultOptions: TCOOption[] = [
  { id: "optionA", name: "Buy Outright", color: "hsl(174, 30%, 45%)", totalTCO: 485000 },
  { id: "optionB", name: "3-Year Lease", color: "hsl(220, 25%, 55%)", totalTCO: 520000 },
  { id: "optionC", name: "Subscription", color: "hsl(260, 20%, 52%)", totalTCO: 595000 },
];

const defaultData: TCODataPoint[] = [
  { year: "Y0", optionA: 350000, optionB: 50000, optionC: 80000 },
  { year: "Y1", optionA: 380000, optionB: 170000, optionC: 175000 },
  { year: "Y2", optionA: 410000, optionB: 290000, optionC: 280000 },
  { year: "Y3", optionA: 435000, optionB: 410000, optionC: 390000 },
  { year: "Y4", optionA: 460000, optionB: 480000, optionC: 505000 },
  { year: "Y5", optionA: 485000, optionB: 520000, optionC: 595000 },
];

const formatCurrency = (value: number, currency: string = "$"): string => {
  if (value >= 1000000) {
    return `${currency}${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${currency}${(value / 1000).toFixed(0)}K`;
  }
  return `${currency}${value}`;
};

const TCOComparisonDashboard = ({
  title = "TCO Comparison",
  subtitle = "Cumulative cost over time",
  data = defaultData,
  options = defaultOptions,
  currency = "$",
  parsedData,
}: TCOComparisonDashboardProps) => {
  const effectiveData = parsedData?.data || data;
  const effectiveOptions = parsedData?.options || options;
  const effectiveCurrency = parsedData?.currency || currency;
  const lowestTCO = [...effectiveOptions].sort((a, b) => a.totalTCO - b.totalTCO)[0];
  const highestTCO = [...effectiveOptions].sort((a, b) => b.totalTCO - a.totalTCO)[0];
  const savings = highestTCO.totalTCO - lowestTCO.totalTCO;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-primary">
              {formatCurrency(savings, effectiveCurrency)}
            </p>
            <p className="text-xs text-muted-foreground">potential savings</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex gap-4">
          {effectiveOptions.map((opt) => (
            <div key={opt.id} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: opt.color }} />
              <span className="text-muted-foreground">{opt.name}</span>
            </div>
          ))}
        </div>

        {/* Area Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={effectiveData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                {effectiveOptions.map((opt) => (
                  <linearGradient key={opt.id} id={`gradient-${opt.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={opt.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={opt.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="year"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, effectiveCurrency)}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [formatCurrency(value, effectiveCurrency), ""]}
              />
              {effectiveOptions.map((opt) => (
                <Area
                  key={opt.id}
                  type="monotone"
                  dataKey={opt.id}
                  stroke={opt.color}
                  fill={`url(#gradient-${opt.id})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Table */}
        <div className="pt-3 border-t border-border/30">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-normal pb-2">Option</th>
                <th className="text-right font-normal pb-2">5-Year TCO</th>
                <th className="text-right font-normal pb-2">vs. Best</th>
              </tr>
            </thead>
            <tbody>
              {effectiveOptions.map((opt) => {
                const diff = opt.totalTCO - lowestTCO.totalTCO;
                return (
                  <tr key={opt.id}>
                    <td className="py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded" style={{ backgroundColor: opt.color }} />
                        <span className="text-foreground">{opt.name}</span>
                      </div>
                    </td>
                    <td className="py-1.5 text-right text-foreground font-medium">
                      {formatCurrency(opt.totalTCO, effectiveCurrency)}
                    </td>
                    <td className={`py-1.5 text-right ${diff === 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {diff === 0 ? "Best" : `+${formatCurrency(diff, effectiveCurrency)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Recommendation */}
        <p className="text-xs text-muted-foreground pt-2">
          <span className="text-primary font-medium">Recommendation:</span> {lowestTCO.name} offers the lowest total cost of ownership
        </p>
      </CardContent>
    </Card>
  );
};

export default TCOComparisonDashboard;
