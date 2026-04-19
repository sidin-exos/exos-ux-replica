import { AlertCircle, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataQualityData } from "@/lib/dashboard-data-parser";

interface DataQualityDashboardProps {
  parsedData?: DataQualityData;
}

type FieldStatus = "complete" | "partial" | "missing";

const MAX_SCORE = 5;

// Muted EXOS palette — matched to License Distribution / Timeline Roadmap
const STATUS_META: Record<
  FieldStatus,
  { label: string; color: string; icon: typeof CheckCircle2; opacity: number }
> = {
  complete: { label: "Complete", color: "hsl(174, 35%, 38%)", icon: CheckCircle2, opacity: 1 },
  partial: { label: "Partial", color: "hsl(35, 28%, 45%)", icon: AlertTriangle, opacity: 1 },
  missing: { label: "Missing", color: "hsl(220, 22%, 48%)", icon: XCircle, opacity: 0.55 },
};

const STATUS_ORDER: FieldStatus[] = ["complete", "partial", "missing"];

const defaultDataFields = [
  { field: "Supplier Spend Data", status: "complete", coverage: 5 },
  { field: "Contract Terms", status: "partial", coverage: 3 },
  { field: "Historical Pricing", status: "complete", coverage: 4.5 },
  { field: "Volume Forecasts", status: "missing", coverage: 0 },
  { field: "Quality Metrics", status: "partial", coverage: 2 },
  { field: "Lead Time Data", status: "complete", coverage: 4.5 },
];

const defaultLimitations = [
  { title: "Volume Forecast Missing", impact: "Savings estimates may be ±25% less accurate" },
  { title: "Incomplete Contract Terms", impact: "Exit cost analysis partially affected" },
];

const toFiveScale = (v: number): number => {
  const scaled = v > MAX_SCORE ? (v / 100) * MAX_SCORE : v;
  const rounded = Math.round(scaled * 2) / 2;
  return Math.max(0, Math.min(MAX_SCORE, rounded));
};

const formatScore = (v: number): string => v.toFixed(1).replace(/\.0$/, "");

const DataQualityDashboard = ({ parsedData }: DataQualityDashboardProps) => {
  const dataFields = parsedData?.fields || defaultDataFields;
  const limitations = parsedData?.limitations || defaultLimitations;

  const normalizedFields = useMemo(
    () =>
      dataFields.map((f) => ({
        ...f,
        coverage: toFiveScale(f.coverage),
        status: (STATUS_ORDER.includes(f.status as FieldStatus)
          ? f.status
          : "partial") as FieldStatus,
      })),
    [dataFields]
  );

  const grouped = useMemo(() => {
    const map: Record<FieldStatus, typeof normalizedFields> = {
      complete: [],
      partial: [],
      missing: [],
    };
    normalizedFields.forEach((f) => map[f.status].push(f));
    return map;
  }, [normalizedFields]);

  const counts = {
    complete: grouped.complete.length,
    partial: grouped.partial.length,
    missing: grouped.missing.length,
  };

  const totalFields = normalizedFields.length;
  const avgScore = totalFields
    ? normalizedFields.reduce((acc, f) => acc + f.coverage, 0) / totalFields
    : 0;
  const confidencePct = Math.round((avgScore / MAX_SCORE) * 100);

  const groupAvg = (status: FieldStatus): number => {
    const arr = grouped[status];
    if (!arr.length) return 0;
    return arr.reduce((acc, f) => acc + f.coverage, 0) / arr.length;
  };

  const heroColor = STATUS_META.complete.color;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Data Quality</CardTitle>
              <p className="text-xs text-muted-foreground">Coverage by status</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-semibold" style={{ color: heroColor }}>
              {confidencePct}%
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              analysis confidence
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stacked status bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Coverage distribution
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
              {totalFields} fields
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-muted">
            {STATUS_ORDER.map((s) => {
              const pct = totalFields ? (counts[s] / totalFields) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={s}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: STATUS_META[s].color,
                    opacity: STATUS_META[s].opacity,
                  }}
                  title={`${STATUS_META[s].label}: ${counts[s]}`}
                />
              );
            })}
          </div>
        </div>

        {/* Two-column: status groups + side panel */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          {/* Grouped sections */}
          <div className="space-y-2">
            {STATUS_ORDER.map((status) => {
              const fields = grouped[status];
              if (fields.length === 0) return null;
              const meta = STATUS_META[status];
              const Icon = meta.icon;
              const avg = groupAvg(status);

              return (
                <div
                  key={status}
                  className="rounded-md border border-border overflow-hidden"
                >
                  {/* Group header */}
                  <div
                    className="flex items-center justify-between px-2.5 py-1.5 text-background"
                    style={{ backgroundColor: meta.color, opacity: meta.opacity }}
                  >
                    <span className="text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Icon className="w-3 h-3" />
                      {meta.label} ({fields.length})
                    </span>
                    <span className="text-[10px] uppercase tracking-wider tabular-nums">
                      {status === "missing" ? "0 / 5" : `avg ${formatScore(avg)} / 5`}
                    </span>
                  </div>
                  {/* Field rows */}
                  <div className="divide-y divide-border/60">
                    {fields.map((f) => {
                      const widthPct = (f.coverage / MAX_SCORE) * 100;
                      const isMissing = status === "missing";
                      return (
                        <div
                          key={f.field}
                          className="flex items-center px-2.5 py-2 gap-2 text-xs"
                        >
                          <span
                            className={`flex-1 truncate ${
                              isMissing ? "text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {f.field}
                          </span>
                          {isMissing ? (
                            <span className="text-[10px] text-warning">
                              No data — affects analysis
                            </span>
                          ) : (
                            <>
                              <div className="w-20 sm:w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${widthPct}%`,
                                    backgroundColor: meta.color,
                                  }}
                                />
                              </div>
                              <span className="tabular-nums w-8 text-right font-medium text-foreground">
                                {formatScore(f.coverage)}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side panel */}
          <div className="rounded-md border border-border bg-muted/30 p-3 flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Coverage summary
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Total fields</span>
                <span className="font-semibold tabular-nums">{totalFields}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Average score</span>
                <span className="font-semibold tabular-nums">
                  {formatScore(avgScore)} / 5
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs pt-2 border-t border-border">
                <span className="text-foreground font-medium">Confidence</span>
                <span
                  className="font-display font-semibold text-base tabular-nums"
                  style={{ color: heroColor }}
                >
                  {confidencePct}%
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Status
              </div>
              {STATUS_ORDER.map((s) => {
                const meta = STATUS_META[s];
                const Icon = meta.icon;
                return (
                  <div
                    key={s}
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
                      {counts[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Limitations banner */}
        {limitations.length > 0 && (
          <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-warning">
              Analysis limitations
            </p>
            {limitations.map((item, idx) => (
              <p key={idx} className="text-xs text-foreground leading-snug">
                <span className="font-medium">{item.title}</span>{" "}
                <span className="text-muted-foreground">— {item.impact}</span>
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataQualityDashboard;
