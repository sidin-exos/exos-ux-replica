import { Users, ArrowUp, ArrowDown } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LicenseTierData } from "@/lib/dashboard-data-parser";

interface LicenseTier {
  name: string;
  users: number;
  costPerUser: number;
  totalCost: number;
  color: string;
  recommended?: number;
}

interface LicenseTierDashboardProps {
  title?: string;
  subtitle?: string;
  tiers?: LicenseTier[];
  currency?: string;
  parsedData?: LicenseTierData;
}

// Muted, EXOS-aligned palette (subdued, not bright)
const defaultTiers: LicenseTier[] = [
  { name: "Power Users", users: 85, costPerUser: 45, totalCost: 45900, color: "hsl(174, 35%, 38%)", recommended: 75 },
  { name: "Regular Users", users: 210, costPerUser: 25, totalCost: 63000, color: "hsl(220, 22%, 48%)", recommended: 180 },
  { name: "Occasional", users: 340, costPerUser: 10, totalCost: 40800, color: "hsl(258, 22%, 50%)", recommended: 380 },
  { name: "View-Only", users: 180, costPerUser: 5, totalCost: 10800, color: "hsl(35, 28%, 45%)", recommended: 180 },
];

const formatCurrency = (value: number, currency: string = "$"): string => {
  if (value >= 1000000) return `${currency}${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${currency}${(value / 1000).toFixed(1)}K`;
  return `${currency}${value}`;
};

const LicenseTierDashboard = ({
  title = "License Distribution",
  subtitle = "Cost & utilization analysis",
  tiers = defaultTiers,
  currency = "$",
  parsedData,
}: LicenseTierDashboardProps) => {
  const effectiveTiers = parsedData?.tiers || tiers;
  const effectiveCurrency = parsedData?.currency || currency;

  const totalUsers = effectiveTiers.reduce((sum, t) => sum + t.users, 0);
  const totalCost = effectiveTiers.reduce((sum, t) => sum + t.totalCost, 0);
  const optimizedCost = effectiveTiers.reduce(
    (sum, t) => sum + (t.recommended ?? t.users) * t.costPerUser,
    0
  );
  const potentialSavings = totalCost - optimizedCost;

  // Identify the largest spend tier as "primary recommendation focus"
  const primaryTier = useMemo(
    () => effectiveTiers.reduce((max, t) => (t.totalCost > max.totalCost ? t : max), effectiveTiers[0]),
    [effectiveTiers]
  );

  // Build the optimisation suggestion text dynamically
  const optimisationSummary = useMemo(() => {
    const adjustments = effectiveTiers
      .filter((t) => t.recommended !== undefined && t.recommended !== t.users)
      .map((t) => {
        const diff = (t.recommended ?? t.users) - t.users;
        return `${diff > 0 ? "+" : ""}${diff} ${t.name}`;
      });
    if (adjustments.length === 0) return "Current distribution is well-optimised.";
    return `Reallocate seats: ${adjustments.join(", ")} — save ${formatCurrency(
      Math.abs(potentialSavings),
      effectiveCurrency
    )}/mo.`;
  }, [effectiveTiers, potentialSavings, effectiveCurrency]);

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
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
            <div className="text-2xl font-display font-semibold" style={{ color: primaryTier.color }}>
              {formatCurrency(totalCost, effectiveCurrency)}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              total monthly cost
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stacked distribution bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Spend distribution
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {totalUsers} total seats
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-muted">
            {effectiveTiers.map((t) => {
              const pct = totalCost > 0 ? (t.totalCost / totalCost) * 100 : 0;
              return (
                <div
                  key={t.name}
                  style={{ width: `${pct}%`, backgroundColor: t.color }}
                  title={`${t.name}: ${pct.toFixed(0)}%`}
                />
              );
            })}
          </div>
        </div>

        {/* Two-column: tier cards + side breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          {/* Tier cards */}
          <div className="space-y-2">
            {effectiveTiers.map((tier) => {
              const isPrimary = tier.name === primaryTier.name;
              const pctOfSpend = totalCost > 0 ? (tier.totalCost / totalCost) * 100 : 0;
              const userDiff = tier.recommended !== undefined ? tier.recommended - tier.users : 0;
              const hasOptimization = userDiff !== 0;
              const tierSavings = userDiff !== 0 ? Math.abs(userDiff) * tier.costPerUser : 0;

              return (
                <div
                  key={tier.name}
                  className={`rounded-md border p-2.5 ${
                    isPrimary ? "border-2" : "border-border"
                  }`}
                  style={isPrimary ? { borderColor: tier.color, backgroundColor: `${tier.color}10` } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-1 self-stretch rounded"
                      style={{ backgroundColor: tier.color, minHeight: 36 }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{tier.name}</span>
                        {isPrimary && (
                          <span
                            className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded text-background"
                            style={{ backgroundColor: "hsl(var(--success))" }}
                          >
                            Top spend
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                        {tier.users} users · {formatCurrency(tier.costPerUser, effectiveCurrency)}/user
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: isPrimary ? tier.color : undefined }}
                      >
                        {formatCurrency(tier.totalCost, effectiveCurrency)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
                        {pctOfSpend.toFixed(0)}% of spend
                      </div>
                    </div>
                  </div>

                  {hasOptimization && (
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/60 text-[11px]">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        {userDiff > 0 ? (
                          <ArrowUp className="w-3 h-3 text-primary" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-warning" />
                        )}
                        Recommended:{" "}
                        <span className="text-foreground font-medium tabular-nums">
                          {tier.recommended} users
                        </span>
                        <span className={userDiff > 0 ? "text-primary" : "text-warning"}>
                          ({userDiff > 0 ? "+" : ""}
                          {userDiff})
                        </span>
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {userDiff < 0 ? "Save " : "Add "}
                        {formatCurrency(tierSavings, effectiveCurrency)}/mo
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Side breakdown panel */}
          <div className="rounded-md border border-border bg-muted/30 p-3 flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Cost summary
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Current</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(totalCost, effectiveCurrency)}/mo
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Optimised</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(optimizedCost, effectiveCurrency)}/mo
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs pt-2 border-t border-border">
                <span className="text-foreground font-medium">
                  {potentialSavings >= 0 ? "Savings" : "Overrun"}
                </span>
                <span
                  className={`font-display font-semibold text-base tabular-nums ${
                    potentialSavings >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {formatCurrency(Math.abs(potentialSavings), effectiveCurrency)}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Tiers
              </div>
              {effectiveTiers.map((t) => {
                const pct = totalCost > 0 ? (t.totalCost / totalCost) * 100 : 0;
                return (
                  <div
                    key={t.name}
                    className="flex justify-between items-center text-xs px-1 py-0.5"
                  >
                    <span className="flex gap-1.5 items-center min-w-0">
                      <span
                        className="w-2 h-2 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="truncate text-muted-foreground">{t.name}</span>
                    </span>
                    <span className="tabular-nums font-medium" style={{ color: t.color }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recommendation banner */}
        <div className="rounded-md border border-success/30 bg-success/5 px-3 py-2">
          <p className="text-xs text-foreground leading-snug">
            <span className="text-success font-semibold">Optimisation:</span> {optimisationSummary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LicenseTierDashboard;
