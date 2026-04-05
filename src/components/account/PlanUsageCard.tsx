import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, BarChart3, FolderOpen } from "lucide-react";
import type { UsageStats } from "@/hooks/useAccountData";

interface PlanUsageCardProps {
  usage: UsageStats;
}

const PlanUsageCard = ({ usage }: PlanUsageCardProps) => {
  const scrollToUpgrade = () => {
    document.getElementById("upgrade-plans")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Card className="card-elevated overflow-hidden">
      <div className="h-1" style={{ background: "hsl(var(--copper))" }} />
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" style={{ color: "hsl(var(--copper))" }} />
          <CardTitle className="font-display text-lg">Plan & Usage</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current plan banner */}
        <div className="flex items-center justify-between rounded-lg px-5 py-4 border"
          style={{
            borderColor: "hsl(var(--copper) / 0.3)",
            background: "hsl(var(--copper) / 0.05)",
          }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-foreground">Free Plan</span>
              <Badge className="text-[10px] uppercase tracking-wider" style={{
                background: "hsl(var(--copper) / 0.15)",
                color: "hsl(var(--copper))",
                border: "none",
              }}>
                Current Plan
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Basic access to EXOS features</p>
          </div>
          <Button variant="outline" size="sm" onClick={scrollToUpgrade}>
            Upgrade Plan
          </Button>
        </div>

        {/* Usage metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UsageMetric
            icon={FileText}
            label="Reports Generated"
            value="—"
            color="var(--primary)"
          />
          <UsageMetric
            icon={BarChart3}
            label="Analyses Run"
            value="—"
            color="var(--iris)"
          />
          <UsageMetric
            icon={FolderOpen}
            label="Files Uploaded"
            value={String(usage.fileCount)}
            color="var(--accent)"
          />
        </div>
      </CardContent>
    </Card>
  );
};

function UsageMetric({ icon: Icon, label, value, color }: {
  icon: typeof FileText;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
      <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: `hsl(${color})` }} />
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default PlanUsageCard;
