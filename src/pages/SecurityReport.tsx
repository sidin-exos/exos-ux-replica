import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Loader2,
  Shield,
  AlertTriangle,
  FileText,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import SecurityReportPDFDocument from "@/components/reports/pdf/SecurityReportPDFDocument";
import { buildSecurityReportData } from "@/components/reports/pdf/SecurityReportPDFDocument";
import type { PdfThemeMode } from "@/components/reports/pdf/dashboardVisuals/theme";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const SecurityReport = () => {
  const [pdfData, setPdfData] = useState<{ data: Uint8Array } | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<PdfThemeMode>("dark");
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  const reportData = buildSecurityReportData();

  const generatePdf = async () => {
    setIsGenerating(true);
    setPreviewError(false);
    setNumPages(0);
    setCurrentPage(1);

    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPdfData(null);

    try {
      const blob = await pdf(
        <SecurityReportPDFDocument pdfTheme={pdfTheme} />
      ).toBlob();

      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      setPdfData({ data: bytes });
      setPdfBlobUrl(URL.createObjectURL(blob));
    } catch (error: any) {
      console.error("Failed to generate Security Report PDF:", error);
      toast.error("PDF generation failed. Please try again.");
      setPreviewError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (pdfBlobUrl) {
      const link = document.createElement("a");
      link.href = pdfBlobUrl;
      link.download = `EXOS_Security_Report_${reportData.assessmentDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Security report downloaded");
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) window.open(pdfBlobUrl, "_blank");
  };

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setCurrentPage(1);
  }, []);

  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(2.0, s + 0.2));
  const zoomOut = () => setScale((s) => Math.max(0.4, s - 0.2));

  // Severity badge styling helper
  const severityBadge = (severity: string) => {
    const s = severity.toLowerCase();
    if (s.includes("high")) return "bg-destructive/20 text-destructive border-destructive/30";
    if (s.includes("medium")) return "bg-warning/20 text-warning border-warning/30";
    return "bg-success/20 text-success border-success/30";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Security Assessment Report</h1>
                <p className="text-sm text-muted-foreground">
                  {reportData.assessmentDate} — {reportData.classification}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <div className="flex items-center rounded-md border border-border overflow-hidden">
                <Button
                  variant={pdfTheme === "light" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPdfTheme("light")}
                  className="gap-1.5 rounded-none border-0 h-8 px-3"
                >
                  <Sun className="w-3.5 h-3.5" />
                  Light
                </Button>
                <Button
                  variant={pdfTheme === "dark" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPdfTheme("dark")}
                  className="gap-1.5 rounded-none border-0 h-8 px-3"
                >
                  <Moon className="w-3.5 h-3.5" />
                  Dark
                </Button>
              </div>

              <Button
                variant="hero"
                size="sm"
                onClick={generatePdf}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Score Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Overall Score</p>
              <p className="text-3xl font-bold text-primary mt-1">{reportData.overallScore}/100</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk Rating</p>
              <p className="text-lg font-bold text-warning mt-1">{reportData.riskRating}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Domains Assessed</p>
              <p className="text-3xl font-bold text-foreground mt-1">{reportData.sections.length}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Issues Found</p>
              <p className="text-3xl font-bold text-destructive mt-1">
                {reportData.sections.reduce((acc, s) => acc + s.issues.length, 0)}
              </p>
            </div>
          </div>

          {/* Domain Scores */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h2 className="font-semibold text-foreground">Domain Scores</h2>
            </div>
            <div className="divide-y divide-border">
              {reportData.sections.map((sec) => (
                <div key={sec.number} className="flex items-center px-5 py-3 gap-4">
                  <span className="text-sm text-muted-foreground w-6">{sec.number}.</span>
                  <span className="text-sm flex-1">{sec.title}</span>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(sec.score / sec.maxScore) * 100}%`,
                        backgroundColor: sec.score >= 9 ? "#6bbf8a" : sec.score >= 7 ? "#c9a24d" : "#c06060",
                      }}
                    />
                  </div>
                  <span
                    className="text-sm font-mono font-bold w-12 text-right"
                    style={{
                      color: sec.score >= 9 ? "#6bbf8a" : sec.score >= 7 ? "#c9a24d" : "#c06060",
                    }}
                  >
                    {sec.score}/{sec.maxScore}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Remediations */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h2 className="font-semibold text-foreground">Critical Remediations</h2>
            </div>
            <div className="divide-y divide-border">
              {reportData.priority1.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-start gap-3">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${severityBadge("high")}`}>
                    {r.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.issue}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.remediation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PDF Preview Area */}
          {(pdfData || isGenerating || previewError) && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground">PDF Preview</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    disabled={!pdfData || isGenerating}
                    className="gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Tab
                  </Button>
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!pdfData || isGenerating}
                    className="gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="min-h-[500px] bg-secondary/30 relative">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-[500px]"
                    >
                      <div className="text-center p-8">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Generating security report PDF...</p>
                      </div>
                    </motion.div>
                  ) : previewError ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-center justify-center h-[500px]"
                    >
                      <div className="text-center p-8 max-w-md">
                        <div className="w-16 h-16 rounded-2xl bg-destructive/20 mx-auto mb-4 flex items-center justify-center">
                          <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Generation Failed</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Something went wrong. Please try again.
                        </p>
                        <Button variant="outline" size="sm" onClick={generatePdf}>
                          Retry
                        </Button>
                      </div>
                    </motion.div>
                  ) : pdfData ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col"
                    >
                      <div className="flex-1 overflow-auto flex justify-center py-4 bg-muted/30">
                        <Document
                          file={pdfData}
                          onLoadSuccess={onDocumentLoadSuccess}
                          loading={
                            <div className="flex items-center justify-center py-20">
                              <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                          }
                          error={
                            <div className="flex items-center justify-center py-20">
                              <div className="text-center">
                                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Failed to load preview</p>
                              </div>
                            </div>
                          }
                        >
                          <Page
                            pageNumber={currentPage}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={true}
                          />
                        </Document>
                      </div>

                      {numPages > 0 && (
                        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background/80 backdrop-blur-sm">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevPage} disabled={currentPage <= 1}>
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground tabular-nums min-w-[80px] text-center">
                              {currentPage} / {numPages}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextPage} disabled={currentPage >= numPages}>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} disabled={scale <= 0.4}>
                              <ZoomOut className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground tabular-nums min-w-[50px] text-center">
                              {Math.round(scale * 100)}%
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} disabled={scale >= 2.0}>
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SecurityReport;
