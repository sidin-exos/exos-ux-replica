/**
 * Excel Export Utility
 *
 * Builds a multi-sheet .xlsx workbook from report data and triggers download.
 * Uses the same `extractDashboardData()` parser as dashboards and PDF.
 *
 * DATA-FIRST APPROACH: all data is written with array-based addRow() calls,
 * never ws.columns (which implicitly creates header cells and column
 * definitions that cause phantom empty columns). Column widths are set
 * separately via ws.getColumn(i).width which only sets metadata.
 *
 * Styling follows EXOS Brand Book v2.0.
 */

import ExcelJS from "exceljs";
import { extractDashboardData, stripDashboardData, DashboardData } from "@/lib/dashboard-data-parser";

// ─── EXOS Brand Colours (ARGB) ──────────────────────────────────────

const COLORS = {
  deepTeal:   "FF1b4b47",
  brandTeal:  "FF28716a",
  midTeal:    "FF3e988f",
  paleTeal:   "FFdbf0ee",
  foreground: "FF1a1a1a",
  muted:      "FF666666",
  border:     "FFd5dbd9",
  white:      "FFFFFFFF",
  successText: "FF3d8b63",
  successBg:   "FFE8F5E8",
  warningText: "FFcc8a14",
  warningBg:   "FFFFF4E0",
  destructText: "FFab3232",
  destructBg:  "FFFDE8E8",
} as const;

// ─── Shared style objects ───────────────────────────────────────────

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: "Inter", family: 2, size: 13, bold: true, color: { argb: COLORS.white },
};

const DATA_FONT: Partial<ExcelJS.Font> = {
  name: "Inter", family: 2, size: 13, color: { argb: COLORS.foreground },
};

const MUTED_FONT: Partial<ExcelJS.Font> = {
  name: "Inter", family: 2, size: 12, color: { argb: COLORS.muted },
};

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern", pattern: "solid",
  fgColor: { argb: COLORS.deepTeal },
};

const PALE_TEAL_FILL: ExcelJS.Fill = {
  type: "pattern", pattern: "solid",
  fgColor: { argb: COLORS.paleTeal },
};

const BRAND_TEAL_FILL: ExcelJS.Fill = {
  type: "pattern", pattern: "solid",
  fgColor: { argb: COLORS.brandTeal },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top:    { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.border } },
  left:   { style: "thin", color: { argb: COLORS.border } },
  right:  { style: "thin", color: { argb: COLORS.border } },
};

const HEADER_BORDER: Partial<ExcelJS.Borders> = {
  top:    { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.brandTeal } },
  left:   { style: "thin", color: { argb: COLORS.border } },
  right:  { style: "thin", color: { argb: COLORS.border } },
};

// ─── Column-width presets per sheet ─────────────────────────────────

const COLUMN_WIDTHS: Record<string, Record<string, number>> = {
  "Action Checklist":     { Action: 45, Priority: 14, Status: 14, Owner: 20, "Due Date": 16 },
  "Decision Matrix":      { Option: 30, "Weighted Total": 16 },
  "Cost Waterfall":       { Component: 35, Value: 16, Type: 14 },
  "Timeline Roadmap":     { Phase: 30, "Start Week": 14, "End Week": 14, Status: 14, Milestones: 45 },
  "Kraljic Matrix":       { Name: 30, "Supply Risk": 16, "Business Impact": 18, Spend: 16 },
  "TCO Comparison":       {},
  "License Tiers":        { Tier: 25, Users: 14, "Cost/User": 16, "Total Cost": 16, Recommended: 16 },
  "Sensitivity Analysis": { Variable: 30, "Base Case": 16, "Low Case": 16, "High Case": 16, Unit: 14 },
  "Risk Matrix":          { Supplier: 30, Impact: 14, Probability: 14, Category: 20 },
  "Scenario Comparison":  {},
  "Supplier Scorecard":   { Supplier: 30, Score: 14, Trend: 14, Spend: 16 },
  "SOW Analysis":         { Section: 30, Status: 16, Note: 50 },
  "Negotiation Prep":     { Step: 30, Detail: 55 },
  "Data Quality":         { Field: 30, Status: 16, "Coverage %": 16 },
};

