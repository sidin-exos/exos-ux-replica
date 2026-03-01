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
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Risk Appetite
        </label>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          How aggressively should we consolidate suppliers?
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

export default RiskAppetiteSelector;
