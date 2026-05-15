import { View, Text } from "@react-pdf/renderer";
import { getPdfColors, getPdfStyles, type PdfThemeMode } from "./theme";
import type { NpvWaterfallData } from "@/lib/dashboard-data-parser";

const formatCurrency = (value: number, currency = "€"): string => {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}${currency}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${currency}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${currency}${abs.toFixed(0)}`;
};

/**
 * PDF NPV Waterfall — mirrors NPVWaterfallDashboard (web).
 * Per-option block: CAPEX / OPEX / Residual / NPV bars scaled to dataset max.
 */
export const PDFNPVWaterfall = ({
  data,
  themeMode,
}: {
  data: NpvWaterfallData;
  themeMode?: PdfThemeMode;
}) => {
  const colors = getPdfColors(themeMode);
  const styles = getPdfStyles(themeMode);
  const currency = data.currency || "€";
  const opts = data.options;
  const preferred = opts.find((o) => o.id === data.preferredOptionId) ?? opts[0];

  const maxBar = Math.max(
    1,
    ...opts.flatMap((o) => [o.capexNominal, o.opexNominal, o.residualValue, Math.abs(o.npv)])
  );

  return (
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>NPV Waterfall</Text>
          <Text style={styles.dashboardSubtitle}>
            Present-value comparison{preferred?.waccPct ? ` at ${preferred.waccPct}% WACC` : ""}
          </Text>
        </View>
        {preferred && (
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 6.5,
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Preferred
            </Text>
            <Text style={{ fontSize: 9, fontWeight: 700, color: preferred.color }}>
              {preferred.name}
            </Text>
            <Text style={{ fontSize: 7, color: colors.textMuted }}>
              NPV {formatCurrency(preferred.npv, currency)}
            </Text>
          </View>
        )}
      </View>

      {opts.map((o) => {
        const isPreferred = o.id === preferred?.id;
        const components: { label: string; value: number; type: "cost" | "credit" | "result" }[] = [
          { label: "CAPEX (nominal)", value: o.capexNominal, type: "cost" },
          { label: "OPEX (nominal)", value: o.opexNominal, type: "cost" },
          ...(o.residualValue > 0
            ? [{ label: "Residual value", value: o.residualValue, type: "credit" as const }]
            : []),
          { label: "NPV (signed)", value: o.npv, type: "result" },
        ];

        return (
          <View
            key={o.id}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              padding: 6,
              marginBottom: 6,
            }}
            wrap={false}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: o.color,
                    marginRight: 4,
                  }}
                />
                <Text style={{ fontSize: 9, fontWeight: 700, color: colors.text }}>
                  {o.name}
                </Text>
                {isPreferred && (
                  <View
                    style={{
                      backgroundColor: `${o.color}1A`,
                      paddingHorizontal: 4,
                      paddingVertical: 1,
                      marginLeft: 6,
                      borderRadius: 3,
                    }}
                  >
                    <Text style={{ fontSize: 6.5, fontWeight: 700, color: o.color }}>
                      CFO RECOMMENDED
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {o.breakEvenYear != null && (
                  <Text style={{ fontSize: 7, color: colors.textMuted }}>
                    Break-even Y{o.breakEvenYear}
                  </Text>
                )}
                {o.ifrsOnBalanceSheet != null && (
                  <Text style={{ fontSize: 7, color: colors.textMuted }}>
                    {o.ifrsOnBalanceSheet ? "On balance sheet" : "Off balance sheet"}
                  </Text>
                )}
              </View>
            </View>

            {components.map((c) => {
              const width = Math.max(2, (Math.abs(c.value) / maxBar) * 100);
              const fill =
                c.type === "credit"
                  ? colors.success
                  : c.type === "result"
                    ? c.value < 0
                      ? colors.destructive
                      : o.color
                    : o.color;
              return (
                <View
                  key={c.label}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ width: 90, fontSize: 7, color: colors.textMuted }}>
                    {c.label}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      height: 6,
                      backgroundColor: colors.surfaceLight,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${width}%`,
                        height: 6,
                        backgroundColor: fill,
                        opacity: c.type === "result" ? 1 : 0.75,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      width: 60,
                      textAlign: "right",
                      fontSize: 8,
                      fontWeight: 600,
                      color: colors.text,
                      marginLeft: 4,
                    }}
                  >
                    {c.type === "credit" ? "−" : ""}
                    {formatCurrency(Math.abs(c.value), currency)}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}

      {data.cashFlowRationale && (
        <Text style={{ fontSize: 7, color: colors.textMuted, lineHeight: 1.3 }}>
          {data.cashFlowRationale}
        </Text>
      )}
    </View>
  );
};
