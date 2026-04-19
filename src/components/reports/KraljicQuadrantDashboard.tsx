import { Grid3X3, Shield, Filter, ClipboardList, Zap } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KraljicData } from "@/lib/dashboard-data-parser";

type Quadrant = "strategic" | "leverage" | "bottleneck" | "non-critical";

interface PositionedItem {
  id: string;
  name: string;
  supplyRisk: number;
  businessImpact: number;
  spend?: string;
}

interface KraljicQuadrantDashboardProps {
  title?: string;
  subtitle?: string;
  items?: PositionedItem[];
  parsedData?: KraljicData;
}

const defaultItems: PositionedItem[] = [
  { id: "A", name: "Custom Electronics", supplyRisk: 85, businessImpact: 90, spend: "$2.1M" },
  { id: "B", name: "Specialty Chemicals", supplyRisk: 75, businessImpact: 70, spend: "$890K" },
  { id: "C", name: "Precision Motors", supplyRisk: 80, businessImpact: 35, spend: "$340K" },
  { id: "D", name: "Commodity Steel", supplyRisk: 25, businessImpact: 75, spend: "$1.5M" },
  { id: "E", name: "Office Supplies", supplyRisk: 15, businessImpact: 10, spend: "$45K" },
  { id: "F", name: "Standard Packaging", supplyRisk: 30, businessImpact: 25, spend: "$180K" },
];

// Muted EXOS palette — matched to Data Quality / Action Checklist / SOW
const QUADRANT_META: Record<
  Quadrant,
  {
    label: string;
    strategy: string;
    description: string;
    color: string;
    icon: typeof Shield;
  }
> = {
  strategic: {
    label: "Strategic",
    strategy: "Partner & Collaborate",
    description:
      "High profit impact and high supply risk. Build long-term partnerships, lock multi-year contracts, and co-invest in continuity.",
    color: "hsl(358, 38%, 48%)", // muted plum/red
    icon: Shield,
  },
  leverage: {
    label: "Leverage",
    strategy: "Maximise Value",
    description:
      "High profit impact, low supply risk. Use competitive tendering, consolidate spend and renegotiate to capture price reductions.",
    color: "hsl(174, 35%, 38%)", // teal
    icon: Zap,
  },
  bottleneck: {
    label: "Bottleneck",
    strategy: "Secure Supply",
    description:
      "Low profit impact but high supply risk. Diversify sources, qualify alternatives, and explore substitution to reduce dependency.",
    color: "hsl(35, 28%, 45%)", // muted amber
    icon: Filter,
  },
  "non-critical": {
    label: "Non-Critical",
    strategy: "Simplify & Automate",
    description:
      "Low impact and low risk. Standardise specs, automate ordering and minimise administrative overhead.",
    color: "hsl(220, 22%, 48%)", // slate-blue
    icon: ClipboardList,
  },
};

const QUADRANT_ORDER: Quadrant[] = ["strategic", "leverage", "bottleneck", "non-critical"];

// 2x2 layout order: top-left → top-right → bottom-left → bottom-right
const MATRIX_ORDER: [Quadrant, Quadrant, Quadrant, Quadrant] = [
  "leverage",
  "strategic",
  "non-critical",
  "bottleneck",
];

const getQuadrant = (supplyRisk: number, businessImpact: number): Quadrant => {
  if (supplyRisk >= 50 && businessImpact >= 50) return "strategic";
  if (supplyRisk < 50 && businessImpact >= 50) return "leverage";
  if (supplyRisk >= 50 && businessImpact < 50) return "bottleneck";
  return "non-critical";
};