const NUMERIC_HEADERS = new Set([
  "Value", "Spend", "Score", "Impact", "Probability", "Supply Risk",
  "Business Impact", "Users", "Cost/User", "Total Cost", "Weighted Total",
  "Start Week", "End Week", "Base Case", "Low Case", "High Case",
  "Coverage %",
]);

const WRAP_HEADERS = new Set([
  "Action", "Detail", "Note", "Milestones", "Value",
]);

// ─── helpers ──────────────────────────────────────────────────────────

/**
 * Extracts key insight sentences from the AI analysis markdown.
 *
 * The AI response is structured markdown with headings (## Recommendations,
 * ## Risks, etc.) followed by numbered/bulleted content. Previous versions
 * matched headings like "## Recommendations" via keyword "recommend", then
 * stripped the "##" leaving the generic word "Recommendations".
 *
 * This version:
 * 1. Strips the <dashboard-data> JSON block
 * 2. Skips markdown headings (lines starting with #)
 * 3. Extracts numbered list items (1. **Bold title** detail…)
 * 4. Falls back to keyword-matched non-heading lines
 */
function extractKeyPoints(text: string): string[] {
  if (!text) return [];
  const cleaned = stripDashboardData(text);
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);

  // Skip headings and horizontal rules
  const contentLines = lines.filter(
    (l) => !/^#{1,6}\s/.test(l.trim()) && !/^-{3,}$/.test(l.trim())
  );

  // First priority: numbered list items (1. … , 2. …) — these are the
  // actual recommendations/actions the AI produces.
  const numbered = contentLines.filter((l) => /^\d+\.\s/.test(l.trim()));
  if (numbered.length > 0) {
    return numbered.slice(0, 10).map(cleanMarkdownLine);
  }

  // Second priority: bullet list items that contain insight keywords
  const keywords = ["recommend", "suggest", "should", "key", "important", "critical", "action", "risk", "cost", "savings"];
  const matched = contentLines.filter((l) =>
    keywords.some((kw) => l.toLowerCase().includes(kw))
  );
  if (matched.length > 0) {
    return matched.slice(0, 10).map(cleanMarkdownLine);
  }

  // Fallback: first 10 non-heading content lines
  return contentLines.slice(0, 10).map(cleanMarkdownLine);
}

