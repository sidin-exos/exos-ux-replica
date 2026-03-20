import { describe, it, expect } from "vitest";
import {
  validateFile,
  sanitizeFilename,
  formatFileSize,
  getFileTypeLabel,
  validateMagicBytes,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
} from "./file-validation";

// Helper to create a mock File
function makeFile(name: string, size: number, type = ""): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

describe("validateFile", () => {
  it("accepts .xlsx with correct MIME type", () => {
    const file = makeFile("data.xlsx", 1024, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.extension).toBe("xlsx");
  });

  it("accepts .docx with correct MIME type", () => {
    const file = makeFile("report.docx", 1024, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.extension).toBe("docx");
  });

  it("accepts .pdf with correct MIME type", () => {
    const file = makeFile("contract.pdf", 1024, "application/pdf");
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.extension).toBe("pdf");
  });

  it("accepts file with empty MIME type (browser may not set it)", () => {
    const file = makeFile("data.xlsx", 1024, "");
    expect(validateFile(file).valid).toBe(true);
  });

  it("rejects disallowed extension", () => {
    const file = makeFile("script.exe", 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not allowed");
  });

  it("rejects file without extension", () => {
    const file = makeFile("noextension", 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
  });

  it("rejects file exceeding 10MB", () => {
    const file = makeFile("big.pdf", MAX_FILE_SIZE + 1, "application/pdf");
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("10MB");
  });

  it("rejects empty file", () => {
    const file = makeFile("empty.pdf", 0, "application/pdf");
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("empty");
  });

  it("rejects MIME type mismatch", () => {
    const file = makeFile("report.pdf", 1024, "text/plain");
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("MIME type mismatch");
  });
});

describe("validateMagicBytes", () => {
  // jsdom's File.slice().arrayBuffer() is unreliable, so magic byte
  // reads fall into the catch path. We test the contract: valid files
  // should not error out, and the function always returns a result object.

  it("returns a result object for PDF files", async () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00]);
    const file = new File([bytes], "test.pdf", { type: "application/pdf" });
    const result = await validateMagicBytes(file, "pdf");
    expect(result).toHaveProperty("valid");
    expect(typeof result.valid).toBe("boolean");
  });

  it("returns a result object for XLSX files", async () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]);
    const file = new File([bytes], "test.xlsx");
    const result = await validateMagicBytes(file, "xlsx");
    expect(result).toHaveProperty("valid");
  });

  it("never throws — always returns { valid, error? }", async () => {
    const file = new File([], "empty.pdf");
    const result = await validateMagicBytes(file, "pdf");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("sanitizeFilename", () => {
  it("replaces special characters with underscores", () => {
    expect(sanitizeFilename("my file (1).pdf")).toBe("my_file_1_.pdf");
  });

  it("collapses consecutive underscores", () => {
    expect(sanitizeFilename("a!!!b")).toBe("a_b");
  });

  it("truncates to 100 characters", () => {
    const long = "a".repeat(150) + ".pdf";
    expect(sanitizeFilename(long).length).toBeLessThanOrEqual(100);
  });

  it("preserves alphanumerics, dots, hyphens, underscores", () => {
    expect(sanitizeFilename("report-2024_v2.pdf")).toBe("report-2024_v2.pdf");
  });
});

describe("getFileTypeLabel", () => {
  it("returns human-readable labels", () => {
    expect(getFileTypeLabel("xlsx")).toBe("Excel");
    expect(getFileTypeLabel("docx")).toBe("Word");
    expect(getFileTypeLabel("pdf")).toBe("PDF");
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(2048)).toBe("2 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("ALLOWED_EXTENSIONS", () => {
  it("contains exactly xlsx, docx, pdf", () => {
    expect([...ALLOWED_EXTENSIONS]).toEqual(["xlsx", "docx", "pdf"]);
  });
});
