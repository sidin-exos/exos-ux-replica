import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LicenseTierData } from "@/lib/dashboard-data-parser";

interface LicenseTier {
  name: string;
  users: number;
  costPerUser: number;
  totalCost: number;
  color: string;
  recommended?: number; // Recommended user count
}

interface LicenseTierDashboardProps {
  title?: string;
  subtitle?: string;
  tiers?: LicenseTier[];
  currency?: string;
  parsedData?: LicenseTierData;
}

const defaultTiers: LicenseTier[] = [
  { name: "Power Users", users: 85, costPerUser: 45, totalCost: 45900, color: "hsl(174, 72%, 50%)", recommended: 75 },
  { name: "Regular Users", users: 210, costPerUser: 25, totalCost: 63000, color: "hsl(220, 70%, 60%)", recommended: 180 },
  { name: "Occasional", users: 340, costPerUser: 10, totalCost: 40800, color: "hsl(280, 60%, 55%)", recommended: 380 },
  { name: "View-Only", users: 180, costPerUser: 5, totalCost: 10800, color: "hsl(45, 80%, 50%)", recommended: 180 },
];

const formatCurrency = (value: number, currency: string = "$"): string => {
  if (value >= 1000000) {
    return `${currency}${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${currency}${(value / 1000).toFixed(0)}K`;
  }
  return `${currency}${value}`;
};

const LicenseTierDashboard = ({
  title = "License Distribution",
  subtitle = "User tier analysis",
  tiers = defaultTiers,
  currency = "$",
  parsedData,
}: LicenseTierDashboardProps) => {
  const effectiveTiers = parsedData?.tiers || tiers;
  const effectiveCurrency = parsedData?.currency || currency;
  const totalUsers = effectiveTiers.reduce((sum, t) => sum + t.users, 0);
  const totalCost = effectiveTiers.reduce((sum, t) => sum + t.totalCost, 0);
  
  const optimizedCost = effectiveTiers.reduce((sum, t) => sum + (t.recommended || t.users) * t.costPerUser, 0);
  const potentialSavings = totalCost - optimizedCost;

  const maxCost = Math.max(...effectiveTiers.map((t) => t.totalCost));

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Users className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground">{totalUsers}</p>
            <p className="text-xs text-muted-foreground">total users</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tier breakdown with bars */}
        <div className="space-y-3">
          {effectiveTiers.map((tier) => {
            const barWidth = (tier.totalCost / maxCost) * 100;
            const hasOptimization = tier.recommended && tier.recommended !== tier.users;
            const userDiff = tier.recommended ? tier.recommended - tier.users : 0;

            return (
              <div key={tier.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: tier.color }} />
                    <span className="font-medium text-foreground">{tier.name}</span>
                    <span className="text-muted-foreground">({tier.users} users)</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(tier.totalCost, effectiveCurrency)}
                  </span>
                </div>

                {/* Bar */}
                <div className="h-6 bg-secondary/30 rounded overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: tier.color,
                    }}
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium">
                    {formatCurrency(tier.costPerUser, effectiveCurrency)}/user
                  </span>
                </div>

                {/* Optimization recommendation */}
                {hasOptimization && (
                  <div className="flex items-center gap-1 text-xs">
                    <Badge
                      variant="outline"
                      className={userDiff > 0 ? "border-primary/50 text-primary" : "border-warning/50 text-warning"}
                    >
                      {userDiff > 0 ? `+${userDiff}` : userDiff} users recommended
                    </Badge>
                    <span className="text-muted-foreground">
                      → Save {formatCurrency(Math.abs(userDiff) * tier.costPerUser, effectiveCurrency)}/mo
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-border/30">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current Cost</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(totalCost, effectiveCurrency)}/mo
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Optimized Cost</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(optimizedCost, effectiveCurrency)}/mo
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Potential Savings</p>
              <p className="text-sm font-semibold text-primary">
                {formatCurrency(potentialSavings, effectiveCurrency)}/mo
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">Optimization:</span> Downgrade 10 Power Users and 30 Regular Users to lower tiers based on usage patterns
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LicenseTierDashboard;
