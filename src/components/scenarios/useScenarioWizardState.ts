import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-messages";
import {
  Scenario,
  getMissingRequiredFields,
  getMissingOptionalFields,
} from "@/lib/scenarios";
import { DashboardType } from "@/lib/dashboard-mappings";
import { useSentinel } from "@/hooks/useSentinel";
import { useIndustryContext, useProcurementCategory } from "@/hooks/useContextData";
import { useShareableMode } from "@/hooks/useShareableMode";
import { useModelConfig } from "@/contexts/ModelConfigContext";
import { useMarketInsightsAvailability } from "@/hooks/useMarketInsights";
import { generateTestData } from "@/lib/test-data-factory";
import { runExosGraph, type ModelConfigType } from "@/lib/ai/graph";
import {
  DraftedParameters,
  draftParameters,
  generateWithParameters,
} from "@/lib/drafted-parameters";
import { useScenarioFileAttachments } from "@/hooks/useScenarioFileAttachments";
import { useInputEvaluator } from "@/hooks/useInputEvaluator";
import { DEFAULT_MODEL, type AIModel } from "./ModelSelector";
import { StrategyType } from "./StrategySelector";
import {
  IndustryContextOverrides,
  getDefaultOverrides,
} from "@/components/context/IndustryContextEditor";
import {
  CategoryContextOverrides,
  getDefaultCategoryOverrides,
} from "@/components/context/CategoryContextEditor";

export type Step = "input" | "review" | "analyzing" | "results";

