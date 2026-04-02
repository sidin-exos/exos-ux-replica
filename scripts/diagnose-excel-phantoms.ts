/**
 * Replicates the exact exportReportToExcel flow with PdfTestPage mock data
 * and prints the diagnostic the user requested.
 *
 * Usage: npx tsx scripts/diagnose-excel-phantoms.ts
 */

import ExcelJS from "exceljs";
import * as fs from "fs";

// ─── Inline helpers (same as report-export-excel.ts) ────────────────

const COLORS = {
  deepTeal: "FF1b4b47", brandTeal: "FF28716a", midTeal: "FF3e988f",
  paleTeal: "FFdbf0ee", foreground: "FF1a1a1a", muted: "FF666666",
  border: "FFd5dbd9", white: "FFFFFFFF",
} as const;

const HEADER_FONT: Partial<ExcelJS.Font> = { name: "Inter", family: 2, size: 13, bold: true, color: { argb: COLORS.white } };
const DATA_FONT: Partial<ExcelJS.Font> = { name: "Inter", family: 2, size: 13, color: { argb: COLORS.foreground } };
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.deepTeal } };
const PALE_TEAL_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.paleTeal } };
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.border } },
  left: { style: "thin", color: { argb: COLORS.border } },
  right: { style: "thin", color: { argb: COLORS.border } },
};
const HEADER_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.brandTeal } },
  left: { style: "thin", color: { argb: COLORS.border } },
  right: { style: "thin", color: { argb: COLORS.border } },
};

const NUMERIC_HEADERS = new Set(["Value","Spend","Score","Impact","Probability","Supply Risk","Business Impact","Users","Cost/User","Total Cost","Weighted Total","Start Week","End Week","Base Case","Low Case","High Case","Coverage %"]);
const WRAP_HEADERS = new Set(["Action","Detail","Note","Milestones","Value"]);

const COLUMN_WIDTHS: Record<string, Record<string, number>> = {
  "Cost Waterfall": { Component: 35, Value: 16, Type: 14 },
  "TCO Comparison": {},
};

interface SheetRange { cols: number; rows: number; }

function findCell(row: ExcelJS.Row, col: number): ExcelJS.Cell | null {
  return (row as any).findCell(col) ?? null;
}

function columnToLetter(col: number): string {
  let letter = ""; let n = col;
  while (n > 0) { const mod = (n - 1) % 26; letter = String.fromCharCode(65 + mod) + letter; n = Math.floor((n - 1) / 26); }
  return letter;
}

function writeTable(ws: ExcelJS.Worksheet, headers: string[], dataRows: unknown[][], sheetName?: string): SheetRange {
  ws.addRow(headers);
  for (const row of dataRows) ws.addRow(row);
  const widthMap = sheetName ? COLUMN_WIDTHS[sheetName] ?? {} : {};
  for (let i = 0; i < headers.length; i++) {
    ws.getColumn(i + 1).width = widthMap[headers[i]] ?? (NUMERIC_HEADERS.has(headers[i]) ? 16 : 25);
  }
  return { cols: headers.length, rows: 1 + dataRows.length };
}

function applyHeaderStyle(ws: ExcelJS.Worksheet, range: SheetRange) {
  const headerRow = ws.getRow(1);
  for (let c = 1; c <= range.cols; c++) {
    const cell = findCell(headerRow, c);
    if (!cell) continue;
    cell.font = { ...HEADER_FONT }; cell.fill = { ...HEADER_FILL };
    cell.border = { ...HEADER_BORDER }; cell.alignment = { vertical: "middle", horizontal: "left" };
  }
  headerRow.height = 28;
}

function applyDataStyles(ws: ExcelJS.Worksheet, range: SheetRange) {
  for (let r = 2; r <= range.rows; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= range.cols; c++) {
      const cell = findCell(row, c);
      if (!cell) continue;
      cell.font = { ...DATA_FONT }; cell.border = { ...THIN_BORDER };
      cell.alignment = { vertical: "top", horizontal: "left" };
      if (r % 2 === 0) cell.fill = { ...PALE_TEAL_FILL };
    }
  }
  ws.views = [{ state: "frozen" as const, ySplit: 1, xSplit: 0, topLeftCell: "A2", activeCell: "A2" }];
  if (range.rows > 1 && range.cols > 0) {
    ws.autoFilter = { from: "A1", to: `${columnToLetter(range.cols)}${range.rows}` };
  }
}

