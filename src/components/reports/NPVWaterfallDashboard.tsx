import { BarChart3, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NpvWaterfallData } from "@/lib/dashboard-data-parser";

interface Props {
  parsedData?: NpvWaterfallData;
}

const formatCurrency = (value: number, currency = "€"): string => {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}${currency}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${currency}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${currency}${abs.toFixed(0)}`;
};

const NPVWaterfallDashboard = ({ parsedData }: Props) => {
  if (!parsedData || !parsedData.options || parsedData.options.length === 0) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-display text-base">NPV Waterfall</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No NPV data available — provide WACC, lifecycle costs and residual values to generate this view.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currency = parsedData.currency || "€";
  const opts = parsedData.options;
  const preferred = opts.find((o) => o.id === parsedData.preferredOptionId) ?? opts[0];

  // Build component rows for the waterfall: each option becomes a row with
  // CAPEX nominal, OPEX nominal, residual recovered, and resulting NPV.
  // Bars are scaled to the largest absolute value in the dataset.
  const maxBar = Math.max(
    1,
    ...opts.flatMap((o) => [o.capexNominal, o.opexNominal, o.residualValue, Math.abs(o.npv)]),
  );

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">NPV Waterfall</CardTitle>
              <p className="text-xs text-muted-foreground">
                Present-value comparison{preferred?.waccPct ? ` at ${preferred.waccPct}% WACC` : ""}
              </p>
            </div>
          </div>
          {preferred && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Preferred</p>
              <p className="text-sm font-semibold tabular-nums" style={{ color: preferred.color }}>
                {preferred.name}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">NPV {formatCurrency(preferred.npv, currency)}</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {opts.map((o) => {
          const isPreferred = o.id === preferred?.id;
          const components: { label: string; value: number; type: "cost" | "credit" | "result" }[] = [
            { label: "CAPEX (nominal)", value: o.capexNominal, type: "cost" },
            { label: "OPEX (nominal)", value: o.opexNominal, type: "cost" },
            ...(o.residualValue > 0
              ? ([{ label: "Residual value", value: o.residualValue, type: "credit" }] as const)
              : []),
            { label: "NPV (signed)", value: o.npv, type: "result" },
          ];

          return (
            <div key={o.id} className="rounded-lg border border-border/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: o.color }} />
                  <span className="text-sm font-semibold text-foreground">{o.name}</span>
                  {isPreferred && (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
                      style={{ color: o.color, backgroundColor: `${o.color}1A` }}
                    >
                      CFO recommended
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                  {o.breakEvenYear != null && (
                    <span>Break-even Y{o.breakEvenYear}</span>
                  )}
                  {o.ifrsOnBalanceSheet != null && (
                    <span>{o.ifrsOnBalanceSheet ? "On balance sheet" : "Off balance sheet"}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                {components.map((c) => {
                  const width = Math.max(2, (Math.abs(c.value) / maxBar) * 100);
                  const fill =
                    c.type === "credit"
                      ? "hsl(var(--success, 142 71% 45%))"
                      : c.type === "result"
                        ? c.value < 0
                          ? "hsl(var(--destructive))"
                          : o.color
                        : o.color;
                  return (
                    <div key={c.label} className="flex items-center gap-2 text-xs">
                      <div className="w-32 text-muted-foreground">{c.label}</div>
                      <div className="flex-1 h-3 bg-muted/40 rounded-sm overflow-hidden">
                        <div
                          className="h-3 rounded-sm"
                          style={{ width: `${width}%`, backgroundColor: fill, opacity: c.type === "result" ? 1 : 0.75 }}
                        />
                      </div>
                      <div className="w-24 text-right tabular-nums font-medium text-foreground">
                        {c.type === "credit" ? "−" : ""}
                        {formatCurrency(Math.abs(c.value), currency)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {opts.length >= 2 && preferred && (
          <div className="pt-3 border-t border-border/30 flex items-start gap-2 text-xs text-muted-foreground">
            <ArrowRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p>
              <span className="font-semibold text-foreground">{preferred.name}</span>{" "}
              {parsedData.verdict ? `(${parsedData.verdict.toLowerCase()})` : ""} delivers the best present value
              {(() => {
                const others = opts.filter((o) => o.id !== preferred.id);
                if (others.length === 0) return ".";
                const worst = others.reduce((w, o) => (o.npv < w.npv ? o : w), others[0]);
                const delta = preferred.npv - worst.npv;
                return ` — ${formatCurrency(Math.abs(delta), currency)} better than ${worst.name} on a discounted basis.`;
              })()}
              {parsedData.cashFlowRationale ? ` ${parsedData.cashFlowRationale}` : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NPVWaterfallDashboard;
