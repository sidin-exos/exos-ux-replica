import { AlertCircle, CheckCircle2, XCircle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataQualityData } from "@/lib/dashboard-data-parser";

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

interface DataQualityDashboardProps {
  parsedData?: DataQualityData;
}

const MAX_SCORE = 5;

// Coverage stored as 0–5 in 0.5 steps
const defaultDataFields = [
  { field: "Supplier Spend Data", status: "complete", coverage: 5 },
  { field: "Contract Terms", status: "partial", coverage: 3 },
  { field: "Historical Pricing", status: "complete", coverage: 4.5 },
  { field: "Volume Forecasts", status: "missing", coverage: 0 },
  { field: "Quality Metrics", status: "partial", coverage: 2 },
  { field: "Lead Time Data", status: "complete", coverage: 4.5 },
];

// Round any incoming value to nearest 0.5 and clamp to 0–5
const toFiveScale = (v: number): number => {
  // Heuristic: if value looks like a percentage (>5), convert to /5
  const scaled = v > MAX_SCORE ? (v / 100) * MAX_SCORE : v;
  const rounded = Math.round(scaled * 2) / 2;
  return Math.max(0, Math.min(MAX_SCORE, rounded));
};

const formatScore = (v: number): string => v.toFixed(1).replace(/\.0$/, "");

const defaultLimitations = [
  { title: "Volume Forecast Missing", impact: "Savings estimates may be ±25% less accurate" },
  { title: "Incomplete Contract Terms", impact: "Exit cost analysis partially affected" },
];

const DataQualityDashboard = ({ parsedData }: DataQualityDashboardProps) => {
  const dataFields = parsedData?.fields || defaultDataFields;
  const limitations = parsedData?.limitations || defaultLimitations;


  const normalizedFields = dataFields.map((f) => ({ ...f, coverage: toFiveScale(f.coverage) }));

  const overallScore =
    Math.round((normalizedFields.reduce((acc, f) => acc + f.coverage, 0) / normalizedFields.length) * 2) / 2;

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
          <span className="text-sm font-medium text-foreground tabular-nums">
            {formatScore(overallScore)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Field Coverage */}
        <div className="space-y-2">
          {normalizedFields.map((field) => (
            <div key={field.field} className="flex items-center gap-2">
              {getStatusIcon(field.status)}
              <span className="text-sm text-foreground flex-1">{field.field}</span>
              <StarRating value={field.coverage} max={MAX_SCORE} />
              <span className="text-xs text-muted-foreground w-7 text-right tabular-nums">
                {formatScore(field.coverage)}
              </span>
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
