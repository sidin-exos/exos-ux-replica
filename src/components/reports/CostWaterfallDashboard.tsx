import { TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CostWaterfallData } from "@/lib/dashboard-data-parser";

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
  parsedData?: CostWaterfallData;
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
  if (absValue >= 1000000) return `${currency}${(value / 1000000).toFixed(1)}M`;
  if (absValue >= 1000) return `${currency}${(value / 1000).toFixed(0)}K`;
  return `${currency}${value}`;
};

// Muted EXOS palette
const COLOR_TEAL = "hsl(174, 35%, 38%)";
const COLOR_AMBER = "hsl(35, 28%, 45%)";
const COLOR_PLUM = "hsl(358, 38%, 48%)";

// Cost donut: top driver = plum, second = amber, rest in muted neutrals
const GREY_PALETTE = [
  COLOR_PLUM,
  COLOR_AMBER,
  "hsl(220, 12%, 55%)",
  "hsl(220, 10%, 65%)",
  "hsl(220, 10%, 75%)",
  "hsl(220, 10%, 82%)",
  "hsl(220, 10%, 88%)",
];

// Savings donut: teal tints
const PRIMARY_PALETTE = [
  COLOR_TEAL,
  "hsl(174, 35%, 38% / 0.75)",
  "hsl(174, 35%, 38% / 0.55)",
  "hsl(174, 35%, 38% / 0.40)",
];

interface PieDatum {
  name: string;
  value: number;
}

const PieBlock = ({
  data,
  palette,
  centerLabel,
  centerValue,
  currency,
}: {
  data: PieDatum[];
  palette: string[];
  centerLabel: string;
  centerValue: string;
  currency: string;
}) => (
  <div className="relative h-56">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 11,
          }}
          formatter={(v: number, n) => [formatCurrency(v, currency), n as string]}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={1.5}
          stroke="hsl(var(--card))"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{centerLabel}</p>
      <p className="text-lg font-semibold text-foreground tabular-nums">{centerValue}</p>
    </div>
  </div>
);

const Legend = ({
  data,
  palette,
  currency,
  total,
}: {
  data: PieDatum[];
  palette: string[];
  currency: string;
  total: number;
}) => (
  <div className="space-y-1.5">
    {data.map((d, i) => {
      const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
      return (
        <div key={d.name} className="flex items-center gap-2 text-xs">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: palette[i % palette.length] }}
          />
          <span className="flex-1 truncate text-foreground">{d.name}</span>
          <span className="text-muted-foreground tabular-nums">{pct}%</span>
          <span className="tabular-nums font-medium text-foreground w-12 text-right">
            {formatCurrency(d.value, currency)}
          </span>
        </div>
      );
    })}
  </div>
);

const CostWaterfallDashboard = ({
  title = "Cost Breakdown",
  subtitle = "Maximum cost vs. potential improvements",
  components = defaultComponents,
  currency = "$",
  parsedData,
}: CostWaterfallDashboardProps) => {
  const effectiveComponents = parsedData?.components || components;
  const effectiveCurrency = parsedData?.currency || currency;

  const costItems: PieDatum[] = effectiveComponents
    .filter((c) => c.type === "cost")
    .map((c) => ({ name: c.name, value: c.value }))
    .sort((a, b) => b.value - a.value);

  const reductionItems: PieDatum[] = effectiveComponents
    .filter((c) => c.type === "reduction")
    .map((c) => ({ name: c.name, value: Math.abs(c.value) }))
    .sort((a, b) => b.value - a.value);

  const grossCost = costItems.reduce((s, c) => s + c.value, 0);
  const totalReductions = reductionItems.reduce((s, c) => s + c.value, 0);
  const netCost = grossCost - totalReductions;
  const reductionPercent = grossCost > 0 ? Math.round((totalReductions / grossCost) * 100) : 0;

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
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {formatCurrency(netCost, effectiveCurrency)}
            </p>
            <p className="text-xs tabular-nums" style={{ color: COLOR_TEAL }}>
              −{formatCurrency(totalReductions, effectiveCurrency)} saved ({reductionPercent}%)
            </p>
          </div>
        </div>

        {/* Tier distribution bar: each cost segment + savings tail */}
        {grossCost > 0 && (
          <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-muted">
            {costItems.map((c, i) => {
              const pct = (c.value / (grossCost + totalReductions)) * 100;
              return (
                <div
                  key={`c-${c.name}`}
                  style={{ width: `${pct}%`, backgroundColor: GREY_PALETTE[i % GREY_PALETTE.length] }}
                  title={`${c.name}: ${formatCurrency(c.value, effectiveCurrency)}`}
                />
              );
            })}
            {totalReductions > 0 && (
              <div
                style={{
                  width: `${(totalReductions / (grossCost + totalReductions)) * 100}%`,
                  backgroundColor: COLOR_TEAL,
                }}
                title={`Savings: −${formatCurrency(totalReductions, effectiveCurrency)}`}
              />
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Maximum Cost — grey */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Maximum Cost</p>
              <p className="text-[11px] text-muted-foreground/80">All cost components</p>
            </div>
            <PieBlock
              data={costItems}
              palette={GREY_PALETTE}
              centerLabel="Gross"
              centerValue={formatCurrency(grossCost, effectiveCurrency)}
              currency={effectiveCurrency}
            />
            <Legend data={costItems} palette={GREY_PALETTE} currency={effectiveCurrency} total={grossCost} />
          </div>

          {/* Potential Improvements — primary */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-primary">Potential Improvements</p>
              <p className="text-[11px] text-muted-foreground/80">Identified savings levers</p>
            </div>
            {reductionItems.length > 0 ? (
              <PieBlock
                data={reductionItems}
                palette={PRIMARY_PALETTE}
                centerLabel="Savings"
                centerValue={`-${formatCurrency(totalReductions, effectiveCurrency)}`}
                currency={effectiveCurrency}
              />
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
                No reductions identified
              </div>
            )}
            <Legend
              data={reductionItems}
              palette={PRIMARY_PALETTE}
              currency={effectiveCurrency}
              total={totalReductions}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-border/30">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gross Costs</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(grossCost, effectiveCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reductions</p>
              <p className="text-sm font-semibold text-primary">
                -{formatCurrency(totalReductions, effectiveCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Net Total</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(netCost, effectiveCurrency)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostWaterfallDashboard;
