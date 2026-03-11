import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import exosLogoDark from "@/assets/logo-concept-layers.png";
import exosLogoLight from "@/assets/logo-concept-layers-light.png";
import { PDFDashboardPages } from "./PDFDashboardVisuals";
import { extractDashboardData, stripDashboardData } from "@/lib/dashboard-data-parser";
import { DashboardType } from "@/lib/dashboard-mappings";
import type { PdfThemeMode } from "./dashboardVisuals/theme";

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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 30,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingBottom: 20,
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
      fontFamily: "Helvetica",
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
      marginBottom: 30,
    },
    reportTitle: {
      fontSize: 28,
      fontFamily: "Helvetica",
      fontWeight: 700,
      color: c.primary,
      marginBottom: 8,
    },
    reportSubtitle: {
      fontSize: 12,
      color: c.textMuted,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionLogoImage: {
      width: 20,
      height: 20,
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: "Helvetica",
      fontWeight: 600,
      color: c.text,
    },
    sectionContent: {
      backgroundColor: c.surface,
      borderRadius: 8,
      padding: 16,
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
      fontSize: 12,
      color: c.text,
      lineHeight: 1.5,
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
      backgroundColor: c.primary + "15",
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 3,
    },
    analysisHeader: {
      fontSize: 14,
      fontFamily: "Helvetica",
      fontWeight: 700,
      color: c.text,
      marginTop: 14,
      marginBottom: 8,
    },
    analysisSubHeader: {
      fontSize: 13,
      fontFamily: "Helvetica",
      fontWeight: 600,
      color: c.text,
      marginTop: 10,
      marginBottom: 6,
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
    sectionBlockHeader: {
      fontSize: 14,
      fontFamily: "Helvetica",
      fontWeight: 700,
      color: c.text,
      marginBottom: 10,
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

  return (
    <Document>
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
            <Text style={styles.reportDate}>{formatDate(timestamp)}</Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.reportTitle}>{scenarioTitle} Analysis</Text>
          <Text style={styles.reportSubtitle}>
            Strategic procurement analysis powered by EXOS Procurement Intelligence
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image src={exosLogo} style={styles.sectionLogoImage} />
            <Text style={styles.sectionTitle}>Executive Summary</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.analysisSubHeader}>Key Findings</Text>
            {findings.map((point, i) => (
              <View key={`f-${i}`} style={styles.keyPointItem}>
                <View style={styles.keyPointBullet}>
                  <Text style={styles.keyPointBulletText}>{i + 1}</Text>
                </View>
                <Text style={styles.keyPointText}>{point}</Text>
              </View>
            ))}

            <View style={{ height: 12 }} />

            <Text style={styles.analysisSubHeader}>Top Recommendations</Text>
            {recommendations.map((point, i) => (
              <View key={`r-${i}`} style={styles.keyPointItem}>
                <View style={[styles.keyPointBullet, { backgroundColor: colors.warning }]}>
                  <Text style={styles.keyPointBulletText}>{i + 1}</Text>
                </View>
                <Text style={styles.keyPointText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>Powered by EXOS Procurement Intelligence</Text>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              Confidential • For internal use only
            </Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        </View>
      </Page>

      {selectedDashboards.length > 0 && (
        <PDFDashboardPages selectedDashboards={selectedDashboards} parsedData={parsedData} pdfTheme={pdfTheme} />
      )}

      <Page size="A4" style={styles.page}>
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
        <View style={styles.accentBar} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image src={exosLogo} style={styles.sectionLogoImage} />
            <Text style={styles.sectionTitle}>Detailed Analysis</Text>
          </View>
          <View style={styles.sectionContent}>
            {analysisLines.map((line, i) => {
              const hashMatch = line.match(/^(#{1,4})\s*(.*)$/);
              const isHashHeader = !!hashMatch;
              const cleanLine = cleanMarkdown(line);
              
              if (!cleanLine) {
                return <View key={i} style={{ height: 8 }} />;
              }
              
              if (isHashHeader) {
                const headerLevel = hashMatch[1].length;
                const headerStyle = headerLevel <= 2 ? styles.analysisHeader : styles.analysisSubHeader;
                return (
                  <Text key={i} style={headerStyle}>
                    {cleanLine}
                  </Text>
                );
              }
              
              const isSectionHeader =
                (cleanLine.endsWith(":") && cleanLine.length < 80) ||
                (cleanLine.length > 0 &&
                  cleanLine.length < 60 &&
                  /^[A-Z]/.test(cleanLine) &&
                  !cleanLine.includes("."));

              if (isSectionHeader) {
                return (
                  <Text key={i} style={styles.analysisSubHeader}>
                    {cleanLine}
                  </Text>
                );
              }

              return (
                <Text key={i} style={styles.analysisText}>
                  {cleanLine}
                </Text>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image src={exosLogo} style={styles.sectionLogoImage} />
            <Text style={styles.sectionTitle}>Data Quality Assessment</Text>
          </View>
          <View style={styles.sectionContent}>
            {(() => {
              const allKeys = Object.keys(formData);
              const filledKeys = allKeys.filter(k => formData[k] && formData[k].trim() !== "");
              const missingKeys = allKeys.filter(k => !formData[k] || formData[k].trim() === "");
              const totalFields = Math.max(allKeys.length, 1);
              const coveragePct = Math.round((filledKeys.length / totalFields) * 100);
              const confidenceLevel = coveragePct >= 80 ? "High" : coveragePct >= 50 ? "Medium" : "Low";
              const confidenceColor = coveragePct >= 80 ? colors.success : coveragePct >= 50 ? colors.warning : colors.destructive;

              return (
                <>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>
                        {filledKeys.length} of {totalFields} parameters provided
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                        {coveragePct}% coverage
                      </Text>
                    </View>
                    <View style={{ backgroundColor: confidenceColor + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: confidenceColor }}>
                      <Text style={{ fontSize: 10, fontWeight: 700, color: confidenceColor }}>
                        {confidenceLevel} Confidence
                      </Text>
                    </View>
                  </View>

                  <View style={{ height: 8, backgroundColor: colors.surfaceLight, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                    <View style={{ width: `${coveragePct}%`, height: 8, backgroundColor: confidenceColor, borderRadius: 4 }} />
                  </View>

                  {missingKeys.length > 0 && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, marginBottom: 4 }}>Missing parameters:</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {missingKeys.map(key => (
                          <View key={key} style={{ backgroundColor: colors.destructive + "15", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, marginRight: 6, marginBottom: 4 }}>
                            <Text style={{ fontSize: 9, color: colors.destructive }}>
                              {key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>
                    Provide additional parameters to improve analysis accuracy.
                  </Text>
                </>
              );
            })()}
          </View>
        </View>

        {Object.keys(formData).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image src={exosLogo} style={styles.sectionLogoImage} />
              <Text style={styles.sectionTitle}>Analysis Parameters</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {Object.entries(formData)
                  .filter(([_, value]) => value && value.trim() !== "")
                  .map(([key, value]) => {
                    const label = key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim();
                    let displayValue = value;
                    if (value.length > 60) {
                      const firstSentence = value.split(/[.!?\n]/)[0] || value;
                      displayValue = firstSentence.length > 80
                        ? firstSentence.substring(0, 77) + "…"
                        : firstSentence;
                    }
                    return (
                      <View key={key} style={{ flexDirection: "row", alignItems: "center", marginRight: 8, marginBottom: 6 }}>
                        <Text style={{ fontSize: 8, color: colors.textMuted, marginRight: 4 }}>{label}:</Text>
                        <View style={{ backgroundColor: colors.surfaceLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 3 }}>
                          <Text style={{ fontSize: 9, color: colors.text, fontFamily: "Courier" }}>{displayValue}</Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>Powered by EXOS Procurement Intelligence</Text>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              Confidential • For internal use only
            </Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default PDFReportDocument;
