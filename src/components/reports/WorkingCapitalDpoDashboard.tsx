import { Wallet, AlertTriangle, ChevronDown } from "lucide-react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { WorkingCapitalData } from "@/lib/dashboard-data-parser";

interface Props {
  parsedData?: WorkingCapitalData;
}

const COLOR_NET30 = "hsl(var(--primary))";
const COLOR_NET45 = "hsl(var(--accent))";
const COLOR_NET60 = "hsl(var(--muted-foreground))";
const COLOR_NET90 = "hsl(var(--destructive))";

const TERM_COLOR: Record<string, string> = {
  "NET 30": COLOR_NET30,
  "NET 45": COLOR_NET45,
  "NET 60": COLOR_NET60,
  "NET 90+": COLOR_NET90,
};

const formatCurrency = (value: number | null, currency: string): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${currency}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${currency}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${currency}${Math.round(abs)}`;
};

const WorkingCapitalDpoDashboard = ({ parsedData }: Props) => {
  // No sample-data fallback by design — render an empty state instead.
  if (!parsedData) {
    return (
      <Card className="card-elevated h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Wallet className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Working Capital &amp; DPO</CardTitle>
              <p className="text-xs text-muted-foreground">
                Payment terms distribution and working-capital release potential
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground">
              Payment terms data not provided in this scenario run.
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Add supplier payment terms (e.g. NET 30, supplier payment schedules, DPO figures) to
              Block 3 to unlock the working-capital view. Sample DPO benchmarks are intentionally
              omitted — finance figures should never be inferred from placeholder data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = parsedData;
  const dpoDelta =
    data.target_weighted_dpo != null && data.current_weighted_dpo != null
      ? data.target_weighted_dpo - data.current_weighted_dpo
      : null;

  // Build a single-row stacked horizontal bar from terms_distribution.
  const stackRow: Record<string, string | number> = { label: "Spend share" };
  data.terms_distribution.forEach((t) => {
    stackRow[t.term_label] = t.spend_share_pct;
  });

  const flaggedSuppliers = data.by_supplier
    .filter((s) => s.late_payment_directive_risk)
    .sort((a, b) => (b.annual_spend ?? 0) - (a.annual_spend ?? 0));

  const hasDiscounts = data.early_payment_discount_opportunities.length > 0;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <Wallet className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <CardTitle className="font-display text-base">Working Capital &amp; DPO</CardTitle>
            <p className="text-xs text-muted-foreground">
              Payment terms distribution and working-capital release potential
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <KpiCard
            label="Current DPO"
            value={
              data.current_weighted_dpo != null
                ? `${data.current_weighted_dpo.toFixed(0)}d`
                : "—"
            }
          />
          <KpiCard
            label="Target DPO"
            value={
              data.target_weighted_dpo != null
                ? `${data.target_weighted_dpo.toFixed(0)}d`
                : "—"
            }
          />
          <KpiCard
            label="Δ DPO"
            value={dpoDelta != null ? `${dpoDelta > 0 ? "+" : ""}${dpoDelta.toFixed(0)}d` : "—"}
            tone={dpoDelta != null && dpoDelta > 0 ? "positive" : "neutral"}
          />
          <KpiCard
            label="Working-capital impact"
            value={formatCurrency(data.working_capital_delta_eur, data.currency)}
            tone={
              data.working_capital_delta_eur != null && data.working_capital_delta_eur > 0
                ? "positive"
                : "neutral"
            }
          />
        </div>

        {/* Terms distribution */}
        {data.terms_distribution.length > 0 && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[stackRow]}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
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
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                />
                <RLegend wrapperStyle={{ fontSize: 11 }} />
                {data.terms_distribution.map((t) => (
                  <Bar
                    key={t.term_label}
                    dataKey={t.term_label}
                    stackId="terms"
                    fill={TERM_COLOR[t.term_label] ?? COLOR_NET60}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* EU Late Payment Directive risk table */}
        {flaggedSuppliers.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-destructive">
              <AlertTriangle className="w-3.5 h-3.5" />
              Suppliers above 60-day EU Late Payment Directive limit
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/40">
                  <th className="py-1 font-normal">Supplier</th>
                  <th className="py-1 font-normal">Category</th>
                  <th className="py-1 font-normal text-right">Terms</th>
                  <th className="py-1 font-normal text-right">Annual spend</th>
                </tr>
              </thead>
              <tbody>
                {flaggedSuppliers.map((s) => (
                  <tr key={s.supplier_label} className="border-b border-border/20">
                    <td className="py-1 text-foreground">{s.supplier_label}</td>
                    <td className="py-1 text-muted-foreground">{s.category ?? "—"}</td>
                    <td className="py-1 tabular-nums text-right">
                      {s.payment_terms_days}d
                    </td>
                    <td className="py-1 tabular-nums text-right">
                      {formatCurrency(s.annual_spend, data.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-muted-foreground leading-snug pt-1">
              EU Late Payment Directive 2011/7: B2B payment terms above 60 days require explicit
              contractual justification.
            </p>
          </div>
        )}

        {/* Early payment discount opportunities */}
        {hasDiscounts && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className="w-3 h-3" />
              Early payment discount opportunities (
              {data.early_payment_discount_opportunities.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border/40">
                    <th className="py-1 font-normal">Supplier</th>
                    <th className="py-1 font-normal">Discount</th>
                    <th className="py-1 font-normal text-right">Annualised value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.early_payment_discount_opportunities.map((o) => (
                    <tr key={o.supplier_label} className="border-b border-border/20">
                      <td className="py-1 text-foreground">{o.supplier_label}</td>
                      <td className="py-1 text-muted-foreground tabular-nums">
                        {o.discount_structure}
                      </td>
                      <td className="py-1 tabular-nums text-right">
                        {formatCurrency(o.annualised_value, data.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};

const KpiCard = ({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive";
}) => (
  <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
      {label}
    </p>
    <p
      className="text-base font-semibold tabular-nums text-foreground mt-1"
      style={
        tone === "positive"
          ? { color: "hsl(var(--success, 142 71% 35%))" }
          : undefined
      }
    >
      {value}
    </p>
  </div>
);

export default WorkingCapitalDpoDashboard;
