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
import { scenarios } from "@/lib/scenarios";
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

  const scenario = useMemo(
    () => availableScenarios.find((s) => s.id === scenarioId) ?? null,
    [availableScenarios, scenarioId],
  );

  // Build a synthetic formData keyed by the scenario's required fields.
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Evaluate for scenario
        </CardTitle>
        <CardDescription>
          Check whether your project context is rich enough to run a specific
          scenario. Uses an AI-based coverage check against the scenario's
          recommended data sections.
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

        {scenario?.dataRequirements && (description?.trim() || fileNames.length > 0) && (
          <div className="pt-2 border-t border-border">
            <AICoverageCheck
              scenarioTitle={scenario.title}
              description={description}
              fileNames={fileNames}
              sections={scenario.dataRequirements.sections}
              draftableFields={scenario.requiredFields.map((f) => ({
                id: f.id,
                label: f.label,
                description: f.description,
                placeholder: f.placeholder,
              }))}
              subtitle="Score project content and draft scenario fields from your context."
            />
          </div>
        )}
      </CardContent>
    </Card>
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
