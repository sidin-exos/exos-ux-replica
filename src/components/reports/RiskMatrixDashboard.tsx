import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const riskData = [
  { id: 1, supplier: "Alpha Corp", impact: "high", probability: "medium", category: "Strategic" },
  { id: 2, supplier: "Beta Industries", impact: "medium", probability: "high", category: "Leverage" },
  { id: 3, supplier: "Gamma Tech", impact: "low", probability: "low", category: "Non-Critical" },
  { id: 4, supplier: "Delta Services", impact: "high", probability: "high", category: "Bottleneck" },
  { id: 5, supplier: "Epsilon Materials", impact: "medium", probability: "low", category: "Leverage" },
];

const getRiskColor = (impact: string, probability: string) => {
  if (impact === "high" && probability === "high") return "bg-destructive/60";
  if (impact === "high" || probability === "high") return "bg-warning/60";
  if (impact === "medium" && probability === "medium") return "bg-warning/40";
  return "bg-muted";
};

const RiskMatrixDashboard = () => {
  const criticalCount = riskData.filter(r => r.impact === "high" && r.probability === "high").length;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Risk Matrix</CardTitle>
              <p className="text-xs text-muted-foreground">Supplier risk assessment</p>
            </div>
          </div>
          {criticalCount > 0 && (
            <span className="text-xs text-muted-foreground">{criticalCount} critical</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Matrix Grid */}
        <div className="relative mb-4">
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground">
            Impact
          </div>
          
          <div className="ml-5">
            <div className="grid grid-cols-3 gap-1 mb-1.5">
              {/* High Impact Row */}
              {["low", "medium", "high"].map((prob) => (
                <div
                  key={`high-${prob}`}
                  className="h-14 rounded bg-secondary/30 flex flex-wrap items-center justify-center gap-1 p-1"
                >
                  {riskData
                    .filter((r) => r.impact === "high" && r.probability === prob)
                    .map((r) => (
                      <div
                        key={r.id}
                        className={`w-5 h-5 rounded-full ${getRiskColor(r.impact, r.probability)} flex items-center justify-center text-[10px] font-medium text-foreground`}
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
                  className="h-14 rounded bg-secondary/30 flex flex-wrap items-center justify-center gap-1 p-1"
                >
                  {riskData
                    .filter((r) => r.impact === "medium" && r.probability === prob)
                    .map((r) => (
                      <div
                        key={r.id}
                        className={`w-5 h-5 rounded-full ${getRiskColor(r.impact, r.probability)} flex items-center justify-center text-[10px] font-medium text-foreground`}
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
                  className="h-14 rounded bg-secondary/30 flex flex-wrap items-center justify-center gap-1 p-1"
                >
                  {riskData
                    .filter((r) => r.impact === "low" && r.probability === prob)
                    .map((r) => (
                      <div
                        key={r.id}
                        className={`w-5 h-5 rounded-full ${getRiskColor(r.impact, r.probability)} flex items-center justify-center text-[10px] font-medium text-foreground`}
                        title={r.supplier}
                      >
                        {r.id}
                      </div>
                    ))}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-muted-foreground">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-0.5">Probability</p>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 pt-2 border-t border-border/30">
          {riskData.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-xs">
              <div className={`w-4 h-4 rounded-full ${getRiskColor(r.impact, r.probability)} flex items-center justify-center text-[9px] font-medium`}>
                {r.id}
              </div>
              <span className="text-foreground">{r.supplier}</span>
              <span className="text-muted-foreground ml-auto">{r.category}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskMatrixDashboard;
