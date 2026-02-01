import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, AlertTriangle, FlaskConical, Loader2, Wand2 } from "lucide-react";
import { AnalysisPipelineAnimation } from "@/components/sentinel/AnalysisPipelineAnimation";
import { Button } from "@/components/ui/button";
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
import { generateTestData } from "@/lib/test-data-factory";
import {
  DraftedParameters,
  draftParameters,
  generateWithParameters,
} from "@/lib/drafted-parameters";
import { toast } from "sonner";

interface GenericScenarioWizardProps {
  scenario: Scenario;
}

type Step = "input" | "review" | "analyzing" | "results";

const GenericScenarioWizard = ({ scenario }: GenericScenarioWizardProps) => {
  const navigate = useNavigate();
  const { showTechnicalDetails } = useShareableMode();
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

  // Fetch context data for AI grounding
  const { data: industryContext } = useIndustryContext(industrySlug);
  const { data: categoryContext } = useProcurementCategory(categorySlug);

  // Sentinel AI pipeline
  const { analyze, isProcessing, currentStage, error: sentinelError } = useSentinel({
    onProgress: (stage, status) => {
      console.log(`[Sentinel] ${stage}: ${status}`);
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // === DRAFTER-VALIDATOR WORKFLOW ===
  
  // Step 1: Draft parameters (1 AI call)
  const handleDraftTestCase = async () => {
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

  const handleAnalyze = async () => {
    setStep("analyzing");
    
    // Include strategy in form data for AI grounding
    const enrichedData = {
      ...formData,
      strategy: strategyValue,
    };

    const result = await analyze(
      scenario.id,
      enrichedData,
      industryContext || null,
      categoryContext || null,
      undefined, // config
      selectedModel // pass the selected model
    );

    if (result?.success) {
      setAnalysisResult(result.result);
      setAnalysisTimestamp(new Date().toISOString());
      setStep("results");
      toast.success("Analysis complete!");
    } else {
      setStep("review");
      toast.error(sentinelError?.message || "Analysis failed. Please try again.");
    }
  };

  const handleFeedbackSubmit = (rating: number, feedback: string) => {
    console.log("Feedback submitted:", { rating, feedback, scenario: scenario.id });
    // Could be stored in database in future
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
      <div className="flex items-center justify-center gap-2">
        {["input", "review", "results"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step === s || (step === "analyzing" && s === "results")
                  ? "gradient-primary text-primary-foreground"
                  : step === "results" || (step === "review" && i === 0)
                  ? "bg-primary/30 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  i === 0 && (step === "review" || step === "analyzing" || step === "results")
                    ? "bg-primary"
                    : i === 1 && step === "results"
                    ? "bg-primary"
                    : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold mb-1">
                  Enter Your Data
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

            {/* Master XML Template Preview (hidden in shareable mode) */}
            <MasterXMLPreview scenarioType={scenario.id} />

            {/* Context Selectors for AI Grounding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-border bg-card/50">
              <IndustrySelector
                value={industrySlug}
                onChange={handleIndustryChange}
              />
              <CategorySelector
                value={categorySlug}
                onChange={handleCategoryChange}
              />
            </div>

            {/* Interactive Context Editors */}
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

            {/* Context Preview (collapsed by default, XML hidden in shared mode) */}
            {(industrySlug || categorySlug) && (
              <ContextPreview
                industrySlug={industrySlug}
                categorySlug={categorySlug}
                showXML={true}
              />
            )}

            {/* Strategy Selector */}
            {scenario.strategySelector && (
              <div className="mb-6">
                <StrategySelector
                  value={strategyValue}
                  onChange={setStrategyValue}
                  title={strategyPresets[scenario.strategySelector].title}
                  description={strategyPresets[scenario.strategySelector].description}
                  options={strategyPresets[scenario.strategySelector].options}
                />
              </div>
            )}

            {/* Required Fields */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Required Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenario.requiredFields
                  .filter((f) => f.required)
                  .map((field) => {
                    // BusinessContextField renders its own label
                    if (field.id === "industryContext") {
                      return (
                        <div key={field.id} className="md:col-span-2">
                          {renderField(field)}
                        </div>
                      );
                    }
                    
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
                        </Label>
                        {renderField(field)}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Optional Fields */}
            {scenario.requiredFields.some((f) => !f.required) && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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

            {/* Dashboard Selector */}
            <DashboardSelector
              scenarioId={scenario.id}
              selectedDashboards={selectedDashboards}
              onSelectionChange={setSelectedDashboards}
            />

            {/* AI Model Selector - hidden in shareable mode */}
            <ModelSelector value={selectedModel} onChange={setSelectedModel} />

            {/* Final XML Preview - shows complete XML after form is filled (hidden in shareable mode) */}
            <FinalXMLPreview
              scenarioType={scenario.id}
              scenarioData={formData}
              industry={industryContext || null}
              category={categoryContext || null}
              strategyValue={strategyValue}
            />

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
              <Button
                variant="hero"
                size="lg"
                onClick={handleAnalyze}
                disabled={!canProceed}
                className="gap-2"
              >
                {!canProceed && <AlertTriangle className="w-4 h-4" />}
                <Sparkles className="w-4 h-4" />
                {canProceed ? "Analyze with AI" : "Complete Required Fields"}
              </Button>
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
          </motion.div>
        )}

        {step === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
                <h3 className="font-display text-xl font-semibold">
                  Analysis Complete
                </h3>
              </div>
              
              {analysisResult ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-foreground bg-card rounded-lg p-4 border border-border max-h-[500px] overflow-y-auto">
                    {analysisResult}
                  </div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GenericScenarioWizard;
