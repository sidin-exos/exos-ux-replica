import { useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck, Eye, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskMatrixData } from "@/lib/dashboard-data-parser";

interface RiskMatrixDashboardProps {
  parsedData?: RiskMatrixData;
}

type Level = "low" | "medium" | "high";
type ActionTier = "escalate" | "mitigate" | "monitor" | "accept";

const IMPACT_SCORE: Record<Level, number> = { high: 3, medium: 2, low: 1 };
const PROB_SCORE: Record<Level, number> = { high: 3, medium: 2, low: 1 };

const getRiskScore = (impact: string, probability: string) =>
  (IMPACT_SCORE[impact as Level] ?? 1) * (PROB_SCORE[probability as Level] ?? 1);

const getActionTier = (score: number): ActionTier => {
  if (score >= 9) return "escalate";
  if (score >= 6) return "mitigate";
  if (score >= 3) return "monitor";
  return "accept";
};

// Muted EXOS palette
const ACTION_META: Record<
  ActionTier,
  { label: string; description: string; color: string; icon: typeof ShieldAlert }
> = {
  escalate: {
    label: "Escalate",
    description: "Critical risks requiring executive attention and immediate intervention.",
    color: "hsl(358, 38%, 48%)", // muted plum/red
    icon: ShieldAlert,
  },
  mitigate: {
    label: "Mitigate",
    description: "Active risks needing concrete mitigation plans, owners, and tracking.",
    color: "hsl(35, 28%, 45%)", // muted amber
    icon: ShieldCheck,
  },
  monitor: {
    label: "Monitor",
    description: "Lower-tier risks tracked through regular reviews and KPI monitoring.",
    color: "hsl(174, 35%, 38%)", // teal
    icon: Eye,
  },
  accept: {
    label: "Accept",
    description: "Tolerable residual risk; no active mitigation required.",
    color: "hsl(220, 22%, 48%)", // slate-blue
    icon: CheckCircle2,
  },
};

const ACTION_ORDER: ActionTier[] = ["escalate", "mitigate", "monitor", "accept"];

const defaultRiskData = [
  { id: 1, supplier: "Alpha Corp", impact: "high", probability: "medium", category: "Strategic" },
  { id: 2, supplier: "Beta Industries", impact: "medium", probability: "high", category: "Leverage" },
  { id: 3, supplier: "Gamma Tech", impact: "low", probability: "low", category: "Non-Critical" },
  { id: 4, supplier: "Delta Services", impact: "high", probability: "high", category: "Bottleneck" },
  { id: 5, supplier: "Epsilon Materials", impact: "medium", probability: "low", category: "Leverage" },
];

const IMPACT_ROWS: Level[] = ["high", "medium", "low"];
const PROB_COLS: Level[] = ["low", "medium", "high"];

// Score-to-action color for matrix cells
const cellAction = (impact: Level, prob: Level): ActionTier =>
  getActionTier(IMPACT_SCORE[impact] * PROB_SCORE[prob]);

