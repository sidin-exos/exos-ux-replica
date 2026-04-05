import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: 1 | 2;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-0">
        {/* Step 1 circle */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
            currentStep >= 1
              ? "bg-primary text-primary-foreground"
              : "border-2 border-muted-foreground/30 text-muted-foreground"
          )}
        >
          1
        </div>
        {/* Connector line */}
        <div
          className={cn(
            "w-16 h-0.5 transition-colors",
            currentStep >= 2 ? "bg-primary" : "bg-muted-foreground/20"
          )}
        />
        {/* Step 2 circle */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
            currentStep >= 2
              ? "bg-primary text-primary-foreground"
              : "border-2 border-muted-foreground/30 text-muted-foreground"
          )}
        >
          2
        </div>
      </div>
      <span className="text-[11px] uppercase tracking-widest text-primary font-medium">
        Step {currentStep} of 2
      </span>
    </div>
  );
};

export default StepIndicator;
