import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Loader2,
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
import type { PdfThemeMode } from "./dashboardVisuals/theme";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { DashboardType, toLegacyDashboardId } from "@/lib/dashboard-mappings";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PDFPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioTitle: string;
  analysisResult: string;
  structuredData?: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
  evaluationScore?: number | null;
  evaluationConfidence?: string | null;
}

const PDFPreviewModal = ({
  open,
  onOpenChange,
  scenarioTitle,
  analysisResult,
  structuredData,
  formData,
  timestamp,
  selectedDashboards = [],
  evaluationScore,
  evaluationConfidence,
}: PDFPreviewModalProps) => {
  const [pdfData, setPdfData] = useState<{ data: Uint8Array } | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<PdfThemeMode>("dark");
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  const lastGeneratedKeyRef = useRef<string | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);

  const fileName = `EXOS_${scenarioTitle.replace(/\s+/g, "_")}_${new Date(timestamp).toISOString().split("T")[0]}.pdf`;

  const generationKey = useMemo(
    () => JSON.stringify({
      scenarioTitle,
      analysisResult,
      structuredData,
      timestamp,
      pdfTheme,
      evaluationScore: evaluationScore ?? null,
      evaluationConfidence: evaluationConfidence ?? null,
      formData: Object.entries(formData).sort(([a], [b]) => a.localeCompare(b)),
      selectedDashboards,
    }),
    [
      scenarioTitle,
      analysisResult,
      structuredData,
      timestamp,
      pdfTheme,
      evaluationScore,
      evaluationConfidence,
      formData,
      selectedDashboards,
    ],
  );

  const generatePdf = useCallback(async (requestKey = generationKey, force = false) => {
    if (!force) {
      if (inFlightKeyRef.current === requestKey) return;
      if (lastGeneratedKeyRef.current === requestKey) return;
    }

    inFlightKeyRef.current = requestKey;
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
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: {
          scenarioTitle,
          analysisResult,
          structuredData,
          formData,
          timestamp,
          // Edge function still uses legacy dashboard ids; translate at the boundary.
          selectedDashboards: selectedDashboards.map(toLegacyDashboardId),
          pdfTheme,
          evaluationScore: evaluationScore ?? undefined,
          evaluationConfidence: evaluationConfidence ?? undefined,
        },
      });

      if (error) throw error;

      const blob = data instanceof Blob ? data : new Blob([data], { type: "application/pdf" });
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      setPdfData({ data: bytes });
      setPdfBlobUrl(URL.createObjectURL(blob));
      lastGeneratedKeyRef.current = requestKey;
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      const msg = error?.message || "Unknown error";
      toast.error(`PDF generation failed: ${msg}`);
      setPreviewError(true);
    } finally {
      if (inFlightKeyRef.current === requestKey) {
        inFlightKeyRef.current = null;
      }
      setIsGenerating(false);
    }
  }, [
    analysisResult,
    structuredData,
    evaluationConfidence,
    evaluationScore,
    formData,
    generationKey,
    pdfBlobUrl,
    pdfTheme,
    scenarioTitle,
    selectedDashboards,
    timestamp,
  ]);

  useEffect(() => {
    if (!open) {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
      setPdfData(null);
      setPreviewError(false);
      setNumPages(0);
      setCurrentPage(1);
      setScale(1.0);
      lastGeneratedKeyRef.current = null;
      inFlightKeyRef.current = null;
      return;
    }

    void generatePdf(generationKey);
  }, [open, pdfBlobUrl, generationKey, generatePdf]);

  const handleDownload = () => {
    if (pdfBlobUrl) {
      const link = document.createElement("a");
      link.href = pdfBlobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-background border-border">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-display text-xl">
                PDF Report Preview
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review the PDF layout before downloading
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                disabled={!pdfData || isGenerating}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Tab
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={handleDownload}
                disabled={!pdfData || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-secondary/30 relative">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center p-8">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Generating PDF report...</p>
                  <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
                </div>
              </motion.div>
            ) : previewError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center p-8 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-destructive/20 mx-auto mb-4 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">
                    Generation Failed
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Something went wrong while generating the PDF. Please try again.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      lastGeneratedKeyRef.current = null;
                      void generatePdf(generationKey, true);
                    }}
                  >
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
                className="w-full h-full flex flex-col"
              >
                <div className="flex-1 overflow-auto flex justify-center py-4 bg-muted/30">
                  <Document
                    file={pdfData}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                      <div className="flex items-center justify-center h-full py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center h-full py-20">
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
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewModal;
