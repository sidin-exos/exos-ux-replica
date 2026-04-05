import { useState } from "react";
import { motion } from "framer-motion";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PDFPreviewModal from "./pdf/PDFPreviewModal";
import { supabase } from "@/integrations/supabase/client";

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

  const [excelLoading, setExcelLoading] = useState(false);

  const handleExcelExport = async () => {
    setExcelLoading(true);
    try {
      // Use fetch directly (not supabase.functions.invoke) to get binary response
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const supabaseUrl = (supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-excel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ scenarioTitle, analysisResult, formData, timestamp }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = scenarioTitle.replace(/\s+/g, "_").slice(0, 40);
      const dateStr = new Date(timestamp).toISOString().slice(0, 10);
      a.download = `EXOS_${safeTitle}_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Excel report downloaded", {
        description: "Check your downloads folder for the .xlsx file.",
      });
    } catch (err) {
      console.error("[excel-export]", err);
      toast.error("Failed to generate Excel file");
    } finally {
      setExcelLoading(false);
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
          disabled={excelLoading}
        >
          <FileSpreadsheet className="w-4 h-4" />
          {excelLoading ? "Generating…" : "Export to Excel"}
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

