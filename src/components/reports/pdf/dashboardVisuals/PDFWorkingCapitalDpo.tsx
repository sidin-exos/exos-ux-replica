import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { WorkingCapitalData } from "@/lib/sentinel/types";

const formatCurrency = (value: number | null, currency: string): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${currency}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${currency}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${currency}${Math.round(abs)}`;
};

/**
 * PDF Working Capital & DPO — mirrors WorkingCapitalDpoDashboard (web).
 * Layout: 4-up KPI row (Current DPO, Target DPO, Δ DPO, Working-capital impact),
 * single-row stacked terms-distribution bar, and EU Late Payment Directive risk table.
 */
export const PDFWorkingCapitalDpo = ({
  data,
  themeMode,
}: {
  data: WorkingCapitalData;
  themeMode?: PdfThemeMode;
}) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);

  const TERM_COLOR: Record<string, string> = {
    "NET 30": colors.primary,
    "NET 45": colors.accent2,
    "NET 60": colors.textMuted,
    "NET 90+": colors.destructive,
  };

  const dpoDelta =
    data.target_weighted_dpo != null && data.current_weighted_dpo != null
      ? data.target_weighted_dpo - data.current_weighted_dpo
      : null;

  const flaggedSuppliers = data.by_supplier
    .filter((s) => s.late_payment_directive_risk)
    .sort((a, b) => (b.annual_spend ?? 0) - (a.annual_spend ?? 0))
    .slice(0, 6);

  const KpiCard = ({
    label,
    value,
    tone,
  }: {
    label: string;
    value: string;
    tone?: "neutral" | "positive";
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
      <Text
        style={{
          fontSize: 7,
          color: colors.textMuted,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 2,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: tone === "positive" ? colors.success : colors.text,
        }}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View style={styles.dashboardCard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Working Capital &amp; DPO</Text>
          <Text style={styles.dashboardSubtitle}>
            Payment terms distribution and working-capital release potential
          </Text>
        </View>
      </View>

      {/* 4-up KPIs */}
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
        <KpiCard
          label="Current DPO"
          value={
            data.current_weighted_dpo != null
              ? `${data.current_weighted_dpo.toFixed(0)}d`
              : "—"
          }
        />
        <KpiCard
          label="Target DPO"
          value={
            data.target_weighted_dpo != null
              ? `${data.target_weighted_dpo.toFixed(0)}d`
              : "—"
          }
        />
        <KpiCard
          label="Δ DPO"
          value={dpoDelta != null ? `${dpoDelta > 0 ? "+" : ""}${dpoDelta.toFixed(0)}d` : "—"}
          tone={dpoDelta != null && dpoDelta > 0 ? "positive" : "neutral"}
        />
        <KpiCard
          label="WC impact"
          value={formatCurrency(data.working_capital_delta_eur, data.currency)}
          tone={
            data.working_capital_delta_eur != null && data.working_capital_delta_eur > 0
              ? "positive"
              : "neutral"
          }
        />
      </View>

      {/* Terms distribution stacked bar */}
      {data.terms_distribution.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text
            style={{
              fontSize: 7,
              color: colors.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 4,
            }}
          >
            Spend share by payment terms
          </Text>
          <View
            style={{
              flexDirection: "row",
              height: 12,
              backgroundColor: colors.surfaceLight,
              overflow: "hidden",
              marginBottom: 4,
            }}
          >
            {data.terms_distribution.map((t) => (
              <View
                key={t.term_label}
                style={{
                  width: `${t.spend_share_pct}%`,
                  height: 12,
                  backgroundColor: TERM_COLOR[t.term_label] ?? colors.textMuted,
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {data.terms_distribution.map((t) => (
              <View key={t.term_label} style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    backgroundColor: TERM_COLOR[t.term_label] ?? colors.textMuted,
                    marginRight: 4,
                  }}
                />
                <Text style={{ fontSize: 8, color: colors.textMuted }}>
                  {t.term_label} · {t.spend_share_pct.toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* EU Late Payment Directive risk */}
      {flaggedSuppliers.length > 0 && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.destructive,
            backgroundColor: `${colors.destructive}11`,
            padding: 6,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: colors.destructive,
              marginBottom: 4,
            }}
          >
            Suppliers above 60-day EU Late Payment Directive limit
          </Text>
          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingBottom: 2,
              marginBottom: 2,
            }}
          >
            <Text style={{ flex: 2, fontSize: 7, color: colors.textMuted }}>Supplier</Text>
            <Text style={{ flex: 1.5, fontSize: 7, color: colors.textMuted }}>Category</Text>
            <Text style={{ width: 40, fontSize: 7, color: colors.textMuted, textAlign: "right" }}>
              Terms
            </Text>
            <Text style={{ width: 60, fontSize: 7, color: colors.textMuted, textAlign: "right" }}>
              Annual spend
            </Text>
          </View>
          {flaggedSuppliers.map((s) => (
            <View
              key={s.supplier_label}
              style={{ flexDirection: "row", paddingVertical: 2 }}
            >
              <Text style={{ flex: 2, fontSize: 8, color: colors.text }}>{s.supplier_label}</Text>
              <Text style={{ flex: 1.5, fontSize: 8, color: colors.textMuted }}>
                {s.category ?? "—"}
              </Text>
              <Text style={{ width: 40, fontSize: 8, color: colors.text, textAlign: "right" }}>
                {s.payment_terms_days}d
              </Text>
              <Text style={{ width: 60, fontSize: 8, color: colors.text, textAlign: "right" }}>
                {formatCurrency(s.annual_spend, data.currency)}
              </Text>
            </View>
          ))}
          <Text style={{ fontSize: 6.5, color: colors.textMuted, marginTop: 4, lineHeight: 1.3 }}>
            EU Late Payment Directive 2011/7: B2B payment terms above 60 days require explicit
            contractual justification.
          </Text>
        </View>
      )}
    </View>
  );
};
