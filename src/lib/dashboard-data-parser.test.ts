import { describe, it, expect } from "vitest";
import { extractDashboardData, stripDashboardData } from "./dashboard-data-parser";

const VALID_DASHBOARD_JSON = JSON.stringify({
  actionChecklist: {
    actions: [
      { action: "Review contract", priority: "high", status: "pending" },
    ],
  },
  costWaterfall: {
    components: [
      { name: "Hardware", value: 50000, type: "cost" },
      { name: "Discount", value: 5000, type: "reduction" },
    ],
  },
});

const WRAPPED = `Here is the analysis...\n\n<dashboard-data>${VALID_DASHBOARD_JSON}</dashboard-data>`;
const WRAPPED_WITH_FENCES = `Analysis complete.\n\n<dashboard-data>\n\`\`\`json\n${VALID_DASHBOARD_JSON}\n\`\`\`\n</dashboard-data>`;

describe("extractDashboardData", () => {
  it("parses valid dashboard-data block", () => {
    const result = extractDashboardData(WRAPPED);
    expect(result).not.toBeNull();
    expect(result!.actionChecklist).toBeDefined();
    expect(result!.actionChecklist!.actions).toHaveLength(1);
    expect(result!.costWaterfall).toBeDefined();
    expect(result!.costWaterfall!.components).toHaveLength(2);
  });

  it("strips markdown code fences inside the block", () => {
    const result = extractDashboardData(WRAPPED_WITH_FENCES);
    expect(result).not.toBeNull();
    expect(result!.actionChecklist!.actions[0].action).toBe("Review contract");
  });

  it("returns null for empty string", () => {
    expect(extractDashboardData("")).toBeNull();
  });

  it("returns null when no dashboard-data block exists", () => {
    expect(extractDashboardData("Just some markdown text")).toBeNull();
  });

  it("returns null for malformed JSON inside block", () => {
    expect(extractDashboardData("<dashboard-data>{broken json</dashboard-data>")).toBeNull();
  });

  it("returns null for array instead of object", () => {
    expect(extractDashboardData("<dashboard-data>[1,2,3]</dashboard-data>")).toBeNull();
  });

  it("returns null for primitive value", () => {
    expect(extractDashboardData('<dashboard-data>"hello"</dashboard-data>')).toBeNull();
  });

  it("returns null for null literal", () => {
    expect(extractDashboardData("<dashboard-data>null</dashboard-data>")).toBeNull();
  });
});

describe("stripDashboardData", () => {
  it("removes the dashboard-data block from text", () => {
    const result = stripDashboardData(WRAPPED);
    expect(result).toBe("Here is the analysis...");
    expect(result).not.toContain("dashboard-data");
  });

  it("returns original text when no block exists", () => {
    const input = "Regular markdown text";
    expect(stripDashboardData(input)).toBe(input);
  });

  it("returns empty text as-is", () => {
    expect(stripDashboardData("")).toBe("");
  });
});
