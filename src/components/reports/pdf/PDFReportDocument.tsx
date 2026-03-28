import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { PDFDashboardPages } from "./PDFDashboardVisuals";
import { extractDashboardData, stripDashboardData } from "@/lib/dashboard-data-parser";
import { DashboardType } from "@/lib/dashboard-mappings";
import type { PdfThemeMode } from "./dashboardVisuals/theme";

// ── FIX 1: Strip ALL markdown from AI text ──

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1")   // bold+italic
    .replace(/\*\*(.*?)\*\*/g, "$1")        // bold
    .replace(/\*(.*?)\*/g, "$1")            // italic
    .replace(/__(.*?)__/g, "$1")            // underline-bold
    .replace(/_(.*?)_/g, "$1")              // underline-italic
    .replace(/~~(.*?)~~/g, "$1")            // strikethrough
    .replace(/`(.*?)`/g, "$1")              // inline code
    .replace(/^#{1,6}\s+/gm, "")           // heading markers
    .replace(/^[-*+]\s+/gm, "")            // bullet markers
    .replace(/^- \[[ x]\]\s*/gm, "")       // checkbox syntax (Fix 4)
    .replace(/^\d+\.\s+/gm, "")            // numbered list prefix
    .trim();
}

/** Render body text with inline currency/% values bolded.
 *  Handles ranges like "7-12%", "€42.50-€55.00", "$10-$20" and
 *  adds a thin space between currency symbols and numbers. */
function renderBodyText(text: string, baseStyle: Record<string, unknown>): ReactElement {
  const stripped = stripMarkdown(text);
  // Match: ranges (7-12%, €10-€20), standalone currency (€42.50), standalone % (12%)
  const valueRe = /([€$£][\d,.]+(?:\.\d+)?(?:\s*[-–]\s*[€$£]?[\d,.]+(?:\.\d+)?)?%?|[\d,.]+(?:\.\d+)?(?:\s*[-–]\s*[\d,.]+(?:\.\d+)?)?%)/g;
  const parts = stripped.split(valueRe);

  if (parts.length === 1) {
    return <Text style={baseStyle}>{stripped}</Text>;
  }

  return (
    <Text style={baseStyle}>
      {parts.map((part, i) => {
        const isValue = valueRe.lastIndex = 0, valueRe.test(part);
        if (!isValue) return <Text key={i}>{part}</Text>;
        // Add thin space between currency symbol and digits
        const spaced = part.replace(/([€$£])([\d])/g, "$1\u2009$2");
        return <Text key={i} style={{ fontFamily: "Helvetica-Bold" }}>{spaced}</Text>;
      })}
    </Text>
  );
}

// ── FIX 2: Report title without "Analysis Analysis" ──

function getReportTitle(scenarioName: string): string {
  const suffixes = ["Analysis", "Report", "Review", "Assessment", "Evaluation", "Audit"];
  const alreadyHasSuffix = suffixes.some(s => scenarioName.trim().endsWith(s));
  return alreadyHasSuffix ? scenarioName.trim() : `${scenarioName.trim()} Analysis`;
}

// ── FIX 5: Spacing constants ──

const SP = {
  sectionGap: 32,
  subSectionGap: 24,
  afterHeadingLine: 16,
  afterSubHeading: 8,
  betweenItems: 16,
  betweenParagraphs: 10,
  pageTopMargin: 56,
  pageSideMargin: 48,
  pageBottomMargin: 64,
};

// ── FIX 6: Parse risk severity ──

function parseRiskSeverity(text: string): { severity: string; cleanText: string } {
  const match = text.match(/\s*\((High|Medium|Low)\s+Impact\)/i)
    || text.match(/\s*\((Critical|High|Medium|Low)\)/i);
  return {
    severity: match ? match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() : "Medium",
    cleanText: text
      .replace(/\s*\((High|Medium|Low)\s+Impact\)\s*/i, "")
      .replace(/\s*\((Critical|High|Medium|Low)\)\s*/i, "")
      .trim(),
  };
}

