/**
 * Animated Pipeline Progress Component
 * 
 * Shows the EXOS Sentinel pipeline steps with animated progression
 * during AI analysis processing.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch,
  Building2,
  BookOpen,
  Lock,
  Send,
  Cpu,
  Download,
  ShieldCheck,
  FileText,
  CheckCircle,
} from "lucide-react";

interface PipelineStep {
  id: string;
  label: string;
  icon: typeof FileSearch;
  duration: number; // milliseconds to show this step
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "analyzing-input",
    label: "Analysing user input",
    icon: FileSearch,
    duration: 1200,
  },
  {
    id: "fetching-constraints",
    label: "Fetching industry constraints",
    icon: Building2,
    duration: 1000,
  },
  {
    id: "best-practices",
    label: "Analysing best practices",
    icon: BookOpen,
    duration: 1100,
  },
  {
    id: "encrypting",
    label: "Encrypting commercial information",
    icon: Lock,
    duration: 800,
  },
  {
    id: "sending-api",
    label: "Sending to external API",
    icon: Send,
    duration: 600,
  },
  {
    id: "api-processing",
    label: "External API processing",
    icon: Cpu,
    duration: 8000, // Longest step - actual AI inference
  },
  {
    id: "receiving-results",
    label: "Receiving analysis results",
    icon: Download,
    duration: 800,
  },
  {
    id: "grounding",
    label: "Grounding and cross-validating",
    icon: ShieldCheck,
    duration: 1200,
  },
  {
    id: "generating-report",
    label: "Generating report",
    icon: FileText,
    duration: 1000,
  },
];

interface AnalysisPipelineAnimationProps {
  isProcessing: boolean;
  currentApiStage?: string | null;
}

export function AnalysisPipelineAnimation({
  isProcessing,
  currentApiStage,
}: AnalysisPipelineAnimationProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Animate through steps while processing
  useEffect(() => {
    if (!isProcessing) {
      setActiveStepIndex(0);
      setCompletedSteps(new Set());
      return;
    }

    // Start from beginning when processing starts
    setActiveStepIndex(0);
    setCompletedSteps(new Set());

    let currentIndex = 0;
    const timers: NodeJS.Timeout[] = [];

    const advanceStep = () => {
      if (currentIndex < PIPELINE_STEPS.length - 1) {
        setCompletedSteps((prev) => new Set([...prev, currentIndex]));
        currentIndex++;
        setActiveStepIndex(currentIndex);

        // Schedule next step
        const nextDuration = PIPELINE_STEPS[currentIndex].duration;
        const timer = setTimeout(advanceStep, nextDuration);
        timers.push(timer);
      }
    };

    // Start first step, then advance
    const initialTimer = setTimeout(advanceStep, PIPELINE_STEPS[0].duration);
    timers.push(initialTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isProcessing]);

  // Map API stage to our visual steps for highlighting
  useEffect(() => {
    if (!currentApiStage) return;

    const stageMapping: Record<string, number> = {
      anonymization: 3, // encrypting
      grounding: 7, // grounding
      cloud_inference: 5, // api-processing
      validation: 7, // grounding
      deanonymization: 8, // generating-report
    };

    const mappedIndex = stageMapping[currentApiStage];
    if (mappedIndex !== undefined && mappedIndex > activeStepIndex) {
      // Mark previous steps as completed
      const newCompleted = new Set(completedSteps);
      for (let i = 0; i < mappedIndex; i++) {
        newCompleted.add(i);
      }
      setCompletedSteps(newCompleted);
      setActiveStepIndex(mappedIndex);
    }
  }, [currentApiStage]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-2">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeStepIndex;
          const isCompleted = completedSteps.has(index);
          const isPending = index > activeStepIndex;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: isPending ? 0.4 : 1,
                x: 0,
              }}
              transition={{
                delay: index * 0.05,
                duration: 0.3,
              }}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300 ${
                isActive
                  ? "bg-primary/15 border border-primary/30"
                  : isCompleted
                  ? "bg-muted/50"
                  : "bg-transparent"
              }`}
            >
              {/* Icon container */}
              <div
                className={`relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="icon"
                      initial={{ scale: 0.8 }}
                      animate={{
                        scale: isActive ? [1, 1.1, 1] : 1,
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: isActive ? Infinity : 0,
                        repeatType: "reverse",
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active pulse ring */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-sm font-medium transition-colors duration-300 ${
                  isActive
                    ? "text-foreground"
                    : isCompleted
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60"
                }`}
              >
                {step.label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  className="ml-auto flex gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar at bottom */}
      <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/60"
          initial={{ width: "0%" }}
          animate={{
            width: `${((activeStepIndex + 1) / PIPELINE_STEPS.length) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
