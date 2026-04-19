import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const defaultVariables: SensitivityVariable[] = [
  { name: "Material Cost", baseCase: 450000, lowCase: 382500, highCase: 540000, unit: "$" },
  { name: "Labor Rate", baseCase: 180000, lowCase: 162000, highCase: 207000, unit: "$" },
  { name: "Volume", baseCase: 100000, lowCase: 75000, highCase: 115000, unit: "units" },
  { name: "Exchange Rate", baseCase: 1.0, lowCase: 0.92, highCase: 1.12, unit: "multiplier" },
  { name: "Overhead %", baseCase: 15, lowCase: 12.75, highCase: 18, unit: "%" },
];

// Muted EXOS palette
const COLOR_FAVORABLE = "hsl(174, 35%, 38%)"; // teal
const COLOR_UNFAVORABLE = "hsl(358, 38%, 48%)"; // plum
const COLOR_TIER_HIGH = "hsl(358, 38%, 48%)";
const COLOR_TIER_MED = "hsl(35, 28%, 45%)";
const COLOR_TIER_LOW = "hsl(174, 35%, 38%)";

const formatCurrency = (value: number, currency: string = "$"): string => {
  if (value >= 1000000) return `${currency}${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${currency}${(value / 1000).toFixed(0)}K`;
  return `${currency}${value}`;
};

const formatValue = (value: number, unit?: string): string => {
  if (unit === "$") return formatCurrency(value);
  if (unit === "%") return `${value}%`;
  if (unit === "units") return `${(value / 1000).toFixed(0)}K`;
  return value.toFixed(2);
};

const tierFor = (maxPct: number): { label: string; color: string } => {
  if (maxPct >= 20) return { label: "High", color: COLOR_TIER_HIGH };
  if (maxPct >= 10) return { label: "Medium", color: COLOR_TIER_MED };
  return { label: "Low", color: COLOR_TIER_LOW };
};

