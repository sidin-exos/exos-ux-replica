/**
 * Self-running pipeline animation for the Welcome page pillar cards.
 * Shows a zoomed window that follows the active step, with smooth scrolling.
 */

import { useEffect, useState, useRef } from "react";
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
  { id: "input",       label: "Analysing user input",              icon: FileSearch,  duration: 2000 },
  { id: "constraints", label: "Fetching industry constraints",     icon: Building2,   duration: 1600 },
  { id: "practices",   label: "Applying best practices",           icon: BookOpen,    duration: 1700 },
  { id: "encrypt",     label: "Encrypting commercial data",        icon: Lock,        duration: 1300 },
  { id: "send",        label: "Sending to Cloud AI",               icon: Send,        duration: 1000 },
  { id: "process",     label: "AI agents processing",              icon: Cpu,         duration: 3200 },
  { id: "receive",     label: "Receiving analysis results",        icon: Download,    duration: 1300 },
  { id: "ground",      label: "Grounding & cross-validating",      icon: ShieldCheck, duration: 1800 },
  { id: "report",      label: "Generating report",                 icon: FileText,    duration: 1400 },
];

const VISIBLE_COUNT = 5; // how many steps visible at once

export function PipelinePreviewAnimation() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    setActiveIndex(0);
    setCompleted(new Set());

    const advance = () => {
      if (idx < STEPS.length - 1) {
        setCompleted((prev) => new Set([...prev, idx]));
        idx++;
        setActiveIndex(idx);
        timer = setTimeout(advance, STEPS[idx].duration);
      } else {
        // Pause, then restart
        timer = setTimeout(() => {
          idx = 0;
          setActiveIndex(0);
          setCompleted(new Set());
          timer = setTimeout(advance, STEPS[0].duration);
        }, 2800);
      }
    };

    timer = setTimeout(advance, STEPS[0].duration);
    return () => clearTimeout(timer);
  }, []);

  // Calculate vertical offset so active step stays roughly centered
  const stepHeight = 36; // approximate px per row
  const centerOffset = Math.floor(VISIBLE_COUNT / 2);
  const scrollIndex = Math.max(0, Math.min(activeIndex - centerOffset, STEPS.length - VISIBLE_COUNT));
  const translateY = -scrollIndex * stepHeight;

  return (
    <div className="w-full h-full flex flex-col justify-center px-6 py-5 overflow-hidden">
      {/* Viewport mask */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: VISIBLE_COUNT * stepHeight + 8 }}
      >
        {/* Fade edges */}
        <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-muted/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-muted/50 to-transparent z-10 pointer-events-none" />

        <motion.div
          animate={{ y: translateY }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeIndex;
            const isCompleted = completed.has(index);
            const isPending = index > activeIndex;

            return (
              <motion.div
                key={step.id}
                animate={{ opacity: isPending ? 0.3 : 1 }}
                transition={{ duration: 0.4 }}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all duration-500 ${
                  isActive
                    ? "bg-primary/15 border border-primary/30"
                    : isCompleted
                    ? "bg-muted/40"
                    : ""
                }`}
                style={{ height: stepHeight }}
              >
                <div
                  className={`relative w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
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
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <CheckCircle className="w-3 h-3" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        animate={{ scale: isActive ? [1, 1.12, 1] : 1 }}
                        transition={{ duration: 1.2, repeat: isActive ? Infinity : 0, repeatType: "reverse" }}
                      >
                        <Icon className="w-3 h-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                </div>

                <span
                  className={`text-[11px] font-medium transition-colors duration-500 ${
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
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-0.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/60"
          animate={{ width: `${((activeIndex + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
