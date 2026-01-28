import { FileText, Target, Shield, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const sowAnalysis = {
  clarity: 72,
  riskAreas: [
    { area: "Scope Creep Risk", severity: "high", detail: "Vague deliverable definitions in sections 3.2, 4.1" },
    { area: "Payment Terms", severity: "medium", detail: "No milestone-based payment structure defined" },
    { area: "IP Ownership", severity: "low", detail: "Clear assignment clause present" },
    { area: "SLA Gaps", severity: "high", detail: "No uptime guarantees or penalty clauses" },
  ],
  missingClauses: ["Termination for Convenience", "Change Order Process", "Dispute Resolution"],
};

const negotiationFramework = {
  batna: {
    strength: "Medium",
    description: "2 alternative suppliers identified, 6-week switching timeline",
    score: 65,
  },
  leveragePoints: [
    { point: "Volume Commitment", impact: "high", tactic: "Offer 2-year contract for 12% discount" },
    { point: "Payment Terms", impact: "medium", tactic: "Propose net-60 for 3% reduction" },
    { point: "Bundling", impact: "high", tactic: "Combine maintenance + support for package deal" },
    { point: "Competitor Pricing", impact: "medium", tactic: "Reference Beta Corp quote at 8% lower" },
  ],
  tactics: [
    { name: "Anchor High", priority: 1, description: "Open with 20% discount request" },
    { name: "Silence", priority: 2, description: "Pause after counter-offer" },
    { name: "Walk-Away Point", priority: 3, description: "Below 8% savings, escalate to BATNA" },
  ],
};

const NegotiationPrepDashboard = () => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-destructive bg-destructive/10 border-destructive/30";
      case "medium":
        return "text-warning bg-warning/10 border-warning/30";
      case "low":
        return "text-success bg-success/10 border-success/30";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return "default";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">SOW Analysis & Negotiation Prep</CardTitle>
              <p className="text-sm text-muted-foreground">Contract Review & Tactical Framework</p>
            </div>
          </div>
          <Badge variant="outline" className="text-primary border-primary/30">
            Ready for Review
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SOW Analysis Panel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Statement of Work Analysis</h3>
            </div>

            {/* Clarity Score */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">SOW Clarity Score</span>
                <span className="font-display text-xl font-bold text-warning">{sowAnalysis.clarity}%</span>
              </div>
              <Progress value={sowAnalysis.clarity} className="h-2 [&>div]:bg-warning" />
              <p className="text-xs text-muted-foreground mt-2">
                Above 85% recommended before signing
              </p>
            </div>

            {/* Risk Areas */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Identified Risks
              </p>
              {sowAnalysis.riskAreas.map((risk, index) => (
                <div
                  key={index}
                  className={`p-2 rounded border ${getSeverityColor(risk.severity)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{risk.area}</span>
                    <Badge
                      variant={risk.severity === "high" ? "destructive" : risk.severity === "medium" ? "secondary" : "outline"}
                      className="text-[10px] px-1.5"
                    >
                      {risk.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs opacity-80">{risk.detail}</p>
                </div>
              ))}
            </div>

            {/* Missing Clauses */}
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Missing Clauses</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {sowAnalysis.missingClauses.map((clause) => (
                  <Badge key={clause} variant="outline" className="text-xs border-destructive/30 text-destructive">
                    {clause}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Negotiation Framework Panel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Negotiation Framework</h3>
            </div>

            {/* BATNA Assessment */}
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">BATNA Strength</span>
                </div>
                <Badge variant="secondary">{negotiationFramework.batna.strength}</Badge>
              </div>
              <Progress value={negotiationFramework.batna.score} className="h-2 [&>div]:bg-accent mb-2" />
              <p className="text-xs text-muted-foreground">{negotiationFramework.batna.description}</p>
            </div>

            {/* Leverage Points */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Leverage Points
              </p>
              {negotiationFramework.leveragePoints.map((lp, index) => (
                <div key={index} className="p-2 rounded bg-secondary/30 border border-border/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{lp.point}</span>
                    <Badge variant={getImpactBadge(lp.impact)} className="text-[10px]">
                      {lp.impact} impact
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    {lp.tactic}
                  </p>
                </div>
              ))}
            </div>

            {/* Tactical Sequence */}
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Tactical Sequence
              </p>
              <div className="space-y-2">
                {negotiationFramework.tactics.map((tactic) => (
                  <div key={tactic.priority} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{tactic.priority}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tactic.name}</p>
                      <p className="text-xs text-muted-foreground">{tactic.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NegotiationPrepDashboard;
