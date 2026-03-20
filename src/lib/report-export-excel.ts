/**
 * Excel Export Utility
 *
 * Builds a multi-sheet .xlsx workbook from report data and triggers download.
 * Uses the same `extractDashboardData()` parser as dashboards and PDF.
 */

import * as XLSX from "xlsx";
import { extractDashboardData, DashboardData } from "@/lib/dashboard-data-parser";

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
 * triggers (=, +, -, @) with an apostrophe so Excel won't execute them.
 */
function sanitizeTableCell(value: string): string {
  if (!value) return value;
  const s = String(value);
  if (/^[=+\-@]/.test(s)) return `'${s}`;
  return s;
}

function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === "string" ? sanitizeTableCell(v) : v;
  }
  return out;
}

// ─── dashboard → rows converters ──────────────────────────────────────

function dashboardToSheets(data: DashboardData): { name: string; rows: Record<string, unknown>[] }[] {
  const sheets: { name: string; rows: Record<string, unknown>[] }[] = [];

  if (data.actionChecklist?.actions?.length) {
    sheets.push({
      name: "Action Checklist",
      rows: data.actionChecklist.actions.map((a) => sanitizeRow({
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
          (sum, c, i) => sum + c.weight * (opt.scores[i] ?? 0),
          0
        );
        return sanitizeRow(row);
      }),
    });
  }

  if (data.costWaterfall?.components?.length) {
    sheets.push({
      name: "Cost Waterfall",
      rows: data.costWaterfall.components.map((c) => sanitizeRow({
        Component: c.name,
        Value: c.value,
        Type: c.type,
      })),
    });
  }

  if (data.timelineRoadmap?.phases?.length) {
    sheets.push({
      name: "Timeline Roadmap",
      rows: data.timelineRoadmap.phases.map((p) => sanitizeRow({
        Phase: p.name,
        "Start Week": p.startWeek,
        "End Week": p.endWeek,
        Status: p.status,
        Milestones: p.milestones?.join("; ") ?? "",
      })),
    });
  }

  if (data.kraljicQuadrant?.items?.length) {
    sheets.push({
      name: "Kraljic Matrix",
      rows: data.kraljicQuadrant.items.map((i) => sanitizeRow({
        Name: i.name,
        "Supply Risk": i.supplyRisk,
        "Business Impact": i.businessImpact,
        Spend: i.spend ?? "",
      })),
    });
  }

  if (data.tcoComparison?.data?.length) {
    sheets.push({
      name: "TCO Comparison",
      rows: data.tcoComparison.data.map((d) => sanitizeRow({ ...d })),
    });
  }

  if (data.licenseTier?.tiers?.length) {
    sheets.push({
      name: "License Tiers",
      rows: data.licenseTier.tiers.map((t) => sanitizeRow({
        Tier: t.name,
        Users: t.users,
        "Cost/User": t.costPerUser,
        "Total Cost": t.totalCost,
        Recommended: t.recommended ?? "",
      })),
    });
  }

  if (data.sensitivitySpider?.variables?.length) {
    sheets.push({
      name: "Sensitivity Analysis",
      rows: data.sensitivitySpider.variables.map((v) => sanitizeRow({
        Variable: v.name,
        "Base Case": v.baseCase,
        "Low Case": v.lowCase,
        "High Case": v.highCase,
        Unit: v.unit ?? "",
      })),
    });
  }

  if (data.riskMatrix?.risks?.length) {
    sheets.push({
      name: "Risk Matrix",
      rows: data.riskMatrix.risks.map((r) => sanitizeRow({
        Supplier: r.supplier,
        Impact: r.impact,
        Probability: r.probability,
        Category: r.category,
      })),
    });
  }

  if (data.scenarioComparison?.summary?.length) {
    sheets.push({
      name: "Scenario Comparison",
      rows: data.scenarioComparison.summary.map((s) => sanitizeRow({ ...s })),
    });
  }

  if (data.supplierScorecard?.suppliers?.length) {
    sheets.push({
      name: "Supplier Scorecard",
      rows: data.supplierScorecard.suppliers.map((s) => sanitizeRow({
        Supplier: s.name,
        Score: s.score,
        Trend: s.trend,
        Spend: s.spend,
      })),
    });
  }

  if (data.sowAnalysis?.sections?.length) {
    sheets.push({
      name: "SOW Analysis",
      rows: data.sowAnalysis.sections.map((s) => sanitizeRow({
        Section: s.name,
        Status: s.status,
        Note: s.note,
      })),
    });
  }

  if (data.negotiationPrep?.sequence?.length) {
    sheets.push({
      name: "Negotiation Prep",
      rows: data.negotiationPrep.sequence.map((s) => sanitizeRow({
        Step: s.step,
        Detail: s.detail,
      })),
    });
  }

  if (data.dataQuality?.fields?.length) {
    sheets.push({
      name: "Data Quality",
      rows: data.dataQuality.fields.map((f) => sanitizeRow({
        Field: f.field,
        Status: f.status,
        "Coverage %": f.coverage,
      })),
    });
  }

  return sheets;
}

// ─── main export function ─────────────────────────────────────────────

export function exportReportToExcel(
  scenarioTitle: string,
  analysisResult: string,
  formData: Record<string, string>,
  timestamp: string,
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1 — Summary
  const keyPoints = extractKeyPoints(analysisResult);
  const summaryRows = [
    { Field: "Report Title", Value: sanitizeTableCell(scenarioTitle) },
    { Field: "Generated At", Value: new Date(timestamp).toLocaleString() },
    { Field: "Exported At", Value: new Date().toLocaleString() },
    ...keyPoints.map((kp, i) => ({ Field: `Key Point ${i + 1}`, Value: sanitizeTableCell(kp) })),
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // Sheet 2 — Analysis Inputs
  const inputEntries = Object.entries(formData);
  if (inputEntries.length > 0) {
    const inputRows = inputEntries.map(([key, value]) => ({
      Parameter: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      Value: sanitizeTableCell(value),
    }));
    const inputSheet = XLSX.utils.json_to_sheet(inputRows);
    inputSheet["!cols"] = [{ wch: 30 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, inputSheet, "Analysis Inputs");
  }

  // Sheet 3+ — Dashboard Data
  const parsedData = extractDashboardData(analysisResult);
  if (parsedData) {
    const dashSheets = dashboardToSheets(parsedData);
    dashSheets.forEach(({ name, rows }) => {
      if (rows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(rows);
        // truncate sheet name to 31 chars (Excel limit)
        XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
      }
    });
  }

  // Trigger download
  const dateStr = new Date(timestamp).toISOString().slice(0, 10);
  const fileName = `EXOS_${scenarioTitle.replace(/\s+/g, "_").slice(0, 40)}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
