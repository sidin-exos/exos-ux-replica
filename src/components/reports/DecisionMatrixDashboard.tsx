import { Scale, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const getScoreColor = (score: number): string => {
  if (score >= 4.5) return "bg-primary text-primary-foreground";
  if (score >= 3.5) return "bg-primary/60 text-primary-foreground";
  if (score >= 2.5) return "bg-warning/60 text-warning-foreground";
  if (score >= 1.5) return "bg-warning/40 text-foreground";
  return "bg-destructive/40 text-foreground";
};

const getScoreDots = (score: number): JSX.Element => {
  return (
    <div className="flex gap-0.5" aria-label={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-2.5 h-2.5 ${
            star <= score
              ? "fill-primary text-primary"
              : "fill-transparent text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
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
  // Calculate weighted scores
  const optionsWithScores = effectiveOptions.map((option) => {
    const weightedScore = option.scores.reduce((total, score, idx) => {
      return total + (score * (effectiveCriteria[idx]?.weight || 0)) / 100;
    }, 0);
    return { ...option, totalScore: Math.round(weightedScore * 20) };
  });

  const maxScore = Math.max(...optionsWithScores.map((o) => o.totalScore || 0));
  const recommendedOption = optionsWithScores.find((o) => o.totalScore === maxScore);

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Scale className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {recommendedOption && (
            <Badge className="bg-primary/15 text-primary border-primary/30">
              Recommended: {recommendedOption.name}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 pr-4 text-muted-foreground font-normal">
                  Criteria
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-normal w-16">
                  Weight
                </th>
                {optionsWithScores.map((option) => (
                  <th
                    key={option.id}
                    className={`text-center py-2 px-3 font-medium ${
                      option.totalScore === maxScore ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {option.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {effectiveCriteria.map((criterion, idx) => (
                <tr key={criterion.name} className="border-b border-border/30">
                  <td className="py-2.5 pr-4 text-foreground">{criterion.name}</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="text-xs text-muted-foreground">{criterion.weight}%</span>
                  </td>
                  {optionsWithScores.map((option) => (
                    <td key={option.id} className="py-2.5 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold ${getScoreColor(
                            option.scores[idx]
                          )}`}
                        >
                          {option.scores[idx]}
                        </div>
                        {getScoreDots(option.scores[idx])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="py-3 pr-4 font-semibold text-foreground">
                  Weighted Score
                </td>
                <td className="py-3 px-2 text-center text-xs text-muted-foreground">
                  100%
                </td>
                {optionsWithScores.map((option) => (
                  <td key={option.id} className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`text-lg font-bold ${
                          option.totalScore === maxScore ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {option.totalScore}
                      </span>
                      {option.totalScore === maxScore && (
                        <span className="text-[10px] text-primary uppercase tracking-wider">
                          Best
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Score Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/30">
          <span className="text-xs text-muted-foreground">Score Key:</span>
          {[5, 4, 3, 2, 1].map((score) => (
            <div key={score} className="flex items-center gap-1">
              <div
                className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-medium ${getScoreColor(
                  score
                )}`}
              >
                {score}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {score === 5 ? "Excellent" : score === 4 ? "Good" : score === 3 ? "Fair" : score === 2 ? "Poor" : "Bad"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DecisionMatrixDashboard;
