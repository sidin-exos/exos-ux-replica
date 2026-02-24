import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Send,
  Slack,
  Trello,
  Link2,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PDFPreviewModal from "./pdf/PDFPreviewModal";
import { useShareableReport } from "@/hooks/useShareableReport";
import { exportReportToExcel } from "@/lib/report-export-excel";
import { formatReportForJira } from "@/lib/report-export-jira";

// Custom Jira icon component
const JiraIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z" />
  </svg>
);

// Custom Notion icon component
const NotionIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.22.186c-.094-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.046-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.448-1.632z" />
  </svg>
);

import { DashboardType } from "@/lib/dashboard-mappings";

interface ReportExportButtonsProps {
  scenarioTitle?: string;
  analysisResult?: string;
  formData?: Record<string, string>;
  timestamp?: string;
  selectedDashboards?: DashboardType[];
}

const ReportExportButtons = ({
  scenarioTitle = "Analysis",
  analysisResult = "",
  formData = {},
  timestamp = new Date().toISOString(),
  selectedDashboards = [],
}: ReportExportButtonsProps) => {
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { generateShareLink, isLoading: isGeneratingLink } = useShareableReport();

  const handleExport = (type: string) => {
    toast.info(`${type} export will be available soon`, {
      description: "This integration is coming in a future update.",
    });
  };

  const handleExcelExport = () => {
    try {
      exportReportToExcel(scenarioTitle, analysisResult, formData, timestamp);
      toast.success("Excel report downloaded", {
        description: "Check your downloads folder for the .xlsx file.",
      });
    } catch (err) {
      console.error("[excel-export]", err);
      toast.error("Failed to generate Excel file");
    }
  };

  const handleJiraCopy = async () => {
    try {
      const jiraText = formatReportForJira(scenarioTitle, analysisResult, formData, timestamp);
      await navigator.clipboard.writeText(jiraText);
      toast.success("Copied for Jira", {
        description: "Paste into a new Jira issue to create the task.",
      });
    } catch (err) {
      console.error("[jira-copy]", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleShare = async () => {
    const url = await generateShareLink({
      scenarioTitle,
      analysisResult,
      formData,
      timestamp,
      selectedDashboards,
    });
    
    if (url) {
      setShareUrl(url);
      setShareDialogOpen(true);
    } else {
      toast.error("Failed to generate share link");
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error("Failed to copy link");
      }
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
        {/* Share Report Link - Primary Action */}
        <Button
          onClick={handleShare}
          variant="hero"
          className="gap-2"
          disabled={isGeneratingLink}
        >
          <Link2 className="w-4 h-4" />
          {isGeneratingLink ? "Generating..." : "Share Report Link"}
        </Button>

        {/* Export to PDF - Primary Action */}
        <Button
          onClick={() => hasPdfData ? setPdfPreviewOpen(true) : handleExport("PDF")}
          variant="hero"
          className="gap-2"
        >
          <FileDown className="w-4 h-4" />
          Export to PDF
        </Button>

        {/* Jira — Copy to Clipboard */}
        <Button
          onClick={handleJiraCopy}
          variant="outline"
          className="gap-2"
        >
          <JiraIcon />
          Copy for Jira
        </Button>

        {/* More Integrations Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Send className="w-4 h-4" />
              More Integrations
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleExport("Notion")}>
              <NotionIcon />
              <span className="ml-2">Export to Notion</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("Confluence")}>
              <FileText className="w-4 h-4" />
              <span className="ml-2">Export to Confluence</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("Trello")}>
              <Trello className="w-4 h-4" />
              <span className="ml-2">Export to Trello</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("Slack")}>
              <Slack className="w-4 h-4" />
              <span className="ml-2">Share to Slack</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExcelExport}>
              <FileSpreadsheet className="w-4 h-4" />
              <span className="ml-2">Export to Excel</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        open={pdfPreviewOpen}
        onOpenChange={setPdfPreviewOpen}
        scenarioTitle={scenarioTitle}
        analysisResult={analysisResult}
        formData={formData}
        timestamp={timestamp}
        selectedDashboards={selectedDashboards}
      />

      {/* Share Link Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Share Report
            </DialogTitle>
            <DialogDescription>
              Anyone with this link can view your report. The link expires in 5 days.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-4">
            <Input
              value={shareUrl || ""}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Note: Shared reports include all visualizations and analysis data.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportExportButtons;

