import { Page, Text, View } from "@react-pdf/renderer";
import type { DocColors, DocStyles } from "./pdfDocStyles";
import { RunningHeader, ReportFooter } from "./pdfDocStyles";
import {
  categorizeAnalysisSections,
  hasMetricHighlight,
  summarizeParameter,
} from "./pdfDocHelpers";

interface PDFAnalysisPageProps {
  scenarioTitle: string;
  formattedDate: string;
  reportHash: string;
  timestamp: string;
  analysisLines: string[];
  formData: Record<string, string>;
  hasParams: boolean;
  styles: DocStyles;
  colors: DocColors;
}

const PDFAnalysisPage = ({
  scenarioTitle,
  formattedDate,
  reportHash,
  timestamp,
  analysisLines,
  formData,
  hasParams,
  styles,
  colors,
}: PDFAnalysisPageProps) => {
  const sections = categorizeAnalysisSections(analysisLines);

  // Methodology confidence calculation
  const allKeys = Object.keys(formData);
  const filledKeys = allKeys.filter(k => formData[k] && formData[k].trim() !== "");
  const totalFields = Math.max(allKeys.length, 1);
  const coveragePct = Math.round((filledKeys.length / totalFields) * 100);
  const confidenceLevel = coveragePct >= 80 ? "High" : coveragePct >= 50 ? "Medium" : "Low";
  const confidenceColor = coveragePct >= 80 ? colors.success : coveragePct >= 50 ? colors.warning : colors.destructive;

  return (
    <Page size="A4" style={styles.pageWithHeader}>
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />
      <View style={styles.gradientLayer3} />
      <View style={styles.accentBar} />

      <RunningHeader scenarioTitle={scenarioTitle} dateStr={formattedDate} styles={styles} />

      {/* Detailed Analysis Sections */}
      {sections.map((section, si) => {
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
      })}

      {/* Methodology & Limitations */}
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

      {/* Analysis Parameters */}
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
  );
};

export default PDFAnalysisPage;
