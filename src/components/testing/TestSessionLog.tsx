import { useMemo } from "react";
import { Calendar, Download, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTestPromptsByScenario } from "@/hooks/useTestDatabase";
import type { TestPromptWithReport } from "@/hooks/useTestDatabase";

interface TestSessionLogProps {
  scenarioType: string;
  scenarioTitle?: string;
  isThresholdReached?: boolean;
}

interface DateGroup {
  date: string;
  prompts: TestPromptWithReport[];
  totalRuns: number;
  successCount: number;
  failCount: number;
}

function groupByDate(prompts: TestPromptWithReport[]): DateGroup[] {
  const map = new Map<string, TestPromptWithReport[]>();

  for (const p of prompts) {
    const date = p.created_at.slice(0, 10); // YYYY-MM-DD
    const existing = map.get(date) || [];
    existing.push(p);
    map.set(date, existing);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, prompts]) => {
      const allReports = prompts.flatMap((p) => p.test_reports);
      return {
        date,
        prompts,
        totalRuns: allReports.length,
        successCount: allReports.filter((r) => r.success).length,
        failCount: allReports.filter((r) => !r.success).length,
      };
    });
}

function buildFeedbackJSON(scenarioType: string, date: string, prompts: TestPromptWithReport[]) {
  return {
    scenario_type: scenarioType,
    date,
    strategic_goal: "Gradually increase raw field flexibility. Move fields from Required → Optional → Raw textarea based on AI extraction accuracy.",
    total_prompts: prompts.length,
    total_reports: prompts.reduce((s, p) => s + p.test_reports.length, 0),
    prompts: prompts.map((p) => ({
      id: p.id,
      industry_slug: p.industry_slug,
      category_slug: p.category_slug,
      scenario_data: p.scenario_data,
      system_prompt: p.system_prompt,
      user_prompt: p.user_prompt,
      grounding_context: p.grounding_context,
      reports: p.test_reports.map((r) => ({
        id: r.id,
        model: r.model,
        success: r.success,
        processing_time_ms: r.processing_time_ms,
        error_message: r.error_message,
        validation_result: r.validation_result,
        shadow_log: r.shadow_log,
        token_usage: r.token_usage,
        prompt_tokens: r.prompt_tokens,
        completion_tokens: r.completion_tokens,
        total_tokens: r.total_tokens,
      })),
    })),
  };
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const TestSessionLog = ({ scenarioType, scenarioTitle, isThresholdReached }: TestSessionLogProps) => {
  const { data: prompts, isLoading } = useTestPromptsByScenario(scenarioType, 200);

  const dateGroups = useMemo(() => groupByDate(prompts || []), [prompts]);

  if (!scenarioType) return null;

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Session Log
          {scenarioTitle && (
            <Badge variant="outline" className="ml-1 text-xs font-normal">
              {scenarioTitle}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Test runs for <strong>{scenarioTitle || scenarioType}</strong>, grouped by date. Export feedback JSON for external AI consultation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : dateGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No test runs yet for this scenario.</p>
            <p className="text-xs mt-1">Launch a test batch to start collecting data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dateGroups.map((group) => (
              <div
                key={group.date}
                className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-sm font-medium">{group.date}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {group.prompts.length} prompt{group.prompts.length !== 1 ? "s" : ""}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      {group.successCount}
                    </span>
                    {group.failCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-red-600">
                        <XCircle className="w-3 h-3" />
                        {group.failCount}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant={isThresholdReached ? "default" : "outline"}
                  size="sm"
                  className={`gap-1.5 shrink-0 ${isThresholdReached ? "animate-pulse" : ""}`}
                  onClick={() => {
                    const data = buildFeedbackJSON(scenarioType, group.date, group.prompts);
                    downloadJSON(data, `${scenarioType}_${group.date}.json`);
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Feedback
                  {isThresholdReached && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">Ready</Badge>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestSessionLog;
