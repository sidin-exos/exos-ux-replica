import { useMemo, useState } from "react";
import { Network, AlertTriangle, Info } from "lucide-react";
import { ResponsiveSankey } from "@nivo/sankey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ConcentrationData,
  HhiInterpretation,
} from "@/lib/dashboard-data-parser";

interface Props {
  parsedData?: ConcentrationData;
}

type ViewMode = "category" | "supplier" | "geography";

const HHI_TONE: Record<HhiInterpretation, { fg: string; bg: string }> = {
  LOW: {
    fg: "hsl(var(--success, 142 71% 35%))",
    bg: "hsl(var(--success, 142 71% 45%) / 0.12)",
  },
  MODERATE: {
    fg: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--muted))",
  },
  HIGH: {
    fg: "hsl(var(--warning, 38 92% 40%))",
    bg: "hsl(var(--warning, 38 92% 50%) / 0.15)",
  },
  EXTREME: {
    fg: "hsl(var(--destructive))",
    bg: "hsl(var(--destructive) / 0.12)",
  },
};

const formatCurrency = (value: number | null, currency: string): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${currency}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${currency}${(abs / 1_000).toFixed(0)}K`;
  return `${currency}${Math.round(abs)}`;
};

// Sample data: realistic SaaS/tech company spend portfolio (€5M across 3 categories).
// Named suppliers used here for illustration only — production reports remain anonymised.
const sample: ConcentrationData = {
  categories: [
    { category_id: "CAT-1", category_name: "Cloud Infrastructure", hhi: 7800, hhi_interpretation: "EXTREME", annual_spend: 2_400_000 },
    { category_id: "CAT-2", category_name: "SaaS Tools", hhi: 2400, hhi_interpretation: "MODERATE", annual_spend: 1_500_000 },
    { category_id: "CAT-3", category_name: "Professional Services", hhi: 1500, hhi_interpretation: "LOW", annual_spend: 1_100_000 },
  ],
  flows: [
    // Cloud — heavy single-source concentration on AWS
    { source: "CAT-1", target: "AWS", value: 2_100_000, tier: 1, single_source_flag: true },
    { source: "CAT-1", target: "Cloudflare", value: 300_000, tier: 1, single_source_flag: false },
    // SaaS Tools — moderate split
    { source: "CAT-2", target: "Datadog", value: 620_000, tier: 1, single_source_flag: false },
    { source: "CAT-2", target: "Snowflake", value: 540_000, tier: 1, single_source_flag: false },
    { source: "CAT-2", target: "GitHub", value: 340_000, tier: 1, single_source_flag: false },
    // Professional services — healthy diversification
    { source: "CAT-3", target: "Deloitte", value: 480_000, tier: 1, single_source_flag: false },
    { source: "CAT-3", target: "Accenture", value: 380_000, tier: 1, single_source_flag: false },
    { source: "CAT-3", target: "Local boutiques", value: 240_000, tier: 1, single_source_flag: false },
  ],
  suppliers: [
    { supplier_label: "AWS", geography: "US", total_spend: 2_100_000, category_count: 1, exit_cost_estimate: 850_000, exit_cost_rationale: "Re-platforming + 12-month parallel run for production workloads." },
    { supplier_label: "Cloudflare", geography: "US", total_spend: 300_000, category_count: 1, exit_cost_estimate: 60_000, exit_cost_rationale: "DNS / CDN cutover and edge rule rebuild." },
    { supplier_label: "Datadog", geography: "US", total_spend: 620_000, category_count: 1, exit_cost_estimate: 180_000, exit_cost_rationale: "Observability re-instrumentation across services." },
    { supplier_label: "Snowflake", geography: "US", total_spend: 540_000, category_count: 1, exit_cost_estimate: 220_000, exit_cost_rationale: "Data warehouse migration + pipeline rewrites." },
    { supplier_label: "GitHub", geography: "US", total_spend: 340_000, category_count: 1, exit_cost_estimate: 90_000, exit_cost_rationale: "CI/CD pipelines and access tooling rebuild." },
    { supplier_label: "Deloitte", geography: "IE", total_spend: 480_000, category_count: 1, exit_cost_estimate: null, exit_cost_rationale: null },
    { supplier_label: "Accenture", geography: "IE", total_spend: 380_000, category_count: 1, exit_cost_estimate: null, exit_cost_rationale: null },
    { supplier_label: "Local boutiques", geography: "DE", total_spend: 240_000, category_count: 1, exit_cost_estimate: null, exit_cost_rationale: null },
  ],
  tier2_dependencies: [
    { tier1_supplier: "Snowflake", tier2_supplier: "AWS", dependency_description: "Snowflake EU region runs on AWS — compounds AWS exposure." },
  ],
  geographic_concentration: [
    { country_code: "US", spend_share_pct: 78 },
    { country_code: "IE", spend_share_pct: 17 },
    { country_code: "DE", spend_share_pct: 5 },
  ],
  currency: "€",
};

const SupplierConcentrationMapDashboard = ({ parsedData }: Props) => {
  const data = parsedData ?? sample;
  const [view, setView] = useState<ViewMode>("category");

  // Concentration analysis is meaningless with a single supplier — show notice instead.
  const uniqueSuppliers = useMemo(() => {
    const ids = new Set<string>();
    data.suppliers?.forEach((s) => ids.add(s.supplier_label));
    data.flows?.forEach((f) => ids.add(f.target));
    return ids.size;
  }, [data]);

  const sankeyData = useMemo(() => {
    const categoryMap = new Map(data.categories.map((c) => [c.category_id, c.category_name]));
    const nodeIds = new Set<string>();
    data.flows.forEach((f) => {
      nodeIds.add(f.source);
      nodeIds.add(f.target);
    });
    const nodes = Array.from(nodeIds).map((id) => ({
      id,
      label: categoryMap.get(id) ?? id,
    }));
    const links = data.flows.map((f) => ({
      source: f.source,
      target: f.target,
      value: Math.max(1, f.value),
      single_source_flag: f.single_source_flag,
    }));
    return { nodes, links };
  }, [data]);

  const sortedCategories = useMemo(
    () => [...data.categories].sort((a, b) => (b.hhi ?? 0) - (a.hhi ?? 0)),
    [data.categories]
  );

  const topExitCosts = useMemo(
    () =>
      [...data.suppliers]
        .filter((s) => s.exit_cost_estimate != null)
        .sort((a, b) => (b.exit_cost_estimate ?? 0) - (a.exit_cost_estimate ?? 0))
        .slice(0, 3),
    [data.suppliers]
  );

  const showTier2 = data.tier2_dependencies != null && data.tier2_dependencies.length > 0;

  if (uniqueSuppliers <= 1) {
    const supplierName =
      data.suppliers?.[0]?.supplier_label ?? data.flows?.[0]?.target ?? "this supplier";
    return (
      <Card className="card-elevated h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Network className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Supplier Concentration Map</CardTitle>
              <p className="text-xs text-muted-foreground">
                Spend flow with HHI and single-source flags
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Only one supplier analysed ({supplierName}) — no supplier concentration map available.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Network className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Supplier Concentration Map</CardTitle>
              <p className="text-xs text-muted-foreground">
                Spend flow with HHI and single-source flags
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 p-0.5">
            {(["category", "supplier", "geography"] as ViewMode[]).map((v) => (
              <Button
                key={v}
                variant={view === v ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {(view === "category" || view === "supplier") && sankeyData.links.length > 0 && (
          <div className="h-72">
            <ResponsiveSankey
              data={sankeyData}
              margin={{ top: 8, right: 100, bottom: 8, left: 100 }}
              align={view === "category" ? "justify" : "end"}
              colors={{ scheme: "category10" }}
              nodeOpacity={1}
              nodeThickness={14}
              nodeInnerPadding={2}
              nodeSpacing={8}
              nodeBorderWidth={0}
              linkOpacity={0.4}
              linkHoverOpacity={0.7}
              linkContract={2}
              enableLinkGradient={true}
              labelPosition="outside"
              labelOrientation="horizontal"
              labelPadding={6}
              labelTextColor="hsl(var(--foreground))"
              theme={{
                labels: { text: { fontSize: 11 } },
                tooltip: {
                  container: {
                    background: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                    fontSize: 11,
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                  },
                },
              }}
              linkBlendMode="normal"
            />
          </div>
        )}

        {view === "geography" && data.geographic_concentration.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.geographic_concentration.sort((a, b) => b.spend_share_pct - a.spend_share_pct)}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="country_code"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, "Spend share"]}
                />
                <Bar dataKey="spend_share_pct" fill="hsl(var(--primary))" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* HHI side panel */}
        {sortedCategories.length > 0 && (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              HHI by category
            </p>
            <div className="space-y-1.5">
              {sortedCategories.map((c) => {
                const tone = c.hhi_interpretation ? HHI_TONE[c.hhi_interpretation] : null;
                return (
                  <div
                    key={c.category_id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-foreground">{c.category_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-muted-foreground">
                        {c.hhi != null ? c.hhi.toFixed(0) : "—"}
                      </span>
                      {c.hhi_interpretation && tone && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 border-transparent"
                          style={{ backgroundColor: tone.bg, color: tone.fg }}
                        >
                          {c.hhi_interpretation}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top exit costs */}
        {topExitCosts.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
              Top exit-cost estimates
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {topExitCosts.map((s) => (
                <div
                  key={s.supplier_label}
                  className="rounded-lg border border-border/60 bg-muted/20 p-2.5"
                >
                  <p className="text-xs font-medium text-foreground truncate">
                    {s.supplier_label}
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-foreground mt-1">
                    {formatCurrency(s.exit_cost_estimate, data.currency)}
                  </p>
                  {s.exit_cost_rationale && (
                    <p className="text-[10px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                      {s.exit_cost_rationale}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tier-2 dependencies */}
        {showTier2 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <AlertTriangle className="w-3 h-3" />
              Tier-2 dependencies ({data.tier2_dependencies?.length ?? 0})
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-1.5">
              {data.tier2_dependencies?.map((t, i) => (
                <div
                  key={`${t.tier1_supplier}-${t.tier2_supplier}-${i}`}
                  className="text-xs text-muted-foreground rounded border border-border/40 p-2 bg-muted/10"
                >
                  <span className="text-foreground">{t.tier1_supplier}</span> depends on{" "}
                  <span className="text-foreground">{t.tier2_supplier}</span>
                  {t.dependency_description ? `: ${t.dependency_description}` : ""}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {!parsedData && (
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground border-t border-border/40 pt-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Sample data shown — rerun the analysis to populate this view.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierConcentrationMapDashboard;
