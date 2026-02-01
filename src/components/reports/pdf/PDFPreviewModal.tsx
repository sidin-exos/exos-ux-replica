import { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, Eye, EyeOff, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PDFReportDocument from "./PDFReportDocument";
import { DashboardType } from "@/lib/dashboard-mappings";

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
  const [showPreview, setShowPreview] = useState(true);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const fileName = `EXOS_${scenarioTitle.replace(/\s+/g, "_")}_${new Date(timestamp).toISOString().split("T")[0]}.pdf`;

  // Generate (or re-generate) the PDF blob whenever the modal opens or inputs change.
  // This fixes cases where dashboards load asynchronously (shared reports) and the
  // previously generated blob was missing visuals.
  useEffect(() => {
    if (!open) {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      setPdfBlobUrl(null);
      setPreviewError(false);
      return;
    }

    // Revoke any prior blob before regenerating
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    generatePdfBlob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    scenarioTitle,
    analysisResult,
    timestamp,
    selectedDashboards,
    formData,
  ]);

  const generatePdfBlob = async () => {
    setIsGenerating(true);
    setPreviewError(false);
    
    try {
      const doc = (
        <PDFReportDocument
          scenarioTitle={scenarioTitle}
          analysisResult={analysisResult}
          formData={formData}
          timestamp={timestamp}
          selectedDashboards={selectedDashboards}
        />
      );
      
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (error) {
      console.error("Failed to generate PDF preview:", error);
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
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, "_blank");
    }
  };

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Show Preview
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                disabled={!pdfBlobUrl || isGenerating}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Open in Tab
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={handleDownload}
                disabled={!pdfBlobUrl || isGenerating}
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
        <div className="flex-1 overflow-hidden bg-secondary/30">
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
                  <p className="text-muted-foreground">Generating PDF preview...</p>
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
                    Preview Unavailable
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Unable to generate preview. You can still download the PDF directly.
                  </p>
                  <Button variant="outline" size="sm" onClick={generatePdfBlob}>
                    Retry
                  </Button>
                </div>
              </motion.div>
            ) : showPreview && pdfBlobUrl ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <object
                  data={pdfBlobUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="border-0"
                >
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8 max-w-md">
                      <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-display text-lg font-semibold mb-2">
                        Preview Blocked
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Your browser blocked the inline preview. Click "Open in Tab" or download the PDF directly.
                      </p>
                    </div>
                  </div>
                </object>
              </motion.div>
            ) : (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center p-8 max-w-md">
                  <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto mb-4 flex items-center justify-center">
                    <Download className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">
                    Ready to Download
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Your PDF report has been generated with EXOS corporate branding. 
                    Click the download button above to save it.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    File: {fileName}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewModal;
