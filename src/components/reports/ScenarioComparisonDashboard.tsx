import { GitCompare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const scenarios = [
  { id: "A", name: "Conservative", color: "hsl(174, 72%, 50%)" },
  { id: "B", name: "Aggressive", color: "hsl(220, 70%, 60%)" },
  { id: "C", name: "Hybrid", color: "hsl(280, 60%, 55%)" },
];

const radarData = [
  { metric: "Savings", A: 65, B: 90, C: 78 },
  { metric: "Risk", A: 90, B: 45, C: 70 },
  { metric: "Speed", A: 70, B: 85, C: 75 },
  { metric: "Control", A: 85, B: 60, C: 72 },
  { metric: "Flexibility", A: 55, B: 80, C: 88 },
];

const summary = [
  { criteria: "Est. Savings", A: "$320K", B: "$480K", C: "$395K" },
  { criteria: "Timeline", A: "3 mo", B: "6 mo", C: "4 mo" },
  { criteria: "Risk Level", A: "Low", B: "High", C: "Medium" },
];

const ScenarioComparisonDashboard = () => {
  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <GitCompare className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <CardTitle className="font-display text-base">Scenario Comparison</CardTitle>
            <p className="text-xs text-muted-foreground">Multi-criteria analysis</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex gap-3">
          {scenarios.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground">{s.name}</span>
            </div>
          ))}
        </div>

        {/* Radar Chart */}
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(220, 20%, 22%)" />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 10 }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={false}
                axisLine={false}
              />
              {scenarios.map((s) => (
                <Radar
                  key={s.id}
                  dataKey={s.id}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Table */}
        <div className="pt-2 border-t border-border/30">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-normal pb-2"></th>
                {scenarios.map((s) => (
                  <th key={s.id} className="text-center font-normal pb-2" style={{ color: s.color }}>
                    {s.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.criteria}>
                  <td className="py-1 text-muted-foreground">{row.criteria}</td>
                  <td className="py-1 text-center text-foreground">{row.A}</td>
                  <td className="py-1 text-center text-foreground">{row.B}</td>
                  <td className="py-1 text-center text-foreground">{row.C}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommendation */}
        <p className="text-xs text-muted-foreground pt-2">
          <span className="text-primary">Recommended:</span> Scenario C offers balanced risk-reward
        </p>
      </CardContent>
    </Card>
  );
};

export default ScenarioComparisonDashboard;