const RiskMatrixDashboard = ({ parsedData }: RiskMatrixDashboardProps) => {
  const riskData = parsedData?.risks
    ? parsedData.risks.map((r, i) => ({ id: i + 1, ...r }))
    : defaultRiskData;
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const enriched = useMemo(
    () =>
      riskData.map((r) => {
        const score = getRiskScore(r.impact, r.probability);
        return { ...r, score, action: getActionTier(score) };
      }),
    [riskData]
  );

  const grouped = useMemo(() => {
    const map: Record<ActionTier, typeof enriched> = {
      escalate: [],
      mitigate: [],
      monitor: [],
      accept: [],
    };
    enriched.forEach((r) => map[r.action].push(r));
    (Object.keys(map) as ActionTier[]).forEach((k) =>
      map[k].sort((a, b) => b.score - a.score)
    );
    return map;
  }, [enriched]);

  const counts = {
    escalate: grouped.escalate.length,
    mitigate: grouped.mitigate.length,
    monitor: grouped.monitor.length,
    accept: grouped.accept.length,
  };
  const total = enriched.length;
  const criticalPct = total ? Math.round((counts.escalate / total) * 100) : 0;

  const heroColor =
    criticalPct >= 30
      ? ACTION_META.escalate.color
      : criticalPct > 0
        ? ACTION_META.mitigate.color
        : ACTION_META.monitor.color;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Risk Matrix</CardTitle>
              <p className="text-xs text-muted-foreground">Supplier risk assessment</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-semibold" style={{ color: heroColor }}>
              {criticalPct}%
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              critical risk
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stacked action distribution bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Action distribution
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
              {total} risks
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-muted">
            {ACTION_ORDER.map((a) => {
              const pct = total ? (counts[a] / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={a}
                  style={{ width: `${pct}%`, backgroundColor: ACTION_META[a].color }}
                  title={`${ACTION_META[a].label}: ${counts[a]}`}
                />
              );
            })}
          </div>
        </div>

        {/* Two-column: compact matrix + action-tier strategy cards */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(220px,240px)] gap-3">
          {/* Compact matrix */}
          <div className="relative flex">
            <div className="flex items-center justify-center w-5">
              <span className="-rotate-90 whitespace-nowrap text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                Impact
              </span>
            </div>
            <div className="flex-1 ml-2">
              <div className="grid grid-cols-3 gap-1">
                {IMPACT_ROWS.map((impact) =>
                  PROB_COLS.map((prob) => {
                    const action = cellAction(impact, prob);
                    const meta = ACTION_META[action];
                    const cellRisks = enriched.filter(
                      (r) => r.impact === impact && r.probability === prob
                    );
                    return (
                      <div
                        key={`${impact}-${prob}`}
                        className="h-14 rounded-md flex flex-wrap items-center justify-center gap-1 p-1 transition-colors border border-border/40"
                        style={{ backgroundColor: `${meta.color}15` }}
                      >
                        {cellRisks.map((r) => {
                          const isHovered = hoveredId === r.id;
                          // size dot by score weight
                          const size = 18 + r.score; // 19–27px
                          return (
                            <div
                              key={r.id}
                              onMouseEnter={() => setHoveredId(r.id)}
                              onMouseLeave={() => setHoveredId(null)}
                              className={`rounded-full flex items-center justify-center text-[10px] font-semibold cursor-pointer transition-all ${
                                isHovered ? "ring-2 ring-foreground/40 scale-110" : ""
                              }`}
                              style={{
                                width: size,
                                height: size,
                                backgroundColor: meta.color,
                                color: "hsl(var(--background))",
                              }}
                              title={`${r.supplier} — score ${r.score}`}
                            >
                              {r.id}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-muted-foreground mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground text-center mt-1 tracking-wider uppercase">
                Probability
              </p>
            </div>
          </div>

          {/* Action-tier strategy cards */}
          <div className="space-y-1.5">
            {ACTION_ORDER.map((tier) => {
              const meta = ACTION_META[tier];
              const Icon = meta.icon;
              const items = grouped[tier];
              const top = items[0];
              const sharePct = total ? Math.round((items.length / total) * 100) : 0;
              return (
                <div
                  key={tier}
                  className="rounded-md border border-border bg-muted/20 px-2.5 py-2 flex items-start gap-2"
                >
                  <div
                    className="w-0.5 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide"
                        style={{ color: meta.color }}
                      >
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                      <span
                        className="text-[10px] uppercase tracking-wider tabular-nums font-medium"
                        style={{ color: meta.color }}
                      >
                        {items.length} · {sharePct}%
                      </span>
                    </div>
                    {top ? (
                      <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 truncate">
                        Top: <span className="text-foreground">{top.supplier}</span>{" "}
                        <span className="tabular-nums">(score {top.score})</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/70 italic mt-0.5">
                        No risks in this tier
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority register footer grouped by action tier */}
        <div className="rounded-md border border-border overflow-hidden">
          <div className="px-2.5 py-1.5 bg-muted/40 border-b border-border flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Priority register
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
              {total} risks
            </span>
          </div>
          <div className="divide-y divide-border/60">
            {ACTION_ORDER.flatMap((tier) => {
              const items = grouped[tier];
              if (items.length === 0) return [];
              const meta = ACTION_META[tier];
              return items.map((r) => {
                const isHovered = hoveredId === r.id;
                return (
                  <div
                    key={r.id}
                    onMouseEnter={() => setHoveredId(r.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition-colors ${
                      isHovered ? "bg-muted/40" : ""
                    }`}
                  >
                    <div
                      className="w-0.5 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden
                    />
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold tabular-nums flex-shrink-0"
                      style={{
                        backgroundColor: `${meta.color}25`,
                        color: meta.color,
                        border: `1px solid ${meta.color}55`,
                      }}
                    >
                      {r.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground leading-tight truncate">
                        {r.supplier}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight truncate">
                        {r.category} · {r.impact} impact · {r.probability} probability
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className="text-sm font-display font-semibold tabular-nums leading-none"
                        style={{ color: meta.color }}
                      >
                        {r.score}
                      </span>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground leading-tight">
                        {meta.label}
                      </p>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskMatrixDashboard;