function trimSheet(ws: ExcelJS.Worksheet, range: SheetRange) {
  const a = ws as any;
  if (a._rows) {
    for (const row of a._rows) {
      if (row?._cells && row._cells.length > range.cols) row._cells.length = range.cols;
    }
    if (a._rows.length > range.rows) a._rows.length = range.rows;
  }
  if (a._columns && a._columns.length > range.cols) a._columns.length = range.cols;
}

function sanitizeTableCell(value: string): string {
  if (!value) return value;
  if (/^[=+\-@]/.test(value)) return `'${value}`;
  return value;
}

function sanitize(v: unknown): unknown {
  return typeof v === "string" ? sanitizeTableCell(v) : v;
}

// ─── Replicate the EXACT PdfTestPage mock data ─────────────────────

const MOCK_ANALYSIS = `## Analysis

The procurement scenario presents a unique intersection between a rapidly scaling B2B SaaS environment and a specific hardware requirement for an industrial sensor housing.

### Cost Driver Breakdown:

1. **Raw Material (ADC12):** At 850g per unit, the raw material cost is a significant portion of the €42.50 quote.
2. **Manufacturing & Finishing:** The CNC finishing requirement indicates a medium labor intensity.
3. **Margin Analysis:** The current supplier's estimated margin of **18-22%** is healthy.

## Recommendations

1. **Price Negotiation (Target: 7–12% Reduction)** Leverage the €39.80 quote from Supplier_B.
2. **Implement Material Indexing** Propose a "Should-Cost" model with a raw material adjustment clause.
3. **Volume-Based Tiering** Provide the supplier with a 12-18 month volume forecast.
4. **Compliance-Cost Trade-off** Verify if the CNC finishing is strictly necessary.

## Risks

- **Compliance Gap (High Impact):** The hardware vendor may not meet GDPR requirements.
- **Geographic Concentration (Medium Impact):** Reliance on Southern Germany for manufacturing.

---

<dashboard-data>{"costWaterfall":{"components":[{"name":"Raw Materials (ADC12)","value":225000,"type":"cost"},{"name":"Labor & CNC Finishing","value":125000,"type":"cost"},{"name":"Overhead","value":85000,"type":"cost"},{"name":"Logistics","value":30000,"type":"cost"},{"name":"Profit Margin","value":35000,"type":"cost"},{"name":"Negotiated Savings","value":45000,"type":"reduction"}],"currency":"€"},"tcoComparison":{"data":[{"year":"Y0","optionA":200000,"optionB":50000,"optionC":80000},{"year":"Y1","optionA":285000,"optionB":220000,"optionC":240000},{"year":"Y2","optionA":370000,"optionB":370000,"optionC":400000},{"year":"Y3","optionA":420000,"optionB":460000,"optionC":520000},{"year":"Y5","optionA":485000,"optionB":520000,"optionC":595000}],"options":[{"id":"optionA","name":"Buy Outright","color":"#4a8a74","totalTCO":485000},{"id":"optionB","name":"3-Year Lease","color":"#6b9e8a","totalTCO":520000},{"id":"optionC","name":"Subscription","color":"#c9a24d","totalTCO":595000}],"currency":"€"}}</dashboard-data>`;

const MOCK_FORM_DATA: Record<string, string> = {
  "Industry Context": "B2B SaaS company in Series B growth stage.",
  "Product Specification": "Custom aluminium housing for industrial sensor • Material: ADC12",
  "Supplier Quote": "€42.50 per unit, MOQ 500 units",
};

// ─── Key points extraction (same as source) ─────────────────────────

function stripDashboardData(text: string): string {
  return text.replace(/<dashboard-data>[\s\S]*?<\/dashboard-data>/, "").trim();
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

function extractKeyPoints(text: string): string[] {
  if (!text) return [];
  const cleaned = stripDashboardData(text);
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);
  const contentLines = lines.filter(
    (l) => !/^#{1,6}\s/.test(l.trim()) && !/^-{3,}$/.test(l.trim())
  );
  const numbered = contentLines.filter((l) => /^\d+\.\s/.test(l.trim()));
  if (numbered.length > 0) return numbered.slice(0, 10).map(cleanMarkdownLine);
  return contentLines.slice(0, 10).map(cleanMarkdownLine);
}

// ─── Dashboard data extraction (simplified inline) ──────────────────

function extractDashboardData(text: string): any {
  const match = text.match(/<dashboard-data>([\s\S]*?)<\/dashboard-data>/);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1].replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim());
  } catch { return null; }
}

