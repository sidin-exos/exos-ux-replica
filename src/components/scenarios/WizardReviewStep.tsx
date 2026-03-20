import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, AlertTriangle, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataRequirementsAlert from "@/components/consolidation/DataRequirementsAlert";
import type { Scenario, ScenarioRequiredField } from "@/lib/scenarios";

interface WizardReviewStepProps {
  scenario: Scenario;
  missingRequired: ScenarioRequiredField[];
  missingOptional: ScenarioRequiredField[];
  evaluation: any;
  canProceed: boolean;
  isDeepAnalysisRunning: boolean;
  onBack: () => void;
  onFieldClick: (fieldId: string) => void;
  onAnalyze: () => void;
  onDeepAnalysis: () => void;
}

const WizardReviewStep = ({
  scenario,
  missingRequired,
  missingOptional,
  evaluation,
  canProceed,
  isDeepAnalysisRunning,
  onBack,
  onFieldClick,
  onAnalyze,
  onDeepAnalysis,
}: WizardReviewStepProps) => {
  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="font-display text-lg font-semibold mb-1">Data Review</h3>
        <p className="text-sm text-muted-foreground">
          Review your input data and check for any missing information before analysis.
        </p>
      </div>

      <DataRequirementsAlert
        missingRequired={missingRequired}
        missingOptional={missingOptional}
        evaluation={evaluation}
        onFieldClick={(fieldId) => {
          onBack();
          setTimeout(() => onFieldClick(fieldId), 100);
        }}
      />

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
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Edit Data
        </Button>
        <div className="flex gap-3">
          <Button
            variant="hero"
            size="lg"
            onClick={onAnalyze}
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
            onClick={onDeepAnalysis}
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
  );
};

export default WizardReviewStep;
