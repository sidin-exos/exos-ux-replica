import { useMemo, useState } from "react";
import { Activity, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { ScenarioComparisonData } from "@/lib/dashboard-data-parser";

interface ScenarioComparisonDashboardProps {
  parsedData?: ScenarioComparisonData;
}

const defaultScenarios = [
  { id: "A", name: "Conservative", color: "hsl(174, 45%, 38%)" },
  { id: "B", name: "Aggressive", color: "hsl(258, 35%, 55%)" },
  { id: "C", name: "Hybrid", color: "hsl(25, 78%, 48%)" },
];

const defaultRadarData = [
  { metric: "Savings", A: 65, B: 90, C: 78 },
  { metric: "Risk Ctrl", A: 90, B: 45, C: 70 },
  { metric: "Speed", A: 70, B: 85, C: 75 },
  { metric: "Control", A: 85, B: 60, C: 72 },
  { metric: "Flexibility", A: 55, B: 80, C: 88 },
];

const defaultSummary = [
  { criteria: "Est. Savings", A: "$320K", B: "$480K", C: "$395K" },
  { criteria: "Timeline", A: "3 mo", B: "6 mo", C: "4 mo" },
  { criteria: "Risk Level", A: "Low", B: "High", C: "Medium" },
];

const defaultWeights: Record<string, number> = {
  Savings: 30,
  "Risk Ctrl": 25,
  Speed: 20,
  Flexibility: 15,
  Control: 10,
};

const ScenarioComparisonDashboard = ({ parsedData }: ScenarioComparisonDashboardProps) => {
  const scenarios = parsedData?.scenarios || defaultScenarios;
  const radarData = parsedData?.radarData || defaultRadarData;
  const summary = parsedData?.summary || defaultSummary;

  // Compute weights — even split if not in defaults
  const weights = useMemo(() => {
    const map: Record<string, number> = {};
    radarData.forEach((r) => {
      const metric = String(r.metric);
      map[metric] = defaultWeights[metric] ?? Math.round(100 / radarData.length);
    });
    // Normalize so total = 100
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    if (total !== 100 && total > 0) {
      const factor = 100 / total;
      Object.keys(map).forEach((k) => (map[k] = Math.round(map[k] * factor)));
    }
    return map;
  }, [radarData]);

  // Weighted totals per scenario
  const weightedTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    scenarios.forEach((s) => {
      let sum = 0;
      radarData.forEach((r) => {
        const score = typeof r[s.id] === "number" ? (r[s.id] as number) : 50;
        const w = weights[String(r.metric)] ?? 0;
        sum += (score * w) / 100;
      });
      totals[s.id] = Math.round(sum);
    });
    return totals;
  }, [scenarios, radarData, weights]);

  const winnerId = useMemo(() => {
    return Object.entries(weightedTotals).reduce(
      (best, [id, score]) => (score > best.score ? { id, score } : best),
      { id: scenarios[0]?.id ?? "", score: -Infinity }
    ).id;
  }, [weightedTotals, scenarios]);

  const [activeId, setActiveId] = useState<string>(winnerId);
  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];
  const activeSummary = (key: string) => {
    const row = summary.find((r) => r.criteria.toLowerCase().includes(key.toLowerCase()));
    return row ? (row as Record<string, string>)[active.id] ?? "—" : "—";
  };

  // Δ vs avg of others
  const deltaVsAvg = (metric: string) => {
    const others = scenarios.filter((s) => s.id !== active.id);
    if (others.length === 0) return 0;
    const row = radarData.find((r) => r.metric === metric);
    if (!row) return 0;
    const activeScore = typeof row[active.id] === "number" ? (row[active.id] as number) : 50;
    const avg =
      others.reduce(
        (sum, s) => sum + (typeof row[s.id] === "number" ? (row[s.id] as number) : 50),
        0
      ) / others.length;
    return Math.round(activeScore - avg);
  };

  const activeTotal = weightedTotals[active.id] ?? 0;
  const othersAvg =
    scenarios.length > 1
      ? Math.round(
          (Object.entries(weightedTotals)
            .filter(([id]) => id !== active.id)
            .reduce((s, [, v]) => s + v, 0)) /
            (scenarios.length - 1)
        )
      : activeTotal;
  const totalDelta = activeTotal - othersAvg;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Activity className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Scenario Comparison</CardTitle>
              <p className="text-xs text-muted-foreground">Multi-criteria analysis</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-semibold" style={{ color: active.color }}>
              {activeTotal}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              recommended score
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Tabs */}
        <div role="tablist" className="grid border-b border-border" style={{ gridTemplateColumns: `repeat(${scenarios.length}, minmax(0, 1fr))` }}>
          {scenarios.map((s) => {
            const isActive = s.id === active.id;
            const isWinner = s.id === winnerId;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(s.id)}
                className={`relative py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  isActive ? "" : "text-muted-foreground hover:text-foreground"
                }`}
                style={isActive ? { color: s.color } : undefined}
              >
                <span>{s.name}</span>
                {isWinner && (
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full"
                    style={{ backgroundColor: s.color }}
                    aria-label="Recommended"
                  >
                    <Star className="w-2.5 h-2.5 text-background fill-background" />
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t"
                    style={{ backgroundColor: s.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Top metric strip */}
        <div className="grid grid-cols-3 border border-border rounded-md overflow-hidden">
          {[
            { label: "Est. Savings", value: activeSummary("saving") },
            { label: "Timeline", value: activeSummary("timeline") || activeSummary("time") },
            { label: "Risk Level", value: activeSummary("risk") },
          ].map((m, i) => (
            <div
              key={i}
              className={`px-3 py-2 ${i < 2 ? "border-r border-border" : ""}`}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {m.label}
              </p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: active.color }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Two-column: table + radar */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3">
          {/* Criterion table */}
          <div className="rounded-md border border-border overflow-hidden">
            <div className="grid grid-cols-[1.4fr_0.5fr_1.5fr_0.6fr] bg-foreground text-background text-[10px] uppercase tracking-wider px-2.5 py-1.5 gap-2">
              <span>Criterion</span>
              <span>Wt.</span>
              <span style={{ color: active.color }}>{active.name} Score</span>
              <span className="text-right">Δ vs Avg</span>
            </div>
            {radarData.map((r, idx) => {
              const metric = String(r.metric);
              const score = typeof r[active.id] === "number" ? (r[active.id] as number) : 50;
              const wt = weights[metric] ?? 0;
              const delta = deltaVsAvg(metric);
              return (
                <div
                  key={metric}
                  className={`grid grid-cols-[1.4fr_0.5fr_1.5fr_0.6fr] items-center px-2.5 py-2 gap-2 text-xs ${
                    idx % 2 === 1 ? "bg-muted/40" : ""
                  } border-t border-border/60`}
                >
                  <span className="text-foreground truncate">{metric}</span>
                  <span className="text-muted-foreground tabular-nums">{wt}%</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${score}%`, backgroundColor: active.color }}
                      />
                    </div>
                    <span className="tabular-nums font-medium w-6 text-right">{score}</span>
                  </div>
                  <span
                    className={`text-right tabular-nums font-medium ${
                      delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                </div>
              );
            })}
            {/* Weighted total row */}
            <div
              className="grid grid-cols-[1.4fr_0.5fr_1.5fr_0.6fr] items-center px-2.5 py-2 gap-2 text-xs border-t border-border"
              style={{ backgroundColor: `${active.color}12` }}
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Weighted Total
              </span>
              <span />
              <div className="flex items-center gap-2">
                <span className="text-base font-display font-semibold" style={{ color: active.color }}>
                  {activeTotal}
                </span>
                <span className="text-muted-foreground">/100</span>
                {active.id === winnerId && (
                  <span
                    className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded text-background"
                    style={{ backgroundColor: "hsl(var(--success))" }}
                  >
                    Best
                  </span>
                )}
              </div>
              <span
                className={`text-right tabular-nums font-semibold ${
                  totalDelta > 0 ? "text-success" : totalDelta < 0 ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {totalDelta > 0 ? `+${totalDelta}` : totalDelta}
              </span>
            </div>
          </div>

          {/* Radar + legend */}
          <div className="rounded-md border border-border bg-muted/30 p-2 flex flex-col">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  {scenarios.map((s) => {
                    const isActive = s.id === active.id;
                    return (
                      <Radar
                        key={s.id}
                        dataKey={s.id}
                        stroke={s.color}
                        fill={s.color}
                        fillOpacity={isActive ? 0.25 : 0.05}
                        strokeWidth={isActive ? 2 : 1}
                      />
                    );
                  })}
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1 border-t border-border pt-2">
              {scenarios.map((s) => {
                const isActive = s.id === active.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    className={`w-full flex items-center justify-between text-xs px-1.5 py-1 rounded transition-colors ${
                      isActive ? "bg-background" : "hover:bg-background/50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className={isActive ? "font-semibold" : "text-muted-foreground"}>
                        {s.name}
                      </span>
                    </span>
                    <span className="tabular-nums font-medium" style={{ color: s.color }}>
                      {weightedTotals[s.id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recommendation banner */}
        <div className="rounded-md border border-success/30 bg-success/5 px-3 py-2">
          <p className="text-xs text-foreground leading-snug">
            <span className="text-success font-semibold">Recommended:</span>{" "}
            {scenarios.find((s) => s.id === winnerId)?.name} scores {weightedTotals[winnerId]}/100
            — best balance of cost reduction and risk control.
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-1">
          Click tabs or radar legend to switch scenario · Δ vs avg shows performance against the mean of the others
        </p>
      </CardContent>
    </Card>
  );
};

export default ScenarioComparisonDashboard;
