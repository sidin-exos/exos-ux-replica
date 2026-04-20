import { Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend as RLegend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  CFOAcceptance,
  SavingsRealizationFunnelData,
} from "@/lib/dashboard-data-parser";

interface Props {
  parsedData?: SavingsRealizationFunnelData;
}

const COLOR_HARD = "hsl(var(--primary))";
const COLOR_SOFT = "hsl(var(--accent))";
const COLOR_AVOIDED = "hsl(var(--muted-foreground) / 0.5)";

const ACCEPTANCE_STYLE: Record<CFOAcceptance, { bg: string; fg: string; label: string }> = {
  GREEN: {
    bg: "hsl(var(--success, 142 71% 45%) / 0.15)",
    fg: "hsl(var(--success, 142 71% 35%))",
    label: "CFO-grade — verified baseline + hard P&L impact",
  },
  AMBER: {
    bg: "hsl(var(--warning, 38 92% 50%) / 0.15)",
    fg: "hsl(var(--warning, 38 92% 40%))",
    label: "Conditional — verified baseline but soft / avoided only",
  },
  RED: {
    bg: "hsl(var(--destructive) / 0.12)",
    fg: "hsl(var(--destructive))",
    label: "Not CFO-grade — baseline is estimated, not verified",
  },
};

const formatCurrency = (value: number | null, currency: string): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${currency}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${currency}${(value / 1_000).toFixed(0)}K`;
  return `${currency}${Math.round(value)}`;
};

const sample: SavingsRealizationFunnelData = {
  baselineVerified: true,
  cfoAcceptance: "GREEN",
  funnel: [
    { stage: "Baseline", hard: 800_000, soft: 200_000, avoided: 100_000 },
    { stage: "Identified", hard: 240_000, soft: 80_000, avoided: 40_000 },
    { stage: "Committed", hard: 180_000, soft: 60_000, avoided: 30_000 },
    { stage: "Realized", hard: 140_000, soft: 40_000, avoided: 20_000 },
  ],
  hardAnnualised: 140_000,
  softAnnualised: 40_000,
  avoidedProtected: 20_000,
  currency: "$",
  lowConfidenceWatermark: false,
};

const ClassCard = ({
  title,
  value,
  currency,
  color,
  definition,
}: {
  title: string;
  value: number | null;
  currency: string;
  color: string;
  definition: string;
}) => (
  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-foreground">{title}</span>
      </div>
      <TooltipProvider>
        <UITooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`${title} definition`}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              ⓘ
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">{definition}</TooltipContent>
        </UITooltip>
      </TooltipProvider>
    </div>
    <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
      {formatCurrency(value, currency)}
    </p>
    <p className="text-[10px] text-muted-foreground">annualised</p>
  </div>
);

const SavingsRealizationFunnelDashboard = ({ parsedData }: Props) => {
  const data = parsedData ?? sample;
  const acceptance = ACCEPTANCE_STYLE[data.cfoAcceptance];

  return (
    <Card className="card-elevated h-full relative">
      {data.lowConfidenceWatermark && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <span className="text-6xl font-bold text-muted-foreground/10 rotate-[-18deg] uppercase tracking-widest">
            Low confidence
          </span>
        </div>
      )}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Filter className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Savings Realization Funnel</CardTitle>
              <p className="text-xs text-muted-foreground">
                CIPS classification across the savings funnel
              </p>
            </div>
          </div>
          <div
            className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
            style={{ backgroundColor: acceptance.bg, color: acceptance.fg }}
            role="status"
            aria-label={`CFO acceptance ${data.cfoAcceptance}: ${acceptance.label}`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: acceptance.fg }} />
            CFO {data.cfoAcceptance}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">{acceptance.label}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.funnel} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => formatCurrency(v, data.currency)}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value, data.currency),
                  name,
                ]}
              />
              <RLegend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="hard" stackId="a" name="Hard" fill={COLOR_HARD} />
              <Bar dataKey="soft" stackId="a" name="Soft" fill={COLOR_SOFT} />
              <Bar dataKey="avoided" stackId="a" name="Avoided" fill={COLOR_AVOIDED} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <ClassCard
            title="Hard"
            value={data.hardAnnualised}
            currency={data.currency}
            color={COLOR_HARD}
            definition="Direct P&L impact: price reduction realised on confirmed volume. Reduces unit cost vs verified baseline."
          />
          <ClassCard
            title="Soft"
            value={data.softAnnualised}
            currency={data.currency}
            color={COLOR_SOFT}
            definition="Cost avoidance not reflected in P&L (e.g. scope reduction, terms improvement). Defensible but does not reduce booked spend."
          />
          <ClassCard
            title="Avoided"
            value={data.avoidedProtected}
            currency={data.currency}
            color={COLOR_AVOIDED}
            definition="Inflation-adjusted baseline protection. Value retained against an indexed baseline rather than absolute reduction."
          />
        </div>

        {!parsedData && (
          <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-3">
            Sample data shown — populate <code>savings_classification</code> in the S4 envelope to render real data.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SavingsRealizationFunnelDashboard;
