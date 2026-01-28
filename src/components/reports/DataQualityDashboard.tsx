import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const dataFields = [
  { field: "Supplier Spend Data", status: "complete", coverage: 100 },
  { field: "Contract Terms", status: "partial", coverage: 65 },
  { field: "Historical Pricing", status: "complete", coverage: 95 },
  { field: "Volume Forecasts", status: "missing", coverage: 0 },
  { field: "Quality Metrics", status: "partial", coverage: 40 },
  { field: "Lead Time Data", status: "complete", coverage: 88 },
];

const limitations = [
  { title: "Volume Forecast Missing", impact: "Savings estimates may be ±25% less accurate" },
  { title: "Incomplete Contract Terms", impact: "Exit cost analysis partially affected" },
];

const DataQualityDashboard = () => {
  const overallScore = Math.round(
    dataFields.reduce((acc, f) => acc + f.coverage, 0) / dataFields.length
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
      case "partial":
        return <AlertCircle className="w-3.5 h-3.5 text-warning" />;
      case "missing":
        return <XCircle className="w-3.5 h-3.5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Data Quality</CardTitle>
              <p className="text-xs text-muted-foreground">Analysis confidence</p>
            </div>
          </div>
          <span className="text-sm font-medium text-foreground">{overallScore}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Field Coverage */}
        <div className="space-y-2">
          {dataFields.map((field) => (
            <div key={field.field} className="flex items-center gap-2">
              {getStatusIcon(field.status)}
              <span className="text-sm text-foreground flex-1">{field.field}</span>
              <div className="w-16">
                <Progress value={field.coverage} className="h-1" />
              </div>
              <span className="text-xs text-muted-foreground w-7 text-right">{field.coverage}%</span>
            </div>
          ))}
        </div>

        {/* Limitations */}
        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-2">Analysis Limitations</p>
          <div className="space-y-2">
            {limitations.map((item, index) => (
              <div key={index} className="text-sm">
                <p className="text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">→ {item.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataQualityDashboard;
