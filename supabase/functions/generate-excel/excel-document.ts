/**
 * Server-side Excel workbook generation.
 *
 * Uses ExcelJS via npm: specifier (Node.js entry — no browser bundle bug).
 * Produces a multi-sheet .xlsx workbook with EXOS Brand Book v2.0 styling.
 */

// Use esm.sh CDN — npm:exceljs fails in Deno because excel.js checks process.versions.node
import ExcelJS from "https://esm.sh/exceljs@4.4.0";
import {
  extractDashboardData,
  stripDashboardData,
  type DashboardData,
  type GenerateExcelPayload,
} from "./types.ts";

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

const HEADER_FONT = { name: "Inter", family: 2, size: 13, bold: true, color: { argb: COLORS.white } };
const DATA_FONT = { name: "Inter", family: 2, size: 13, color: { argb: COLORS.foreground } };
const MUTED_FONT = { name: "Inter", family: 2, size: 12, color: { argb: COLORS.muted } };
const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: COLORS.deepTeal } };
const PALE_TEAL_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: COLORS.paleTeal } };
const BRAND_TEAL_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: COLORS.brandTeal } };
const THIN_BORDER = {
  top: { style: "thin" as const, color: { argb: COLORS.border } },
  bottom: { style: "thin" as const, color: { argb: COLORS.border } },
  left: { style: "thin" as const, color: { argb: COLORS.border } },
  right: { style: "thin" as const, color: { argb: COLORS.border } },
};
const HEADER_BORDER = {
  top: { style: "thin" as const, color: { argb: COLORS.border } },
  bottom: { style: "thin" as const, color: { argb: COLORS.brandTeal } },
  left: { style: "thin" as const, color: { argb: COLORS.border } },
  right: { style: "thin" as const, color: { argb: COLORS.border } },
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
  "Start Week", "End Week", "Base Case", "Low Case", "High Case", "Coverage %",
]);

const WRAP_HEADERS = new Set(["Action", "Detail", "Note", "Milestones", "Value"]);

// ─── helpers ──────────────────────────────────────────────────────────

function extractKeyPoints(text: string): string[] {
  if (!text) return [];
  const cleaned = stripDashboardData(text);
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);
  const contentLines = lines.filter(
    (l) => !/^#{1,6}\s/.test(l.trim()) && !/^-{3,}$/.test(l.trim())
  );
  const numbered = contentLines.filter((l) => /^\d+\.\s/.test(l.trim()));
  if (numbered.length > 0) return numbered.slice(0, 10).map(cleanMarkdownLine);
  const keywords = ["recommend", "suggest", "should", "key", "important", "critical", "action", "risk", "cost", "savings"];
  const matched = contentLines.filter((l) => keywords.some((kw) => l.toLowerCase().includes(kw)));
  if (matched.length > 0) return matched.slice(0, 10).map(cleanMarkdownLine);
  return contentLines.slice(0, 10).map(cleanMarkdownLine);
}

