import { useState } from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PDFReportDocument from "./PDFReportDocument";

interface PDFPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioTitle: string;
  analysisResult: string;
  formData: Record<string, string>;
  timestamp: string;
}

const PDFPreviewModal = ({
  open,
  onOpenChange,
  scenarioTitle,
  analysisResult,
  formData,
  timestamp,
}: PDFPreviewModalProps) => {
  const [showPreview, setShowPreview] = useState(true);

  const fileName = `EXOS_${scenarioTitle.replace(/\s+/g, "_")}_${new Date(timestamp).toISOString().split("T")[0]}.pdf`;

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
              <PDFDownloadLink
                document={
                  <PDFReportDocument
                    scenarioTitle={scenarioTitle}
                    analysisResult={analysisResult}
                    formData={formData}
                    timestamp={timestamp}
                  />
                }
                fileName={fileName}
              >
                {({ loading }) => (
                  <Button variant="hero" size="sm" className="gap-2" disabled={loading}>
                    {loading ? (
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
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Area */}
        <div className="flex-1 overflow-hidden bg-secondary/30">
          <AnimatePresence mode="wait">
            {showPreview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <PDFViewer
                  width="100%"
                  height="100%"
                  showToolbar={false}
                  className="border-0"
                >
                  <PDFReportDocument
                    scenarioTitle={scenarioTitle}
                    analysisResult={analysisResult}
                    formData={formData}
                    timestamp={timestamp}
                  />
                </PDFViewer>
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
