import { FileText, CheckCircle2, AlertTriangle, XCircle, Star, Lightbulb } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SOWAnalysisData } from "@/lib/dashboard-data-parser";

interface SOWAnalysisDashboardProps {
  parsedData?: SOWAnalysisData;
}

type SectionStatus = "complete" | "partial" | "missing";

const MAX_SCORE = 5;

// Muted EXOS palette — matched to Data Quality / Action Checklist / License Distribution
const STATUS_META: Record<
  SectionStatus,
  { label: string; color: string; icon: typeof CheckCircle2; opacity: number }
> = {
  complete: { label: "Complete", color: "hsl(174, 35%, 38%)", icon: CheckCircle2, opacity: 1 },
  partial: { label: "Needs Review", color: "hsl(35, 28%, 45%)", icon: AlertTriangle, opacity: 1 },
  missing: { label: "Missing", color: "hsl(358, 38%, 48%)", icon: XCircle, opacity: 1 },
};

const STATUS_ORDER: SectionStatus[] = ["complete", "partial", "missing"];

const defaultSowAnalysis = {
  clarity: 3.5,
  sections: [
    { name: "Scope Definition", status: "partial", note: "Deliverables in sections 3.2 and 4.1 are vague and lack measurable acceptance criteria, leaving room for scope creep and disputes during execution and final sign-off." },
    { name: "Timeline & Milestones", status: "complete", note: "Schedule is clearly defined with specific dates, dependencies, and milestone owners, providing a solid baseline for tracking progress and managing delivery risk." },
    { name: "Payment Terms", status: "partial", note: "Payment schedule is present but not tied to milestone completion or deliverable acceptance, creating cash-flow exposure if work slips or quality issues arise post-invoicing." },
    { name: "IP & Ownership", status: "complete", note: "Intellectual property assignment clause is explicitly included, covering work product, derivative works, and background IP usage rights for both parties throughout the engagement." },
    { name: "SLA & Performance", status: "missing", note: "No service level agreements, uptime guarantees, response times, or performance KPIs are defined, leaving the buyer without contractual remedies if delivery quality degrades." },
    { name: "Termination Rights", status: "missing", note: "Termination clauses are absent, including notice periods, cause vs convenience triggers, and wind-down obligations, exposing both parties to costly disputes if the relationship ends." },
  ],
  recommendations: [
    "Add specific deliverable acceptance criteria",
    "Include change order process",
    "Define dispute resolution mechanism",
  ],
};

const formatScore = (v: number): string => v.toFixed(1).replace(/\.0$/, "");

const StarRating = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="flex items-center gap-0.5" aria-label={`${value} of ${max}`}>
    {Array.from({ length: max }).map((_, i) => {
      const fill = Math.max(0, Math.min(1, value - i));
      return (
        <span key={i} className="relative inline-block w-3.5 h-3.5">
          <Star className="absolute inset-0 w-3.5 h-3.5 text-muted-foreground/30" />
          {fill > 0 && (
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="w-3.5 h-3.5" style={{ color, fill: color }} />
            </span>
          )}
        </span>
      );
    })}
  </div>
);

const SOWAnalysisDashboard = ({ parsedData }: SOWAnalysisDashboardProps) => {
  const sowAnalysis = parsedData
    ? { clarity: parsedData.clarity, sections: parsedData.sections, recommendations: parsedData.recommendations || [] }
    : defaultSowAnalysis;

  const normalizedSections = useMemo(
    () =>
      sowAnalysis.sections.map((s) => ({
        ...s,
        status: (STATUS_ORDER.includes(s.status as SectionStatus)
          ? s.status
          : "partial") as SectionStatus,
      })),
    [sowAnalysis.sections]
  );

  const grouped = useMemo(() => {
    const map: Record<SectionStatus, typeof normalizedSections> = {
      complete: [],
      partial: [],
      missing: [],
    };
    normalizedSections.forEach((s) => map[s.status].push(s));
    return map;
  }, [normalizedSections]);

  const counts = {
    complete: grouped.complete.length,
    partial: grouped.partial.length,
    missing: grouped.missing.length,
  };

  const total = normalizedSections.length;
  const clarityPct = Math.round((sowAnalysis.clarity / MAX_SCORE) * 100);
  const heroColor =
    clarityPct >= 70
      ? STATUS_META.complete.color
      : clarityPct >= 40
        ? STATUS_META.partial.color
        : STATUS_META.missing.color;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <FileText className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">SOW Analysis</CardTitle>
              <p className="text-xs text-muted-foreground">Contract clause coverage review</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-semibold" style={{ color: heroColor }}>
              {clarityPct}%
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              document clarity
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stacked status bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Clause distribution
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
              {total} clauses
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-muted">
            {STATUS_ORDER.map((s) => {
              const pct = total ? (counts[s] / total) * 100 : 0;
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
          {/* Grouped clause sections */}
          <div className="space-y-2">
            {STATUS_ORDER.map((status) => {
              const items = grouped[status];
              if (items.length === 0) return null;
              const meta = STATUS_META[status];
              const Icon = meta.icon;

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
                      {meta.label} ({items.length})
                    </span>
                    <span className="text-[10px] uppercase tracking-wider tabular-nums">
                      {Math.round((items.length / total) * 100)}%
                    </span>
                  </div>
                  {/* Clause rows */}
                  <div className="divide-y divide-border/60">
                    {items.map((section, idx) => (
                      <div key={idx} className="px-2.5 py-2 flex items-start gap-2 text-xs">
                        <div
                          className="w-0.5 self-stretch rounded-full flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: meta.color }}
                          aria-hidden
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium leading-snug">
                            {section.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            {section.note}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side panel */}
          <div className="rounded-md border border-border bg-muted/30 p-3 flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Clarity summary
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Total clauses</span>
                <span className="font-semibold tabular-nums">{total}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Complete</span>
                <span className="font-semibold tabular-nums">
                  {counts.complete} / {total}
                </span>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between items-baseline text-xs mb-1">
                  <span className="text-foreground font-medium">Clarity</span>
                  <span
                    className="font-display font-semibold text-base tabular-nums"
                    style={{ color: heroColor }}
                  >
                    {formatScore(sowAnalysis.clarity)} / {MAX_SCORE}
                  </span>
                </div>
                <StarRating value={sowAnalysis.clarity} max={MAX_SCORE} color={heroColor} />
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

        {/* Recommendations banner */}
        {sowAnalysis.recommendations.length > 0 && (
          <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-warning flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3" />
              Recommendations
            </p>
            {sowAnalysis.recommendations.map((rec, idx) => (
              <p key={idx} className="text-xs text-foreground leading-snug">
                <span className="text-muted-foreground mr-1">•</span>
                {rec}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SOWAnalysisDashboard;
