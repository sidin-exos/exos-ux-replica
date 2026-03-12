/**
 * Server-side PDF document — mirrors the frontend PDFReportDocument.tsx
 * and PDFDashboardVisuals.tsx, adapted for Deno + npm: imports.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
  renderToBuffer,
} from "npm:@react-pdf/renderer@4";
import type { ReactNode } from "npm:react@18";
import { getPdfColors, getPdfStyles } from "./theme.ts";
import {
  extractDashboardData,
  stripDashboardData,
  dashboardConfigs,
  type DashboardType,
  type DashboardData,
  type PdfThemeMode,
  type GeneratePdfPayload,
} from "./types.ts";
import {
  PDFCostWaterfall,
  PDFDecisionMatrix,
  PDFSensitivityAnalysis,
  PDFActionChecklist,
  PDFTimelineRoadmap,
  PDFRiskMatrix,
  PDFKraljicQuadrant,
  PDFTCOComparison,
  PDFLicenseTier,
  PDFScenarioComparison,
  PDFSupplierScorecard,
  PDFSOWAnalysis,
  PDFNegotiationPrep,
  PDFDataQuality,
} from "./dashboards.tsx";

// ── Embedded EXOS logo (dark, 9.8 KB JPEG) ──

const EXOS_LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAIAAgADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDxClooroMAooopAFLSUUALRRRQAUUUUwEooooAKKKKAFopKKAFopKKAFoopKACiiigAooooAWkNFFABS0lFABRRRQAUUUUALRSUtABRRRQAUUUUAFFJRQAtFJS0AJRRRQAUUUUALRSUtABSUtJQAtFFFABRRRQAlLSUtABRRRQAlFFFAC0UlFABS0lFABS0lLQAlFLSUAFFFLQAUUUUAFFFFABRiiigAooooAKKKKACiiigAoopKACiiigAoopaAEoopaAEooooAKKWkoAKKWkoAKWkooAWikpaACiiikAUlLRTAKSlooASiiigBaKKKACiiigAooopAFFFFABRRRQAUUUUwCiiigAooooAKKKKACiiigBKKKWgBKWkpaACiiigAooooAKKKKACiiigAoopKAFooooASlopKACiiigBaKKKAEooooAKWiigBKKKWgAoopKAClopKACiiigApaSloAKSlpKAFopKKAFoopKACiiigAooooAKWkooAWikpaACikpaACiiigAooooAKKSigAzRRRQAtFFFACUtFFABRRRQAUUUUAFFFFABRRRQAUUUUAFJS0lABS0lFAC0UUUAFFJRQAUUtJQAtFJRQAUUUUALRSUtABRSUUALSUUUALRRSUAFFFFAC0UUUCCkpaQ0DCiiigAooooAKKKKAClpKKACiiigAooooAKKKKAFooooEFFFFAxKKKKACiiikAtFFFMBKWkpaACiiigAooooAKKKSgBaKKKBBRRRQMKKKKAEooooAKKKKAClpKWgApKWkoAKKKKAFpKWkoAKKKKACiiigAooooAWkpaSgAooooAWikooAWiiigBKKKKACiiigBaKKKAEooooAKKKKACiiigAooooAWikpaAEooooAKKKKAFFFJS0AFFFFACUUtJQAtFJS0AJS0lLQAlFFFABS0lLQAUUUUCCikooGLSUtJQAUUUUAFLSUtABRRRQISlpKKBi0lFFABRRRQAUUUUAFFFFAC0UUUAFJS0lABS0lLQAUUUUAJRRRQAUUUUAFFFFAC0lFFABRRRQAUUUUAFFFFAC0UUlABRRRQAUUUtABRRRQAUUUUAFFFFACUUUtACUUUtACUUUUAFFFLQAUUUlABRRRQAtFFFACUUtJQAtFJS0AFJS0lABRRRQAUUtFACUUUUAFLSUtABRRRQAUUUUCCkoooGLRSUUAFFFFABRRRQAUUUUAFFFFABRRRQAUtJRQAtFFFABSUUUALRSUUAFLSUUALRRRQAUUUUAJRRRQAUtFFABRRRQAUlLSUALRRSUAFFFLQAlLRSUALSUUUAFFFFAC0UlFAC0UUlABRRRQAtFAoNACUUUUAFLSUUALRRRQIKKKKBiUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAtFFFACUUUUAFFFFABRRRQAUUUUAFFFFABS0lLQAUUUUAJRRRQAtFFFABRRRQAUlLRQAlFFLQAUUUUAJRS0lAC0lLSUALSUtJQAUUUUAFFFFAC0hoooAKKKKAClpKKACiiigAooooAKWkooAWiikoAWikpaAEpaSigBaKSigAooooAKKKKACiiigBaKKKACiiigAoopKACiiigBaSiigAooooAKWkooAWiiigAooooAKKKKACiiigAooooAKKKKBBRRSUDFopKKAFooooAKQ0tFACUUUUAFFFLQAlFFFABS0lLQAlFLSUAFFLRQAlLRRQAUUYowT0FAgooooAKKKKACikooGFFLSUAFLRRQAlFFFABRRRQAUtJRQAtJRRQAUUUUAFFFFABRRRQAUUUUAFFFFAC0UUUAJRRRQAtFFFABRRRQAUUUUAFFFFAgpKWigYlLSUtABRRRQIKKKKAEooooGLRRSUAFLSUUAFLRSUALRRRQAUUUUCClpK1dC0G81688i2UKi8ySt91B/j7U0m3ZE1JxpxcpOyRBpul3er3iWtlEZJW/JR6k9hXr/AIZ8JWfh+33NtnvWHzzEcD2X0H8/0FnQ9Fs9CshbWi5JwZJW+9IfU+3oO1aoNd1Kio6vc+RzHNZ124U9I/mcp4q8F2usxNcWUaW98oJBUALL7N6H3/P28knt5rWd4J4miljO1kcYINfQ1YPibwvaeIbUkhYr1B+6nx/463qP5du4M1qN9Yl5Zmzpfu6zvHv2/4B4lRVvUtMu9JvXtbyExyr+II9Qe4qpXHY+si1JXTEooaKRQUUUUAFFFFABRRRQAUlLSUAFFFLQAUUUUAFFFFABSUtJQAUUUUALRRRQAUUUUAFFFFABRRRQAUtFFABRRRQAUlLRQAlFFLQAUUUUAJRS0lAC0lLSUALSUtJQAUUUUAFFFFAC0UlFAC0UUlABRRRQAtFAoNACUUUUAFLSUUALRRRQIKKKKBiUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAtFFFACUUUUAFFFFABRRRQAUUUUAFFFFABS0lLQAUUUUAJRRRQAtFFFABRRRQAUlLRQAlFFLQAUUUUAJRS0lAC0lLSUALSUtJQAUUUUAFFFFAC0UlFAC0UUlABRRRQAtFAoNACUUUUAFLSUUALRRRQIKKKKBiUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAtFFFACUUUUAFFFFABRRRQAUUUUAFFFFABS0lLQAUUUUAJRRRQAtFFFABRRRQAUlLRQAlFFLQAUUUUAJRS0lAC0lLSUALSUtJQAUUUUAFFFFAC0hoooAKKKKAClpKKACiiigAooooAKWkooAWiikoAWikpaAEpaSigBaKSigAooooAKKKKACiiigBaKKKACiiigAoopKACiiigBaSiigAooooAKWkooAWiiigAooooAKKKKACiiigAooooAKKKKBBRRSUDFopKKAFooooAKQ0tFACUUUUAFFFLQAlFFFABS0lLQAlFLSUAFFLRQAlLRRQAUUUUCCkoooGLRSUUAFFFFABRRRQAUUUUAFFFFABRRRQAUtJRQAtFFFABSUUUALRSUUAFLSUUALRRRQAUUUUAJRRRQAUtFFABRRRQAUlLSUALRRSUAFFFLQAlLRSUALSUUUAFFFFAC0UlFAC0UUlABRRRQAtFAoNACUUUUAFLSUUALRRRQIKKKKBiUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAtFFFACUUUUAFFFFABRRRQAUUUUAFFFFABS0lLQAUUUUAJRRRQAtFFFABRRRQAUUUUCCiiigAooooAKKKKACiiigAopKWgAooooAKKKKACiikoAKKKKACiiigBaKKKACiiigAooooAKKKKAFooooAKKKKBBRRSUDFopKKAFooooAKQ0tFACUUUUAFFFLQAlFFFABS0lLQAlFLSUAFFLRQAlLRRQAUUUUAFFFFABRRRQIKKKKBhRRRQAUUUUAFFFFABRRRQAtFFFABRRRQAUUUUAFFFFAC0UUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFLQAUUUUAFFFFABRRRQAlFGKKAFooooAKKKKACiiigAooooEFFFFAwooooAKKKKACiiigAooooASloooAKKKKACiiigBKKKKAFooooAKKKKBBRRRQMKSlooASiiigBaSlooASilpKAFooooASiiloAKKKKACiiigBKKKWgBKWkooAWiikoAKWkooAWiiigBKKKKAFooooEFJRRQMWiiigAooooAKKKKACiikoELRSUtAwooooEFFFFAwooooAKSiloAKKKKACiiigAooooASiiigBaKKKACiiigAooooAKSlpKAClpKWgAoopKAFpKKKAClpKKAFooooAKKKKBBRRRQMKKKKACiiigAooooASiiigBaKSigAooooAWiiigApKWkoAWikpaAEooooAWiiigQlFFLQMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBKKKKAFooooAKKKKACiiigAopKWgAooooAKKKKACiiigApKWigBKWkooAWiiigAooooASlpKKAFopKWgAooopAFFFJTAWikpaACkoooAWikpaACiiigAooooAKKBRQAUUUUAJS0UUAFFFFABRRRQIKKKKBhRRRQAUUUUCCiikoGLRRRQAUUUlABRRRQAtFFFABRRRQAUUUUAFFFFABRRRQIKKKKBhRRRQIKKKKBiUtFFABRRRQIKSlpKBi0UUUAFFFFABRRRQAlLRiigAooooAKKKKACiikoAWiiigAoopKAFooooAKKKWgBKKWigR//Z";

// ── Color palettes (document-level) ──

const darkColors = {
  primary: "#6b9e8a",
  primaryDark: "#5a8a76",
  background: "#1e1e2e",
  surface: "#262637",
  surfaceLight: "#2f2f42",
  text: "#d4d4dc",
  textMuted: "#8b8b9e",
  textSemiTransparent: "rgba(212, 212, 220, 0.6)",
  accent: "#6b9e8a",
  success: "#6bbf8a",
  warning: "#c9a24d",
  destructive: "#c06060",
  border: "#3a3a4e",
  footerBrand: "rgba(212, 212, 220, 0.35)",
  gradientLayer1: "#232338",
  gradientLayer2: "rgba(107, 158, 138, 0.06)",
  gradientLayer3: "#1a1a2a",
};

const lightColors = {
  primary: "#4a8a74",
  primaryDark: "#3d7563",
  background: "#f8f7f4",
  surface: "#ffffff",
  surfaceLight: "#f0efe8",
  text: "#1e1e2e",
  textMuted: "#6b6b7e",
  textSemiTransparent: "rgba(30, 30, 46, 0.5)",
  accent: "#4a8a74",
  success: "#3a9960",
  warning: "#b08930",
  destructive: "#c04040",
  border: "#d8d8e0",
  footerBrand: "rgba(30, 30, 46, 0.25)",
  gradientLayer1: "#f5f4f0",
  gradientLayer2: "rgba(74, 138, 116, 0.04)",
  gradientLayer3: "#efeeea",
};

type DocColors = typeof darkColors;

function getDocColors(mode?: PdfThemeMode): DocColors {
  return mode === "light" ? lightColors : darkColors;
}

// ── Style factory ──

function buildDocStyles(c: DocColors) {
  return StyleSheet.create({
    page: {
      backgroundColor: c.background,
      padding: 40,
      fontFamily: "Helvetica",
      color: c.text,
    },
    pageWithHeader: {
      backgroundColor: c.background,
      paddingTop: 50,
      paddingLeft: 40,
      paddingRight: 40,
      paddingBottom: 40,
      fontFamily: "Helvetica",
      color: c.text,
    },
    runningHeader: {
      position: "absolute",
      top: 0,
      left: 40,
      right: 40,
      paddingTop: 10,
      paddingBottom: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    runningHeaderText: {
      fontSize: 8,
      color: c.textMuted,
      fontFamily: "Helvetica",
    },
    tocSection: { marginBottom: 24 },
    tocRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
    tocLabel: { fontSize: 10, color: c.primary, fontFamily: "Helvetica-Bold", textDecoration: "none" },
    tocLeader: { flex: 1, borderBottomWidth: 1, borderBottomStyle: "dashed", borderBottomColor: c.border + "60", marginHorizontal: 10, marginBottom: 3 },
    tocPageHint: { fontSize: 9, color: c.textMuted, fontFamily: "Helvetica" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 20 },
    logoSection: { flexDirection: "row", alignItems: "center" },
    logoImage: { width: 40, height: 40, marginRight: 12 },
    brandName: { fontSize: 23, fontFamily: "Helvetica-Bold", fontWeight: 700, color: c.text, letterSpacing: 1 },
    brandTagline: { fontSize: 9, color: c.textMuted, marginTop: 2 },
    reportMeta: { textAlign: "right" },
    reportBadge: { backgroundColor: c.surfaceLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 4 },
    reportBadgeText: { fontSize: 8, color: c.primary, fontWeight: 600 },
    reportDate: { fontSize: 9, color: c.textMuted },
    titleSection: { marginBottom: 30 },
    reportTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", fontWeight: 700, color: c.primary, marginBottom: 8, letterSpacing: 0.5 },
    reportSubtitle: { fontSize: 12, color: c.textMuted },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", fontWeight: 600, color: c.text, letterSpacing: 0.5 },
    sectionContent: { backgroundColor: c.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: c.border },
    keyPointText: { fontSize: 12, color: c.text, lineHeight: 1.5, marginBottom: 4 },
    analysisText: { fontSize: 12, color: c.text, lineHeight: 1.6, marginBottom: 8 },
    analysisTextHighlight: { fontSize: 12, color: c.primary, lineHeight: 1.6, marginBottom: 8, fontWeight: 700, fontFamily: "Courier-Bold", backgroundColor: c.primary + "15", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 3 },
    analysisSubHeader: { fontSize: 13, fontFamily: "Helvetica-Bold", fontWeight: 600, color: c.text, marginTop: 10, marginBottom: 6 },
    sectionBlockBase: { backgroundColor: c.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 15 },
    sectionBlockRecommendations: { backgroundColor: c.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: c.primary, marginBottom: 15 },
    sectionBlockRisks: { backgroundColor: c.destructive + "10", borderRadius: 8, padding: 16, borderWidth: 1, borderColor: c.destructive + "30", marginBottom: 15 },
    sectionBlockNextSteps: { backgroundColor: c.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 15 },
    sectionBlockCostDrivers: { backgroundColor: c.surfaceLight, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 15 },
    sectionBlockHeader: { fontSize: 14, fontFamily: "Helvetica-Bold", fontWeight: 700, color: c.text, marginBottom: 10 },
    parameterBlock: { marginBottom: 10 },
    parameterLabel: { fontSize: 9, color: c.textMuted, fontFamily: "Helvetica", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 2 },
    parameterValue: { fontSize: 10, color: c.text, fontFamily: "Helvetica-Bold", lineHeight: 1.4 },
    parameterTagRow: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 4, marginTop: 2 },
    parameterTag: { backgroundColor: c.surfaceLight, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 2 },
    parameterTagText: { fontSize: 9, color: c.text, fontFamily: "Helvetica-Bold" },
    numberedItem: { flexDirection: "row" as const, alignItems: "flex-start" as const, marginBottom: 8 },
    numberedBullet: { width: 20, height: 20, backgroundColor: c.primary, borderRadius: 10, justifyContent: "center" as const, alignItems: "center" as const, marginRight: 10, marginTop: 1 },
    numberedBulletText: { color: "#ffffff", fontSize: 9, fontWeight: 700 },
    checklistItem: { flexDirection: "row" as const, alignItems: "flex-start" as const, marginBottom: 8 },
    checkBox: { width: 14, height: 14, borderWidth: 1.5, borderColor: c.primary, borderRadius: 2, marginRight: 10, marginTop: 2 },
    warningIcon: { fontSize: 14, marginRight: 6 },
    riskHeaderRow: { flexDirection: "row" as const, alignItems: "center" as const, marginBottom: 10 },
    limitationItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
    limitationBullet: { width: 6, height: 6, backgroundColor: c.textMuted, borderRadius: 3, marginTop: 5, marginRight: 8 },
    limitationText: { flex: 1, fontSize: 10, color: c.textMuted, lineHeight: 1.5 },
    methodologyBox: { borderWidth: 1, borderColor: c.border, borderRadius: 6, padding: 14, marginBottom: 12 },
    methodologySubHeader: { fontSize: 11, fontFamily: "Helvetica-Bold", color: c.text, marginBottom: 6 },
    methodologyText: { fontSize: 10, fontFamily: "Helvetica", color: c.textMuted, lineHeight: 1.5 },
    auditTrail: { marginTop: 10, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: c.border },
    footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "column", alignItems: "center", borderTopWidth: 1, borderTopColor: c.border, paddingTop: 15 },
    footerBrand: { fontSize: 9, fontFamily: "Helvetica", color: c.footerBrand, fontWeight: 400, marginBottom: 8 },
    footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
    footerText: { fontSize: 9, color: c.textMuted },
    pageNumber: { fontSize: 9, color: c.textMuted },
    accentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: c.primary },
    gradientLayer1: { position: "absolute", top: 0, left: 0, right: 0, bottom: "50%", backgroundColor: c.gradientLayer1 },
    gradientLayer2: { position: "absolute", top: "30%", left: 0, right: 0, bottom: "30%", backgroundColor: c.gradientLayer2 },
    gradientLayer3: { position: "absolute", top: "50%", left: 0, right: 0, bottom: 0, backgroundColor: c.gradientLayer3 },
  });
}

const darkDocStyles = buildDocStyles(darkColors);
const lightDocStyles = buildDocStyles(lightColors);

function getDocStyles(mode?: PdfThemeMode) {
  return mode === "light" ? lightDocStyles : darkDocStyles;
}

// ── Helpers ──

const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\s+/gm, "")
    .replace(/^#{1,4}\s*/gm, "")
    .replace(/^\s*\d+\.\s+/, "")          // strip leading numbered list prefix ("1. ")
    .replace(/`{1,3}/g, "")               // strip backticks
    .replace(/([$€£])(\d)/g, "$1\u2009$2") // thin space between currency symbol and number
    .trim();
};

const extractExecutiveSummary = (text: string): { findings: string[]; recommendations: string[] } => {
  const lines = text.split("\n").map(cleanMarkdown).filter((l) => l.length > 15);
  const findingPattern = /(\$|€|%|found|indicates?|presents?|analysis|current(ly)?|total|average|estimated|reveals?|shows?)/i;
  const recommendPattern = /\b(target|aim to|recommend|should|negotiate|consider|implement|prioritize|pursue|establish|ensure|leverage|explore)\b/i;
  const findings: string[] = [];
  const recommendations: string[] = [];
  for (const line of lines) {
    if (recommendations.length < 3 && recommendPattern.test(line)) {
      recommendations.push(line);
    } else if (findings.length < 3 && findingPattern.test(line)) {
      findings.push(line);
    }
    if (findings.length >= 3 && recommendations.length >= 3) break;
  }
  if (findings.length === 0 || recommendations.length === 0) {
    const pool = lines.slice(0, 6);
    const mid = Math.ceil(pool.length / 2);
    if (findings.length === 0) findings.push(...pool.slice(0, mid).slice(0, 3));
    if (recommendations.length === 0) recommendations.push(...pool.slice(mid).slice(0, 3));
  }
  return { findings, recommendations };
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ── Section categorization ──

type SectionType = "findings" | "recommendations" | "risks" | "nextSteps" | "costDrivers" | "general";

interface AnalysisSection {
  type: SectionType;
  title: string;
  lines: string[];
}

const sectionPatterns: Record<Exclude<SectionType, "general">, RegExp> = {
  costDrivers: /\b(cost\s*driver|key\s*cost|cost\s*factor|cost\s*breakdown|cost\s*component|cost\s*structure)\b/i,
  findings: /\b(finding|analysis|overview|assessment|current\s*state|summary|market|evaluation)\b/i,
  recommendations: /\b(recommend|action|strateg|approach|should|suggest|advise|optimi[sz])\b/i,
  risks: /\b(risk|challeng|threat|concern|limitation|vulnerabilit|caveat|warning)\b/i,
  nextSteps: /\b(next\s*step|implement|timeline|roadmap|action\s*plan|phase|mileston|rollout)\b/i,
};

const categorizeAnalysisSections = (lines: string[]): AnalysisSection[] => {
  const sections: AnalysisSection[] = [];
  let current: AnalysisSection = { type: "general", title: "Analysis Overview", lines: [] };
  for (const rawLine of lines) {
    const hashMatch = rawLine.match(/^(#{1,4})\s*(.*)$/);
    const cleanLine = cleanMarkdown(rawLine);
    if (!cleanLine) continue;
    const isHeader =
      !!hashMatch ||
      (cleanLine.endsWith(":") && cleanLine.length < 80) ||
      (cleanLine.length < 60 && /^[A-Z]/.test(cleanLine) && !cleanLine.includes("."));
    if (isHeader) {
      if (current.lines.length > 0) sections.push(current);
      let detectedType: SectionType = "general";
      for (const [type, pattern] of Object.entries(sectionPatterns) as [Exclude<SectionType, "general">, RegExp][]) {
        if (pattern.test(cleanLine)) { detectedType = type; break; }
      }
      current = { type: detectedType, title: cleanLine.replace(/:$/, ""), lines: [] };
    } else {
      current.lines.push(cleanLine);
    }
  }
  if (current.lines.length > 0) sections.push(current);
  return sections;
};

const hasMetricHighlight = (text: string): boolean => {
  return /(\$|€|£)\s*[\d,.]+|[\d,.]+\s*%|\b(aim\s+to|target)\b/i.test(text);
};

// ── Report hash ──

const generateReportHash = (title: string, ts: string): string => {
  let hash = 0;
  const str = `${title}-${ts}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 8);
};

