import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { DeepAnalysisResult } from "@/components/analysis/DeepAnalysisResult";
import OutputFeedback from "@/components/feedback/OutputFeedback";
import { Button } from "@/components/ui/button";
import type { Scenario } from "@/lib/scenarios";
import type { AIModel } from "./ModelSelector";

interface WizardResultsStepProps {
  scenario: Scenario;
  analysisResult: string | null;
  deepAnalysisResult: {
    finalAnswer: string;
    confidenceScore: number;
    validationStatus: "pending" | "approved" | "rejected";
    retryCount: number;
  } | null;
  tokenUsage: any;
  processingTimeMs: number | undefined;
  selectedModel: AIModel;
  onStartOver: () => void;
  onFeedbackSubmit: (rating: number, feedback: string) => void;
  onGenerateReport: () => void;
}

const WizardResultsStep = ({
  scenario,
  analysisResult,
  deepAnalysisResult,
  tokenUsage,
  processingTimeMs,
  selectedModel,
  onStartOver,
  onFeedbackSubmit,
  onGenerateReport,
}: WizardResultsStepProps) => {
  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {deepAnalysisResult ? (
        <DeepAnalysisResult
          result={deepAnalysisResult}
          onStartOver={onStartOver}
          onGenerateReport={onGenerateReport}
        />
      ) : (
        <>
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
              <h3 className="font-display text-xl font-semibold">Analysis Complete</h3>
            </div>

            {analysisResult ? (
              <div className="bg-card rounded-lg p-4 border border-border max-h-[500px] overflow-y-auto">
                <MarkdownRenderer content={analysisResult} />
              </div>
            ) : (
              <p className="text-muted-foreground">Your {scenario.title} analysis is ready.</p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {scenario.outputs.map((output, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground">
                  {output.split(":")[0]}
                </span>
              ))}
            </div>
          </div>

          <OutputFeedback
            onFeedbackSubmit={onFeedbackSubmit}
            onGenerateReport={onGenerateReport}
            tokenUsage={tokenUsage}
            processingTimeMs={processingTimeMs}
            model={selectedModel}
          />

          <div className="flex justify-start">
            <Button variant="outline" size="lg" onClick={onStartOver} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Start Over
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default WizardResultsStep;
