/**
 * Word Export Utility
 *
 * Builds a multi-section .docx document from report data and triggers download.
 * Uses the same `extractDashboardData()` parser as dashboards, PDF, and Excel.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
} from "docx";
import { extractDashboardData, type DashboardData } from "@/lib/dashboard-data-parser";

// ─── helpers ──────────────────────────────────────────────────────────

function extractKeyPoints(text: string): string[] {
  if (!text) return [];
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const keywords = ["recommend", "suggest", "should", "key", "important", "critical", "action"];
  const matched = lines.filter((l) =>
    keywords.some((kw) => l.toLowerCase().includes(kw))
  );
  return (matched.length > 0 ? matched : lines).slice(0, 10).map((l) =>
    l.replace(/^[#\-*>\d.]+\s*/, "").replace(/\*\*/g, "").trim()
  );
}

/**
 * Formula injection prevention — prefix cell values starting with formula
 * triggers (=, +, -, @) with an apostrophe so Word/Excel won't execute them.
 */
function sanitizeTableCell(value: string): string {
  if (!value) return value;
  const s = String(value);
  if (/^[=+\-@]/.test(s)) return `'${s}`;
  return s;
}

// ─── table builder ───────────────────────────────────────────────────

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "CCCCCC",
};

const CELL_BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE,
};

function buildTable(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(
          (h) =>
            new TableCell({
              borders: CELL_BORDERS,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: h, bold: true, size: 20 })],
                }),
              ],
            })
        ),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  borders: CELL_BORDERS,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: sanitizeTableCell(String(cell ?? "")), size: 20 })],
                    }),
                  ],
                })
            ),
          })
      ),
    ],
  });
}

// ─── dashboard → sections ────────────────────────────────────────────

function dashboardToSections(data: DashboardData): Paragraph[] {
  const sections: Paragraph[] = [];

  const addSection = (title: string, headers: string[], rows: string[][]) => {
    if (rows.length === 0) return;
    sections.push(
      new Paragraph({ text: title, heading: HeadingLevel.HEADING_2, spacing: { before: 300 } })
    );
    sections.push(buildTable(headers, rows) as unknown as Paragraph);
  };

  if (data.actionChecklist?.actions?.length) {
    addSection(
      "Action Checklist",
      ["Action", "Priority", "Status", "Owner", "Due Date"],
      data.actionChecklist.actions.map((a) => [
        a.action, a.priority, a.status, a.owner ?? "", a.dueDate ?? "",
      ])
    );
  }

  if (data.decisionMatrix?.criteria?.length) {
    const criteria = data.decisionMatrix.criteria;
    addSection(
      "Decision Matrix",
      ["Option", ...criteria.map((c) => `${c.name} (w${c.weight})`), "Weighted Total"],
      data.decisionMatrix.options.map((opt) => [
        opt.name,
        ...criteria.map((_, i) => String(opt.scores[i] ?? "")),
        String(criteria.reduce((sum, c, i) => sum + c.weight * (opt.scores[i] ?? 0), 0)),
      ])
    );
  }

  if (data.costWaterfall?.components?.length) {
    addSection(
      "Cost Waterfall",
      ["Component", "Value", "Type"],
      data.costWaterfall.components.map((c) => [c.name, String(c.value), c.type])
    );
  }

  if (data.timelineRoadmap?.phases?.length) {
    addSection(
      "Timeline Roadmap",
      ["Phase", "Start Week", "End Week", "Status", "Milestones"],
      data.timelineRoadmap.phases.map((p) => [
        p.name, String(p.startWeek), String(p.endWeek), p.status, p.milestones?.join("; ") ?? "",
      ])
    );
  }

  if (data.kraljicQuadrant?.items?.length) {
    addSection(
      "Kraljic Matrix",
      ["Name", "Supply Risk", "Business Impact", "Spend"],
      data.kraljicQuadrant.items.map((i) => [
        i.name, String(i.supplyRisk), String(i.businessImpact), i.spend ?? "",
      ])
    );
  }

  if (data.tcoComparison?.data?.length) {
    const keys = Object.keys(data.tcoComparison.data[0]);
    addSection(
      "TCO Comparison",
      keys,
      data.tcoComparison.data.map((d) => keys.map((k) => String((d as Record<string, unknown>)[k] ?? "")))
    );
  }

  if (data.licenseTier?.tiers?.length) {
    addSection(
      "License Tiers",
      ["Tier", "Users", "Cost/User", "Total Cost", "Recommended"],
      data.licenseTier.tiers.map((t) => [
        t.name, String(t.users), String(t.costPerUser), String(t.totalCost), String(t.recommended ?? ""),
      ])
    );
  }

  if (data.sensitivitySpider?.variables?.length) {
    addSection(
      "Sensitivity Analysis",
      ["Variable", "Base Case", "Low Case", "High Case", "Unit"],
      data.sensitivitySpider.variables.map((v) => [
        v.name, String(v.baseCase), String(v.lowCase), String(v.highCase), v.unit ?? "",
      ])
    );
  }

  if (data.riskMatrix?.risks?.length) {
    addSection(
      "Risk Matrix",
      ["Supplier", "Impact", "Probability", "Category"],
      data.riskMatrix.risks.map((r) => [
        r.supplier, String(r.impact), String(r.probability), r.category,
      ])
    );
  }

  if (data.scenarioComparison?.summary?.length) {
    const keys = Object.keys(data.scenarioComparison.summary[0]);
    addSection(
      "Scenario Comparison",
      keys,
      data.scenarioComparison.summary.map((s) => keys.map((k) => String((s as Record<string, unknown>)[k] ?? "")))
    );
  }

  if (data.supplierScorecard?.suppliers?.length) {
    addSection(
      "Supplier Scorecard",
      ["Supplier", "Score", "Trend", "Spend"],
      data.supplierScorecard.suppliers.map((s) => [
        s.name, String(s.score), s.trend, String(s.spend),
      ])
    );
  }

  if (data.sowAnalysis?.sections?.length) {
    addSection(
      "SOW Analysis",
      ["Section", "Status", "Note"],
      data.sowAnalysis.sections.map((s) => [s.name, s.status, s.note])
    );
  }

  if (data.negotiationPrep?.sequence?.length) {
    addSection(
      "Negotiation Prep",
      ["Step", "Detail"],
      data.negotiationPrep.sequence.map((s) => [String(s.step), s.detail])
    );
  }

  if (data.dataQuality?.fields?.length) {
    addSection(
      "Data Quality",
      ["Field", "Status", "Coverage %"],
      data.dataQuality.fields.map((f) => [f.field, f.status, String(f.coverage)])
    );
  }

  return sections;
}

