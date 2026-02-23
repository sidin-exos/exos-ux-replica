import { Target, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { NegotiationPrepData } from "@/lib/dashboard-data-parser";

interface NegotiationPrepDashboardProps {
  parsedData?: NegotiationPrepData;
}

const defaultNegotiationFramework = {
  batna: {
    strength: 65,
    description: "2 alternative suppliers identified with 6-week switching timeline",
  },
  leveragePoints: [
    { point: "Volume Commitment", tactic: "Offer 2-year contract for 12% discount" },
    { point: "Payment Terms", tactic: "Propose net-60 for 3% reduction" },
    { point: "Service Bundling", tactic: "Combine maintenance + support for package pricing" },
    { point: "Competitive Pressure", tactic: "Reference alternative quote at 8% lower" },
  ],
  sequence: [
    { step: "Open Position", detail: "Request 20% discount based on volume commitment" },
    { step: "Value Exchange", detail: "Offer longer contract term for better pricing" },
    { step: "Walk-Away Point", detail: "Below 8% savings, proceed with BATNA" },
  ],
};

const NegotiationPrepDashboard = ({ parsedData }: NegotiationPrepDashboardProps) => {
  const negotiationFramework = parsedData
    ? { batna: parsedData.batna, leveragePoints: parsedData.leveragePoints, sequence: parsedData.sequence }
    : defaultNegotiationFramework;
  return (
    <Card className="card-elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <Target className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <CardTitle className="font-display text-base">Negotiation Preparation</CardTitle>
            <p className="text-xs text-muted-foreground">Strategic framework and tactics</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* BATNA Strength */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">BATNA Strength</span>
            <span className="text-sm font-medium text-foreground">{negotiationFramework.batna.strength}%</span>
          </div>
          <Progress value={negotiationFramework.batna.strength} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1.5">
            {negotiationFramework.batna.description}
          </p>
        </div>

        {/* Leverage Points */}
        <div>
          <p className="text-xs text-muted-foreground mb-3">Leverage Points</p>
          <div className="space-y-2">
            {negotiationFramework.leveragePoints.map((lp, index) => (
              <div key={index} className="py-2 border-b border-border/30 last:border-0">
                <p className="text-sm font-medium text-foreground">{lp.point}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{lp.tactic}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tactical Sequence */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-3">Tactical Sequence</p>
          <div className="flex items-start gap-2">
            {negotiationFramework.sequence.map((item, index) => (
              <div key={index} className="flex-1 relative">
                <div className="flex items-center gap-1 mb-1">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  {index < negotiationFramework.sequence.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50 absolute right-0 top-1" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{item.step}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NegotiationPrepDashboard;
