import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { ChevronRight, Sparkles } from "lucide-react";
import { scenarios, getMissingRequiredFields, getMissingOptionalFields } from "@/lib/scenarios";
import { useInputEvaluator } from "@/hooks/useInputEvaluator";
import { useScenarioEvalConfig } from "@/hooks/useScenarioEvalConfig";
import DataRequirementsAlert from "@/components/consolidation/DataRequirementsAlert";
import { AICoverageCheck } from "@/components/consolidation/AICoverageCheck";

interface ProjectEvaluatorProps {
  description: string;
  fileNames: string[];
}

/**
 * Lets the user pick a scenario and evaluates whether the project's
 * description + attached files would meet that scenario's input quality bar.
 *
 * The project description is fed as the value for every required textarea
 * field of the chosen scenario, plus a short list of attached file names —
 * which is what the input quality evaluator scores on.
 */
export function ProjectEvaluator({ description, fileNames }: ProjectEvaluatorProps) {
  const availableScenarios = useMemo(
    () => scenarios.filter((s) => s.status === "available"),
    [],
  );

  const [scenarioId, setScenarioId] = useState<string>("");
  const [coverage, setCoverage] = useState<CoverageResult | null>(null);
  const [coverageLoading, setCoverageLoading] = useState(false);

  const scenario = useMemo(
    () => availableScenarios.find((s) => s.id === scenarioId) ?? null,
    [availableScenarios, scenarioId],
  );

  // Build a synthetic formData keyed by the scenario's required fields.
  // The evaluator scores per-field text quality, so we feed the project
  // description (+ a brief mention of attached files) into each field.
  const formData = useMemo<Record<string, string>>(() => {
    if (!scenario) return {};
    const text = [
      description?.trim(),
      fileNames.length
        ? `Attached project files: ${fileNames.join(", ")}.`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    const data: Record<string, string> = {};
    for (const field of scenario.requiredFields) {
      data[field.id] = text;
    }
    return data;
  }, [scenario, description, fileNames]);

  const { data: dbEvalConfig } = useScenarioEvalConfig(scenarioId || null);
  const evaluation = useInputEvaluator(scenarioId || "noop", formData, 400, dbEvalConfig);

  const missingRequired = scenario
    ? getMissingRequiredFields(scenario.id, formData)
    : [];
  const missingOptional = scenario
    ? getMissingOptionalFields(scenario.id, formData)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Evaluate for scenario
        </CardTitle>
        <CardDescription>
          Check whether your project context is rich enough to run a specific
          scenario. Uses the same quality evaluator as the scenario wizard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="scenario-select">Scenario</Label>
          <Select value={scenarioId} onValueChange={setScenarioId}>
            <SelectTrigger id="scenario-select">
              <SelectValue placeholder="Choose a scenario to evaluate against…" />
            </SelectTrigger>
            <SelectContent>
              {availableScenarios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!scenario && (
          <p className="text-xs text-muted-foreground">
            Pick a scenario above to see how your project content scores.
          </p>
        )}

        {scenario && !description?.trim() && fileNames.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Add a description or attach files to this project to get a meaningful evaluation.
          </p>
        )}

        {scenario && scenario.dataRequirements && (
          <DataPrepCollapsible dataRequirements={scenario.dataRequirements} />
        )}

        {scenario && (description?.trim() || fileNames.length > 0) && (
          <DataRequirementsAlert
            missingRequired={missingRequired}
            missingOptional={missingOptional}
            evaluation={evaluation}
          />
        )}

        {scenario?.dataRequirements && (description?.trim() || fileNames.length > 0) && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">AI coverage check</p>
                <p className="text-xs text-muted-foreground">
                  Score project content against the recommended data sections.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={coverageLoading}
                onClick={async () => {
                  if (!scenario?.dataRequirements) return;
                  setCoverageLoading(true);
                  setCoverage(null);
                  try {
                    const { data, error } = await supabase.functions.invoke(
                      "evaluate-project-coverage",
                      {
                        body: {
                          scenarioTitle: scenario.title,
                          description,
                          fileNames,
                          sections: scenario.dataRequirements.sections,
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
                    setCoverageLoading(false);
                  }
                }}
              >
                {coverageLoading ? (
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
        )}
      </CardContent>
    </Card>
  );
}

interface CoverageResult {
  sections: { heading: string; status: "covered" | "partial" | "missing"; reason: string }[];
  overallScore: number;
  summary: string;
}

function CoverageResults({ result }: { result: CoverageResult }) {
  const scoreColor =
    result.overallScore >= 75
      ? "text-emerald-600"
      : result.overallScore >= 50
      ? "text-amber-600"
      : "text-destructive";

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Coverage score
        </span>
        <span className={`text-2xl font-display font-bold ${scoreColor}`}>
          {result.overallScore}/100
        </span>
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

function DataPrepCollapsible({
  dataRequirements,
}: {
  dataRequirements: { title: string; sections: { heading: string; description: string }[] };
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
        >
          <span>💡</span>
          <span>What data do I need to prepare?</span>
          <ChevronRight
            className={`ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-90" : ""
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 border border-border rounded-lg p-4 bg-muted/30 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {dataRequirements.title}
          </p>
          {dataRequirements.sections.map((s, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-foreground">{s.heading}</p>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
