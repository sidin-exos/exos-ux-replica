import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle2, AlertCircle, XCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CoverageSection {
  heading: string;
  status: "covered" | "partial" | "missing";
  reason: string;
}

export interface CoverageResult {
  sections: CoverageSection[];
  /** 0–5 in 0.5 increments */
  overallScore: number;
  summary: string;
}

interface AICoverageCheckProps {
  scenarioTitle: string;
  /** Free-text context — typically project description or concatenated form data. */
  description: string;
  /** Optional file names that imply additional coverage. */
  fileNames?: string[];
  /** "What data do I need to prepare?" sections. */
  sections: { heading: string; description: string }[];
  /** Visual label/CTA copy. */
  title?: string;
  subtitle?: string;
}

/**
 * Reusable LLM-based coverage check that scores user-provided context against
 * the scenario's recommended-data sections. Returns a 0–5 score (0.5 steps).
 *
 * Used by:
 *  - Project Evaluator (project description + attached files)
 *  - Scenario Wizard data-review step (form-data text)
 */
export function AICoverageCheck({
  scenarioTitle,
  description,
  fileNames = [],
  sections,
  title = "AI coverage check",
  subtitle = "Score your context against the recommended data sections.",
}: AICoverageCheckProps) {
  const [coverage, setCoverage] = useState<CoverageResult | null>(null);
  const [loading, setLoading] = useState(false);

  const hasContent = description?.trim().length > 0 || fileNames.length > 0;

  const runCheck = async () => {
    setLoading(true);
    setCoverage(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "evaluate-project-coverage",
        {
          body: {
            scenarioTitle,
            description,
            fileNames,
            sections,
          },
        },
      );
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setCoverage(data as CoverageResult);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to evaluate coverage",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={loading || !hasContent}
          onClick={runCheck}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Evaluating…
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Run AI check
            </>
          )}
        </Button>
      </div>

      {coverage && <CoverageResults result={coverage} />}
    </div>
  );
}

function ScoreStars({ score }: { score: number }) {
  // 5 stars, half-fill supported
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = score >= i;
        const half = !filled && score >= i - 0.5;
        return (
          <div key={i} className="relative w-4 h-4">
            <Star className="absolute inset-0 w-4 h-4 text-muted-foreground/30" />
            {(filled || half) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : "50%" }}
              >
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CoverageResults({ result }: { result: CoverageResult }) {
  const score = Math.max(0, Math.min(5, Number(result.overallScore) || 0));
  const scoreColor =
    score >= 3.75
      ? "text-emerald-600"
      : score >= 2.5
      ? "text-amber-600"
      : "text-destructive";

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Coverage score
        </span>
        <div className="flex items-center gap-2">
          <ScoreStars score={score} />
          <span className={`text-lg font-display font-bold ${scoreColor}`}>
            {score.toFixed(1)}/5
          </span>
        </div>
      </div>
      <p className="text-sm text-foreground">{result.summary}</p>
      <ul className="space-y-2">
        {result.sections.map((s, i) => {
          const Icon =
            s.status === "covered"
              ? CheckCircle2
              : s.status === "partial"
              ? AlertCircle
              : XCircle;
          const color =
            s.status === "covered"
              ? "text-emerald-600"
              : s.status === "partial"
              ? "text-amber-600"
              : "text-destructive";
          return (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
              <div>
                <p className="font-medium text-foreground">{s.heading}</p>
                <p className="text-xs text-muted-foreground">{s.reason}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
