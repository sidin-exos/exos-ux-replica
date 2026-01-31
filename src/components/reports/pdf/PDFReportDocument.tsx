import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// Register fonts for professional look
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2",
      fontWeight: 700,
    },
  ],
});

// EXOS Corporate Colors
const colors = {
  primary: "#14b8a6", // Teal
  primaryDark: "#0d9488",
  background: "#0c1220", // Deep navy
  surface: "#111827",
  surfaceLight: "#1f2937",
  text: "#f9fafb",
  textMuted: "#9ca3af",
  accent: "#06b6d4", // Cyan accent
  success: "#22c55e",
  border: "#374151",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    padding: 40,
    fontFamily: "Inter",
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
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 700,
  },
  brandName: {
    fontSize: 20,
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
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 8,
  },
  reportSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
  },
  // Executive Summary
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionIcon: {
    width: 20,
    height: 20,
    backgroundColor: colors.primaryDark,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionIconText: {
    color: colors.text,
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 14,
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
    fontSize: 11,
    fontWeight: 600,
    color: colors.text,
    marginTop: 12,
    marginBottom: 6,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: colors.textMuted,
  },
  footerBrand: {
    fontSize: 8,
    color: colors.primary,
    fontWeight: 600,
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

interface PDFReportDocumentProps {
  scenarioTitle: string;
  analysisResult: string;
  formData: Record<string, string>;
  timestamp: string;
}

const extractKeyPoints = (text: string): string[] => {
  const lines = text.split("\n").filter((line) => line.trim());
  const keyPoints: string[] = [];

  for (const line of lines) {
    if (
      line.includes("recommend") ||
      line.includes("suggest") ||
      line.includes("should") ||
      line.includes("%") ||
      line.includes("$")
    ) {
      keyPoints.push(line.trim().replace(/\*\*/g, ""));
      if (keyPoints.length >= 5) break;
    }
  }

  return keyPoints.length > 0
    ? keyPoints
    : lines.slice(0, 5).map((l) => l.replace(/\*\*/g, ""));
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
}: PDFReportDocumentProps) => {
  const keyPoints = extractKeyPoints(analysisResult);
  const analysisLines = analysisResult.split("\n").filter((line) => line.trim());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Accent Bar */}
        <View style={styles.accentBar} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>E</Text>
            </View>
            <View>
              <Text style={styles.brandName}>EXOS</Text>
              <Text style={styles.brandTagline}>PROCUREMENT AI</Text>
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
            Strategic procurement analysis powered by EXOS Sentinel AI
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionIconText}>✓</Text>
            </View>
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

        {/* Analysis Inputs */}
        {Object.keys(formData).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionIconText}>📋</Text>
              </View>
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
          <Text style={styles.footerText}>
            Confidential • For internal use only
          </Text>
          <Text style={styles.footerBrand}>Powered by EXOS Sentinel AI</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* Page 2: Detailed Analysis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionIconText}>📊</Text>
            </View>
            <Text style={styles.sectionTitle}>Detailed Analysis</Text>
          </View>
          <View style={styles.sectionContent}>
            {analysisLines.map((line, i) => {
              const cleanLine = line.replace(/\*\*/g, "");
              const isSectionHeader =
                (cleanLine.trim().endsWith(":") &&
                  cleanLine.trim().length < 80) ||
                (cleanLine.trim().length > 0 &&
                  cleanLine.trim().length < 60 &&
                  /^[A-Z]/.test(cleanLine.trim()) &&
                  !cleanLine.includes("."));

              if (!cleanLine.trim()) {
                return <View key={i} style={{ height: 8 }} />;
              }

              if (isSectionHeader) {
                return (
                  <Text key={i} style={styles.analysisHeader}>
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

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Confidential • For internal use only
          </Text>
          <Text style={styles.footerBrand}>Powered by EXOS Sentinel AI</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export default PDFReportDocument;
