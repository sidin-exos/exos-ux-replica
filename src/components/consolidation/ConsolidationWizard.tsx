import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SupplierInput, { Supplier } from "./SupplierInput";
import RiskAppetiteSelector from "./RiskAppetiteSelector";
import AnalysisResults from "./AnalysisResults";

type Step = "input" | "parameters" | "analyzing" | "results";

interface WizardState {
  suppliers: Supplier[];
  riskAppetite: "low" | "medium" | "high";
  industryContext: string;
}

const ConsolidationWizard = () => {
  const [step, setStep] = useState<Step>("input");
  const [state, setState] = useState<WizardState>({
    suppliers: [
      { id: "1", name: "", category: "", annualSpend: "" },
    ],
    riskAppetite: "medium",
    industryContext: "",
  });

  const handleAnalyze = async () => {
    setStep("analyzing");
    // Simulate AI analysis delay
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setStep("results");
  };

  const canProceedToParams =
    state.suppliers.length > 0 &&
    state.suppliers.some(
      (s) => s.name && s.category && s.annualSpend
    );

  // Mock results data
  const mockResults = {
    totalSpend: state.suppliers.reduce(
      (sum, s) => sum + (parseFloat(s.annualSpend) || 0),
      0
    ),
    supplierCount: state.suppliers.filter((s) => s.name).length,
    scenarios: [
      {
        name: "Single-Source Strategy",
        savings: 15,
        riskLevel: "high" as const,
        keyAction:
          "Consolidate 100% volume to top-performing supplier with 24-month contract",
      },
      {
        name: "Dual-Source Strategy",
        savings: 10,
        riskLevel: "medium" as const,
        keyAction:
          "80/20 split between primary and backup supplier for risk mitigation",
      },
      {
        name: "Tiered Consolidation",
        savings: 8,
        riskLevel: "low" as const,
        keyAction:
          "Reduce from multiple suppliers to 3 strategic partners with volume tiers",
      },
    ],
    negotiationHooks: [
      "Highlight consolidated volume as leverage: 'We're looking to streamline our supplier base and can offer 100% category volume to the right partner.'",
      "Request tiered pricing structure: 'Given this volume commitment, we expect tier-2 enterprise pricing with quarterly rebates.'",
      "Emphasize long-term partnership: 'We're prepared to sign a 24-month agreement with annual reviews for continued improvement.'",
    ],
    spendByCategory: state.suppliers.reduce((acc, s) => {
      const existing = acc.find((a) => a.name === s.category);
      const value = parseFloat(s.annualSpend) || 0;
      if (existing) {
        existing.value += value;
      } else if (s.category) {
        acc.push({ name: s.category, value });
      }
      return acc;
    }, [] as { name: string; value: number }[]),
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {["input", "parameters", "results"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step === s || (step === "analyzing" && s === "results")
                  ? "gradient-primary text-primary-foreground"
                  : step === "results" || (step === "parameters" && i === 0)
                  ? "bg-primary/30 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  i === 0 && (step === "parameters" || step === "analyzing" || step === "results")
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
            <SupplierInput
              suppliers={state.suppliers}
              onSuppliersChange={(suppliers) =>
                setState((prev) => ({ ...prev, suppliers }))
              }
            />

            <div className="flex justify-end">
              <Button
                variant="hero"
                size="lg"
                onClick={() => setStep("parameters")}
                disabled={!canProceedToParams}
                className="gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "parameters" && (
          <motion.div
            key="parameters"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <RiskAppetiteSelector
              value={state.riskAppetite}
              onChange={(riskAppetite) =>
                setState((prev) => ({ ...prev, riskAppetite }))
              }
            />

            <div>
              <Label className="text-base font-semibold">
                Industry Context (Optional)
              </Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Help the AI understand your market for better recommendations
              </p>
              <Input
                placeholder="e.g., Manufacturing, Retail, Healthcare..."
                value={state.industryContext}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    industryContext: e.target.value,
                  }))
                }
                className="bg-background"
              />
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep("input")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                variant="hero"
                size="lg"
                onClick={handleAnalyze}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Analyze with AI
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
              Running consolidation scenarios and calculating savings...
            </p>
          </motion.div>
        )}

        {step === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AnalysisResults {...mockResults} />

            <div className="flex justify-between mt-6">
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

export default ConsolidationWizard;
