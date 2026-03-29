import { useState } from "react";
import { motion } from "framer-motion";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PDFPreviewModal from "./pdf/PDFPreviewModal";
import { exportReportToExcel } from "@/lib/report-export-excel";

import { DashboardType } from "@/lib/dashboard-mappings";

interface ReportExportButtonsProps {
  scenarioTitle?: string;
  analysisResult?: string;
  formData?: Record<string, string>;
  timestamp?: string;
  selectedDashboards?: DashboardType[];
  evaluationScore?: number | null;
  evaluationConfidence?: string | null;
}

const ReportExportButtons = ({
  scenarioTitle = "Analysis",
  analysisResult = "",
  formData = {},
  timestamp = new Date().toISOString(),
  selectedDashboards = [],
  evaluationScore,
  evaluationConfidence,
}: ReportExportButtonsProps) => {
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const handleExcelExport = async () => {
    try {
      await exportReportToExcel(scenarioTitle, analysisResult, formData, timestamp);
      toast.success("Excel report downloaded", {
        description: "Check your downloads folder for the .xlsx file.",
      });
    } catch (err) {
      console.error("[excel-export]", err);
      toast.error("Failed to generate Excel file");
    }
  };

  const hasPdfData = analysisResult.length > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2"
      >
        <Button
          onClick={() => hasPdfData ? setPdfPreviewOpen(true) : toast.info("No data to export")}
          variant="hero"
          className="gap-2"
        >
          <FileDown className="w-4 h-4" />
          Export to PDF
        </Button>

        <Button
          onClick={handleExcelExport}
          variant="hero"
          className="gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export to Excel
        </Button>
      </motion.div>

      <PDFPreviewModal
        open={pdfPreviewOpen}
        onOpenChange={setPdfPreviewOpen}
        scenarioTitle={scenarioTitle}
        analysisResult={analysisResult}
        formData={formData}
        timestamp={timestamp}
        selectedDashboards={selectedDashboards}
        evaluationScore={evaluationScore}
        evaluationConfidence={evaluationConfidence}
      />
    </>
  );
};

export default ReportExportButtons;

