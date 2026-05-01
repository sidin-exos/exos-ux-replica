import { Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ifrs16ImpactData } from "@/lib/dashboard-data-parser";

interface Props {
  parsedData?: Ifrs16ImpactData;
}

const formatCurrency = (value: number | null | undefined, currency = "€"): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${currency}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${currency}${(abs / 1_000).toFixed(0)}K`;
  return `${currency}${abs.toFixed(0)}`;
};

const IFRS16ImpactDashboard = ({ parsedData }: Props) => {
  if (!parsedData || !parsedData.options || parsedData.options.length === 0) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-display text-base">IFRS 16 Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No IFRS 16 data available — confirm whether the lease is on or off balance sheet to generate this view.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currency = parsedData.currency || "€";
  const opts = parsedData.options;

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Scale className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <CardTitle className="font-display text-base">IFRS 16 Impact</CardTitle>
            <p className="text-xs text-muted-foreground">Balance-sheet and P&amp;L treatment per option</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border/40">
                <th className="text-left font-normal py-2 pr-3">Treatment</th>
                {opts.map((o) => (
                  <th key={o.id} className="text-left font-normal py-2 pr-3 min-w-[160px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: o.color }} />
                      <span className="text-foreground font-semibold">{o.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/20">
                <td className="py-2 pr-3 text-muted-foreground">Balance-sheet status</td>
                {opts.map((o) => (
                  <td key={o.id} className="py-2 pr-3">
                    {o.onBalanceSheet === true ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        On balance sheet
                      </span>
                    ) : o.onBalanceSheet === false ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        Off balance sheet
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/20">
                <td className="py-2 pr-3 text-muted-foreground">Right-of-use asset</td>
                {opts.map((o) => (
                  <td key={o.id} className="py-2 pr-3 tabular-nums text-foreground">
                    {formatCurrency(o.rightOfUseAsset, currency)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/20">
                <td className="py-2 pr-3 text-muted-foreground">Lease liability</td>
                {opts.map((o) => (
                  <td key={o.id} className="py-2 pr-3 tabular-nums text-foreground">
                    {formatCurrency(o.leaseLiability, currency)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/20">
                <td className="py-2 pr-3 text-muted-foreground">Tax shield value</td>
                {opts.map((o) => (
                  <td key={o.id} className="py-2 pr-3 tabular-nums text-foreground">
                    {formatCurrency(o.taxShieldValue, currency)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/20">
                <td className="py-2 pr-3 text-muted-foreground align-top">P&amp;L treatment</td>
                {opts.map((o) => (
                  <td key={o.id} className="py-2 pr-3 text-foreground leading-snug">
                    {o.plTreatment ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pr-3 text-muted-foreground align-top">Balance-sheet impact</td>
                {opts.map((o) => (
                  <td key={o.id} className="py-2 pr-3 text-foreground leading-snug">
                    {o.balanceSheetImpact ?? "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {parsedData.ifrs16Note && (
          <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
              CFO note
            </p>
            <p className="text-xs text-foreground leading-snug">{parsedData.ifrs16Note}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IFRS16ImpactDashboard;
