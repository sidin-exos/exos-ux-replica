import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Download,
  Share2,
  CheckCircle2,
  Calendar,
  Building2,
  Target,
  BarChart3,
  Loader2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import DashboardRenderer, { dashboardHasRealData } from "@/components/reports/DashboardRenderer";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import ReportFeedback from "@/components/feedback/ReportFeedback";
import { DashboardType, dashboardConfigs } from "@/lib/dashboard-mappings";
import { useShareableReport } from "@/hooks/useShareableReport";
import { stripDashboardData } from "@/lib/dashboard-data-parser";

interface ReportState {
  scenarioTitle: string;
  scenarioId?: string;
  analysisResult: string;
  structuredData?: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
  evaluationScore?: number | null;
  evaluationConfidence?: string | null;
  coverageStars?: number | null;
}

const GeneratedReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locationState = location.state as ReportState | null;
  
  const shareId = searchParams.get("share");
  const { loadSharedReport, isLoading: isLoadingShare } = useShareableReport();
  
  const [sharedData, setSharedData] = useState<ReportState | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isSharedView, setIsSharedView] = useState(false);

  // Load shared report if share ID is present
  useEffect(() => {
    if (shareId && !locationState) {
      setIsSharedView(true);
      loadSharedReport(shareId).then((data) => {
        if (data) {
          setSharedData(data);
        } else {
          setShareError("This shared report has expired or doesn't exist.");
        }
      });
    }
  }, [shareId, locationState, loadSharedReport]);

  // Use shared data or location state
  const state = sharedData || locationState;

  // Loading state for shared reports
  if (isSharedView && isLoadingShare && !sharedData) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Loading Shared Report</h1>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  // Error state for shared reports
  if (shareError) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
          <p className="text-muted-foreground mb-6">{shareError}</p>
          <Button onClick={() => navigate("/")} variant="hero">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Redirect if no state
  if (!state) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Report Data</h1>
          <p className="text-muted-foreground mb-6">
            Please complete an analysis first to generate a report.
          </p>
          <Button onClick={() => navigate("/")} variant="hero">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { scenarioTitle, scenarioId, analysisResult, structuredData, formData, timestamp, selectedDashboards = [], evaluationScore, evaluationConfidence, coverageStars } = state;
  
  // Ensure analysisResult is never null for rendering
  const safeAnalysisResult = analysisResult ?? '';
  // Strip <dashboard-data> block from displayed text (keep it in safeAnalysisResult for DashboardRenderer)
  const displayAnalysis = stripDashboardData(safeAnalysisResult);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Clean markdown formatting from text
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*\*/g, '') // Remove triple stars
      .replace(/\*\*/g, '')   // Remove double stars (bold)
      .replace(/^\s*\*\s+/gm, '') // Remove bullet points (* at start of line)
      .replace(/^#{1,4}\s*/gm, '') // Remove hash headers
      .trim();
  };

  // Mirror supabase/functions/generate-pdf/pdf-document.tsx so the on-screen
  // Executive Summary matches the exported PDF exactly.
  const INSTRUCTION_PREFIX_RE = /^\s*[-•*]?\s*(supply|provide|specify|enter|input|complete|fill in|add|please|to enable|to allow|to support|to strengthen)\b/i;
  const isInstructionLine = (line: string) => INSTRUCTION_PREFIX_RE.test(line) || /\(e\.g\.,/i.test(line);
  const isPlaybookPhase = (line: string) => /^\s*phase\s+\d+\s*[—\-:]\s*(detect|activate|contain|recover|learn)/i.test(line);
  const isTableLine = (line: string) => /^\s*\|.*\|\s*$/.test(line) || /^\s*[-:|\s]+$/.test(line);
  const looksLikeFinding = (line: string): boolean => {
    if (!line || line.length < 15) return false;
    if (isInstructionLine(line) || isPlaybookPhase(line) || isTableLine(line)) return false;
    return true;
  };

  const extractEnvelopeSummary = (raw?: string): { findings: string[]; recommendations: string[] } => {
    if (!raw) return { findings: [], recommendations: [] };
    let env: any;
    try { env = JSON.parse(raw); } catch { return { findings: [], recommendations: [] }; }
    if (!env || typeof env !== 'object') return { findings: [], recommendations: [] };

    const findings: string[] = [];
    const recommendations: string[] = [];

    const exec = env.executive_summary ?? env.payload?.executive_summary ?? {};
    const headline = exec.headline ?? exec.summary ?? env.headline;
    if (typeof headline === 'string' && headline.trim() && looksLikeFinding(headline)) {
      findings.push(headline.trim());
    }
    const findingsArr = exec.key_findings ?? env.key_findings ?? exec.findings ?? [];
    if (Array.isArray(findingsArr)) {
      for (const f of findingsArr) {
        const t = typeof f === 'string' ? f : (f?.finding ?? f?.text ?? f?.title ?? '');
        const s = String(t).trim();
        if (s && looksLikeFinding(s)) findings.push(s);
        if (findings.length >= 3) break;
      }
    }

    const recsArr = env.recommendations ?? env.payload?.recommendations ?? exec.recommendations ?? [];
    if (Array.isArray(recsArr)) {
      for (const r of recsArr) {
        let t: string;
        if (typeof r === 'string') t = r;
        else {
          const action = r?.action ?? r?.recommendation ?? r?.text ?? r?.title ?? '';
          const priority = r?.priority ? `[${String(r.priority)}] ` : '';
          const rationaleRaw = r?.rationale ?? r?.benefit ?? r?.expected_value ?? '';
          const rationaleStr = String(rationaleRaw ?? '').trim();
          const rationale = /^\d[\d,. ]*$/.test(rationaleStr) ? '' : rationaleStr;
          t = `${priority}${action}${rationale ? ` — ${rationale}` : ''}`;
        }
        const s = String(t).trim().replace(/\s+—\s+\d[\d,. ]*\s*$/, '');
        if (s && looksLikeFinding(s)) recommendations.push(s);
        if (recommendations.length >= 4) break;
      }
    }

    return { findings, recommendations };
  };

  const extractProseSummary = (text: string): { findings: string[]; recommendations: string[] } => {
    const lines = text.split('\n').map(cleanMarkdown).filter((l) => looksLikeFinding(l));
    const findingPattern = /(\$|€|%|found|indicates?|presents?|analysis|current(ly)?|total|average|estimated|reveals?|shows?)/i;
    const recommendPattern = /\b(target|aim to|recommend|should|negotiate|consider|implement|prioritize|pursue|establish|ensure|leverage|explore)\b/i;
    const findings: string[] = [];
    const recommendations: string[] = [];
    for (const line of lines) {
      if (recommendations.length < 4 && recommendPattern.test(line)) recommendations.push(line);
      else if (findings.length < 3 && findingPattern.test(line)) findings.push(line);
      if (findings.length >= 3 && recommendations.length >= 4) break;
    }
    if (findings.length === 0 || recommendations.length === 0) {
      const pool = lines.slice(0, 7);
      const mid = Math.ceil(pool.length / 2);
      if (findings.length === 0) findings.push(...pool.slice(0, mid).slice(0, 3));
      if (recommendations.length === 0) recommendations.push(...pool.slice(mid).slice(0, 4));
    }
    return { findings, recommendations };
  };

  const envelopeSummary = extractEnvelopeSummary(structuredData);
  const proseSummary = extractProseSummary(displayAnalysis);
  const summaryFindings = envelopeSummary.findings.length > 0 ? envelopeSummary.findings : proseSummary.findings;
  const summaryRecommendations = envelopeSummary.recommendations.length > 0 ? envelopeSummary.recommendations : proseSummary.recommendations;

  return (
    <div className="min-h-screen gradient-hero">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      <Header />

      <main className="container py-8 relative">
        {/* Back + Refine actions */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analysis
          </button>
          {!isSharedView && scenarioId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/analyse/${scenarioId}`)}
              className="gap-2"
              title="Open the wizard with your previous inputs preserved so you can refine them and re-run the analysis."
            >
              <Pencil className="w-4 h-4" />
              Refine inputs &amp; re-run
            </Button>
          )}
        </div>

        {/* Report Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">AI-Generated Report</Badge>
                    {isSharedView && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        Shared View
                      </Badge>
                    )}
                  </div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold">
                    <span className="text-gradient">{scenarioTitle}</span> Analysis Report
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(timestamp)}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  EXOS Procurement AI
                </span>
              </div>
            </div>

            {/* Export Actions */}
            <ReportExportButtons
              scenarioTitle={scenarioTitle}
              analysisResult={safeAnalysisResult}
              structuredData={structuredData}
              formData={formData}
              timestamp={timestamp}
              selectedDashboards={selectedDashboards}
              evaluationScore={evaluationScore}
              evaluationConfidence={evaluationConfidence}
              coverageStars={coverageStars}
            />
          </div>
        </motion.div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Report Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Executive Summary */}
            <Card className="card-elevated border-t-2 border-t-primary/60">
              <CardHeader className="bg-gradient-to-r from-transparent via-transparent to-primary/[0.03] dark:to-primary/10 rounded-t-lg">
                <CardTitle className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {summaryFindings.length > 0 && (
                  <div>
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Key Findings
                    </h3>
                    <ul className="space-y-3">
                      {summaryFindings.map((point, i) => (
                        <li key={`f-${i}`} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                          <span className="text-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {summaryRecommendations.length > 0 && (
                  <div>
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Recommended Actions
                    </h3>
                    <ol className="space-y-3 list-decimal list-inside">
                      {summaryRecommendations.map((point, i) => (
                        <li key={`r-${i}`} className="text-foreground">
                          <span className="ml-1">{point}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {summaryFindings.length === 0 && summaryRecommendations.length === 0 && (
                  <p className="text-sm text-muted-foreground">No executive summary available.</p>
                )}
              </CardContent>
            </Card>

            {/* Analysis Dashboards - After Executive Summary */}
            {selectedDashboards.length > 0 && (() => {
              const renderable = selectedDashboards.filter((dt) =>
                dashboardHasRealData(dt, safeAnalysisResult, structuredData)
              );
              const skipped = selectedDashboards.filter(
                (dt) => !dashboardHasRealData(dt, safeAnalysisResult, structuredData)
              );
              if (renderable.length === 0 && skipped.length === 0) return null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-lg font-semibold">Analysis Dashboards</h2>
                    <Badge variant="secondary">{renderable.length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {renderable.map((dashboardType, index) => (
                      <motion.div
                        key={dashboardType}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                      >
                        <DashboardRenderer
                          dashboardType={dashboardType}
                          scenarioTitle={scenarioTitle}
                          analysisResult={safeAnalysisResult}
                          structuredData={structuredData}
                          formData={formData}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {skipped.length > 0 && (
                    <div className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-secondary/20">
                      <p className="font-medium text-foreground mb-1">
                        {skipped.length} dashboard{skipped.length === 1 ? '' : 's'} skipped — insufficient AI data
                      </p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {skipped.map((dt) => (
                          <li key={dt}>{dashboardConfigs[dt]?.name ?? dt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Full Analysis */}
            <Card className="card-elevated border-t-2 border-t-accent/60">
              <CardHeader className="bg-gradient-to-r from-transparent via-transparent to-primary/[0.03] dark:to-primary/10 rounded-t-lg">
                <CardTitle className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-accent" />
                  Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownRenderer content={displayAnalysis} />
                </div>
              </CardContent>
            </Card>

            {/* Report quality feedback — hidden in shared/public view */}
            {!isSharedView && (
              <ReportFeedback scenarioId={scenarioId} />
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Input Summary */}
            <Card className="card-elevated">
              <CardHeader className="bg-gradient-to-r from-transparent via-transparent to-primary/[0.03] dark:to-primary/10 rounded-t-lg">
                <CardTitle className="font-display text-base">Analysis Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(formData)
                  .filter(([_, value]) => value)
                  .slice(0, 8)
                  .map(([key, value]) => {
                    // Split long values into bullet points by sentence or newline
                    const lines = value
                      .split(/(?:\n|(?<=[.!?])\s+)/)
                      .map(l => l.trim())
                      .filter(l => l.length > 0);
                    const showBullets = lines.length >= 2 && value.length > 80;

                    return (
                      <div key={key} className="text-sm">
                        <span className="text-muted-foreground capitalize font-medium">
                          {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:
                        </span>
                        {showBullets ? (
                          <ul className="mt-1 space-y-1 list-disc list-inside">
                            {lines.slice(0, 5).map((line, i) => (
                              <li key={i} className="text-foreground text-xs leading-relaxed">
                                {line.length > 120 ? `${line.slice(0, 120)}…` : line}
                              </li>
                            ))}
                            {lines.length > 5 && (
                              <li className="text-muted-foreground text-xs italic">
                                +{lines.length - 5} more points
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-foreground font-medium mt-0.5">
                            {value.length > 120 ? `${value.slice(0, 120)}…` : value}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </CardContent>
            </Card>

            {/* Selected Dashboards */}
            {selectedDashboards.length > 0 && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-display text-base">Included Dashboards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedDashboards.map((dashboardType) => {
                    const config = dashboardConfigs[dashboardType];
                    return (
                      <div key={dashboardType} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-foreground">{config?.name || dashboardType}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}


            {/* Report Metadata */}
            <Card className="card-elevated">
              <CardContent className="pt-5">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg gradient-primary mx-auto mb-3 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Report Generated Successfully
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Powered by EXOS Procurement Intelligence
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default GeneratedReport;
