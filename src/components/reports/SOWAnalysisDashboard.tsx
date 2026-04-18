import { FileText, CheckCircle2, AlertCircle, XCircle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SOWAnalysisData } from "@/lib/dashboard-data-parser";

interface SOWAnalysisDashboardProps {
  parsedData?: SOWAnalysisData;
}

const MAX_SCORE = 5;

const defaultSowAnalysis = {
  clarity: 3.5, // 5-star scale
  sections: [
    { name: "Scope Definition", status: "partial", note: "Vague deliverables in 3.2, 4.1" },
    { name: "Timeline & Milestones", status: "complete", note: "Clear schedule defined" },
    { name: "Payment Terms", status: "partial", note: "No milestone-based structure" },
    { name: "IP & Ownership", status: "complete", note: "Assignment clause present" },
    { name: "SLA & Performance", status: "missing", note: "No uptime guarantees" },
    { name: "Termination Rights", status: "missing", note: "Clause not found" },
  ],
  recommendations: [
    "Add specific deliverable acceptance criteria",
    "Include change order process",
    "Define dispute resolution mechanism",
  ],
};

const StarRating = ({ value, max }: { value: number; max: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`${value} of ${max}`}>
    {Array.from({ length: max }).map((_, i) => {
      const fill = Math.max(0, Math.min(1, value - i));
      return (
        <span key={i} className="relative inline-block w-3.5 h-3.5">
          <Star className="absolute inset-0 w-3.5 h-3.5 text-muted-foreground/30" />
          {fill > 0 && (
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="w-3.5 h-3.5 text-warning fill-warning" />
            </span>
          )}
        </span>
      );
    })}
  </div>
);

const SOWAnalysisDashboard = ({ parsedData }: SOWAnalysisDashboardProps) => {
  const sowAnalysis = parsedData
    ? { clarity: parsedData.clarity, sections: parsedData.sections, recommendations: parsedData.recommendations || [] }
    : defaultSowAnalysis;
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "partial":
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case "missing":
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "complete":
        return "Complete";
      case "partial":
        return "Needs Review";
      case "missing":
        return "Missing";
      default:
        return status;
    }
  };

  const completeCount = sowAnalysis.sections.filter(s => s.status === "complete").length;
  const totalCount = sowAnalysis.sections.length;

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <FileText className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <CardTitle className="font-display text-base">SOW Analysis</CardTitle>
            <p className="text-xs text-muted-foreground">Contract clause coverage review</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Clarity Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Document Clarity</span>
            <span className="text-sm font-medium text-foreground tabular-nums">{sowAnalysis.clarity.toFixed(1).replace(/\.0$/, "")}</span>
          </div>
          <div className="flex items-center gap-3">
            <StarRating value={sowAnalysis.clarity} max={MAX_SCORE} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {completeCount} of {totalCount} sections complete
          </p>
        </div>

        {/* Section Checklist */}
        <div className="space-y-2">
          {sowAnalysis.sections.map((section, index) => (
            <div
              key={index}
              className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
            >
              {getStatusIcon(section.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground">{section.name}</span>
                  <span className={`text-xs ${
                    section.status === "complete" ? "text-success" :
                    section.status === "partial" ? "text-warning" : "text-muted-foreground"
                  }`}>
                    {getStatusLabel(section.status)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{section.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">Recommendations</p>
          <ul className="space-y-1.5">
            {sowAnalysis.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SOWAnalysisDashboard;