// ─── Main: replicate exportReportToExcel exactly ────────────────────

async function main() {
  const wb = new ExcelJS.Workbook();
  const scenarioTitle = "ADC12 Sensor Housing Procurement";
  const timestamp = new Date().toISOString();

  // ── Sheet 1: Summary ──
  const keyPoints = extractKeyPoints(MOCK_ANALYSIS);
  const summaryWs = wb.addWorksheet("Summary");
  summaryWs.properties.tabColor = { argb: COLORS.deepTeal };
  const summaryData: [string, string][] = [
    ["Report Title", sanitizeTableCell(scenarioTitle)],
    ["Generated At", new Date(timestamp).toLocaleString()],
    ["Exported At", new Date().toLocaleString()],
    ...keyPoints.map((kp, i): [string, string] => [`Key Point ${i + 1}`, sanitizeTableCell(kp)]),
  ];
  const summaryRange = writeTable(summaryWs, ["Field", "Value"], summaryData);
  summaryWs.getColumn(1).width = 20;
  summaryWs.getColumn(2).width = 80;
  applyHeaderStyle(summaryWs, summaryRange);
  applyDataStyles(summaryWs, summaryRange);
  summaryWs.views = [{ state: "frozen" as const, ySplit: 1, xSplit: 0, topLeftCell: "A2", activeCell: "A2" }];
  summaryWs.autoFilter = { from: "A1", to: `B${summaryRange.rows}` };
  trimSheet(summaryWs, summaryRange);

  // ── Sheet 2: Analysis Inputs ──
  const inputEntries = Object.entries(MOCK_FORM_DATA);
  const inputWs = wb.addWorksheet("Analysis Inputs");
  inputWs.properties.tabColor = { argb: COLORS.midTeal };
  const inputData = inputEntries.map(([key, value]): [string, string] => [
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    sanitizeTableCell(value),
  ]);
  const inputRange = writeTable(inputWs, ["Parameter", "Value"], inputData);
  inputWs.getColumn(1).width = 30;
  inputWs.getColumn(2).width = 60;
  applyHeaderStyle(inputWs, inputRange);
  applyDataStyles(inputWs, inputRange);
  trimSheet(inputWs, inputRange);

  // ── Sheet 3+: Dashboard Data ──
  const parsedData = extractDashboardData(MOCK_ANALYSIS);
  if (parsedData) {
    // Cost Waterfall
    if (parsedData.costWaterfall?.components?.length) {
      const ws = wb.addWorksheet("Cost Waterfall");
      ws.properties.tabColor = { argb: COLORS.brandTeal };
      const rows = parsedData.costWaterfall.components;
      const headers = Object.keys(rows[0]);
      const dataRows = rows.map((r: any) => headers.map((h: string) => sanitize(r[h] ?? "")));
      const range = writeTable(ws, headers, dataRows, "Cost Waterfall");
      applyHeaderStyle(ws, range);
      applyDataStyles(ws, range);
      trimSheet(ws, range);
    }

    // TCO Comparison
    if (parsedData.tcoComparison?.data?.length) {
      const ws = wb.addWorksheet("TCO Comparison");
      ws.properties.tabColor = { argb: COLORS.brandTeal };
      const rows = parsedData.tcoComparison.data;
      const headers = Object.keys(rows[0]);
      const dataRows = rows.map((r: any) => headers.map((h: string) => sanitize(r[h] ?? "")));
      const range = writeTable(ws, headers, dataRows, "TCO Comparison");
      applyHeaderStyle(ws, range);
      applyDataStyles(ws, range);
      trimSheet(ws, range);
    }
  }

  // ── USER-REQUESTED DIAGNOSTIC (exact code from their message) ─────
  console.log("=== DIAGNOSTIC: After full build, before writeBuffer ===\n");
  wb.eachSheet((ws) => {
    console.log(`Sheet "${ws.name}": columnCount=${ws.columnCount}, actualColumnCount=${ws.actualColumnCount}, rowCount=${ws.rowCount}`);
    ws.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      console.log(`  Col ${colNumber}: value="${cell.value}", type=${cell.type}`);
    });
  });

  // ── Write to disk so it can be opened in Excel ────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  fs.writeFileSync("/tmp/diagnostic.xlsx", Buffer.from(buffer as ArrayBuffer));
  console.log("\nWritten to /tmp/diagnostic.xlsx");
}

main().catch(console.error);
