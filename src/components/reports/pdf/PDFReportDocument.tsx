import { Document } from "@react-pdf/renderer";
import exosLogoDark from "@/assets/logo-concept-layers.png";
import exosLogoLight from "@/assets/logo-concept-layers-light.png";
import { PDFDashboardPages } from "./PDFDashboardVisuals";
import { extractDashboardData, stripDashboardData } from "@/lib/dashboard-data-parser";
import { DashboardType } from "@/lib/dashboard-mappings";
import type { PdfThemeMode } from "./dashboardVisuals/theme";

import { getDocStyles, getDocColors } from "./pdfDocStyles";
import {
  extractExecutiveSummary,
  formatDate,
  generateReportHash,
  buildTocEntries,
} from "./pdfDocHelpers";
import PDFCoverPage from "./PDFCoverPage";
import PDFAnalysisPage from "./PDFAnalysisPage";

interface PDFReportDocumentProps {
  scenarioTitle: string;
  analysisResult: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
  pdfTheme?: PdfThemeMode;
}

const PDFReportDocument = ({
  scenarioTitle,
  analysisResult,
  formData,
  timestamp,
  selectedDashboards = [],
  pdfTheme = "dark",
}: PDFReportDocumentProps) => {
  const parsedData = extractDashboardData(analysisResult);
  const strippedAnalysis = stripDashboardData(analysisResult);
  const { findings, recommendations } = extractExecutiveSummary(strippedAnalysis);
  const analysisLines = strippedAnalysis.split("\n").filter((line) => line.trim());

  const styles = getDocStyles(pdfTheme);
  const colors = getDocColors(pdfTheme);
  const exosLogo = pdfTheme === "light" ? exosLogoLight : exosLogoDark;
  const reportHash = generateReportHash(scenarioTitle, timestamp);
  const formattedDate = formatDate(timestamp);
  const hasDashboards = selectedDashboards.length > 0;
  const hasParams = Object.keys(formData).length > 0;
  const tocEntries = buildTocEntries(hasDashboards, hasParams, selectedDashboards.length);
  const showToc = hasDashboards;

  return (
    <Document>
      <PDFCoverPage
        scenarioTitle={scenarioTitle}
        formattedDate={formattedDate}
        reportHash={reportHash}
        exosLogo={exosLogo}
        findings={findings}
        recommendations={recommendations}
        tocEntries={tocEntries}
        showToc={showToc}
        styles={styles}
        colors={colors}
      />

      {hasDashboards && (
        <PDFDashboardPages
          selectedDashboards={selectedDashboards}
          parsedData={parsedData}
          pdfTheme={pdfTheme}
          scenarioTitle={scenarioTitle}
          reportDate={formattedDate}
          reportHash={reportHash}
        />
      )}

      <PDFAnalysisPage
        scenarioTitle={scenarioTitle}
        formattedDate={formattedDate}
        reportHash={reportHash}
        timestamp={timestamp}
        analysisLines={analysisLines}
        formData={formData}
        hasParams={hasParams}
        styles={styles}
        colors={colors}
      />
    </Document>
  );
};

export default PDFReportDocument;
