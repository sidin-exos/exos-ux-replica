import { AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const dataFields = [
  { field: "Supplier Spend Data", status: "complete", coverage: 100 },
  { field: "Contract Terms", status: "partial", coverage: 65 },
  { field: "Historical Pricing", status: "complete", coverage: 95 },
  { field: "Volume Forecasts", status: "missing", coverage: 0 },
  { field: "Quality Metrics", status: "partial", coverage: 40 },
  { field: "Lead Time Data", status: "complete", coverage: 88 },
];

const analysisLimitations = [
  {
    severity: "high",
    title: "Volume Forecast Missing",
    description: "Cannot calculate projected savings or consolidation scenarios without demand data.",
    impact: "Savings estimates may be ±25% less accurate",
  },
  {
    severity: "medium",
    title: "Incomplete Contract Terms",
    description: "Missing termination clauses for 3 suppliers limits exit cost analysis.",
    impact: "Risk assessment partially affected",
  },
  {
    severity: "low",
    title: "Quality Metrics Sparse",
    description: "Only 40% of suppliers have quality data; using industry benchmarks for others.",
    impact: "Minor impact on supplier ranking",
  },
];

const DataQualityDashboard = () => {
  const overallScore = Math.round(
    dataFields.reduce((acc, f) => acc + f.coverage, 0) / dataFields.length
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "partial":
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case "missing":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-destructive/50 bg-destructive/10";
      case "medium":
        return "border-warning/50 bg-warning/10";
      case "low":
        return "border-muted bg-muted/20";
      default:
        return "border-border bg-secondary/50";
    }
  };

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Data Quality</CardTitle>
              <p className="text-sm text-muted-foreground">Analysis Confidence</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-warning">{overallScore}%</p>
            <p className="text-xs text-muted-foreground">Overall Score</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Data Field Coverage */}
        <div className="space-y-2">
          {dataFields.map((field) => (
            <div key={field.field} className="flex items-center gap-2">
              {getStatusIcon(field.status)}
              <span className="text-sm text-foreground flex-1 truncate">{field.field}</span>
              <div className="w-20">
                <Progress 
                  value={field.coverage} 
                  className={`h-1.5 ${
                    field.coverage === 100 ? "[&>div]:bg-success" : 
                    field.coverage > 50 ? "[&>div]:bg-warning" : 
                    "[&>div]:bg-destructive"
                  }`}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{field.coverage}%</span>
            </div>
          ))}
        </div>

        {/* Analysis Limitations */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Analysis Limitations
          </p>
          <div className="space-y-2">
            {analysisLimitations.map((limitation, index) => (
              <div
                key={index}
                className={`p-2 rounded border ${getSeverityColor(limitation.severity)}`}
              >
                <div className="flex items-start gap-2">
                  <Badge
                    variant={
                      limitation.severity === "high"
                        ? "destructive"
                        : limitation.severity === "medium"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {limitation.severity.toUpperCase()}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{limitation.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{limitation.description}</p>
                    <p className="text-xs text-warning/80 mt-1 italic">→ {limitation.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataQualityDashboard;
