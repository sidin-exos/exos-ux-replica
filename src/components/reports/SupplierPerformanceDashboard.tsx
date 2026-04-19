import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupplierScorecardData } from "@/lib/dashboard-data-parser";

interface SupplierPerformanceDashboardProps {
  parsedData?: SupplierScorecardData;
}

type Tier = "excellent" | "good" | "at-risk";

// Muted EXOS palette
const TIER_META: Record<Tier, { label: string; color: string }> = {
  excellent: { label: "Excellent", color: "hsl(174, 35%, 38%)" },
  good: { label: "Good", color: "hsl(35, 28%, 45%)" },
  "at-risk": { label: "At-risk", color: "hsl(358, 38%, 48%)" },
};

const TIER_ORDER: Tier[] = ["excellent", "good", "at-risk"];

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

const formatTotalSpend = (totalK: number): string => {
  if (totalK >= 1000) return `$${(totalK / 1000).toFixed(1).replace(/\.0$/, "")}M`;
  return `$${Math.round(totalK)}K`;
};

const getTier = (score: number): Tier => {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  return "at-risk";
};

const TrendIcon = ({ trend, color }: { trend: string; color: string }) => {
  const cls = "w-3 h-3 flex-shrink-0";
  if (trend === "up") return <TrendingUp className={cls} style={{ color }} />;
  if (trend === "down") return <TrendingDown className={cls} style={{ color }} />;
  return <Minus className={cls} style={{ color: "hsl(var(--muted-foreground))" }} />;
};

const SupplierPerformanceDashboard = ({ parsedData }: SupplierPerformanceDashboardProps) => {
  const supplierData = parsedData?.suppliers || defaultSupplierData;

  const enriched = useMemo(() => {
    const items = supplierData.map((s) => {
      const spendK = parseSpend(s.spend);
      const tier = getTier(s.score);
      return { ...s, spendK, tier };
    });
    // sort by spend desc
    return items.sort((a, b) => b.spendK - a.spendK);
  }, [supplierData]);

  const total = enriched.length;
  const maxSpend = Math.max(...enriched.map((s) => s.spendK), 1);
  const totalSpendK = enriched.reduce((acc, s) => acc + s.spendK, 0);
  const avgScore = total
    ? Math.round(enriched.reduce((acc, s) => acc + s.score, 0) / total)
    : 0;

  const counts = {
    excellent: enriched.filter((s) => s.tier === "excellent").length,
    good: enriched.filter((s) => s.tier === "good").length,
    "at-risk": enriched.filter((s) => s.tier === "at-risk").length,
  };

  const topPerformer = enriched.reduce(
    (top, s) => (s.score > top.score ? s : top),
    enriched[0]
  );
  const weakestPerformer = enriched.reduce(
    (low, s) => (s.score < low.score ? s : low),
    enriched[0]
  );

  const heroColor = TIER_META.excellent.color;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Users className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Supplier Scorecard</CardTitle>
              <p className="text-xs text-muted-foreground">Spend-weighted performance</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-semibold tabular-nums" style={{ color: heroColor }}>
              {formatTotalSpend(totalSpendK)}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              total spend
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stacked tier distribution bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Tier distribution
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
              {total} suppliers
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-muted">
            {TIER_ORDER.map((t) => {
              const pct = total ? (counts[t] / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={t}
                  style={{ width: `${pct}%`, backgroundColor: TIER_META[t].color }}
                  title={`${TIER_META[t].label}: ${counts[t]}`}
                />
              );
            })}
          </div>
        </div>

        {/* Two-column: supplier rows + side panel */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          {/* Supplier rows sorted by spend */}
          <div className="rounded-md border border-border divide-y divide-border/60 overflow-hidden">
            {enriched.map((s) => {
              const meta = TIER_META[s.tier];
              const widthPct = (s.spendK / maxSpend) * 100;
              return (
                <div
                  key={s.name}
                  className="flex items-center px-2.5 py-2 gap-2.5 text-xs"
                >
                  <div
                    className="w-0.5 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden
                  />
                  <div className="w-32 flex-shrink-0 min-w-0">
                    <p className="text-foreground font-medium truncate leading-tight">
                      {s.name}
                    </p>
                    <span
                      className="inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 font-medium"
                      style={{
                        backgroundColor: `${meta.color}26`,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${widthPct}%`, backgroundColor: meta.color }}
                      />
                    </div>
                    <span className="text-muted-foreground tabular-nums text-[11px] w-14 text-right">
                      {s.spend}
                    </span>
                  </div>
                  <span
                    className="font-display tabular-nums text-base font-semibold w-8 text-right text-foreground"
                  >
                    {s.score}
                  </span>
                  <TrendIcon trend={s.trend} color={meta.color} />
                </div>
              );
            })}
          </div>

          {/* Side panel: Score distribution */}
          <div className="rounded-md border border-border bg-muted/30 p-3 flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Score distribution
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Avg score</span>
                <span
                  className="font-display font-semibold text-base tabular-nums"
                  style={{ color: heroColor }}
                >
                  {avgScore}
                </span>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Top performer
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-foreground font-medium truncate">
                    {topPerformer.name}
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: TIER_META[topPerformer.tier].color }}
                  >
                    {topPerformer.score}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Weakest
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-foreground font-medium truncate">
                    {weakestPerformer.name}
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: TIER_META[weakestPerformer.tier].color }}
                  >
                    {weakestPerformer.score}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Tiers
              </div>
              {TIER_ORDER.map((t) => {
                const meta = TIER_META[t];
                return (
                  <div
                    key={t}
                    className="flex justify-between items-center text-xs px-1 py-0.5"
                  >
                    <span className="flex gap-1.5 items-center min-w-0 text-muted-foreground">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="truncate">{meta.label}</span>
                    </span>
                    <span
                      className="tabular-nums font-medium"
                      style={{ color: meta.color }}
                    >
                      {counts[t]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierPerformanceDashboard;
