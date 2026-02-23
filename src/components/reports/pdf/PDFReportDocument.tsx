import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import exosLogo from "@/assets/logo-concept-layers.png";
import { PDFDashboardVisuals } from "./PDFDashboardVisuals";
import { extractDashboardData, stripDashboardData } from "@/lib/dashboard-data-parser";

// EXOS Corporate Colors
const colors = {
  primary: "#14b8a6", // Teal
  primaryDark: "#0d9488",
  background: "#0c1220", // Deep navy
  surface: "#111827",
  surfaceLight: "#1f2937",
  text: "#f9fafb",
  textMuted: "#9ca3af",
  textSemiTransparent: "rgba(249, 250, 251, 0.6)",
  accent: "#06b6d4", // Cyan accent
  success: "#22c55e",
  border: "#374151",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    padding: 40,
    fontFamily: "Courier",
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
    gap: 12,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  brandName: {
    fontSize: 20,
    fontFamily: "Helvetica",
    fontWeight: 700,
    color: colors.text,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 8,
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
    fontSize: 7,
    color: colors.primary,
    fontWeight: 600,
  },
  reportDate: {
    fontSize: 8,
    color: colors.textMuted,
  },
  // Title Section
  titleSection: {
    marginBottom: 30,
  },
  reportTitle: {
    fontSize: 24,
    fontFamily: "Helvetica",
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 8,
  },
  reportSubtitle: {
    fontSize: 10,
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
    gap: 8,
  },
  sectionLogoImage: {
    width: 20,
    height: 20,
  },
  sectionTitle: {
    fontSize: 14,
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
    gap: 10,
  },
  keyPointBullet: {
    width: 16,
    height: 16,
    backgroundColor: colors.success,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  keyPointBulletText: {
    color: colors.background,
    fontSize: 8,
    fontWeight: 700,
  },
  keyPointText: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.5,
  },
  // Analysis Content
  analysisText: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  analysisHeader: {
    fontSize: 12,
    fontFamily: "Helvetica",
    fontWeight: 700,
    color: colors.text,
    marginTop: 14,
    marginBottom: 8,
  },
  analysisSubHeader: {
    fontSize: 11,
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
    gap: 8,
  },
  limitationBullet: {
    width: 6,
    height: 6,
    backgroundColor: colors.textMuted,
    borderRadius: 3,
    marginTop: 5,
  },
  limitationText: {
    flex: 1,
    fontSize: 9,
    color: colors.textMuted,
    lineHeight: 1.5,
  },
  // Inputs Summary
  inputsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  inputItem: {
    width: "48%",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: "capitalize",
  },
  inputValue: {
    fontSize: 9,
    color: colors.text,
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
    fontSize: 8,
    fontFamily: "Courier",
    color: "rgba(249, 250, 251, 0.35)",
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
    fontSize: 8,
    color: colors.textMuted,
  },
  pageNumber: {
    fontSize: 8,
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
    .replace(/\*\*\*/g, "") // Remove triple stars
    .replace(/\*\*/g, "") // Remove double stars (bold)
    .replace(/^\s*\*\s+/gm, "") // Remove bullet points (* at start of line)
    .replace(/^#{1,4}\s*/gm, "") // Remove hash headers
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
        {/* Accent Bar */}
        <View style={styles.accentBar} />

        {/* Header */}
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

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.reportTitle}>{scenarioTitle} Analysis</Text>
          <Text style={styles.reportSubtitle}>
            Strategic procurement analysis powered by EXOS Procurement Intelligence
          </Text>
        </View>

        {/* Executive Summary */}
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

        {/* Dashboard Visualizations */}
        {selectedDashboards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image src={exosLogo} style={styles.sectionLogoImage} />
              <Text style={styles.sectionTitle}>Analysis Visualizations</Text>
            </View>
            <PDFDashboardVisuals selectedDashboards={selectedDashboards} parsedData={parsedData} />
          </View>
        )}

        {/* Footer */}
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

      {/* Page 2: Detailed Analysis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image src={exosLogo} style={styles.sectionLogoImage} />
            <Text style={styles.sectionTitle}>Detailed Analysis</Text>
          </View>
          <View style={styles.sectionContent}>
            {analysisLines.map((line, i) => {
              // Check if line starts with hash headers (###, ####, etc.)
              const hashMatch = line.match(/^(#{1,4})\s*(.*)$/);
              const isHashHeader = !!hashMatch;
              
              // Clean all markdown formatting
              const cleanLine = cleanMarkdown(line);
              
              if (!cleanLine) {
                return <View key={i} style={{ height: 8 }} />;
              }
              
              // Hash headers get largest styling
              if (isHashHeader) {
                const headerLevel = hashMatch[1].length;
                const headerStyle = headerLevel <= 2 ? styles.analysisHeader : styles.analysisSubHeader;
                return (
                  <Text key={i} style={headerStyle}>
                    {cleanLine}
                  </Text>
                );
              }
              
              // Check if line looks like a section header (ends with colon or is title case short line)
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

        {/* Analysis Limitations */}
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

        {/* Analysis Inputs - Now last */}
        {Object.keys(formData).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image src={exosLogo} style={styles.sectionLogoImage} />
              <Text style={styles.sectionTitle}>Analysis Inputs</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.inputsGrid}>
                {Object.entries(formData)
                  .filter(([_, value]) => value)
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <View key={key} style={styles.inputItem}>
                      <Text style={styles.inputLabel}>
                        {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                      </Text>
                      <Text style={styles.inputValue}>
                        {value.length > 40 ? `${value.slice(0, 40)}...` : value}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
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