function riskSeverityColor(severity: string): string {
  if (/high|critical/i.test(severity)) return C.destructive;
  if (/medium/i.test(severity)) return C.warning;
  return C.success;
}

// ── FIX 7: Parse next step title/description ──

function parseNextStep(text: string): { title: string; description: string } {
  const colonIndex = text.indexOf(":");
  if (colonIndex > 0 && colonIndex < 50) {
    return {
      title: stripMarkdown(text.substring(0, colonIndex)).trim(),
      description: stripMarkdown(text.substring(colonIndex + 1)).trim(),
    };
  }
  const sentenceEnd = text.search(/[.!?]\s/);
  if (sentenceEnd > 0) {
    return {
      title: stripMarkdown(text.substring(0, sentenceEnd + 1)).trim(),
      description: stripMarkdown(text.substring(sentenceEnd + 2)).trim(),
    };
  }
  return { title: stripMarkdown(text), description: "" };
}

// ── Parameter summarization ──

function summarizeParameter(value: string, maxWords = 30): string {
  const words = value.trim().split(/\s+/);
  if (words.length <= maxWords) return value.trim();

  const fragments = value.split(/[.•\n]+/).map(s => s.trim()).filter(Boolean);

  const scored = fragments.map(f => {
    let score = 0;
    if (/[\d€$£¥%]/.test(f)) score += 3;
    if (/[A-Z]{2,}/.test(f)) score += 2;
    if (/±|mm|kg|g\b|alloy|CNC|SOC|GDPR|ISO|SaaS|B2B/.test(f)) score += 2;
    score += (f.match(/[A-Z][a-z]+/g) || []).length;
    return { text: f, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const result: string[] = [];
  let wordCount = 0;
  for (const { text } of scored) {
    const tw = text.split(/\s+/).length;
    if (wordCount + tw > maxWords && result.length > 0) break;
    result.push(text);
    wordCount += tw;
  }

  return result.join(", ");
}

// ── Enterprise print palette ──

const C = {
  text: "#1A1A1A",
  heading: "#1B2A4A",
  success: "#15803D",
  warning: "#B45309",
  destructive: "#B91C1C",
  muted: "#6B7280",
  border: "#E5E7EB",
  altRow: "#F9FAFB",
  kpiBg: "#F8FAFC",
  background: "#FFFFFF",
};

// ── Styles ──

const styles = StyleSheet.create({
  // Page layouts
  page: {
    backgroundColor: C.background,
    paddingTop: SP.pageTopMargin,
    paddingLeft: SP.pageSideMargin,
    paddingRight: SP.pageSideMargin,
    paddingBottom: SP.pageBottomMargin,
    fontFamily: "Helvetica",
    color: C.text,
  },
  pageWithHeader: {
    backgroundColor: C.background,
    paddingTop: SP.pageTopMargin,
    paddingLeft: SP.pageSideMargin,
    paddingRight: SP.pageSideMargin,
    paddingBottom: SP.pageBottomMargin,
    fontFamily: "Helvetica",
    color: C.text,
  },

  // Running header
  runningHeader: {
    position: "absolute",
    top: 0,
    left: SP.pageSideMargin,
    right: SP.pageSideMargin,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  runningHeaderLeft: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.heading,
  },
  runningHeaderRight: {
    fontSize: 8,
    color: C.muted,
    fontFamily: "Helvetica",
  },

  // Cover page
  coverSpacer: {
    height: "35%",
  },
  coverBrand: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: C.heading,
    marginBottom: 8,
  },
  coverBrandLine: {
    height: 2,
    backgroundColor: C.heading,
    marginBottom: SP.sectionGap,
    marginHorizontal: 0,
  },
  coverTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.heading,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  coverSubtitle: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 48,
  },
  coverFooterText: {
    fontSize: 10,
    color: C.muted,
    marginBottom: 3,
  },
  coverConfidential: {
    fontSize: 10,
    color: C.warning,
    marginTop: 4,
  },

  // Section titles (Level 1)
  sectionTitleWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: C.border,
    marginTop: SP.sectionGap,
    marginBottom: SP.afterHeadingLine,
    paddingBottom: 6,
  },
  sectionTitleText: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.heading,
  },

  // KPI row
  kpiRow: {
    flexDirection: "row",
    backgroundColor: C.kpiBg,
    marginBottom: SP.subSectionGap,
  },
  kpiCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  kpiDivider: {
    width: 1,
    backgroundColor: C.border,
  },
  kpiValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  kpiContext: {
    fontSize: 7,
    color: C.muted,
  },

  // Numbered list items
  numberedItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SP.betweenItems,
  },
  numberedPrefix: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.heading,
    width: 24,
    marginTop: 1,
  },
  numberedText: {
    flex: 1,
    fontSize: 10,
    color: C.text,
    lineHeight: 1.5,
  },
  numberedTextBold: {
    fontFamily: "Helvetica-Bold",
  },

  // Tables (Fix 3: used for Analysis Parameters too)
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.heading,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tableHeaderParam: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 1,
    width: "35%",
  },
  tableHeaderValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 1,
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: C.altRow,
  },
  tableCellLabel: {
    fontSize: 9,
    color: C.text,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  tableCell: {
    fontSize: 9,
    color: C.text,
    flex: 1,
  },
  tableCellParamLabel: {
    fontSize: 9,
    color: C.text,
    fontFamily: "Helvetica-Bold",
    width: "35%",
  },
  tableCellParamValue: {
    fontSize: 9,
    color: C.text,
    flex: 1,
  },

  // Section content blocks
  section: {
    marginBottom: SP.subSectionGap,
  },
  sectionBlockBase: {
    marginBottom: SP.betweenItems,
  },
  sectionBlockRecommendations: {
    marginBottom: SP.betweenItems,
    borderLeftWidth: 3,
    borderLeftColor: C.heading,
    paddingLeft: 12,
  },
  sectionBlockRisks: {
    marginBottom: SP.betweenItems,
    borderLeftWidth: 3,
    borderLeftColor: C.destructive,
    paddingLeft: 12,
  },
  sectionBlockNextSteps: {
    marginBottom: SP.betweenItems,
  },
  sectionBlockCostDrivers: {
    marginBottom: SP.betweenItems,
  },
  sectionBlockHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.heading,
    marginBottom: SP.afterSubHeading,
  },
  analysisText: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.5,
    marginBottom: SP.betweenParagraphs,
  },
  analysisTextHighlight: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.5,
    marginBottom: SP.betweenParagraphs,
    fontFamily: "Helvetica-Bold",
  },

  // Fix 6: Risk items
  riskItem: {
    flexDirection: "row",
    marginBottom: SP.betweenItems,
  },
  riskSeverity: {
    width: 60,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  riskContent: {
    flex: 1,
  },
  riskName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: C.text,
  },
  riskDescription: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
    marginTop: 4,
    lineHeight: 1.5,
  },

  // Methodology
  methodologyText: {
    fontSize: 10,
    color: C.muted,
    lineHeight: 1.5,
    marginBottom: SP.betweenParagraphs,
  },
  auditTrail: {
    marginTop: SP.betweenParagraphs,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },

  // Divider
  divider: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: SP.subSectionGap,
    marginBottom: SP.subSectionGap,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: SP.pageSideMargin,
    right: SP.pageSideMargin,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: C.muted,
  },

  // TOC
  tocRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
  },
  tocLabel: {
    fontSize: 9,
    color: C.heading,
    fontFamily: "Helvetica-Bold",
    textDecoration: "none",
  },
  tocLeader: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomStyle: "dashed",
    borderBottomColor: C.border,
    marginHorizontal: 10,
    marginBottom: 3,
  },
  tocPageHint: {
    fontSize: 8,
    color: C.muted,
    fontFamily: "Helvetica",
  },
});

