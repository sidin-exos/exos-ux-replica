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
import { extractDashboardData, stripDashboardData, isStructuredOutput } from "@/lib/dashboard-data-parser";
import { DashboardType } from "@/lib/dashboard-mappings";
import type { PdfThemeMode, PdfColorSet } from "./dashboardVisuals/theme";
import { getPdfColors } from "./dashboardVisuals/theme";
import type { ExosOutput } from "@/lib/sentinel/types";

// ── FIX 1: Strip ALL markdown from AI text ──

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^- \[[ x]\]\s*/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .trim();
}

function renderBodyText(text: string, baseStyle: Record<string, unknown>): ReactElement {
  const stripped = stripMarkdown(text);
  const valueRe = /([€$£][\d,.]+(?:\.\d+)?(?:\s*[-–]\s*[€$£]?[\d,.]+(?:\.\d+)?)?%?|[\d,.]+(?:\.\d+)?(?:\s*[-–]\s*[\d,.]+(?:\.\d+)?)?%)/g;
  const parts = stripped.split(valueRe);

  if (parts.length === 1) {
    return <Text style={baseStyle}>{stripped}</Text>;
  }

  return (
    <Text style={baseStyle}>
      {parts.map((part, i) => {
        const testRe = /([€$£][\d,.]+(?:\.\d+)?(?:\s*[-–]\s*[€$£]?[\d,.]+(?:\.\d+)?)?%?|[\d,.]+(?:\.\d+)?(?:\s*[-–]\s*[\d,.]+(?:\.\d+)?)?%)/;
        const isValue = testRe.test(part);
        if (!isValue) return <Text key={i}>{part}</Text>;
        const spaced = part.replace(/([€$£])([\d])/g, "$1\u2009$2");
        return <Text key={i} style={{ fontFamily: "Helvetica-Bold" }}>{spaced}</Text>;
      })}
    </Text>
  );
}

function getReportTitle(scenarioName: string): string {
  const name = scenarioName.trim();
  if (name.toLowerCase().endsWith("report")) return name;
  const base = name.replace(/\s*Analysis\s*$/i, "").replace(/\s*Report\s*$/i, "").trim();
  return `${base} Analysis Report`;
}

function getScenarioTypeLabel(scenarioName: string): string {
  return scenarioName.replace(/\s*Analysis\s*$/i, "").trim().toUpperCase();
}

// ── Spacing constants ──

const SP = {
  sectionGap: 28,
  subSectionGap: 20,
  afterHeadingLine: 14,
  afterSubHeading: 8,
  betweenItems: 14,
  betweenParagraphs: 10,
  pageTopMargin: 52,
  pageSideMargin: 44,
  pageBottomMargin: 60,
};

// ── Risk parsing ──

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

function riskSeverityColor(severity: string, c: PdfColorSet): string {
  if (/critical/i.test(severity)) return c.riskCritical;
  if (/high/i.test(severity)) return c.riskHigh;
  if (/medium/i.test(severity)) return c.riskMedium;
  return c.success;
}

function riskBorderColor(severity: string, c: PdfColorSet): string {
  return riskSeverityColor(severity, c);
}

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

// ── Build branded styles ──

