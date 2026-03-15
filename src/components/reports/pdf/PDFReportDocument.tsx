import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from "@react-pdf/renderer";
import exosLogoDark from "@/assets/logo-concept-layers.png";
import exosLogoLight from "@/assets/logo-concept-layers-light.png";
import { PDFDashboardPages } from "./PDFDashboardVisuals";
import { extractDashboardData, stripDashboardData } from "@/lib/dashboard-data-parser";
import { DashboardType } from "@/lib/dashboard-mappings";
import type { PdfThemeMode } from "./dashboardVisuals/theme";

// ── Parameter summarization ──

/**
 * Condenses a long parameter value into max 30 words.
 * Extracts key information-dense fragments (numbers, proper nouns, technical terms).
 */
function summarizeParameter(value: string, maxWords = 30): string {
  const words = value.trim().split(/\s+/);
  if (words.length <= maxWords) return value.trim();

  // Split into fragments by sentences or bullet separators
  const fragments = value.split(/[.•\n]+/).map(s => s.trim()).filter(Boolean);

  // Score fragments: prefer those with numbers, currencies, uppercase words, technical terms
  const scored = fragments.map(f => {
    let score = 0;
    if (/[\d€$£¥%]/.test(f)) score += 3; // numbers/currencies
    if (/[A-Z]{2,}/.test(f)) score += 2; // acronyms
    if (/±|mm|kg|g\b|alloy|CNC|SOC|GDPR|ISO|SaaS|B2B/.test(f)) score += 2; // technical
    score += (f.match(/[A-Z][a-z]+/g) || []).length; // proper nouns
    return { text: f, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Collect top fragments until we hit word limit
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

// ── Color palettes ──

const darkColors = {
  primary: "#6b9e8a",
  primaryDark: "#5a8a76",
  background: "#1e1e2e",
  surface: "#262637",
  surfaceLight: "#2f2f42",
  text: "#d4d4dc",
  textMuted: "#8b8b9e",
  textSemiTransparent: "rgba(212, 212, 220, 0.6)",
  accent: "#6b9e8a",
  success: "#6bbf8a",
  warning: "#c9a24d",
  destructive: "#c06060",
  border: "#3a3a4e",
  footerBrand: "rgba(212, 212, 220, 0.35)",
  gradientLayer1: "#232338",
  gradientLayer2: "rgba(107, 158, 138, 0.06)",
  gradientLayer3: "#1a1a2a",
};

const lightColors = {
  primary: "#4a8a74",
  primaryDark: "#3d7563",
  background: "#f8f7f4",
  surface: "#ffffff",
  surfaceLight: "#f0efe8",
  text: "#1e1e2e",
  textMuted: "#6b6b7e",
  textSemiTransparent: "rgba(30, 30, 46, 0.5)",
  accent: "#4a8a74",
  success: "#3a9960",
  warning: "#b08930",
  destructive: "#c04040",
  border: "#d8d8e0",
  footerBrand: "rgba(30, 30, 46, 0.25)",
  gradientLayer1: "#f5f4f0",
  gradientLayer2: "rgba(74, 138, 116, 0.04)",
  gradientLayer3: "#efeeea",
};

type DocColors = typeof darkColors;

function getDocColors(mode?: PdfThemeMode): DocColors {
  return mode === "light" ? lightColors : darkColors;
}

function getDocLogo(mode?: PdfThemeMode) {
  return mode === "light" ? exosLogoLight : exosLogoDark;
}

// ── Style factory ──

function buildDocStyles(c: DocColors) {
  return StyleSheet.create({
    page: {
      backgroundColor: c.background,
      padding: 40,
      fontFamily: "Helvetica",
      color: c.text,
    },
    pageWithHeader: {
      backgroundColor: c.background,
      paddingTop: 50,
      paddingLeft: 40,
      paddingRight: 40,
      paddingBottom: 40,
      fontFamily: "Helvetica",
      color: c.text,
    },
    runningHeader: {
      position: "absolute",
      top: 0,
      left: 40,
      right: 40,
      paddingTop: 10,
      paddingBottom: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    runningHeaderText: {
      fontSize: 8,
      color: c.textMuted,
      fontFamily: "Helvetica",
    },
    tocSection: {
      marginBottom: 10,
    },
    tocRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 3,
    },
    tocLabel: {
      fontSize: 9,
      color: c.primary,
      fontFamily: "Helvetica-Bold",
      textDecoration: "none",
    },
    tocLeader: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomStyle: "dashed",
      borderBottomColor: c.border + "60",
      marginHorizontal: 10,
      marginBottom: 3,
    },
    tocPageHint: {
      fontSize: 8,
      color: c.textMuted,
      fontFamily: "Helvetica",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingBottom: 12,
    },
    logoSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    logoImage: {
      width: 40,
      height: 40,
      marginRight: 12,
    },
    brandName: {
      fontSize: 23,
      fontFamily: "Helvetica-Bold",
      fontWeight: 700,
      color: c.text,
      letterSpacing: 1,
    },
    brandTagline: {
      fontSize: 9,
      color: c.textMuted,
      marginTop: 2,
    },
    reportMeta: {
      textAlign: "right",
    },
    reportBadge: {
      backgroundColor: c.surfaceLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginBottom: 4,
    },
    reportBadgeText: {
      fontSize: 8,
      color: c.primary,
      fontWeight: 600,
    },
    reportDate: {
      fontSize: 9,
      color: c.textMuted,
    },
    titleSection: {
      marginBottom: 14,
    },
    reportTitle: {
      fontSize: 22,
      fontFamily: "Helvetica-Bold",
      fontWeight: 700,
      color: c.primary,
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    reportSubtitle: {
      fontSize: 10,
      color: c.textMuted,
    },
    section: {
      marginBottom: 14,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      fontWeight: 600,
      color: c.text,
      letterSpacing: 0.5,
    },
    sectionContent: {
      backgroundColor: c.surface,
      borderRadius: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    keyPointItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    keyPointBullet: {
      width: 18,
      height: 18,
      backgroundColor: c.success,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 2,
      marginRight: 10,
    },
    keyPointBulletText: {
      color: "#ffffff",
      fontSize: 9,
      fontWeight: 700,
    },
    keyPointText: {
      flex: 1,
      fontSize: 9.5,
      color: c.text,
      lineHeight: 1.4,
    },
    analysisText: {
      fontSize: 12,
      color: c.text,
      lineHeight: 1.6,
      marginBottom: 8,
    },
    analysisTextHighlight: {
      fontSize: 12,
      color: c.primary,
      lineHeight: 1.6,
      marginBottom: 8,
      fontWeight: 700,
      fontFamily: "Courier-Bold",
      backgroundColor: c.primary + "15",
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 3,
    },
    analysisHeader: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      fontWeight: 700,
      color: c.text,
      marginTop: 14,
      marginBottom: 8,
    },
    analysisSubHeader: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      fontWeight: 600,
      color: c.text,
      marginTop: 4,
      marginBottom: 3,
    },
    sectionBlockBase: {
      backgroundColor: c.surface,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 15,
    },
    sectionBlockRecommendations: {
      backgroundColor: c.surface,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
      marginBottom: 15,
    },
    sectionBlockRisks: {
      backgroundColor: c.destructive + "10",
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: c.destructive + "30",
      marginBottom: 15,
    },
    sectionBlockNextSteps: {
      backgroundColor: c.surface,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 15,
    },
    sectionBlockCostDrivers: {
      backgroundColor: c.surfaceLight,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 15,
    },
    sectionBlockHeader: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      fontWeight: 700,
      color: c.text,
      marginBottom: 10,
    },
    parameterBlock: {
      marginBottom: 10,
    },
    parameterLabel: {
      fontSize: 9,
      color: c.textMuted,
      fontFamily: "Helvetica",
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    parameterValue: {
      fontSize: 10,
      color: c.text,
      fontFamily: "Helvetica-Bold",
      lineHeight: 1.4,
    },
    parameterTagRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 4,
      marginTop: 2,
    },
    parameterTag: {
      backgroundColor: c.surfaceLight,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginBottom: 2,
    },
    parameterTagText: {
      fontSize: 9,
      color: c.text,
      fontFamily: "Helvetica-Bold",
    },
    numberedItem: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      marginBottom: 8,
    },
    numberedBullet: {
      width: 20,
      height: 20,
      backgroundColor: c.primary,
      borderRadius: 10,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginRight: 10,
      marginTop: 1,
    },
    numberedBulletText: {
      color: "#ffffff",
      fontSize: 9,
      fontWeight: 700,
    },
    checklistItem: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      marginBottom: 8,
    },
    checkBox: {
      width: 14,
      height: 14,
      borderWidth: 1.5,
      borderColor: c.primary,
      borderRadius: 2,
      marginRight: 10,
      marginTop: 2,
    },
    warningIcon: {
      fontSize: 14,
      marginRight: 6,
    },
    riskHeaderRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginBottom: 10,
    },
    limitationItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    limitationBullet: {
      width: 6,
      height: 6,
      backgroundColor: c.textMuted,
      borderRadius: 3,
      marginTop: 5,
      marginRight: 8,
    },
    limitationText: {
      flex: 1,
      fontSize: 10,
      color: c.textMuted,
      lineHeight: 1.5,
    },
    methodologyBox: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 6,
      padding: 14,
      marginBottom: 12,
    },
    methodologySubHeader: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: c.text,
      marginBottom: 6,
    },
    methodologyText: {
      fontSize: 10,
      fontFamily: "Helvetica",
      color: c.textMuted,
      lineHeight: 1.5,
    },
    auditTrail: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: c.border,
    },
    inputsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    inputItem: {
      width: "48%",
      marginBottom: 8,
      marginRight: 12,
    },
    inputLabel: {
      fontSize: 9,
      color: c.textMuted,
      marginBottom: 2,
      textTransform: "capitalize",
    },
    inputValue: {
      fontSize: 10,
      color: c.text,
      fontFamily: "Courier",
      fontWeight: 600,
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      flexDirection: "column",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 15,
    },
    footerBrand: {
      fontSize: 9,
      fontFamily: "Helvetica",
      color: c.footerBrand,
      fontWeight: 400,
      marginBottom: 8,
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    footerText: {
      fontSize: 9,
      color: c.textMuted,
    },
    pageNumber: {
      fontSize: 9,
      color: c.textMuted,
    },
    accentBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: c.primary,
    },
    gradientLayer1: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: "50%",
      backgroundColor: c.gradientLayer1,
    },
    gradientLayer2: {
      position: "absolute",
      top: "30%",
      left: 0,
      right: 0,
      bottom: "30%",
      backgroundColor: c.gradientLayer2,
    },
    gradientLayer3: {
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.gradientLayer3,
    },
  });
}

