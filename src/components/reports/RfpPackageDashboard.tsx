import { FileSignature, CheckCircle2, AlertTriangle, FileText, ListChecks, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RfpPackageData } from "@/lib/dashboard-data-parser";

interface RfpPackageDashboardProps {
  parsedData?: RfpPackageData;
}

const SEVERITY_COLOR: Record<"HIGH" | "MEDIUM" | "LOW", string> = {
  HIGH: "hsl(0, 60%, 45%)",
  MEDIUM: "hsl(35, 75%, 45%)",
  LOW: "hsl(174, 35%, 38%)",
};

const RfpPackageDashboard = ({ parsedData }: RfpPackageDashboardProps) => {
  if (!parsedData) {
    return (
      <Card className="card-elevated h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <FileSignature className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">RFP Package</CardTitle>
              <p className="text-xs text-muted-foreground">No structured RFP data available</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-foreground">
            The AI did not return a structured RFP package. Re-run the analysis with the latest schema to populate this dashboard.
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    extractedBrief,
    tenderDocument,
    evaluationMatrix,
    clarifications,
    suggestedAttachments,
    deliverablesCoverage,
  } = parsedData;

  const coveragePct = deliverablesCoverage.total
    ? Math.round((deliverablesCoverage.delivered / deliverablesCoverage.total) * 100)
    : 0;
  const heroColor =
    coveragePct >= 80 ? "hsl(174, 35%, 38%)" : coveragePct >= 60 ? "hsl(35, 75%, 45%)" : "hsl(0, 60%, 45%)";

  const totalCriteriaWeight = evaluationMatrix?.totalWeightCheck ?? 0;

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <FileSignature className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">RFP Package</CardTitle>
              <p className="text-xs text-muted-foreground">
                {extractedBrief.packageType} · {extractedBrief.scopeType ?? "Scope undefined"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-semibold tabular-nums" style={{ color: heroColor }}>
              {deliverablesCoverage.delivered}/{deliverablesCoverage.total}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">deliverables</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Coverage bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Package coverage
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
              {coveragePct}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${coveragePct}%`, backgroundColor: heroColor }}
            />
          </div>
          {deliverablesCoverage.missing.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Missing: {deliverablesCoverage.missing.join(", ")}
            </p>
          )}
        </div>

        {/* Brief summary */}
        <div className="rounded-md border border-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Extracted brief
            </span>
          </div>
          <p className="text-xs text-foreground leading-snug">{extractedBrief.summary}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            {extractedBrief.annualBudgetEur != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium tabular-nums">€{extractedBrief.annualBudgetEur.toLocaleString()}</span>
              </div>
            )}
            {extractedBrief.volume && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume</span>
                <span className="font-medium truncate ml-2">{extractedBrief.volume}</span>
              </div>
            )}
            {extractedBrief.deadlines.submissionDue && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submission due</span>
                <span className="font-medium">{extractedBrief.deadlines.submissionDue}</span>
              </div>
            )}
            {extractedBrief.deadlines.awardTarget && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Award target</span>
                <span className="font-medium">{extractedBrief.deadlines.awardTarget}</span>
              </div>
            )}
          </div>
          {extractedBrief.mandatoryCompliance.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {extractedBrief.mandatoryCompliance.slice(0, 8).map((c) => (
                <span
                  key={c}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/40 text-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tender document */}
        <div className="rounded-md border border-border overflow-hidden">
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/40">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              Tender document
            </span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {tenderDocument?.sections.length ?? 0} sections
            </span>
          </div>
          {tenderDocument && tenderDocument.sections.length > 0 ? (
            <div className="divide-y divide-border/60">
              {tenderDocument.sections.slice(0, 8).map((s, i) => (
                <div key={i} className="px-2.5 py-1.5 text-xs flex items-center justify-between gap-2">
                  <span className="truncate">{s.heading}</span>
                  {s.mandatory && (
                    <span className="text-[10px] uppercase tracking-wider text-warning">Mandatory</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-2.5 py-2 text-xs text-muted-foreground">No sections drafted.</div>
          )}
        </div>

        {/* Evaluation matrix */}
        <div className="rounded-md border border-border overflow-hidden">
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/40">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
              <ListChecks className="w-3 h-3" />
              Evaluation matrix
            </span>
            <span
              className="text-[10px] tabular-nums"
              style={{
                color: evaluationMatrix?.weightsBalanced ? "hsl(174, 35%, 38%)" : "hsl(0, 60%, 45%)",
              }}
            >
              Total weight: {totalCriteriaWeight}%
            </span>
          </div>
          {evaluationMatrix && evaluationMatrix.criteria.length > 0 ? (
            <div className="divide-y divide-border/60">
              {evaluationMatrix.criteria.map((c, i) => (
                <div key={i} className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="tabular-nums text-muted-foreground">{c.weightPct}%</span>
                  </div>
                  <div className="h-1 mt-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, c.weightPct)}%`, backgroundColor: "hsl(174, 35%, 38%)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-2.5 py-2 text-xs text-muted-foreground">No evaluation criteria defined.</div>
          )}
        </div>

        {/* Clarifications + Attachments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border border-border overflow-hidden">
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/40">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Clarifications ({clarifications.length})
              </span>
            </div>
            {clarifications.length > 0 ? (
              <div className="divide-y divide-border/60">
                {clarifications.slice(0, 5).map((q, i) => (
                  <div key={i} className="px-2.5 py-1.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span
                        className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: SEVERITY_COLOR[q.severity] }}
                      />
                      <span className="text-foreground leading-snug">{q.question}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-2.5 py-2 text-xs text-muted-foreground">No outstanding clarifications.</div>
            )}
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/40">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
                <Paperclip className="w-3 h-3" />
                Suggested attachments ({suggestedAttachments.length})
              </span>
            </div>
            {suggestedAttachments.length > 0 ? (
              <div className="divide-y divide-border/60">
                {suggestedAttachments.slice(0, 5).map((a, i) => (
                  <div key={i} className="px-2.5 py-1.5 text-xs flex items-center justify-between gap-2">
                    <span className="truncate text-foreground">{a.name}</span>
                    {a.templateAvailable && (
                      <span className="text-[10px] uppercase tracking-wider text-success flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Template
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-2.5 py-2 text-xs text-muted-foreground">No attachments suggested.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RfpPackageDashboard;
