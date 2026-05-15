import { motion } from "framer-motion";
import { ChevronDown, Cpu, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShareableMode } from "@/hooks/useShareableMode";
import { estimateCostUsd } from "@/lib/ai-pricing";

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OutputFeedbackProps {
  /** Kept for backwards compatibility; rating UI removed at this stage. */
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
  onGenerateReport?: () => void;
  tokenUsage?: TokenUsage | null;
  processingTimeMs?: number | null;
  model?: string;
}

const OutputFeedback = ({
  onGenerateReport,
  tokenUsage,
  processingTimeMs,
  model,
}: OutputFeedbackProps) => {
  const { showTechnicalDetails } = useShareableMode();

  const estimateCost = (usage: TokenUsage): number =>
    estimateCostUsd(model, usage.prompt_tokens, usage.completion_tokens);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-lg border border-border bg-card/50 p-5 space-y-4"
    >
      {/* Admin-only: Token Usage & Cost Display */}
      {showTechnicalDetails && tokenUsage && (
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span className="font-medium">Generation Metrics</span>
            {model && (
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">
                {model.split("/").pop()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="text-muted-foreground">Input Tokens</div>
              <div className="font-mono font-medium text-foreground">
                {tokenUsage.prompt_tokens.toLocaleString()}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground">Output Tokens</div>
              <div className="font-mono font-medium text-foreground">
                {tokenUsage.completion_tokens.toLocaleString()}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Est. Cost
              </div>
              <div className="font-mono font-medium text-foreground">
                ${estimateCost(tokenUsage).toFixed(4)}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </div>
              <div className="font-mono font-medium text-foreground">
                {processingTimeMs ? `${(processingTimeMs / 1000).toFixed(1)}s` : "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center">
        Generate the full report to review the complete analysis and share your feedback.
      </p>

      <Button
        onClick={onGenerateReport}
        variant="hero"
        size="lg"
        className="w-full gap-2"
      >
        Generate Full Report
        <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
      </Button>
    </motion.div>
  );
};

export default OutputFeedback;
