import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { Ifrs16ImpactData } from "@/lib/dashboard-data-parser";

const formatCurrency = (value: number | null | undefined, currency = "€"): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${currency}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${currency}${(abs / 1_000).toFixed(0)}K`;
  return `${currency}${abs.toFixed(0)}`;
};

/**
 * PDF IFRS 16 Impact — mirrors IFRS16ImpactDashboard (web).
 * Comparison table across options: balance-sheet status, RoU asset, lease liability,
 * tax shield, P&L treatment, balance-sheet impact.
 */
export const PDFIFRS16Impact = ({
  data,
  themeMode,
}: {
  data: Ifrs16ImpactData;
  themeMode?: PdfThemeMode;
}) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const currency = data.currency || "€";
  const opts = data.options;

  const labelColW = 100;

  const Row = ({
    label,
    children,
    last,
  }: {
    label: string;
    children: React.ReactNode;
    last?: boolean;
  }) => (
    <View
      style={{
        flexDirection: "row",
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{ width: labelColW, fontSize: 7.5, color: colors.textMuted }}
      >
        {label}
      </Text>
      {children}
    </View>
  );

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>IFRS 16 Impact</Text>
          <Text style={styles.dashboardSubtitle}>
            Balance-sheet and P&amp;L treatment per option
          </Text>
        </View>
      </View>

      {/* Header row with option names */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: 4,
          marginBottom: 2,
        }}
      >
        <Text style={{ width: labelColW, fontSize: 7, color: colors.textMuted }}>
          Treatment
        </Text>
        {opts.map((o) => (
          <View
            key={o.id}
            style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
          >
            <View
              style={{ width: 7, height: 7, backgroundColor: o.color, marginRight: 4 }}
            />
            <Text style={{ fontSize: 8, fontWeight: 700, color: colors.text }}>
              {o.name}
            </Text>
          </View>
        ))}
      </View>

      <Row label="Balance-sheet status">
        {opts.map((o) => {
          const tone =
            o.onBalanceSheet === true
              ? { bg: `${colors.warning}1F`, fg: colors.warning, label: "On balance sheet" }
              : o.onBalanceSheet === false
                ? { bg: `${colors.success}1F`, fg: colors.success, label: "Off balance sheet" }
                : null;
          return (
            <View key={o.id} style={{ flex: 1 }}>
              {tone ? (
                <View
                  style={{
                    backgroundColor: tone.bg,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    borderRadius: 3,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ fontSize: 7, fontWeight: 700, color: tone.fg }}>
                    {tone.label}
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 8, color: colors.textMuted }}>—</Text>
              )}
            </View>
          );
        })}
      </Row>

      <Row label="Right-of-use asset">
        {opts.map((o) => (
          <Text key={o.id} style={{ flex: 1, fontSize: 8, color: colors.text }}>
            {formatCurrency(o.rightOfUseAsset, currency)}
          </Text>
        ))}
      </Row>

      <Row label="Lease liability">
        {opts.map((o) => (
          <Text key={o.id} style={{ flex: 1, fontSize: 8, color: colors.text }}>
            {formatCurrency(o.leaseLiability, currency)}
          </Text>
        ))}
      </Row>

      <Row label="Tax shield value">
        {opts.map((o) => (
          <Text key={o.id} style={{ flex: 1, fontSize: 8, color: colors.text }}>
            {formatCurrency(o.taxShieldValue, currency)}
          </Text>
        ))}
      </Row>

      <Row label="P&L treatment">
        {opts.map((o) => (
          <Text
            key={o.id}
            style={{ flex: 1, fontSize: 7.5, color: colors.text, lineHeight: 1.3, paddingRight: 4 }}
          >
            {o.plTreatment ?? "—"}
          </Text>
        ))}
      </Row>

      <Row label="Balance-sheet impact" last>
        {opts.map((o) => (
          <Text
            key={o.id}
            style={{ flex: 1, fontSize: 7.5, color: colors.text, lineHeight: 1.3, paddingRight: 4 }}
          >
            {o.balanceSheetImpact ?? "—"}
          </Text>
        ))}
      </Row>

      {data.ifrs16Note && (
        <View
          style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceLight,
            padding: 6,
          }}
        >
          <Text
            style={{
              fontSize: 6.5,
              color: colors.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 2,
            }}
          >
            CFO note
          </Text>
          <Text style={{ fontSize: 8, color: colors.text, lineHeight: 1.3 }}>
            {data.ifrs16Note}
          </Text>
        </View>
      )}
    </View>
  );
};
