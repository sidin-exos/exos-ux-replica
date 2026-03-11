/**
 * File validation utilities for user file uploads.
 * Defense layer 1 (client-side) — Supabase bucket provides layer 2 (server-side).
 */

export const ALLOWED_EXTENSIONS = ["xlsx", "docx", "pdf"] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const ALLOWED_MIME_TYPES: Record<AllowedExtension, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  extension?: AllowedExtension;
}

export function validateFile(file: File): FileValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (!ext || !ALLOWED_EXTENSIONS.includes(ext as AllowedExtension)) {
    return {
      valid: false,
      error: `File type .${ext || "unknown"} not allowed. Use .xlsx, .docx, or .pdf`,
    };
  }

  const typedExt = ext as AllowedExtension;

  if (file.type && file.type !== ALLOWED_MIME_TYPES[typedExt]) {
    return {
      valid: false,
      error: `File MIME type mismatch for .${ext}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  return { valid: true, extension: typedExt };
}

/**
 * Magic bytes validation — verifies file content matches claimed extension.
 * PDF starts with %PDF (25 50 44 46), XLSX/DOCX start with PK.. (50 4B 03 04).
 * This is defense layer 3 against MIME type spoofing.
 */
const MAGIC_BYTES: Record<AllowedExtension, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46],   // %PDF
  xlsx: [0x50, 0x4b, 0x03, 0x04],  // PK.. (ZIP/Office Open XML)
  docx: [0x50, 0x4b, 0x03, 0x04],  // PK.. (ZIP/Office Open XML)
};

export async function validateMagicBytes(
  file: File,
  ext: AllowedExtension,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const expected = MAGIC_BYTES[ext];

    if (bytes.length < expected.length) {
      return { valid: false, error: "File is too small to be valid" };
    }

    const matches = expected.every((b, i) => bytes[i] === b);
    if (!matches) {
      return {
        valid: false,
        error: `File content does not match .${ext} format`,
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Could not read file contents" };
  }
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 100);
}

export function getFileTypeLabel(ext: AllowedExtension): string {
  switch (ext) {
    case "xlsx": return "Excel";
    case "docx": return "Word";
    case "pdf": return "PDF";
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