function cleanMarkdownLine(line: string): string {
  return line
    .replace(/^\s*\d+\.\s*/, "")      // strip leading "1. "
    .replace(/^\s*[-*]\s+/, "")        // strip leading "- " or "* " (list markers)
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold** → bold (keep inner text)
    .replace(/\*([^*]+)\*/g, "$1")     // *italic* → italic
    .replace(/[*]+/g, "")             // strip any remaining stray * characters
    .replace(/^[#>]+\s*/, "")          // strip any remaining # or >
    .trim();
}

/**
 * Formula injection prevention — prefix cell values starting with formula
 * triggers (=, +, -, @) with an apostrophe so Excel won't execute them.
 */
function sanitizeTableCell(value: string): string {
  if (!value) return value;
  const s = String(value);
  if (/^[=+\-@]/.test(s)) return `'${s}`;
  return s;
}

function sanitize(v: unknown): unknown {
  return typeof v === "string" ? sanitizeTableCell(v) : v;
}

// ─── safe sheet-writing helpers ─────────────────────────────────────
//
// These NEVER use ws.columns = [...] (which creates implicit header cells
// and column definitions). Instead they use array-based addRow() for exact
// cell control, and set column widths separately via ws.getColumn(i).width.

interface SheetRange {
  cols: number;
  rows: number; // total rows including header
}

/**
 * Write a table (headers + data rows) to a worksheet using arrays.
 * Returns the exact data range written.
 */
function writeTable(
  ws: ExcelJS.Worksheet,
  headers: string[],
  dataRows: unknown[][],
  _sheetName?: string,
): SheetRange {
  // Row 1: headers — addRow with a plain array creates exactly N cells
  ws.addRow(headers);

  // Rows 2+: data
  for (const row of dataRows) {
    ws.addRow(row);
  }

  // NOTE: Column widths intentionally NOT set here.
  // getColumn(i).width was confirmed to create phantom columns in browser.

  return { cols: headers.length, rows: 1 + dataRows.length };
}

/**
 * Convert an array of row-objects into [headers, dataRows] suitable for
 * writeTable(). Determines headers from the first row's keys.
 */
function objectsToArrays(rows: Record<string, unknown>[]): {
  headers: string[];
  dataRows: unknown[][];
} {
  if (rows.length === 0) return { headers: [], dataRows: [] };
  const headers = Object.keys(rows[0]);
  const dataRows = rows.map((row) =>
    headers.map((h) => sanitize(row[h] ?? ""))
  );
  return { headers, dataRows };
}

/**
 * Safety net: truncate any ExcelJS internal arrays that grew beyond the
 * known data range (e.g. due to getColumn auto-expansion).
 */
function trimSheet(ws: ExcelJS.Worksheet, range: SheetRange) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = ws as any;
  if (a._rows) {
    for (const row of a._rows) {
      if (row?._cells && row._cells.length > range.cols) {
        row._cells.length = range.cols;
      }
    }
    if (a._rows.length > range.rows) a._rows.length = range.rows;
  }
  if (a._columns && a._columns.length > range.cols) {
    a._columns.length = range.cols;
  }
}

// ─── styling helpers ────────────────────────────────────────────────
//
// All styling uses findCell() to avoid creating phantom cells.

function columnToLetter(col: number): string {
  let letter = "";
  let n = col;
  while (n > 0) {
    const mod = (n - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function findCell(row: ExcelJS.Row, col: number): ExcelJS.Cell | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (row as any).findCell(col) ?? null;
}

function applyHeaderStyle(ws: ExcelJS.Worksheet, range: SheetRange) {
  const headerRow = ws.getRow(1);
  for (let c = 1; c <= range.cols; c++) {
    const cell = findCell(headerRow, c);
    if (!cell) continue;
    cell.font = { ...HEADER_FONT };
    cell.fill = { ...HEADER_FILL };
    cell.border = { ...HEADER_BORDER };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  }
  headerRow.height = 28;
}

function applyDataStyles(ws: ExcelJS.Worksheet, range: SheetRange, sheetName?: string) {
  const { cols, rows } = range;

  const numericCols = new Set<number>();
  const wrapCols = new Set<number>();
  for (let c = 1; c <= cols; c++) {
    const cell = findCell(ws.getRow(1), c);
    const header = String(cell?.value ?? "");
    if (NUMERIC_HEADERS.has(header)) numericCols.add(c);
    if (WRAP_HEADERS.has(header) && sheetName !== "Analysis Inputs") wrapCols.add(c);
  }

  for (let r = 2; r <= rows; r++) {
    const row = ws.getRow(r);
    const isEven = r % 2 === 0;
    for (let c = 1; c <= cols; c++) {
      const cell = findCell(row, c);
      if (!cell) continue;
      cell.font = { ...DATA_FONT };
      cell.border = { ...THIN_BORDER };
      cell.alignment = {
        vertical: "top",
        horizontal: numericCols.has(c) ? "right" : "left",
        wrapText: wrapCols.has(c),
      };
      if (isEven) {
        cell.fill = { ...PALE_TEAL_FILL };
      }
    }
  }

  ws.views = [{ state: "frozen" as const, ySplit: 1, xSplit: 0, topLeftCell: "A2", activeCell: "A2" }];
  if (rows > 1 && cols > 0) {
    ws.autoFilter = { from: "A1", to: `${columnToLetter(cols)}${rows}` };
  }
}

// ─── status conditional formatting ──────────────────────────────────

const STATUS_COLUMNS = new Set([
  "Priority", "Status", "Impact", "Probability", "Trend", "Category",
]);

const RISK_LEVEL_COLUMNS = new Set([
  "Impact", "Probability", "Priority",
]);

type StatusLevel = "destructive" | "warning" | "success" | null;

function classifyStatus(value: string, headerName: string): StatusLevel {
  const v = value.toLowerCase().trim();
  const isRiskCol = RISK_LEVEL_COLUMNS.has(headerName);
  if (v === "critical" || v === "exceeded" || v === "failed" || v === "overdue") return "destructive";
  if (isRiskCol && v === "high") return "destructive";
  if (v === "pending" || v === "in-progress" || v === "in progress"
    || v === "approaching" || v === "at-risk" || v === "at risk") return "warning";
  if (isRiskCol && v === "medium") return "warning";
  if (v === "complete" || v === "completed" || v === "achieved"
    || v === "on-track" || v === "on track" || v === "certified" || v === "done") return "success";
  if (isRiskCol && v === "low") return "success";
  return null;
}

const STATUS_STYLES: Record<"destructive" | "warning" | "success", { font: string; bg: string }> = {
  destructive: { font: COLORS.destructText, bg: COLORS.destructBg },
  warning:     { font: COLORS.warningText,  bg: COLORS.warningBg },
  success:     { font: COLORS.successText,  bg: COLORS.successBg },
};

function applyStatusFormatting(ws: ExcelJS.Worksheet, range: SheetRange) {
  const { cols, rows } = range;

  const statusCols: { col: number; header: string }[] = [];
  for (let c = 1; c <= cols; c++) {
    const cell = findCell(ws.getRow(1), c);
    const header = String(cell?.value ?? "");
    if (STATUS_COLUMNS.has(header)) statusCols.push({ col: c, header });
  }
  if (statusCols.length === 0) return;

  for (let r = 2; r <= rows; r++) {
    const row = ws.getRow(r);
    for (const { col, header } of statusCols) {
      const cell = findCell(row, col);
      if (!cell) continue;
      const raw = String(cell.value ?? "").trim();
      if (!raw) continue;
      const level = classifyStatus(raw, header);
      if (!level) continue;
      const style = STATUS_STYLES[level];
      cell.font = { name: "Inter", family: 2, size: 13, bold: true, color: { argb: style.font } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: style.bg } };
    }
  }
}

// ─── Summary sheet special styling ──────────────────────────────────

function applySummaryStyles(ws: ExcelJS.Worksheet, range: SheetRange) {
  for (let r = 2; r <= range.rows; r++) {
    const row = ws.getRow(r);
    const fieldCell = findCell(row, 1);
    const valueCell = findCell(row, 2);
    if (!fieldCell || !valueCell) continue;
    const fieldValue = String(fieldCell.value ?? "");

    if (fieldValue === "Report Title") {
      fieldCell.font = { name: "Inter", family: 2, size: 13, bold: true, color: { argb: COLORS.white } };
      fieldCell.fill = { ...BRAND_TEAL_FILL };
      valueCell.font = { name: "Inter", family: 2, size: 13, bold: true, color: { argb: COLORS.white } };
      valueCell.fill = { ...BRAND_TEAL_FILL };
      fieldCell.border = { ...THIN_BORDER };
      valueCell.border = { ...THIN_BORDER };
      fieldCell.alignment = { vertical: "middle" };
      valueCell.alignment = { vertical: "middle" };
      continue;
    }

    if (fieldValue === "Generated At" || fieldValue === "Exported At") {
      fieldCell.font = { ...MUTED_FONT };
      valueCell.font = { ...MUTED_FONT };
      fieldCell.border = { ...THIN_BORDER };
      valueCell.border = { ...THIN_BORDER };
      fieldCell.alignment = { vertical: "top" };
      valueCell.alignment = { vertical: "top" };
      if (r % 2 === 0) {
        fieldCell.fill = { ...PALE_TEAL_FILL };
        valueCell.fill = { ...PALE_TEAL_FILL };
      }
      continue;
    }

    const isEven = r % 2 === 0;
    fieldCell.font = { ...DATA_FONT, bold: true };
    valueCell.font = { ...DATA_FONT };
    fieldCell.border = { ...THIN_BORDER };
    valueCell.border = { ...THIN_BORDER };
    fieldCell.alignment = { vertical: "top" };
    valueCell.alignment = { vertical: "top", wrapText: true };
    if (isEven) {
      fieldCell.fill = { ...PALE_TEAL_FILL };
      valueCell.fill = { ...PALE_TEAL_FILL };
    }
  }
}

// ─── download helper ────────────────────────────────────────────────

function downloadBuffer(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── dashboard → rows converters ──────────────────────────────────────

function dashboardToSheets(data: DashboardData): { name: string; rows: Record<string, unknown>[] }[] {
  const sheets: { name: string; rows: Record<string, unknown>[] }[] = [];

  if (data.actionChecklist?.actions?.length) {
    sheets.push({
      name: "Action Checklist",
      rows: data.actionChecklist.actions.map((a) => ({
        Action: a.action,
        Priority: a.priority,
        Status: a.status,
        Owner: a.owner ?? "",
        "Due Date": a.dueDate ?? "",
      })),
    });
  }

  if (data.decisionMatrix?.criteria?.length) {
    const criteria = data.decisionMatrix.criteria;
    sheets.push({
      name: "Decision Matrix",
      rows: data.decisionMatrix.options.map((opt) => {
        const row: Record<string, unknown> = { Option: opt.name };
        criteria.forEach((c, i) => {
          row[`${c.name} (w${c.weight})`] = opt.scores[i] ?? "";
        });
        row["Weighted Total"] = criteria.reduce(
          (sum, c, i) => sum + c.weight * (opt.scores[i] ?? 0), 0
        );
        return row;
      }),
    });
  }

  if (data.costWaterfall?.components?.length) {
    sheets.push({
      name: "Cost Waterfall",
      rows: data.costWaterfall.components.map((c) => ({
        Component: c.name, Value: c.value, Type: c.type,
      })),
    });
  }

  if (data.timelineRoadmap?.phases?.length) {
    sheets.push({
      name: "Timeline Roadmap",
      rows: data.timelineRoadmap.phases.map((p) => ({
        Phase: p.name, "Start Week": p.startWeek, "End Week": p.endWeek,
        Status: p.status, Milestones: p.milestones?.join("; ") ?? "",
      })),
    });
  }

  if (data.kraljicQuadrant?.items?.length) {
    sheets.push({
      name: "Kraljic Matrix",
      rows: data.kraljicQuadrant.items.map((i) => ({
        Name: i.name, "Supply Risk": i.supplyRisk,
        "Business Impact": i.businessImpact, Spend: i.spend ?? "",
      })),
    });
  }

  if (data.tcoComparison?.data?.length) {
    sheets.push({
      name: "TCO Comparison",
      rows: data.tcoComparison.data.map((d) => ({ ...d })),
    });
  }

  if (data.licenseTier?.tiers?.length) {
    sheets.push({
      name: "License Tiers",
      rows: data.licenseTier.tiers.map((t) => ({
        Tier: t.name, Users: t.users, "Cost/User": t.costPerUser,
        "Total Cost": t.totalCost, Recommended: t.recommended ?? "",
      })),
    });
  }

  if (data.sensitivitySpider?.variables?.length) {
    sheets.push({
      name: "Sensitivity Analysis",
      rows: data.sensitivitySpider.variables.map((v) => ({
        Variable: v.name, "Base Case": v.baseCase, "Low Case": v.lowCase,
        "High Case": v.highCase, Unit: v.unit ?? "",
      })),
    });
  }

  if (data.riskMatrix?.risks?.length) {
    sheets.push({
      name: "Risk Matrix",
      rows: data.riskMatrix.risks.map((r) => ({
        Supplier: r.supplier, Impact: r.impact,
        Probability: r.probability, Category: r.category,
      })),
    });
  }

  if (data.scenarioComparison?.summary?.length) {
    sheets.push({
      name: "Scenario Comparison",
      rows: data.scenarioComparison.summary.map((s) => ({ ...s })),
    });
  }

  if (data.supplierScorecard?.suppliers?.length) {
    sheets.push({
      name: "Supplier Scorecard",
      rows: data.supplierScorecard.suppliers.map((s) => ({
        Supplier: s.name, Score: s.score, Trend: s.trend, Spend: s.spend,
      })),
    });
  }

  if (data.sowAnalysis?.sections?.length) {
    sheets.push({
      name: "SOW Analysis",
      rows: data.sowAnalysis.sections.map((s) => ({
        Section: s.name, Status: s.status, Note: s.note,
      })),
    });
  }

  if (data.negotiationPrep?.sequence?.length) {
    sheets.push({
      name: "Negotiation Prep",
      rows: data.negotiationPrep.sequence.map((s) => ({
        Step: s.step, Detail: s.detail,
      })),
    });
  }

  if (data.dataQuality?.fields?.length) {
    sheets.push({
      name: "Data Quality",
      rows: data.dataQuality.fields.map((f) => ({
        Field: f.field, Status: f.status, "Coverage %": f.coverage,
      })),
    });
  }

  return sheets;
}

// ─── main export function ─────────────────────────────────────────────

export async function exportReportToExcel(
  scenarioTitle: string,
  analysisResult: string,
  formData: Record<string, string>,
  timestamp: string,
) {
  const wb = new ExcelJS.Workbook();

  // ── Sheet 1: Summary ──────────────────────────────────────────────
  const keyPoints = extractKeyPoints(analysisResult);
  const summaryWs = wb.addWorksheet("Summary");
  summaryWs.properties.tabColor = { argb: COLORS.deepTeal };

  const summaryData: [string, string][] = [
    ["Report Title", sanitizeTableCell(scenarioTitle)],
    ["Generated At", new Date(timestamp).toLocaleString()],
    ["Exported At", new Date().toLocaleString()],
    ...keyPoints.map((kp, i): [string, string] => [`Key Point ${i + 1}`, sanitizeTableCell(kp)]),
  ];
  const summaryRange = writeTable(summaryWs, ["Field", "Value"], summaryData, undefined);
  summaryWs.getColumn(1).width = 20;
  summaryWs.getColumn(2).width = 80;

  applyHeaderStyle(summaryWs, summaryRange);
  applySummaryStyles(summaryWs, summaryRange);
  summaryWs.views = [{ state: "frozen" as const, ySplit: 1, xSplit: 0, topLeftCell: "A2", activeCell: "A2" }];
  summaryWs.autoFilter = { from: "A1", to: `B${summaryRange.rows}` };

  // ── Sheet 2: Analysis Inputs ──────────────────────────────────────
  const inputEntries = Object.entries(formData);
  if (inputEntries.length > 0) {
    const inputWs = wb.addWorksheet("Analysis Inputs");
    inputWs.properties.tabColor = { argb: COLORS.midTeal };

    const inputData = inputEntries.map(([key, value]): [string, string] => [
      key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      sanitizeTableCell(value),
    ]);
    const inputRange = writeTable(inputWs, ["Parameter", "Value"], inputData, undefined);
    inputWs.getColumn(1).width = 30;
    inputWs.getColumn(2).width = 60;

    applyHeaderStyle(inputWs, inputRange);
    applyDataStyles(inputWs, inputRange, "Analysis Inputs");
  }

  // ── Sheet 3+: Dashboard Data ──────────────────────────────────────
  const parsedData = extractDashboardData(analysisResult);
  if (parsedData) {
    const dashSheets = dashboardToSheets(parsedData);
    for (const { name, rows } of dashSheets) {
      if (rows.length === 0) continue;
      const ws = wb.addWorksheet(name.slice(0, 31));
      ws.properties.tabColor = { argb: COLORS.brandTeal };

      const { headers, dataRows } = objectsToArrays(rows);
      const range = writeTable(ws, headers, dataRows, name);

      applyHeaderStyle(ws, range);
      applyDataStyles(ws, range, name);
      applyStatusFormatting(ws, range);
    }
  }

  // ── Trigger download ────────────────────────────────────────────────
  const dateStr = new Date(timestamp).toISOString().slice(0, 10);
  const fileName = `EXOS_${scenarioTitle.replace(/\s+/g, "_").slice(0, 40)}_${dateStr}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  downloadBuffer(buffer as ArrayBuffer, fileName);
}