// ── TOC entries ──

interface TocEntry { label: string; anchor: string; }

const buildTocEntries = (hasDashboards: boolean, hasParams: boolean): TocEntry[] => {
  const entries: TocEntry[] = [];
  if (hasDashboards) entries.push({ label: "Analysis Visualizations", anchor: "section-visualizations" });
  entries.push({ label: "Detailed Analysis", anchor: "section-detailed-analysis" });
  entries.push({ label: "Methodology & Limitations", anchor: "section-methodology" });
  entries.push({ label: "Data Quality Assessment", anchor: "section-data-quality" });
  if (hasParams) entries.push({ label: "Analysis Parameters", anchor: "section-parameters" });
  return entries;
};

// ── Reusable running header ──

const RunningHeader = ({ scenarioTitle, dateStr, styles: s }: { scenarioTitle: string; dateStr: string; styles: ReturnType<typeof buildDocStyles> }) => (
  <View style={s.runningHeader} fixed>
    <Text style={s.runningHeaderText}>EXOS | {/analysis$/i.test(scenarioTitle.trim()) ? scenarioTitle : `${scenarioTitle} Analysis`}</Text>
    <Text style={s.runningHeaderText}>{dateStr}</Text>
  </View>
);

// ── Reusable footer ──

const ReportFooter = ({ reportHash, styles: s }: { reportHash: string; styles: ReturnType<typeof buildDocStyles> }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerBrand}>Powered by EXOS Procurement Intelligence</Text>
    <View style={s.footerRow}>
      <Text style={s.footerText}>Confidential • For internal use only</Text>
      <Text
        style={s.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages} • ID: ${reportHash}`
        }
      />
    </View>
  </View>
);

// ── Dashboard pages ──

const dashboardDataKey: Record<string, keyof DashboardData> = {
  "action-checklist": "actionChecklist",
  "decision-matrix": "decisionMatrix",
  "cost-waterfall": "costWaterfall",
  "timeline-roadmap": "timelineRoadmap",
  "kraljic-quadrant": "kraljicQuadrant",
  "tco-comparison": "tcoComparison",
  "license-tier": "licenseTier",
  "sensitivity-spider": "sensitivitySpider",
  "risk-matrix": "riskMatrix",
  "scenario-comparison": "scenarioComparison",
  "supplier-scorecard": "supplierScorecard",
  "sow-analysis": "sowAnalysis",
  "negotiation-prep": "negotiationPrep",
  "data-quality": "dataQuality",
};

const PDFNoDataPlaceholder = ({ name, themeMode }: { name: string; themeMode?: PdfThemeMode }) => {
  const isLight = themeMode === "light";
  return (
    <View style={{
      backgroundColor: isLight ? "#f9fafb" : "#2a2a3a",
      padding: 24,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 150,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: isLight ? "#d1d5db" : "#4a4a5e",
    }}>
      <Text style={{ fontSize: 12, fontFamily: "Helvetica", fontWeight: 600, color: isLight ? "#374151" : "#9ca3af", marginBottom: 8 }}>
        {name}
      </Text>
      <Text style={{ fontSize: 10, fontFamily: "Helvetica", color: "#6b7280", textAlign: "center", lineHeight: 1.5 }}>
        Visualization data could not be extracted automatically.{"\n"}Please refer to the detailed analysis section.
      </Text>
    </View>
  );
};

const PDFDashboardPlaceholder = ({ name, themeMode }: { name: string; themeMode?: PdfThemeMode }) => {
  const s = getPdfStyles(themeMode);
  const c = getPdfColors(themeMode);
  return (
    <View style={s.dashboardCard}>
      <View style={s.dashboardHeader}>
        <View style={s.dashboardIcon} />
        <View>
          <Text style={s.dashboardTitle}>{name}</Text>
          <Text style={s.dashboardSubtitle}>Visualization unavailable</Text>
        </View>
      </View>
      <View style={{ padding: 12, alignItems: "center" }}>
        <Text style={{ fontSize: 9, color: c.textMuted, textAlign: "center" }}>
          This dashboard doesn't have a PDF visual yet.
        </Text>
      </View>
    </View>
  );
};

const renderDashboard = (dashboardType: DashboardType, parsedData?: DashboardData | null, themeMode?: PdfThemeMode): ReactNode => {
  const dataKey = dashboardDataKey[dashboardType];
  if (dataKey && (!parsedData || !parsedData[dataKey])) {
    const config = dashboardConfigs[dashboardType as DashboardType];
    return <PDFNoDataPlaceholder name={config?.name || String(dashboardType)} themeMode={themeMode} />;
  }
  switch (dashboardType) {
    case "action-checklist": return <PDFActionChecklist data={parsedData!.actionChecklist!} themeMode={themeMode} />;
    case "decision-matrix": return <PDFDecisionMatrix data={parsedData!.decisionMatrix!} themeMode={themeMode} />;
    case "cost-waterfall": return <PDFCostWaterfall data={parsedData!.costWaterfall!} themeMode={themeMode} />;
    case "timeline-roadmap": return <PDFTimelineRoadmap data={parsedData!.timelineRoadmap!} themeMode={themeMode} />;
    case "kraljic-quadrant": return <PDFKraljicQuadrant data={parsedData!.kraljicQuadrant!} themeMode={themeMode} />;
    case "tco-comparison": return <PDFTCOComparison data={parsedData!.tcoComparison!} themeMode={themeMode} />;
    case "license-tier": return <PDFLicenseTier data={parsedData!.licenseTier!} themeMode={themeMode} />;
    case "sensitivity-spider": return <PDFSensitivityAnalysis data={parsedData!.sensitivitySpider!} themeMode={themeMode} />;
    case "risk-matrix": return <PDFRiskMatrix data={parsedData!.riskMatrix!} themeMode={themeMode} />;
    case "scenario-comparison": return <PDFScenarioComparison data={parsedData!.scenarioComparison!} themeMode={themeMode} />;
    case "supplier-scorecard": return <PDFSupplierScorecard data={parsedData!.supplierScorecard!} themeMode={themeMode} />;
    case "sow-analysis": return <PDFSOWAnalysis data={parsedData!.sowAnalysis!} themeMode={themeMode} />;
    case "negotiation-prep": return <PDFNegotiationPrep data={parsedData!.negotiationPrep!} themeMode={themeMode} />;
    case "data-quality": return <PDFDataQuality data={parsedData!.dataQuality!} themeMode={themeMode} />;
    default: {
      const config = dashboardConfigs[dashboardType as DashboardType];
      return <PDFDashboardPlaceholder name={config?.name || String(dashboardType)} themeMode={themeMode} />;
    }
  }
};

function chunkPairs<T>(arr: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    result.push(arr.slice(i, i + 2));
  }
  return result;
}

function buildPageStyles(mode?: PdfThemeMode) {
  const c = getPdfColors(mode);
  const isLight = mode === "light";
  return {
    page: { backgroundColor: c.background, padding: 40, fontFamily: "Courier" as const, color: c.text },
    accentBar: { position: "absolute" as const, top: 0, left: 0, right: 0, height: 4, backgroundColor: c.primary },
    gradientLayer1: { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: "50%", backgroundColor: isLight ? "#f5f4f0" : "#232338" },
    gradientLayer2: { position: "absolute" as const, top: "30%", left: 0, right: 0, bottom: "30%", backgroundColor: isLight ? "rgba(74, 138, 116, 0.04)" : "rgba(107, 158, 138, 0.06)" },
    gradientLayer3: { position: "absolute" as const, top: "50%", left: 0, right: 0, bottom: 0, backgroundColor: isLight ? "#efeeea" : "#1a1a2a" },
    footer: { position: "absolute" as const, bottom: 30, left: 40, right: 40, flexDirection: "column" as const, alignItems: "center" as const, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 15 },
    footerBrand: { fontSize: 9, fontFamily: "Courier" as const, color: isLight ? "rgba(30, 30, 46, 0.25)" : "rgba(212, 212, 220, 0.35)", fontWeight: 400 as const, marginBottom: 8 },
    footerRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, width: "100%" },
    footerText: { fontSize: 9, color: c.textMuted },
    pageNumber: { fontSize: 9, color: c.textMuted },
    sectionHeader: { flexDirection: "row" as const, alignItems: "center" as const, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontFamily: "Helvetica" as const, fontWeight: 600 as const, color: c.text },
  };
}

const darkPageStyles = buildPageStyles("dark");
const lightPageStylesCache = buildPageStyles("light");

function getPageStyles(mode?: PdfThemeMode) {
  return mode === "light" ? lightPageStylesCache : darkPageStyles;
}

const PDFDashboardPages = ({
  selectedDashboards,
  parsedData,
  pdfTheme,
  scenarioTitle,
  reportDate,
  reportHash,
}: {
  selectedDashboards: DashboardType[];
  parsedData?: DashboardData | null;
  pdfTheme?: PdfThemeMode;
  scenarioTitle?: string;
  reportDate?: string;
  reportHash?: string;
}) => {
  if (!selectedDashboards || selectedDashboards.length === 0) return null;

  const pairs = chunkPairs(selectedDashboards);
  const pageStyles = getPageStyles(pdfTheme);
  const c = getPdfColors(pdfTheme);
  const isLight = pdfTheme === "light";

  const runningHeaderStyle = {
    position: "absolute" as const,
    top: 0, left: 40, right: 40,
    paddingTop: 10, paddingBottom: 6,
    borderBottomWidth: 0.5, borderBottomColor: c.border,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  };
  const runningHeaderTextStyle = {
    fontSize: 8,
    color: isLight ? "rgba(30, 30, 46, 0.5)" : "rgba(212, 212, 220, 0.6)",
    fontFamily: "Helvetica" as const,
  };
  const dashPageStyle = { ...pageStyles.page, paddingTop: 50 };

  return (
    <>
      {pairs.map((pair, pairIdx) => (
        <Page key={`dash-page-${pairIdx}`} size="A4" style={dashPageStyle}>
          <View style={pageStyles.gradientLayer1} />
          <View style={pageStyles.gradientLayer2} />
          <View style={pageStyles.gradientLayer3} />
          <View style={pageStyles.accentBar} />
          <View style={runningHeaderStyle} fixed>
            <Text style={runningHeaderTextStyle}>EXOS | {/analysis$/i.test((scenarioTitle || "Report").trim()) ? scenarioTitle : `${scenarioTitle || "Report"} Analysis`}</Text>
            <Text style={runningHeaderTextStyle}>{reportDate || ""}</Text>
          </View>
          <View style={pairIdx === 0 ? { ...pageStyles.sectionHeader } : pageStyles.sectionHeader} id={pairIdx === 0 ? "section-visualizations" : undefined}>
            <View style={{ width: 8, height: 8, backgroundColor: c.primary, borderRadius: 2, marginRight: 8 }} />
            <Text style={pageStyles.sectionTitle}>
              Analysis Visualizations {pairs.length > 1 ? `(${pairIdx + 1}/${pairs.length})` : ""}
            </Text>
          </View>
          {pair.map((dashboardType, idx) => (
            <View key={dashboardType} style={{ marginBottom: idx === 0 && pair.length > 1 ? 16 : 0 }} minPresenceAhead={1} wrap={false}>
              {renderDashboard(dashboardType, parsedData, pdfTheme)}
            </View>
          ))}
          <View style={pageStyles.footer} fixed>
            <Text style={pageStyles.footerBrand}>Powered by EXOS Procurement Intelligence</Text>
            <View style={pageStyles.footerRow}>
              <Text style={pageStyles.footerText}>Confidential • For internal use only</Text>
              <Text style={pageStyles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}${reportHash ? ` • ID: ${reportHash}` : ""}`} />
            </View>
          </View>
        </Page>
      ))}
    </>
  );
};

