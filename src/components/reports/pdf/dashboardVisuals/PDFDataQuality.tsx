import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { DataQualityData } from "@/lib/dashboard-data-parser";
import {
  normalizeDataQuality,
  formatScore,
  FIELD_STATUS_ORDER,
  DQ_MAX_SCORE,
  type FieldStatus,
} from "@/lib/dashboard-contracts";

/**
 * PDF Data Quality — mirrors DataQualityDashboard (web).
 *
 * Confidence is derived from the same `normalizeDataQuality()` helper as the
 * web dashboard, so the percentage in the PDF always matches what users see
 * on screen (previously: web showed 40%, PDF showed 2% for the same data).
 */
export const PDFDataQuality = ({
  data,
  themeMode,
}: {
  data: DataQualityData;
  themeMode?: PdfThemeMode;
}) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  // EXOS palette aligned with web
  const STATUS_META: Record<FieldStatus, { label: string; color: string }> = {
    complete: { label: "Complete", color: colors.success },
    partial: { label: "Partial", color: colors.warning },
    missing: { label: "Missing", color: colors.textMuted },
  };

  const norm = normalizeDataQuality(data);
  const { fields, grouped, counts, totalFields, avgScore, confidencePct, confidenceLabel, limitations } = norm;

  const heroColor =
    confidencePct >= 75
      ? colors.success
      : confidencePct >= 60
        ? colors.warning
        : colors.destructive;

  const groupAvg = (status: FieldStatus): number => {
    const arr = grouped[status];
    if (!arr.length) return 0;
    return arr.reduce((acc, f) => acc + f.coverage, 0) / arr.length;
  };

  return (
    <View style={styles.dashboardCard}>
      {/* Header — confidence % matches web */}
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Data Quality</Text>
          <Text style={styles.dashboardSubtitle}>Coverage by status</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 16, fontWeight: 700, color: heroColor }}>
            {confidencePct}%
          </Text>
          <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
            analysis confidence
          </Text>
        </View>
      </View>

      {/* Coverage distribution stacked bar */}
      <View style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
          <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
            Coverage distribution
          </Text>
          <Text style={{ fontSize: 7, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
            {totalFields} fields
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            height: 6,
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: colors.surfaceLight,
          }}
        >
          {FIELD_STATUS_ORDER.map((s) => {
            const pct = totalFields ? (counts[s] / totalFields) * 100 : 0;
            if (pct === 0) return null;
            return (
              <View
                key={s}
                style={{ width: `${pct}%`, backgroundColor: STATUS_META[s].color }}
              />
            );
          })}
        </View>
      </View>

      {/* Two-column: status groups + summary panel */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          {FIELD_STATUS_ORDER.map((status) => {
            const items = grouped[status];
            if (items.length === 0) return null;
            const meta = STATUS_META[status];
            const avg = groupAvg(status);
            const isMissing = status === "missing";
            return (
              <View
                key={status}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 6,
                }}
              >
                {/* Group header */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: meta.color,
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 8,
                      color: colors.badgeText,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {meta.label} ({items.length})
                  </Text>
                  <Text
                    style={{
                      fontSize: 8,
                      color: colors.badgeText,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {isMissing ? "0 / 5" : `avg ${formatScore(avg)} / 5`}
                  </Text>
                </View>
                {/* Field rows */}
                {items.map((f, idx) => {
                  const widthPct = (f.coverage / DQ_MAX_SCORE) * 100;
                  return (
                    <View
                      key={`${f.field}-${idx}`}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 9,
                          color: isMissing ? colors.textMuted : colors.text,
                        }}
                      >
                        {f.field}
                      </Text>
                      {isMissing ? (
                        <Text style={{ fontSize: 8, color: colors.warning }}>
                          Insufficient detail
                        </Text>
                      ) : (
                        <>
                          <View
                            style={{
                              width: 56,
                              height: 4,
                              backgroundColor: colors.surfaceLight,
                              marginRight: 6,
                            }}
                          >
                            <View
                              style={{
                                width: `${widthPct}%`,
                                height: 4,
                                backgroundColor: meta.color,
                              }}
                            />
                          </View>
                          <Text
                            style={{
                              width: 22,
                              fontSize: 9,
                              color: colors.text,
                              fontWeight: 600,
                              textAlign: "right",
                            }}
                          >
                            {formatScore(f.coverage)}
                          </Text>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Side summary */}
        <View
          style={{
            width: 150,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 8,
            backgroundColor: colors.surfaceLight,
          }}
        >
          <Text
            style={{
              fontSize: 7,
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Coverage summary
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
            <Text style={{ fontSize: 9, color: colors.textMuted }}>Total fields</Text>
            <Text style={{ fontSize: 9, color: colors.text, fontWeight: 600 }}>{totalFields}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 9, color: colors.textMuted }}>Average score</Text>
            <Text style={{ fontSize: 9, color: colors.text, fontWeight: 600 }}>
              {formatScore(avgScore)} / 5
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 5,
              marginBottom: 6,
            }}
          >
            <Text style={{ fontSize: 9, color: colors.text, fontWeight: 600 }}>Confidence</Text>
            <Text style={{ fontSize: 12, color: heroColor, fontWeight: 700 }}>
              {confidencePct}%
            </Text>
          </View>

          <Text
            style={{
              fontSize: 7,
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 5,
            }}
          >
            Status
          </Text>
          {FIELD_STATUS_ORDER.map((s) => {
            const meta = STATUS_META[s];
            return (
              <View
                key={s}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 1,
                }}
              >
                <Text style={{ fontSize: 9, color: colors.textMuted }}>{meta.label}</Text>
                <Text style={{ fontSize: 9, color: meta.color, fontWeight: 600 }}>
                  {counts[s]}
                </Text>
              </View>
            );
          })}

          <Text
            style={{
              fontSize: 7,
              color: heroColor,
              marginTop: 6,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontWeight: 600,
            }}
          >
            {confidenceLabel}
          </Text>
        </View>
      </View>

      {/* Limitations banner */}
      {limitations.length > 0 && (
        <View
          style={{
            marginTop: 10,
            padding: 6,
            borderWidth: 1,
            borderColor: colors.warning,
            backgroundColor: colors.surfaceLight,
          }}
        >
          <Text
            style={{
              fontSize: 7,
              color: colors.warning,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontWeight: 600,
              marginBottom: 3,
            }}
          >
            Analysis limitations
          </Text>
          {limitations.map((item, idx) => (
            <Text key={idx} style={{ fontSize: 9, color: colors.text, marginBottom: 1 }}>
              <Text style={{ fontWeight: 600 }}>{item.title}</Text>
              <Text style={{ color: colors.textMuted }}> — {item.impact}</Text>
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};
