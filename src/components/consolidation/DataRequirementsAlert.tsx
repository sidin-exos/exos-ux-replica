import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScenarioRequiredField } from "@/lib/scenarios";

interface DataRequirementsAlertProps {
  missingRequired: ScenarioRequiredField[];
  missingOptional: ScenarioRequiredField[];
  onFieldClick?: (fieldId: string) => void;
}

const DataRequirementsAlert = ({
  missingRequired,
  missingOptional,
  onFieldClick,
}: DataRequirementsAlertProps) => {
  const hasRequiredMissing = missingRequired.length > 0;
  const hasOptionalMissing = missingOptional.length > 0;

  if (!hasRequiredMissing && !hasOptionalMissing) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/10 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-success mt-0.5" />
          <div>
            <h4 className="font-semibold text-success">All Data Provided</h4>
            <p className="text-sm text-success/80 mt-1">
              You've provided all the required information. The analysis will have full accuracy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasRequiredMissing && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive">Required Information Missing</h4>
              <p className="text-sm text-destructive/80 mt-1 mb-3">
                Please provide the following information to proceed with the analysis:
              </p>
              <ul className="space-y-2">
                {missingRequired.map((field) => (
                  <li key={field.id} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                    <button
                      onClick={() => onFieldClick?.(field.id)}
                      className={cn(
                        "text-left text-sm hover:underline",
                        onFieldClick && "cursor-pointer"
                      )}
                    >
                      <span className="font-medium text-foreground">{field.label}</span>
                      <span className="text-muted-foreground"> — {field.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {hasOptionalMissing && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-warning mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-warning">Analysis Limitations</h4>
              <p className="text-sm text-warning/80 mt-1 mb-3">
                The following optional data is missing. The analysis will proceed, but recommendations 
                may be less precise in these areas:
              </p>
              <ul className="space-y-2">
                {missingOptional.map((field) => (
                  <li key={field.id} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0" />
                    <button
                      onClick={() => onFieldClick?.(field.id)}
                      className={cn(
                        "text-left text-sm hover:underline",
                        onFieldClick && "cursor-pointer"
                      )}
                    >
                      <span className="font-medium text-foreground">{field.label}</span>
                      <span className="text-muted-foreground"> — {field.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRequirementsAlert;
