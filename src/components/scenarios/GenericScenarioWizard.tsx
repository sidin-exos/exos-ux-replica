import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, AlertTriangle } from "lucide-react";
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
import {
  Scenario,
  ScenarioRequiredField,
  getMissingRequiredFields,
  getMissingOptionalFields,
} from "@/lib/scenarios";

interface GenericScenarioWizardProps {
  scenario: Scenario;
}

type Step = "input" | "review" | "analyzing" | "results";

const GenericScenarioWizard = ({ scenario }: GenericScenarioWizardProps) => {
  const [step, setStep] = useState<Step>("input");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [strategyValue, setStrategyValue] = useState<StrategyType>("balanced");
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

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
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setStep("results");
  };

  const renderField = (field: ScenarioRequiredField) => {
    const commonClasses = "bg-background";

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
            <div>
              <h3 className="font-display text-lg font-semibold mb-1">
                Enter Your Data
              </h3>
              <p className="text-sm text-muted-foreground">
                Fields marked with <span className="text-destructive">*</span> are required 
                for the analysis. Optional fields improve recommendation accuracy.
              </p>
            </div>

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
                  .map((field) => (
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
                  ))}
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-16 text-center"
          >
            <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
              <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">
              Analyzing Your Data
            </h3>
            <p className="text-muted-foreground">
              Running {scenario.title} analysis and generating recommendations...
            </p>
          </motion.div>
        )}

        {step === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-6 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">
                Analysis Complete
              </h3>
              <p className="text-muted-foreground mb-4">
                Your {scenario.title} analysis is ready. Connect to Lovable Cloud 
                to enable AI-powered recommendations.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
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

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep("input")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Start Over
              </Button>
              <Button variant="hero" size="lg" className="gap-2">
                Export Report
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GenericScenarioWizard;
