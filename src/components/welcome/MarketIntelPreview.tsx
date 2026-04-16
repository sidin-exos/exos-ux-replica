import { motion } from "framer-motion";
import { FileText, TrendingUp, BarChart3, Scale, GitMerge, AlertTriangle, Search } from "lucide-react";

const TYPES = [
  { icon: FileText, label: "Supplier News", active: true },
  { icon: TrendingUp, label: "Commodity Watch", active: false },
  { icon: BarChart3, label: "Industry Trends", active: false },
  { icon: Scale, label: "Regulatory", active: false },
  { icon: GitMerge, label: "M&A Activity", active: false },
  { icon: AlertTriangle, label: "Risk Signals", active: false },
];

export const MarketIntelPreview = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[320px] rounded-lg border border-border/60 bg-card/80 shadow-sm overflow-hidden"
        style={{ fontSize: "0.65rem" }}
      >
        {/* Header */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Search className="w-3 h-3 text-primary" />
            <span className="font-semibold text-foreground text-[0.7rem]">Intelligence Query</span>
          </div>
          <p className="text-muted-foreground text-[0.55rem] leading-tight">
            Search for real-time market intelligence powered by AI
          </p>
        </div>

        {/* Type grid */}
        <div className="px-3 pb-2">
          <p className="text-[0.55rem] text-muted-foreground mb-1.5 font-medium">Intelligence Type</p>
          <div className="grid grid-cols-3 gap-1">
            {TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  className={`flex items-center gap-1 rounded-md border px-1.5 py-1 transition-colors ${
                    t.active
                      ? "border-primary/50 bg-primary/5 text-primary"
                      : "border-border/40 bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <Icon className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate text-[0.5rem] font-medium">{t.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report title placeholder */}
        <div className="px-3 pb-3">
          <p className="text-[0.55rem] text-muted-foreground mb-1 font-medium">Report Title</p>
          <div className="h-5 rounded border border-border/40 bg-muted/20 flex items-center px-2">
            <span className="text-[0.5rem] text-muted-foreground/60 italic">e.g., Q2 Supplier Risk Assessment</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