export function useScenarioWizardState(scenario: Scenario) {
  const navigate = useNavigate();
  const { showTechnicalDetails } = useShareableMode();

  // Core wizard state
  const [step, setStep] = useState<Step>("input");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [strategyValue, setStrategyValue] = useState<StrategyType>("balanced");
  const [industrySlug, setIndustrySlug] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [industryOverrides, setIndustryOverrides] = useState<IndustryContextOverrides>(getDefaultOverrides());
  const [categoryOverrides, setCategoryOverrides] = useState<CategoryContextOverrides>(getDefaultCategoryOverrides());
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [selectedDashboards, setSelectedDashboards] = useState<DashboardType[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | null>(null);

  // Drafter-Validator state
  const [draftedParams, setDraftedParams] = useState<DraftedParameters | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isGeneratingFromDraft, setIsGeneratingFromDraft] = useState(false);
  const [testDataMetadata, setTestDataMetadata] = useState<{
    source: "ai" | "static";
    score?: number;
    reasoning?: string;
  } | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  // Market insights state
  const [isMarketInsightsActive, setIsMarketInsightsActive] = useState(false);

  // Chat assistant state
  const [showChatAssistant, setShowChatAssistant] = useState(false);

  // File attachment state
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const scenarioRunId = useRef(crypto.randomUUID()).current;
  const { attachFiles } = useScenarioFileAttachments();

  // Auth prompt state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Deep Analysis state (LangGraph pipeline)
  const [isDeepAnalysisRunning, setIsDeepAnalysisRunning] = useState(false);
  const [deepAnalysisStep, setDeepAnalysisStep] = useState(0);
  const [deepAnalysisResult, setDeepAnalysisResult] = useState<{
    finalAnswer: string;
    confidenceScore: number;
    validationStatus: "pending" | "approved" | "rejected";
    retryCount: number;
  } | null>(null);
  const [deepAnalysisError, setDeepAnalysisError] = useState<string | null>(null);

  // Fetch context data for AI grounding
  const { data: industryContext } = useIndustryContext(industrySlug);
  const { data: categoryContext } = useProcurementCategory(categorySlug);

  // Check for available market insights
  const { isAvailable: hasMarketInsights, insight: marketInsight } = useMarketInsightsAvailability(industrySlug, categorySlug);

  // Sentinel AI pipeline
  const { analyze, isProcessing, currentStage, error: sentinelError, tokenUsage, processingTimeMs } = useSentinel({
    onProgress: () => {},
    onError: (error) => {
      toast.error("Analysis failed", { description: getUserFriendlyError(error) });
    },
  });

  // Input quality evaluator (debounced 800ms)
  const evaluation = useInputEvaluator(scenario.id, formData);

  // Get model config from settings context
  const { model: configModel } = useModelConfig();

  const missingRequired = getMissingRequiredFields(scenario.id, formData);
  const missingOptional = getMissingOptionalFields(scenario.id, formData);
  const canProceed = missingRequired.length === 0;

  // === HANDLERS ===

  const ensureAuthenticated = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowAuthPrompt(true);
      return false;
    }
    return true;
  };

  const handleDraftTestCase = async () => {
    if (!(await ensureAuthenticated())) {
      toast.error("Sign in required", { description: "Please sign in to use AI test data generation." });
      return;
    }
    setIsDrafting(true);
    setDraftedParams(null);
    setTestDataMetadata(null);
    try {
      const result = await draftParameters(scenario.id, 0.8);
      if (result.success && result.parameters) {
        setDraftedParams(result.parameters);
        toast.success("Draft ready", { description: `${result.parameters.industry} • ${result.parameters.companySize}` });
      } else {
        toast.error("Draft failed", { description: result.error });
      }
    } catch (err) {
      console.error("[Draft] Error:", err);
      toast.error("Failed to draft parameters");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleApproveAndGenerate = async (params: DraftedParameters) => {
    if (!(await ensureAuthenticated())) {
      toast.error("Sign in required", { description: "Please sign in to use AI test data generation." });
      return;
    }
    setIsGeneratingFromDraft(true);
    try {
      const result = await generateWithParameters(scenario.id, params, 0.7);
      if (result.success && result.data) {
        setFormData(result.data);
        setTestDataMetadata({ source: "ai", score: result.metadata?.score, reasoning: result.metadata?.reasoning });
        setDraftedParams(null);
        toast.success("Test Data Generated", { description: `Score: ${result.metadata?.score}/100` });
      } else {
        toast.error("Generation failed", { description: result.error });
      }
    } catch (err) {
      console.error("[Generate] Error:", err);
      toast.error("Failed to generate test data");
    } finally {
      setIsGeneratingFromDraft(false);
    }
  };

  const handleStaticGenerate = () => {
    const testData = generateTestData(scenario.id);
    setFormData(testData);
    setDraftedParams(null);
    setTestDataMetadata({ source: "static" });
    toast.success("Static test data generated");
  };

  const handleIndustryChange = (slug: string | null) => {
    setIndustrySlug(slug);
    setIndustryOverrides(getDefaultOverrides());
  };

  const handleCategoryChange = (slug: string | null) => {
    setCategorySlug(slug);
    setCategoryOverrides(getDefaultCategoryOverrides());
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFieldClick = (fieldId: string) => {
    const element = fieldRefs.current[fieldId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
    }
  };

  const handleAnalyze = async () => {
    if (!(await ensureAuthenticated())) return;

    setStep("analyzing");

    // Market Snapshot: bypass Sentinel, call dedicated edge function
    if (scenario.id === "market-snapshot") {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("market-snapshot", {
          body: {
            region: formData.region,
            analysisScope: formData.analysisScope,
            successCriteria: formData.successCriteria || undefined,
            timeframe: formData.timeframe,
            industryContext: formData.industryContext || undefined,
          },
        });
        if (fnError) throw new Error(fnError.message || "Market Snapshot failed");
        if (data?.error) throw new Error(data.error);
        setAnalysisResult(data.result);
        setAnalysisTimestamp(new Date().toISOString());
        setStep("results");
        toast.success(`Analysis complete! Completeness: ${data.completenessScore ?? "N/A"}/100`);
      } catch (err) {
        console.error("[MarketSnapshot] Error:", err);
        setStep("review");
        toast.error(err instanceof Error ? err.message : "Market Snapshot failed. Please try again.");
      }
      return;
    }

    // Standard Sentinel pipeline
    const effectiveModel = configModel;
    const enrichedData = {
      ...formData,
      strategy: strategyValue,
      ...(evaluation ? {
        _evaluation_score: String(evaluation.score),
        _confidence_flag: evaluation.confidenceFlag,
      } : {}),
      ...(isMarketInsightsActive && marketInsight ? {
        _marketInsights: JSON.stringify({
          content: marketInsight.content,
          keyTrends: marketInsight.key_trends,
          riskSignals: marketInsight.risk_signals,
          opportunities: marketInsight.opportunities,
          updatedAt: marketInsight.created_at,
        }),
      } : {}),
    };

    const result = await analyze(
      scenario.id,
      enrichedData,
      industryContext || null,
      categoryContext || null,
      undefined,
      effectiveModel,
    );

    if (result?.success) {
      setAnalysisResult(result.result);
      setAnalysisTimestamp(new Date().toISOString());
      setStep("results");
      toast.success("Analysis complete!");
      if (attachedFileIds.length > 0) {
        attachFiles.mutate({ runId: scenarioRunId, scenarioType: scenario.id, fileIds: attachedFileIds });
      }
    } else {
      setStep("review");
      toast.error(sentinelError?.message || "Analysis failed. Please try again.");
    }
  };

  const handleDeepAnalysis = async () => {
    if (!(await ensureAuthenticated())) return;

    setStep("analyzing");
    setIsDeepAnalysisRunning(true);
    setDeepAnalysisStep(0);
    setDeepAnalysisResult(null);
    setDeepAnalysisError(null);

    let currentStepLocal = 0;
    const progressInterval = setInterval(() => {
      if (currentStepLocal < 3) {
        currentStepLocal++;
        setDeepAnalysisStep(currentStepLocal);
      }
    }, 3500);

    try {
      const queryParts = Object.entries(formData)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`);
      if (evaluation) {
        queryParts.push(`_evaluation_score: ${evaluation.score}`);
        queryParts.push(`_confidence_flag: ${evaluation.confidenceFlag}`);
      }
      const queryText = queryParts.join("\n");
      const graphConfig: ModelConfigType = { model: configModel };
      const result = await runExosGraph(queryText, graphConfig, scenario.id);

      clearInterval(progressInterval);
      setDeepAnalysisStep(4);
      setDeepAnalysisResult(result);
      setAnalysisTimestamp(new Date().toISOString());
      setStep("results");
      toast.success("Deep Analysis complete!");
    } catch (err) {
      clearInterval(progressInterval);
      const errorMessage = err instanceof Error ? err.message : "Analysis failed";
      setDeepAnalysisError(errorMessage);
      setStep("review");
      toast.error(`Deep Analysis failed: ${errorMessage}`);
    } finally {
      setIsDeepAnalysisRunning(false);
    }
  };

  const handleFeedbackSubmit = async (rating: number, feedback: string) => {
    try {
      const { error } = await supabase.from("scenario_feedback").insert({
        scenario_id: scenario.id,
        rating,
        feedback_text: feedback || null,
      });
      if (error) throw error;
      toast.success("Thank you for your feedback!");
    } catch (err: any) {
      console.error("Feedback save failed:", err);
      toast.error("Could not save feedback. Please try again.");
    }
  };

  const handleGenerateReport = () => {
    navigate("/report", {
      state: {
        scenarioTitle: scenario.title,
        scenarioId: scenario.id,
        analysisResult,
        formData,
        timestamp: analysisTimestamp,
        selectedDashboards,
      },
    });
  };

  return {
    // State
    step, setStep,
    formData, setFormData,
    strategyValue, setStrategyValue,
    industrySlug, categorySlug,
    industryOverrides, setIndustryOverrides,
    categoryOverrides, setCategoryOverrides,
    selectedModel, setSelectedModel,
    selectedDashboards, setSelectedDashboards,
    analysisResult,
    draftedParams,
    isDrafting, isGeneratingFromDraft,
    testDataMetadata,
    fieldRefs,
    isMarketInsightsActive, setIsMarketInsightsActive,
    showChatAssistant, setShowChatAssistant,
    attachedFileIds, setAttachedFileIds,
    showAuthPrompt, setShowAuthPrompt,
    isDeepAnalysisRunning, deepAnalysisStep, deepAnalysisResult, deepAnalysisError,
    showTechnicalDetails,

    // Derived
    industryContext, categoryContext,
    hasMarketInsights, marketInsight,
    isProcessing, currentStage,
    evaluation,
    missingRequired, missingOptional, canProceed,
    tokenUsage, processingTimeMs,

    // Handlers
    handleIndustryChange, handleCategoryChange,
    handleFieldChange, handleFieldClick,
    handleDraftTestCase, handleApproveAndGenerate, handleStaticGenerate,
    handleAnalyze, handleDeepAnalysis,
    handleFeedbackSubmit, handleGenerateReport,
  };
}