const darkDocStyles = buildDocStyles(darkColors);
const lightDocStyles = buildDocStyles(lightColors);

function getDocStyles(mode?: PdfThemeMode) {
  return mode === "light" ? lightDocStyles : darkDocStyles;
}

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

  // Fallback: split first 6 sentences
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
      // Flush previous section if it has lines
      if (current.lines.length > 0) {
        sections.push(current);
      }

      // Detect type from header text
      let detectedType: SectionType = "general";
      for (const [type, pattern] of Object.entries(sectionPatterns) as [Exclude<SectionType, "general">, RegExp][]) {
        if (pattern.test(cleanLine)) {
          detectedType = type;
          break;
        }
      }

      current = { type: detectedType, title: cleanLine.replace(/:$/, ""), lines: [] };
    } else {
      current.lines.push(cleanLine);
    }
  }

  if (current.lines.length > 0) {
    sections.push(current);
  }

  return sections;
};

const hasMetricHighlight = (text: string): boolean => {
  return /(\$|€|£)\s*[\d,.]+|[\d,.]+\s*%|\b(aim\s+to|target)\b/i.test(text);
};

// ── Report hash for traceability ──

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

// ── TOC entries ──

interface TocEntry {
  label: string;
  anchor: string;
  page: number;
}

const buildTocEntries = (hasDashboards: boolean, hasParams: boolean, dashboardCount: number): TocEntry[] => {
  const entries: TocEntry[] = [];
  // Page 1 = cover. Dashboards start on page 2, each page holds ~2 dashboards.
  const dashboardPages = hasDashboards ? Math.ceil(dashboardCount / 2) : 0;
  const detailedAnalysisPage = 2 + dashboardPages;

  if (hasDashboards) entries.push({ label: "Analysis Visualizations", anchor: "section-visualizations", page: 2 });
  entries.push({ label: "Detailed Analysis", anchor: "section-detailed-analysis", page: detailedAnalysisPage });
  entries.push({ label: "Methodology & Limitations", anchor: "section-methodology", page: detailedAnalysisPage });
  
  if (hasParams) entries.push({ label: "Analysis Parameters", anchor: "section-parameters", page: detailedAnalysisPage });
  return entries;
};

