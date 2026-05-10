import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type {
  CFOAcceptance,
  SavingsRealizationFunnelData,
} from "@/lib/sentinel/types";

const formatCurrency = (value: number | null, currency: string): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${currency}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${currency}${(value / 1_000).toFixed(0)}K`;
  return `${currency}${Math.round(value)}`;
};

/**
 * PDF Savings Realization Funnel — mirrors SavingsRealizationFunnelDashboard (web).
 * Layout: stacked bars per funnel stage (hard / soft / avoided) + 3-up KPI cards
 * + CFO acceptance badge. Print-safe (no recharts).
 */
export const PDFSavingsRealizationFunnel = ({
  data,
  themeMode,
}: {
  data: SavingsRealizationFunnelData;
  themeMode?: PdfThemeMode;
}) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const COLOR_HARD = colors.primary;
  const COLOR_SOFT = colors.accent3; // amber
  const COLOR_AVOIDED = colors.textMuted;

  const ACCEPTANCE_TONE: Record<CFOAcceptance, { bg: string; fg: string; label: string }> = {
    GREEN: {
      bg: `${colors.success}22`,
      fg: colors.success,
      label: "CFO-grade — verified baseline + hard P&L impact",
    },
    AMBER: {
      bg: `${colors.warning}22`,
      fg: colors.warning,
      label: "Conditional — verified baseline but soft / avoided only",
    },
    RED: {
      bg: `${colors.destructive}22`,
      fg: colors.destructive,
      label: "Not CFO-grade — baseline is estimated, not verified",
    },
  };
  const acceptance = ACCEPTANCE_TONE[data.cfoAcceptance];

  // Find max stack total for scaling
  const max = Math.max(
    1,
    ...data.funnel.map((f) => f.hard + f.soft + f.avoided)
  );

  const ClassCard = ({
    title,
    value,
    color,
  }: {
    title: string;
    value: number | null;
    color: string;
  }) => (
    <View
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceLight,
        padding: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
        <View style={{ width: 6, height: 6, backgroundColor: color, marginRight: 4 }} />
        <Text style={{ fontSize: 8, color: colors.text, fontWeight: 600 }}>{title}</Text>
      </View>
      <Text style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>
        {formatCurrency(value, data.currency)}
      </Text>
      <Text style={{ fontSize: 7, color: colors.textMuted }}>annualised</Text>
    </View>
  );

  return (
    <View style={styles.dashboardCard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Savings Realization Funnel</Text>
          <Text style={styles.dashboardSubtitle}>
            CIPS classification across the savings funnel
          </Text>
        </View>
        <View
          style={{
            backgroundColor: acceptance.bg,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 7, fontWeight: 700, color: acceptance.fg }}>
            CFO {data.cfoAcceptance}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 8, color: colors.textMuted, marginBottom: 8 }}>
        {acceptance.label}
      </Text>

      {/* Stacked bars per stage */}
      <View style={{ marginBottom: 10 }}>
        {data.funnel.map((stage) => {
          const total = stage.hard + stage.soft + stage.avoided;
          const widthPct = (total / max) * 100;
          const seg = (val: number, color: string) => {
            if (val <= 0 || total <= 0) return null;
            return (
              <View
                style={{
                  width: `${(val / total) * 100}%`,
                  backgroundColor: color,
                  height: 12,
                }}
              />
            );
          };
          return (
            <View
              key={stage.stage}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
            >
              <Text style={{ width: 60, fontSize: 8, color: colors.text }}>
                {stage.stage}
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 12,
                  backgroundColor: colors.surfaceLight,
                  flexDirection: "row",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${widthPct}%`,
                    height: 12,
                    flexDirection: "row",
                  }}
                >
                  {seg(stage.hard, COLOR_HARD)}
                  {seg(stage.soft, COLOR_SOFT)}
                  {seg(stage.avoided, COLOR_AVOIDED)}
                </View>
              </View>
              <Text
                style={{
                  width: 60,
                  textAlign: "right",
                  fontSize: 8,
                  color: colors.text,
                  fontWeight: 600,
                  marginLeft: 6,
                }}
              >
                {formatCurrency(total, data.currency)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
        {[
          { color: COLOR_HARD, label: "Hard" },
          { color: COLOR_SOFT, label: "Soft" },
          { color: COLOR_AVOIDED, label: "Avoided" },
        ].map((l) => (
          <View key={l.label} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 7, height: 7, backgroundColor: l.color, marginRight: 4 }} />
            <Text style={{ fontSize: 8, color: colors.textMuted }}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* 3-up class cards */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        <ClassCard title="Hard" value={data.hardAnnualised} color={COLOR_HARD} />
        <ClassCard title="Soft" value={data.softAnnualised} color={COLOR_SOFT} />
        <ClassCard title="Avoided" value={data.avoidedProtected} color={COLOR_AVOIDED} />
      </View>
    </View>
  );
};