// ─── main export function ─────────────────────────────────────────────

export async function exportReportToWord(
  scenarioTitle: string,
  analysisResult: string,
  formData: Record<string, string>,
  timestamp: string,
) {
  const dateStr = new Date(timestamp).toISOString().slice(0, 10);
  const keyPoints = extractKeyPoints(analysisResult);

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      text: scenarioTitle,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Generated: ${new Date(timestamp).toLocaleString()}`, italics: true, color: "666666", size: 20 }),
      ],
      spacing: { after: 200 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Exported: ${new Date().toLocaleString()}`, italics: true, color: "666666", size: 20 }),
      ],
      spacing: { after: 400 },
    })
  );

  // Key Points
  if (keyPoints.length > 0) {
    children.push(
      new Paragraph({ text: "Key Points", heading: HeadingLevel.HEADING_1, spacing: { before: 200 } })
    );
    keyPoints.forEach((kp) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: kp, size: 22 })],
          bullet: { level: 0 },
        })
      );
    });
  }

  // Analysis Inputs
  const inputEntries = Object.entries(formData);
  if (inputEntries.length > 0) {
    children.push(
      new Paragraph({ text: "Analysis Inputs", heading: HeadingLevel.HEADING_1, spacing: { before: 300 } })
    );
    children.push(
      buildTable(
        ["Parameter", "Value"],
        inputEntries.map(([key, value]) => [
          key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          value,
        ])
      ) as unknown as Paragraph
    );
  }

  // Dashboard Data
  const parsedData = extractDashboardData(analysisResult);
  if (parsedData) {
    children.push(
      new Paragraph({ text: "Dashboard Data", heading: HeadingLevel.HEADING_1, spacing: { before: 300 } })
    );
    children.push(...dashboardToSections(parsedData));
  }

  // Build document
  const doc = new Document({
    sections: [{ children }],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `EXOS_${scenarioTitle.replace(/\s+/g, "_").slice(0, 40)}_${dateStr}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
