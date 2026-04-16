/**
 * Self-running pipeline animation for the Welcome page pillar cards.
 * Loops continuously to showcase the EXOS analysis pipeline visually.
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

const STEPS = [
  { id: "input",       label: "Analysing user input",              icon: FileSearch,  duration: 1400 },
  { id: "constraints", label: "Fetching industry constraints",     icon: Building2,   duration: 1100 },
  { id: "practices",   label: "Applying best practices",           icon: BookOpen,    duration: 1200 },
  { id: "encrypt",     label: "Encrypting commercial data",        icon: Lock,        duration: 900 },
  { id: "send",        label: "Sending to Cloud AI",               icon: Send,        duration: 700 },
  { id: "process",     label: "AI agents processing",              icon: Cpu,         duration: 2200 },
  { id: "receive",     label: "Receiving analysis results",        icon: Download,    duration: 900 },
  { id: "ground",      label: "Grounding & cross-validating",      icon: ShieldCheck, duration: 1300 },
  { id: "report",      label: "Generating report",                 icon: FileText,    duration: 1000 },
];

export function PipelinePreviewAnimation() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    let idx = 0;
    setActiveIndex(0);
    setCompleted(new Set());

    const advance = () => {
      if (idx < STEPS.length - 1) {
        setCompleted((prev) => new Set([...prev, idx]));
        idx++;
        setActiveIndex(idx);
        timer = setTimeout(advance, STEPS[idx].duration);
      } else {
        // Pause on last step, then restart
        timer = setTimeout(() => {
          idx = 0;
          setActiveIndex(0);
          setCompleted(new Set());
          timer = setTimeout(advance, STEPS[0].duration);
        }, 2000);
      }
    };

    let timer = setTimeout(advance, STEPS[0].duration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-center px-6 py-5">
      <div className="space-y-1">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeIndex;
          const isCompleted = completed.has(index);
          const isPending = index > activeIndex;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all duration-300 ${
                isActive
                  ? "bg-primary/15 border border-primary/30"
                  : isCompleted
                  ? "bg-muted/40"
                  : ""
              }`}
            >
              <div
                className={`relative w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
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
                      <CheckCircle className="w-3 h-3" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="icon"
                      animate={{ scale: isActive ? [1, 1.15, 1] : 1 }}
                      transition={{ duration: 0.8, repeat: isActive ? Infinity : 0, repeatType: "reverse" }}
                    >
                      <Icon className="w-3 h-3" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </div>

              <span
                className={`text-[11px] font-medium transition-colors duration-300 ${
                  isActive ? "text-foreground" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/50"
                }`}
              >
                {step.label}
              </span>

              {isActive && (
                <motion.div className="ml-auto flex gap-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full bg-primary"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-0.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/60"
          animate={{ width: `${((activeIndex + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
