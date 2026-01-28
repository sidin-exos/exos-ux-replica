import { AlertTriangle, Shield, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const riskData = [
  { id: 1, supplier: "Alpha Corp", impact: "high", probability: "medium", category: "Strategic" },
  { id: 2, supplier: "Beta Industries", impact: "medium", probability: "high", category: "Leverage" },
  { id: 3, supplier: "Gamma Tech", impact: "low", probability: "low", category: "Non-Critical" },
  { id: 4, supplier: "Delta Services", impact: "high", probability: "high", category: "Bottleneck" },
  { id: 5, supplier: "Epsilon Materials", impact: "medium", probability: "low", category: "Leverage" },
];

const getPositionClass = (impact: string, probability: string) => {
  const impactMap = { low: 0, medium: 1, high: 2 };
  const probMap = { low: 0, medium: 1, high: 2 };
  return { x: probMap[probability as keyof typeof probMap], y: impactMap[impact as keyof typeof impactMap] };
};

const getRiskColor = (impact: string, probability: string) => {
  if (impact === "high" && probability === "high") return "bg-destructive/80";
  if (impact === "high" || probability === "high") return "bg-warning/80";
  if (impact === "medium" && probability === "medium") return "bg-warning/60";
  return "bg-success/60";
};

const RiskMatrixDashboard = () => {
  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Risk Matrix</CardTitle>
              <p className="text-sm text-muted-foreground">Supplier Risk Assessment</p>
            </div>
          </div>
          <Badge variant="destructive">
            2 Critical
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* 3x3 Risk Matrix Grid */}
        <div className="relative">
          {/* Y-axis label */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-medium">
            IMPACT
          </div>
          
          {/* Matrix Grid */}
          <div className="ml-6">
            <div className="grid grid-cols-3 gap-1 mb-2">
              {/* High Impact Row */}
              {["low", "medium", "high"].map((prob) => (
                <div
                  key={`high-${prob}`}
                  className={`h-16 rounded border border-border/30 flex flex-col items-center justify-center gap-1 ${
                    prob === "high" ? "bg-destructive/20" : prob === "medium" ? "bg-warning/20" : "bg-warning/10"
                  }`}
                >
                  {riskData
                    .filter((r) => r.impact === "high" && r.probability === prob)
                    .map((r) => (
                      <div
                        key={r.id}
                        className={`w-6 h-6 rounded-full ${getRiskColor(r.impact, r.probability)} flex items-center justify-center text-xs font-bold text-foreground cursor-pointer hover:scale-110 transition-transform`}
                        title={r.supplier}
                      >
                        {r.id}
                      </div>
                    ))}
                </div>
              ))}
              
              {/* Medium Impact Row */}
              {["low", "medium", "high"].map((prob) => (
                <div
                  key={`medium-${prob}`}
                  className={`h-16 rounded border border-border/30 flex flex-col items-center justify-center gap-1 ${
                    prob === "high" ? "bg-warning/20" : prob === "medium" ? "bg-warning/10" : "bg-success/10"
                  }`}
                >
                  {riskData
                    .filter((r) => r.impact === "medium" && r.probability === prob)
                    .map((r) => (
                      <div
                        key={r.id}
                        className={`w-6 h-6 rounded-full ${getRiskColor(r.impact, r.probability)} flex items-center justify-center text-xs font-bold text-foreground cursor-pointer hover:scale-110 transition-transform`}
                        title={r.supplier}
                      >
                        {r.id}
                      </div>
                    ))}
                </div>
              ))}
              
              {/* Low Impact Row */}
              {["low", "medium", "high"].map((prob) => (
                <div
                  key={`low-${prob}`}
                  className={`h-16 rounded border border-border/30 flex flex-col items-center justify-center gap-1 ${
                    prob === "high" ? "bg-warning/10" : "bg-success/10"
                  }`}
                >
                  {riskData
                    .filter((r) => r.impact === "low" && r.probability === prob)
                    .map((r) => (
                      <div
                        key={r.id}
                        className={`w-6 h-6 rounded-full ${getRiskColor(r.impact, r.probability)} flex items-center justify-center text-xs font-bold text-foreground cursor-pointer hover:scale-110 transition-transform`}
                        title={r.supplier}
                      >
                        {r.id}
                      </div>
                    ))}
                </div>
              ))}
            </div>
            
            {/* X-axis labels */}
            <div className="grid grid-cols-3 gap-1 text-center text-xs text-muted-foreground">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1 font-medium">PROBABILITY</p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          {riskData.map((r) => (
            <div key={r.id} className="flex items-center gap-1 text-xs">
              <div className={`w-4 h-4 rounded-full ${getRiskColor(r.impact, r.probability)} flex items-center justify-center text-[10px] font-bold`}>
                {r.id}
              </div>
              <span className="text-muted-foreground truncate max-w-[80px]">{r.supplier}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskMatrixDashboard;