const SensitivitySpiderDashboard = ({
  title = "Sensitivity Analysis",
  subtitle = "Impact on total cost",
  variables = defaultVariables,
  baseCaseTotal = 1200000,
  currency = "$",
  parsedData,
}: SensitivitySpiderDashboardProps) => {
  const effectiveVars = parsedData?.variables || variables;
  const effectiveBaseCaseTotal = parsedData?.baseCaseTotal || baseCaseTotal;
  const effectiveCurrency = parsedData?.currency || currency;

  const impacts = effectiveVars.map((v) => {
    const lowImpact = v.lowCase - v.baseCase;
    const highImpact = v.highCase - v.baseCase;
    const base = Math.abs(v.baseCase) || 1;
    const lowPct = (lowImpact / base) * 100;
    const highPct = (highImpact / base) * 100;
    const maxPct = Math.max(Math.abs(lowPct), Math.abs(highPct));
    return { ...v, lowImpact, highImpact, lowPct, highPct, maxPct, tier: tierFor(maxPct) };
  });

  const sortedImpacts = [...impacts].sort((a, b) => b.maxPct - a.maxPct);
  const maxOverallPct = Math.max(...sortedImpacts.map((i) => i.maxPct), 1);

  // Tier distribution
  const tierCounts = sortedImpacts.reduce(
    (acc, i) => {
      acc[i.tier.label] = (acc[i.tier.label] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const total = sortedImpacts.length || 1;
  const tierOrder: Array<{ label: "High" | "Medium" | "Low"; color: string }> = [
    { label: "High", color: COLOR_TIER_HIGH },
    { label: "Medium", color: COLOR_TIER_MED },
    { label: "Low", color: COLOR_TIER_LOW },
  ];

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
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
            <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
              ±{maxOverallPct.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">max impact</p>
          </div>
        </div>

        {/* Stacked tier distribution */}
        <div className="mt-4 space-y-1.5">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            {tierOrder.map((t) => {
              const count = tierCounts[t.label] || 0;
              const pct = (count / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={t.label}
                  style={{ width: `${pct}%`, backgroundColor: t.color }}
                  title={`${t.label}: ${count}`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {tierOrder.map((t) => (
              <div key={t.label} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span>
                  {t.label} <span className="tabular-nums">({tierCounts[t.label] || 0})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Two-column: tornado + Key Drivers panel */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(200px,220px)] gap-4">
          {/* Tornado chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
              <span>Variable</span>
              <span>% deviation from base</span>
            </div>
            <div className="space-y-1.5">
              {sortedImpacts.map((v) => {
                const lowBarWidth = (Math.abs(v.lowPct) / maxOverallPct) * 50;
                const highBarWidth = (Math.abs(v.highPct) / maxOverallPct) * 50;
                return (
                  <div key={v.name} className="flex items-center gap-2">
                    <div className="w-24 flex-shrink-0 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate" title={v.name}>
                        {v.name}
                      </p>
                    </div>
                    <div className="relative h-6 flex-1">
                      {/* Center axis */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                      {/* Left (low) bar */}
                      <div className="absolute right-1/2 top-1/2 -translate-y-1/2 h-4 flex items-center justify-end">
                        <div
                          className="h-full rounded-l"
                          style={{
                            width: `${lowBarWidth * 2}%`,
                            backgroundColor: v.lowImpact < 0 ? COLOR_UNFAVORABLE : COLOR_FAVORABLE,
                            opacity: 0.85,
                            minWidth: lowBarWidth > 0 ? "3px" : "0",
                          }}
                        />
                      </div>
                      {/* Right (high) bar */}
                      <div className="absolute left-1/2 top-1/2 -translate-y-1/2 h-4 flex items-center">
                        <div
                          className="h-full rounded-r"
                          style={{
                            width: `${highBarWidth * 2}%`,
                            backgroundColor: v.highImpact > 0 ? COLOR_UNFAVORABLE : COLOR_FAVORABLE,
                            opacity: 0.85,
                            minWidth: highBarWidth > 0 ? "3px" : "0",
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-24 flex-shrink-0 flex items-center justify-end gap-1.5 text-[10px] tabular-nums">
                      <span className="text-destructive flex items-center gap-0.5">
                        <TrendingDown className="w-2.5 h-2.5" />
                        {Math.abs(v.lowPct).toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-primary flex items-center gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {Math.abs(v.highPct).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 text-[10px] text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLOR_FAVORABLE }} />
                <span>Favorable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLOR_UNFAVORABLE }} />
                <span>Unfavorable</span>
              </div>
            </div>
          </div>

          {/* Key Drivers side panel */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium px-1">
              Key Drivers
            </p>
            <div className="space-y-1.5">
              {sortedImpacts.slice(0, 4).map((v, idx) => (
                <div
                  key={v.name}
                  className="rounded-lg border border-border/60 bg-muted/20 p-2 flex gap-2"
                >
                  <div
                    className="w-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: v.tier.color }}
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-foreground truncate">{v.name}</p>
                      <span
                        className="text-[9px] font-medium px-1 py-0 rounded tabular-nums"
                        style={{ color: v.tier.color, backgroundColor: `${v.tier.color}15` }}
                      >
                        ±{v.maxPct.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      Base {formatValue(v.baseCase, v.unit)}
                    </p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      Range {formatValue(v.lowCase, v.unit)} – {formatValue(v.highCase, v.unit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Range Summary */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/30">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Best Case</p>
            <p className="text-sm font-semibold" style={{ color: COLOR_FAVORABLE }}>
              {formatCurrency(
                effectiveBaseCaseTotal -
                  sortedImpacts.reduce((sum, v) => sum + Math.abs(v.lowImpact < 0 ? v.lowImpact : 0), 0),
                effectiveCurrency,
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Base Case</p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(effectiveBaseCaseTotal, effectiveCurrency)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Worst Case</p>
            <p className="text-sm font-semibold" style={{ color: COLOR_UNFAVORABLE }}>
              {formatCurrency(
                effectiveBaseCaseTotal +
                  sortedImpacts.reduce((sum, v) => sum + Math.abs(v.highImpact > 0 ? v.highImpact : 0), 0),
                effectiveCurrency,
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SensitivitySpiderDashboard;
