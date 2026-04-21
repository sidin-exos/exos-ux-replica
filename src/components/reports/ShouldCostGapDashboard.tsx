import { Scale, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend as RLegend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ShouldCostGapData } from "@/lib/dashboard-data-parser";

interface Props {
  parsedData?: ShouldCostGapData;
}

const COLOR_CURRENT = "hsl(var(--muted-foreground))";
const COLOR_BENCHMARK = "hsl(var(--primary))";
const COLOR_HEADROOM = "hsl(var(--destructive))";
const COLOR_BELOW = "hsl(var(--success, 142 71% 45%))";

const formatCurrency = (value: number | null, currency: string): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${currency}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${currency}${(value / 1_000).toFixed(0)}K`;
  return `${currency}${Math.round(value)}`;
};

const sample: ShouldCostGapData = {
  components: [
    { name: "Raw materials", currentPricePct: 42, benchmarkPct: 36, gapPct: 6, confidence: "HIGH" },
    { name: "Direct labor", currentPricePct: 18, benchmarkPct: 19, gapPct: -1, confidence: "MEDIUM" },
    { name: "Overhead", currentPricePct: 14, benchmarkPct: 12, gapPct: 2, confidence: "MEDIUM" },
    { name: "Logistics", currentPricePct: 9, benchmarkPct: 10, gapPct: -1, confidence: "LOW" },
    { name: "Margin", currentPricePct: 17, benchmarkPct: 12, gapPct: 5, confidence: "HIGH" },
  ],
  negotiationAnchor: {
    currentPrice: 1_200_000,
    shouldCostTarget: 1_050_000,
    headroomPct: 12.5,
    rationale: "Benchmark margin at 12% vs supplier margin at 17% indicates material headroom on commercial terms.",
  },
  supplierMarginPct: 17,
  benchmarkMarginPct: 12,
  currency: "$",
};

const ShouldCostGapDashboard = ({ parsedData }: Props) => {
  const data = parsedData ?? sample;
  const chartData = data.components.map((c) => ({
    name: c.name,
    current: c.currentPricePct,
    benchmark: c.benchmarkPct ?? 0,
    gap: c.gapPct ?? 0,
    confidence: c.confidence,
  }));

  const marginRedFlag =
    data.supplierMarginPct != null &&
    data.benchmarkMarginPct != null &&
    data.supplierMarginPct - data.benchmarkMarginPct > 20;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Scale className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Should-Cost Gap</CardTitle>
              <p className="text-xs text-muted-foreground">
                Current price vs benchmark vs should-cost — per component
              </p>
            </div>
          </div>
          {marginRedFlag && (
            <div
              className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
              style={{ backgroundColor: "hsl(var(--destructive) / 0.12)", color: COLOR_HEADROOM }}
              role="status"
              aria-label="Supplier margin exceeds benchmark by more than 20 percentage points"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_HEADROOM }} />
              Margin red flag
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
              />
              <RLegend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="current" name="Current price %" fill={COLOR_CURRENT} radius={[2, 2, 0, 0]} />
              <Bar dataKey="benchmark" name="Benchmark %" fill={COLOR_BENCHMARK} radius={[2, 2, 0, 0]} />
              <Bar dataKey="gap" name="Headroom (gap %)" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.gap > 0 ? COLOR_HEADROOM : COLOR_BELOW} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Negotiation anchor */}
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Negotiation anchor
            </p>
            {data.negotiationAnchor.headroomPct != null && (
              <p className="text-xs tabular-nums font-medium" style={{ color: COLOR_HEADROOM }}>
                {data.negotiationAnchor.headroomPct.toFixed(1)}% headroom
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Current price</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(data.negotiationAnchor.currentPrice, data.currency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Should-cost target</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(data.negotiationAnchor.shouldCostTarget, data.currency)}
              </p>
            </div>
          </div>
          {data.negotiationAnchor.rationale && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {data.negotiationAnchor.rationale}
            </p>
          )}
        </div>

        {/* Margin comparison */}
        {(data.supplierMarginPct != null || data.benchmarkMarginPct != null) && (
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-muted-foreground">Supplier margin</span>
            <span className="tabular-nums font-medium text-foreground">
              {data.supplierMarginPct != null ? `${data.supplierMarginPct.toFixed(1)}%` : "—"}
              <span className="text-muted-foreground font-normal">
                {" "}vs benchmark{" "}
                {data.benchmarkMarginPct != null ? `${data.benchmarkMarginPct.toFixed(1)}%` : "—"}
              </span>
            </span>
          </div>
        )}

        {/* Accessible table fallback */}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
            Show data table
          </summary>
          <table className="w-full mt-2 border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1 font-normal">Component</th>
                <th className="py-1 font-normal text-right">Current %</th>
                <th className="py-1 font-normal text-right">Benchmark %</th>
                <th className="py-1 font-normal text-right">Gap %</th>
                <th className="py-1 font-normal text-right">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {data.components.map((c) => (
                <tr key={c.name} className="border-b border-border/40">
                  <td className="py-1 text-foreground">{c.name}</td>
                  <td className="py-1 tabular-nums text-right">{c.currentPricePct.toFixed(1)}</td>
                  <td className="py-1 tabular-nums text-right">
                    {c.benchmarkPct != null ? c.benchmarkPct.toFixed(1) : "—"}
                  </td>
                  <td className="py-1 tabular-nums text-right">
                    {c.gapPct != null ? c.gapPct.toFixed(1) : "—"}
                  </td>
                  <td className="py-1 text-right text-muted-foreground">{c.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>

        {!parsedData && (
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground border-t border-border/40 pt-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Sample data shown — rerun the analysis to populate this view.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShouldCostGapDashboard;
