import { BrainCircuit, ArrowLeft, FileText, RotateCcw, CheckCircle2, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DeepAnalysisResultProps {
  result: {
    finalAnswer: string;
    confidenceScore: number;
    validationStatus: 'pending' | 'approved' | 'rejected';
    retryCount: number;
  };
  onStartOver: () => void;
  onGenerateReport: () => void;
}

export const DeepAnalysisResult = ({
  result,
  onStartOver,
  onGenerateReport,
}: DeepAnalysisResultProps) => {
  const { finalAnswer, confidenceScore, validationStatus, retryCount } = result;

  // Confidence color based on score
  const getConfidenceColor = (score: number) => {
    if (score >= 70) return "bg-success/20 text-success border-success/30";
    if (score >= 50) return "bg-warning/20 text-warning border-warning/30";
    return "bg-destructive/20 text-destructive border-destructive/30";
  };

  // Validation status styling
  const getValidationStyle = (status: typeof validationStatus) => {
    switch (status) {
      case 'approved':
        return { className: "bg-success/20 text-success border-success/30", icon: CheckCircle2 };
      case 'rejected':
        return { className: "bg-destructive/20 text-destructive border-destructive/30", icon: XCircle };
      default:
        return { className: "bg-muted text-muted-foreground", icon: Info };
    }
  };

  const validationStyle = getValidationStyle(validationStatus);
  const ValidationIcon = validationStyle.icon;

  return (
    <div className="space-y-6">
      {/* Main Result Card with Gradient Border */}
      <div className="relative rounded-xl p-[2px] bg-gradient-to-br from-iris via-accent to-primary">
        <div className="rounded-[10px] bg-card p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-iris/20 to-accent/20 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-iris" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">
                Deep Reasoning Engine Output
              </h3>
              <p className="text-xs text-muted-foreground">
                Autonomous multi-step analysis with validation
              </p>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap gap-2">
            {/* Confidence Score */}
            <Badge
              variant="outline"
              className={cn("gap-1.5", getConfidenceColor(confidenceScore))}
            >
              {Math.round(confidenceScore)}% Confidence
            </Badge>

            {/* Validation Status */}
            <Badge
              variant="outline"
              className={cn("gap-1.5", validationStyle.className)}
            >
              <ValidationIcon className="w-3 h-3" />
              {validationStatus === 'approved' ? 'Validated' : validationStatus === 'rejected' ? 'Rejected' : 'Pending'}
            </Badge>

            {/* Retry Count (only if > 0) */}
            {retryCount > 0 && (
              <Badge variant="outline" className="gap-1.5">
                <RotateCcw className="w-3 h-3" />
                {retryCount} {retryCount === 1 ? 'Retry' : 'Retries'}
              </Badge>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="h-[400px] rounded-lg border border-border bg-background p-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground">
                {finalAnswer}
              </div>
            </div>
          </ScrollArea>

          {/* Footer Disclaimer */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <Info className="w-3.5 h-3.5" />
            <span>Generated via EXOS Autonomous Graph with LangGraph architecture</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="lg"
          onClick={onStartOver}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Start Over
        </Button>
        <Button
          variant="hero"
          size="lg"
          onClick={onGenerateReport}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Generate Report
        </Button>
      </div>
    </div>
  );
};
