import { Shield, ShieldAlert, ShieldCheck, Zap, Target, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StrategyType = "conservative" | "balanced" | "aggressive";

export interface StrategyOption {
  value: StrategyType;
  label: string;
  description: string;
  icon: LucideIcon;
  color: "success" | "warning" | "destructive";
}

interface StrategySelectorProps {
  value: StrategyType;
  onChange: (value: StrategyType) => void;
  title: string;
  description: string;
  options?: StrategyOption[];
}

const defaultOptions: StrategyOption[] = [
  {
    value: "conservative",
    label: "Conservative",
    description: "Lower risk, thorough validation",
    icon: ShieldCheck,
    color: "success",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Optimal risk-reward tradeoff",
    icon: Shield,
    color: "warning",
  },
  {
    value: "aggressive",
    label: "Aggressive",
    description: "Maximum speed or savings",
    icon: ShieldAlert,
    color: "destructive",
  },
];

// Preset configurations for common strategy types
export const strategyPresets = {
  riskAppetite: {
    title: "Risk Appetite",
    description: "How aggressively should we optimize?",
    options: defaultOptions,
  },
  speedVsQuality: {
    title: "Speed vs Quality",
    description: "Prioritize faster delivery or thorough validation?",
    options: [
      {
        value: "conservative" as const,
        label: "Quality First",
        description: "Thorough validation, multiple reviews",
        icon: Target,
        color: "success" as const,
      },
      {
        value: "balanced" as const,
        label: "Balanced",
        description: "Good quality with reasonable timeline",
        icon: Shield,
        color: "warning" as const,
      },
      {
        value: "aggressive" as const,
        label: "Speed First",
        description: "Fastest path, accept some risk",
        icon: Zap,
        color: "destructive" as const,
      },
    ],
  },
  costVsRisk: {
    title: "Cost vs Risk Tolerance",
    description: "Prioritize cost savings or risk mitigation?",
    options: [
      {
        value: "conservative" as const,
        label: "Risk Averse",
        description: "Minimize risk, accept higher costs",
        icon: ShieldCheck,
        color: "success" as const,
      },
      {
        value: "balanced" as const,
        label: "Balanced",
        description: "Optimize cost with acceptable risk",
        icon: Shield,
        color: "warning" as const,
      },
      {
        value: "aggressive" as const,
        label: "Cost Focused",
        description: "Maximum savings, higher risk",
        icon: Zap,
        color: "destructive" as const,
      },
    ],
  },
  skepticism: {
    title: "Approach Style",
    description: "How should we balance proven methods vs. new approaches?",
    options: [
      {
        value: "conservative" as const,
        label: "Skeptical",
        description: "Proven methods, challenge assumptions",
        icon: ShieldCheck,
        color: "success" as const,
      },
      {
        value: "balanced" as const,
        label: "Pragmatic",
        description: "Best practices with openness to new ideas",
        icon: Shield,
        color: "warning" as const,
      },
      {
        value: "aggressive" as const,
        label: "Innovative",
        description: "Explore unconventional strategies",
        icon: Zap,
        color: "destructive" as const,
      },
    ],
  },
};

const StrategySelector = ({
  value,
  onChange,
  title,
  description,
  options = defaultOptions,
}: StrategySelectorProps) => {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          {title}
        </label>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "relative p-2.5 rounded-lg text-left transition-all duration-200",
                "border border-border/50 hover:border-primary/30",
                isSelected && "border-primary/60 bg-primary/5"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center mb-1.5 transition-colors",
                  isSelected
                    ? option.color === "success"
                      ? "bg-success/15"
                      : option.color === "warning"
                      ? "bg-warning/15"
                      : "bg-destructive/15"
                    : "bg-secondary/50"
                )}
              >
                <Icon
                  className={cn(
                    "w-3.5 h-3.5",
                    option.color === "success"
                      ? "text-success"
                      : option.color === "warning"
                      ? "text-warning"
                      : "text-destructive"
                  )}
                />
              </div>

              <h4 className="font-medium text-xs text-foreground mb-0.5">
                {option.label}
              </h4>
              <p className="text-[10px] text-muted-foreground/70 leading-tight">
                {option.description}
              </p>

              {isSelected && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StrategySelector;
