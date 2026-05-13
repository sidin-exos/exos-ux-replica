/**
 * Server-side PDF document — mirrors the frontend PDFReportDocument.tsx
 * EXOS Branded design with dual light/dark mode.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Font,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Polygon,
  renderToBuffer,
} from "npm:@react-pdf/renderer@4";

// ── Register Inter font ──
// Built-in Helvetica-Bold has a kerning regression in @react-pdf/renderer 4
// that causes ghosted/double-stamped glyphs on large headings. Inter renders cleanly.
let __interRegistered = false;
function ensureInterRegistered() {
  if (__interRegistered) return;
  try {
    Font.register({
      family: "Inter",
      fonts: [
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf", fontWeight: 400 },
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf", fontWeight: 500 },
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf", fontWeight: 600 },
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf", fontWeight: 700 },
        // Italic variants — required because some table cells use fontStyle: "italic".
        // @react-pdf does not synthesize italics; missing src throws "Could not resolve font".
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-italic.ttf", fontWeight: 400, fontStyle: "italic" },
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-italic.ttf", fontWeight: 500, fontStyle: "italic" },
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-italic.ttf", fontWeight: 600, fontStyle: "italic" },
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-italic.ttf", fontWeight: 700, fontStyle: "italic" },
      ],
    });
    Font.register({
      family: "Space Grotesk",
      fonts: [
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-500-normal.ttf", fontWeight: 500 },
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-700-normal.ttf", fontWeight: 700 },
      ],
    });
    Font.registerHyphenationCallback((word: string) => [word]);
    __interRegistered = true;
  } catch (e) {
    console.warn("[generate-pdf] Inter font registration failed", e);
  }
}
ensureInterRegistered();

import React from "npm:react@18";
import type { ReactElement, ReactNode } from "npm:react@18";
import { getPdfColors, getPdfStyles } from "./theme.ts";
import type { PdfColorSet } from "./theme.ts";
import {
  extractDashboardData,
  extractFromEnvelope,
  extractRiskRegisterItems,
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
  PDFNpvWaterfall,
  PDFIfrs16Impact,
  PDFSavingsRealizationFunnel,
  PDFWorkingCapitalDpo,
} from "./dashboards.tsx";

// ── Embedded EXOS logo ──
const EXOS_LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAIAAgADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDxClooroMAooopAFLSUUALRRRQAUUUUwEooooAKKKKAFopKKAFopKKAFoopKACiiigAooooAWkNFFABS0lFABRRRQAUUUUALRSUtABRRRQAUUUUAFFJRQAtFJS0AJRRRQAUUUUALRSUtABSUtJQAtFFFABRRRQAlLSUtABRRRQAlFFFAC0UlFABS0lFABS0lLQAlFLSUAFFFLQAUUUUAFFFFABRiiigAooooAKKKKACiiigAoopKACiiigAoopaAEoopaAEooooAKKWkoAKKWkoAKWkooAWikpaACiiikAUlLRTAKSlooASiiigBaKKKACiiigAooopAFFFFABRRRQAUUUUwCiiigAooooAKKKKACiiigBKKKWgBKWkpaACiiigAooooAKKKKACiiigAoopKAFooooASlopKACiiigBaKKKAEooooAKWiigBKKKWgAoopKAClopKACiiigApaSloAKSlpKAFopKKAFoopKACiiigAooooAKWkooAWikpaACikpaACiiigAooooAKKSigAzRRRQAtFFFACUtFFABRRRQAUUUUAFFFFABRRRQAUUUUAFJS0lABS0lFAC0UUUAFFJRQAUUtJQAtFJRQAUUUUALRSUtABRSUUALSUUUALRRSUAFFFFAC0UUUCCkpaQ0DCiiigAooooAKKKKAClpKKACiiigAooooAKKKKAFooooEFFFFAxKKKKACiiikAtFFFMBKWkpaACiiigAooooAKKKSgBaKKKBBRRRQMKKKKAEooooAKKKKAClpKWgApKWkoAKKKKAFpKWkoAKKKKACiiigAooooAWkpaSgAooooAWikooAWiiigBKKKKACiiigBaKKKAEooooAKKKKACiiigAooooAWikpaAEooooAKKKKAFFFJS0AFFFFACUUtJQAtFJS0AJS0lLQAlFFFABS0lLQAUUUUCCikooGLSUtJQAUUUUAFLSUtABRRRQISlpKKBi0lFFABRRRQAUUUUAFFFFAC0UUUAFJS0lABS0lLQAUUUUAJRRRQAUUUUAFFFFAC0lFFABRRRQAUUUUAFFFFAC0UUlABRRRQAUUUtABRRRQAUUUUAFFFFACUUUtACUUUtACUUUUAFFFLQAUUUlABRRRQAtFFFACUUtJQAtFJS0AFJS0lABRRRQAUUtFACUUUUAFLSUtABRRRQAUUUUCCkoooGLRSUUAFFFFABRRRQAUUUUAFFFFABRRRQAUtJRQAtFFFABSUUUALRSUUAFLSUUALRRRQAUUUUAJRRRQAUtFFABRRRQAUlLSUALRRSUAFFFLQAlLRSUALSUUUAFFFFAC0UlFAC0UUlABRRRQAtFAoNACUUUUAFLSUUALRRRQIKKKKBiUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAtFFFACUUUUAFFFFABRRRQAUUUUAFFFFABS0lLQAUUUUAJRRRQAtFFFABRRRQAUlLRQAlFFLQAUUUUAJRS0lAC0lLSUALSUtJQAUUUUAFFFFAC0UlFAC0UUlABRRRQAtFAoNACUUUUAFLSUUALRRRQIKKKKBiUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAtFFFACUUUUAFFFFABRRRQAUUUUAFFFFABS0lLQAUUUUAJRRRQAtFFFABRRRQAUlLRQAlFFLQAUUUUAJRS0lAC0lLSUALSUtJQAUUUUAFFFFAC0hoooAKKKKAClpKKACiiigAooooAKWkooAWiikoAWikpaAEpaSigBaKSigAooooAKKKKACiiigBaKKKACiiigAoopKACiiigBaSiigAooooAKWkooAWiiigAooooAKKKKACiiigAooooAKKKKBBRRSUDFopKKAFooooAKQ0tFACUUUUAFFFLQAlFFFABS0lLQAlFLSUAFFLRQAlLRRQAUUUUCCkoooGLRSUUAFFFFABRRRQAUUUUAFFFFABRRRQAUtJRQAtFFFABSUUUALRSUUAFLSUUALRRRQAUUUUAJRRRQAUtFFABRRRQAUlLSUALRRSUAFFFLQAlLRSUALSUUUAFFFFAC0UlFAC0UUlABRRRQAtFAoNACUUUUAFLSUUALRRRQIKKKKBiUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAtFFFACUUUUAFFFFABRRRQAUUUUAFFFFABS0lLQAUUUUAJRRRQAtFFFABRRRQAUUUUCCiiigAooooAKKKKACiiigAopKWgAooooAKKKKACiikoAKKKKACiiigBaKKKACiiigAooooAKKKKAFooooAKKKKBBRRSUDFopKKAFooooAKQ0tFACUUUUAFFFLQAlFFFABS0lLQAlFLSUAFFLRQAlLRRQAUUUUAFFFFABRRRQIKKKKBhRRRQAUUUUAFFFFABRRRQAtFFFABRRRQAUUUUAFFFFAC0UUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFLQAUUUUAFFFFABRRRQAlFGKKAFooooAKKKKACiiigAooooEFFFFAwooooAKKKKACiiigAooooASloooAKKKKACiiigBKKKKAFooooAKKKKBBRRRQMKSlooASiiigBaSlooASilpKAFooooASiiloAKKKKACiiigBKKKWgBKWkooAWiikoAKWkooAWiiigBKKKKAFooooEFJRRQMWiiigAooooAKKKKACiikoELRSUtAwooooEFFFFAwooooAKSiloAKKKKACiiigAooooASiiigBaKKKACiiigAooooAKSlpKAClpKWgAoopKAFpKKKAClpKKAFooooAKKKKBBRRRQMKKKKACiiigAooooASiiigBaKSigAooooAWiiigApKWkoAWikpaAEooooAWiiigQlFFLQMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBKKKKAFooooAKKKKACiiigAopKWgAooooAKKKKACiiigApKWigBKWkooAWiiigAooooASlpKKAFopKWgAooopAFFFJTAWikpaACkoooAWikpaACiiigAooooAKKBRQAUUUUAJS0UUAFFFFABRRRQIKKKKBhRRRQAUUUUCCiikoGLRRRQAUUUlABRRRQAtFFFABRRRQAUUUUAFFFFABRRRQIKKKKBhRRRQIKKKKBiUtFFABRRRQIKSlpKBi0UUUAFFFFABRRRQAlLRiigAooooAKKKKACiikoAWiiigAoopKAFooooAKKKWgBKKWigR//Z";

// ── Helpers ──

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1").replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1").replace(/__(.*?)__/g, "$1").replace(/_(.*?)_/g, "$1")
    .replace(/~~(.*?)~~/g, "$1").replace(/`(.*?)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "").replace(/^[-*+]\s+/gm, "")
    .replace(/^- \[[ x]\]\s*/gm, "").replace(/^\d+\.\s+/gm, "").trim();
}

function renderBodyText(text: string, baseStyle: Record<string, unknown>): ReactElement {
  // Strip raw numeric tails (e.g. "Execute purchase — 52700") that surface when
  // expected_value is a bare number with no unit. Applied unconditionally because
  // markdown emphasis (e.g. "**[High]**") would otherwise defeat a tag-only check.
  const preStripped = String(text ?? "").replace(/\s+[—–-]\s+\d[\d,. ]*\s*$/, "");
  const stripped = stripMarkdown(preStripped);
  const valueRe = /([€$£][\d,.]+(?:\.\d+)?(?:\s*[-–]\s*[€$£]?[\d,.]+(?:\.\d+)?)?%?|[\d,.]+(?:\.\d+)?(?:\s*[-–]\s*[\d,.]+(?:\.\d+)?)?%)/g;
  const parts = stripped.split(valueRe);
  if (parts.length === 1) return <Text style={baseStyle}>{stripped}</Text>;
  return (
    <Text style={baseStyle}>
      {parts.map((part: string, i: number) => {
        const testRe = /([€$£][\d,.]+(?:\.\d+)?(?:\s*[-–]\s*[€$£]?[\d,.]+(?:\.\d+)?)?%?|[\d,.]+(?:\.\d+)?(?:\s*[-–]\s*[\d,.]+(?:\.\d+)?)?%)/;
        const isValue = testRe.test(part);
        if (!isValue) return <Text key={i}>{part}</Text>;
        const spaced = part.replace(/([€$£])([\d])/g, "$1\u2009$2");
        return <Text key={i} style={{ fontFamily: "Inter", fontWeight: 700 }}>{spaced}</Text>;
      })}
    </Text>
  );
}

function getReportTitle(scenarioName: string): string {
  const name = scenarioName.trim();
  if (name.toLowerCase().endsWith("report")) return name;
  const base = name.replace(/\s*Analysis\s*$/i, "").replace(/\s*Report\s*$/i, "").trim();
  return `${base} Analysis Report`;
}

function getScenarioTypeLabel(scenarioName: string): string {
  return scenarioName.replace(/\s*Analysis\s*$/i, "").trim().toUpperCase();
}

const SP = {
  sectionGap: 28, subSectionGap: 20, afterHeadingLine: 14, afterSubHeading: 8,
  // pageBottomMargin bumped from 60→72 so flowing prose never tucks under the
  // fixed footer (bottom:16, ~14px tall, +6 padding-top, +1 border = ~37px),
  // which previously caused the last paragraph to overprint the footer text
  // and made the footer appear as a "cascading" repeated stripe in print preview.
  betweenItems: 14, betweenParagraphs: 10, pageTopMargin: 52, pageSideMargin: 44, pageBottomMargin: 72,
};

function parseRiskSeverity(text: string): { severity: string; cleanText: string } {
  const match = text.match(/\s*\((High|Medium|Low)\s+Impact\)/i) || text.match(/\s*\((Critical|High|Medium|Low)\)/i);
  return {
    severity: match ? match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() : "Medium",
    cleanText: text.replace(/\s*\((High|Medium|Low)\s+Impact\)\s*/i, "").replace(/\s*\((Critical|High|Medium|Low)\)\s*/i, "").trim(),
  };
}

function riskSeverityColor(severity: string, c: PdfColorSet): string {
  if (/critical/i.test(severity)) return c.riskCritical;
  if (/high/i.test(severity)) return c.riskHigh;
  if (/medium/i.test(severity)) return c.riskMedium;
  return c.success;
}