function buildStyles(c: PdfColorSet) {
  return StyleSheet.create({
    // Page layouts
    page: {
      backgroundColor: c.background,
      paddingTop: SP.pageTopMargin,
      paddingLeft: SP.pageSideMargin,
      paddingRight: SP.pageSideMargin,
      paddingBottom: SP.pageBottomMargin,
      fontFamily: "Helvetica",
      color: c.text,
    },
    pageWithHeader: {
      backgroundColor: c.background,
      paddingTop: SP.pageTopMargin,
      paddingLeft: SP.pageSideMargin,
      paddingRight: SP.pageSideMargin,
      paddingBottom: SP.pageBottomMargin,
      fontFamily: "Helvetica",
      color: c.text,
    },

    // Branded teal header bar
    headerBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 36,
      backgroundColor: c.primary,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SP.pageSideMargin,
    },
    headerBarLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerBarBrand: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: c.textOnPrimary,
      marginRight: 12,
    },
    headerBarScenario: {
      fontSize: 8,
      fontFamily: "Helvetica",
      color: c.textOnPrimary,
      opacity: 0.9,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    headerBarRight: {
      fontSize: 8,
      color: c.textOnPrimary,
      opacity: 0.85,
    },

    // Cover page
    coverSpacer: {
      height: "4%",
    },
    coverLeftStripe: {
      position: "absolute",
      top: 36,
      left: 0,
      width: 5,
      bottom: 50,
      backgroundColor: c.primary,
    },
    coverScenarioBadge: {
      backgroundColor: c.primary,
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderRadius: 12,
      alignSelf: "flex-start",
      marginBottom: 16,
    },
    coverScenarioBadgeText: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: c.textOnPrimary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    coverTitle: {
      fontSize: 22,
      fontFamily: "Helvetica-Bold",
      color: c.text,
      marginBottom: 12,
      lineHeight: 1.2,
    },
    coverDivider: {
      height: 1,
      backgroundColor: c.border,
      marginBottom: 10,
    },
    coverMetaRow: {
      flexDirection: "row",
      marginBottom: 24,
    },
    coverMetaCol: {
      flex: 1,
    },
    coverMetaLabel: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4,
    },
    coverMetaValue: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: c.text,
    },

    // TOC box
    tocBox: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 4,
      padding: 14,
      marginBottom: 24,
    },
    tocTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: c.primary,
      marginBottom: 8,
    },
    tocRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 3,
    },
    tocNumber: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: c.primary,
      width: 20,
    },
    tocLabel: {
      fontSize: 9,
      color: c.text,
      flex: 1,
      textDecoration: "none",
    },
    tocPageHint: {
      fontSize: 8,
      color: c.textMuted,
    },

    // Cover bottom badges
    coverBadgeRow: {
      position: "absolute",
      bottom: 50,
      left: SP.pageSideMargin,
    },
    coverBadge: {
      marginBottom: 4,
    },
    coverBadgeLabel: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    coverBadgeValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
    },

    // Bottom color stripe
    bottomStripe: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 10,
      flexDirection: "row",
    },
    stripeSegment: {
      flex: 1,
      height: 10,
    },

    // Section badge (rounded pill)
    sectionBadge: {
      backgroundColor: c.primary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 10,
      alignSelf: "flex-start",
      marginBottom: 10,
    },
    sectionBadgeText: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: c.textOnPrimary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },

    // Section titles
    sectionTitleWrapperCompact: {
      marginBottom: 8,
      paddingBottom: 4,
    },
    sectionTitleWrapper: {
      marginBottom: SP.afterHeadingLine,
      paddingBottom: 6,
    },
    sectionTitleText: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: c.text,
    },
    sectionTitleLine: {
      height: 2,
      backgroundColor: c.primary,
      marginTop: 6,
    },

    // Finding cards (3-column)
    findingCardsRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    findingCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderLeftWidth: 3,
      padding: 8,
      marginRight: 5,
    },
    findingCardLast: {
      marginRight: 0,
    },
    findingCardNumber: {
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 6,
    },
    findingCardNumberText: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: c.textOnPrimary,
    },
    findingCardTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: c.text,
      marginBottom: 4,
    },
    findingCardBody: {
      fontSize: 8,
      color: c.textMuted,
      lineHeight: 1.4,
    },

    // Action items
    actionItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: c.surface,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
      padding: 7,
      marginBottom: 5,
    },
    actionNumber: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    actionNumberText: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: c.textOnPrimary,
    },
    actionContent: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: c.text,
      marginBottom: 3,
    },
    actionBody: {
      fontSize: 9,
      color: c.textMuted,
      lineHeight: 1.5,
    },

    // KPI row (footer table)
    kpiRow: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 4,
      marginTop: 8,
    },
    kpiCell: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 6,
      alignItems: "center",
      borderRightWidth: 1,
      borderRightColor: c.border,
    },
    kpiCellLast: {
      borderRightWidth: 0,
    },
    kpiLabel: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4,
    },
    kpiValue: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: c.primary,
    },

    // Analysis blocks
    analysisBlock: {
      backgroundColor: c.surface,
      borderLeftWidth: 4,
      padding: 14,
      marginBottom: 12,
    },
    analysisBlockBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 8,
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    analysisBlockBadgeText: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: c.textOnPrimary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    analysisText: {
      fontSize: 9,
      color: c.text,
      lineHeight: 1.6,
      marginBottom: SP.betweenParagraphs,
    },

    // Confidence footer
    confidenceBar: {
      backgroundColor: c.surface,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
      padding: 10,
      marginTop: 16,
    },

    // Recommendation cards
    recoCard: {
      backgroundColor: c.surface,
      borderLeftWidth: 4,
      padding: 12,
      marginBottom: 10,
    },
    recoTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: c.text,
      marginBottom: 4,
    },
    recoBody: {
      fontSize: 9,
      color: c.textMuted,
      lineHeight: 1.5,
    },

    // Risk items
    riskItem: {
      backgroundColor: c.surface,
      borderLeftWidth: 4,
      padding: 12,
      marginBottom: 10,
    },
    riskBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    riskBadgeText: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: c.textOnPrimary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    riskTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: c.text,
      marginBottom: 4,
    },
    riskDescription: {
      fontSize: 9,
      color: c.textMuted,
      lineHeight: 1.5,
    },

    // Parameters page
    paramCard: {
      flexDirection: "row",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 4,
      marginBottom: 10,
      overflow: "hidden",
    },
    paramLabel: {
      width: "30%",
      backgroundColor: c.surfaceLight,
      padding: 12,
      justifyContent: "center",
    },
    paramLabelText: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: c.primary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    paramValue: {
      flex: 1,
      padding: 12,
    },
    paramValueText: {
      fontSize: 9,
      color: c.text,
      lineHeight: 1.5,
    },

    // Methodology box
    methodologyBox: {
      backgroundColor: c.surfaceLight,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
      padding: 14,
      marginTop: 16,
    },
    methodologyTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: c.text,
      marginBottom: 6,
    },
    methodologyText: {
      fontSize: 9,
      color: c.textMuted,
      lineHeight: 1.5,
    },

    // Stats footer table
    statsTable: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 4,
      marginTop: 16,
    },
    statsCell: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 8,
      alignItems: "center",
      borderRightWidth: 1,
      borderRightColor: c.border,
    },
    statsCellLast: {
      borderRightWidth: 0,
    },
    statsLabel: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    statsValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: c.primary,
    },

    // Footer
    footer: {
      position: "absolute",
      bottom: 16,
      left: SP.pageSideMargin,
      right: SP.pageSideMargin,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 6,
    },
    footerText: {
      fontSize: 8,
      color: c.textMuted,
    },

    // Vertical label (cover page left margin)
    verticalLabel: {
      position: "absolute",
      top: "45%",
      left: 10,
      transform: "rotate(-90deg)",
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 2,
    },

    // Sub heading
    subHeading: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: c.text,
      marginBottom: 8,
    },
  });
}

