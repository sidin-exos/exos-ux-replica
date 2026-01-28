import { GitCompare, CheckCircle2, XCircle, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";

const scenarios = [
  { id: "A", name: "Conservative Consolidation", color: "hsl(174, 72%, 50%)" },
  { id: "B", name: "Aggressive Dual-Source", color: "hsl(220, 70%, 60%)" },
  { id: "C", name: "Hybrid Approach", color: "hsl(280, 60%, 55%)" },
];

const radarData = [
  { metric: "Savings", A: 65, B: 90, C: 78 },
  { metric: "Risk", A: 90, B: 45, C: 70 },
  { metric: "Speed", A: 70, B: 85, C: 75 },
  { metric: "Control", A: 85, B: 60, C: 72 },
  { metric: "Flexibility", A: 55, B: 80, C: 88 },
];

const comparisonTable = [
  { criteria: "Est. Savings", A: "$320K", B: "$480K", C: "$395K", winner: "B" },
  { criteria: "Implementation Time", A: "3 months", B: "6 months", C: "4 months", winner: "A" },
  { criteria: "Supplier Risk", A: "Low", B: "High", C: "Medium", winner: "A" },
  { criteria: "Switching Costs", A: "$45K", B: "$120K", C: "$75K", winner: "A" },
  { criteria: "Long-term Value", A: "Medium", B: "High", C: "High", winner: "B" },
];

const ScenarioComparisonDashboard = () => {
  const getWinnerStyle = (winner: string, current: string) => {
    if (winner === current) {
      return "text-success font-semibold bg-success/10 rounded px-1";
    }
    return "text-muted-foreground";
  };

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Scenario Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">Multi-Criteria Decision Analysis</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scenario Legend */}
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <Badge
              key={s.id}
              variant="outline"
              className="text-xs"
              style={{ borderColor: s.color, color: s.color }}
            >
              {s.id}: {s.name}
            </Badge>
          ))}
        </div>

        {/* Radar Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(220, 20%, 22%)" />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 11 }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 10 }}
              />
              {scenarios.map((s) => (
                <Radar
                  key={s.id}
                  name={s.name}
                  dataKey={s.id}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Table */}
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left p-2 font-medium text-muted-foreground">Criteria</th>
                {scenarios.map((s) => (
                  <th key={s.id} className="text-center p-2 font-medium" style={{ color: s.color }}>
                    {s.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonTable.map((row, index) => (
                <tr key={row.criteria} className={index % 2 === 0 ? "bg-secondary/20" : ""}>
                  <td className="p-2 text-foreground">{row.criteria}</td>
                  <td className={`p-2 text-center ${getWinnerStyle(row.winner, "A")}`}>{row.A}</td>
                  <td className={`p-2 text-center ${getWinnerStyle(row.winner, "B")}`}>{row.B}</td>
                  <td className={`p-2 text-center ${getWinnerStyle(row.winner, "C")}`}>{row.C}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommendation */}
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">AI Recommendation</p>
          <p className="text-sm text-foreground">
            <span className="font-semibold text-primary">Scenario C (Hybrid)</span> offers the best 
            balance of savings potential and risk mitigation for your context.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioComparisonDashboard;
