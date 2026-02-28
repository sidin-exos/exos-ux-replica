import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import exosLogo from "@/assets/logo-concept-layers.png";
import { PDFDashboardPages } from "./PDFDashboardVisuals";
import { extractDashboardData, stripDashboardData } from "@/lib/dashboard-data-parser";

// EXOS Corporate Colors — Warm Neutral
const colors = {
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
  border: "#3a3a4e",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    padding: 40,
    fontFamily: "Helvetica",
    color: colors.text,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  reportMeta: {
    textAlign: "right",
  },
  reportBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  reportBadgeText: {
    fontSize: 8,
    color: colors.primary,
    fontWeight: 600,
  },
  reportDate: {
    fontSize: 9,
    color: colors.textMuted,
  },
  // Title Section
  titleSection: {
    marginBottom: 30,
  },
  reportTitle: {
    fontSize: 28,
    fontFamily: "Helvetica",
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 8,
  },
  reportSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  // Sections
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
    color: colors.text,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Key Points
  keyPointItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  keyPointBullet: {
    width: 18,
    height: 18,
    backgroundColor: colors.success,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    marginRight: 10,
  },
  keyPointBulletText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: 700,
  },
  keyPointText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 1.5,
  },
  // Analysis Content
  analysisText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  analysisHeader: {
    fontSize: 14,
    fontFamily: "Helvetica",
    fontWeight: 700,
    color: colors.text,
    marginTop: 14,
    marginBottom: 8,
  },
  analysisSubHeader: {
    fontSize: 13,
    fontFamily: "Helvetica",
    fontWeight: 600,
    color: colors.text,
    marginTop: 10,
    marginBottom: 6,
  },
  // Limitations Section
  limitationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  limitationBullet: {
    width: 6,
    height: 6,
    backgroundColor: colors.textMuted,
    borderRadius: 3,
    marginTop: 5,
    marginRight: 8,
  },
  limitationText: {
    flex: 1,
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 1.5,
  },
  // Inputs Summary
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
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: "capitalize",
  },
  inputValue: {
    fontSize: 10,
    color: colors.text,
    fontFamily: "Courier",
    fontWeight: 600,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "column",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 15,
  },
  footerBrand: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "rgba(212, 212, 220, 0.35)",
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
    color: colors.textMuted,
  },
  pageNumber: {
    fontSize: 9,
    color: colors.textMuted,
  },
  // Accent bar
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary,
  },
  // Gradient simulation layers
  gradientLayer1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: "50%",
    backgroundColor: "#232338",
  },
  gradientLayer2: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    bottom: "30%",
    backgroundColor: "rgba(107, 158, 138, 0.06)",
  },
  gradientLayer3: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1a1a2a",
  },
});

import { DashboardType } from "@/lib/dashboard-mappings";

interface PDFReportDocumentProps {
  scenarioTitle: string;
  analysisResult: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
}

// Clean markdown formatting from text
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\s+/gm, "")
    .replace(/^#{1,4}\s*/gm, "")
    .trim();
};

const extractKeyPoints = (text: string): string[] => {
  const lines = text.split("\n").filter((line) => line.trim());
  const keyPoints: string[] = [];

  for (const line of lines) {
    const cleanLine = cleanMarkdown(line);
    if (!cleanLine) continue;

    if (
      cleanLine.includes("recommend") ||
      cleanLine.includes("suggest") ||
      cleanLine.includes("should") ||
      cleanLine.includes("%") ||
      cleanLine.includes("$")
    ) {
      keyPoints.push(cleanLine);
      if (keyPoints.length >= 5) break;
    }
  }

  return keyPoints.length > 0
    ? keyPoints
    : lines.slice(0, 5).map(cleanMarkdown).filter(Boolean);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const PDFReportDocument = ({
  scenarioTitle,
  analysisResult,
  formData,
  timestamp,
  selectedDashboards = [],
}: PDFReportDocumentProps) => {
  const parsedData = extractDashboardData(analysisResult);
  const strippedAnalysis = stripDashboardData(analysisResult);
  const keyPoints = extractKeyPoints(strippedAnalysis);
  const analysisLines = strippedAnalysis.split("\n").filter((line) => line.trim());

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
            {keyPoints.map((point, i) => (
              <View key={i} style={styles.keyPointItem}>
                <View style={styles.keyPointBullet}>
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
        <PDFDashboardPages selectedDashboards={selectedDashboards} parsedData={parsedData} />
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
            <Text style={styles.sectionTitle}>Analysis Limitations</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.limitationItem}>
              <View style={styles.limitationBullet} />
              <Text style={styles.limitationText}>
                This analysis is based on the information provided and may not reflect all market conditions, supplier capabilities, or internal constraints.
              </Text>
            </View>
            <View style={styles.limitationItem}>
              <View style={styles.limitationBullet} />
              <Text style={styles.limitationText}>
                AI-generated recommendations should be validated against current market data and organizational policies before implementation.
              </Text>
            </View>
            <View style={styles.limitationItem}>
              <View style={styles.limitationBullet} />
              <Text style={styles.limitationText}>
                Financial projections and savings estimates are indicative and subject to negotiation outcomes and external factors.
              </Text>
            </View>
            <View style={styles.limitationItem}>
              <View style={styles.limitationBullet} />
              <Text style={styles.limitationText}>
                Historical data patterns may not accurately predict future supplier behavior or market dynamics.
              </Text>
            </View>
          </View>
        </View>

        {Object.keys(formData).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image src={exosLogo} style={styles.sectionLogoImage} />
              <Text style={styles.sectionTitle}>Analysis Inputs</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.inputsGrid}>
                {Object.entries(formData)
                  .filter(([_, value]) => value && value.trim() !== "")
                  .map(([key, value]) => (
                    <View key={key} style={styles.inputItem}>
                      <Text style={styles.inputLabel}>
                        {key.replace(/_/g, " ").replace(/([A-Z])/g, " $1")}
                      </Text>
                      <Text style={styles.inputValue}>{value}</Text>
                    </View>
                  ))}
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
