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
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <Scale className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Compact numeric matrix */}
          <div className="lg:col-span-3 overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-3 text-[11px] uppercase tracking-wider text-muted-foreground font-normal">
                    Criteria
                  </th>
                  <th className="text-center py-2 px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-normal w-12">
                    Wt
                  </th>
                  {optionsWithScores.map((option) => {
                    const isWinner = option.totalScore === maxScore;
                    return (
                      <th
                        key={option.id}
                        className={`text-center py-2 px-3 text-xs font-medium ${
                          isWinner ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{option.name}</span>
                          {isWinner && (
                            <span
                              className="h-0.5 w-6 rounded-full"
                              style={{ backgroundColor: COLOR_TEAL }}
                            />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {effectiveCriteria.map((criterion, idx) => (
                  <tr key={criterion.name} className="border-t border-border/40">
                    <td className="py-2.5 pr-3 text-foreground border-t border-border/40">
                      {criterion.name}
                    </td>
                    <td className="py-2.5 px-2 text-center text-xs text-muted-foreground border-t border-border/40 tabular-nums">
                      {criterion.weight}%
                    </td>
                    {optionsWithScores.map((option) => {
                      const isWinner = option.totalScore === maxScore;
                      const score = option.scores[idx];
                      return (
                        <td
                          key={option.id}
                          className={`py-2.5 px-3 text-center tabular-nums border-t border-border/40 ${getScoreTone(
                            score
                          )} ${isWinner ? "bg-muted/40" : ""}`}
                        >
                          {score.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="py-3 pr-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium border-t border-border">
                    Weighted
                  </td>
                  <td className="py-3 px-2 text-center text-xs text-muted-foreground border-t border-border tabular-nums">
                    100%
                  </td>
                  {optionsWithScores.map((option) => {
                    const isWinner = option.totalScore === maxScore;
                    return (
                      <td
                        key={option.id}
                        className={`py-3 px-3 text-center tabular-nums border-t border-border ${
                          isWinner ? "bg-muted/40" : ""
                        }`}
                      >
                        <span
                          className={`text-base font-semibold ${
                            isWinner ? "text-foreground" : "text-muted-foreground"
                          }`}
                          style={isWinner ? { color: COLOR_TEAL } : undefined}
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
              const pct = (option.totalScore || 0);
              return (
                <div
                  key={option.id}
                  className="relative rounded-md border border-border/60 bg-card/40 p-3 pl-4"
                >
                  <span
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                    style={{ backgroundColor: accent, opacity: 0.7 }}
                  />
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        #{rank + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{option.name}</span>
                    </div>
                    <span
                      className="text-lg font-semibold tabular-nums"
                      style={{ color: rank === 0 ? accent : "hsl(var(--foreground))" }}
                    >
                      {option.totalScore}
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: accent,
                        opacity: 0.55,
                      }}
                    />
                  </div>
                  {strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {strengths.map((s) => (
                        <span
                          key={s.name}
                          className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded"
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
