import { Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DecisionMatrixData } from "@/lib/dashboard-data-parser";

interface Option {
  id: string;
  name: string;
  scores: number[];
  totalScore?: number;
}

interface Criterion {
  name: string;
  weight: number;
}

interface DecisionMatrixDashboardProps {
  title?: string;
  subtitle?: string;
  criteria?: Criterion[];
  options?: Option[];
  parsedData?: DecisionMatrixData;
}

const defaultCriteria: Criterion[] = [
  { name: "Total Cost", weight: 30 },
  { name: "Quality", weight: 25 },
  { name: "Delivery Speed", weight: 20 },
  { name: "Risk Profile", weight: 15 },
  { name: "Innovation", weight: 10 },
];

const defaultOptions: Option[] = [
  { id: "A", name: "Alpha Corp", scores: [4, 5, 3, 4, 3] },
  { id: "B", name: "Beta Industries", scores: [5, 4, 4, 3, 4] },
  { id: "C", name: "Gamma Tech", scores: [3, 4, 5, 5, 5] },
];

// Muted EXOS palette (HSL)
const COLOR_TEAL = "hsl(174, 35%, 38%)";
const COLOR_AMBER = "hsl(35, 28%, 45%)";
const COLOR_PLUM = "hsl(358, 38%, 48%)";
const RANK_COLORS = [COLOR_TEAL, COLOR_AMBER, COLOR_PLUM];

const getScoreTone = (score: number): string => {
  if (score >= 4.5) return "text-foreground font-semibold";
  if (score >= 3.5) return "text-foreground";
  if (score >= 2.5) return "text-muted-foreground";
  return "text-muted-foreground/70";
};

