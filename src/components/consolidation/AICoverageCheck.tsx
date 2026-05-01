import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Star,
  Wand2,
  Copy,
  Check,
} from "lucide-react";
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

export interface DraftableField {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
}

interface AICoverageCheckProps {
  scenarioTitle: string;
  /** Free-text context — typically project description or concatenated form data. */
  description: string;
  /** Optional file names that imply additional coverage. */
  fileNames?: string[];
  /** "What data do I need to prepare?" sections. */
  sections: { heading: string; description: string }[];
  /**
   * Optional: scenario required-field specs. When provided, a second
   * "Draft fields with AI" button lets the user auto-generate the 3-field
   * scenario inputs from the project context.
   */
  draftableFields?: DraftableField[];
  /** Visual label/CTA copy. */
  title?: string;
  subtitle?: string;
}

/**
 * Reusable LLM-based coverage check that scores user-provided context against
 * the scenario's recommended-data sections. Returns a 0–5 score (0.5 steps).
 *
 * Optionally renders a second action that drafts the scenario's required
 * input fields from the same project context.
 */
export function AICoverageCheck({
  scenarioTitle,
  description,
  fileNames = [],
  sections,
  draftableFields,
  title = "Input coverage check",
  subtitle = "Are the required topics present in your input? (separate from analytical rigour, scored after the run.)",
}: AICoverageCheckProps) {
  const [coverage, setCoverage] = useState<CoverageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [drafted, setDrafted] = useState<Record<string, string> | null>(null);

  const hasContent = description?.trim().length > 0 || fileNames.length > 0;

  const runCheck = async () => {
    setLoading(true);
    setCoverage(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "evaluate-project-coverage",
        {
          body: { scenarioTitle, description, fileNames, sections },
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

  const runDraft = async () => {
    if (!draftableFields?.length) return;
    setDrafting(true);
    setDrafted(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "draft-scenario-fields",
        {
          body: {
            scenarioTitle,
            description,
            fileNames,
            fields: draftableFields,
            sections,
          },
        },
      );
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const fields = (data as any)?.fields as Record<string, string> | undefined;
      if (!fields) throw new Error("No drafted fields returned");
      setDrafted(fields);
      toast.success("Draft generated. Review and copy into the scenario.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to draft fields",
      );
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            disabled={loading || !hasContent}
            onClick={runCheck}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Checking…
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Check coverage
              </>
            )}
          </Button>
          {draftableFields && draftableFields.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={drafting || !hasContent}
              onClick={runDraft}
            >
              {drafting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Drafting…
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                  Draft scenario fields
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {coverage && <CoverageResults result={coverage} />}
      {drafted && draftableFields && (
        <DraftedFields fields={draftableFields} values={drafted} />
      )}
    </div>
  );
}

function ScoreStars({ score }: { score: number }) {
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

  // Predicted post-run "rigour" band. Calibrated against observed runs:
  //   - "partial" usually means a key number is implied not quantified → −15 pts
  //   - "missing" means the section isn't covered at all → −30 pts
  //   - any partial/missing on a financial/cost/savings section caps the
  //     predicted rigour at 55, because the post-run scorer penalises
  //     missing numerical evidence the hardest.
  const partialCount = result.sections.filter((s) => s.status === "partial").length;
  const missingCount = result.sections.filter((s) => s.status === "missing").length;
  const FINANCIAL_RE = /(cost|financial|savings|spend|price|budget|tco|roi|margin)/i;
  const financialSections = result.sections.filter((s) => FINANCIAL_RE.test(s.heading));
  const financialCovered = financialSections.filter((s) => s.status === "covered").length;
  const financialGaps = financialSections.filter((s) => s.status !== "covered").length;
  // Cap only when there is meaningful financial weakness:
  // ALL financial sections gappy → hard cap 55 (no quantified spend/savings at all)
  // SOME financial gaps but at least one fully covered → softer cap 70
  // No financial gaps → no cap.
  let predictedRigour = Math.max(
    20,
    Math.min(95, 95 - partialCount * 15 - missingCount * 30),
  );
  if (financialSections.length > 0 && financialCovered === 0) {
    predictedRigour = Math.min(predictedRigour, 55);
  } else if (financialGaps > 0) {
    predictedRigour = Math.min(predictedRigour, 70);
  }
  const predictedBand =
    predictedRigour >= 80
      ? { label: "High (80+)", color: "text-emerald-600" }
      : predictedRigour >= 60
      ? { label: "Medium (60–79)", color: "text-amber-600" }
      : { label: "Low (<60)", color: "text-destructive" };

  const gaps = result.sections.filter((s) => s.status !== "covered");

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

      {/* Predictive rigour band — links coverage to the post-run rigour score */}
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Predicted analytical rigour
          </span>
          <span className={`text-sm font-semibold ${predictedBand.color}`}>
            {predictedBand.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Coverage measures whether topics are present. Rigour (scored after the
          run) measures numerical precision and evidence depth.
          {financialSections.length > 0 && financialCovered === 0
            ? " No financial section is fully quantified — the post-run rigour score will be capped until you add explicit € figures."
            : financialGaps > 0
            ? " Some financial detail is partial — adding explicit € figures will lift the post-run rigour score."
            : gaps.length > 0
            ? ` Closing the ${gaps.length} gap${gaps.length > 1 ? "s" : ""} below typically lifts the rigour score by 15–30 points each.`
            : " Your input looks complete — expect a high rigour score."}
        </p>
        {gaps.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {gaps.slice(0, 4).map((g, i) => (
              <li key={i} className="text-xs text-foreground">
                <span className="font-medium">{g.heading}:</span>{" "}
                <span className="text-muted-foreground">add explicit numbers, sources, or calculated totals.</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DraftedFields({
  fields,
  values,
}: {
  fields: DraftableField[];
  values: Record<string, string>;
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
      } else {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 1500);
      }
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const allText = fields
    .map((f) => `## ${f.label}\n${values[f.id] ?? ""}`)
    .join("\n\n");

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          AI-drafted scenario fields
        </span>
        <Button size="sm" variant="ghost" onClick={() => copy(allText)}>
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy all
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Review the drafts below. Items marked <code className="text-[10px]">[TODO: …]</code>{" "}
        need your input before running the scenario.
      </p>
      <div className="space-y-3">
        {fields.map((f) => {
          const value = values[f.id] ?? "";
          return (
            <div key={f.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => copy(value, f.id)}
                >
                  {copiedId === f.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-foreground bg-muted/40 border border-border rounded-md p-3 font-sans">
                {value}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
