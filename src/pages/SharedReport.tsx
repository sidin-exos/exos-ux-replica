import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Share2,
  CheckCircle2,
  Calendar,
  Building2,
  Target,
  BarChart3,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import DashboardRenderer from "@/components/reports/DashboardRenderer";
import { DashboardType, dashboardConfigs } from "@/lib/dashboard-mappings";
import { supabase } from "@/integrations/supabase/client";
import { stripDashboardData } from "@/lib/dashboard-data-parser";

interface ReportData {
  scenarioTitle: string;
  scenarioId?: string;
  analysisResult: string;
  structuredData?: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
  evaluationScore?: number | null;
  evaluationConfidence?: string | null;
}

type SharedReportState =
  | { status: "loading" }
  | { status: "loaded"; data: ReportData }
  | { status: "expired" }
  | { status: "not_found" }
  | { status: "error"; message: string };

export default function SharedReport() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<SharedReportState>({ status: "loading" });

  useEffect(() => {
    if (!shareId) {
      navigate("/", { replace: true });
      return;
    }

    if (!/^[a-f0-9]{32,64}$/i.test(shareId)) {
      setState({ status: "not_found" });
      return;
    }

    const fetchReport = async () => {
      try {
        const { data, error } = await supabase.rpc("get_shared_report", {
          p_share_id: shareId,
        });

        if (error) {
          if (error.message?.toLowerCase().includes("expired")) {
            setState({ status: "expired" });
          } else {
            setState({ status: "not_found" });
          }
          return;
        }

        if (!data) {
          setState({ status: "not_found" });
          return;
        }

        const payload = data as unknown as ReportData;
        setState({
          status: "loaded",
          data: {
            scenarioTitle: payload.scenarioTitle ?? "Procurement Analysis",
            scenarioId: payload.scenarioId,
            analysisResult: payload.analysisResult ?? "",
            structuredData: payload.structuredData,
            formData: payload.formData ?? {},
            timestamp: payload.timestamp ?? new Date().toISOString(),
            selectedDashboards: payload.selectedDashboards,
            evaluationScore: payload.evaluationScore,
            evaluationConfidence: payload.evaluationConfidence,
          },
        });
      } catch {
        setState({
          status: "error",
          message: "Unable to load this report. Please try again.",
        });
      }
    };

    fetchReport();
  }, [shareId, navigate]);

  // ── Loading ──
  if (state.status === "loading") {
    return (
      <>
        <Helmet>
          <title>Loading Report | EXOS</title>
        </Helmet>
        <div className="min-h-screen gradient-hero flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Loading Shared Report</h1>
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </>
    );
  }

  // ── Expired ──
  if (state.status === "expired") {
    return (
      <>
        <Helmet>
          <title>Report Expired | EXOS</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen gradient-hero flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-3">This report has expired</h1>
            <p className="text-muted-foreground mb-6">
              Shared reports are available for 5 days after creation.
              Ask the person who shared this link to generate a new one.
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Go to EXOS
            </a>
          </div>
        </div>
      </>
    );
  }

  // ── Not Found ──
  if (state.status === "not_found") {
    return (
      <>
        <Helmet>
          <title>Report Not Found | EXOS</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen gradient-hero flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-3">Report not found</h1>
            <p className="text-muted-foreground mb-6">
              This link may be invalid or the report may have been removed.
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Go to EXOS
            </a>
          </div>
        </div>
      </>
    );
  }

  // ── Error ──
  if (state.status === "error") {
    return (
      <>
        <Helmet>
          <title>Error | EXOS</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen gradient-hero flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">{state.message}</p>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Go to EXOS
            </a>
          </div>
        </div>
      </>
    );
  }

  // ── Loaded ──
  const {
    scenarioTitle,
    scenarioId,
    analysisResult,
    structuredData,
    formData,
    timestamp,
    selectedDashboards = [],
    evaluationScore,
    evaluationConfidence,
  } = state.data;

  const safeAnalysisResult = analysisResult ?? "";
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

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*\*/g, "")
      .replace(/\*\*/g, "")
      .replace(/^\s*\*\s+/gm, "")
      .replace(/^#{1,4}\s*/gm, "")
      .trim();
  };

  const extractKeyPoints = (text: string | null | undefined): string[] => {
    if (!text) return [];
    const lines = text.split("\n").filter((line) => line.trim());
    const keyPoints: string[] = [];
    for (const line of lines) {
      const cleanLine = cleanMarkdown(line);
      if (!cleanLine) continue;
      if (
        cleanLine.includes("recommend") ||
        cleanLine.includes("suggest") ||
        cleanLine.includes("should") ||
        cleanLine.includes("%") ||
        cleanLine.includes("$")
      ) {
        keyPoints.push(cleanLine);
        if (keyPoints.length >= 5) break;
      }
    }
    return keyPoints.length > 0
      ? keyPoints
      : lines
          .slice(0, 5)
          .map(cleanMarkdown)
          .filter(Boolean);
  };

  const keyPoints = extractKeyPoints(safeAnalysisResult);

  return (
    <div className="min-h-screen gradient-hero">
      <Helmet>
        <title>{scenarioTitle} — Shared Report | EXOS</title>
        <meta
          name="description"
          content={`Shared procurement analysis report: ${scenarioTitle}`}
        />
        <meta name="robots" content="noindex, nofollow" />
        <link
          rel="canonical"
          href={`https://exosproc.com/report/${shareId}`}
        />
      </Helmet>

      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      <Header />

      <main className="container py-8 relative">
        {/* Shared report banner */}
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Share2 className="w-4 h-4 text-primary" />
            <span className="font-medium">Shared report</span>
            <span>·</span>
            <span>{scenarioTitle}</span>
          </div>
          <a
            href="/"
            className="text-primary hover:underline font-medium text-sm"
          >
            Try EXOS free →
          </a>
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
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      Shared View
                    </Badge>
                  </div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold">
                    <span className="text-gradient">{scenarioTitle}</span>{" "}
                    Analysis Report
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

            <ReportExportButtons
              scenarioTitle={scenarioTitle}
              analysisResult={safeAnalysisResult}
              structuredData={structuredData}
              formData={formData}
              timestamp={timestamp}
              selectedDashboards={selectedDashboards}
              evaluationScore={evaluationScore}
              evaluationConfidence={evaluationConfidence}
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
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Dashboards */}
            {selectedDashboards.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold">
                    Analysis Dashboards
                  </h2>
                  <Badge variant="secondary">{selectedDashboards.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {selectedDashboards.map((dashboardType, index) => (
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
              </div>
            )}

            {/* Full Analysis */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-display">Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="text-foreground bg-secondary/30 rounded-lg p-5 border border-border space-y-4">
                    {displayAnalysis.split("\n").map((line, i) => {
                      const hashMatch = line.match(/^(#{1,4})\s*(.*)$/);
                      const isHashHeader = !!hashMatch;
                      const cleanLine = cleanMarkdown(line);

                      if (!cleanLine) {
                        return <div key={i} className="h-2" />;
                      }

                      if (isHashHeader) {
                        const headerLevel = hashMatch![1].length;
                        const fontSize =
                          headerLevel <= 2 ? "text-lg" : "text-base";
                        return (
                          <h3
                            key={i}
                            className={`${fontSize} font-bold text-foreground mt-4 first:mt-0`}
                          >
                            {cleanLine}
                          </h3>
                        );
                      }

                      const isSectionHeader =
                        (cleanLine.endsWith(":") && cleanLine.length < 80) ||
                        (cleanLine.length > 0 &&
                          cleanLine.length < 60 &&
                          /^[A-Z]/.test(cleanLine) &&
                          !cleanLine.includes("."));

                      if (isSectionHeader) {
                        return (
                          <p
                            key={i}
                            className="font-semibold text-foreground text-base mt-3"
                          >
                            {cleanLine}
                          </p>
                        );
                      }

                      return (
                        <p key={i} className="text-foreground/90">
                          {cleanLine}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
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
              <CardHeader>
                <CardTitle className="font-display text-base">
                  Analysis Inputs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(formData)
                  .filter(([_, value]) => value)
                  .slice(0, 8)
                  .map(([key, value]) => {
                    const lines = value
                      .split(/(?:\n|(?<=[.!?])\s+)/)
                      .map((l) => l.trim())
                      .filter((l) => l.length > 0);
                    const showBullets = lines.length >= 2 && value.length > 80;

                    return (
                      <div key={key} className="text-sm">
                        <span className="text-muted-foreground capitalize font-medium">
                          {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:
                        </span>
                        {showBullets ? (
                          <ul className="mt-1 space-y-1 list-disc list-inside">
                            {lines.slice(0, 5).map((line, i) => (
                              <li
                                key={i}
                                className="text-foreground text-xs leading-relaxed"
                              >
                                {line.length > 120
                                  ? `${line.slice(0, 120)}…`
                                  : line}
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
                            {value.length > 120
                              ? `${value.slice(0, 120)}…`
                              : value}
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
                  <CardTitle className="font-display text-base">
                    Included Dashboards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedDashboards.map((dashboardType) => {
                    const config = dashboardConfigs[dashboardType];
                    return (
                      <div
                        key={dashboardType}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-foreground">
                          {config?.name || dashboardType}
                        </span>
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
}
