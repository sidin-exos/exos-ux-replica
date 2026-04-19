import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskMatrixData } from "@/lib/dashboard-data-parser";

interface RiskMatrixDashboardProps {
  parsedData?: RiskMatrixData;
}

const defaultRiskData = [
  { id: 1, supplier: "Alpha Corp", impact: "high", probability: "medium", category: "Strategic" },
  { id: 2, supplier: "Beta Industries", impact: "medium", probability: "high", category: "Leverage" },
  { id: 3, supplier: "Gamma Tech", impact: "low", probability: "low", category: "Non-Critical" },
  { id: 4, supplier: "Delta Services", impact: "high", probability: "high", category: "Bottleneck" },
  { id: 5, supplier: "Epsilon Materials", impact: "medium", probability: "low", category: "Leverage" },
];

const getRiskTone = (impact: string, probability: string) => {
  if (impact === "high" && probability === "high") return "destructive";
  if (impact === "high" || probability === "high") return "warning";
  if (impact === "medium" && probability === "medium") return "warning-soft";
  return "muted";
};

const dotClass = (tone: string) => {
  switch (tone) {
    case "destructive":
      return "bg-destructive text-destructive-foreground";
    case "warning":
      return "bg-warning text-warning-foreground";
    case "warning-soft":
      return "bg-warning/70 text-warning-foreground";
    default:
      return "bg-muted-foreground/30 text-foreground";
  }
};

const cellTone = (tone: string) => {
  switch (tone) {
    case "destructive":
      return "bg-destructive/10";
    case "warning":
      return "bg-warning/10";
    case "warning-soft":
      return "bg-warning/5";
    default:
      return "bg-muted/40";
  }
};

const riskLabel = (tone: string) => {
  if (tone === "destructive") return "High";
  if (tone === "warning" || tone === "warning-soft") return "Medium";
  return "Low";
};

const IMPACT_ROWS = ["high", "medium", "low"] as const;
const PROB_COLS = ["low", "medium", "high"] as const;

const RiskMatrixDashboard = ({ parsedData }: RiskMatrixDashboardProps) => {
  const riskData = parsedData?.risks
    ? parsedData.risks.map((r, i) => ({ id: i + 1, ...r }))
    : defaultRiskData;
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const criticalCount = riskData.filter(r => r.impact === "high" && r.probability === "high").length;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
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
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
          {/* Compact Matrix */}
          <div className="relative flex">
            <div className="flex items-center justify-center w-5">
              <span className="-rotate-90 whitespace-nowrap text-xs font-bold text-foreground tracking-wide uppercase">
                Impact
              </span>
            </div>
            <div className="flex-1 ml-2">
              <div className="grid grid-cols-3 gap-1">
                {IMPACT_ROWS.map((impact) =>
                  PROB_COLS.map((prob) => {
                    const tone = getRiskTone(impact, prob);
                    const cellRisks = riskData.filter(
                      (r) => r.impact === impact && r.probability === prob
                    );
                    return (
                      <div
                        key={`${impact}-${prob}`}
                        className={`h-12 rounded ${cellTone(tone)} flex flex-wrap items-center justify-center gap-1 p-1 transition-colors`}
                      >
                        {cellRisks.map((r) => {
                          const isHovered = hoveredId === r.id;
                          return (
                            <div
                              key={r.id}
                              onMouseEnter={() => setHoveredId(r.id)}
                              onMouseLeave={() => setHoveredId(null)}
                              className={`w-5 h-5 rounded-full ${dotClass(getRiskTone(r.impact, r.probability))} flex items-center justify-center text-[10px] font-medium cursor-pointer transition-all ${
                                isHovered ? "ring-2 ring-foreground/40 scale-110" : ""
                              }`}
                              title={r.supplier}
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
              <p className="text-[10px] text-muted-foreground text-center mt-0.5 tracking-wide uppercase">
                Probability
              </p>
            </div>
          </div>

          {/* Side Supplier List */}
          <div className="md:border-l md:border-border/40 md:pl-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Suppliers
            </p>
            <ul className="space-y-1.5">
              {riskData.map((r) => {
                const tone = getRiskTone(r.impact, r.probability);
                const isHovered = hoveredId === r.id;
                return (
                  <li
                    key={r.id}
                    onMouseEnter={() => setHoveredId(r.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors ${
                      isHovered ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex-shrink-0 ${dotClass(tone)} flex items-center justify-center text-[10px] font-medium`}
                    >
                      {r.id}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground truncate">{r.supplier}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {r.category} · {riskLabel(tone)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskMatrixDashboard;
