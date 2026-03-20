import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toPng, toSvg } from "html-to-image";
import { Download, Image, FileCode, ArrowLeft, Sparkles, Zap, Target, LayoutGrid, Inbox } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import { NavLink } from "@/components/NavLink";
import TestingPipelineDiagram from "@/components/architecture/TestingPipelineDiagram";
import LaunchTestBatch from "@/components/testing/LaunchTestBatch";
import RefactoringBacklog from "@/components/testing/RefactoringBacklog";
import TestSessionLog from "@/components/testing/TestSessionLog";
import TestPlanOrchestrator from "@/components/testing/TestPlanOrchestrator";
import DashboardSmokeTest from "@/components/testing/DashboardSmokeTest";
import { useTestStats } from "@/hooks/useTestDatabase";
import { useAccuracyTrend, useEvolutionaryDirectives } from "@/hooks/usePipelineIQ";
import { useModelConfig } from "@/contexts/ModelConfigContext";
import { scenarios } from "@/lib/scenarios";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

const CHART_CONFIG = {
  accuracy: {
    label: "Inference Accuracy",
    color: "hsl(var(--primary))",
  },
};

const ACTION_COLORS: Record<string, string> = {
  CRITICAL_REQUIRE: "text-destructive bg-destructive/10 border-destructive/30",
  REDUNDANT_HIDE: "text-green-600 bg-green-50 border-green-200",
  SCHEMA_GAP_DETECTED: "text-blue-600 bg-blue-50 border-blue-200",
  OPTIONAL_KEEP: "text-amber-600 bg-amber-50 border-amber-200",
};

const AUDIT_THRESHOLD = 10;

