import { Page, Text, View, Image, Link } from "@react-pdf/renderer";
import type { DocColors, DocStyles } from "./pdfDocStyles";
import { ReportFooter } from "./pdfDocStyles";
import type { TocEntry } from "./pdfDocHelpers";

interface PDFCoverPageProps {
  scenarioTitle: string;
  formattedDate: string;
  reportHash: string;
  exosLogo: string;
  findings: string[];
  recommendations: string[];
  tocEntries: TocEntry[];
  showToc: boolean;
  styles: DocStyles;
  colors: DocColors;
}

const PDFCoverPage = ({
  scenarioTitle,
  formattedDate,
  reportHash,
  exosLogo,
  findings,
  recommendations,
  tocEntries,
  showToc,
  styles,
  colors,
}: PDFCoverPageProps) => (
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
);

export default PDFCoverPage;
