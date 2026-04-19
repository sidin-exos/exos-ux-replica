import { Target, ArrowRight, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useThemedLogo } from "@/hooks/useThemedLogo";

import type { NegotiationPrepData } from "@/lib/dashboard-data-parser";

interface NegotiationPrepDashboardProps {
  parsedData?: NegotiationPrepData;
}

const MAX_STARS = 5;

// Round to nearest 0.5; supports legacy %-based input (>5 → /20)
const toFiveScale = (v: number): number => {
  const scaled = v > MAX_STARS ? v / 20 : v;
  return Math.max(0, Math.min(MAX_STARS, Math.round(scaled * 2) / 2));
};

const formatStars = (v: number): string => v.toFixed(1).replace(/\.0$/, "");

const StarRating = ({ value }: { value: number }) => {
  const v = toFiveScale(value);
  return (
    <div className="flex items-center gap-0.5" aria-label={`BATNA strength ${formatStars(v)} of ${MAX_STARS}`}>
      {Array.from({ length: MAX_STARS }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, v - i)); // 0, 0.5, or 1
        return (
          <span key={i} className="relative inline-block w-4 h-4">
            <Star className="absolute inset-0 w-4 h-4 text-muted-foreground/30" />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className="w-4 h-4 text-warning fill-warning" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};

const defaultNegotiationFramework = {
  batna: {
    strength: 3.5,
    description:
      "Two pre-qualified alternative suppliers identified, both with confirmed capacity and a realistic 6-week switching timeline including technical validation, contract paperwork and onboarding. This gives the team credible walk-away leverage without disrupting operational continuity.",
  },
  leveragePoints: [
    {
      point: "Volume Commitment",
      tactic:
        "Offer a 2-year volume commitment with quarterly forecast updates in exchange for a 12% unit price discount and a price-hold clause protecting against mid-term increases.",
    },
    {
      point: "Payment Terms",
      tactic:
        "Propose extending payment terms from net-30 to net-60 in return for a 3% price reduction, improving working capital while giving the supplier predictable cash flow visibility.",
    },
    {
      point: "Service Bundling",
      tactic:
        "Bundle maintenance, support and training into a single multi-year package to unlock 8–10% blended savings, reduce administrative overhead and simplify SLA governance.",
    },
    {
      point: "Competitive Pressure",
      tactic:
        "Reference a validated alternative quote priced 8% lower with comparable scope, signalling that the market is contestable while keeping the conversation collaborative rather than adversarial.",
    },
  ],
  sequence: [
    {
      step: "Open Position",
      detail:
        "Anchor the conversation with a 20% discount request justified by volume commitment, multi-year horizon and competitive benchmarks, framing it as a partnership reset rather than a price-only ask.",
    },
    {
      step: "Value Exchange",
      detail:
        "Trade a longer contract term, exclusivity on selected SKUs and joint forecasting for improved unit economics, payment terms and a documented continuous-improvement commitment.",
    },
    {
      step: "Walk-Away Point",
      detail:
        "If total savings fall below 8% and no meaningful non-price concessions are secured, pause the negotiation and activate the BATNA path with the pre-qualified alternative supplier.",
    },
  ],
};

const NegotiationPrepDashboard = ({ parsedData }: NegotiationPrepDashboardProps) => {
  const negotiationFramework = parsedData
    ? { batna: parsedData.batna, leveragePoints: parsedData.leveragePoints, sequence: parsedData.sequence }
    : defaultNegotiationFramework;
  const logo = useThemedLogo();
  return (
    <Card className="card-elevated relative overflow-hidden">
      {/* Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none z-0"
      >
        <div className="flex flex-col items-center gap-2 opacity-[0.06] rotate-[-18deg]">
          <img src={logo} alt="" className="w-32 h-32" />
          <span className="font-display text-2xl font-bold tracking-wider text-foreground whitespace-nowrap">
            EXOS Procurement Intelligence
          </span>
        </div>
      </div>
      <div className="relative z-10">
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
            <div className="flex items-center gap-2">
              <StarRating value={negotiationFramework.batna.strength} />
              <span className="text-sm font-medium text-foreground tabular-nums">
                {formatStars(toFiveScale(negotiationFramework.batna.strength))}
                <span className="text-muted-foreground"> / {MAX_STARS}</span>
              </span>
            </div>
          </div>
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
      </div>
    </Card>
  );
};

export default NegotiationPrepDashboard;