const TestingPipeline = () => {
  const { model } = useModelConfig();
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [scenarioId, setScenarioId] = useState(() => searchParams.get("scenario") || "");

  useEffect(() => {
    if (scenarioId) {
      setSearchParams({ scenario: scenarioId }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [scenarioId, setSearchParams]);

  const selectedScenario = scenarios.find((s) => s.id === scenarioId);
  const { data: stats } = useTestStats(scenarioId || undefined);
  const { data: accuracyData, isLoading: isAccuracyLoading } = useAccuracyTrend();
  const { data: directives, isLoading: isDirectivesLoading } = useEvolutionaryDirectives();
  const isThresholdReached = (stats?.totalReports ?? 0) >= AUDIT_THRESHOLD;

  const currentAccuracy = accuracyData?.length ? accuracyData[accuracyData.length - 1].accuracy : null;
  const deltaFromFirst = accuracyData && accuracyData.length >= 2
    ? Math.round((accuracyData[accuracyData.length - 1].accuracy - accuracyData[0].accuracy) * 100)
    : null;
  const chartData = (accuracyData ?? []).map((row, i) => ({ batch: i + 1, accuracy: row.accuracy }));

  const downloadAsPNG = async () => {
    if (!diagramRef.current) return;
    setIsDownloading(true);
    try {
      const element = diagramRef.current;
      const originalStyle = element.style.cssText;
      element.style.overflow = "visible";
      element.style.width = "auto";
      element.style.height = "auto";

      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: "#fefdf8",
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: { overflow: "visible" },
      });

      element.style.cssText = originalStyle;
      const link = document.createElement("a");
      link.download = "EXOS-Testing-Pipeline.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("PNG download error:", error);
      toast.error("Download failed", { description: "Could not generate PNG image." });
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsSVG = async () => {
    if (!diagramRef.current) return;
    setIsDownloading(true);
    try {
      const element = diagramRef.current;
      const originalStyle = element.style.cssText;
      element.style.overflow = "visible";
      element.style.width = "auto";
      element.style.height = "auto";

      const dataUrl = await toSvg(element, {
        backgroundColor: "#fefdf8",
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: { overflow: "visible" },
      });

      element.style.cssText = originalStyle;
      const link = document.createElement("a");
      link.download = "EXOS-Testing-Pipeline.svg";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("SVG download error:", error);
      toast.error("Download failed", { description: "Could not generate SVG image." });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="gradient-hero min-h-screen">
      <Header />
      <main className="container py-8 md:py-12">
        <div className="mb-8">
          <NavLink
            to="/features"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Technology
          </NavLink>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            EXOS Automated Testing Pipeline
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Entropy-based test synthesis, production execution, and LLM-as-a-Judge evaluation.
          </p>
        </div>

        <Tabs defaultValue="diagram" className="space-y-6">
          <TabsList>
            <TabsTrigger value="diagram">Pipeline Diagram</TabsTrigger>
            <TabsTrigger value="command-center">Command Center</TabsTrigger>
            <TabsTrigger value="dashboard-tests" className="gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              Dashboard Tests
            </TabsTrigger>
            <TabsTrigger value="pipeline-iq" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Pipeline IQ
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Diagram */}
          <TabsContent value="diagram" className="space-y-8">
            <div className="flex flex-wrap gap-4">
              <Button
                variant="hero"
                onClick={downloadAsPNG}
                disabled={isDownloading}
                className="gap-2"
              >
                <Image className="w-4 h-4" />
                Download PNG
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={downloadAsSVG}
                disabled={isDownloading}
                className="gap-2"
              >
                <FileCode className="w-4 h-4" />
                Download SVG
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <div className="card-elevated rounded-2xl p-4 md:p-8 overflow-x-auto">
              <div ref={diagramRef}>
                <TestingPipelineDiagram />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-effect rounded-xl p-4">
                <div className="text-primary font-semibold mb-2">
                  🎲 Synthesis Engine
                </div>
                <p className="text-sm text-muted-foreground">
                  Generates realistic, messy procurement prompts from 4 strategic buyer personas with varying data quality — from "dump &amp; go" to over-detailed inputs.
                </p>
              </div>
              <div className="glass-effect rounded-xl p-4">
                <div className="text-primary font-semibold mb-2">
                  ⚙️ Execution Pipeline
                </div>
                <p className="text-sm text-muted-foreground">
                  Runs generated prompts through the production sentinel-analysis function with automatic retry logic and LangSmith trace capture.
                </p>
              </div>
              <div className="glass-effect rounded-xl p-4">
                <div className="text-primary font-semibold mb-2">
                  ⚖️ LLM Auditor
                </div>
                <p className="text-sm text-muted-foreground">
                  An AI judge evaluates extraction quality, classifying each field as redundant, optional, or critical for the UI wizard.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Command Center */}
          <TabsContent value="command-center" className="space-y-8">
            {scenarioId && selectedScenario && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Focusing on:</span>
                <Badge variant="default" className="text-sm">{selectedScenario.title}</Badge>
              </div>
            )}
            {scenarioId && isThresholdReached && (
              <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300 dark:border-green-700">
                <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-300">🎯 Ready for AI Audit</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  10+ tests completed for this scenario. Export the JSON and share it with Gemini for meta-analysis.
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <LaunchTestBatch scenarioId={scenarioId} onScenarioChange={setScenarioId} />
                {scenarioId && <TestSessionLog scenarioType={scenarioId} scenarioTitle={selectedScenario?.title} isThresholdReached={isThresholdReached} />}
                {scenarioId && <TestPlanOrchestrator scenarioId={scenarioId} model={model} />}
              </div>
              <div className="lg:col-span-2">
                <RefactoringBacklog scenarioType={scenarioId || undefined} />
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Dashboard Tests */}
          <TabsContent value="dashboard-tests" className="space-y-8">
            <DashboardSmokeTest />
          </TabsContent>

          <TabsContent value="pipeline-iq" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Inference Accuracy Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Inference Accuracy Over Time
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    SWE-bench-like metric tracking how well the AI extracts structured data from chaotic inputs.
                  </p>
                </CardHeader>
                <CardContent>
                  {isAccuracyLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-[280px] w-full" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Inbox className="w-10 h-10 opacity-40" />
                      <p className="text-sm">No batch data yet. Run some tests first.</p>
                    </div>
                  ) : (
                    <>
                      <ChartContainer config={CHART_CONFIG} className="h-[280px] w-full">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="batch"
                            label={{ value: "Test Batch", position: "insideBottom", offset: -5 }}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            domain={[0, 1]}
                            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                            className="text-muted-foreground"
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                              />
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "hsl(var(--primary))" }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ChartContainer>
                      <div className="mt-4 flex items-center gap-4 text-sm">
                        {currentAccuracy !== null && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <span className="text-muted-foreground">Current: <strong className="text-foreground">{(currentAccuracy * 100).toFixed(1)}%</strong></span>
                          </div>
                        )}
                        {deltaFromFirst !== null && (
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-muted-foreground">Δ from batch 1: <strong className={deltaFromFirst >= 0 ? "text-green-600" : "text-destructive"}>{deltaFromFirst >= 0 ? "+" : ""}{deltaFromFirst}pp</strong></span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Evolution Log */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Evolution Log
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    AI-generated directives from detected weaknesses — auto-fed back into the Entropy Controller.
                  </p>
                </CardHeader>
                <CardContent>
                  {isDirectivesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
                    </div>
                  ) : !directives?.length ? (
                    <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Inbox className="w-10 h-10 opacity-40" />
                      <p className="text-sm">No directives yet. Need shadow_log data from test runs.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {directives.map((d, idx) => (
                        <div
                          key={idx}
                          className="border rounded-lg p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {d.target_scenario}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                ACTION_COLORS[d.source_field_action] || ""
                              }`}
                            >
                              {d.source_field_action}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {d.directive_text}
                          </p>
                          <div className="text-[10px] text-muted-foreground">
                            Occurrences: <strong className="text-foreground">{d.occurrence_count}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* GEA Explainer */}
            <div className="glass-effect rounded-xl p-5">
              <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                <Sparkles className="w-4 h-4" />
                Group-Evolving Agents (GEA) Framework
              </div>
              <p className="text-sm text-muted-foreground">
                The pipeline implements GEA principles: after each batch, the AI Judge generates Evolutionary Directives 
                from failure patterns (CRITICAL_REQUIRE, SCHEMA_GAP). These directives are fed back into the Entropy Controller 
                to steer the next generation of test prompts — creating a self-improving loop where the system learns 
                from its own weaknesses. The Shared Experience Pool aggregates patterns across all runs.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TestingPipeline;
