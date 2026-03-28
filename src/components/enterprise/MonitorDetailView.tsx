import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, RefreshCw, Loader2, FileText, Clock, Tag, FileDown } from "lucide-react";
import PDFPreviewModal from "@/components/reports/pdf/PDFPreviewModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MONITOR_TYPE_META } from "@/hooks/useEnterpriseTrackers";
import type { EnterpriseTracker, MonitorType, MonitorParameters } from "@/hooks/useEnterpriseTrackers";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

interface MonitorDetailViewProps {
  tracker: EnterpriseTracker;
  onBack: () => void;
}

interface MonitorReport {
  id: string;
  report_content: string;
  citations: unknown[];
  model_used: string;
  processing_time_ms: number | null;
  created_at: string;
}

const PARAM_LABELS: Record<string, string> = {
  monitor_type: "Monitor Type",
  entity_type: "Entity Type",
  default_period: "Comparison Period",
  hypothesis: "Hypothesis",
  context_constraints: "Context & Constraints",
  existing_evidence: "Existing Evidence",
  entity_context: "Entity & Context",
  risk_data: "Risk Data",
  tracking_subject: "Tracking Subject",
  baseline_context: "Baseline & Context",
  historical_data: "Historical Data",
  country_region: "Country / Region",
  geopolitical_context: "Geopolitical Context",
  regulatory_notes: "Regulatory Notes",
  industry_scope: "Industry Scope",
  market_context: "Market Context",
  known_disruptors: "Known Disruptors",
  additional_context: "Additional Context",
};

const MonitorDetailView = ({ tracker, onBack }: MonitorDetailViewProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfReport, setPdfReport] = useState<MonitorReport | null>(null);

  const params = tracker.parameters as MonitorParameters;
  const monitorType = (params?.monitor_type ?? "DM-2") as MonitorType;
  const typeMeta = MONITOR_TYPE_META[monitorType];

  // Fetch last 3 reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["monitor_reports", tracker.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitor_reports" as any)
        .select("*")
        .eq("tracker_id", tracker.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return (data ?? []) as unknown as MonitorReport[];
    },
  });

  const handleUpdateNow = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("run-monitor-scan", {
        body: { tracker_id: tracker.id },
      });

      if (error) throw error;

      toast({
        title: "Report generated",
        description: "New monitoring report has been created successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["monitor_reports", tracker.id] });
    } catch (err: any) {
      toast({
        title: "Report generation failed",
        description: err.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter out internal/empty params
  const displayParams = Object.entries(params).filter(
    ([key, value]) => value && key !== "monitor_type" && key !== "default_period" && PARAM_LABELS[key]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-foreground truncate">{tracker.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px]">{monitorType}</Badge>
              <span className="text-xs text-muted-foreground">{typeMeta?.label}</span>
              {params.default_period && (
                <span className="text-xs text-muted-foreground">· {String(params.default_period)}</span>
              )}
            </div>
          </div>
        </div>
        <Button onClick={handleUpdateNow} disabled={isGenerating} className="gap-1.5 shrink-0">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Update Now
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Parameters (1/3) */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4" /> Monitor Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayParams.map(([key, value]) => (
              <div key={key}>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {PARAM_LABELS[key] || key}
                </p>
                <p className="text-sm text-foreground mt-0.5 leading-relaxed">
                  {String(value)}
                </p>
              </div>
            ))}
            <Separator />
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Status</p>
              <Badge variant="default" className="mt-1 capitalize">{tracker.status}</Badge>
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Created</p>
              <p className="text-sm text-foreground mt-0.5">
                {format(new Date(tracker.created_at), "MMM d, yyyy 'at' HH:mm")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right: Last 3 Reports (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" /> Latest Reports
          </h3>

          {reportsLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Loading reports…</CardContent></Card>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No reports yet. Click "Update Now" to generate your first monitoring report.</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(report.created_at), "MMM d, yyyy 'at' HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.processing_time_ms && (
                        <span className="text-[10px] text-muted-foreground">
                          {(report.processing_time_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px]">{report.model_used}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPdfReport(report);
                        }}
                        title="Export as PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer content={report.report_content} />
                  </div>
                  {Array.isArray(report.citations) && report.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Sources</p>
                      <div className="flex flex-wrap gap-1">
                        {(report.citations as string[]).map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline"
                          >
                            [{i + 1}]
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {pdfReport && (
        <PDFPreviewModal
          open={!!pdfReport}
          onOpenChange={(open) => !open && setPdfReport(null)}
          scenarioTitle={`${tracker.name} — ${monitorType} ${typeMeta?.label || "Report"}`}
          analysisResult={pdfReport.report_content}
          formData={{
            "Monitor Type": `${monitorType} — ${typeMeta?.label || ""}`,
            "Report Date": format(new Date(pdfReport.created_at), "MMM d, yyyy 'at' HH:mm"),
            "Model": pdfReport.model_used,
            ...(params.entity_type ? { "Entity Type": String(params.entity_type) } : {}),
            ...(params.default_period ? { "Comparison Period": String(params.default_period) } : {}),
          }}
          timestamp={pdfReport.created_at}
        />
      )}
    </div>
  );
};

export default MonitorDetailView;
