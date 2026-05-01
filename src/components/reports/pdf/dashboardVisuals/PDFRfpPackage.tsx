import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { RfpPackageData } from "@/lib/dashboard-data-parser";

/**
 * PDF RFP Package — mirrors RfpPackageDashboard (web).
 * Renders the five S9 deliverables: extracted brief, tender document,
 * evaluation matrix, clarifications, suggested attachments.
 */
export const PDFRfpPackage = ({
  data,
  themeMode,
}: {
  data: RfpPackageData;
  themeMode?: PdfThemeMode;
}) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const {
    extractedBrief,
    tenderDocument,
    evaluationMatrix,
    clarifications,
    suggestedAttachments,
    deliverablesCoverage,
  } = data;

  const coveragePct = deliverablesCoverage.total
    ? Math.round((deliverablesCoverage.delivered / deliverablesCoverage.total) * 100)
    : 0;
  const heroColor =
    coveragePct >= 80 ? colors.success : coveragePct >= 60 ? colors.warning : colors.destructive;

  const sevColor: Record<"HIGH" | "MEDIUM" | "LOW", string> = {
    HIGH: colors.destructive,
    MEDIUM: colors.warning,
    LOW: colors.success,
  };

  const totalWeight = evaluationMatrix?.totalWeightCheck ?? 0;
  const weightsBalanced = !!evaluationMatrix?.weightsBalanced;

  return (
    <View style={styles.dashboardCard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>RFP Package</Text>
          <Text style={styles.dashboardSubtitle}>
            {extractedBrief.packageType} · {extractedBrief.scopeType ?? "Scope undefined"}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 16, fontFamily: "Inter", fontWeight: 700, color: heroColor }}>
            {deliverablesCoverage.delivered}/{deliverablesCoverage.total}
          </Text>
          <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
            deliverables
          </Text>
        </View>
      </View>

      {/* Coverage bar */}
      <View style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
          <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
            Package coverage
          </Text>
          <Text style={{ fontSize: 7, color: colors.textMuted, letterSpacing: 1 }}>{coveragePct}%</Text>
        </View>
        <View style={{ height: 6, backgroundColor: colors.surfaceLight, borderRadius: 3, overflow: "hidden" }}>
          <View style={{ width: `${coveragePct}%`, height: 6, backgroundColor: heroColor }} />
        </View>
        {deliverablesCoverage.missing.length > 0 && (
          <Text style={{ fontSize: 7, color: colors.textMuted, marginTop: 3 }}>
            Missing: {deliverablesCoverage.missing.join(", ")}
          </Text>
        )}
      </View>

      {/* Brief */}
      <View style={{ borderWidth: 1, borderColor: colors.border, padding: 7, marginBottom: 8 }}>
        <Text style={{ fontSize: 7, fontFamily: "Inter", fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          Extracted brief
        </Text>
        <Text style={{ fontSize: 9, color: colors.text, marginBottom: 4 }}>{extractedBrief.summary}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {extractedBrief.annualBudgetEur != null && (
            <View style={{ width: "50%", flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>Budget</Text>
              <Text style={{ fontSize: 8, color: colors.text, fontFamily: "Inter", fontWeight: 700 }}>
                €{extractedBrief.annualBudgetEur.toLocaleString()}
              </Text>
            </View>
          )}
          {extractedBrief.deadlines.submissionDue && (
            <View style={{ width: "50%", flexDirection: "row", justifyContent: "space-between", marginBottom: 2, paddingLeft: 8 }}>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>Submission</Text>
              <Text style={{ fontSize: 8, color: colors.text, fontFamily: "Inter", fontWeight: 700 }}>
                {extractedBrief.deadlines.submissionDue}
              </Text>
            </View>
          )}
          {extractedBrief.volume && (
            <View style={{ width: "50%", flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>Volume</Text>
              <Text style={{ fontSize: 8, color: colors.text }}>{extractedBrief.volume}</Text>
            </View>
          )}
          {extractedBrief.deadlines.awardTarget && (
            <View style={{ width: "50%", flexDirection: "row", justifyContent: "space-between", marginBottom: 2, paddingLeft: 8 }}>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>Award target</Text>
              <Text style={{ fontSize: 8, color: colors.text, fontFamily: "Inter", fontWeight: 700 }}>
                {extractedBrief.deadlines.awardTarget}
              </Text>
            </View>
          )}
        </View>
        {extractedBrief.mandatoryCompliance.length > 0 && (
          <Text style={{ fontSize: 7, color: colors.textMuted, marginTop: 4 }}>
            Compliance: {extractedBrief.mandatoryCompliance.slice(0, 8).join(" · ")}
          </Text>
        )}
      </View>

      {/* Tender document */}
      <View style={{ borderWidth: 1, borderColor: colors.border, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 5, backgroundColor: colors.surfaceLight }}>
          <Text style={{ fontSize: 7, fontFamily: "Inter", fontWeight: 700, color: colors.text, textTransform: "uppercase", letterSpacing: 1 }}>
            Tender document
          </Text>
          <Text style={{ fontSize: 7, color: colors.textMuted }}>
            {tenderDocument?.sections.length ?? 0} sections
          </Text>
        </View>
        {tenderDocument && tenderDocument.sections.length > 0 ? (
          tenderDocument.sections.slice(0, 8).map((s, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 4,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 8, color: colors.text, flex: 1 }}>{s.heading}</Text>
              {s.mandatory && (
                <Text style={{ fontSize: 7, color: colors.warning, textTransform: "uppercase", letterSpacing: 1 }}>
                  Mandatory
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 8, color: colors.textMuted, padding: 5 }}>No sections drafted.</Text>
        )}
      </View>

      {/* Evaluation matrix */}
      <View style={{ borderWidth: 1, borderColor: colors.border, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 5, backgroundColor: colors.surfaceLight }}>
          <Text style={{ fontSize: 7, fontFamily: "Inter", fontWeight: 700, color: colors.text, textTransform: "uppercase", letterSpacing: 1 }}>
            Evaluation matrix
          </Text>
          <Text style={{ fontSize: 7, color: weightsBalanced ? colors.success : colors.destructive }}>
            Total weight: {totalWeight}%
          </Text>
        </View>
        {evaluationMatrix && evaluationMatrix.criteria.length > 0 ? (
          evaluationMatrix.criteria.map((c, i) => (
            <View
              key={i}
              style={{
                padding: 4,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 8, fontFamily: "Inter", fontWeight: 700, color: colors.text }}>{c.name}</Text>
                <Text style={{ fontSize: 8, color: colors.textMuted }}>{c.weightPct}%</Text>
              </View>
              <View style={{ height: 3, marginTop: 2, backgroundColor: colors.surfaceLight, borderRadius: 1.5, overflow: "hidden" }}>
                <View style={{ width: `${Math.min(100, c.weightPct)}%`, height: 3, backgroundColor: colors.primary }} />
              </View>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 8, color: colors.textMuted, padding: 5 }}>No evaluation criteria defined.</Text>
        )}
      </View>

      {/* Clarifications + attachments */}
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border, marginRight: 4 }}>
          <View style={{ padding: 5, backgroundColor: colors.surfaceLight }}>
            <Text style={{ fontSize: 7, fontFamily: "Inter", fontWeight: 700, color: colors.text, textTransform: "uppercase", letterSpacing: 1 }}>
              Clarifications ({clarifications.length})
            </Text>
          </View>
          {clarifications.length > 0 ? (
            clarifications.slice(0, 5).map((q, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  padding: 4,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <View style={{ width: 4, height: 4, marginTop: 4, marginRight: 4, backgroundColor: sevColor[q.severity] }} />
                <Text style={{ fontSize: 8, color: colors.text, flex: 1 }}>{q.question}</Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 8, color: colors.textMuted, padding: 5 }}>None outstanding.</Text>
          )}
        </View>

        <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border, marginLeft: 4 }}>
          <View style={{ padding: 5, backgroundColor: colors.surfaceLight }}>
            <Text style={{ fontSize: 7, fontFamily: "Inter", fontWeight: 700, color: colors.text, textTransform: "uppercase", letterSpacing: 1 }}>
              Suggested attachments ({suggestedAttachments.length})
            </Text>
          </View>
          {suggestedAttachments.length > 0 ? (
            suggestedAttachments.slice(0, 5).map((a, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: 4,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 8, color: colors.text, flex: 1 }}>{a.name}</Text>
                {a.templateAvailable && (
                  <Text style={{ fontSize: 7, color: colors.success, textTransform: "uppercase", letterSpacing: 1 }}>
                    Template
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 8, color: colors.textMuted, padding: 5 }}>None suggested.</Text>
          )}
        </View>
      </View>
    </View>
  );
};
