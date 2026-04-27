import { AlertTriangle, Info, CheckCircle, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScenarioRequiredField } from "@/lib/scenarios";
import type { EvaluationResult } from "@/lib/input-evaluator/types";

interface DataRequirementsAlertProps {
  missingRequired: ScenarioRequiredField[];
  missingOptional: ScenarioRequiredField[];
  onFieldClick?: (fieldId: string) => void;
  /** Quality evaluation result from useInputEvaluator */
  evaluation?: EvaluationResult | null;
}

const DataRequirementsAlert = ({
  missingRequired,
  missingOptional,
  onFieldClick,
  evaluation,
}: DataRequirementsAlertProps) => {
  const [showBlockDetails, setShowBlockDetails] = useState(false);
  const hasRequiredMissing = missingRequired.length > 0;
  const hasOptionalMissing = missingOptional.length > 0;

  // ── Quality-aware banner (when evaluation is available) ──
  if (evaluation) {
    const { overallStatus, score, blocks, coachingMessages, gdprWarnings, financialImpactWarning } = evaluation;

    const statusConfig = {
      READY: {
        border: "border-success/30",
        bg: "bg-success/10",
        icon: <CheckCircle className="w-5 h-5 text-success mt-0.5" />,
        title: "Data Quality: Ready",
        titleColor: "text-success",
        badgeBg: "bg-success/20 text-success",
      },
      IMPROVABLE: {
        border: "border-warning/30",
        bg: "bg-warning/10",
        icon: <Info className="w-5 h-5 text-warning mt-0.5" />,
        title: "Data Quality: Improvable",
        titleColor: "text-warning",
        badgeBg: "bg-warning/20 text-warning",
      },
      INSUFFICIENT: {
        border: "border-destructive/30",
        bg: "bg-destructive/10",
        icon: <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />,
        title: "Data Quality: Insufficient",
        titleColor: "text-destructive",
        badgeBg: "bg-destructive/20 text-destructive",
      },
    }[overallStatus];

    return (
      <div className="space-y-3">
        {/* Main quality banner */}
        <div className={cn("rounded-lg border p-4", statusConfig.border, statusConfig.bg)}>
          <div className="flex items-start gap-3">
            {statusConfig.icon}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn("font-semibold", statusConfig.titleColor)}>
                  {statusConfig.title}
                </h4>
              </div>

              {/* Coaching messages */}
              {coachingMessages.map((msg, i) => (
                <p key={i} className="text-sm text-muted-foreground mt-1">
                  {msg}
                </p>
              ))}

              {/* Per-block status breakdown (collapsible) */}
              {blocks.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowBlockDetails(!showBlockDetails)}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showBlockDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showBlockDetails ? "Hide" : "Show"} field details
                  </button>

                  {showBlockDetails && (
                    <div className="mt-2 space-y-2">
                      {blocks.map((block) => (
                        <div key={block.fieldId} className="flex items-start gap-2">
                          <span className={cn(
                            "mt-1 w-2 h-2 rounded-full shrink-0",
                            block.status === "pass" && "bg-success",
                            block.status === "warning" && "bg-warning",
                            block.status === "fail" && "bg-destructive"
                          )} />
                          <div className="flex-1">
                            <button
                              onClick={() => onFieldClick?.(block.fieldId)}
                              className={cn(
                                "text-left text-sm",
                                onFieldClick && "cursor-pointer hover:underline"
                              )}
                            >
                              <span className="font-medium text-foreground">{block.label}</span>
                            </button>
                            {block.checks.filter((c) => c.severity !== "INFO").map((check, ci) => (
                              <p key={ci} className="text-xs text-muted-foreground mt-0.5 pl-0">
                                {check.suggestion || check.message}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GDPR warnings */}
        {gdprWarnings.length > 0 && (
          <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-warning">Privacy Notice</p>
                {gdprWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-muted-foreground mt-0.5">{w.message}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Financial impact warning */}
        {financialImpactWarning && overallStatus !== "READY" && (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">💰 Value at Risk:</span> {financialImpactWarning}
            </p>
          </div>
        )}

        {/* Show missing fields as suggestions, not blockers */}
        {hasRequiredMissing && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-warning mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-warning">Suggested Fields</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-2">Adding these will improve analysis accuracy:</p>
                <ul className="space-y-1">
                  {missingRequired.map((field) => (
                    <li key={field.id} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0" />
                      <button
                        onClick={() => onFieldClick?.(field.id)}
                        className={cn("text-left text-sm hover:underline", onFieldClick && "cursor-pointer")}
                      >
                        <span className="font-medium text-foreground">{field.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Fallback: existing presence-only UI ──

  if (!hasRequiredMissing && !hasOptionalMissing) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/10 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-success mt-0.5" />
          <div>
            <h4 className="font-semibold text-success">All Data Provided</h4>
            <p className="text-sm text-success/80 mt-1">
              You've provided all the required information. The analysis will have full accuracy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasRequiredMissing && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive">Required Information Missing</h4>
              <p className="text-sm text-destructive/80 mt-1 mb-3">
                Please provide the following information to proceed with the analysis:
              </p>
              <ul className="space-y-2">
                {missingRequired.map((field) => (
                  <li key={field.id} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                    <button
                      onClick={() => onFieldClick?.(field.id)}
                      className={cn(
                        "text-left text-sm hover:underline",
                        onFieldClick && "cursor-pointer"
                      )}
                    >
                      <span className="font-medium text-foreground">{field.label}</span>
                      <span className="text-muted-foreground"> — {field.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {hasOptionalMissing && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-warning mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-warning">Analysis Limitations</h4>
              <p className="text-sm text-warning/80 mt-1 mb-3">
                The following optional data is missing. The analysis will proceed, but recommendations 
                may be less precise in these areas:
              </p>
              <ul className="space-y-2">
                {missingOptional.map((field) => (
                  <li key={field.id} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0" />
                    <button
                      onClick={() => onFieldClick?.(field.id)}
                      className={cn(
                        "text-left text-sm hover:underline",
                        onFieldClick && "cursor-pointer"
                      )}
                    >
                      <span className="font-medium text-foreground">{field.label}</span>
                      <span className="text-muted-foreground"> — {field.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRequirementsAlert;
