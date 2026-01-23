import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskAppetiteSelectorProps {
  value: "low" | "medium" | "high";
  onChange: (value: "low" | "medium" | "high") => void;
}

const options = [
  {
    value: "low" as const,
    label: "Conservative",
    description: "Multiple backup suppliers, lower savings",
    icon: ShieldCheck,
    color: "success",
  },
  {
    value: "medium" as const,
    label: "Balanced",
    description: "Cost savings with backup options",
    icon: Shield,
    color: "warning",
  },
  {
    value: "high" as const,
    label: "Aggressive",
    description: "Maximum savings, higher risk",
    icon: ShieldAlert,
    color: "destructive",
  },
];

const RiskAppetiteSelector = ({
  value,
  onChange,
}: RiskAppetiteSelectorProps) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-base font-semibold text-foreground">
          Risk Appetite
        </label>
        <p className="text-sm text-muted-foreground mt-1">
          How aggressively should we consolidate suppliers?
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

export default RiskAppetiteSelector;