function cleanMarkdownLine(line: string): string {
  return line
    .replace(/^\s*\d+\.\s*/, "")
    .replace(/^\s*[-*]\s+/, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/[*]+/g, "")
    .replace(/^[#>]+\s*/, "")
    .trim();
}

function sanitizeTableCell(value: string): string {
  if (!value) return value;
  const s = String(value);
  if (/^[=+\-@]/.test(s)) return `'${s}`;
  return s;
}

function sanitize(v: unknown): unknown {
  return typeof v === "string" ? sanitizeTableCell(v) : v;
}

// ─── sheet helpers ──────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
type Worksheet = any;
// deno-lint-ignore no-explicit-any
type Row = any;
// deno-lint-ignore no-explicit-any
type Cell = any;

interface SheetRange { cols: number; rows: number; }

function columnToLetter(col: number): string {
  let letter = ""; let n = col;
  while (n > 0) { const mod = (n - 1) % 26; letter = String.fromCharCode(65 + mod) + letter; n = Math.floor((n - 1) / 26); }
  return letter;
}

function writeTable(ws: Worksheet, headers: string[], dataRows: unknown[][], sheetName?: string): SheetRange {
  // Server-side: safe to use ws.columns (Node.js ExcelJS works correctly)
  const widthMap = sheetName ? COLUMN_WIDTHS[sheetName] ?? {} : {};
  ws.columns = headers.map((key: string) => ({
    header: key,
    key,
    width: widthMap[key] ?? (NUMERIC_HEADERS.has(key) ? 16 : 25),
  }));
  for (const row of dataRows) {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    ws.addRow(obj);
  }
  return { cols: headers.length, rows: 1 + dataRows.length };
}

function objectsToArrays(rows: Record<string, unknown>[]): { headers: string[]; dataRows: unknown[][] } {
  if (rows.length === 0) return { headers: [], dataRows: [] };
  const headers = Object.keys(rows[0]);
  const dataRows = rows.map((row) => headers.map((h) => sanitize(row[h] ?? "")));
  return { headers, dataRows };
}

// ─── styling ────────────────────────────────────────────────────────

function applyHeaderStyle(ws: Worksheet, range: SheetRange) {
  const headerRow = ws.getRow(1);
  for (let c = 1; c <= range.cols; c++) {
    const cell = headerRow.getCell(c);
    cell.font = { ...HEADER_FONT };
    cell.fill = { ...HEADER_FILL };
    cell.border = { ...HEADER_BORDER };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  }
  headerRow.height = 28;
}

function applyDataStyles(ws: Worksheet, range: SheetRange, sheetName?: string) {
  const { cols, rows } = range;
  const numericCols = new Set<number>();
  const wrapCols = new Set<number>();
  for (let c = 1; c <= cols; c++) {
    const header = String(ws.getRow(1).getCell(c).value ?? "");
    if (NUMERIC_HEADERS.has(header)) numericCols.add(c);
    if (WRAP_HEADERS.has(header) && sheetName !== "Analysis Inputs") wrapCols.add(c);
  }
  for (let r = 2; r <= rows; r++) {
    const row = ws.getRow(r);
    const isEven = r % 2 === 0;
    for (let c = 1; c <= cols; c++) {
      const cell = row.getCell(c);
      cell.font = { ...DATA_FONT };
      cell.border = { ...THIN_BORDER };
      cell.alignment = { vertical: "top", horizontal: numericCols.has(c) ? "right" : "left", wrapText: wrapCols.has(c) };
      if (isEven) cell.fill = { ...PALE_TEAL_FILL };
    }
  }
  ws.views = [{ state: "frozen", ySplit: 1, xSplit: 0, topLeftCell: "A2", activeCell: "A2" }];
  if (rows > 1 && cols > 0) {
    ws.autoFilter = { from: "A1", to: `${columnToLetter(cols)}${rows}` };
  }
}

const STATUS_COLUMNS = new Set(["Priority", "Status", "Impact", "Probability", "Trend", "Category"]);
const RISK_LEVEL_COLUMNS = new Set(["Impact", "Probability", "Priority"]);

function classifyStatus(value: string, headerName: string): "destructive" | "warning" | "success" | null {
  const v = value.toLowerCase().trim();
  const isRiskCol = RISK_LEVEL_COLUMNS.has(headerName);
  if (v === "critical" || v === "exceeded" || v === "failed" || v === "overdue") return "destructive";
  if (isRiskCol && v === "high") return "destructive";
  if (["pending", "in-progress", "in progress", "approaching", "at-risk", "at risk"].includes(v)) return "warning";
  if (isRiskCol && v === "medium") return "warning";
  if (["complete", "completed", "achieved", "on-track", "on track", "certified", "done"].includes(v)) return "success";
  if (isRiskCol && v === "low") return "success";
  return null;
}

const STATUS_STYLES = {
  destructive: { font: COLORS.destructText, bg: COLORS.destructBg },
  warning: { font: COLORS.warningText, bg: COLORS.warningBg },
  success: { font: COLORS.successText, bg: COLORS.successBg },
};

function applyStatusFormatting(ws: Worksheet, range: SheetRange) {
  const statusCols: { col: number; header: string }[] = [];
  for (let c = 1; c <= range.cols; c++) {
    const header = String(ws.getRow(1).getCell(c).value ?? "");
    if (STATUS_COLUMNS.has(header)) statusCols.push({ col: c, header });
  }
  if (statusCols.length === 0) return;
  for (let r = 2; r <= range.rows; r++) {
    const row = ws.getRow(r);
    for (const { col, header } of statusCols) {
      const cell = row.getCell(col);
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

function applySummaryStyles(ws: Worksheet, range: SheetRange) {
  for (let r = 2; r <= range.rows; r++) {
    const row = ws.getRow(r);
    const fieldCell = row.getCell(1);
    const valueCell = row.getCell(2);
    const fieldValue = String(fieldCell.value ?? "");

    if (fieldValue === "Report Title") {
      fieldCell.font = { name: "Inter", family: 2, size: 13, bold: true, color: { argb: COLORS.white } };
      fieldCell.fill = { ...BRAND_TEAL_FILL };
      valueCell.font = { name: "Inter", family: 2, size: 13, bold: true, color: { argb: COLORS.white } };
      valueCell.fill = { ...BRAND_TEAL_FILL };
      fieldCell.border = { ...THIN_BORDER }; valueCell.border = { ...THIN_BORDER };
      fieldCell.alignment = { vertical: "middle" }; valueCell.alignment = { vertical: "middle" };
      continue;
    }
    if (fieldValue === "Generated At" || fieldValue === "Exported At") {
      fieldCell.font = { ...MUTED_FONT }; valueCell.font = { ...MUTED_FONT };
      fieldCell.border = { ...THIN_BORDER }; valueCell.border = { ...THIN_BORDER };
      fieldCell.alignment = { vertical: "top" }; valueCell.alignment = { vertical: "top" };
      if (r % 2 === 0) { fieldCell.fill = { ...PALE_TEAL_FILL }; valueCell.fill = { ...PALE_TEAL_FILL }; }
      continue;
    }
    const isEven = r % 2 === 0;
    fieldCell.font = { ...DATA_FONT, bold: true }; valueCell.font = { ...DATA_FONT };
    fieldCell.border = { ...THIN_BORDER }; valueCell.border = { ...THIN_BORDER };
    fieldCell.alignment = { vertical: "top" }; valueCell.alignment = { vertical: "top", wrapText: true };
    if (isEven) { fieldCell.fill = { ...PALE_TEAL_FILL }; valueCell.fill = { ...PALE_TEAL_FILL }; }
  }
}

// ─── dashboard → rows converters ──────────────────────────────────────

function dashboardToSheets(data: DashboardData): { name: string; rows: Record<string, unknown>[] }[] {
  const sheets: { name: string; rows: Record<string, unknown>[] }[] = [];

  if (data.actionChecklist?.actions?.length) {
    sheets.push({ name: "Action Checklist", rows: data.actionChecklist.actions.map((a) => ({
      Action: a.action, Priority: a.priority, Status: a.status, Owner: a.owner ?? "", "Due Date": a.dueDate ?? "",
    })) });
  }
  if (data.decisionMatrix?.criteria?.length) {
    const criteria = data.decisionMatrix.criteria;
    sheets.push({ name: "Decision Matrix", rows: data.decisionMatrix.options.map((opt) => {
      const row: Record<string, unknown> = { Option: opt.name };
      criteria.forEach((c, i) => { row[`${c.name} (w${c.weight})`] = opt.scores[i] ?? ""; });
      row["Weighted Total"] = criteria.reduce((sum, c, i) => sum + c.weight * (opt.scores[i] ?? 0), 0);
      return row;
    }) });
  }
  if (data.costWaterfall?.components?.length) {
    sheets.push({ name: "Cost Waterfall", rows: data.costWaterfall.components.map((c) => ({
      Component: c.name, Value: c.value, Type: c.type,
    })) });
  }
  if (data.timelineRoadmap?.phases?.length) {
    sheets.push({ name: "Timeline Roadmap", rows: data.timelineRoadmap.phases.map((p) => ({
      Phase: p.name, "Start Week": p.startWeek, "End Week": p.endWeek, Status: p.status, Milestones: p.milestones?.join("; ") ?? "",
    })) });
  }
  if (data.kraljicQuadrant?.items?.length) {
    sheets.push({ name: "Kraljic Matrix", rows: data.kraljicQuadrant.items.map((i) => ({
      Name: i.name, "Supply Risk": i.supplyRisk, "Business Impact": i.businessImpact, Spend: i.spend ?? "",
    })) });
  }
  if (data.tcoComparison?.data?.length) {
    sheets.push({ name: "TCO Comparison", rows: data.tcoComparison.data.map((d) => ({ ...d })) });
  }
  if (data.licenseTier?.tiers?.length) {
    sheets.push({ name: "License Tiers", rows: data.licenseTier.tiers.map((t) => ({
      Tier: t.name, Users: t.users, "Cost/User": t.costPerUser, "Total Cost": t.totalCost, Recommended: t.recommended ?? "",
    })) });
  }
  if (data.sensitivitySpider?.variables?.length) {
    sheets.push({ name: "Sensitivity Analysis", rows: data.sensitivitySpider.variables.map((v) => ({
      Variable: v.name, "Base Case": v.baseCase, "Low Case": v.lowCase, "High Case": v.highCase, Unit: v.unit ?? "",
    })) });
  }
  if (data.riskMatrix?.risks?.length) {
    sheets.push({ name: "Risk Matrix", rows: data.riskMatrix.risks.map((r) => ({
      Supplier: r.supplier, Impact: r.impact, Probability: r.probability, Category: r.category,
    })) });
  }
  if (data.scenarioComparison?.summary?.length) {
    sheets.push({ name: "Scenario Comparison", rows: data.scenarioComparison.summary.map((s) => ({ ...s })) });
  }
  if (data.supplierScorecard?.suppliers?.length) {
    sheets.push({ name: "Supplier Scorecard", rows: data.supplierScorecard.suppliers.map((s) => ({
      Supplier: s.name, Score: s.score, Trend: s.trend, Spend: s.spend,
    })) });
  }
  if (data.sowAnalysis?.sections?.length) {
    sheets.push({ name: "SOW Analysis", rows: data.sowAnalysis.sections.map((s) => ({
      Section: s.name, Status: s.status, Note: s.note,
    })) });
  }
  if (data.negotiationPrep?.sequence?.length) {
    sheets.push({ name: "Negotiation Prep", rows: data.negotiationPrep.sequence.map((s) => ({
      Step: s.step, Detail: s.detail,
    })) });
  }
  if (data.dataQuality?.fields?.length) {
    sheets.push({ name: "Data Quality", rows: data.dataQuality.fields.map((f) => ({
      Field: f.field, Status: f.status, "Coverage %": f.coverage,
    })) });
  }

  return sheets;
}

// ─── main export function ─────────────────────────────────────────────

export async function generateExcelBuffer(payload: GenerateExcelPayload): Promise<Uint8Array> {
  const { scenarioTitle, analysisResult, formData, timestamp } = payload;
  // deno-lint-ignore no-explicit-any
  const wb = new (ExcelJS as any).Workbook();

  // Single consolidated sheet
  const ws = wb.addWorksheet("Report");
  ws.properties.tabColor = { argb: COLORS.deepTeal };

  let currentRow = 1;

  // Helper: write a section title row (branded)
  const writeSectionTitle = (title: string) => {
    const row = ws.getRow(currentRow);
    row.getCell(1).value = title;
    row.getCell(1).font = { name: "Inter", family: 2, size: 14, bold: true, color: { argb: COLORS.white } };
    row.getCell(1).fill = { ...BRAND_TEAL_FILL };
    row.getCell(1).alignment = { vertical: "middle" };
    row.getCell(1).border = { ...THIN_BORDER };
    for (let c = 2; c <= 8; c++) {
      row.getCell(c).fill = { ...BRAND_TEAL_FILL };
      row.getCell(c).border = { ...THIN_BORDER };
    }
    row.height = 30;
    currentRow++;
  };

  // Helper: write a table with headers and data at currentRow
  const writeTableAtRow = (
    headers: string[],
    dataRows: unknown[][],
    sheetName?: string,
  ) => {
    const startRow = currentRow;

    // Header row
    const headerRow = ws.getRow(currentRow);
    headers.forEach((h: string, i: number) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { ...HEADER_FONT };
      cell.fill = { ...HEADER_FILL };
      cell.border = { ...HEADER_BORDER };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });
    headerRow.height = 28;
    currentRow++;

    for (const row of dataRows) {
      const wsRow = ws.getRow(currentRow);
      row.forEach((val: unknown, i: number) => {
        wsRow.getCell(i + 1).value = val;
      });
      currentRow++;
    }

    // Apply data styling
    const numericCols = new Set<number>();
    const wrapColSet = new Set<number>();
    for (let c = 1; c <= headers.length; c++) {
      if (NUMERIC_HEADERS.has(headers[c - 1])) numericCols.add(c);
      if (WRAP_HEADERS.has(headers[c - 1]) && sheetName !== "Analysis Inputs") wrapColSet.add(c);
    }

    for (let r = startRow + 1; r < currentRow; r++) {
      const row = ws.getRow(r);
      const isEven = (r - startRow) % 2 === 0;
      for (let c = 1; c <= headers.length; c++) {
        const cell = row.getCell(c);
        cell.font = { ...DATA_FONT };
        cell.border = { ...THIN_BORDER };
        cell.alignment = { vertical: "top", horizontal: numericCols.has(c) ? "right" : "left", wrapText: wrapColSet.has(c) };
        if (isEven) cell.fill = { ...PALE_TEAL_FILL };
      }
    }

    // Status formatting
    const statusCols: { col: number; header: string }[] = [];
    for (let c = 1; c <= headers.length; c++) {
      if (STATUS_COLUMNS.has(headers[c - 1])) statusCols.push({ col: c, header: headers[c - 1] });
    }
    if (statusCols.length > 0) {
      for (let r = startRow + 1; r < currentRow; r++) {
        const row = ws.getRow(r);
        for (const { col, header } of statusCols) {
          const cell = row.getCell(col);
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
  };

  const addSpacing = (rows = 2) => { currentRow += rows; };

  // Section 1: Summary
  const keyPoints = extractKeyPoints(analysisResult);
  writeSectionTitle("Summary");
  const summaryData: [string, string][] = [
    ["Report Title", sanitizeTableCell(scenarioTitle)],
    ["Generated At", new Date(timestamp).toLocaleString()],
    ["Exported At", new Date().toLocaleString()],
    ...keyPoints.map((kp: string, i: number): [string, string] => [`Key Point ${i + 1}`, sanitizeTableCell(kp)]),
  ];
  writeTableAtRow(["Field", "Value"], summaryData);
  addSpacing(3);

  // Section 2: Analysis Inputs
  const inputEntries = Object.entries(formData);
  if (inputEntries.length > 0) {
    writeSectionTitle("Analysis Inputs");
    const inputData = inputEntries.map(([key, value]): [string, string] => [
      key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      sanitizeTableCell(value),
    ]);
    writeTableAtRow(["Parameter", "Value"], inputData, "Analysis Inputs");
    addSpacing(3);
  }

  // Section 3+: Dashboard Data
  const parsedData = extractDashboardData(analysisResult);
  if (parsedData) {
    for (const { name, rows } of dashboardToSheets(parsedData)) {
      if (rows.length === 0) continue;
      writeSectionTitle(name);
      const { headers, dataRows } = objectsToArrays(rows);
      writeTableAtRow(headers, dataRows, name);
      addSpacing(3);
    }
  }

  // Column widths
  ws.getColumn(1).width = 35;
  ws.getColumn(2).width = 60;
  for (let c = 3; c <= 8; c++) { ws.getColumn(c).width = 20; }

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
