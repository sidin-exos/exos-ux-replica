import { useState, useRef } from "react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, AlertTriangle, FlaskConical, Loader2, Wand2, BrainCircuit, ChevronRight, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import AuthPrompt from "@/components/auth/AuthPrompt";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { AnalysisPipelineAnimation } from "@/components/sentinel/AnalysisPipelineAnimation";
import { DeepAnalysisPipeline } from "@/components/analysis/DeepAnalysisPipeline";
import { DeepAnalysisResult } from "@/components/analysis/DeepAnalysisResult";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataRequirementsAlert from "@/components/consolidation/DataRequirementsAlert";
import StrategySelector, { StrategyType, strategyPresets } from "./StrategySelector";
import DashboardSelector from "./DashboardSelector";
import { IndustrySelector } from "@/components/context/IndustrySelector";
import { CategorySelector } from "@/components/context/CategorySelector";
import { ContextPreview } from "@/components/context/ContextPreview";
import { 
  IndustryContextEditor, 
  IndustryContextOverrides,
  getDefaultOverrides 
} from "@/components/context/IndustryContextEditor";
import { 
  CategoryContextEditor, 
  CategoryContextOverrides,
  getDefaultCategoryOverrides 
} from "@/components/context/CategoryContextEditor";
import OutputFeedback from "@/components/feedback/OutputFeedback";
import { MasterXMLPreview } from "@/components/sentinel/MasterXMLPreview";
import { FinalXMLPreview } from "@/components/sentinel/FinalXMLPreview";
import { BusinessContextField } from "./BusinessContextField";
import { ModelSelector, DEFAULT_MODEL, type AIModel } from "./ModelSelector";
import { DraftedParametersCard } from "./DraftedParametersCard";
import { MarketInsightsBanner } from "@/components/insights/MarketInsightsBanner";
import ScenarioTutorial from "./ScenarioTutorial";
import {
  Scenario,
  ScenarioRequiredField,
  getMissingRequiredFields,
  getMissingOptionalFields,
} from "@/lib/scenarios";
import { DashboardType, getDashboardsForScenario } from "@/lib/dashboard-mappings";
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
import { toast } from "sonner";
import { ScenarioChatAssistant } from "./ScenarioChatAssistant";
import ScenarioFileAttachment from "./ScenarioFileAttachment";
import { useScenarioFileAttachments } from "@/hooks/useScenarioFileAttachments";
import { useInputEvaluator } from "@/hooks/useInputEvaluator";
import { useScenarioEvalConfig } from "@/hooks/useScenarioEvalConfig";
import { useUser } from "@/hooks/useUser";

