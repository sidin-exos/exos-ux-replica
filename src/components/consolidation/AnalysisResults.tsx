import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Percent,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConsolidationScenario {
  name: string;
  savings: number;
  riskLevel: "low" | "medium" | "high";
  keyAction: string;
}

interface AnalysisResultsProps {
  totalSpend: number;
  supplierCount: number;
  scenarios: ConsolidationScenario[];
  negotiationHooks: string[];
  spendByCategory: { name: string; value: number }[];
}

const COLORS = [
  "hsl(174, 72%, 50%)",
  "hsl(186, 100%, 50%)",
  "hsl(220, 70%, 60%)",
  "hsl(280, 60%, 55%)",
  "hsl(38, 92%, 50%)",
];

const AnalysisResults = ({
  totalSpend,
  supplierCount,
  scenarios,
  negotiationHooks,
  spendByCategory,
}: AnalysisResultsProps) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "low":
        return "outline";
      case "medium":
        return "secondary";
      case "high":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-elevated">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="font-display text-xl font-bold">
                  {formatCurrency(totalSpend)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Percent className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Potential Savings</p>
                <p className="font-display text-xl font-bold text-success">
                  {formatCurrency(totalSpend * 0.12)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suppliers</p>
                <p className="font-display text-xl font-bold">
                  {supplierCount} → 2-3
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend Distribution */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Spend Distribution by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {spendByCategory.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(220, 25%, 14%)",
                      border: "1px solid hsl(220, 20%, 22%)",
                      borderRadius: "0.5rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Consolidation Scenarios */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Consolidation Scenarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scenarios.map((scenario, index) => (
              <motion.div
                key={scenario.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg bg-secondary/50 border border-border/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground">
                    {scenario.name}
                  </h4>
                  <Badge variant={getRiskBadgeVariant(scenario.riskLevel)}>
                    {scenario.riskLevel} risk
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {scenario.keyAction}
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    Est. {scenario.savings}% savings
                  </span>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Negotiation Hooks */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Negotiation Talking Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {negotiationHooks.map((hook, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                </div>
                <p className="text-sm text-foreground">{hook}</p>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnalysisResults;