const DecisionMatrixDashboard = ({
  title = "Decision Matrix",
  subtitle = "Weighted multi-criteria analysis",
  criteria = defaultCriteria,
  options = defaultOptions,
  parsedData,
}: DecisionMatrixDashboardProps) => {
  const effectiveCriteria = parsedData?.criteria || criteria;
  const effectiveOptions: Option[] = parsedData?.options
    ? parsedData.options.map((o, i) => ({ id: String.fromCharCode(65 + i), ...o }))
    : options;

  const optionsWithScores = effectiveOptions.map((option) => {
    const weightedScore = option.scores.reduce((total, score, idx) => {
      return total + (score * (effectiveCriteria[idx]?.weight || 0)) / 100;
    }, 0);
    return { ...option, totalScore: Math.round(weightedScore * 20) };
  });

  const maxScore = Math.max(...optionsWithScores.map((o) => o.totalScore || 0));
  const ranked = [...optionsWithScores].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

  // Compute top strengths per option (criteria where this option scores ≥ best or ≥4)
  const getStrengths = (option: typeof optionsWithScores[number]) => {
    return effectiveCriteria
      .map((c, i) => ({ name: c.name, score: option.scores[i] || 0, weight: c.weight }))
      .sort((a, b) => b.score * b.weight - a.score * a.weight)
      .slice(0, 2)
      .filter((s) => s.score >= 3);
  };

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-border/60"
              style={{ backgroundColor: "hsl(174, 35%, 38% / 0.08)" }}
            >
              <Scale className="w-4 h-4" style={{ color: COLOR_TEAL }} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {/* Hero winner metric */}
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Recommended
            </div>
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-sm font-medium text-foreground">{ranked[0]?.name}</span>
              <span
                className="text-xl font-semibold tabular-nums"
                style={{ color: COLOR_TEAL }}
              >
                {ranked[0]?.totalScore}
              </span>
            </div>
          </div>
        </div>
        {/* Distribution bar */}
        <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
          {ranked.map((opt, i) => {
            const total = ranked.reduce((s, o) => s + (o.totalScore || 0), 0);
            const pct = total > 0 ? ((opt.totalScore || 0) / total) * 100 : 0;
            return (
              <div
                key={opt.id}
                style={{
                  width: `${pct}%`,
                  backgroundColor: RANK_COLORS[i] || "hsl(220, 8%, 60%)",
                  opacity: i === 0 ? 0.85 : 0.5,
                }}
              />
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Compact numeric matrix */}
          <div className="lg:col-span-3 overflow-x-auto">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Scoring Matrix
            </div>
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-3 text-[11px] uppercase tracking-wider text-muted-foreground font-normal">
                    Criteria
                  </th>
                  <th className="text-center py-2 px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-normal w-12">
                    Wt
                  </th>
                  {optionsWithScores.map((option, oIdx) => {
                    const rank = ranked.findIndex((r) => r.id === option.id);
                    const accent = RANK_COLORS[rank] || "hsl(220, 8%, 60%)";
                    const isWinner = option.totalScore === maxScore;
                    return (
                      <th
                        key={option.id}
                        className={`text-center py-2 px-3 text-xs font-medium ${
                          isWinner ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: accent, opacity: 0.7 }}
                            />
                            <span>{option.name}</span>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {effectiveCriteria.map((criterion, idx) => (
                  <tr key={criterion.name}>
                    <td className="py-2.5 pr-3 text-foreground border-t border-border/40">
                      {criterion.name}
                    </td>
                    <td className="py-2.5 px-2 text-center text-xs text-muted-foreground border-t border-border/40 tabular-nums">
                      <span className="inline-flex items-center justify-center min-w-[2.25rem] px-1.5 py-0.5 rounded bg-muted/60">
                        {criterion.weight}%
                      </span>
                    </td>
                    {optionsWithScores.map((option) => {
                      const isWinner = option.totalScore === maxScore;
                      const score = option.scores[idx];
                      const barWidth = (score / 5) * 100;
                      return (
                        <td
                          key={option.id}
                          className={`py-2.5 px-3 border-t border-border/40 ${
                            isWinner ? "bg-muted/30" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className={`tabular-nums text-xs ${getScoreTone(score)}`}>
                              {score.toFixed(1)}
                            </span>
                            <div className="h-0.5 w-10 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${barWidth}%`,
                                  backgroundColor: isWinner ? COLOR_TEAL : "hsl(var(--muted-foreground))",
                                  opacity: isWinner ? 0.7 : 0.4,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="py-3 pr-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium border-t-2 border-border">
                    Weighted
                  </td>
                  <td className="py-3 px-2 text-center text-xs text-muted-foreground border-t-2 border-border tabular-nums">
                    100%
                  </td>
                  {optionsWithScores.map((option) => {
                    const isWinner = option.totalScore === maxScore;
                    return (
                      <td
                        key={option.id}
                        className={`py-3 px-3 text-center tabular-nums border-t-2 border-border ${
                          isWinner ? "bg-muted/30" : ""
                        }`}
                      >
                        <span
                          className="text-base font-semibold"
                          style={{ color: isWinner ? COLOR_TEAL : "hsl(var(--muted-foreground))" }}
                        >
                          {option.totalScore}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* RIGHT: Option scorecards */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Standings
            </div>
            {ranked.map((option, rank) => {
              const accent = RANK_COLORS[rank] || "hsl(220, 8%, 60%)";
              const strengths = getStrengths(option);
              const pct = option.totalScore || 0;
              const isWinner = rank === 0;
              return (
                <div
                  key={option.id}
                  className="relative rounded-lg border border-border/60 bg-card/60 p-3 pl-4 overflow-hidden"
                  style={
                    isWinner
                      ? {
                          backgroundImage: `linear-gradient(135deg, hsl(174, 35%, 38% / 0.06), transparent 60%)`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                    style={{ backgroundColor: accent, opacity: isWinner ? 0.85 : 0.5 }}
                  />
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold tabular-nums"
                        style={{
                          backgroundColor: `${accent.replace(")", " / 0.15)").replace("hsl(", "hsl(")}`,
                          color: accent,
                        }}
                      >
                        {rank + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{option.name}</span>
                    </div>
                    <span
                      className="text-lg font-semibold tabular-nums"
                      style={{ color: isWinner ? accent : "hsl(var(--foreground))" }}
                    >
                      {option.totalScore}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: accent,
                        opacity: isWinner ? 0.7 : 0.5,
                      }}
                    />
                  </div>
                  {strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] text-muted-foreground/80 mr-0.5">
                        Top strengths:
                      </span>
                      {strengths.map((s) => (
                        <span
                          key={s.name}
                          className="text-[10px] text-foreground/80 bg-muted/70 border border-border/40 px-1.5 py-0.5 rounded"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DecisionMatrixDashboard;