function parseNextStep(text: string): { title: string; description: string } {
  const colonIndex = text.indexOf(":");
  if (colonIndex > 0 && colonIndex < 50) return { title: stripMarkdown(text.substring(0, colonIndex)).trim(), description: stripMarkdown(text.substring(colonIndex + 1)).trim() };
  const sentenceEnd = text.search(/[.!?]\s/);
  if (sentenceEnd > 0) return { title: stripMarkdown(text.substring(0, sentenceEnd + 1)).trim(), description: stripMarkdown(text.substring(sentenceEnd + 2)).trim() };
  return { title: stripMarkdown(text), description: "" };
}

function summarizeParameter(value: string, maxWords = 120): string {
  // Preserve the user's original phrasing and order. Truncate only when
  // exceeding the word budget. Bumped from 60 → 120 words so input parameter
  // cards on the final page no longer cut mid-sentence on richer inputs.
  const trimmed = value.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  return words.slice(0, maxWords).join(" ") + "…";
}

/** Strip duplicated parenthetical acronyms like "OTIF (OTIF)" → "(OTIF)". */
function dedupeParenAcronyms(text: string): string {
  if (!text) return text;
  return text.replace(/\b([A-Z]{2,8})\s*\(\1\)/g, "($1)");
}

// ── Build branded styles ──

function buildStyles(c: PdfColorSet) {
  return StyleSheet.create({
    page: { backgroundColor: c.background, paddingTop: SP.pageTopMargin, paddingLeft: SP.pageSideMargin, paddingRight: SP.pageSideMargin, paddingBottom: SP.pageBottomMargin, fontFamily: "Inter", color: c.text },
    pageWithHeader: { backgroundColor: c.background, paddingTop: SP.pageTopMargin, paddingLeft: SP.pageSideMargin, paddingRight: SP.pageSideMargin, paddingBottom: SP.pageBottomMargin, fontFamily: "Inter", color: c.text },
    headerBar: { position: "absolute", top: 0, left: 0, right: 0, height: 36, backgroundColor: c.primary, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SP.pageSideMargin },
    coverLeftStripe: { position: "absolute", top: 36, left: 0, width: 5, bottom: 50, backgroundColor: c.primary },
    coverScenarioBadge: { backgroundColor: c.primary, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, alignSelf: "flex-start", marginBottom: 16 },
    coverScenarioBadgeText: { fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary, textTransform: "uppercase", letterSpacing: 1 },
    coverTitle: { fontSize: 22, fontFamily: "Inter", fontWeight: 700, color: c.text, marginBottom: 12, lineHeight: 1.2 },
    coverDivider: { height: 1, backgroundColor: c.border, marginBottom: 10 },
    coverMetaRow: { flexDirection: "row", marginBottom: 24 },
    coverMetaCol: { flex: 1 },
    coverMetaLabel: { fontSize: 8, fontFamily: "Inter", fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    coverMetaValue: { fontSize: 11, fontFamily: "Inter", fontWeight: 700, color: c.text },
    tocBox: { borderWidth: 1, borderColor: c.border, borderRadius: 4, padding: 14, marginBottom: 24 },
    tocTitle: { fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: c.primary, marginBottom: 8 },
    tocRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
    tocNumber: { fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: c.primary, width: 20 },
    tocLabel: { fontSize: 9, color: c.text, flex: 1, textDecoration: "none" },
    tocPageHint: { fontSize: 8, color: c.textMuted },
    coverBadgeRow: { position: "absolute", bottom: 50, left: SP.pageSideMargin },
    coverBadge: { marginBottom: 4 },
    coverBadgeLabel: { fontSize: 7, fontFamily: "Inter", fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
    coverBadgeValue: { fontSize: 10, fontFamily: "Inter", fontWeight: 700 },
    bottomStripe: { position: "absolute", bottom: 0, left: 0, right: 0, height: 10, flexDirection: "row" },
    stripeSegment: { flex: 1, height: 10 },
    sectionBadge: { backgroundColor: c.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, alignSelf: "flex-start", marginBottom: 10 },
    sectionBadgeText: { fontSize: 8, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary, textTransform: "uppercase", letterSpacing: 0.8 },
    sectionTitleWrapperCompact: { marginBottom: 8, paddingBottom: 4 },
    sectionTitleWrapper: { marginBottom: SP.afterHeadingLine, paddingBottom: 6 },
    sectionTitleText: { fontSize: 18, fontFamily: "Inter", fontWeight: 700, color: c.text },
    sectionTitleLine: { height: 2, backgroundColor: c.primary, marginTop: 6 },
    findingCardsRow: { flexDirection: "row", marginBottom: 8 },
    findingCard: { flex: 1, backgroundColor: c.surface, borderLeftWidth: 3, padding: 8, marginRight: 5 },
    findingCardLast: { marginRight: 0 },
    findingCardNumber: { width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 6 },
    findingCardNumberText: { fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary },
    findingCardTitle: { fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: c.text, marginBottom: 4 },
    findingCardBody: { fontSize: 8, color: c.textMuted, lineHeight: 1.4 },
    actionItem: { flexDirection: "row", alignItems: "flex-start", backgroundColor: c.surface, borderLeftWidth: 3, borderLeftColor: c.primary, padding: 7, marginBottom: 5 },
    actionNumber: { width: 18, height: 18, borderRadius: 9, backgroundColor: c.primary, justifyContent: "center", alignItems: "center", marginRight: 8 },
    actionNumberText: { fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary },
    actionContent: { flex: 1 },
    actionTitle: { fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: c.text, marginBottom: 3 },
    actionBody: { fontSize: 9, color: c.textMuted, lineHeight: 1.5 },
    kpiRow: { flexDirection: "row", borderWidth: 1, borderColor: c.border, borderRadius: 4, marginTop: 8 },
    kpiCell: { flex: 1, paddingVertical: 6, paddingHorizontal: 6, alignItems: "center", borderRightWidth: 1, borderRightColor: c.border },
    kpiCellLast: { borderRightWidth: 0 },
    kpiLabel: { fontSize: 7, fontFamily: "Inter", fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    kpiValue: { fontSize: 11, fontFamily: "Inter", fontWeight: 700, color: c.primary },
    analysisBlock: { backgroundColor: c.surface, borderLeftWidth: 4, padding: 14, marginBottom: 12 },
    analysisBlockBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start", marginBottom: 8 },
    analysisBlockBadgeText: { fontSize: 8, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary, textTransform: "uppercase", letterSpacing: 0.5 },
    analysisText: { fontSize: 9, color: c.text, lineHeight: 1.6, marginBottom: SP.betweenParagraphs },
    confidenceBar: { backgroundColor: c.surface, borderLeftWidth: 3, borderLeftColor: c.primary, padding: 10, marginTop: 16 },
    recoCard: { backgroundColor: c.surface, borderLeftWidth: 4, padding: 12, marginBottom: 10 },
    recoTitle: { fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: c.text, marginBottom: 4 },
    recoBody: { fontSize: 9, color: c.textMuted, lineHeight: 1.5 },
    riskItem: { backgroundColor: c.surface, borderLeftWidth: 4, padding: 12, marginBottom: 10 },
    riskBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start", marginBottom: 6 },
    riskBadgeText: { fontSize: 7, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary, textTransform: "uppercase", letterSpacing: 0.5 },
    riskTitle: { fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: c.text, marginBottom: 4 },
    riskDescription: { fontSize: 9, color: c.textMuted, lineHeight: 1.5 },
    paramCard: { flexDirection: "row", backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 4, marginBottom: 10, overflow: "hidden" },
    paramLabel: { width: "30%", backgroundColor: c.surfaceLight, padding: 12, justifyContent: "center" },
    paramLabelText: { fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: c.primary, textTransform: "uppercase", letterSpacing: 0.5 },
    paramValue: { flex: 1, padding: 12 },
    paramValueText: { fontSize: 9, color: c.text, lineHeight: 1.5 },
    methodologyBox: { backgroundColor: c.surfaceLight, borderLeftWidth: 3, borderLeftColor: c.primary, padding: 14, marginTop: 16 },
    methodologyTitle: { fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: c.text, marginBottom: 6 },
    methodologyText: { fontSize: 9, color: c.textMuted, lineHeight: 1.5 },
    statsTable: { flexDirection: "row", borderWidth: 1, borderColor: c.border, borderRadius: 4, marginTop: 16 },
    statsCell: { flex: 1, paddingVertical: 8, paddingHorizontal: 8, alignItems: "center", borderRightWidth: 1, borderRightColor: c.border },
    statsCellLast: { borderRightWidth: 0 },
    statsLabel: { fontSize: 7, fontFamily: "Inter", fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
    statsValue: { fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: c.primary },
    // Markdown-table rendering inside Detailed Analysis blocks
    mdTable: { borderWidth: 1, borderColor: c.border, borderRadius: 4, marginTop: 6, marginBottom: 8, overflow: "hidden" },
    mdTableHeaderRow: { flexDirection: "row", backgroundColor: c.surfaceLight, borderBottomWidth: 1, borderBottomColor: c.border },
    mdTableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.border },
    mdTableRowAlt: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.surfaceLight },
    mdTableCell: { flex: 1, paddingVertical: 5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: c.border },
    mdTableCellLast: { flex: 1, paddingVertical: 5, paddingHorizontal: 6 },
    mdTableHeaderText: { fontSize: 8, fontFamily: "Inter", fontWeight: 700, color: c.text, textTransform: "uppercase", letterSpacing: 0.4 },
    mdTableCellText: { fontSize: 8.5, color: c.text, lineHeight: 1.4 },
    footer: { position: "absolute", bottom: 16, left: SP.pageSideMargin, right: SP.pageSideMargin, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: c.border, paddingTop: 6 },
    footerText: { fontSize: 8, color: c.textMuted },
    verticalLabel: { position: "absolute", top: "45%", left: 10, transform: "rotate(-90deg)", fontSize: 8, fontFamily: "Inter", fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: 2 },
    // Branded cover band (Option B v3)
    coverBand: { position: "absolute", top: 0, left: 0, right: 0, height: 150, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border, paddingHorizontal: SP.pageSideMargin, paddingTop: 18, paddingBottom: 14 },
    coverBandAccent: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3, backgroundColor: c.primary },
    coverBandWordmark: { fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 20, color: c.text, letterSpacing: 1 },
    coverBandDivider: { width: 1, height: 18, backgroundColor: c.border, marginHorizontal: 10 },
    coverBandSubtitle: { fontFamily: "Inter", fontWeight: 600, fontSize: 9, color: c.textMuted, letterSpacing: 0.3 },
    coverBandEyebrow: { fontFamily: "Inter", fontWeight: 700, fontSize: 7.5, color: c.primary, textTransform: "uppercase", letterSpacing: 1.2, marginTop: 12 },
    coverBandTitle: { fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 20, color: c.text, marginTop: 6, lineHeight: 1.15 },
    coverBandMeta: { fontFamily: "Inter", fontWeight: 400, fontSize: 8, color: c.textMuted, marginTop: 10 },
  });
}

// ── EXOS Mark (vector, theme-aware) ──
const ExosMark = ({ size = 38, mode = "light" }: { size?: number; mode?: PdfThemeMode }) => {
  const w = size;
  const h = (size * 110) / 100;
  const isDark = mode === "dark";
  const baseFill = isDark ? "#0A5550" : "#122F47";
  const gradStart = isDark ? "#2BB8AF" : "#47DDD4";
  const gradEnd = isDark ? "#178A83" : "#19A49C";
  const strokeColor = isDark ? "#6DD5CC" : "#0C1D2E";
  return (
    <Svg width={w} height={h} viewBox="0 0 100 110">
      <Defs>
        <LinearGradient id="exosTeal" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={gradStart} />
          <Stop offset="100%" stopColor={gradEnd} />
        </LinearGradient>
      </Defs>
      <Polygon points="50,53 76,79 50,105 24,79" fill={baseFill} />
      <Polygon points="50,29 76,55 50,81 24,55" fill="url(#exosTeal)" />
      <Polygon points="50,5 76,31 50,57 24,31" fill="none" stroke={strokeColor} strokeWidth={6} strokeLinejoin="round" />
    </Svg>
  );
};

// ── Branded Cover Band (theme-aware) ──
const CoverBand = ({ scenarioLabel, reportTitle, dateStr, reportHash, c, mode = "light" }: { scenarioLabel: string; reportTitle: string; dateStr: string; reportHash: string; c: PdfColorSet; mode?: PdfThemeMode }) => {
  const s = buildStyles(c);
  return (
    <View style={s.coverBand}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ExosMark size={42} mode={mode} />
        <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 12 }}>
          <Text style={s.coverBandWordmark}>EXOS</Text>
          <View style={s.coverBandDivider} />
          <Text style={s.coverBandSubtitle}>Procurement Analytical Platform</Text>
        </View>
      </View>
      <View style={{ marginLeft: 54 }}>
        <Text style={s.coverBandEyebrow}>{scenarioLabel}</Text>
        <Text style={s.coverBandTitle}>{reportTitle}</Text>
        <Text style={s.coverBandMeta}>Confidential  ·  {dateStr}  ·  Report {reportHash}</Text>
      </View>
      <View style={s.coverBandAccent} />
    </View>
  );
};