const DataRequirementsCollapsible = ({ dataRequirements }: { dataRequirements: { title: string; sections: { heading: string; description: string }[] } }) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground">
          <span>💡</span>
          <span>What data do I need to prepare?</span>
          <ChevronRight className={`ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 border border-border rounded-lg p-4 bg-muted/30 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{dataRequirements.title}</p>
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
};

const DataRequirementsPanel = ({ dataRequirements }: { dataRequirements: { title: string; sections: { heading: string; description: string }[] } }) => {
  return (
    <Card className="border-warning/30 bg-warning/10 dark:bg-warning/15">
      <CardContent className="pt-4 pb-4 px-5">
        <div className="flex items-center gap-2 mb-3">
          <span>💡</span>
          <span className="text-sm font-semibold text-warning">
            What data do I need to prepare?
          </span>
        </div>
        <div className="space-y-3">
          {dataRequirements.sections.map((s, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-foreground">{s.heading}</p>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface GenericScenarioWizardProps {
  scenario: Scenario;
}

type Step = "input" | "review" | "analyzing" | "results";

const GenericScenarioWizard = ({ scenario }: GenericScenarioWizardProps) => {
  const navigate = useNavigate();
  const { showTechnicalDetails } = useShareableMode();
  const { user } = useUser();
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
    validationStatus: 'pending' | 'approved' | 'rejected';
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
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // === DRAFTER-VALIDATOR WORKFLOW ===

  const ensureAuthenticatedForTestData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowAuthPrompt(true);
      toast.error("Sign in required", {
        description: "Please sign in to use AI test data generation.",
      });
      return false;
    }
    return true;
  };
  
  // Step 1: Draft parameters (1 AI call)
  const handleDraftTestCase = async () => {
    const isAuthenticated = await ensureAuthenticatedForTestData();
    if (!isAuthenticated) return;

    setIsDrafting(true);
    setDraftedParams(null);
    setTestDataMetadata(null);
    
    try {
      const result = await draftParameters(scenario.id, 0.8);
      
      if (result.success && result.parameters) {
        setDraftedParams(result.parameters);
        toast.success("Draft ready", {
          description: `${result.parameters.industry} • ${result.parameters.companySize}`,
        });
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

  // Step 2: Generate with approved parameters (1 AI call)
  const handleApproveAndGenerate = async (params: DraftedParameters) => {
    const isAuthenticated = await ensureAuthenticatedForTestData();
    if (!isAuthenticated) return;

    setIsGeneratingFromDraft(true);
    
    try {
      const result = await generateWithParameters(scenario.id, params, 0.7);
      
      if (result.success && result.data) {
        setFormData(result.data);
        setTestDataMetadata({
          source: "ai",
          score: result.metadata?.score,
          reasoning: result.metadata?.reasoning,
        });
        setDraftedParams(null); // Clear draft after success
        toast.success("Test Data Generated", {
          description: `Score: ${result.metadata?.score}/100`,
        });
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

  // Static fallback
  const handleStaticGenerate = () => {
    const testData = generateTestData(scenario.id);
    setFormData(testData);
    setDraftedParams(null);
    setTestDataMetadata({ source: "static" });
    toast.success("Static test data generated");
  };

  // Reset overrides when context selection changes
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

  const missingRequired = getMissingRequiredFields(scenario.id, formData);
  const missingOptional = getMissingOptionalFields(scenario.id, formData);

  const canProceed = missingRequired.length === 0;

  // Fetch methodology config from DB for input evaluation
  const { data: dbEvalConfig } = useScenarioEvalConfig(scenario.id);

  // Input quality evaluator (debounced 800ms)
  const evaluation = useInputEvaluator(scenario.id, formData, 800, dbEvalConfig);

  // Get model config from settings context
  const { model: configModel } = useModelConfig();

  const handleAnalyze = async () => {
    // Check auth before running analysis
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowAuthPrompt(true);
      return;
    }

    setStep("analyzing");
    
    // --- Market Snapshot: bypass Sentinel, call dedicated edge function ---
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

    // --- Standard Sentinel pipeline for all other scenarios ---
    // Use the model from settings context (all inference goes through Google AI Studio)
    const effectiveModel = configModel;

    // Include strategy and market insights in form data for AI grounding
    const enrichedData = {
      ...formData,
      strategy: strategyValue,
      // Constraint #1: LangSmith telemetry — confidence_flag and evaluation_score
      ...(evaluation ? {
        _evaluation_score: String(evaluation.score),
        _confidence_flag: evaluation.confidenceFlag,
      } : {}),
      // Include market insights if activated
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
      undefined, // config
      effectiveModel // pass the model from settings
    );

    if (result?.success) {
      setAnalysisResult(result.result);
      setAnalysisTimestamp(new Date().toISOString());
      setStep("results");
      toast.success("Analysis complete!");

      // Save file attachments (fire-and-forget)
      if (attachedFileIds.length > 0) {
        attachFiles.mutate({
          runId: scenarioRunId,
          scenarioType: scenario.id,
          fileIds: attachedFileIds,
        });
      }
    } else {
      setStep("review");
      toast.error(sentinelError?.message || "Analysis failed. Please try again.");
    }
  };

  // Deep Analysis handler (LangGraph pipeline)
  const handleDeepAnalysis = async () => {
    // Check auth before running analysis
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowAuthPrompt(true);
      return;
    }

    setStep("analyzing");
    setIsDeepAnalysisRunning(true);
    setDeepAnalysisStep(0);
    setDeepAnalysisResult(null);
    setDeepAnalysisError(null);

    // Start simulated step progress (4 steps, ~3s each)
    let currentStepLocal = 0;
    const progressInterval = setInterval(() => {
      if (currentStepLocal < 3) {
        currentStepLocal++;
        setDeepAnalysisStep(currentStepLocal);
      }
    }, 3500);

    try {
      // Build query from form data — include evaluation telemetry for LangSmith (Constraint #1)
      const queryParts = Object.entries(formData)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`);
      
      if (evaluation) {
        queryParts.push(`_evaluation_score: ${evaluation.score}`);
        queryParts.push(`_confidence_flag: ${evaluation.confidenceFlag}`);
      }
      
      const queryText = queryParts.join('\n');

      const graphConfig: ModelConfigType = {
        model: configModel,
      };

      const result = await runExosGraph(queryText, graphConfig, scenario.id);

      clearInterval(progressInterval);
      setDeepAnalysisStep(4); // Complete all steps
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
        analysisResult: analysisResult,
        formData: formData,
        timestamp: analysisTimestamp,
        selectedDashboards: selectedDashboards,
      },
    });
  };

  const renderField = (field: ScenarioRequiredField, skipBusinessContextField = false) => {
    const commonClasses = "bg-background";

    // Special handling for industryContext field - use BusinessContextField component
    if (field.id === "industryContext" && !skipBusinessContextField) {
      return (
        <BusinessContextField
          value={formData[field.id] || ""}
          onChange={(value) => handleFieldChange(field.id, value)}
          placeholder={field.placeholder || field.description}
        />
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <Select
          value={formData[field.id] || ""}
          onValueChange={(value) => handleFieldChange(field.id, value)}
        >
          <SelectTrigger
            ref={(el) => (fieldRefs.current[field.id] = el)}
            className={commonClasses}
          >
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === "textarea") {
      return (
        <Textarea
          ref={(el) => (fieldRefs.current[field.id] = el)}
          placeholder={field.placeholder || field.description}
          value={formData[field.id] || ""}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
          className={`${commonClasses} min-h-[120px]`}
          rows={5}
        />
      );
    }

    if (field.type === "text" && field.label.toLowerCase().includes("text")) {
      return (
        <Textarea
          ref={(el) => (fieldRefs.current[field.id] = el)}
          placeholder={field.placeholder || field.description}
          value={formData[field.id] || ""}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
          className={commonClasses}
          rows={4}
        />
      );
    }

    return (
      <Input
        ref={(el) => (fieldRefs.current[field.id] = el)}
        type={field.type === "number" || field.type === "percentage" || field.type === "currency" ? "number" : "text"}
        placeholder={field.description}
        value={formData[field.id] || ""}
        onChange={(e) => handleFieldChange(field.id, e.target.value)}
        className={commonClasses}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}

      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <ScenarioTutorial
                  scenario={scenario}
                  industryName={industryContext?.name ?? null}
                  categoryName={categoryContext?.name ?? null}
                />

                {/* Master XML Template Preview — superadmin only */}
                <MasterXMLPreview scenarioType={scenario.id} userEmail={user?.email} />
              </div>

              {scenario.dataRequirements && (
                <DataRequirementsPanel dataRequirements={scenario.dataRequirements} />
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChatAssistant(!showChatAssistant)}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              {showChatAssistant ? "Hide chatbot" : "Use chatbot to enter data"}
            </Button>

            {showChatAssistant && (
              <ScenarioChatAssistant
                scenarioId={scenario.id}
                requiredFields={scenario.requiredFields.map((f) => ({
                  id: f.id,
                  label: f.label,
                  description: f.description,
                  required: f.required,
                  type: f.type,
                  placeholder: f.placeholder,
                }))}
                dataRequirements={
                  scenario.dataRequirements
                    ? scenario.dataRequirements.sections
                        .map((s) => `${s.heading}: ${s.description}`)
                        .join("\n")
                    : ""
                }
                onApply={(fields) => {
                  setFormData((prev) => ({ ...prev, ...fields }));
                  setShowChatAssistant(false);
                  toast.success(`${Object.keys(fields).length} field(s) populated from chat`);
                }}
                onClose={() => setShowChatAssistant(false)}
              />
            )}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold mb-1">
                  Analysis Settings
                </h3>
                <p className="text-sm text-muted-foreground">
                  Fields marked with <span className="text-destructive">*</span> are required 
                  for the analysis. Optional fields improve recommendation accuracy.
                </p>
              </div>
              
              {/* Drafter-Validator test data generator (only visible in non-shared mode) */}
              {showTechnicalDetails && (
                <div className="flex items-center gap-2">
                  {testDataMetadata && (
                    <span className="text-xs text-muted-foreground">
                      {testDataMetadata.source === "ai" ? (
                        <>Score: {testDataMetadata.score}/100</>
                      ) : (
                        "Static"
                      )}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDraftTestCase}
                    disabled={isDrafting || isGeneratingFromDraft}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    {isDrafting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    {isDrafting ? "Drafting..." : "Draft Test Case"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStaticGenerate}
                    disabled={isDrafting || isGeneratingFromDraft}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <FlaskConical className="w-4 h-4" />
                    Static
                  </Button>
                </div>
              )}
            </div>

            {/* Drafted Parameters Card (shown when draft is ready) */}
            {showTechnicalDetails && draftedParams && (
              <DraftedParametersCard
                parameters={draftedParams}
                onApprove={handleApproveAndGenerate}
                onRedraft={handleDraftTestCase}
                isGenerating={isGeneratingFromDraft}
                isRedrafting={isDrafting}
              />
            )}

            {/* Master XML moved to scenario info panel — see grid above */}

            {/* Context & Strategy — compact 2-column row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Left: Context selectors with inline editors */}
              <div className="md:col-span-2 p-3 rounded-lg border border-border bg-card dark:bg-secondary/60 shadow-sm space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <IndustrySelector
                    value={industrySlug}
                    onChange={handleIndustryChange}
                  />
                  <CategorySelector
                    value={categorySlug}
                    onChange={handleCategoryChange}
                  />
                </div>

                {/* Inline context editors & preview — collapsed by default */}
                {industrySlug && (
                  <IndustryContextEditor
                    industrySlug={industrySlug}
                    overrides={industryOverrides}
                    onOverridesChange={setIndustryOverrides}
                  />
                )}
                {categorySlug && (
                  <CategoryContextEditor
                    categorySlug={categorySlug}
                    overrides={categoryOverrides}
                    onOverridesChange={setCategoryOverrides}
                  />
                )}
                {(industrySlug || categorySlug) && (
                  <ContextPreview
                    industrySlug={industrySlug}
                    categorySlug={categorySlug}
                    showXML={true}
                  />
                )}
              </div>

              {/* Right: Strategy selector */}
              {scenario.strategySelector && (
                <div className="border border-primary/20 rounded-xl bg-primary/5 dark:bg-primary/10 p-3">
                <StrategySelector
                  value={strategyValue}
                  onChange={setStrategyValue}
                  title={strategyPresets[scenario.strategySelector].title}
                  description={strategyPresets[scenario.strategySelector].description}
                  options={strategyPresets[scenario.strategySelector].options}
                />
                </div>
              )}
            </div>

            {/* Market Insights Banner */}
            {hasMarketInsights && marketInsight && (
              <MarketInsightsBanner
                insight={marketInsight}
                onActivate={() => {
                  setIsMarketInsightsActive(true);
                  toast.success("Market insights activated", {
                    description: "Real-time market intelligence will be included in your analysis.",
                  });
                }}
                isActivated={isMarketInsightsActive}
              />
            )}

            {/* Two-column: Fields (2/3) + Sidebar (1/3) */}
            <div className="border border-border/80 rounded-xl bg-card dark:bg-surface p-5 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2/3: Input fields */}
              <div className="md:col-span-2 space-y-6">
                {/* Required Fields */}
                <div className="space-y-4 bg-secondary/30 dark:bg-secondary/40 rounded-lg p-4 border border-border/50">
                  <h4 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                    Enter Your Data
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scenario.requiredFields
                      .filter((f) => f.required)
                      .map((field) => {
                        if (field.id === "industryContext") {
                          return (
                            <div key={field.id} className="md:col-span-2">
                              {renderField(field)}
                            </div>
                          );
                        }
                        const blockEval = evaluation?.blocks.find((b) => b.fieldId === field.id);
                        return (
                          <div key={field.id} className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}>
                            <Label className="flex items-center gap-1">
                              {field.label}
                              <span className="text-destructive">*</span>
                              {field.type === "percentage" && (
                                <span className="text-muted-foreground text-xs">(%)</span>
                              )}
                              {field.type === "currency" && (
                                <span className="text-muted-foreground text-xs">($)</span>
                              )}
                              {blockEval && blockEval.status === "pass" && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-success ml-1" />
                              )}
                              {blockEval && blockEval.status === "warning" && (
                                <AlertCircle className="w-3.5 h-3.5 text-warning ml-1" />
                              )}
                              {blockEval && blockEval.status === "fail" && (
                                <AlertTriangle className="w-3.5 h-3.5 text-destructive ml-1" />
                              )}
                            </Label>
                            {renderField(field)}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Optional Fields */}
                {scenario.requiredFields.some((f) => !f.required) && (
                  <div className="space-y-4 bg-muted/40 dark:bg-muted/20 rounded-lg p-4 border border-border/40">
                    <h4 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
                      Optional Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scenario.requiredFields
                        .filter((f) => !f.required)
                        .map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label className="flex items-center gap-1">
                              {field.label}
                              {field.type === "percentage" && (
                                <span className="text-muted-foreground text-xs">(%)</span>
                              )}
                              {field.type === "currency" && (
                                <span className="text-muted-foreground text-xs">($)</span>
                              )}
                            </Label>
                            {renderField(field)}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right 1/3: Sidebar */}
              <div className="space-y-4 p-3 rounded-lg border border-iris/15 bg-iris/5 dark:bg-iris/10">
                <DashboardSelector
                  scenarioId={scenario.id}
                  selectedDashboards={selectedDashboards}
                  onSelectionChange={setSelectedDashboards}
                />

                <ScenarioFileAttachment
                  selectedFileIds={attachedFileIds}
                  onSelectionChange={setAttachedFileIds}
                />

                <ModelSelector value={selectedModel} onChange={setSelectedModel} />

                <FinalXMLPreview
                  scenarioType={scenario.id}
                  scenarioData={formData}
                  industry={industryContext || null}
                  category={categoryContext || null}
                  strategyValue={strategyValue}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="hero"
                size="lg"
                onClick={() => setStep("review")}
                className="gap-2"
              >
                Review Data
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-display text-lg font-semibold mb-1">
                Data Review
              </h3>
              <p className="text-sm text-muted-foreground">
                Review your input data and check for any missing information before analysis.
              </p>
            </div>

            <DataRequirementsAlert
              missingRequired={missingRequired}
              missingOptional={missingOptional}
              evaluation={evaluation}
              onFieldClick={(fieldId) => {
                setStep("input");
                setTimeout(() => handleFieldClick(fieldId), 100);
              }}
            />

            {/* Expected Outputs */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="font-medium mb-3">Analysis Will Generate:</h4>
              <ul className="space-y-2">
                {scenario.outputs.map((output, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="text-muted-foreground">{output}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep("input")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit Data
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!canProceed || isDeepAnalysisRunning}
                  className="gap-2"
                >
                  {!canProceed && <AlertTriangle className="w-4 h-4" />}
                  <Sparkles className="w-4 h-4" />
                  {canProceed ? "Analyze with AI" : "Complete Required Fields"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDeepAnalysis}
                  disabled={!canProceed || isDeepAnalysisRunning}
                  className="gap-2 border-iris/50 hover:bg-iris/10"
                >
                  <BrainCircuit className="w-4 h-4" />
                  Deep Analysis
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase">Beta</Badge>
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-10"
          >
            {isDeepAnalysisRunning ? (
              <DeepAnalysisPipeline
                status="running"
                currentStepIndex={deepAnalysisStep}
                errorMessage={deepAnalysisError || undefined}
              />
            ) : (
              <>
                <div className="text-center mb-8">
                  <h3 className="font-display text-xl font-semibold mb-2">
                    Analyzing Your Data
                  </h3>
                  <p className="text-muted-foreground">
                    Running {scenario.title} analysis through EXOS Sentinel pipeline...
                  </p>
                </div>

                <AnalysisPipelineAnimation
                  isProcessing={isProcessing}
                  currentApiStage={currentStage}
                />
              </>
            )}
          </motion.div>
        )}

        {step === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {deepAnalysisResult ? (
              <DeepAnalysisResult
                result={deepAnalysisResult}
                onStartOver={() => {
                  setDeepAnalysisResult(null);
                  setStep("input");
                }}
                onGenerateReport={handleGenerateReport}
              />
            ) : (
              <>
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <h3 className="font-display text-xl font-semibold">
                      Analysis Complete
                    </h3>
                  </div>
                  
                  {analysisResult ? (
                    <div className="bg-card rounded-lg p-4 border border-border max-h-[500px] overflow-y-auto">
                      <MarkdownRenderer content={analysisResult} />
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Your {scenario.title} analysis is ready.
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {scenario.outputs.map((output, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground"
                      >
                        {output.split(":")[0]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Output Feedback */}
                <OutputFeedback
                  onFeedbackSubmit={handleFeedbackSubmit}
                  onGenerateReport={handleGenerateReport}
                  tokenUsage={tokenUsage}
                  processingTimeMs={processingTimeMs}
                  model={selectedModel}
                />

                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep("input")}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Start Over
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AuthPrompt
        variant="modal"
        open={showAuthPrompt}
        onOpenChange={setShowAuthPrompt}
        feature="AI Procurement Analysis"
        description="Create a free account to get AI-powered insights on your procurement scenarios"
      />
    </div>
  );
};

export default GenericScenarioWizard;
