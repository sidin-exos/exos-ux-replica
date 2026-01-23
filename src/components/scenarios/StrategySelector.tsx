import { Shield, ShieldAlert, ShieldCheck, Zap, Clock, Target, LucideIcon } from "lucide-react";
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
  thoroughness: {
    title: "Analysis Depth",
    description: "How comprehensive should the analysis be?",
    options: [
      {
        value: "conservative" as const,
        label: "Comprehensive",
        description: "Deep analysis, all factors considered",
        icon: Target,
        color: "success" as const,
      },
      {
        value: "balanced" as const,
        label: "Standard",
        description: "Key factors with reasonable depth",
        icon: Shield,
        color: "warning" as const,
      },
      {
        value: "aggressive" as const,
        label: "Quick Scan",
        description: "High-level overview, fast results",
        icon: Clock,
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
    <div className="space-y-3">
      <div>
        <label className="text-base font-semibold text-foreground">
          {title}
        </label>
        <p className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "relative p-4 rounded-xl text-left transition-all duration-300",
                "card-elevated hover:border-primary/50",
                isSelected && "border-primary glow-effect"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                  isSelected
                    ? option.color === "success"
                      ? "bg-success/20"
                      : option.color === "warning"
                      ? "bg-warning/20"
                      : "bg-destructive/20"
                    : "bg-secondary"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    option.color === "success"
                      ? "text-success"
                      : option.color === "warning"
                      ? "text-warning"
                      : "text-destructive"
                  )}
                />
              </div>

              <h4 className="font-semibold text-foreground mb-1">
                {option.label}
              </h4>
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>

              {isSelected && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StrategySelector;