// ── Reusable running header ──

const RunningHeader = ({ scenarioTitle, dateStr, styles: s }: { scenarioTitle: string; dateStr: string; styles: ReturnType<typeof buildDocStyles> }) => (
  <View style={s.runningHeader} fixed>
    <Text style={s.runningHeaderText}>EXOS | {scenarioTitle} Analysis</Text>
    <Text style={s.runningHeaderText}>{dateStr}</Text>
  </View>
);

// ── Reusable footer ──

const ReportFooter = ({ reportHash, styles: s }: { reportHash: string; styles: ReturnType<typeof buildDocStyles> }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerBrand}>Powered by EXOS Procurement Intelligence</Text>
    <View style={s.footerRow}>
      <Text style={s.footerText}>
        Confidential • For internal use only
      </Text>
      <Text
        style={s.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages} • ID: ${reportHash}`
        }
      />
    </View>
  </View>
);

// ── Component ──

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
  const exosLogo = getDocLogo(pdfTheme);
  const reportHash = generateReportHash(scenarioTitle, timestamp);
  const formattedDate = formatDate(timestamp);
  const hasDashboards = selectedDashboards.length > 0;
  const hasParams = Object.keys(formData).length > 0;
  const tocEntries = buildTocEntries(hasDashboards, hasParams, selectedDashboards.length);
  const showToc = hasDashboards; // proxy for >3 pages

  return (
    <Document>
      {/* ── Page 1: Cover ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
        <View style={styles.accentBar} />

        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image src={exosLogo} style={styles.logoImage} />
            <View>
              <Text style={styles.brandName}>EXOS</Text>
              <Text style={styles.brandTagline}>YOUR PROCUREMENT EXOSKELETON</Text>
            </View>
          </View>
          <View style={styles.reportMeta}>
            <View style={styles.reportBadge}>
              <Text style={styles.reportBadgeText}>AI-GENERATED REPORT</Text>
            </View>
            <Text style={styles.reportDate}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.reportTitle}>{scenarioTitle} Analysis</Text>
          <Text style={styles.reportSubtitle}>
            Strategic procurement analysis powered by EXOS Procurement Intelligence
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.analysisSubHeader}>Key Findings</Text>
            {findings.map((point, i) => (
              <Text key={`f-${i}`} style={styles.keyPointText}>
                {i + 1}. {point}
              </Text>
            ))}

            <View style={{ height: 6 }} />

            <Text style={styles.analysisSubHeader}>Top Recommendations</Text>
            <View style={{ backgroundColor: colors.warning + "10", borderRadius: 6, padding: 6 }}>
              {recommendations.map((point, i) => (
                <Text key={`r-${i}`} style={{ ...styles.keyPointText, marginBottom: 3 }}>
                  {i + 1}. {point}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Table of Contents */}
        {showToc && (
          <View style={styles.tocSection}>
          <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contents</Text>
            </View>
            <View style={styles.sectionContent}>
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
          </View>
        )}

        <ReportFooter reportHash={reportHash} styles={styles} />
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

      {/* ── Detailed Analysis + Data Quality + Parameters ── */}
      <Page size="A4" style={styles.pageWithHeader}>
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
        <View style={styles.accentBar} />

        <RunningHeader scenarioTitle={scenarioTitle} dateStr={formattedDate} styles={styles} />

        {(() => {
          const sections = categorizeAnalysisSections(analysisLines);
          return sections.map((section, si) => {
            const blockStyle =
              section.type === "recommendations"
                ? styles.sectionBlockRecommendations
                : section.type === "risks"
                ? styles.sectionBlockRisks
                : section.type === "nextSteps"
                ? styles.sectionBlockNextSteps
                : section.type === "costDrivers"
                ? styles.sectionBlockCostDrivers
                : styles.sectionBlockBase;

            return (
              <View key={`section-${si}`} style={{ marginBottom: 15 }} wrap={false}>
                {si === 0 && (
                  <View style={styles.sectionHeader} id="section-detailed-analysis">
                    <View style={{ width: 8, height: 8, backgroundColor: colors.primary, borderRadius: 2, marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>Detailed Analysis</Text>
                  </View>
                )}
                <View style={blockStyle}>
                  {section.type === "risks" ? (
                    <View style={styles.riskHeaderRow}>
                      <Text style={styles.warningIcon}>⚠</Text>
                      <Text style={styles.sectionBlockHeader}>{section.title}</Text>
                    </View>
                  ) : (
                    <Text style={styles.sectionBlockHeader}>{section.title}</Text>
                  )}

                  {section.lines.map((line, li) => {
                    const isHighlight = hasMetricHighlight(line);

                    if (section.type === "recommendations") {
                      return (
                        <View key={`l-${li}`} style={styles.numberedItem}>
                          <View style={styles.numberedBullet}>
                            <Text style={styles.numberedBulletText}>{li + 1}</Text>
                          </View>
                          <Text style={{ flex: 1, ...(isHighlight ? styles.analysisTextHighlight : styles.analysisText) }}>
                            {line}
                          </Text>
                        </View>
                      );
                    }

                    if (section.type === "nextSteps") {
                      return (
                        <View key={`l-${li}`} style={styles.checklistItem}>
                          <View style={styles.checkBox} />
                          <Text style={{ flex: 1, ...(isHighlight ? styles.analysisTextHighlight : styles.analysisText) }}>
                            {line}
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <Text key={`l-${li}`} style={isHighlight ? styles.analysisTextHighlight : styles.analysisText}>
                        {line}
                      </Text>
                    );
                  })}
                </View>
              </View>
            );
          });
        })()}

        {/* ── Methodology & Limitations ── */}
        {(() => {
          const allKeys = Object.keys(formData);
          const filledKeys = allKeys.filter(k => formData[k] && formData[k].trim() !== "");
          const totalFields = Math.max(allKeys.length, 1);
          const coveragePct = Math.round((filledKeys.length / totalFields) * 100);
          const confidenceLevel = coveragePct >= 80 ? "High" : coveragePct >= 50 ? "Medium" : "Low";
          const confidenceColor = coveragePct >= 80 ? colors.success : coveragePct >= 50 ? colors.warning : colors.destructive;

          return (
            <View style={styles.section} id="section-methodology" wrap={false}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Methodology & Limitations</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={{ fontSize: 9, color: colors.text, lineHeight: 1.5, marginBottom: 6 }}>
                  Analysis performed by EXOS Sentinel Pipeline using advanced LLM orchestration with multi-stage validation and grounding. Sources include global industry benchmarks, real-time commodity pricing, and user-provided parameters. This analysis is AI-generated and should be validated by qualified procurement professionals. Cost estimates are indicative based on available data at time of analysis and may vary with market conditions and data completeness.
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 9, color: colors.textMuted }}>
                    Input coverage: {filledKeys.length}/{totalFields} fields ({coveragePct}%)
                  </Text>
                  <View style={{ backgroundColor: confidenceColor + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, borderWidth: 1, borderColor: confidenceColor }}>
                    <Text style={{ fontSize: 8, fontWeight: 700, color: confidenceColor }}>
                      {confidenceLevel} Confidence
                    </Text>
                  </View>
                </View>
                <View style={styles.auditTrail}>
                  <Text style={{ fontSize: 7, color: colors.textMuted }}>
                    Analysis ID: {reportHash} | Timestamp: {new Date(timestamp).toISOString()}
                  </Text>
                </View>
              </View>
            </View>
          );
        })()}

        {hasParams && (
          <View style={styles.section} id="section-parameters">
            <View style={styles.sectionHeader}>
              <View style={{ width: 8, height: 8, backgroundColor: colors.primary, borderRadius: 2, marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Analysis Parameters</Text>
            </View>
            <View style={styles.sectionContent}>
              {Object.entries(formData)
                .filter(([_, value]) => value && value.trim() !== "")
                .map(([key, value]) => {
                  const label = key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim();
                  const summary = summarizeParameter(value);
                  const tags = summary.includes(",") ? summary.split(",").map(t => t.trim()).filter(Boolean) : null;
                  return (
                    <View key={key} style={styles.parameterBlock}>
                      <Text style={styles.parameterLabel}>{label}</Text>
                      {tags ? (
                        <View style={styles.parameterTagRow}>
                          {tags.map((tag, i) => (
                            <View key={i} style={styles.parameterTag}>
                              <Text style={styles.parameterTagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.parameterValue}>{summary}</Text>
                      )}
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        <ReportFooter reportHash={reportHash} styles={styles} />
      </Page>
    </Document>
  );
};

export default PDFReportDocument;
