import { describe, it, expect } from "vitest";
import {
  scenarios,
  getScenarioById,
  getMissingRequiredFields,
  getMissingOptionalFields,
  getCategoryLabel,
} from "./scenarios";

describe("scenarios registry", () => {
  it("contains 29 scenarios", () => {
    expect(scenarios.length).toBe(29);
  });

  it("every scenario has required structural fields", () => {
    for (const s of scenarios) {
      expect(s.id).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.icon).toBeDefined();
      expect(["available", "coming-soon"]).toContain(s.status);
      expect(["analysis", "planning", "risk", "documentation"]).toContain(s.category);
      expect(Array.isArray(s.requiredFields)).toBe(true);
      expect(Array.isArray(s.outputs)).toBe(true);
      expect(s.outputs.length).toBeGreaterThan(0);
    }
  });

  it("all scenario IDs are unique", () => {
    const ids = scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every scenario has at least one required field with required=true", () => {
    for (const s of scenarios) {
      const hasRequired = s.requiredFields.some((f) => f.required);
      expect(hasRequired, `${s.id} has no required fields`).toBe(true);
    }
  });

  it("every required field has a valid type", () => {
    const validTypes = ["text", "number", "percentage", "select", "currency", "textarea"];
    for (const s of scenarios) {
      for (const f of s.requiredFields) {
        expect(validTypes, `${s.id}.${f.id} has invalid type "${f.type}"`).toContain(f.type);
      }
    }
  });

  it("select-type fields have options array", () => {
    for (const s of scenarios) {
      for (const f of s.requiredFields) {
        if (f.type === "select") {
          expect(Array.isArray(f.options), `${s.id}.${f.id} is select without options`).toBe(true);
          expect(f.options!.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("getScenarioById", () => {
  it("returns a scenario for a valid ID", () => {
    const result = getScenarioById("tco-analysis");
    expect(result).toBeDefined();
    expect(result!.title).toBe("Total Cost of Ownership");
  });

  it("returns undefined for an unknown ID", () => {
    expect(getScenarioById("nonexistent")).toBeUndefined();
  });
});

describe("getMissingRequiredFields", () => {
  it("returns all required fields when no data provided", () => {
    const missing = getMissingRequiredFields("tco-analysis", {});
    const scenario = getScenarioById("tco-analysis")!;
    const requiredCount = scenario.requiredFields.filter((f) => f.required).length;
    expect(missing.length).toBe(requiredCount);
  });

  it("returns empty array when all required fields are filled", () => {
    const scenario = getScenarioById("tco-analysis")!;
    const data: Record<string, string> = {};
    for (const f of scenario.requiredFields) {
      if (f.required) data[f.id] = "some value";
    }
    expect(getMissingRequiredFields("tco-analysis", data)).toEqual([]);
  });

  it("treats empty string as missing", () => {
    const scenario = getScenarioById("tco-analysis")!;
    const firstRequired = scenario.requiredFields.find((f) => f.required)!;
    const data: Record<string, string> = {};
    for (const f of scenario.requiredFields) {
      if (f.required) data[f.id] = "filled";
    }
    data[firstRequired.id] = "";
    const missing = getMissingRequiredFields("tco-analysis", data);
    expect(missing.length).toBe(1);
    expect(missing[0].id).toBe(firstRequired.id);
  });

  it("returns empty array for unknown scenario ID", () => {
    expect(getMissingRequiredFields("fake-id", {})).toEqual([]);
  });
});

describe("getMissingOptionalFields", () => {
  it("returns only optional fields that are missing", () => {
    const scenario = getScenarioById("tco-analysis")!;
    const optionalFields = scenario.requiredFields.filter((f) => !f.required);
    const missing = getMissingOptionalFields("tco-analysis", {});
    expect(missing.length).toBe(optionalFields.length);
  });

  it("returns empty array for unknown scenario ID", () => {
    expect(getMissingOptionalFields("fake-id", {})).toEqual([]);
  });
});

describe("getCategoryLabel", () => {
  it("maps all four categories", () => {
    expect(getCategoryLabel("analysis")).toBe("Analysis & Optimization");
    expect(getCategoryLabel("planning")).toBe("Planning & Sourcing");
    expect(getCategoryLabel("risk")).toBe("Risk Management");
    expect(getCategoryLabel("documentation")).toBe("Documentation & Contracts");
  });
});
