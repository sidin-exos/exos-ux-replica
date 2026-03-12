import { useState, useEffect, useCallback } from "react";
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
import { DashboardType } from "@/lib/dashboard-mappings";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PDFPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioTitle: string;
  analysisResult: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
}

const PDFPreviewModal = ({
  open,
  onOpenChange,
  scenarioTitle,
  analysisResult,
  formData,
  timestamp,
  selectedDashboards = [],
}: PDFPreviewModalProps) => {
  // Raw PDF bytes for canvas preview (avoids CSP connect-src restrictions on blob URLs)
  const [pdfData, setPdfData] = useState<{ data: Uint8Array } | null>(null);
  // Blob URL only for download / open-in-tab
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<PdfThemeMode>("dark");

  // PDF viewer state
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  const fileName = `EXOS_${scenarioTitle.replace(/\s+/g, "_")}_${new Date(timestamp).toISOString().split("T")[0]}.pdf`;

  useEffect(() => {
    if (!open) {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
      setPdfData(null);
      setPreviewError(false);
      setNumPages(0);
      setCurrentPage(1);
      setScale(1.0);
      return;
    }

    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPdfData(null);

    generatePdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scenarioTitle, analysisResult, timestamp, selectedDashboards, formData, pdfTheme]);

  const generatePdf = async () => {
    setIsGenerating(true);
    setPreviewError(false);
    setNumPages(0);
    setCurrentPage(1);

    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { scenarioTitle, analysisResult, formData, timestamp, selectedDashboards, pdfTheme },
      });

      if (error) throw error;

      // Convert response to ArrayBuffer → Uint8Array
      const blob = data instanceof Blob ? data : new Blob([data], { type: "application/pdf" });
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Pass raw bytes to PDF.js (no network fetch needed — bypasses connect-src CSP)
      setPdfData({ data: bytes });
      // Keep a blob URL for download / open-in-tab only
      setPdfBlobUrl(URL.createObjectURL(blob));
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      const msg = error?.message || "Unknown error";
      toast.error(`PDF generation failed: ${msg}`);
      setPreviewError(true);
    } finally {
      setIsGenerating(false);
    }
  };

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
        {/* Header */}
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
              {/* Theme Toggle */}
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

        {/* Preview Area */}
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
                className="w-full h-full flex flex-col"
              >
                {/* PDF canvas viewer — fed raw bytes, no network fetch needed */}
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

                {/* Bottom toolbar: pagination + zoom */}
                {numPages > 0 && (
                  <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background/80 backdrop-blur-sm">
                    {/* Pagination */}
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

                    {/* Zoom */}
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
