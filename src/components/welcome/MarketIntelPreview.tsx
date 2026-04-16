import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, TrendingUp, BarChart3, Scale, GitMerge, AlertTriangle, Search } from "lucide-react";

const TYPES = [
  { icon: FileText, label: "Supplier News" },
  { icon: TrendingUp, label: "Commodity Watch" },
  { icon: BarChart3, label: "Industry Trends" },
  { icon: Scale, label: "Regulatory" },
  { icon: GitMerge, label: "M&A Activity" },
  { icon: AlertTriangle, label: "Risk Signals" },
];

/* Two demo sequences: pick a type, then type a title */
const SEQUENCES = [
  { typeIndex: 0, title: "Q2 Supplier Risk Assessment" },
  { typeIndex: 2, title: "APAC Semiconductor Outlook" },
];

const TYPE_CHAR_MS = 55;
const PAUSE_BEFORE_TYPE = 800;
const PAUSE_AFTER_DONE = 3200;
const PAUSE_CLEAR = 600;

export const MarketIntelPreview = () => {
  const [seqIdx, setSeqIdx] = useState(0);
  const [activeType, setActiveType] = useState<number | null>(null);
  const [typedText, setTypedText] = useState("");
  const [phase, setPhase] = useState<"idle" | "selectType" | "typing" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Start first sequence
    timer.current = setTimeout(() => setPhase("selectType"), 600);
    return () => clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const seq = SEQUENCES[seqIdx];
    if (phase === "selectType") {
      setTypedText("");
      timer.current = setTimeout(() => {
        setActiveType(seq.typeIndex);
        timer.current = setTimeout(() => setPhase("typing"), PAUSE_BEFORE_TYPE);
      }, 400);
    } else if (phase === "typing") {
      const title = seq.title;
      let i = 0;
      const tick = () => {
        i++;
        setTypedText(title.slice(0, i));
        if (i < title.length) {
          timer.current = setTimeout(tick, TYPE_CHAR_MS);
        } else {
          timer.current = setTimeout(() => setPhase("done"), PAUSE_AFTER_DONE);
        }
      };
      timer.current = setTimeout(tick, TYPE_CHAR_MS);
    } else if (phase === "done") {
      timer.current = setTimeout(() => {
        setActiveType(null);
        setTypedText("");
        const next = (seqIdx + 1) % SEQUENCES.length;
        setSeqIdx(next);
        timer.current = setTimeout(() => setPhase("selectType"), PAUSE_CLEAR);
      }, PAUSE_CLEAR);
    }
    return () => clearTimeout(timer.current);
  }, [phase, seqIdx]);

  return (
    <div className="w-full h-full flex items-center justify-center p-3 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full rounded-lg border border-border/60 bg-card/80 shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-foreground text-xs">Intelligence Query</span>
          </div>
          <p className="text-muted-foreground text-[0.6rem] leading-tight">
            Search for real-time market intelligence powered by AI
          </p>
        </div>

        {/* Type grid */}
        <div className="px-4 pb-2.5">
          <p className="text-[0.6rem] text-muted-foreground mb-2 font-medium">Intelligence Type</p>
          <div className="grid grid-cols-3 gap-1.5">
            {TYPES.map((t, idx) => {
              const Icon = t.icon;
              const isActive = activeType === idx;
              return (
                <motion.div
                  key={t.label}
                  animate={{
                    borderColor: isActive ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border) / 0.4)",
                    backgroundColor: isActive ? "hsl(var(--primary) / 0.05)" : "hsl(var(--muted) / 0.3)",
                  }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-1 rounded-md border px-2 py-1.5"
                >
                  <Icon className={`w-3 h-3 shrink-0 transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`truncate text-[0.55rem] font-medium transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {t.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Report title with typing animation */}
        <div className="px-4 pb-4">
          <p className="text-[0.6rem] text-muted-foreground mb-1.5 font-medium">Report Title</p>
          <div className="h-6 rounded border border-border/40 bg-muted/20 flex items-center px-2.5 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {typedText ? (
                <motion.span
                  key="typed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[0.55rem] text-foreground font-medium"
                >
                  {typedText}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="inline-block w-px h-3 bg-primary ml-0.5 align-middle"
                  />
                </motion.span>
              ) : (
                <motion.span
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="text-[0.55rem] text-muted-foreground italic"
                >
                  e.g., Q2 Supplier Risk Assessment
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
