import { TrendingUp, DollarSign, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const savingsData = [
  { month: "Jan", realized: 45000, projected: 50000 },
  { month: "Feb", realized: 78000, projected: 85000 },
  { month: "Mar", realized: 125000, projected: 130000 },
  { month: "Apr", realized: 180000, projected: 190000 },
  { month: "May", realized: 245000, projected: 260000 },
  { month: "Jun", realized: 320000, projected: 340000 },
];

const categoryBreakdown = [
  { category: "IT Services", savings: 120000, percentage: 15 },
  { category: "Raw Materials", savings: 95000, percentage: 12 },
  { category: "Logistics", savings: 65000, percentage: 8 },
  { category: "Professional Services", savings: 40000, percentage: 5 },
];

const SavingsTrackerDashboard = () => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Savings Tracker</CardTitle>
              <p className="text-sm text-muted-foreground">Realized vs Projected Savings</p>
            </div>
          </div>
          <Badge variant="outline" className="text-success border-success/30">
            <TrendingUp className="w-3 h-3 mr-1" />
            +12.4% YTD
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KPI Cards */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Annual Target</span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">$680K</p>
              <p className="text-xs text-muted-foreground mt-1">Based on 8% spend reduction</p>
            </div>
            
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Realized YTD</span>
              </div>
              <p className="font-display text-2xl font-bold text-success">$320K</p>
              <p className="text-xs text-muted-foreground mt-1">47% of annual target</p>
            </div>
            
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-warning" />
                <span className="text-sm text-muted-foreground">Pipeline</span>
              </div>
              <p className="font-display text-2xl font-bold text-warning">$420K</p>
              <p className="text-xs text-muted-foreground mt-1">In negotiation phase</p>
            </div>
          </div>

          {/* Area Chart - Cumulative Savings */}
          <div className="lg:col-span-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savingsData}>
                  <defs>
                    <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(174, 72%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(174, 72%, 50%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(220, 70%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(220, 70%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 22%)" />
                  <XAxis dataKey="month" stroke="hsl(220, 15%, 55%)" fontSize={12} />
                  <YAxis 
                    stroke="hsl(220, 15%, 55%)" 
                    fontSize={12}
                    tickFormatter={(value) => `$${value / 1000}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(220, 25%, 14%)",
                      border: "1px solid hsl(220, 20%, 22%)",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    stroke="hsl(220, 70%, 60%)"
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#colorProjected)"
                    name="Projected"
                  />
                  <Area
                    type="monotone"
                    dataKey="realized"
                    stroke="hsl(174, 72%, 50%)"
                    fillOpacity={1}
                    fill="url(#colorRealized)"
                    name="Realized"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Category Breakdown */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category} className="p-2 rounded bg-secondary/30 text-center">
                  <p className="text-xs text-muted-foreground truncate">{cat.category}</p>
                  <p className="font-semibold text-foreground">{formatCurrency(cat.savings)}</p>
                  <p className="text-xs text-success">-{cat.percentage}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsTrackerDashboard;