// ── Extraction helpers ──

const cleanMarkdown = (text: string): string => text.replace(/\*\*\*/g, "").replace(/\*\*/g, "").replace(/^\s*\*\s+/gm, "").replace(/^#{1,4}\s*/gm, "").replace(/^- \[[ x]\]\s*/gm, "").trim();

// Lines that are clearly markdown-table fragments — used to suppress
// false "header" detection in categorizeAnalysisSections and to keep table
// rows out of the Risk Register fallback renderer.
const isTableLine = (raw: string): boolean => {
  const t = raw.trim();
  if (!t) return false;
  if (/^\|.*\|$/.test(t)) return true;
  if (/^\|?[-:\s|]+\|?$/.test(t) && t.includes("-")) return true;
  return false;
};

// Parse a pipe-delimited markdown row into trimmed cells. Returns null when
// the line is a separator row (|---|---|) so callers can skip it.
const parseTableRow = (raw: string): string[] | null => {
  const t = raw.trim();
  if (/^\|?[-:\s|]+\|?$/.test(t) && t.includes("-")) return null; // separator
  // Strip leading/trailing pipes, then split on un-escaped pipes.
  const inner = t.replace(/^\|/, "").replace(/\|$/, "");
  return inner.split("|").map(c => stripMarkdown(c.trim()));
};

// Drop AI guidance prompts ("Supply…", "Provide…", "(e.g., …)") that should
// never surface as Key Findings or Recommended Actions.
const INSTRUCTION_PREFIX_RE = /^\s*[-•*]?\s*(supply|provide|specify|enter|input|complete|fill in|add|please|to enable|to allow|to support|to strengthen)\b/i;
const isInstructionLine = (line: string): boolean =>
  INSTRUCTION_PREFIX_RE.test(line) || /\(e\.g\.,/i.test(line);

// Drop Response-Playbook phase headers leaking into Recommended Actions.
const isPlaybookPhase = (line: string): boolean =>
  /^\s*phase\s+\d+\s*[—\-:]\s*(detect|activate|contain|recover|learn)/i.test(line);

const looksLikeFinding = (line: string): boolean => {
  if (line.length < 15) return false;
  if (isInstructionLine(line) || isPlaybookPhase(line) || isTableLine(line)) return false;
  return true;
};

// Pull executive-summary content from the EXOS envelope first; fall back to
// the prose-line heuristic only when no structured summary exists.
const extractEnvelopeSummary = (raw?: string): { findings: string[]; recommendations: string[] } => {
  if (!raw) return { findings: [], recommendations: [] };
  let env: any;
  try { env = JSON.parse(raw); } catch { return { findings: [], recommendations: [] }; }
  if (!env || typeof env !== "object") return { findings: [], recommendations: [] };

  const findings: string[] = [];
  const recommendations: string[] = [];

  const exec = env.executive_summary ?? env.payload?.executive_summary ?? {};
  const headline = exec.headline ?? exec.summary ?? env.headline;
  if (typeof headline === "string" && headline.trim() && looksLikeFinding(headline)) {
    findings.push(headline.trim());
  }
  const findingsArr = exec.key_findings ?? env.key_findings ?? exec.findings ?? [];
  if (Array.isArray(findingsArr)) {
    for (const f of findingsArr) {
      const t = typeof f === "string" ? f : (f?.finding ?? f?.text ?? f?.title ?? "");
      const s = String(t).trim();
      if (s && looksLikeFinding(s)) findings.push(s);
      if (findings.length >= 3) break;
    }
  }

  const recsArr = env.recommendations ?? env.payload?.recommendations ?? exec.recommendations ?? [];
  if (Array.isArray(recsArr)) {
    for (const r of recsArr) {
      let t: string;
      if (typeof r === "string") t = r;
      else {
        const action = r?.action ?? r?.recommendation ?? r?.text ?? r?.title ?? "";
        const priority = r?.priority ? `[${String(r.priority)}] ` : "";
        const rationaleRaw = r?.rationale ?? r?.benefit ?? r?.expected_value ?? "";
        // Strip raw numeric tails (e.g. "Reduce cost — 52700") that surface
        // when expected_value is a bare number or numeric string with no unit.
        const rationaleStr = String(rationaleRaw ?? "").trim();
        const rationale = /^\d[\d,. ]*$/.test(rationaleStr) ? "" : rationaleStr;
        t = `${priority}${action}${rationale ? ` — ${rationale}` : ""}`;
      }
      const s = String(t).trim().replace(/\s+—\s+\d[\d,. ]*\s*$/, "");
      if (s && looksLikeFinding(s)) recommendations.push(s);
      if (recommendations.length >= 4) break;
    }
  }

  return { findings, recommendations };
};

const extractExecutiveSummary = (text: string): { findings: string[]; recommendations: string[] } => {
  const lines = text.split("\n").map(cleanMarkdown).filter((l) => looksLikeFinding(l));
  const findingPattern = /(\$|€|%|found|indicates?|presents?|analysis|current(ly)?|total|average|estimated|reveals?|shows?)/i;
  const recommendPattern = /\b(target|aim to|recommend|should|negotiate|consider|implement|prioritize|pursue|establish|ensure|leverage|explore)\b/i;
  const findings: string[] = [], recommendations: string[] = [];
  for (const line of lines) {
    if (recommendations.length < 4 && recommendPattern.test(line)) recommendations.push(line);
    else if (findings.length < 3 && findingPattern.test(line)) findings.push(line);
    if (findings.length >= 3 && recommendations.length >= 4) break;
  }
  if (findings.length === 0 || recommendations.length === 0) {
    const pool = lines.slice(0, 7), mid = Math.ceil(pool.length / 2);
    if (findings.length === 0) findings.push(...pool.slice(0, mid).slice(0, 3));
    if (recommendations.length === 0) recommendations.push(...pool.slice(mid).slice(0, 4));
  }
  return { findings, recommendations };
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

type SectionType = "findings" | "recommendations" | "risks" | "nextSteps" | "costDrivers" | "general";
interface AnalysisSection { type: SectionType; title: string; lines: string[]; }

const sectionPatterns: Record<Exclude<SectionType, "general">, RegExp> = {
  costDrivers: /\b(cost\s*driver|key\s*cost|cost\s*factor|cost\s*breakdown)\b/i,
  findings: /\b(finding|analysis|overview|assessment|current\s*state|summary|market|evaluation)\b/i,
  recommendations: /\b(recommend|action|strateg|approach|should|suggest|advise|optimi[sz])\b/i,
  risks: /\b(risk|challeng|threat|concern|limitation|vulnerabilit|caveat|warning)\b/i,
  nextSteps: /\b(next\s*step|implement|timeline|roadmap|action\s*plan|phase|mileston)\b/i,
};

const categorizeAnalysisSections = (lines: string[]): AnalysisSection[] => {
  const sections: AnalysisSection[] = [];
  let current: AnalysisSection = { type: "general", title: "Analysis Overview", lines: [] };
  for (const rawLine of lines) {
    // Never let markdown-table fragments masquerade as section headers — that
    // bug caused every "MEDIUM" cell in S27's Black Swan Risk Map to spawn a
    // bogus Risk Register card on page 8.
    if (isTableLine(rawLine)) {
      current.lines.push(rawLine);
      continue;
    }
    const hashMatch = rawLine.match(/^(#{1,4})\s*(.*)$/);
    const cleanLine = cleanMarkdown(rawLine);
    if (!cleanLine) continue;
    if (isTableLine(cleanLine)) { current.lines.push(cleanLine); continue; }
    // S26 fix: never let "Stage N — ..." sub-labels (inside Emergency Map)
    // get promoted to top-level section cards by the heuristic header detector.
    // Same for "Addressee:" / "Subject:" lines inside Draft Letters which
    // end with ":" but are letter metadata, not section titles.
    const isStageSubLabel = /^stage\s*\d+\s*[—\-–:]/i.test(cleanLine);
    const isLetterMeta = /^(addressee|subject|to|from|date)\s*:/i.test(cleanLine);
    const isHeader = !isStageSubLabel && !isLetterMeta && (
      !!hashMatch
      || (cleanLine.endsWith(":") && cleanLine.length < 80)
      || (cleanLine.length < 60 && /^[A-Z]/.test(cleanLine) && !cleanLine.includes("."))
    );
    if (isHeader) {
      const newTitle = cleanLine.replace(/:$/, "");
      // Dedupe: if this header is the same as the section we are currently
      // building (and that section is still empty), skip it. This squashes the
      // duplicated "Data Gaps" / "Data Gaps:" headers the AI sometimes emits
      // back-to-back which previously rendered as two stacked section badges.
      const sameAsCurrent = current.title.trim().toLowerCase() === newTitle.trim().toLowerCase();
      if (sameAsCurrent && current.lines.length === 0) continue;
      if (current.lines.length > 0) sections.push(current);
      let detectedType: SectionType = "general";
      for (const [type, pattern] of Object.entries(sectionPatterns) as [Exclude<SectionType, "general">, RegExp][]) {
        if (pattern.test(cleanLine)) { detectedType = type; break; }
      }
      current = { type: detectedType, title: newTitle, lines: [] };
    } else { current.lines.push(cleanLine); }
  }
  if (current.lines.length > 0) sections.push(current);
  return sections;
};

const generateReportHash = (title: string, ts: string): string => {
  let hash = 0; const str = `${title}-${ts}`;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
};

function extractRiskKpi(text: string): string {
  const m = text.match(/\b(critical|high|medium|low)\s*risk\b/i) || text.match(/risk\s*(?:level\s*)?[:\-]?\s*(critical|high|medium|low)\b/i);
  if (!m) return "—";
  return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
}

function kpiColor(value: string, type: "savings" | "risk" | "confidence", c: PdfColorSet): string {
  if (value === "—") return c.textMuted;
  if (type === "savings") return c.success;
  if (type === "risk") { if (/high|critical/i.test(value)) return c.destructive; if (/medium/i.test(value)) return c.warning; return c.success; }
  const pct = parseInt(value);
  if (!isNaN(pct)) { if (pct >= 80) return c.success; if (pct >= 50) return c.warning; return c.destructive; }
  if (/high/i.test(value)) return c.success; if (/medium/i.test(value)) return c.warning; return c.destructive;
}

interface TocEntry { label: string; anchor: string; page: number; }
const buildTocEntries = (hasDashboards: boolean, hasParams: boolean, dashboardCount: number): TocEntry[] => {
  const entries: TocEntry[] = [];
  let page = 1;
  entries.push({ label: "Executive Summary", anchor: "section-executive-summary", page });
  page++;
  if (hasDashboards) { entries.push({ label: "Analysis Visualizations", anchor: "section-visualizations", page }); page += Math.ceil(dashboardCount / 2); }
  entries.push({ label: "Detailed Analysis", anchor: "section-detailed-analysis", page });
  page++;
  entries.push({ label: "Recommendations & Risks", anchor: "section-recs-risks", page });
  if (hasParams) { page++; entries.push({ label: "Analysis Parameters", anchor: "section-parameters", page }); }
  return entries;
};

function accentColor(index: number, c: PdfColorSet): string {
  const accents = [c.accent1, c.accent2, c.accent3, c.accent4, c.primary, c.primaryDark];
  return accents[index % accents.length];
}

// ── Dashboard rendering ──

const dashboardDataKey: Record<string, keyof DashboardData> = {
  "action-checklist": "actionChecklist", "decision-matrix": "decisionMatrix", "cost-waterfall": "costWaterfall",
  "timeline-roadmap": "timelineRoadmap", "kraljic-quadrant": "kraljicQuadrant", "tco-comparison": "tcoComparison",
  "license-tier": "licenseTier", "sensitivity-spider": "sensitivitySpider", "risk-matrix": "riskMatrix",
  "scenario-comparison": "scenarioComparison", "supplier-scorecard": "supplierScorecard", "sow-analysis": "sowAnalysis",
  "negotiation-prep": "negotiationPrep", "data-quality": "dataQuality",
  "npv-waterfall": "npvWaterfall", "ifrs16-impact": "ifrs16Impact",
  "savings-realization-funnel": "savingsRealizationFunnel", "working-capital-dpo": "workingCapitalDpo",
};

const renderDashboard = (dashboardType: DashboardType, parsedData?: DashboardData | null, themeMode?: PdfThemeMode): ReactNode => {
  const dataKey = dashboardDataKey[dashboardType];
  if (dataKey && (!parsedData || !parsedData[dataKey])) {
    // Skip dashboards without data instead of rendering an empty placeholder card
    return null;
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
    case "npv-waterfall": return <PDFNpvWaterfall data={parsedData!.npvWaterfall! as any} themeMode={themeMode} />;
    case "ifrs16-impact": return <PDFIfrs16Impact data={parsedData!.ifrs16Impact! as any} themeMode={themeMode} />;
    case "savings-realization-funnel": return <PDFSavingsRealizationFunnel data={parsedData!.savingsRealizationFunnel! as any} themeMode={themeMode} />;
    case "working-capital-dpo": return <PDFWorkingCapitalDpo data={parsedData!.workingCapitalDpo! as any} themeMode={themeMode} />;
    default: return null;
  }
};

function chunkPairs<T>(arr: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) result.push(arr.slice(i, i + 2));
  return result;
}

// ── Main Document ──

const PDFReportDocument = ({
  scenarioTitle, analysisResult, structuredData, formData, timestamp,
  selectedDashboards = [], pdfTheme = "light",
  evaluationScore, evaluationConfidence, coverageStars,
}: {
  scenarioTitle: string; analysisResult: string; structuredData?: string; formData: Record<string, string>;
  timestamp: string; selectedDashboards?: DashboardType[]; pdfTheme?: PdfThemeMode;
  evaluationScore?: number; evaluationConfidence?: string; coverageStars?: number;
}) => {
  const c = getPdfColors(pdfTheme);
  const s = buildStyles(c);
  // Prefer structured envelope, fall back to legacy XML parsing
  const parsedData = (structuredData ? extractFromEnvelope(structuredData) : null) ?? extractDashboardData(analysisResult);
  // Debug: surface scenario-specific dashboard payloads in edge logs so we can
  // diagnose why widgets render empty (S3 NPV / IFRS 16).
  try {
    console.log("[generate-pdf] dashboards", {
      scenarioTitle,
      selectedDashboards,
      hasNpvWaterfall: !!parsedData?.npvWaterfall,
      npvOptionsCount: (parsedData?.npvWaterfall as any)?.options?.length ?? 0,
      hasIfrs16: !!parsedData?.ifrs16Impact,
      ifrs16OptionsCount: (parsedData?.ifrs16Impact as any)?.options?.length ?? 0,
    });
  } catch { /* logging only */ }
  const strippedAnalysis = stripDashboardData(analysisResult);
  // D3: prefer envelope-driven Executive Summary; fall back to prose heuristic.
  const envelopeSummary = extractEnvelopeSummary(structuredData);
  const proseSummary = extractExecutiveSummary(strippedAnalysis);
  const findings = envelopeSummary.findings.length > 0 ? envelopeSummary.findings : proseSummary.findings;
  const recommendations = envelopeSummary.recommendations.length > 0 ? envelopeSummary.recommendations : proseSummary.recommendations;
  const analysisLines = strippedAnalysis.split("\n").filter((line) => line.trim());

  // Detect S27 envelope to drive scenario-specific footer KPIs and suppress
  // the legacy generic Risk Register page (Black Swan Risk Map covers it).
  let envelope: any = null;
  try { envelope = structuredData ? JSON.parse(structuredData) : null; } catch { envelope = null; }
  const isS27 = envelope?.scenario_id === "S27" || /black\s*swan/i.test(scenarioTitle);
  // S26 (Disruption Management): the Emergency Map already contains the four
  // recovery stages including Stage 4 Prevent. Without this flag the prose
  // fallback collects Stage 4 prevention/process-change items into the legacy
  // Risk Register page, duplicating content and confusing the deliverable.
  const isS26 = envelope?.scenario_id === "S26" || /disruption\s*manag/i.test(scenarioTitle);
  const isS20 = envelope?.scenario_id === "S20" || /category\s*risk/i.test(scenarioTitle);
  const isS21 = envelope?.scenario_id === "S21" || /preparing.*for.*negotiat/i.test(scenarioTitle);
  const isS6 = envelope?.scenario_id === "S6" || /forecasting|predictive\s*budget/i.test(scenarioTitle);
  // S22 (Category Strategy): cover KPIs derive from kraljic_position + porters + quick_wins.
  const isS22 = envelope?.scenario_id === "S22" || /category\s*strategy/i.test(scenarioTitle);
  const s22Specific: any = isS22 ? (envelope?.payload?.scenario_specific ?? {}) : {};
  const s22Kraljic = s22Specific?.kraljic_position ?? null;
  const s22KraljicPosition = (() => {
    const rec = String(s22Kraljic?.recommended ?? "").toUpperCase().replace(/_/g, "-");
    if (!rec || rec.includes("|")) return null;
    return rec === "NON-CRITICAL" ? "NON-CRITICAL" : rec;
  })();
  const s22SupplierPower = (() => {
    const v = String(s22Specific?.porters_five_forces?.supplier_power?.rating ?? "").toUpperCase();
    return v && !v.includes("|") ? v : null;
  })();
  const s22Leverage = (() => {
    const sr = Number(s22Kraljic?.supply_risk);
    const bi = Number(s22Kraljic?.business_impact);
    if (!Number.isFinite(sr) || !Number.isFinite(bi)) return null;
    // Leverage band: high impact + low risk = HIGH leverage; high risk + any = LOW (supplier holds the cards).
    if (sr >= 7) return "LOW";
    if (bi >= 7 && sr < 4) return "HIGH";
    if (bi >= 5) return "MEDIUM";
    return "LOW";
  })();
  const s22QuickWinsCount = Array.isArray(s22Specific?.quick_wins) ? s22Specific.quick_wins.length : 0;
  // S6 cover KPIs (Base Case spend / Risk band / Top driver)
  const s6Specific = isS6 ? (envelope?.payload?.scenario_specific ?? {}) : {};
  const s6Scenarios: any[] = Array.isArray(s6Specific?.scenarios) ? s6Specific.scenarios : [];
  const s6Base = s6Scenarios.find((s: any) => /base/i.test(String(s?.label))) ?? s6Scenarios[0];
  const s6Down = s6Scenarios.find((s: any) => /down|worst|stress/i.test(String(s?.label)));
  const s6Up = s6Scenarios.find((s: any) => /up|best|opportun/i.test(String(s?.label)));
  const s6Currency = String(s6Specific?.currency ?? envelope?.payload?.financial_model?.currency ?? "EUR");
  const formatMoney = (n: number | undefined) => {
    if (!Number.isFinite(Number(n))) return null;
    const v = Math.abs(Number(n));
    const sym = s6Currency === "EUR" ? "€" : s6Currency === "USD" ? "$" : s6Currency === "GBP" ? "£" : `${s6Currency} `;
    return v >= 1_000_000 ? `${sym}${(v / 1_000_000).toFixed(2)}M` : v >= 1_000 ? `${sym}${Math.round(v / 1_000)}K` : `${sym}${Math.round(v)}`;
  };
  const s6BaseLabel = s6Base ? formatMoney(Number(s6Base.total_spend ?? s6Base.total)) : null;
  const s6RiskBand = (() => {
    const baseT = Number(s6Base?.total_spend ?? s6Base?.total);
    const downT = Number(s6Down?.total_spend ?? s6Down?.total);
    const upT = Number(s6Up?.total_spend ?? s6Up?.total);
    if (!Number.isFinite(baseT) || baseT <= 0) return null;
    const fmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
    const downPct = Number.isFinite(downT) ? Math.round(((downT - baseT) / baseT) * 1000) / 10 : null;
    const upPct = Number.isFinite(upT) ? Math.round(((upT - baseT) / baseT) * 1000) / 10 : null;
    if (downPct == null && upPct == null) return null;
    // Display as Downside / Upside (worst-to-best reading order).
    return `${downPct != null ? fmt(downPct) : "—"} / ${upPct != null ? fmt(upPct) : "—"}`;
  })();
  const s6TopDriver = (() => {
    const sens: any[] = Array.isArray(s6Specific?.sensitivity) ? s6Specific.sensitivity : [];
    const sorted = sens
      .filter((sv) => Number.isFinite(Number(sv?.high_impact_pct)))
      .sort((a, b) => Math.abs(Number(b?.high_impact_pct)) - Math.abs(Number(a?.high_impact_pct)));
    return sorted[0]?.variable ? String(sorted[0].variable).toUpperCase() : null;
  })();
  const s27Specific = isS27 ? (envelope?.payload?.scenario_specific ?? {}) : {};
  const s27ResiliencePosture = String(s27Specific?.overall_resilience_rag ?? "").toUpperCase() || null;
  const s27RtoGap = s27Specific?.rto_rpo_analysis?.rto_gap_hours;
  const s27SingleSourceFlows = Array.isArray(s27Specific?.concentration?.flows)
    ? s27Specific.concentration.flows.filter((f: any) => f?.single_source_flag).length
    : null;
  // S20 cover KPIs (Category Risk Score / RAG / Decision / Top dimension)
  const s20Specific = isS20 ? (envelope?.payload?.scenario_specific ?? {}) : {};
  const s20Score = s20Specific?.category_risk_score?.overall;
  const s20Rag = String(s20Specific?.category_risk_score?.rag ?? "").toUpperCase() || null;
  const s20Decision = String(s20Specific?.category_risk_score?.decision ?? "").replace(/_/g, " ") || null;
  const s20TopRisk = (() => {
    const arr = Array.isArray(s20Specific?.score_breakdown) ? s20Specific.score_breakdown : [];
    const sorted = arr
      .filter((d: any) => d && typeof d.score === "number")
      .sort((a: any, b: any) => Number(b.score) - Number(a.score));
    return sorted[0]?.dimension ?? null;
  })();
  // S21 cover KPIs (BATNA / Power Balance / ZOPA / Input Quality)
  const s21Specific = isS21 ? (envelope?.payload?.scenario_specific ?? {}) : {};
  const s21PowerBalance = (() => {
    const v = String(s21Specific?.leverage_analysis?.power_balance ?? "").toUpperCase();
    if (!v || v.includes("|")) return null;
    if (v === "BUYER_ADVANTAGE") return "BUYER ADV.";
    if (v === "SUPPLIER_ADVANTAGE") return "SUPPLIER ADV.";
    return v.replace(/_/g, " ");
  })();
  const s21ZopaExists = typeof s21Specific?.zopa?.zopa_exists === "boolean" ? s21Specific.zopa.zopa_exists : null;
  const s21BuyerTarget = Number(s21Specific?.zopa?.buyer_target);
  const s21ZopaLabel = s21ZopaExists == null ? null : (s21ZopaExists ? (Number.isFinite(s21BuyerTarget) ? `YES (target €${s21BuyerTarget >= 1_000_000 ? (s21BuyerTarget/1_000_000).toFixed(1)+"M" : Math.round(s21BuyerTarget/1000)+"K"})` : "YES") : "NO");

  // S4 cover KPIs (Hard € / Soft € / Avoided € / CFO Acceptance)
  const isS4 = envelope?.scenario_id === "S4" || /savings\s*calculation/i.test(scenarioTitle);
  const s4Funnel = parsedData?.savingsRealizationFunnel;
  const s4Currency = s4Funnel?.currency ?? "EUR";
  const s4FmtMoney = (n: number | null | undefined) => {
    if (n == null || !Number.isFinite(Number(n))) return "—";
    const v = Math.abs(Number(n));
    const sym = s4Currency === "EUR" ? "€" : s4Currency === "USD" ? "$" : s4Currency === "GBP" ? "£" : `${s4Currency} `;
    return v >= 1_000_000 ? `${sym}${(v / 1_000_000).toFixed(2)}M` : v >= 1_000 ? `${sym}${Math.round(v / 1_000)}K` : `${sym}${Math.round(v)}`;
  };
  const s4HardLabel = s4FmtMoney(s4Funnel?.hardAnnualised);
  const s4SoftLabel = s4FmtMoney(s4Funnel?.softAnnualised);
  const s4AvoidedLabel = s4FmtMoney(s4Funnel?.avoidedProtected);
  const s4CfoAcceptance = s4Funnel?.cfoAcceptance ?? null;

  // S3 (Capex vs Opex / Lease vs Buy) cover KPIs:
  //   NPV ADVANTAGE (signed) · CFO PICK · WACC · OUTPUT RIGOUR
  const isS3 = envelope?.scenario_id === "S3" || /capex\s*vs\s*opex|lease\s*\/\s*buy/i.test(scenarioTitle);
  const s3Specific: any = isS3 ? (envelope?.payload?.scenario_specific ?? {}) : {};
  const s3Options: any[] = Array.isArray(s3Specific?.options) ? s3Specific.options : [];
  const s3Cfo: any = s3Specific?.cfo_recommendation ?? {};
  const s3Verdict = (() => {
    const v = String(s3Cfo?.verdict ?? "").toUpperCase();
    return v && !v.includes("|") ? v : null;
  })();
  const s3Wacc = (() => {
    const w = Number(s3Cfo?.wacc_assumed_pct);
    if (Number.isFinite(w) && w > 0) return `${w.toFixed(1)}%`;
    const w2 = Number(s3Options[0]?.discount_rate_used_pct);
    return Number.isFinite(w2) && w2 > 0 ? `${w2.toFixed(1)}%` : null;
  })();
  const s3NpvAdvantage = (() => {
    if (s3Options.length < 2) return null;
    const buy = s3Options.find((o: any) => /capex|buy|purchase/i.test(String(o?.option_label))) ?? s3Options[0];
    const lease = s3Options.find((o: any) => /opex|lease|subscription|rent/i.test(String(o?.option_label))) ?? s3Options[1];
    const a = Number(buy?.npv);
    const b = Number(lease?.npv);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    // NPV here is signed (negative = net cost). "Advantage" is the absolute
    // delta favouring the better option; sign indicates which option wins.
    const delta = a - b;
    const currencyCode = String(payload?.financial_model?.currency ?? "EUR").toUpperCase();
    const sym = currencyCode === "USD" ? "$" : currencyCode === "GBP" ? "£" : currencyCode === "JPY" ? "¥" : "€";
    const abs = Math.abs(delta);
    const fmt = abs >= 1_000_000 ? `${sym}${(abs / 1_000_000).toFixed(2)}M` : abs >= 1_000 ? `${sym}${Math.round(abs / 1_000)}K` : `${sym}${Math.round(abs)}`;
    return { label: `+${fmt}`, winner: delta >= 0 ? "BUY" : "LEASE" };
  })();
  const s3CfoPickLabel = s3Verdict ?? (s3NpvAdvantage?.winner ?? null);

  // S1 (TCO Analysis) cover KPIs: TCO SAVINGS · BEST OPTION · WACC · OUTPUT RIGOUR
  const isS1 = envelope?.scenario_id === "S1" || /tco|total\s*cost\s*of\s*ownership/i.test(scenarioTitle);
  const s1Specific: any = isS1 ? (envelope?.payload?.scenario_specific ?? {}) : {};
  const s1FinModel: any = isS1 ? (envelope?.payload?.financial_model ?? {}) : {};
  const s1CurrencySym = (() => {
    const code = String(parsedData?.tcoComparison?.currency ?? s1FinModel?.currency ?? "EUR").toUpperCase();
    if (code === "EUR") return "€";
    if (code === "USD") return "$";
    if (code === "GBP") return "£";
    return code === "JPY" ? "¥" : `${code} `;
  })();
  const s1FmtMoney = (n: any) => {
    const v = Number(n);
    if (!Number.isFinite(v) || v === 0) return null;
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${s1CurrencySym}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1000) return `${s1CurrencySym}${Math.round(abs / 1000)}K`;
    return `${s1CurrencySym}${Math.round(abs)}`;
  };
  const s1Tco = isS1 ? parsedData?.tcoComparison : undefined;
  const s1Best = s1Tco?.options?.length ? s1Tco.options.reduce((m, o) => o.totalTCO < m.totalTCO ? o : m, s1Tco.options[0]) : null;
  const s1Worst = s1Tco?.options?.length ? s1Tco.options.reduce((m, o) => o.totalTCO > m.totalTCO ? o : m, s1Tco.options[0]) : null;
  const s1SavingsLabel = s1Best && s1Worst && s1Worst.totalTCO > s1Best.totalTCO ? s1FmtMoney(s1Worst.totalTCO - s1Best.totalTCO) : null;
  const s1BestLabel = s1Best ? (s1Best.name.length > 22 ? `${s1Best.name.slice(0, 20)}…` : s1Best.name) : null;
  const s1Wacc = (() => {
    const w = Number(s1FinModel?.wacc_pct ?? s1FinModel?.discount_rate_pct ?? s1Specific?.wacc_pct);
    return Number.isFinite(w) && w > 0 ? `${w.toFixed(1)}%` : null;
  })();

  const reportHash = generateReportHash(scenarioTitle, timestamp);
  const formattedDate = formatDate(timestamp);
  const hasDashboards = selectedDashboards.length > 0;
  const hasParams = Object.keys(formData).length > 0;
  const tocEntries = buildTocEntries(hasDashboards, hasParams, selectedDashboards.length);
  const orgName = formData["organization"] || formData["Organization"] || formData["company"] || formData["Company"] || formData["org"] || "EXOS";
  const scenarioLabel = getScenarioTypeLabel(scenarioTitle);
  const reportTitle = getReportTitle(scenarioTitle);

  const allKeys = Object.keys(formData);
  const filledKeys = allKeys.filter(k => formData[k] && formData[k].trim() !== "");
  // SOURCE OF TRUTH: prefer the LLM coverage stars from the pre-run check
  // (0–5 → ×20). This is what the user saw on the Data Review screen, so
  // the PDF KPI matches end-to-end. Fall back to the deterministic
  // input-evaluator score, then to filled-fraction.
  const hasCoverageStars = typeof coverageStars === "number" && coverageStars > 0;
  const hasEvaluatorScore = typeof evaluationScore === "number" && evaluationScore > 0;
  const evaluatorPct = hasEvaluatorScore
    ? evaluationScore!
    : (allKeys.length > 0 ? Math.round((filledKeys.length / allKeys.length) * 100) : 0);
  const llmCoveragePct = hasCoverageStars ? Math.round(coverageStars! * 20) : 0;
  // Floors to prevent input-evaluator catch-22:
  //   ≥ 4.5★ → ≥ 75 ;  ≥ 4★ → ≥ 65 ; HIGH evaluator confidence → ≥ 60.
  const llmFloor = hasCoverageStars
    ? (coverageStars! >= 4.5 ? 75 : coverageStars! >= 4 ? 65 : 0)
    : 0;
  const confidenceFloor = (evaluationConfidence === "HIGH" && evaluatorPct < 60) ? 60 : 0;
  const rawCoveragePct = hasCoverageStars ? llmCoveragePct : evaluatorPct;
  const coveragePct = Math.max(rawCoveragePct, llmFloor, confidenceFloor);
  const showScore = hasCoverageStars || hasEvaluatorScore || (allKeys.length > 0 && filledKeys.length > 0);
  const coverageDisplay = showScore ? `${coveragePct}/100` : "—";
  const coverageDisplaySpaced = showScore ? `${coveragePct} / 100` : "—";
  // Output Rigour: actual delivered/promised ratio computed by the coverage
  // gate (output-schemas.applyCoverageToEnvelope persists this on envelope).
  // Read from the parsed envelope object (NOT the raw structuredData string,
  // which used to silently coerce to null and ship "—" forever).
  const outputCoverageRaw = (envelope as any)?.output_coverage
    ?? (envelope as any)?.payload?.output_coverage
    ?? null;
  const outputRigourPct = outputCoverageRaw && typeof outputCoverageRaw.ratio === "number"
    ? Math.round(outputCoverageRaw.ratio * 100)
    : null;
  const outputRigourDisplay = outputRigourPct == null
    ? "—"
    : `${outputCoverageRaw.delivered}/${outputCoverageRaw.promised} (${outputRigourPct}%)`;
  const isNegotiationPrep = /negotiat|preparing.*for.*negotiat/i.test(scenarioTitle);
  const batnaRawScore = parsedData?.negotiationPrep?.batna?.strength;
  // Normalise legacy 0–100 values to the canonical 0–5 scale.
  const batnaScore = batnaRawScore == null
    ? null
    : Number(batnaRawScore) > 5
      ? Number((Number(batnaRawScore) / 20).toFixed(1))
      : Number(Number(batnaRawScore).toFixed(1));
  const leverageLabel = parsedData?.negotiationPrep?.leveragePoints?.[0]?.point || (isNegotiationPrep ? "N/A" : "—");
  const supplierPowerLabel = parsedData?.negotiationPrep?.leveragePoints?.[1]?.point;
  const allParamEntries = Object.entries(formData).filter(([_, v]) => v && v.trim() !== "");

  // Confidence is now derived from OUTPUT COHERENCE (presence of structured
  // analytical signals), not from the input rigour score. A well-reasoned
  // report on thin input still earns Medium/High confidence; a sparse output
  // on rich input is rightly flagged Low.
  const outputSignals: boolean[] = [
    Array.isArray(findings) && findings.length >= 3,
    Array.isArray(recommendations) && recommendations.length >= 3,
    isS21
      ? (s21ZopaExists != null || s21PowerBalance != null)
      : isS20
        ? (s20Score != null || s20Rag != null)
        : isS27
          ? (s27ResiliencePosture != null || s27RtoGap != null)
          : true,
    isNegotiationPrep ? batnaScore != null : true,
    Array.isArray(envelope?.payload?.actions ?? envelope?.payload?.recommendations) ? true : strippedAnalysis.length > 800,
  ];
  const coherenceCount = outputSignals.filter(Boolean).length;
  const outputConfidence = coherenceCount >= 4 ? "High" : coherenceCount >= 2 ? "Medium" : "Low";
  // Allow an upstream HIGH override only — never let an upstream LOW override
  // a coherent output. Output coherence is the source of truth otherwise.
  const confidenceLevel =
    evaluationConfidence === "HIGH" && coherenceCount >= 3
      ? "High"
      : outputConfidence;


  const parseFindingTitle = (text: string): { title: string; body: string } => {
    // Strip raw numeric tails (e.g. "Reduce cost — 52700") that surface
    // when expected_value is a bare number with no unit, before parsing.
    const preStripped = String(text ?? "").replace(/\s+[—–-]\s+\d[\d,. ]*\s*$/, "");
    const stripped = stripMarkdown(preStripped).trim();
    const tagMatch = stripped.match(/^(\[[^\]]+\])\s*(.*)$/);
    const tag = tagMatch ? tagMatch[1] + " " : "";
    const rest = tagMatch ? tagMatch[2] : stripped;

    // Prefer an explicit colon-separated header (e.g. "HHI Risk: extreme concentration…")
    const colonIdx = rest.indexOf(":");
    if (colonIdx > 0 && colonIdx < 60) {
      return { title: tag + rest.slice(0, colonIdx).trim(), body: rest.slice(colonIdx + 1).trim() };
    }

    // Short finding (≤ 18 words OR ≤ 110 chars): render fully as the title only,
    // with no body. Avoids chopping mid-sentence on "due", "and", a comma, etc.
    const words = rest.split(/\s+/);
    if (words.length <= 18 || rest.length <= 110) {
      return { title: tag + rest, body: "" };
    }

    // Long finding: split on the first sentence boundary if one exists in the
    // first 90 chars, otherwise take a clean prefix (no trailing connector word).
    const sentenceMatch = rest.match(/^(.{20,90}?[.?!])\s+(.+)$/);
    if (sentenceMatch) {
      return { title: tag + sentenceMatch[1].replace(/[.?!]$/, ""), body: sentenceMatch[2] };
    }
    // Take ~12 words but drop a trailing connector ("and", "due", "to", "of", "with", ",")
    const headWords = words.slice(0, 12);
    const trailingConnector = /^(and|due|to|of|with|in|on|for|at|by|as|from|the|a|an|or|but)$/i;
    while (headWords.length > 0 && (trailingConnector.test(headWords[headWords.length - 1]) || /[,;:]$/.test(headWords[headWords.length - 1]))) {
      headWords.pop();
    }
    const cleanHead = headWords.join(" ").replace(/[,;:]$/, "");
    return { title: tag + (cleanHead || words.slice(0, 8).join(" ")), body: words.slice(headWords.length).join(" ") };
  };

  const findingColors = [c.accent1, c.accent2, c.accent4];

  return (
    <Document>
      {/* Page 1: Cover + Executive Summary (merged) */}
      <Page size="A4" style={s.page} id="section-executive-summary">
        <CoverBand
          scenarioLabel={scenarioLabel}
          reportTitle={reportTitle}
          dateStr={formattedDate}
          reportHash={reportHash}
          c={c}
          mode={pdfTheme}
        />
        {/* Push content below the 150pt band */}
        <View style={{ height: 110 }} />


        <View style={s.sectionTitleWrapperCompact}><Text style={{ fontSize: 14, fontFamily: "Inter", fontWeight: 700, color: c.text }}>Executive Summary</Text><View style={s.sectionTitleLine} /></View>
        <View style={{ marginBottom: 10 }}>
          {findings.slice(0, 5).map((point, i) => {
            const clean = dedupeParenAcronyms(stripMarkdown(String(point ?? "")).trim());
            if (!clean) return null;
            return (
              <View key={`f-${i}`} style={{ flexDirection: "row", marginBottom: 5, paddingRight: 4 }}>
                <Text style={{ fontSize: 10, color: c.accent1, marginRight: 6, lineHeight: 1.5 }}>•</Text>
                <Text style={{ flex: 1, fontSize: 10, color: c.text, lineHeight: 1.5 }}>{clean}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.sectionTitleWrapperCompact}><Text style={{ fontSize: 14, fontFamily: "Inter", fontWeight: 700, color: c.text }}>Recommended Actions</Text><View style={s.sectionTitleLine} /></View>
        {recommendations.slice(0, 4).map((point, i) => {
          const parsed = parseFindingTitle(point);
          const title = dedupeParenAcronyms(parsed.title);
          const body = parsed.body ? dedupeParenAcronyms(parsed.body) : "";
          return (
            <View key={`r-${i}`} style={{ ...s.actionItem, borderLeftColor: accentColor(i, c) }} wrap={false}>
              <View style={{ ...s.actionNumber, backgroundColor: accentColor(i, c) }}><Text style={s.actionNumberText}>{i + 1}</Text></View>
              <View style={s.actionContent}><Text style={s.actionTitle}>{title}</Text>{body ? <Text style={s.actionBody}>{body}</Text> : null}</View>
            </View>
          );
        })}

        <View style={s.kpiRow}>
          {isS27 ? (
            <>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>INPUT QUALITY</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{coverageDisplaySpaced}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>RESILIENCE POSTURE</Text><Text style={{ ...s.kpiValue, color: kpiColor(s27ResiliencePosture === "RED" ? "High" : s27ResiliencePosture === "AMBER" ? "Medium" : s27ResiliencePosture === "GREEN" ? "Low" : confidenceLevel, "risk", c) }}>{s27ResiliencePosture ?? "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>RTO GAP</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s27RtoGap != null ? `${s27RtoGap}h` : "—"}</Text></View>
              <View style={{ ...s.kpiCell, ...s.kpiCellLast }}><Text style={s.kpiLabel}>SINGLE-SOURCE FLOWS</Text><Text style={{ ...s.kpiValue, color: s27SingleSourceFlows && s27SingleSourceFlows > 0 ? c.destructive : c.success }}>{s27SingleSourceFlows != null ? String(s27SingleSourceFlows) : "—"}</Text></View>
            </>
          ) : isS20 ? (
            <>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>RISK SCORE</Text><Text style={{ ...s.kpiValue, color: kpiColor(s20Rag === "RED" ? "High" : s20Rag === "AMBER" ? "Medium" : s20Rag === "GREEN" ? "Low" : confidenceLevel, "risk", c) }}>{s20Score != null ? `${s20Score} / 100` : "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>RAG STATUS</Text><Text style={{ ...s.kpiValue, color: kpiColor(s20Rag === "RED" ? "High" : s20Rag === "AMBER" ? "Medium" : s20Rag === "GREEN" ? "Low" : confidenceLevel, "risk", c) }}>{s20Rag ?? "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>DECISION</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s20Decision ?? "—"}</Text></View>
              <View style={{ ...s.kpiCell, ...s.kpiCellLast }}><Text style={s.kpiLabel}>TOP RISK DIMENSION</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s20TopRisk ?? "—"}</Text></View>
            </>
          ) : isS21 ? (
            <>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>BATNA SCORE</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{batnaScore != null ? `${batnaScore} / 5` : "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>POWER BALANCE</Text><Text style={{ ...s.kpiValue, color: s21PowerBalance === "BUYER ADV." ? c.success : s21PowerBalance === "SUPPLIER ADV." ? c.destructive : c.primary }}>{s21PowerBalance ?? "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>ZOPA</Text><Text style={{ ...s.kpiValue, color: s21ZopaExists === false ? c.destructive : s21ZopaExists ? c.success : c.primary }}>{s21ZopaLabel ?? "—"}</Text></View>
              <View style={{ ...s.kpiCell, ...s.kpiCellLast }}><Text style={s.kpiLabel}>INPUT QUALITY</Text><Text style={{ ...s.kpiValue, color: kpiColor(confidenceLevel, "confidence", c) }}>{coverageDisplaySpaced}</Text></View>
            </>
          ) : isS6 ? (
            <>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>INPUT QUALITY</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{coverageDisplaySpaced}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>BASE CASE</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s6BaseLabel ?? "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>RISK BAND</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s6RiskBand ?? "—"}</Text></View>
              <View style={{ ...s.kpiCell, ...s.kpiCellLast }}><Text style={s.kpiLabel}>TOP DRIVER</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s6TopDriver ?? "—"}</Text></View>
            </>
          ) : isS4 ? (
            <>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>HARD €</Text><Text style={{ ...s.kpiValue, color: c.success }}>{s4HardLabel}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>SOFT €</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s4SoftLabel}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>AVOIDED €</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s4AvoidedLabel}</Text></View>
              <View style={{ ...s.kpiCell, ...s.kpiCellLast }}><Text style={s.kpiLabel}>CFO ACCEPTANCE</Text><Text style={{ ...s.kpiValue, color: s4CfoAcceptance === "GREEN" ? c.success : s4CfoAcceptance === "RED" ? c.destructive : c.primary }}>{s4CfoAcceptance ?? "—"}</Text></View>
            </>
          ) : isS22 ? (
            <>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>KRALJIC POSITION</Text><Text style={{ ...s.kpiValue, color: s22KraljicPosition === "STRATEGIC" || s22KraljicPosition === "BOTTLENECK" ? c.destructive : c.primary }}>{s22KraljicPosition ?? "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>SUPPLIER POWER</Text><Text style={{ ...s.kpiValue, color: kpiColor(s22SupplierPower === "HIGH" ? "High" : s22SupplierPower === "MEDIUM" ? "Medium" : s22SupplierPower === "LOW" ? "Low" : confidenceLevel, "risk", c) }}>{s22SupplierPower ?? "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>LEVERAGE</Text><Text style={{ ...s.kpiValue, color: s22Leverage === "HIGH" ? c.success : s22Leverage === "LOW" ? c.destructive : c.primary }}>{s22Leverage ?? "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>QUICK WINS</Text><Text style={{ ...s.kpiValue, color: s22QuickWinsCount > 0 ? c.primary : c.textMuted }}>{s22QuickWinsCount > 0 ? String(s22QuickWinsCount) : "—"}</Text></View>
              <View style={{ ...s.kpiCell, ...s.kpiCellLast }}><Text style={s.kpiLabel}>OUTPUT RIGOUR</Text><Text style={{ ...s.kpiValue, color: outputRigourPct == null ? c.textMuted : kpiColor(String(outputRigourPct), "confidence", c) }}>{outputRigourDisplay}</Text></View>
            </>
          ) : isS3 ? (
            <>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>INPUT QUALITY</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{coverageDisplaySpaced}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>NPV ADVANTAGE</Text><Text style={{ ...s.kpiValue, color: s3NpvAdvantage ? c.success : c.textMuted }}>{s3NpvAdvantage?.label ?? "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>CFO PICK</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s3CfoPickLabel ?? "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>WACC</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s3Wacc ?? "—"}</Text></View>
              <View style={{ ...s.kpiCell, ...s.kpiCellLast }}><Text style={s.kpiLabel}>OUTPUT RIGOUR</Text><Text style={{ ...s.kpiValue, color: outputRigourPct == null ? c.textMuted : kpiColor(String(outputRigourPct), "confidence", c) }}>{outputRigourDisplay}</Text></View>
            </>
          ) : isS1 ? (
            <>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>INPUT QUALITY</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{coverageDisplaySpaced}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>TCO SAVINGS</Text><Text style={{ ...s.kpiValue, color: s1SavingsLabel ? c.success : c.textMuted }}>{s1SavingsLabel ?? "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>BEST OPTION</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s1BestLabel ?? "—"}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>WACC</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{s1Wacc ?? "—"}</Text></View>
              <View style={{ ...s.kpiCell, ...s.kpiCellLast }}><Text style={s.kpiLabel}>OUTPUT RIGOUR</Text><Text style={{ ...s.kpiValue, color: outputRigourPct == null ? c.textMuted : kpiColor(String(outputRigourPct), "confidence", c) }}>{outputRigourDisplay}</Text></View>
            </>
          ) : (
            <>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>{isNegotiationPrep ? "BATNA SCORE" : "INPUT QUALITY"}</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{isNegotiationPrep && batnaScore != null ? `${batnaScore} / 5` : coverageDisplaySpaced}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>LEVERAGE</Text><Text style={{ ...s.kpiValue, color: c.primary }}>{leverageLabel}</Text></View>
              <View style={s.kpiCell}><Text style={s.kpiLabel}>SUPPLIER POWER</Text><Text style={{ ...s.kpiValue, color: kpiColor(extractRiskKpi(strippedAnalysis), "risk", c) }}>{supplierPowerLabel || (extractRiskKpi(strippedAnalysis) !== "—" ? extractRiskKpi(strippedAnalysis).toUpperCase() : "N/A")}</Text></View>
              <View style={{ ...s.kpiCell, ...s.kpiCellLast }}><Text style={s.kpiLabel}>CONFIDENCE</Text><Text style={{ ...s.kpiValue, color: kpiColor(confidenceLevel, "confidence", c) }}>{confidenceLevel.toUpperCase()}</Text></View>
            </>
          )}
        </View>

        <View style={s.footer} fixed><Text style={s.footerText} render={() => `Confidential — ${orgName}`} /><Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} /><Text style={s.footerText} render={() => `EXOS-SENTINEL-PIPELINE`} /></View>
        <View style={s.bottomStripe}>
          <View style={{ ...s.stripeSegment, backgroundColor: c.stripe1 }} />
          <View style={{ ...s.stripeSegment, backgroundColor: c.stripe2 }} />
          <View style={{ ...s.stripeSegment, backgroundColor: c.stripe3 }} />
          <View style={{ ...s.stripeSegment, backgroundColor: c.stripe4 }} />
          <View style={{ ...s.stripeSegment, backgroundColor: c.stripe5 }} />
          <View style={{ ...s.stripeSegment, backgroundColor: c.stripe6 }} />
        </View>
      </Page>

      {/* Dashboard pages */}
      {(() => {
        // Filter dashboards down to those that actually have data, so empty placeholder
        // pages and cards no longer appear in the PDF.
        const available = selectedDashboards.filter((d) => {
          const key = dashboardDataKey[d as string];
          return key && parsedData && parsedData[key];
        });
        // Always promote scenario-specific widgets when their payloads are present,
        // even if the user's draft predates them being in the dashboard mapping.
        // Prevents the S3 case where NPV Waterfall + IFRS 16 silently disappeared.
        const promoted: DashboardType[] = [];
        if (parsedData?.npvWaterfall && !available.includes("npv-waterfall" as DashboardType)) {
          promoted.push("npv-waterfall" as DashboardType);
        }
        if (parsedData?.ifrs16Impact && !available.includes("ifrs16-impact" as DashboardType)) {
          promoted.push("ifrs16-impact" as DashboardType);
        }
        if (parsedData?.savingsRealizationFunnel && !available.includes("savings-realization-funnel" as DashboardType)) {
          promoted.push("savings-realization-funnel" as DashboardType);
        }
        if (parsedData?.workingCapitalDpo && !available.includes("working-capital-dpo" as DashboardType)) {
          promoted.push("working-capital-dpo" as DashboardType);
        }
        const finalList = [...promoted, ...available];
        if (finalList.length === 0) return null;
        const pairs = chunkPairs(finalList);
        return pairs.map((pair, pairIdx) => (
          <Page key={`dash-page-${pairIdx}`} size="A4" style={s.pageWithHeader}>
            <View style={s.headerBar} fixed>
              <View style={{ flexDirection: "row", alignItems: "center" }}><Text style={{ fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary, marginRight: 12 }}>EXOS</Text><Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1 }}>{scenarioLabel}</Text></View>
              <Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.85 }}>Confidential · {formattedDate}</Text>
            </View>
            {pairIdx === 0 && <View style={s.sectionBadge} id="section-visualizations"><Text style={s.sectionBadgeText}>ANALYSIS VISUALIZATIONS</Text></View>}
            {pair.map((dashboardType, idx) => (
              <View key={dashboardType} style={{ marginBottom: idx === 0 && pair.length > 1 ? 12 : 0 }} wrap={false}>
                {renderDashboard(dashboardType, parsedData, pdfTheme)}
              </View>
            ))}
            <View style={s.footer} fixed><Text style={s.footerText} render={() => `Confidential — ${orgName}`} /><Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} /><Text style={s.footerText} render={() => `EXOS-SENTINEL-PIPELINE`} /></View>
          </Page>
        ));
      })()}

      {/* S22 Category Strategy Pack — strategic options + quick wins */}
      {isS22 && (() => {
        const opts: any[] = Array.isArray(s22Specific?.strategic_options) ? s22Specific.strategic_options : [];
        const qw: any[] = Array.isArray(s22Specific?.quick_wins) ? s22Specific.quick_wins : [];
        if (opts.length === 0 && qw.length === 0) return null;
        const fmtMoneyShort = (n: any) => {
          const v = Number(n);
          if (!Number.isFinite(v)) return "—";
          const abs = Math.abs(v);
          if (abs >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
          if (abs >= 1000) return `€${Math.round(v / 1000)}K`;
          return `€${Math.round(v)}`;
        };
        const horizonColor = (h: string) => {
          const k = String(h ?? "").toUpperCase();
          if (k === "SHORT") return c.success;
          if (k === "MEDIUM") return c.warning;
          if (k === "LONG") return c.accent3;
          return c.textMuted;
        };
        return (
          <Page size="A4" style={s.pageWithHeader} id="section-strategy-pack">
            <View style={s.headerBar} fixed>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary, marginRight: 12 }}>EXOS</Text>
                <Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1 }}>{scenarioLabel}</Text>
              </View>
              <Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.85 }}>Confidential · {formattedDate}</Text>
            </View>
            <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>CATEGORY STRATEGY PACK</Text></View>

            {opts.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <View style={s.sectionTitleWrapper}><Text style={s.sectionTitleText}>Strategic Options Matrix</Text><View style={s.sectionTitleLine} /></View>
                {opts.slice(0, 5).map((o, i) => (
                  <View key={`opt-${i}`} style={{ borderWidth: 1, borderColor: c.border, padding: 8, marginBottom: 6, backgroundColor: c.surface }} wrap={false}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      <View style={{ paddingHorizontal: 5, paddingVertical: 2, backgroundColor: horizonColor(o?.horizon), marginRight: 6 }}>
                        <Text style={{ fontSize: 7, color: c.textOnPrimary, fontWeight: 700 }}>{String(o?.horizon ?? "").toUpperCase() || "—"}</Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 10, color: c.text, fontWeight: 700 }}>{stripMarkdown(String(o?.label ?? `Option ${i + 1}`))}</Text>
                      <Text style={{ fontSize: 9, color: c.primary, fontWeight: 700 }}>
                        {typeof o?.expected_value === "number" ? fmtMoneyShort(o.expected_value) : (o?.expected_value ? stripMarkdown(String(o.expected_value)).slice(0, 40) : "—")}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row" }}>
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text style={{ fontSize: 8, color: c.success, fontWeight: 700, marginBottom: 2 }}>PROS</Text>
                        {(Array.isArray(o?.pros) ? o.pros : []).slice(0, 4).map((p: any, j: number) => (
                          <Text key={j} style={{ fontSize: 8, color: c.text, marginBottom: 1 }}>• {stripMarkdown(String(p))}</Text>
                        ))}
                      </View>
                      <View style={{ flex: 1, paddingLeft: 6, borderLeftWidth: 1, borderLeftColor: c.border }}>
                        <Text style={{ fontSize: 8, color: c.destructive, fontWeight: 700, marginBottom: 2 }}>CONS</Text>
                        {(Array.isArray(o?.cons) ? o.cons : []).slice(0, 3).map((p: any, j: number) => (
                          <Text key={j} style={{ fontSize: 8, color: c.text, marginBottom: 1 }}>• {stripMarkdown(String(p))}</Text>
                        ))}
                      </View>
                    </View>
                    {o?.investment_required ? (
                      <Text style={{ fontSize: 8, color: c.textMuted, marginTop: 3 }}>Investment: {stripMarkdown(String(o.investment_required))}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {qw.length > 0 && (
              <View>
                <View style={s.sectionTitleWrapper}><Text style={s.sectionTitleText}>Quick Wins (≤ 12 weeks)</Text><View style={s.sectionTitleLine} /></View>
                <View style={{ borderWidth: 1, borderColor: c.border }}>
                  <View style={{ flexDirection: "row", backgroundColor: c.primary, padding: 5 }}>
                    <Text style={{ flex: 3, fontSize: 8, color: c.textOnPrimary, fontWeight: 700, textTransform: "uppercase" }}>Action</Text>
                    <Text style={{ flex: 1.2, fontSize: 8, color: c.textOnPrimary, fontWeight: 700, textTransform: "uppercase" }}>Owner</Text>
                    <Text style={{ width: 50, fontSize: 8, color: c.textOnPrimary, fontWeight: 700, textTransform: "uppercase", textAlign: "center" }}>Weeks</Text>
                    <Text style={{ width: 60, fontSize: 8, color: c.textOnPrimary, fontWeight: 700, textTransform: "uppercase", textAlign: "right" }}>Value</Text>
                  </View>
                  {qw.slice(0, 6).map((q, i) => (
                    <View key={`qw-${i}`} style={{ flexDirection: "row", padding: 5, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.border, backgroundColor: i % 2 === 1 ? c.surfaceLight : c.surface }} wrap={false}>
                      <Text style={{ flex: 3, fontSize: 9, color: c.text }}>{stripMarkdown(String(q?.action ?? "—"))}</Text>
                      <Text style={{ flex: 1.2, fontSize: 9, color: c.textMuted }}>{stripMarkdown(String(q?.owner ?? "—"))}</Text>
                      <Text style={{ width: 50, fontSize: 9, color: c.text, textAlign: "center" }}>{Number.isFinite(Number(q?.weeks_to_value)) ? String(q.weeks_to_value) : "—"}</Text>
                      <Text style={{ width: 60, fontSize: 9, color: c.primary, textAlign: "right", fontWeight: 700 }}>{fmtMoneyShort(q?.value_eur)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={s.footer} fixed><Text style={s.footerText} render={() => `Confidential — ${orgName}`} /><Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} /><Text style={s.footerText} render={() => `EXOS-SENTINEL-PIPELINE`} /></View>
          </Page>
        );
      })()}

      {/* S22 Market Intelligence + Porter's + Cross-Category + Best Practices */}
      {isS22 && (() => {
        const xc: any[] = Array.isArray(s22Specific?.cross_category_analogies) ? s22Specific.cross_category_analogies : [];
        const bp: any[] = Array.isArray(s22Specific?.best_practices) ? s22Specific.best_practices : [];
        const mi: any = s22Specific?.market_intelligence ?? null;
        const pf: any = s22Specific?.porters_five_forces ?? null;
        const hasMi = mi && ((Array.isArray(mi.key_trends) && mi.key_trends.length > 0) || mi.supply_dynamics || mi.regulatory_outlook || (Array.isArray(mi.innovation_signals) && mi.innovation_signals.length > 0));
        const hasPf = pf && Object.values(pf).some((v: any) => v?.rating || v?.key_driver);
        if (!hasMi && !hasPf && xc.length === 0 && bp.length === 0) return null;
        const ratingColor = (r: string) => {
          const k = String(r ?? "").toUpperCase();
          if (k === "HIGH") return c.destructive;
          if (k === "MEDIUM") return c.warning;
          if (k === "LOW") return c.success;
          return c.textMuted;
        };
        const forces: Array<[string, string]> = [
          ["Supplier power", "supplier_power"],
          ["Buyer power", "buyer_power"],
          ["Threat of substitutes", "threat_of_substitutes"],
          ["Threat of new entrants", "threat_of_new_entrants"],
          ["Competitive rivalry", "competitive_rivalry"],
        ];
        return (
          <Page size="A4" style={s.pageWithHeader} id="section-market-context">
            <View style={s.headerBar} fixed>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary, marginRight: 12 }}>EXOS</Text>
                <Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1 }}>{scenarioLabel}</Text>
              </View>
              <Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.85 }}>Confidential · {formattedDate}</Text>
            </View>
            <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>MARKET CONTEXT & BENCHMARKS</Text></View>

            {hasMi && (
              <View style={{ marginBottom: 14 }}>
                <View style={s.sectionTitleWrapper}><Text style={s.sectionTitleText}>Market Intelligence Brief</Text><View style={s.sectionTitleLine} /></View>
                {Array.isArray(mi.key_trends) && mi.key_trends.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 9, color: c.textMuted, textTransform: "uppercase", marginBottom: 3, fontWeight: 700 }}>Key trends</Text>
                    {mi.key_trends.slice(0, 6).map((t: any, i: number) => (
                      <Text key={`kt-${i}`} style={{ fontSize: 9, color: c.text, marginBottom: 2 }}>• {stripMarkdown(String(t))}</Text>
                    ))}
                  </View>
                )}
                {mi.supply_dynamics && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 9, color: c.textMuted, textTransform: "uppercase", marginBottom: 3, fontWeight: 700 }}>Supply dynamics</Text>
                    <Text style={{ fontSize: 9, color: c.text }}>{stripMarkdown(String(mi.supply_dynamics))}</Text>
                  </View>
                )}
                {mi.regulatory_outlook && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 9, color: c.textMuted, textTransform: "uppercase", marginBottom: 3, fontWeight: 700 }}>Regulatory outlook</Text>
                    <Text style={{ fontSize: 9, color: c.text }}>{stripMarkdown(String(mi.regulatory_outlook))}</Text>
                  </View>
                )}
                {Array.isArray(mi.innovation_signals) && mi.innovation_signals.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 9, color: c.textMuted, textTransform: "uppercase", marginBottom: 3, fontWeight: 700 }}>Innovation signals</Text>
                    {mi.innovation_signals.slice(0, 4).map((t: any, i: number) => (
                      <Text key={`is-${i}`} style={{ fontSize: 9, color: c.text, marginBottom: 2 }}>• {stripMarkdown(String(t))}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {hasPf && (
              <View style={{ marginBottom: 14 }}>
                <View style={s.sectionTitleWrapper}><Text style={s.sectionTitleText}>Porter's Five Forces</Text><View style={s.sectionTitleLine} /></View>
                <View style={{ borderWidth: 1, borderColor: c.border }}>
                  {forces.map(([label, key], i) => {
                    const f = pf?.[key];
                    const rating = String(f?.rating ?? "").toUpperCase();
                    const driver = f?.key_driver ? stripMarkdown(String(f.key_driver)) : "—";
                    return (
                      <View key={key} style={{ flexDirection: "row", padding: 6, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.border, backgroundColor: i % 2 === 1 ? c.surfaceLight : c.surface }} wrap={false}>
                        <Text style={{ flex: 1.2, fontSize: 9, color: c.text, fontWeight: 700 }}>{label}</Text>
                        <View style={{ width: 60 }}>
                          <View style={{ paddingHorizontal: 5, paddingVertical: 2, backgroundColor: ratingColor(rating), alignSelf: "flex-start" }}>
                            <Text style={{ fontSize: 8, color: c.textOnPrimary, fontWeight: 700 }}>{rating || "—"}</Text>
                          </View>
                        </View>
                        <Text style={{ flex: 3, fontSize: 9, color: c.textMuted }}>{driver}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {xc.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <View style={s.sectionTitleWrapper}><Text style={s.sectionTitleText}>Cross-Category Analogies</Text><View style={s.sectionTitleLine} /></View>
                {xc.slice(0, 4).map((a, i) => (
                  <View key={`xc-${i}`} style={{ borderLeftWidth: 3, borderLeftColor: c.accent2, paddingLeft: 8, marginBottom: 6 }} wrap={false}>
                    <Text style={{ fontSize: 9, color: c.text, fontWeight: 700 }}>{stripMarkdown(String(a?.industry ?? "—"))} · {stripMarkdown(String(a?.category ?? "—"))}</Text>
                    <Text style={{ fontSize: 9, color: c.text, marginTop: 1 }}>{stripMarkdown(String(a?.lesson ?? ""))}</Text>
                    {a?.applicability ? <Text style={{ fontSize: 8, color: c.textMuted, marginTop: 2, fontStyle: "italic" }}>Why it transfers: {stripMarkdown(String(a.applicability))}</Text> : null}
                  </View>
                ))}
              </View>
            )}

            {bp.length > 0 && (
              <View>
                <View style={s.sectionTitleWrapper}><Text style={s.sectionTitleText}>Best Practices</Text><View style={s.sectionTitleLine} /></View>
                {bp.slice(0, 5).map((b, i) => (
                  <View key={`bp-${i}`} style={{ flexDirection: "row", marginBottom: 5 }} wrap={false}>
                    <Text style={{ fontSize: 10, color: c.primary, marginRight: 6 }}>•</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9, color: c.text }}>{stripMarkdown(String(b?.practice ?? "—"))}</Text>
                      <Text style={{ fontSize: 8, color: c.textMuted, marginTop: 1 }}>
                        Source: {stripMarkdown(String(b?.source_category ?? "—"))}{b?.expected_benefit ? ` · Benefit: ${stripMarkdown(String(b.expected_benefit))}` : ""}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={s.footer} fixed><Text style={s.footerText} render={() => `Confidential — ${orgName}`} /><Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} /><Text style={s.footerText} render={() => `EXOS-SENTINEL-PIPELINE`} /></View>
          </Page>
        );
      })()}

      {/* Detailed Analysis */}
      <Page size="A4" style={s.pageWithHeader} id="section-detailed-analysis">
        <View style={s.headerBar} fixed>
          <View style={{ flexDirection: "row", alignItems: "center" }}><Text style={{ fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary, marginRight: 12 }}>EXOS</Text><Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1 }}>{scenarioLabel}</Text></View>
          <Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.85 }}>Confidential · {formattedDate}</Text>
        </View>
        <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>DETAILED ANALYSIS</Text></View>
        <View style={s.sectionTitleWrapper}><Text style={s.sectionTitleText}>Analysis Overview</Text><View style={s.sectionTitleLine} /></View>
        {(() => {
          const sections = categorizeAnalysisSections(analysisLines);
          const blockColors = [c.destructive, c.accent3, c.accent2, c.primary, c.accent4];
          return sections.map((section, si) => {
            // For S27, retain risks-classified sections in Detailed Analysis —
            // they hold the Black Swan Risk Map, Vulnerability Assessment, and
            // Cascading Failure tables that are part of the promised deliverables.
            if (section.type === "recommendations") return null;
            if (!isS27 && !isS26 && section.type === "risks") return null;
            // For S26 keep the risks-classified section in Detailed Analysis so
            // Stage 4 Prevent items stay attached to the Emergency Map.
            const blockColor = blockColors[si % blockColors.length];
            return (
              <View key={`section-${si}`} style={{ ...s.analysisBlock, borderLeftColor: blockColor }}>
                {(() => {
                  // Build the body elements (tables + paragraphs).
                  const out: ReactElement[] = [];
                  let i = 0;
                  const lines = section.lines;
                  while (i < lines.length) {
                    if (isTableLine(lines[i])) {
                      const run: string[] = [];
                      while (i < lines.length && isTableLine(lines[i])) { run.push(lines[i]); i++; }
                      const rows = run.map(parseTableRow).filter((r): r is string[] => r !== null);
                      if (rows.length === 0) continue;
                      const [header, ...body] = rows;
                      const isEmptyCell = (v: string): boolean => {
                        const t = (v ?? "").trim();
                        if (!t || t === "-" || t === "—" || /^n\/?a$/i.test(t) || /^null$/i.test(t)) return true;
                        if (/^[€$£]?\s*0+(?:[.,]0+)?\s*%?$/.test(t)) return true;
                        return false;
                      };
                      const displayCell = (v: string): string => isEmptyCell(v) ? "Not provided" : v;
                      const hasAnyData = body.some(row => row.slice(1).some(c => !isEmptyCell(c)));
                      if (!hasAnyData) continue;
                      out.push(
                        <View key={`tbl-${si}-${i}`} style={s.mdTable} wrap={false}>
                          <View style={s.mdTableHeaderRow}>
                            {header.map((cell, ci) => (
                              <View key={`h-${ci}`} style={ci === header.length - 1 ? s.mdTableCellLast : s.mdTableCell}>
                                <Text style={s.mdTableHeaderText}>{cell}</Text>
                              </View>
                            ))}
                          </View>
                          {body.map((row, ri) => (
                            <View key={`r-${ri}`} style={ri % 2 === 1 ? s.mdTableRowAlt : s.mdTableRow}>
                              {Array.from({ length: header.length }).map((_, ci) => {
                                const raw = row[ci] ?? "";
                                const text = ci === 0 ? raw : displayCell(raw);
                                const muted = ci !== 0 && isEmptyCell(raw);
                                return (
                                  <View key={`c-${ri}-${ci}`} style={ci === header.length - 1 ? s.mdTableCellLast : s.mdTableCell}>
                                    <Text style={muted ? { ...s.mdTableCellText, color: c.textMuted, fontStyle: "italic" } : s.mdTableCellText}>{text}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      );
                      continue;
                    }
                    out.push(renderBodyText(lines[i], s.analysisText));
                    i++;
                  }
                  // Keep the section pill glued to its first content element so
                  // headers like "RECOMMENDED CONTRACT TERMS" never get orphaned
                  // at the bottom of a page with the table on the next.
                  const head = (
                    <View key="head" wrap={false}>
                      <View style={{ ...s.analysisBlockBadge, backgroundColor: blockColor }}>
                        <Text style={s.analysisBlockBadgeText}>{stripMarkdown(section.title).replace(/^(\w+)(\s+\1\b)+/i, "$1").toUpperCase()}</Text>
                      </View>
                      {out[0] ?? null}
                    </View>
                  );
                  return [head, ...out.slice(1)];
                })()}
              </View>
            );
          });
        })()}
        <View style={s.footer} fixed><Text style={s.footerText} render={() => `Confidential — ${orgName}`} /><Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} /><Text style={s.footerText} render={() => `EXOS-SENTINEL-PIPELINE`} /></View>
      </Page>

      {/* Recommendations & Risks — only render when overflow recommendations exist OR a Risk Register has content */}
      {(() => {
        const sections = categorizeAnalysisSections(analysisLines);
        const recoSections = sections.filter(sec => sec.type === "recommendations");
        const recoLines = recoSections.flatMap(sec => sec.lines);
        const overflowRecos = (recoLines.length > 0 ? recoLines : recommendations).slice(4);
        // D4: For S27 the Black Swan Risk Map (rendered inline in Detailed
        // Analysis) is the canonical risk view — suppress the legacy generic
        // Risk Register entirely to avoid duplication and table corruption.
        const structuredRisks = (isS27 || isS26 || isS20 || isS21) ? [] : extractRiskRegisterItems(analysisResult);
        const rawRiskLines = sections.filter(sec => sec.type === "risks").flatMap(sec => sec.lines);
        // Drop markdown-table fragments and instructional lines so each
        // remaining line is a real risk sentence, not a leaked table cell.
        const riskLines = (isS27 || isS26 || isS20 || isS21) ? [] : rawRiskLines.filter(l => !isTableLine(l) && !isInstructionLine(l) && l.length >= 15);
        const hasRiskRegister = structuredRisks.length > 0 || riskLines.length > 0;
        // F8/F10: A single overflow recommendation on its own page produces a
        // near-empty Page 4. Suppress the entire Recommendations & Risks page
        // when there is only one overflow item and no Risk Register content.
        if (overflowRecos.length <= 1 && !hasRiskRegister) return null;
        if (overflowRecos.length === 0 && !hasRiskRegister) return null;

        const recoAccents = [c.primary, c.accent2, c.accent3, c.accent4];

        return (
          <Page size="A4" style={s.pageWithHeader} id="section-recs-risks">
            <View style={s.headerBar} fixed>
              <View style={{ flexDirection: "row", alignItems: "center" }}><Text style={{ fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary, marginRight: 12 }}>EXOS</Text><Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1 }}>{scenarioLabel}</Text></View>
              <Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.85 }}>Confidential · {formattedDate}</Text>
            </View>
            <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>{hasRiskRegister ? "RECOMMENDATIONS & RISKS" : "ADDITIONAL RECOMMENDATIONS"}</Text></View>

            {overflowRecos.length > 0 && (
              <>
                <View style={s.sectionTitleWrapper}><Text style={s.sectionTitleText}>Additional Recommendations</Text><View style={s.sectionTitleLine} /></View>
                {overflowRecos.slice(0, 6).map((line, i) => {
                  const { title, body } = parseFindingTitle(line);
                  return (
                    <View key={`reco-${i}`} style={{ ...s.recoCard, borderLeftColor: recoAccents[i % recoAccents.length] }} wrap={false}>
                      <Text style={s.recoTitle}>{title}</Text>{body ? <Text style={s.recoBody}>{body}</Text> : null}
                    </View>
                  );
                })}
              </>
            )}

            {hasRiskRegister && (() => {
              const useStructured = structuredRisks.length > 0;
              const heading = (
                <View style={{ ...s.sectionTitleWrapper, marginTop: 16 }}><Text style={s.sectionTitleText}>Risk Register</Text><View style={{ ...s.sectionTitleLine, backgroundColor: c.destructive }} /></View>
              );
              if (useStructured) {
                return (
                  <>
                    {heading}
                    {structuredRisks.slice(0, 5).map((item, i) => {
                      const sevColor = riskSeverityColor(item.severity, c);
                      return (
                        <View key={`risk-${i}`} style={{ ...s.riskItem, borderLeftColor: sevColor }} wrap={false}>
                          <View style={{ ...s.riskBadge, backgroundColor: sevColor }}><Text style={s.riskBadgeText}>{item.severity.toUpperCase()}</Text></View>
                          {item.name ? <Text style={s.riskTitle}>{item.name}</Text> : null}
                          <Text style={s.riskDescription}>{item.description}</Text>
                        </View>
                      );
                    })}
                  </>
                );
              }
              return (
                <>
                  {heading}
                  {riskLines.slice(0, 5).map((line, i) => {
                    const { severity, cleanText } = parseRiskSeverity(line);
                    const colonIdx = cleanText.indexOf(":");
                    const riskName = colonIdx > 0 && colonIdx < 50 ? stripMarkdown(cleanText.slice(0, colonIdx)) : "";
                    const riskDesc = colonIdx > 0 && colonIdx < 50 ? stripMarkdown(cleanText.slice(colonIdx + 1)) : stripMarkdown(cleanText);
                    const sevColor = riskSeverityColor(severity, c);
                    return (
                      <View key={`risk-${i}`} style={{ ...s.riskItem, borderLeftColor: sevColor }} wrap={false}>
                        <View style={{ ...s.riskBadge, backgroundColor: sevColor }}><Text style={s.riskBadgeText}>{severity.toUpperCase()}</Text></View>
                        {riskName ? <Text style={s.riskTitle}>{riskName}</Text> : null}
                        <Text style={s.riskDescription}>{riskDesc}</Text>
                      </View>
                    );
                  })}
                </>
              );
            })()}

            <View style={s.footer} fixed><Text style={s.footerText} render={() => `Confidential — ${orgName}`} /><Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} /><Text style={s.footerText} render={() => `EXOS-SENTINEL-PIPELINE`} /></View>
          </Page>
        );
      })()}

      {/* Analysis Parameters */}
      {hasParams && (
        <Page size="A4" style={s.pageWithHeader} id="section-parameters">
          <View style={s.headerBar} fixed>
            <View style={{ flexDirection: "row", alignItems: "center" }}><Text style={{ fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: c.textOnPrimary, marginRight: 12 }}>EXOS</Text><Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1 }}>{scenarioLabel}</Text></View>
            <Text style={{ fontSize: 8, color: c.textOnPrimary, opacity: 0.85 }}>Confidential · {formattedDate}</Text>
          </View>
          <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>ANALYSIS PARAMETERS</Text></View>
          <View style={s.sectionTitleWrapper}><Text style={s.sectionTitleText}>Input Parameters</Text><View style={s.sectionTitleLine} /></View>
          {allParamEntries.map(([key, value]) => {
            const label = key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim().toUpperCase();
            return (
              <View key={key} style={s.paramCard} wrap={false}>
                <View style={s.paramLabel}><Text style={s.paramLabelText}>{label}</Text></View>
                <View style={s.paramValue}><Text style={s.paramValueText}>{summarizeParameter(value)}</Text></View>
              </View>
            );
          })}
          <View style={s.methodologyBox} wrap={false}>
            <Text style={s.methodologyTitle}>Methodology & Limitations</Text>
            <Text style={s.methodologyText}>Analysis performed by EXOS Sentinel Pipeline using advanced LLM orchestration with multi-stage validation and grounding. Sources include global industry benchmarks, real-time commodity pricing, and user-provided parameters. This analysis is AI-generated and should be validated by qualified procurement professionals.</Text>
          </View>
          <View style={s.statsTable}>
            <View style={s.statsCell}><Text style={s.statsLabel}>Input Quality</Text><Text style={{ ...s.statsValue, color: showScore ? kpiColor(String(coveragePct), "confidence", c) : c.textMuted }}>{coverageDisplay}</Text></View>
            <View style={s.statsCell}><Text style={s.statsLabel}>Output Rigour</Text><Text style={{ ...s.statsValue, color: outputRigourPct == null ? c.textMuted : kpiColor(String(outputRigourPct), "confidence", c) }}>{outputRigourDisplay}</Text></View>
            <View style={s.statsCell}><Text style={s.statsLabel}>Confidence</Text><Text style={{ ...s.statsValue, color: kpiColor(confidenceLevel, "confidence", c) }}>{confidenceLevel.toUpperCase()}</Text></View>
            <View style={s.statsCell}><Text style={s.statsLabel}>Analysis ID</Text><Text style={s.statsValue}>{reportHash}</Text></View>
            <View style={s.statsCell}><Text style={s.statsLabel}>Timestamp</Text><Text style={s.statsValue}>{new Date(timestamp).toISOString()}</Text></View>
            <View style={{ ...s.statsCell, ...s.statsCellLast }}><Text style={s.statsLabel}>Pipeline</Text><Text style={s.statsValue}>EXOS-SENTINEL</Text></View>
          </View>
          <View style={s.footer} fixed><Text style={s.footerText} render={() => `Confidential — ${orgName}`} /><Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} /><Text style={s.footerText} render={() => `EXOS-SENTINEL-PIPELINE`} /></View>
        </Page>
      )}
    </Document>
  );
};

// ── Public API ──

export async function generatePdfBuffer(payload: GeneratePdfPayload): Promise<Uint8Array> {
  const { scenarioTitle, analysisResult, structuredData, formData, timestamp, selectedDashboards = [], pdfTheme = "light", evaluationScore, evaluationConfidence, coverageStars } = payload;
  const doc = (
    <PDFReportDocument scenarioTitle={scenarioTitle} analysisResult={analysisResult} structuredData={structuredData} formData={formData} timestamp={timestamp} selectedDashboards={selectedDashboards} pdfTheme={pdfTheme} evaluationScore={evaluationScore} evaluationConfidence={evaluationConfidence} coverageStars={coverageStars} />
  );
  const buffer = await renderToBuffer(doc as any);
  return new Uint8Array(buffer);
}
