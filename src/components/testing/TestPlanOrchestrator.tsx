import { useState, useCallback } from "react";
import { Shuffle, Play, Copy, Download, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { generateAITestData, INDUSTRY_CATEGORY_COMPATIBILITY } from "@/lib/ai-test-data-generator";
import { supabase } from "@/integrations/supabase/client";
import { isDeepAnalyticsScenario, detectPromptLeakage, LATENCY_BENCHMARKS } from "@/lib/ai/graph";
import type { BuyerPersona, EntropyLevel, TestPlanItem } from "@/lib/testing/types";

const PERSONAS: BuyerPersona[] = [
  "rushed-junior",
  "methodical-manager",
  "cfo-finance",
  "frustrated-stakeholder",
  "lost-user",
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Phase = "idle" | "generating-plan" | "running";

interface ExecutionResult {
  index: number;
  status: "success" | "error";
  error?: string;
  isMultiCycle?: boolean;
  promptLeakage?: boolean;
  processingTimeMs?: number;
  latencyStatus?: "ok" | "warning" | "fail";
}

interface TestPlanOrchestratorProps {
  scenarioId: string;
  model: string;
}

const STORAGE_KEY_PREFIX = "exos-orchestrator-results-";

function getStorageKey(scenarioId: string) {
  return `${STORAGE_KEY_PREFIX}${scenarioId}`;
}

function loadPersistedResults(scenarioId: string): ExecutionResult[] | null {
  try {
    const raw = localStorage.getItem(getStorageKey(scenarioId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function computeLatencyStatus(
  processingTimeMs: number | undefined,
  isMultiCycle: boolean
): "ok" | "warning" | "fail" {
  if (!processingTimeMs) return "ok";
  const bench = isMultiCycle ? LATENCY_BENCHMARKS.multiCycle : LATENCY_BENCHMARKS.standard;
  if (processingTimeMs >= bench.fail) return "fail";
  if (processingTimeMs >= bench.warning) return "warning";
  return "ok";
}

const LATENCY_DOT_COLORS: Record<string, string> = {
  ok: "bg-green-500",
  warning: "bg-yellow-500",
  fail: "bg-red-500",
};

const TestPlanOrchestrator = ({ scenarioId, model }: TestPlanOrchestratorProps) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [generatedPlan, setGeneratedPlan] = useState<TestPlanItem[] | null>(null);
  const [importedJson, setImportedJson] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [results, setResults] = useState<ExecutionResult[]>(() => loadPersistedResults(scenarioId) ?? []);
  const queryClient = useQueryClient();

  // ── Plan Generation ──
  const handleGeneratePlan = useCallback(() => {
    if (!scenarioId) {
      toast.error("Select a scenario first");
      return;
    }

    const industries = Object.keys(INDUSTRY_CATEGORY_COMPATIBILITY);
    const plan: TestPlanItem[] = [];

    for (let i = 0; i < 15; i++) {
      const industrySlug = randomChoice(industries);
      const categories = INDUSTRY_CATEGORY_COMPATIBILITY[industrySlug];
      const categorySlug = randomChoice(categories);
      const persona = randomChoice(PERSONAS);
      const entropyLevel = randomChoice([1, 2, 3]) as EntropyLevel;

      plan.push({ scenarioId, persona, industrySlug, categorySlug, entropyLevel });
    }

    setGeneratedPlan(plan);
    toast.success("Draft plan generated", { description: "15 random combinations ready for review." });
  }, [scenarioId]);

  const handleCopy = useCallback(() => {
    if (!generatedPlan) return;
    navigator.clipboard.writeText(JSON.stringify(generatedPlan, null, 2));
    toast.success("Copied to clipboard");
  }, [generatedPlan]);

  const handleDownload = useCallback(() => {
    if (!generatedPlan) return;
    const blob = new Blob([JSON.stringify(generatedPlan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `test-plan-${scenarioId}-draft.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [generatedPlan, scenarioId]);

  // ── Plan Execution ──
  const handleRunPlan = useCallback(async () => {
    let plan: TestPlanItem[];
    try {
      plan = JSON.parse(importedJson);
      if (!Array.isArray(plan) || plan.length === 0) throw new Error("Empty array");
    } catch {
      toast.error("Invalid JSON", { description: "Paste a valid JSON array of test plan items." });
      return;
    }

    setPhase("running");
    setTotalItems(plan.length);
    setCurrentIndex(0);
    setResults([]);
    localStorage.removeItem(getStorageKey(scenarioId));

    const runResults: ExecutionResult[] = [];

    for (let i = 0; i < plan.length; i++) {
      setCurrentIndex(i + 1);
      const item = plan[i];
      const multiCycle = isDeepAnalyticsScenario(item.scenarioId);

      try {
        // Phase 1: Generate synthetic data
        const genResult = await generateAITestData({
          scenarioType: item.scenarioId,
          persona: item.persona,
          industry: item.industrySlug,
          category: item.categorySlug,
          mctsIterations: item.entropyLevel === 3 ? 1 : 3,
        });

        if (!genResult.success) {
          runResults.push({ index: i, status: "error", error: `Generation failed: ${genResult.error}`, isMultiCycle: multiCycle });
          continue;
        }

        // Phase 2: Run through sentinel-analysis
        const { data, error: analysisError } = await supabase.functions.invoke("sentinel-analysis", {
          body: {
            scenarioType: item.scenarioId,
            scenarioData: genResult.data,
            userPrompt: JSON.stringify(genResult.data),
            industrySlug: item.industrySlug,
            categorySlug: item.categorySlug,
            serverSideGrounding: true,
            enableTestLogging: true,
            model,
          },
        });

        if (analysisError) {
          runResults.push({ index: i, status: "error", error: `Analysis failed: ${analysisError.message}`, isMultiCycle: multiCycle });
        } else {
          const processingTimeMs = data?.processing_time_ms;
          const latencyStatus = computeLatencyStatus(processingTimeMs, multiCycle);
          const hasLeakage = multiCycle && detectPromptLeakage(data?.content || "");

          if (hasLeakage) {
            runResults.push({
              index: i,
              status: "error",
              error: "CRITICAL: Auditor prompt leakage detected in final output.",
              isMultiCycle: multiCycle,
              promptLeakage: true,
              processingTimeMs,
              latencyStatus,
            });
          } else {
            runResults.push({
              index: i,
              status: "success",
              isMultiCycle: multiCycle,
              processingTimeMs,
              latencyStatus,
            });
          }
        }
      } catch (err) {
        runResults.push({ index: i, status: "error", error: err instanceof Error ? err.message : "Unknown error", isMultiCycle: multiCycle });
      }

      // Persist after each item so results survive page refresh
      try { localStorage.setItem(getStorageKey(scenarioId), JSON.stringify(runResults)); } catch {}

      // Rate-limit protection: 3s for multi-cycle (3 internal LLM calls), 1s for standard
      if (i < plan.length - 1) await sleep(multiCycle ? 3000 : 1000);
    }

    setResults(runResults);
    setPhase("idle");

    // Invalidate caches
    queryClient.invalidateQueries({ queryKey: ["test-prompts"] });
    queryClient.invalidateQueries({ queryKey: ["test-stats"] });

    const successCount = runResults.filter((r) => r.status === "success").length;
    const failCount = runResults.filter((r) => r.status === "error").length;

    if (failCount > 0) {
      toast.error("Plan execution complete", { description: `${successCount}/${plan.length} succeeded, ${failCount} failed` });
    } else {
      toast.success("Plan execution complete", { description: `${successCount}/${plan.length} succeeded, ${failCount} failed` });
    }
  }, [importedJson, model, queryClient, scenarioId]);

  const successCount = results.filter((r) => r.status === "success").length;
  const failedResults = results.filter((r) => r.status === "error");

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle className="w-5 h-5 text-primary" />
          Test Plan Orchestrator
        </CardTitle>
        <CardDescription>
          Generate a draft plan, review externally, then execute the approved batch automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Plan Generation ── */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">1. Generate Draft Plan</p>
          <Button
            variant="outline"
            onClick={handleGeneratePlan}
            disabled={!scenarioId || phase === "running"}
            className="w-full gap-2"
          >
            <Shuffle className="w-4 h-4" />
            Generate Draft Plan (N=15)
          </Button>

          {generatedPlan && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              </div>
              <pre className="text-xs bg-muted/50 border rounded-lg p-3 max-h-48 overflow-auto font-mono">
                {JSON.stringify(generatedPlan, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* ── Plan Execution ── */}
        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium text-foreground">2. Execute Approved Plan</p>
          <Textarea
            placeholder='Paste approved JSON array here (e.g., filtered to ~10 items)...'
            value={importedJson}
            onChange={(e) => setImportedJson(e.target.value)}
            rows={4}
            className="font-mono text-xs"
            disabled={phase === "running"}
          />
          <Button
            variant="hero"
            onClick={handleRunPlan}
            disabled={phase === "running" || !importedJson.trim()}
            className="w-full gap-2"
          >
            {phase === "running" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing test {currentIndex} of {totalItems}…
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Automated Plan
              </>
            )}
          </Button>

          {phase === "running" && totalItems > 0 && (
            <Progress value={(currentIndex / totalItems) * 100} className="h-2" />
          )}
        </div>

        {/* ── Results Summary ── */}
        {results.length > 0 && phase === "idle" && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                {successCount} passed
              </Badge>
              {failedResults.length > 0 && (
                <Badge variant="destructive" className="gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  {failedResults.length} failed
                </Badge>
              )}
            </div>

            <div className="space-y-1.5">
              {results.map((r) => (
                <div
                  key={r.index}
                  className={`text-xs rounded px-2 py-1.5 flex items-center gap-2 flex-wrap ${
                    r.status === "error" ? "text-destructive bg-destructive/10" : "text-foreground bg-muted/50"
                  }`}
                >
                  <strong>Item {r.index + 1}:</strong>

                  {/* Cycle type badge */}
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      r.isMultiCycle ? "border-purple-400 text-purple-600" : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {r.isMultiCycle ? "Multi-Cycle (3)" : "Single-Pass (1)"}
                  </Badge>

                  {/* Latency dot */}
                  {r.latencyStatus && (
                    <span className="flex items-center gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${LATENCY_DOT_COLORS[r.latencyStatus]}`} />
                      {r.processingTimeMs != null && (
                        <span className="text-muted-foreground">{(r.processingTimeMs / 1000).toFixed(1)}s</span>
                      )}
                    </span>
                  )}

                  {/* Leakage badge */}
                  {r.promptLeakage && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      LEAKAGE
                    </Badge>
                  )}

                  {/* Status / error */}
                  {r.status === "success" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 ml-auto" />
                  ) : (
                    <span className="text-destructive ml-auto truncate max-w-[50%]">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestPlanOrchestrator;
