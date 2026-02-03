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
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ReportExportButtons from "@/components/reports/ReportExportButtons";
import DashboardRenderer from "@/components/reports/DashboardRenderer";
import { DashboardType, dashboardConfigs } from "@/lib/dashboard-mappings";
import { useShareableReport } from "@/hooks/useShareableReport";

interface ReportState {
  scenarioTitle: string;
  scenarioId?: string;
  analysisResult: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
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

  const { scenarioTitle, scenarioId, analysisResult, formData, timestamp, selectedDashboards = [] } = state;

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

  // Parse key metrics from analysis (simple extraction)
  const extractKeyPoints = (text: string): string[] => {
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
    
    return keyPoints.length > 0 ? keyPoints : lines.slice(0, 5).map(cleanMarkdown).filter(Boolean);
  };

  const keyPoints = extractKeyPoints(analysisResult);

  return (
    <div className="min-h-screen gradient-hero">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      <Header />

      <main className="container py-8 relative">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analysis
        </button>

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
              analysisResult={analysisResult}
              formData={formData}
              timestamp={timestamp}
              selectedDashboards={selectedDashboards}
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

            {/* Analysis Dashboards - After Executive Summary */}
            {selectedDashboards.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold">Analysis Dashboards</h2>
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
                        analysisResult={analysisResult}
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
                    {analysisResult.split('\n').map((line, i) => {
                      // Check if line starts with hash headers (###, ####, etc.)
                      const hashMatch = line.match(/^(#{1,4})\s*(.*)$/);
                      const isHashHeader = !!hashMatch;
                      
                      // Clean all markdown formatting
                      const cleanLine = cleanMarkdown(line);
                      
                      if (!cleanLine) {
                        return <div key={i} className="h-2" />;
                      }
                      
                      // Hash headers get largest styling
                      if (isHashHeader) {
                        const headerLevel = hashMatch[1].length;
                        const fontSize = headerLevel <= 2 ? 'text-lg' : 'text-base';
                        return (
                          <h3 key={i} className={`${fontSize} font-bold text-foreground mt-4 first:mt-0`}>
                            {cleanLine}
                          </h3>
                        );
                      }
                      
                      // Check if line looks like a section header (ends with colon or is all caps/title case short line)
                      const isSectionHeader = 
                        (cleanLine.endsWith(':') && cleanLine.length < 80) ||
                        (cleanLine.length > 0 && cleanLine.length < 60 && /^[A-Z]/.test(cleanLine) && !cleanLine.includes('.'));
                      
                      if (isSectionHeader) {
                        return (
                          <p key={i} className="font-semibold text-foreground text-base mt-3">
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
                <CardTitle className="font-display text-base">Analysis Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(formData)
                  .filter(([_, value]) => value)
                  .slice(0, 8)
                  .map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:
                      </span>
                      <p className="text-foreground font-medium truncate">
                        {value.length > 50 ? `${value.slice(0, 50)}...` : value}
                      </p>
                    </div>
                  ))}
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

            {/* Quick Actions */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-display text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  Download as Word
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4" />
                  Print Report
                </Button>
              </CardContent>
            </Card>

            {/* Report Metadata */}
            <Card className="card-elevated bg-primary/5 border-primary/20">
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
