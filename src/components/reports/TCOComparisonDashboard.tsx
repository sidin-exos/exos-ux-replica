import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
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

// Muted EXOS palette: teal (best), amber (mid), plum (highest)
const defaultOptions: TCOOption[] = [
  { id: "optionA", name: "Buy Outright", color: "hsl(174, 35%, 38%)", totalTCO: 485000 },
  { id: "optionB", name: "3-Year Lease", color: "hsl(35, 28%, 45%)", totalTCO: 520000 },
  { id: "optionC", name: "Subscription", color: "hsl(358, 38%, 48%)", totalTCO: 595000 },
];

const PALETTE_BY_RANK = ["hsl(174, 35%, 38%)", "hsl(35, 28%, 45%)", "hsl(358, 38%, 48%)", "hsl(220, 22%, 48%)"];

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
  const sortedOptions = [...effectiveOptions].sort((a, b) => a.totalTCO - b.totalTCO);
  const lowestTCO = sortedOptions[0];
  const runnerUp = sortedOptions[1];
  const highestTCO = sortedOptions[sortedOptions.length - 1];
  const savings = highestTCO.totalTCO - lowestTCO.totalTCO;

  // Parse year label "Y0", "Y1"... into a number
  const yearOf = (label: string): number => {
    const m = label.match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  };

  // Find the crossover: first time `lowestTCO` becomes ≤ `runnerUp` and stays so.
  // Returns null if `lowestTCO` was already cheapest from Y0.
  const findCrossover = (): { years: number; months: number } | null => {
    if (!runnerUp) return null;
    const aKey = lowestTCO.id as keyof TCODataPoint;
    const bKey = runnerUp.id as keyof TCODataPoint;
    for (let i = 1; i < effectiveData.length; i++) {
      const prev = effectiveData[i - 1];
      const curr = effectiveData[i];
      const prevA = Number(prev[aKey] ?? 0);
      const prevB = Number(prev[bKey] ?? 0);
      const currA = Number(curr[aKey] ?? 0);
      const currB = Number(curr[bKey] ?? 0);
      // Crossover when sign of (A - B) flips from positive to non-positive
      if (prevA > prevB && currA <= currB) {
        const t = (prevA - prevB) / ((prevA - prevB) - (currA - currB));
        const y0 = yearOf(prev.year);
        const y1 = yearOf(curr.year);
        const exact = y0 + t * (y1 - y0);
        const years = Math.floor(exact);
        const months = Math.round((exact - years) * 12);
        return months === 12 ? { years: years + 1, months: 0 } : { years, months };
      }
    }
    return null;
  };

  const crossover = findCrossover();
  const conclusion = crossover
    ? `${lowestTCO.name} becomes the cheapest option after ${crossover.years} year${crossover.years === 1 ? "" : "s"}${
        crossover.months > 0 ? ` and ${crossover.months} month${crossover.months === 1 ? "" : "s"}` : ""
      }, saving ${formatCurrency(savings, effectiveCurrency)} over ${runnerUp ? runnerUp.name : highestTCO.name} across the full horizon.`
    : `${lowestTCO.name} is the cheapest option from day one, saving ${formatCurrency(savings, effectiveCurrency)} versus ${highestTCO.name} across the full horizon.`;

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 flex-shrink-0">
            <div className="max-w-[280px] rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-0.5">
                Conclusion
              </p>
              <p className="text-xs text-foreground leading-snug">{conclusion}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(savings, effectiveCurrency)}
              </p>
              <p className="text-xs text-muted-foreground">potential savings</p>
            </div>
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

      </CardContent>
    </Card>
  );
};

export default TCOComparisonDashboard;