// ── Props ──

interface PDFReportDocumentProps {
  scenarioTitle: string;
  analysisResult: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
  pdfTheme?: PdfThemeMode;
  evaluationScore?: number;
  evaluationConfidence?: string;
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
    if (recommendations.length < 4 && recommendPattern.test(line)) {
      recommendations.push(line);
    } else if (findings.length < 3 && findingPattern.test(line)) {
      findings.push(line);
    }
    if (findings.length >= 3 && recommendations.length >= 4) break;
  }
  if (findings.length === 0 || recommendations.length === 0) {
    const pool = lines.slice(0, 7);
    const mid = Math.ceil(pool.length / 2);
    if (findings.length === 0) findings.push(...pool.slice(0, mid).slice(0, 3));
    if (recommendations.length === 0) recommendations.push(...pool.slice(mid).slice(0, 4));
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

// ── Report hash ──

const generateReportHash = (title: string, ts: string): string => {
  let hash = 0;
  const str = `${title}-${ts}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
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

function kpiColor(value: string, type: "savings" | "risk" | "confidence", c: PdfColorSet): string {
  if (value === "—") return c.textMuted;
  if (type === "savings") return c.success;
  if (type === "risk") {
    if (/high|critical/i.test(value)) return c.destructive;
    if (/medium/i.test(value)) return c.warning;
    return c.success;
  }
  const pct = parseInt(value);
  if (!isNaN(pct)) {
    if (pct >= 80) return c.success;
    if (pct >= 50) return c.warning;
    return c.destructive;
  }
  if (/high/i.test(value)) return c.success;
  if (/medium/i.test(value)) return c.warning;
  return c.destructive;
}

// ── TOC ──

interface TocEntry { label: string; anchor: string; page: number; }

const buildTocEntries = (hasDashboards: boolean, hasParams: boolean, dashboardCount: number): TocEntry[] => {
  const entries: TocEntry[] = [];
  let page = 1;
  entries.push({ label: "Executive Summary", anchor: "section-executive-summary", page });
  page++;
  if (hasDashboards) {
    entries.push({ label: "Analysis Visualizations", anchor: "section-visualizations", page });
    page += Math.ceil(dashboardCount / 2);
  }
  entries.push({ label: "Detailed Analysis", anchor: "section-detailed-analysis", page });
  page++;
  entries.push({ label: "Recommendations & Risks", anchor: "section-recs-risks", page });
  if (hasParams) {
    page++;
    entries.push({ label: "Analysis Parameters", anchor: "section-parameters", page });
  }
  return entries;
};

// ── Accent color by index ──

function accentColor(index: number, c: PdfColorSet): string {
  const accents = [c.accent1, c.accent2, c.accent3, c.accent4, c.primary, c.primaryDark];
  return accents[index % accents.length];
}

// ── Branded Header Bar ──

const BrandedHeaderBar = ({ scenarioLabel, dateStr, c }: { scenarioLabel: string; dateStr: string; c: PdfColorSet }) => {
  const s = buildStyles(c);
  return (
    <View style={s.headerBar} fixed>
      <View style={s.headerBarLeft}>
        <Text style={s.headerBarBrand}>EXOS</Text>
        <Text style={s.headerBarScenario}>{scenarioLabel}</Text>
      </View>
      <Text style={s.headerBarRight}>Confidential · {dateStr}</Text>
    </View>
  );
};

// ── Branded Footer ──

const BrandedFooter = ({ dateStr, orgName, c }: { dateStr: string; orgName: string; c: PdfColorSet }) => {
  const s = buildStyles(c);
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Confidential — {orgName}</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      <Text style={s.footerText}>EXOS-SENTINEL-PIPELINE</Text>
    </View>
  );
};

// ── Bottom Color Stripe ──

const BottomStripe = ({ c }: { c: PdfColorSet }) => {
  const s = buildStyles(c);
  return (
    <View style={s.bottomStripe}>
      <View style={{ ...s.stripeSegment, backgroundColor: c.stripe1 }} />
      <View style={{ ...s.stripeSegment, backgroundColor: c.stripe2 }} />
      <View style={{ ...s.stripeSegment, backgroundColor: c.stripe3 }} />
      <View style={{ ...s.stripeSegment, backgroundColor: c.stripe4 }} />
      <View style={{ ...s.stripeSegment, backgroundColor: c.stripe5 }} />
      <View style={{ ...s.stripeSegment, backgroundColor: c.stripe6 }} />
    </View>
  );
};

// ── Component ──

const PDFReportDocument = ({
  scenarioTitle,
  analysisResult,
  formData,
  timestamp,
  selectedDashboards = [],
  pdfTheme = "light",
  evaluationScore,
  evaluationConfidence,
}: PDFReportDocumentProps) => {
  const c = getPdfColors(pdfTheme);
  const s = buildStyles(c);
  const parsedData = extractDashboardData(analysisResult);
  const strippedAnalysis = stripDashboardData(analysisResult);
  const { findings, recommendations } = extractExecutiveSummary(strippedAnalysis);
  const analysisLines = strippedAnalysis.split("\n").filter((line) => line.trim());

  const reportHash = generateReportHash(scenarioTitle, timestamp);
  const formattedDate = formatDate(timestamp);
  const hasDashboards = selectedDashboards.length > 0;
  const hasParams = Object.keys(formData).length > 0;
  const tocEntries = buildTocEntries(hasDashboards, hasParams, selectedDashboards.length);
  const orgName = formData["organization"] || formData["Organization"] || formData["company"] || formData["Company"] || formData["org"] || "EXOS";
  const scenarioLabel = getScenarioTypeLabel(scenarioTitle);
  const reportTitle = getReportTitle(scenarioTitle);

  // Input quality
  const allKeys = Object.keys(formData);
  const filledKeys = allKeys.filter(k => formData[k] && formData[k].trim() !== "");
  const coveragePct = evaluationScore ?? (allKeys.length > 0 ? Math.round((filledKeys.length / allKeys.length) * 100) : 0);
  const confidenceLevel = evaluationConfidence
    ? (evaluationConfidence === "HIGH" ? "High" : "Low")
    : (coveragePct >= 80 ? "High" : coveragePct >= 50 ? "Medium" : "Low");

  const allParamEntries = Object.entries(formData).filter(([_, v]) => v && v.trim() !== "");

  // Finding titles extracted from first sentence
  const parseFindingTitle = (text: string): { title: string; body: string } => {
    const stripped = stripMarkdown(text);
    const colonIdx = stripped.indexOf(":");
    if (colonIdx > 0 && colonIdx < 60) {
      return { title: stripped.slice(0, colonIdx).trim(), body: stripped.slice(colonIdx + 1).trim() };
    }
    const words = stripped.split(" ");
    if (words.length > 6) {
      return { title: words.slice(0, 4).join(" "), body: stripped };
    }
    return { title: stripped, body: "" };
  };

  const findingColors = [c.accent1, c.accent2, c.accent4];

  return (
    <Document>
      {/* ── Page 1: Cover + Executive Summary (merged) ── */}
      <Page size="A4" style={s.page} id="section-executive-summary">
        {/* Teal header bar */}
        <View style={{ ...s.headerBar, justifyContent: "space-between" }}>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: c.textOnPrimary }}>
            EXOS · Confidential
          </Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.85 }}>Prepared for EXOS · {formattedDate}</Text>
          </View>
        </View>

        {/* Left teal stripe */}
        <View style={s.coverLeftStripe} />

        <View style={s.coverSpacer} />

        {/* Title */}
        <Text style={s.coverTitle}>{reportTitle}</Text>

        {/* Divider */}
        <View style={s.coverDivider} />

        {/* Key Findings */}
        <View style={s.sectionTitleWrapperCompact}>
          <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: c.text }}>Key Findings</Text>
          <View style={s.sectionTitleLine} />
        </View>

        <View style={s.findingCardsRow}>
          {findings.slice(0, 3).map((point, i) => {
            const { title, body } = parseFindingTitle(point);
            const borderColor = findingColors[i % findingColors.length];
            return (
              <View key={`f-${i}`} style={{ ...s.findingCard, borderLeftColor: borderColor, ...(i === Math.min(findings.length, 3) - 1 ? s.findingCardLast : {}) }}>
                <View style={{ ...s.findingCardNumber, backgroundColor: borderColor }}>
                  <Text style={s.findingCardNumberText}>{i + 1}</Text>
                </View>
                <Text style={s.findingCardTitle}>{title}</Text>
                {body ? <Text style={s.findingCardBody}>{body}</Text> : null}
              </View>
            );
          })}
        </View>

        {/* Recommended Actions */}
        <View style={s.sectionTitleWrapperCompact}>
          <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: c.text }}>Recommended Actions</Text>
          <View style={s.sectionTitleLine} />
        </View>

        {recommendations.slice(0, 4).map((point, i) => {
          const { title, body } = parseFindingTitle(point);
          return (
            <View key={`r-${i}`} style={{ ...s.actionItem, borderLeftColor: accentColor(i, c) }} wrap={false}>
              <View style={{ ...s.actionNumber, backgroundColor: accentColor(i, c) }}>
                <Text style={s.actionNumberText}>{i + 1}</Text>
              </View>
              <View style={s.actionContent}>
                <Text style={s.actionTitle}>{title}</Text>
                {body ? <Text style={s.actionBody}>{body}</Text> : null}
              </View>
            </View>
          );
        })}

        {/* KPI footer */}
        <View style={s.kpiRow}>
          <View style={s.kpiCell}>
            <Text style={s.kpiLabel}>BATNA SCORE</Text>
            <Text style={{ ...s.kpiValue, color: c.primary }}>{coveragePct} / 100</Text>
          </View>
          <View style={s.kpiCell}>
            <Text style={s.kpiLabel}>LEVERAGE</Text>
            <Text style={{ ...s.kpiValue, color: c.primary }}>3-Year Commitment</Text>
          </View>
          <View style={s.kpiCell}>
            <Text style={s.kpiLabel}>SUPPLIER POWER</Text>
            <Text style={{ ...s.kpiValue, color: kpiColor(extractRiskKpi(strippedAnalysis), "risk", c) }}>
              {extractRiskKpi(strippedAnalysis) !== "—" ? extractRiskKpi(strippedAnalysis).toUpperCase() : "N/A"}
            </Text>
          </View>
          <View style={{ ...s.kpiCell, ...s.kpiCellLast }}>
            <Text style={s.kpiLabel}>CONFIDENCE</Text>
            <Text style={{ ...s.kpiValue, color: kpiColor(confidenceLevel, "confidence", c) }}>{confidenceLevel.toUpperCase()}</Text>
          </View>
        </View>

        {/* Footer */}
        <BrandedFooter dateStr={formattedDate} orgName={orgName} c={c} />

        {/* Bottom color stripe */}
        <BottomStripe c={c} />
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

      {/* ── Detailed Analysis ── */}
      <Page size="A4" style={s.pageWithHeader} id="section-detailed-analysis">
        <BrandedHeaderBar scenarioLabel={scenarioLabel} dateStr={formattedDate} c={c} />

        <View style={s.sectionBadge}>
          <Text style={s.sectionBadgeText}>DETAILED ANALYSIS</Text>
        </View>
        <View style={s.sectionTitleWrapper}>
          <Text style={s.sectionTitleText}>Analysis Overview</Text>
          <View style={s.sectionTitleLine} />
        </View>

        {(() => {
          const sections = categorizeAnalysisSections(analysisLines);
          const blockColors = [c.destructive, c.accent3, c.accent2, c.primary, c.accent4];
          return sections.map((section, si) => {
            if (section.type === "recommendations" || section.type === "risks") return null;
            const blockColor = blockColors[si % blockColors.length];
            return (
              <View key={`section-${si}`} style={{ ...s.analysisBlock, borderLeftColor: blockColor }} wrap={false}>
                <View style={{ ...s.analysisBlockBadge, backgroundColor: blockColor }}>
                  <Text style={s.analysisBlockBadgeText}>{stripMarkdown(section.title).toUpperCase()}</Text>
                </View>
                {section.lines.map((line, li) => renderBodyText(line, s.analysisText))}
              </View>
            );
          });
        })()}

        {/* Confidence footer */}
        {(() => {
          const sections = categorizeAnalysisSections(analysisLines);
          const confidenceLines = strippedAnalysis.match(/confidence\s*level.*$/gim);
          if (!confidenceLines || confidenceLines.length === 0) return null;
          return (
            <View style={s.confidenceBar} wrap={false}>
              {confidenceLines.map((line, i) => (
                <Text key={i} style={{ fontSize: 9, color: c.text, lineHeight: 1.5 }}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Confidence Level: </Text>
                  {stripMarkdown(line.replace(/confidence\s*level[:\s]*/i, ""))}
                </Text>
              ))}
            </View>
          );
        })()}

        <BrandedFooter dateStr={formattedDate} orgName={orgName} c={c} />
      </Page>

      {/* ── Recommendations & Risks ── */}
      <Page size="A4" style={s.pageWithHeader} id="section-recs-risks">
        <BrandedHeaderBar scenarioLabel={scenarioLabel} dateStr={formattedDate} c={c} />

        <View style={s.sectionBadge}>
          <Text style={s.sectionBadgeText}>RECOMMENDATIONS & RISKS</Text>
        </View>

        {/* Recommendations */}
        <View style={s.sectionTitleWrapper}>
          <Text style={s.sectionTitleText}>Recommendations</Text>
          <View style={s.sectionTitleLine} />
        </View>

        {(() => {
          const sections = categorizeAnalysisSections(analysisLines);
          const recoSections = sections.filter(s => s.type === "recommendations");
          const recoLines = recoSections.flatMap(s => s.lines);
          const displayLines = recoLines.length > 0 ? recoLines : recommendations;
          const recoAccents = [c.primary, c.accent2, c.accent3, c.accent4];

          return displayLines.slice(0, 6).map((line, i) => {
            const { title, body } = parseFindingTitle(line);
            return (
              <View key={`reco-${i}`} style={{ ...s.recoCard, borderLeftColor: recoAccents[i % recoAccents.length] }} wrap={false}>
                <Text style={s.recoTitle}>{title}</Text>
                {body ? <Text style={s.recoBody}>{body}</Text> : null}
              </View>
            );
          });
        })()}

        {/* Risk Register */}
        <View style={{ ...s.sectionTitleWrapper, marginTop: 16 }}>
          <Text style={s.sectionTitleText}>Risk Register</Text>
          <View style={{ ...s.sectionTitleLine, backgroundColor: c.destructive }} />
        </View>

        {(() => {
          const sections = categorizeAnalysisSections(analysisLines);
          const riskSections = sections.filter(s => s.type === "risks");
          const riskLines = riskSections.flatMap(s => s.lines);
          if (riskLines.length === 0) return null;

          return riskLines.slice(0, 5).map((line, i) => {
            const { severity, cleanText } = parseRiskSeverity(line);
            const colonIdx = cleanText.indexOf(":");
            const riskName = colonIdx > 0 && colonIdx < 50 ? stripMarkdown(cleanText.slice(0, colonIdx)) : "";
            const riskDesc = colonIdx > 0 && colonIdx < 50 ? stripMarkdown(cleanText.slice(colonIdx + 1)) : stripMarkdown(cleanText);
            const sevColor = riskSeverityColor(severity, c);

            return (
              <View key={`risk-${i}`} style={{ ...s.riskItem, borderLeftColor: sevColor }} wrap={false}>
                <View style={{ ...s.riskBadge, backgroundColor: sevColor }}>
                  <Text style={s.riskBadgeText}>{severity.toUpperCase()}</Text>
                </View>
                {riskName ? <Text style={s.riskTitle}>{riskName}</Text> : null}
                <Text style={s.riskDescription}>{riskDesc}</Text>
              </View>
            );
          });
        })()}

        <BrandedFooter dateStr={formattedDate} orgName={orgName} c={c} />
      </Page>

      {/* ── Analysis Parameters ── */}
      {hasParams && (
        <Page size="A4" style={s.pageWithHeader} id="section-parameters">
          <BrandedHeaderBar scenarioLabel={scenarioLabel} dateStr={formattedDate} c={c} />

          <View style={s.sectionBadge}>
            <Text style={s.sectionBadgeText}>ANALYSIS PARAMETERS</Text>
          </View>
          <View style={s.sectionTitleWrapper}>
            <Text style={s.sectionTitleText}>Input Parameters</Text>
            <View style={s.sectionTitleLine} />
          </View>

          {allParamEntries.map(([key, value]) => {
            const label = key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim().toUpperCase();
            return (
              <View key={key} style={s.paramCard} wrap={false}>
                <View style={s.paramLabel}>
                  <Text style={s.paramLabelText}>{label}</Text>
                </View>
                <View style={s.paramValue}>
                  <Text style={s.paramValueText}>{summarizeParameter(value)}</Text>
                </View>
              </View>
            );
          })}

          {/* Methodology box */}
          <View style={s.methodologyBox} wrap={false}>
            <Text style={s.methodologyTitle}>Methodology & Limitations</Text>
            <Text style={s.methodologyText}>
              Analysis performed by EXOS Sentinel Pipeline using advanced LLM orchestration with multi-stage validation and grounding. Sources include global industry benchmarks, real-time commodity pricing, and user-provided parameters. This analysis is AI-generated and should be validated by qualified procurement professionals.
            </Text>
          </View>

          {/* Stats footer */}
          <View style={s.statsTable}>
            <View style={s.statsCell}>
              <Text style={s.statsLabel}>Input Quality Score</Text>
              <Text style={{ ...s.statsValue, color: kpiColor(String(coveragePct), "confidence", c) }}>{coveragePct}/100</Text>
            </View>
            <View style={s.statsCell}>
              <Text style={s.statsLabel}>Confidence</Text>
              <Text style={{ ...s.statsValue, color: kpiColor(confidenceLevel, "confidence", c) }}>{confidenceLevel.toUpperCase()}</Text>
            </View>
            <View style={s.statsCell}>
              <Text style={s.statsLabel}>Analysis ID</Text>
              <Text style={s.statsValue}>{reportHash}</Text>
            </View>
            <View style={s.statsCell}>
              <Text style={s.statsLabel}>Timestamp</Text>
              <Text style={s.statsValue}>{new Date(timestamp).toISOString()}</Text>
            </View>
            <View style={{ ...s.statsCell, ...s.statsCellLast }}>
              <Text style={s.statsLabel}>Pipeline</Text>
              <Text style={s.statsValue}>EXOS-SENTINEL</Text>
            </View>
          </View>

          <BrandedFooter dateStr={formattedDate} orgName={orgName} c={c} />
        </Page>
      )}
    </Document>
  );
};

export default PDFReportDocument;