// ── Props ──

interface PDFReportDocumentProps {
  scenarioTitle: string;
  analysisResult: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
  pdfTheme?: PdfThemeMode;
}

// ── Helpers ──

const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\s+/gm, "")
    .replace(/^#{1,4}\s*/gm, "")
    .replace(/^- \[[ x]\]\s*/gm, "")
    .trim();
};

const extractExecutiveSummary = (text: string): { findings: string[]; recommendations: string[] } => {
  const lines = text.split("\n").map(cleanMarkdown).filter((l) => l.length > 15);

  const findingPattern = /(\$|€|%|found|indicates?|presents?|analysis|current(ly)?|total|average|estimated|reveals?|shows?)/i;
  const recommendPattern = /\b(target|aim to|recommend|should|negotiate|consider|implement|prioritize|pursue|establish|ensure|leverage|explore)\b/i;

  const findings: string[] = [];
  const recommendations: string[] = [];

  for (const line of lines) {
    if (recommendations.length < 3 && recommendPattern.test(line)) {
      recommendations.push(line);
    } else if (findings.length < 3 && findingPattern.test(line)) {
      findings.push(line);
    }
    if (findings.length >= 3 && recommendations.length >= 3) break;
  }

  if (findings.length === 0 || recommendations.length === 0) {
    const pool = lines.slice(0, 6);
    const mid = Math.ceil(pool.length / 2);
    if (findings.length === 0) findings.push(...pool.slice(0, mid).slice(0, 3));
    if (recommendations.length === 0) recommendations.push(...pool.slice(mid).slice(0, 3));
  }

  return { findings, recommendations };
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ── Section categorization ──

type SectionType = "findings" | "recommendations" | "risks" | "nextSteps" | "costDrivers" | "general";

interface AnalysisSection {
  type: SectionType;
  title: string;
  lines: string[];
}

const sectionPatterns: Record<Exclude<SectionType, "general">, RegExp> = {
  costDrivers: /\b(cost\s*driver|key\s*cost|cost\s*factor|cost\s*breakdown|cost\s*component|cost\s*structure)\b/i,
  findings: /\b(finding|analysis|overview|assessment|current\s*state|summary|market|evaluation)\b/i,
  recommendations: /\b(recommend|action|strateg|approach|should|suggest|advise|optimi[sz])\b/i,
  risks: /\b(risk|challeng|threat|concern|limitation|vulnerabilit|caveat|warning)\b/i,
  nextSteps: /\b(next\s*step|implement|timeline|roadmap|action\s*plan|phase|mileston|rollout)\b/i,
};

const categorizeAnalysisSections = (lines: string[]): AnalysisSection[] => {
  const sections: AnalysisSection[] = [];
  let current: AnalysisSection = { type: "general", title: "Analysis Overview", lines: [] };

  for (const rawLine of lines) {
    const hashMatch = rawLine.match(/^(#{1,4})\s*(.*)$/);
    const cleanLine = cleanMarkdown(rawLine);
    if (!cleanLine) continue;

    const isHeader =
      !!hashMatch ||
      (cleanLine.endsWith(":") && cleanLine.length < 80) ||
      (cleanLine.length < 60 && /^[A-Z]/.test(cleanLine) && !cleanLine.includes("."));

    if (isHeader) {
      if (current.lines.length > 0) sections.push(current);

      let detectedType: SectionType = "general";
      for (const [type, pattern] of Object.entries(sectionPatterns) as [Exclude<SectionType, "general">, RegExp][]) {
        if (pattern.test(cleanLine)) { detectedType = type; break; }
      }

      current = { type: detectedType, title: cleanLine.replace(/:$/, ""), lines: [] };
    } else {
      current.lines.push(cleanLine);
    }
  }

  if (current.lines.length > 0) sections.push(current);
  return sections;
};

const hasMetricHighlight = (text: string): boolean => {
  return /(\$|€|£)\s*[\d,.]+|[\d,.]+\s*%|\b(aim\s+to|target)\b/i.test(text);
};

// ── Report hash ──

const generateReportHash = (title: string, ts: string): string => {
  let hash = 0;
  const str = `${title}-${ts}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 8);
};

// ── KPI extraction ──

function extractSavingsKpi(text: string): string {
  const m = text.match(/(?:savings?|reduce[sd]?|reduction)[^\d\n]{0,20}([\d,.]+\s*%|[€$£]\s*[\d,.]+[KMBkmb]?)/i)
    || text.match(/([\d,.]+\s*%|[€$£]\s*[\d,.]+[KMBkmb]?)[^\d\n]{0,20}(?:savings?|reduction|lower)/i);
  return m ? m[1].trim() : "—";
}

function extractRiskKpi(text: string): string {
  const m = text.match(/\b(critical|high|medium|low)\s*risk\b/i)
    || text.match(/risk\s*(?:level\s*)?[:\-]?\s*(critical|high|medium|low)\b/i);
  if (!m) return "—";
  return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
}

function kpiColor(value: string, type: "savings" | "risk" | "confidence"): string {
  if (value === "—") return C.muted;
  if (type === "savings") return C.success;
  if (type === "risk") {
    if (/high|critical/i.test(value)) return C.destructive;
    if (/medium/i.test(value)) return C.warning;
    return C.success;
  }
  const pct = parseInt(value);
  if (!isNaN(pct)) {
    if (pct >= 80) return C.success;
    if (pct >= 50) return C.warning;
    return C.destructive;
  }
  if (/high/i.test(value)) return C.success;
  if (/medium/i.test(value)) return C.warning;
  return C.destructive;
}

// ── TOC ──

interface TocEntry { label: string; anchor: string; page: number; }

const buildTocEntries = (hasDashboards: boolean, hasParams: boolean, dashboardCount: number): TocEntry[] => {
  const entries: TocEntry[] = [];
  const dashboardPages = hasDashboards ? Math.ceil(dashboardCount / 2) : 0;
  const detailedAnalysisPage = 3 + dashboardPages;

  entries.push({ label: "Executive Summary", anchor: "section-executive-summary", page: 2 });
  if (hasDashboards) entries.push({ label: "Analysis Visualizations", anchor: "section-visualizations", page: 3 });
  entries.push({ label: "Detailed Analysis", anchor: "section-detailed-analysis", page: detailedAnalysisPage });
  entries.push({ label: "Methodology & Limitations", anchor: "section-methodology", page: detailedAnalysisPage });
  if (hasParams) entries.push({ label: "Analysis Parameters", anchor: "section-parameters", page: detailedAnalysisPage });
  return entries;
};

// ── Running header ──

const RunningHeader = ({ reportTitle }: { reportTitle: string }) => (
  <View style={styles.runningHeader} fixed>
    <Text style={styles.runningHeaderLeft}>EXOS</Text>
    <Text style={styles.runningHeaderRight}>{reportTitle}</Text>
  </View>
);

// ── Footer ──

const ReportFooter = ({ dateStr, orgName }: { dateStr: string; orgName: string }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>Confidential — {orgName}</Text>
    <Text style={styles.footerText} render={({ pageNumber }) => `Page ${pageNumber}`} />
    <Text style={styles.footerText}>{dateStr}</Text>
  </View>
);

// ── Component ──

const PDFReportDocument = ({
  scenarioTitle,
  analysisResult,
  formData,
  timestamp,
  selectedDashboards = [],
  pdfTheme = "light",
}: PDFReportDocumentProps) => {
  const parsedData = extractDashboardData(analysisResult);
  const strippedAnalysis = stripDashboardData(analysisResult);
  const { findings, recommendations } = extractExecutiveSummary(strippedAnalysis);
  const analysisLines = strippedAnalysis.split("\n").filter((line) => line.trim());

  const reportHash = generateReportHash(scenarioTitle, timestamp);
  const formattedDate = formatDate(timestamp);
  const hasDashboards = selectedDashboards.length > 0;
  const hasParams = Object.keys(formData).length > 0;
  const tocEntries = buildTocEntries(hasDashboards, hasParams, selectedDashboards.length);
  const showToc = hasDashboards;
  const orgName = formData["organization"] || formData["Organization"] || formData["company"] || formData["Company"] || formData["org"] || "EXOS";

  // KPIs
  const allKeys = Object.keys(formData);
  const filledKeys = allKeys.filter(k => formData[k] && formData[k].trim() !== "");
  const coveragePct = allKeys.length > 0 ? Math.round((filledKeys.length / allKeys.length) * 100) : 0;
  const confidenceLevel = coveragePct >= 80 ? "High" : coveragePct >= 50 ? "Medium" : "Low";
  const savingsKpi = extractSavingsKpi(strippedAnalysis);
  const riskKpi = extractRiskKpi(strippedAnalysis);

  // Subtitle
  const industry = formData["industry"] || formData["Industry"] || formData["sector"] || "";
  const category = formData["category"] || formData["Category"] || formData["product_category"] || formData["productCategory"] || "";
  const subtitle = [industry, category].filter(Boolean).join(" — ");

  // Fix 2: report title
  const reportTitle = getReportTitle(scenarioTitle);

  // All parameters for table (Fix 3)
  const allParamEntries = Object.entries(formData)
    .filter(([_, v]) => v && v.trim() !== "");

  // Analysis inputs for exec summary (first 6)
  const inputEntries = allParamEntries.slice(0, 6);

  return (
    <Document>
      {/* ── Page 1: Cover ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverSpacer} />

        <Text style={styles.coverBrand}>EXOS</Text>
        <View style={styles.coverBrandLine} />

        <Text style={styles.coverTitle}>{reportTitle}</Text>
        {subtitle ? (
          <Text style={styles.coverSubtitle}>{subtitle}</Text>
        ) : (
          <View style={{ height: 48 }} />
        )}

        {/* TOC */}
        {showToc && (
          <View style={{ marginBottom: SP.sectionGap }}>
            {tocEntries.map((entry, i) => (
              <View key={entry.anchor} style={styles.tocRow}>
                <Link src={`#${entry.anchor}`}>
                  <Text style={styles.tocLabel}>{i + 1}. {entry.label}</Text>
                </Link>
                <View style={styles.tocLeader} />
                <Text style={styles.tocPageHint}>p. {entry.page}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom section */}
        <Text style={styles.coverFooterText}>Prepared for {orgName}</Text>
        <Text style={styles.coverFooterText}>{formattedDate}</Text>
        <Text style={styles.coverConfidential}>Confidential</Text>
      </Page>

      {/* ── Page 2: Executive Summary ── */}
      <Page size="A4" style={styles.pageWithHeader} id="section-executive-summary">
        <RunningHeader reportTitle={reportTitle} />

        {/* Section title */}
        <View style={styles.sectionTitleWrapper}>
          <Text style={styles.sectionTitleText}>Executive Summary</Text>
        </View>

        {/* KPI row (Fix 8: wrap={false}) */}
        <View style={styles.kpiRow} wrap={false}>
          <View style={styles.kpiCell}>
            <Text style={{ ...styles.kpiValue, color: kpiColor(savingsKpi, "savings") }}>
              {savingsKpi === "—" ? "Not assessed" : savingsKpi}
            </Text>
            <Text style={styles.kpiLabel}>POTENTIAL SAVINGS</Text>
            <Text style={styles.kpiContext}>Based on analysis inputs</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCell}>
            <Text style={{
              ...styles.kpiValue,
              color: kpiColor(riskKpi, "risk"),
              fontFamily: riskKpi === "—" ? "Helvetica-Oblique" : "Helvetica-Bold",
            }}>
              {riskKpi === "—" ? "Not assessed" : riskKpi}
            </Text>
            <Text style={styles.kpiLabel}>RISK LEVEL</Text>
            <Text style={styles.kpiContext}>Extracted from analysis</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCell}>
            <Text style={{ ...styles.kpiValue, color: kpiColor(confidenceLevel, "confidence") }}>
              {confidenceLevel}
            </Text>
            <Text style={styles.kpiLabel}>CONFIDENCE</Text>
            <Text style={styles.kpiContext}>{coveragePct}% input coverage</Text>
          </View>
        </View>

        {/* Key Findings (Fix 1: stripMarkdown, Fix 8: wrap={false} per item) */}
        <View style={styles.sectionTitleWrapper}>
          <Text style={styles.sectionTitleText}>Key Findings</Text>
        </View>
        {findings.map((point, i) => (
          <View key={`f-${i}`} style={styles.numberedItem} wrap={false}>
            <Text style={styles.numberedPrefix}>{i + 1}.</Text>
            {renderBodyText(point, styles.numberedText)}
          </View>
        ))}

        {/* Recommended Actions (Fix 1, Fix 8) */}
        <View style={styles.sectionTitleWrapper}>
          <Text style={styles.sectionTitleText}>Recommended Actions</Text>
        </View>
        {recommendations.map((point, i) => (
          <View key={`r-${i}`} style={styles.numberedItem} wrap={false}>
            <Text style={styles.numberedPrefix}>{i + 1}.</Text>
            {renderBodyText(point, styles.numberedText)}
          </View>
        ))}

        {/* Analysis Inputs table */}
        {inputEntries.length > 0 && (
          <View wrap={false}>
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionTitleText}>Analysis Inputs</Text>
            </View>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableHeaderText, flex: 1 }}>Parameter</Text>
              <Text style={{ ...styles.tableHeaderText, flex: 1 }}>Value</Text>
            </View>
            {inputEntries.map(([key, value], i) => {
              const label = key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim();
              const rowStyle = i % 2 === 0 ? styles.tableRow : styles.tableRowAlt;
              return (
                <View key={key} style={rowStyle}>
                  <Text style={styles.tableCellLabel}>{label}</Text>
                  <Text style={styles.tableCell}>{summarizeParameter(value, 15)}</Text>
                </View>
              );
            })}
          </View>
        )}

        <ReportFooter dateStr={formattedDate} orgName={orgName} />
      </Page>

      {/* ── Dashboard pages ── */}
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

      {/* ── Detailed Analysis + Methodology + Parameters ── */}
      <Page size="A4" style={styles.pageWithHeader}>
        <RunningHeader reportTitle={reportTitle} />

        {(() => {
          const sections = categorizeAnalysisSections(analysisLines);
          return sections.map((section, si) => {
            // Fix 8: wrap={false} per section block
            return (
              <View key={`section-${si}`} style={{ marginBottom: SP.betweenItems }} wrap={false}>
                {si === 0 && (
                  <View style={styles.sectionTitleWrapper} id="section-detailed-analysis">
                    <Text style={styles.sectionTitleText}>Detailed Analysis</Text>
                  </View>
                )}

                {/* Fix 6: Risk items with severity */}
                {section.type === "risks" ? (
                  <View style={styles.sectionBlockRisks}>
                    <Text style={styles.sectionBlockHeader}>{stripMarkdown(section.title)}</Text>
                    {section.lines.map((line, li) => {
                      const { severity, cleanText } = parseRiskSeverity(line);
                      const colonIdx = cleanText.indexOf(":");
                      const riskName = colonIdx > 0 && colonIdx < 50 ? stripMarkdown(cleanText.slice(0, colonIdx)) : "";
                      const riskDesc = colonIdx > 0 && colonIdx < 50 ? stripMarkdown(cleanText.slice(colonIdx + 1)) : stripMarkdown(cleanText);
                      return (
                        <View key={`l-${li}`} style={styles.riskItem} wrap={false}>
                          <Text style={{ ...styles.riskSeverity, color: riskSeverityColor(severity) }}>
                            {severity}
                          </Text>
                          <View style={styles.riskContent}>
                            {riskName ? <Text style={styles.riskName}>{riskName}</Text> : null}
                            {renderBodyText(riskDesc, styles.riskDescription)}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : section.type === "nextSteps" ? (
                  /* Fix 7: Next steps with numbered title/description */
                  <View style={styles.sectionBlockNextSteps}>
                    <Text style={styles.sectionBlockHeader}>{stripMarkdown(section.title)}</Text>
                    {section.lines.map((line, li) => {
                      const { title, description } = parseNextStep(line);
                      return (
                        <View key={`l-${li}`} style={styles.numberedItem} wrap={false}>
                          <Text style={styles.numberedPrefix}>{li + 1}.</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 4 }}>
                              {title}
                            </Text>
                            {description ? renderBodyText(description, styles.analysisText) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : section.type === "recommendations" ? (
                  <View style={styles.sectionBlockRecommendations}>
                    <Text style={styles.sectionBlockHeader}>{stripMarkdown(section.title)}</Text>
                    {section.lines.map((line, li) => (
                      <View key={`l-${li}`} style={styles.numberedItem} wrap={false}>
                        <Text style={styles.numberedPrefix}>{li + 1}.</Text>
                        {renderBodyText(line, { flex: 1, ...styles.analysisText })}
                      </View>
                    ))}
                  </View>
                ) : (
                  /* General / findings / costDrivers */
                  <View style={section.type === "costDrivers" ? styles.sectionBlockCostDrivers : styles.sectionBlockBase}>
                    <Text style={styles.sectionBlockHeader}>{stripMarkdown(section.title)}</Text>
                    {section.lines.map((line, li) => (
                      renderBodyText(line, styles.analysisText)
                    ))}
                  </View>
                )}
              </View>
            );
          });
        })()}

        {/* ── Methodology & Limitations ── */}
        <View style={styles.section} id="section-methodology" wrap={false}>
          <View style={styles.sectionTitleWrapper}>
            <Text style={styles.sectionTitleText}>Methodology & Limitations</Text>
          </View>
          <Text style={styles.methodologyText}>
            Analysis performed by EXOS Sentinel Pipeline using advanced LLM orchestration with multi-stage validation and grounding. Sources include global industry benchmarks, real-time commodity pricing, and user-provided parameters. This analysis is AI-generated and should be validated by qualified procurement professionals. Cost estimates are indicative based on available data at time of analysis and may vary with market conditions and data completeness.
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 9, color: C.muted }}>
              Input coverage: {filledKeys.length}/{allKeys.length > 0 ? allKeys.length : 1} fields ({coveragePct}%)
            </Text>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: kpiColor(confidenceLevel, "confidence") }}>
              {confidenceLevel} Confidence
            </Text>
          </View>
          <View style={styles.auditTrail}>
            <Text style={{ fontSize: 7, color: C.muted }}>
              Analysis ID: {reportHash} | Timestamp: {new Date(timestamp).toISOString()}
            </Text>
          </View>
        </View>

        {/* Fix 3: Analysis Parameters as table, not pills */}
        {hasParams && (
          <View style={styles.section} id="section-parameters" wrap={false}>
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionTitleText}>Analysis Parameters</Text>
            </View>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderParam}>Parameter</Text>
              <Text style={styles.tableHeaderValue}>Value</Text>
            </View>
            {allParamEntries.map(([key, value], i) => {
              const label = key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim();
              const rowStyle = i % 2 === 0 ? styles.tableRow : styles.tableRowAlt;
              return (
                <View key={key} style={rowStyle}>
                  <Text style={styles.tableCellParamLabel}>{label}</Text>
                  <Text style={styles.tableCellParamValue}>{value}</Text>
                </View>
              );
            })}
          </View>
        )}

        <ReportFooter dateStr={formattedDate} orgName={orgName} />
      </Page>
    </Document>
  );
};

export default PDFReportDocument;
