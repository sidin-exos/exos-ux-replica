import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SensitivityData } from "@/lib/dashboard-data-parser";

interface SensitivityVariable {
  name: string;
  baseCase: number;
  lowCase: number;
  highCase: number;
  unit?: string;
}

interface SensitivitySpiderDashboardProps {
  title?: string;
  subtitle?: string;
  variables?: SensitivityVariable[];
  baseCaseTotal?: number;
  currency?: string;
  parsedData?: SensitivityData;
}

// Variations are entered as ±% deviations from base; component derives low/high cases.
// Defaults reflect typical procurement sensitivity ranges.
const defaultVariables: SensitivityVariable[] = [
  { name: "Material Cost", baseCase: 450000, lowCase: 382500, highCase: 540000, unit: "$" }, // -15% / +20%
  { name: "Labor Rate", baseCase: 180000, lowCase: 162000, highCase: 207000, unit: "$" }, // -10% / +15%
  { name: "Volume", baseCase: 100000, lowCase: 75000, highCase: 115000, unit: "units" }, // -25% / +15%
  { name: "Exchange Rate", baseCase: 1.0, lowCase: 0.92, highCase: 1.12, unit: "multiplier" }, // -8% / +12%
  { name: "Overhead %", baseCase: 15, lowCase: 12.75, highCase: 18, unit: "%" }, // -15% / +20%
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

const formatValue = (value: number, unit?: string): string => {
  if (unit === "$") return formatCurrency(value);
  if (unit === "%") return `${value}%`;
  if (unit === "units") return `${(value / 1000).toFixed(0)}K`;
  return value.toFixed(2);
};

const SensitivitySpiderDashboard = ({
  title = "Sensitivity Analysis",
  subtitle = "Impact of variable changes",
  variables = defaultVariables,
  baseCaseTotal = 1200000,
  currency = "$",
  parsedData,
}: SensitivitySpiderDashboardProps) => {
  const effectiveVars = parsedData?.variables || variables;
  const effectiveBaseCaseTotal = parsedData?.baseCaseTotal || baseCaseTotal;
  const effectiveCurrency = parsedData?.currency || currency;
  // Calculate impact for each variable as % deviation from base — keeps mixed-unit
  // variables (USD, %, multipliers) comparable on a single tornado axis.
  const impacts = effectiveVars.map((v) => {
    const lowImpact = v.lowCase - v.baseCase;
    const highImpact = v.highCase - v.baseCase;
    const base = Math.abs(v.baseCase) || 1;
    const lowPct = (lowImpact / base) * 100;
    const highPct = (highImpact / base) * 100;
    const maxPct = Math.max(Math.abs(lowPct), Math.abs(highPct));
    return { ...v, lowImpact, highImpact, lowPct, highPct, maxPct };
  });

  // Sort by maximum % impact
  const sortedImpacts = [...impacts].sort((a, b) => b.maxPct - a.maxPct);
  const maxOverallPct = Math.max(...sortedImpacts.map((i) => i.maxPct), 1);

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Activity className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(effectiveBaseCaseTotal, effectiveCurrency)}
            </p>
            <p className="text-xs text-muted-foreground">base case</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tornado Chart */}
        <div className="space-y-3">
          {sortedImpacts.map((variable) => {
            const lowBarWidth = (Math.abs(variable.lowPct) / maxOverallPct) * 45;
            const highBarWidth = (Math.abs(variable.highPct) / maxOverallPct) * 45;

            return (
              <div key={variable.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{variable.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    −{Math.abs(variable.lowPct).toFixed(1)}% / +{Math.abs(variable.highPct).toFixed(1)}%
                  </span>
                </div>

                {/* Tornado bar */}
                <div className="relative h-6 flex items-center">
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />

                  {/* Low case bar (left of center) */}
                  <div className="absolute right-1/2 h-5 flex items-center justify-end">
                    <div
                      className={`h-full rounded-l ${
                        variable.lowImpact < 0 ? "bg-destructive/70" : "bg-primary/70"
                      }`}
                      style={{ width: `${lowBarWidth}%`, minWidth: lowBarWidth > 0 ? "4px" : "0" }}
                    />
                  </div>

                  {/* High case bar (right of center) */}
                  <div className="absolute left-1/2 h-5 flex items-center">
                    <div
                      className={`h-full rounded-r ${
                        variable.highImpact > 0 ? "bg-destructive/70" : "bg-primary/70"
                      }`}
                      style={{ width: `${highBarWidth}%`, minWidth: highBarWidth > 0 ? "4px" : "0" }}
                    />
                  </div>

                  {/* Labels */}
                  <div className="absolute left-0 text-xs text-muted-foreground">
                    {formatValue(variable.lowCase, variable.unit)}
                  </div>
                  <div className="absolute right-0 text-xs text-muted-foreground">
                    {formatValue(variable.highCase, variable.unit)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs pt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/70" />
            <span className="text-muted-foreground">Favorable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-destructive/70" />
            <span className="text-muted-foreground">Unfavorable</span>
          </div>
        </div>

        {/* Key Insight */}
        <div className="pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            <span className="text-warning font-medium">Key Risk:</span> {sortedImpacts[0]?.name} has the highest impact (±{(sortedImpacts[0]?.maxPct || 0).toFixed(1)}%) on total cost
          </p>
        </div>

        {/* Range Summary */}
        <div className="grid grid-cols-3 gap-4 text-center pt-3 border-t border-border/30">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Best Case</p>
            <p className="text-sm font-semibold text-primary">
              {formatCurrency(effectiveBaseCaseTotal - sortedImpacts.reduce((sum, v) => sum + Math.abs(v.lowImpact < 0 ? v.lowImpact : 0), 0), effectiveCurrency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Base Case</p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(effectiveBaseCaseTotal, effectiveCurrency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Worst Case</p>
            <p className="text-sm font-semibold text-destructive">
              {formatCurrency(effectiveBaseCaseTotal + sortedImpacts.reduce((sum, v) => sum + Math.abs(v.highImpact > 0 ? v.highImpact : 0), 0), effectiveCurrency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SensitivitySpiderDashboard;
