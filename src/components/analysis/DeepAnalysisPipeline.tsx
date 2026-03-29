import { motion } from "framer-motion";
import { Shield, BrainCircuit, Scale, Unlock, Check, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DeepAnalysisPipelineProps {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentStepIndex: number;
  errorMessage?: string;
}

const PIPELINE_STEPS = [
  {
    id: 'anonymize',
    icon: Shield,
    label: 'Sentinel Layer',
    description: 'Anonymizing sensitive entities',
  },
  {
    id: 'reasoning',
    icon: BrainCircuit,
    label: 'AI Reasoning',
    description: 'Generating strategic insights',
  },
  {
    id: 'validate',
    icon: Scale,
    label: 'Validation Loop',
    description: 'Checking for hallucinations',
  },
  {
    id: 'deanonymize',
    icon: Unlock,
    label: 'Deanonymization',
    description: 'Restoring real data context',
  },
];

export const DeepAnalysisPipeline = ({
  status,
  currentStepIndex,
  errorMessage,
}: DeepAnalysisPipelineProps) => {
  const progressPercentage = status === 'completed' 
    ? 100 
    : Math.min(((currentStepIndex + 1) / PIPELINE_STEPS.length) * 100, 95);

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="font-display text-xl font-semibold mb-2">
          Deep Analysis Pipeline
        </h3>
        <p className="text-sm text-muted-foreground">
          Multi-stage reasoning with validation
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex || status === 'completed';
          const isActive = index === currentStepIndex && status === 'running';
          const isPending = index > currentStepIndex && status !== 'completed';
          const isError = status === 'error' && index === currentStepIndex;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
                isCompleted && "bg-success/10 border-success/30",
                isActive && "bg-primary/10 border-primary/50",
                isPending && "bg-muted/30 border-border opacity-50",
                isError && "bg-destructive/10 border-destructive/50"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isCompleted && "bg-success/20 text-success",
                  isActive && "bg-primary/20 text-primary",
                  isPending && "bg-muted text-muted-foreground",
                  isError && "bg-destructive/20 text-destructive"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isError ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium text-sm",
                      isCompleted && "text-success",
                      isActive && "text-primary",
                      isPending && "text-muted-foreground",
                      isError && "text-destructive"
                    )}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-xs text-primary font-medium"
                    >
                      Processing...
                    </motion.span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>

              {/* Status indicator */}
              {isActive && (
                <motion.div
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Error Message */}
      {status === 'error' && errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-destructive/10 border border-destructive/30"
        >
          <p className="text-sm text-destructive">{errorMessage}</p>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">
          {status === 'completed' 
            ? 'Analysis complete' 
            : `Step ${currentStepIndex + 1} of ${PIPELINE_STEPS.length}`}
        </p>
      </div>
    </div>
  );
};