const KraljicQuadrantDashboard = ({
  title = "Kraljic Matrix",
  subtitle = "Strategic positioning",
  items = defaultItems,
  parsedData,
}: KraljicQuadrantDashboardProps) => {
  const effectiveItems = parsedData?.items || items;

  const groupedItems = useMemo(() => {
    const map: Record<Quadrant, PositionedItem[]> = {
      strategic: [],
      leverage: [],
      bottleneck: [],
      "non-critical": [],
    };
    effectiveItems.forEach((item) => {
      map[getQuadrant(item.supplyRisk, item.businessImpact)].push(item);
    });
    return map;
  }, [effectiveItems]);

  const counts = {
    strategic: groupedItems.strategic.length,
    leverage: groupedItems.leverage.length,
    bottleneck: groupedItems.bottleneck.length,
    "non-critical": groupedItems["non-critical"].length,
  };
  const total = effectiveItems.length;

  // Portfolio risk = share of items in high-risk quadrants (Strategic + Bottleneck)
  const highRiskCount = counts.strategic + counts.bottleneck;
  const portfolioRiskPct = total ? Math.round((highRiskCount / total) * 100) : 0;

  const heroColor =
    portfolioRiskPct >= 50
      ? QUADRANT_META.strategic.color
      : portfolioRiskPct >= 25
        ? QUADRANT_META.bottleneck.color
        : QUADRANT_META.leverage.color;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Grid3X3 className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-semibold" style={{ color: heroColor }}>
              {portfolioRiskPct}%
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              portfolio risk
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stacked distribution bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Quadrant distribution
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
              {total} items
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-muted">
            {QUADRANT_ORDER.map((q) => {
              const pct = total ? (counts[q] / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={q}
                  style={{ width: `${pct}%`, backgroundColor: QUADRANT_META[q].color }}
                  title={`${QUADRANT_META[q].label}: ${counts[q]}`}
                />
              );
            })}
          </div>
        </div>

        {/* Two-column: matrix + side panel */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          {/* Matrix */}
          <div className="relative">
            {/* Y-axis label */}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-muted-foreground whitespace-nowrap tracking-wider uppercase">
              Profit Impact
            </div>
            <div className="absolute left-3 top-1 text-[9px] text-muted-foreground/70">High</div>
            <div className="absolute left-3 bottom-7 text-[9px] text-muted-foreground/70">Low</div>

            {/* Grid */}
            <div className="ml-8 grid grid-cols-2 grid-rows-2 border border-border rounded-md overflow-hidden">
              {MATRIX_ORDER.map((q) => {
                const meta = QUADRANT_META[q];
                const Icon = meta.icon;
                const qItems = groupedItems[q] || [];
                const sharePct = total ? Math.round((qItems.length / total) * 100) : 0;
                return (
                  <div
                    key={q}
                    className="relative flex flex-col min-h-[130px] border border-border/40"
                    style={{ backgroundColor: `${meta.color}10` }}
                  >
                    {/* Header */}
                    <div
                      className="flex items-center justify-between px-2 py-1 text-background"
                      style={{ backgroundColor: meta.color }}
                    >
                      <span className="text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider tabular-nums">
                        {qItems.length} · {sharePct}%
                      </span>
                    </div>
                    {/* Items */}
                    <div className="flex flex-wrap gap-1 p-2 flex-1 content-start">
                      {qItems.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold tabular-nums"
                          style={{
                            backgroundColor: `${meta.color}25`,
                            color: meta.color,
                            border: `1px solid ${meta.color}55`,
                          }}
                          title={item.name}
                        >
                          {item.id}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis */}
            <div className="ml-8 flex justify-between mt-1.5 px-1">
              <span className="text-[9px] text-muted-foreground/70">Low</span>
              <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">
                Supply Risk
              </span>
              <span className="text-[9px] text-muted-foreground/70">High</span>
            </div>
          </div>

          {/* Side panel: Strategy summary */}
          <div className="rounded-md border border-border bg-muted/30 p-3 flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Strategy summary
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Total items</span>
                <span className="font-semibold tabular-nums">{total}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">High-risk</span>
                <span className="font-semibold tabular-nums">
                  {highRiskCount} / {total}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs pt-2 border-t border-border">
                <span className="text-foreground font-medium">Portfolio risk</span>
                <span
                  className="font-display font-semibold text-base tabular-nums"
                  style={{ color: heroColor }}
                >
                  {portfolioRiskPct}%
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Quadrants
              </div>
              {QUADRANT_ORDER.map((q) => {
                const meta = QUADRANT_META[q];
                const Icon = meta.icon;
                return (
                  <div
                    key={q}
                    className="flex justify-between items-center text-xs px-1 py-0.5"
                  >
                    <span className="flex gap-1.5 items-center min-w-0 text-muted-foreground">
                      <Icon className="w-3 h-3 flex-shrink-0" style={{ color: meta.color }} />
                      <span className="truncate">{meta.label}</span>
                    </span>
                    <span
                      className="tabular-nums font-medium"
                      style={{ color: meta.color }}
                    >
                      {counts[q]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Item legend grouped by quadrant */}
        <div className="rounded-md border border-border overflow-hidden">
          <div className="px-2.5 py-1.5 bg-muted/40 border-b border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Item legend
            </span>
          </div>
          <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
            {QUADRANT_ORDER.flatMap((q) =>
              (groupedItems[q] || []).map((item) => {
                const meta = QUADRANT_META[q];
                return (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-0.5 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden
                    />
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold tabular-nums flex-shrink-0"
                      style={{
                        backgroundColor: `${meta.color}25`,
                        color: meta.color,
                        border: `1px solid ${meta.color}55`,
                      }}
                    >
                      {item.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate text-[11px] leading-tight">
                        {item.name}
                      </p>
                      {item.spend && (
                        <p className="text-muted-foreground text-[10px] leading-tight">
                          {item.spend}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KraljicQuadrantDashboard;
