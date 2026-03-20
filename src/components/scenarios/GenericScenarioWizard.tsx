import { AnimatePresence, motion } from "framer-motion";
import AuthPrompt from "@/components/auth/AuthPrompt";
import { AnalysisPipelineAnimation } from "@/components/sentinel/AnalysisPipelineAnimation";
import { DeepAnalysisPipeline } from "@/components/analysis/DeepAnalysisPipeline";
import { toast } from "sonner";
import type { Scenario } from "@/lib/scenarios";
import { useScenarioWizardState } from "./useScenarioWizardState";
import WizardInputStep from "./WizardInputStep";
import WizardReviewStep from "./WizardReviewStep";
import WizardResultsStep from "./WizardResultsStep";

interface GenericScenarioWizardProps {
  scenario: Scenario;
}

const GenericScenarioWizard = ({ scenario }: GenericScenarioWizardProps) => {
  const state = useScenarioWizardState(scenario);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {["input", "review", "results"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                state.step === s || (state.step === "analyzing" && s === "results")
                  ? "gradient-primary text-primary-foreground"
                  : state.step === "results" || (state.step === "review" && i === 0)
                  ? "bg-primary/30 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  i === 0 && (state.step === "review" || state.step === "analyzing" || state.step === "results")
                    ? "bg-primary"
                    : i === 1 && state.step === "results"
                    ? "bg-primary"
                    : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {state.step === "input" && (
          <WizardInputStep
            scenario={scenario}
            formData={state.formData}
            strategyValue={state.strategyValue}
            industrySlug={state.industrySlug}
            categorySlug={state.categorySlug}
            industryOverrides={state.industryOverrides}
            categoryOverrides={state.categoryOverrides}
            selectedModel={state.selectedModel}
            selectedDashboards={state.selectedDashboards}
            attachedFileIds={state.attachedFileIds}
            draftedParams={state.draftedParams}
            isDrafting={state.isDrafting}
            isGeneratingFromDraft={state.isGeneratingFromDraft}
            testDataMetadata={state.testDataMetadata}
            showTechnicalDetails={state.showTechnicalDetails}
            showChatAssistant={state.showChatAssistant}
            isMarketInsightsActive={state.isMarketInsightsActive}
            hasMarketInsights={state.hasMarketInsights}
            marketInsight={state.marketInsight}
            industryContext={state.industryContext}
            categoryContext={state.categoryContext}
            evaluation={state.evaluation}
            fieldRefs={state.fieldRefs}
            onNext={() => state.setStep("review")}
            onFieldChange={state.handleFieldChange}
            onStrategyChange={state.setStrategyValue}
            onIndustryChange={state.handleIndustryChange}
            onCategoryChange={state.handleCategoryChange}
            onIndustryOverridesChange={state.setIndustryOverrides}
            onCategoryOverridesChange={state.setCategoryOverrides}
            onModelChange={state.setSelectedModel}
            onDashboardsChange={state.setSelectedDashboards}
            onAttachedFilesChange={state.setAttachedFileIds}
            onToggleChatAssistant={() => state.setShowChatAssistant(!state.showChatAssistant)}
            onActivateMarketInsights={() => {
              state.setIsMarketInsightsActive(true);
              toast.success("Market insights activated", {
                description: "Real-time market intelligence will be included in your analysis.",
              });
            }}
            onSetFormData={state.setFormData}
            onDraftTestCase={state.handleDraftTestCase}
            onApproveAndGenerate={state.handleApproveAndGenerate}
            onStaticGenerate={state.handleStaticGenerate}
          />
        )}

        {state.step === "review" && (
          <WizardReviewStep
            scenario={scenario}
            missingRequired={state.missingRequired}
            missingOptional={state.missingOptional}
            evaluation={state.evaluation}
            canProceed={state.canProceed}
            isDeepAnalysisRunning={state.isDeepAnalysisRunning}
            onBack={() => state.setStep("input")}
            onFieldClick={state.handleFieldClick}
            onAnalyze={state.handleAnalyze}
            onDeepAnalysis={state.handleDeepAnalysis}
          />
        )}

        {state.step === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-10"
          >
            {state.isDeepAnalysisRunning ? (
              <DeepAnalysisPipeline
                status="running"
                currentStepIndex={state.deepAnalysisStep}
                errorMessage={state.deepAnalysisError || undefined}
              />
            ) : (
              <>
                <div className="text-center mb-8">
                  <h3 className="font-display text-xl font-semibold mb-2">Analyzing Your Data</h3>
                  <p className="text-muted-foreground">
                    Running {scenario.title} analysis through EXOS Sentinel pipeline...
                  </p>
                </div>
                <AnalysisPipelineAnimation
                  isProcessing={state.isProcessing}
                  currentApiStage={state.currentStage}
                />
              </>
            )}
          </motion.div>
        )}

        {state.step === "results" && (
          <WizardResultsStep
            scenario={scenario}
            analysisResult={state.analysisResult}
            deepAnalysisResult={state.deepAnalysisResult}
            tokenUsage={state.tokenUsage}
            processingTimeMs={state.processingTimeMs ?? undefined}
            selectedModel={state.selectedModel}
            onStartOver={() => state.setStep("input")}
            onFeedbackSubmit={state.handleFeedbackSubmit}
            onGenerateReport={state.handleGenerateReport}
          />
        )}
      </AnimatePresence>

      <AuthPrompt
        variant="modal"
        open={state.showAuthPrompt}
        onOpenChange={state.setShowAuthPrompt}
        feature="AI Procurement Analysis"
        description="Create a free account to get AI-powered insights on your procurement scenarios"
      />
    </div>
  );
};

export default GenericScenarioWizard;