// ── Main Document ──

const PDFReportDocument = ({
  scenarioTitle,
  analysisResult,
  formData,
  timestamp,
  selectedDashboards = [],
  pdfTheme = "dark",
}: {
  scenarioTitle: string;
  analysisResult: string;
  formData: Record<string, string>;
  timestamp: string;
  selectedDashboards?: DashboardType[];
  pdfTheme?: PdfThemeMode;
}) => {
  const parsedData = extractDashboardData(analysisResult);
  const strippedAnalysis = stripDashboardData(analysisResult);
  const { findings, recommendations } = extractExecutiveSummary(strippedAnalysis);
  const analysisLines = strippedAnalysis.split("\n").filter((line) => line.trim());

  const styles = getDocStyles(pdfTheme);
  const colors = getDocColors(pdfTheme);
  const reportHash = generateReportHash(scenarioTitle, timestamp);
  const formattedDate = formatDate(timestamp);
  const hasDashboards = selectedDashboards.length > 0;
  const hasParams = Object.keys(formData).length > 0;
  const tocEntries = buildTocEntries(hasDashboards, hasParams);
  const showToc = hasDashboards;

  return (
    <Document>
      {/* Page 1: Cover */}
      <Page size="A4" style={styles.page}>
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
        <View style={styles.accentBar} />

        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image src={EXOS_LOGO} style={styles.logoImage} />
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
          <Text style={styles.reportTitle}>
            {/analysis$/i.test(scenarioTitle.trim()) ? scenarioTitle : `${scenarioTitle} Analysis`}
          </Text>
          <Text style={styles.reportSubtitle}>
            Strategic procurement analysis powered by EXOS Procurement Intelligence
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ width: 8, height: 8, backgroundColor: colors.primary, borderRadius: 2, marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Executive Summary</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.analysisSubHeader}>Key Findings</Text>
            {findings.map((point, i) => (
              <Text key={`f-${i}`} style={styles.keyPointText}>
                {i + 1}. {point}
              </Text>
            ))}
            <View style={{ height: 12 }} />
            <Text style={styles.analysisSubHeader}>Top Recommendations</Text>
            <View style={{ backgroundColor: colors.warning + "10", borderRadius: 6, padding: 10 }}>
              {recommendations.map((point, i) => (
                <Text key={`r-${i}`} style={{ ...styles.keyPointText, marginBottom: 6 }}>
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
              <View style={{ width: 8, height: 8, backgroundColor: colors.primary, borderRadius: 2, marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Contents</Text>
            </View>
            <View style={styles.sectionContent}>
              {tocEntries.map((entry, i) => (
                <View key={entry.anchor} style={styles.tocRow}>
                  <Link src={`#${entry.anchor}`}>
                    <Text style={styles.tocLabel}>{i + 1}. {entry.label}</Text>
                  </Link>
                  <View style={styles.tocLeader} />
                  <Text style={styles.tocPageHint}>→</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <ReportFooter reportHash={reportHash} styles={styles} />
      </Page>

      {/* Dashboard pages */}
      {hasDashboards && (
        <PDFDashboardPages
          selectedDashboards={selectedDashboards}
          parsedData={parsedData}
          pdfTheme={pdfTheme}
          scenarioTitle={scenarioTitle}
          reportDate={formattedDate}
          reportHash={reportHash}
        />
      )}

      {/* Detailed Analysis + Data Quality + Parameters */}
      <Page size="A4" style={styles.pageWithHeader}>
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
        <View style={styles.accentBar} />

        <RunningHeader scenarioTitle={scenarioTitle} dateStr={formattedDate} styles={styles} />

        {(() => {
          const sections = categorizeAnalysisSections(analysisLines);
          return sections.map((section, si) => {
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
              <View key={`section-${si}`} style={{ marginBottom: 15 }}>
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
          });
        })()}

        {/* Methodology & Limitations */}
        {(() => {
          const allKeys = Object.keys(formData);
          const filledKeys = allKeys.filter(k => formData[k] && formData[k].trim() !== "");
          const missingKeys = allKeys.filter(k => !formData[k] || formData[k].trim() === "");
          const totalFields = Math.max(allKeys.length, 1);
          const coveragePct = Math.round((filledKeys.length / totalFields) * 100);
          const confidenceLevel = coveragePct >= 80 ? "High" : coveragePct >= 50 ? "Medium" : "Low";
          const confidenceColor = coveragePct >= 80 ? colors.success : coveragePct >= 50 ? colors.warning : colors.destructive;

          return (
            <>
              <View style={styles.section} id="section-methodology" wrap={false}>
                <View style={styles.sectionHeader}>
                  <View style={{ width: 8, height: 8, backgroundColor: colors.primary, borderRadius: 2, marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>Methodology & Limitations</Text>
                </View>
                <View style={styles.sectionContent}>
                  <View style={styles.methodologyBox}>
                    <Text style={styles.methodologySubHeader}>Analysis Model</Text>
                    <Text style={styles.methodologyText}>
                      Analysis performed by EXOS Sentinel Pipeline using advanced LLM orchestration with multi-stage validation and grounding.
                    </Text>
                  </View>
                  <View style={styles.methodologyBox}>
                    <Text style={styles.methodologySubHeader}>Data Sources</Text>
                    <Text style={styles.methodologyText}>
                      Sources include global industry benchmarks, real-time commodity pricing, and user-provided parameters. Market data is refreshed periodically to reflect current conditions.
                    </Text>
                  </View>
                  <View style={styles.methodologyBox}>
                    <Text style={styles.methodologySubHeader}>Confidence Assessment</Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <View>
                        <Text style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>
                          {filledKeys.length} of {totalFields} parameters provided
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                          {coveragePct}% input coverage
                        </Text>
                      </View>
                      <View style={{ backgroundColor: confidenceColor + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: confidenceColor }}>
                        <Text style={{ fontSize: 10, fontWeight: 700, color: confidenceColor }}>
                          {confidenceLevel} Confidence
                        </Text>
                      </View>
                    </View>
                    <View style={{ height: 8, backgroundColor: colors.surfaceLight, borderRadius: 4, overflow: "hidden" }}>
                      <View style={{ width: `${coveragePct}%`, height: 8, backgroundColor: confidenceColor, borderRadius: 4 }} />
                    </View>
                  </View>
                  <View style={styles.methodologyBox}>
                    <Text style={styles.methodologySubHeader}>Limitations</Text>
                    {[
                      "This analysis is AI-generated and should be validated by qualified procurement professionals.",
                      "Cost estimates are indicative and based on available data at time of analysis.",
                      "Results may vary based on market conditions and data completeness.",
                    ].map((item, i) => (
                      <View key={i} style={styles.limitationItem}>
                        <View style={styles.limitationBullet} />
                        <Text style={styles.limitationText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.auditTrail}>
                    <Text style={{ fontSize: 8, color: colors.textMuted }}>
                      Analysis ID: {reportHash} | Timestamp: {new Date(timestamp).toISOString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Data Quality Assessment */}
              <View style={styles.section} id="section-data-quality">
                <View style={styles.sectionHeader}>
                  <View style={{ width: 8, height: 8, backgroundColor: colors.primary, borderRadius: 2, marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>Data Quality Assessment</Text>
                </View>
                <View style={styles.sectionContent}>
                  {missingKeys.length > 0 && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, marginBottom: 4 }}>Missing parameters:</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {missingKeys.map(key => (
                          <View key={key} style={{ backgroundColor: colors.destructive + "15", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, marginRight: 6, marginBottom: 4 }}>
                            <Text style={{ fontSize: 9, color: colors.destructive }}>
                              {key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: missingKeys.length > 0 ? 4 : 0 }}>
                    {missingKeys.length > 0
                      ? "Provide additional parameters to improve analysis accuracy."
                      : "All parameters provided — analysis confidence is optimal."}
                  </Text>
                </View>
              </View>
            </>
          );
        })()}

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
                  return (
                    <View key={key} style={styles.parameterBlock}>
                      <Text style={styles.parameterLabel}>{label}</Text>
                      <Text style={styles.parameterValue}>{value}</Text>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        <ReportFooter reportHash={reportHash} styles={styles} />
      </Page>
    </Document>
  );
};

// ── Public API ──

export async function generatePdfBuffer(payload: GeneratePdfPayload): Promise<Uint8Array> {
  const {
    scenarioTitle,
    analysisResult,
    formData,
    timestamp,
    selectedDashboards = [],
    pdfTheme = "dark",
  } = payload;

  const doc = (
    <PDFReportDocument
      scenarioTitle={scenarioTitle}
      analysisResult={analysisResult}
      formData={formData}
      timestamp={timestamp}
      selectedDashboards={selectedDashboards}
      pdfTheme={pdfTheme}
    />
  );

  const buffer = await renderToBuffer(doc as any);
  return new Uint8Array(buffer);
}
