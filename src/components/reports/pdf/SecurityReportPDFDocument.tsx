/**
 * SecurityReportPDFDocument
 *
 * Renders the EXOS Security Assessment Report as a downloadable PDF
 * using @react-pdf/renderer. Matches the EXOS design system.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import exosLogoDark from "@/assets/logo-concept-layers.png";
import exosLogoLight from "@/assets/logo-concept-layers-light.png";
import type { PdfThemeMode } from "./dashboardVisuals/theme";

// ── Security report data types ──

interface SecurityIssue {
  id: string;
  severity: string;
  issue: string;
  justification: string;
}

interface SecuritySection {
  number: number;
  title: string;
  score: number;
  maxScore: number;
  positiveFindings: { control: string; implementation: string; status: string }[];
  issues: SecurityIssue[];
  deductionJustification: string[];
}

interface RemediationItem {
  id: string;
  issue: string;
  remediation: string;
}

interface SecurityReportData {
  systemVersion: string;
  assessmentDate: string;
  classification: string;
  overallScore: number;
  riskRating: string;
  executiveSummary: string;
  sections: SecuritySection[];
  priority1: RemediationItem[];
  priority2: RemediationItem[];
  priority3: RemediationItem[];
  filesReviewed: string[];
  methodology: string;
}

// ── Color palettes ──

const darkColors = {
  primary: "#6b9e8a",
  primaryDark: "#5a8a76",
  background: "#1e1e2e",
  surface: "#262637",
  surfaceLight: "#2f2f42",
  text: "#d4d4dc",
  textMuted: "#8b8b9e",
  accent: "#6b9e8a",
  success: "#6bbf8a",
  warning: "#c9a24d",
  destructive: "#c06060",
  border: "#3a3a4e",
  footerBrand: "rgba(212, 212, 220, 0.35)",
  gradientLayer1: "#232338",
  gradientLayer2: "rgba(107, 158, 138, 0.06)",
  gradientLayer3: "#1a1a2a",
  high: "#c06060",
  medium: "#c9a24d",
  low: "#6bbf8a",
};

const lightColors = {
  primary: "#4a8a74",
  primaryDark: "#3d7563",
  background: "#f8f7f4",
  surface: "#ffffff",
  surfaceLight: "#f0efe8",
  text: "#1e1e2e",
  textMuted: "#6b6b7e",
  accent: "#4a8a74",
  success: "#3a9960",
  warning: "#b08930",
  destructive: "#c04040",
  border: "#d8d8e0",
  footerBrand: "rgba(30, 30, 46, 0.25)",
  gradientLayer1: "#f5f4f0",
  gradientLayer2: "rgba(74, 138, 116, 0.04)",
  gradientLayer3: "#efeeea",
  high: "#c04040",
  medium: "#b08930",
  low: "#3a9960",
};

type DocColors = typeof darkColors;

function getDocColors(mode?: PdfThemeMode): DocColors {
  return mode === "light" ? lightColors : darkColors;
}

function getDocLogo(mode?: PdfThemeMode) {
  return mode === "light" ? exosLogoLight : exosLogoDark;
}

// ── Styles ──

function buildStyles(c: DocColors) {
  return StyleSheet.create({
    page: {
      backgroundColor: c.background,
      padding: 40,
      fontFamily: "Helvetica",
      color: c.text,
    },
    pageWithHeader: {
      backgroundColor: c.background,
      paddingTop: 50,
      paddingLeft: 40,
      paddingRight: 40,
      paddingBottom: 60,
      fontFamily: "Helvetica",
      color: c.text,
    },
    accentBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: c.primary,
    },
    gradientLayer1: { position: "absolute", top: 0, left: 0, right: 0, bottom: "50%", backgroundColor: c.gradientLayer1 },
    gradientLayer2: { position: "absolute", top: "30%", left: 0, right: 0, bottom: "30%", backgroundColor: c.gradientLayer2 },
    gradientLayer3: { position: "absolute", top: "50%", left: 0, right: 0, bottom: 0, backgroundColor: c.gradientLayer3 },
    runningHeader: {
      position: "absolute",
      top: 0,
      left: 40,
      right: 40,
      paddingTop: 10,
      paddingBottom: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    runningHeaderText: { fontSize: 8, color: c.textMuted, fontFamily: "Helvetica" },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 30,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingBottom: 20,
    },
    logoSection: { flexDirection: "row", alignItems: "center" },
    logoImage: { width: 40, height: 40, marginRight: 12 },
    brandName: { fontSize: 23, fontFamily: "Helvetica-Bold", fontWeight: 700, color: c.text, letterSpacing: 1 },
    brandTagline: { fontSize: 9, color: c.textMuted, marginTop: 2 },
    reportMeta: { textAlign: "right" },
    reportBadge: { backgroundColor: c.surfaceLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 4 },
    reportBadgeText: { fontSize: 8, color: c.primary, fontWeight: 600 },
    reportDate: { fontSize: 9, color: c.textMuted },
    titleSection: { marginBottom: 24 },
    reportTitle: { fontSize: 26, fontFamily: "Helvetica-Bold", fontWeight: 700, color: c.primary, marginBottom: 6, letterSpacing: 0.5 },
    reportSubtitle: { fontSize: 11, color: c.textMuted },
    section: { marginBottom: 18 },
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    sectionDot: { width: 8, height: 8, backgroundColor: c.primary, borderRadius: 2, marginRight: 8 },
    sectionTitle: { fontSize: 15, fontFamily: "Helvetica-Bold", fontWeight: 600, color: c.text, letterSpacing: 0.5 },
    sectionContent: { backgroundColor: c.surface, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: c.border },
    // Score summary table
    scoreRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: c.border, paddingVertical: 5 },
    scoreRowHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 5, backgroundColor: c.surfaceLight, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    scoreCell: { flex: 3, fontSize: 10, color: c.text, paddingHorizontal: 6 },
    scoreCellNum: { flex: 1, fontSize: 10, color: c.text, textAlign: "center", fontFamily: "Courier" },
    scoreCellHeader: { flex: 3, fontSize: 9, color: c.textMuted, fontFamily: "Helvetica-Bold", paddingHorizontal: 6 },
    scoreCellNumHeader: { flex: 1, fontSize: 9, color: c.textMuted, fontFamily: "Helvetica-Bold", textAlign: "center" },
    // Overall score badge
    overallScoreBox: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    overallScoreLabel: { fontSize: 13, fontFamily: "Helvetica-Bold", color: c.text },
    overallScoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    overallScoreValue: { fontSize: 18, fontFamily: "Courier-Bold", fontWeight: 700 },
    // Score bar
    scoreBarTrack: { height: 8, backgroundColor: c.surfaceLight, borderRadius: 4, marginTop: 8, overflow: "hidden" },
    scoreBarFill: { height: 8, borderRadius: 4 },
    // Issue table
    issueRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: c.border, paddingVertical: 5 },
    issueId: { width: 60, fontSize: 9, fontFamily: "Courier", color: c.textMuted, paddingHorizontal: 4 },
    issueSeverity: { width: 55, fontSize: 9, fontFamily: "Helvetica-Bold", paddingHorizontal: 4 },
    issueText: { flex: 1, fontSize: 9, color: c.text, paddingHorizontal: 4 },
    // Positive findings table
    findingRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: c.border, paddingVertical: 4 },
    findingControl: { flex: 2, fontSize: 9, color: c.text, paddingHorizontal: 4 },
    findingImpl: { flex: 3, fontSize: 9, color: c.textMuted, paddingHorizontal: 4 },
    findingStatus: { width: 70, fontSize: 9, color: c.success, fontFamily: "Helvetica-Bold", paddingHorizontal: 4, textAlign: "center" },
    // Remediation table
    remRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: c.border, paddingVertical: 5 },
    remId: { width: 50, fontSize: 9, fontFamily: "Courier", color: c.textMuted, paddingHorizontal: 4 },
    remIssue: { flex: 2, fontSize: 9, color: c.text, paddingHorizontal: 4 },
    remAction: { flex: 3, fontSize: 9, color: c.text, paddingHorizontal: 4 },
    // Deduction
    deductionText: { fontSize: 9, color: c.textMuted, marginTop: 4, lineHeight: 1.4 },
    // Footer
    footer: {
      position: "absolute",
      bottom: 20,
      left: 40,
      right: 40,
      flexDirection: "column",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 10,
    },
    footerBrand: { fontSize: 9, fontFamily: "Helvetica", color: c.footerBrand, marginBottom: 4 },
    footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
    footerText: { fontSize: 8, color: c.textMuted },
    pageNumber: { fontSize: 8, color: c.textMuted },
    // Methodology
    methodBox: { borderWidth: 1, borderColor: c.border, borderRadius: 6, padding: 10, marginBottom: 10 },
    methodLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: c.text, marginBottom: 4 },
    methodText: { fontSize: 9, color: c.textMuted, lineHeight: 1.5 },
    // Files list
    fileText: { fontSize: 8, fontFamily: "Courier", color: c.textMuted, marginBottom: 1 },
  });
}

const darkStyles = buildStyles(darkColors);
const lightDocStyles = buildStyles(lightColors);
function getStyles(mode?: PdfThemeMode) { return mode === "light" ? lightDocStyles : darkStyles; }

// ── Reusable components ──

const RunningHeader = ({ dateStr, s }: { dateStr: string; s: ReturnType<typeof buildStyles> }) => (
  <View style={s.runningHeader} fixed>
    <Text style={s.runningHeaderText}>EXOS | Security Assessment Report</Text>
    <Text style={s.runningHeaderText}>{dateStr}</Text>
  </View>
);

const ReportFooter = ({ s }: { s: ReturnType<typeof buildStyles> }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerBrand}>Powered by EXOS Procurement Intelligence</Text>
    <View style={s.footerRow}>
      <Text style={s.footerText}>Internal — Confidential</Text>
      <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  </View>
);

function severityColor(severity: string, c: DocColors): string {
  const s = severity.toLowerCase();
  if (s.includes("high")) return c.high;
  if (s.includes("medium")) return c.medium;
  return c.low;
}

function scoreColor(score: number, c: DocColors): string {
  if (score >= 9) return c.success;
  if (score >= 7) return c.warning;
  return c.destructive;
}

// ── Build report data from static content ──

export function buildSecurityReportData(): SecurityReportData {
  const sections: SecuritySection[] = [
    {
      number: 1, title: "Authentication & Session Management", score: 8, maxScore: 10,
      positiveFindings: [
        { control: "Password authentication", implementation: "Supabase Auth with email/password", status: "Implemented" },
        { control: "OAuth", implementation: "Google OAuth provider configured", status: "Implemented" },
        { control: "Session auto-refresh", implementation: "autoRefreshToken: true in Supabase client", status: "Implemented" },
        { control: "Server-side JWT validation", implementation: "auth.getUser(token) used in Edge Functions", status: "Implemented" },
        { control: "Form validation", implementation: "Zod schema validates email format and password", status: "Implemented" },
      ],
      issues: [
        { id: "AUTH-1", severity: "Medium", issue: "localStorage used for session tokens", justification: "Tokens accessible to any JS on the page; httpOnly cookies recommended" },
        { id: "AUTH-2", severity: "Low", issue: "No multi-factor authentication (MFA)", justification: "MFA should be enforced for admin/super-admin accounts" },
        { id: "AUTH-3", severity: "Low", issue: "No session idle timeout", justification: "Sessions persist indefinitely until token expiry" },
      ],
      deductionJustification: [
        "-1 for localStorage session storage (AUTH-1)",
        "-1 for missing MFA on privileged accounts (AUTH-2)",
      ],
    },
    {
      number: 2, title: "Authorization & Access Control", score: 9, maxScore: 10,
      positiveFindings: [
        { control: "Client-side route guards", implementation: "ProtectedRoute with requireAdmin/requireSuperAdmin", status: "Implemented" },
        { control: "Row Level Security (RLS)", implementation: "Enabled on ALL tables with org-scoped policies", status: "Implemented" },
        { control: "Organization-scoped multi-tenancy", implementation: "Users access data within their org only", status: "Implemented" },
        { control: "Admin role verification", implementation: "requireAdmin() and requireSuperAdmin() in Edge Functions", status: "Implemented" },
      ],
      issues: [
        { id: "AUTHZ-1", severity: "Low", issue: "Client-side loading flash", justification: "Brief content flash possible before redirect; RLS prevents data access" },
      ],
      deductionJustification: ["-1 for reliance on client-side guards as the primary UX layer (AUTHZ-1)"],
    },
    {
      number: 3, title: "Input Validation & Injection Prevention", score: 9, maxScore: 10,
      positiveFindings: [
        { control: "Zod schema validation", implementation: "All user-facing forms validated with Zod", status: "Implemented" },
        { control: "Server-side string validation", implementation: "requireString() with max length 50,000 chars", status: "Implemented" },
        { control: "SQL injection prevention", implementation: "Supabase SDK uses parameterized queries", status: "Implemented" },
        { control: "Prompt injection detection", implementation: "12 regex patterns detect jailbreak attempts", status: "Implemented" },
      ],
      issues: [
        { id: "INJ-1", severity: "Low", issue: "Prompt injection patterns are regex-based", justification: "Sophisticated attacks may bypass static regex; consider AI-based classifier" },
      ],
      deductionJustification: ["-1 for regex-only prompt injection detection (INJ-1)"],
    },
    {
      number: 4, title: "Data Protection & Privacy (PII/GDPR)", score: 8, maxScore: 10,
      positiveFindings: [
        { control: "Two-mode PII anonymization", implementation: "One-way masking (chat) + reversible (sentinel)", status: "Implemented" },
        { control: "Comprehensive PII detection", implementation: "Email, IBAN, credit card, phone, tax ID, etc.", status: "Implemented" },
        { control: "File access audit", implementation: "file_access_audit table logs all events", status: "Implemented" },
        { control: "GDPR Article 32 compliance", implementation: "Audit table for compliance measure", status: "Implemented" },
      ],
      issues: [
        { id: "DATA-1", severity: "Medium", issue: "No data-at-rest encryption beyond Supabase defaults", justification: "No application-level encryption for IBANs, contract values" },
        { id: "DATA-2", severity: "Low", issue: "Reversible anonymization stores entity map in memory", justification: "entityMap with PII exists in Edge Function memory during processing" },
        { id: "DATA-3", severity: "Low", issue: "No data retention/purge policy visible", justification: "GDPR Article 17 (right to erasure) compliance unclear" },
      ],
      deductionJustification: [
        "-1 for missing application-level encryption (DATA-1)",
        "-1 for no visible data retention policy (DATA-3)",
      ],
    },
    {
      number: 5, title: "API & Network Security", score: 6, maxScore: 10,
      positiveFindings: [
        { control: "Database-backed rate limiting", implementation: "Per-user, per-endpoint limits with configurable windows", status: "Implemented" },
        { control: "Fail-closed mode", implementation: "High-value endpoints deny on DB error", status: "Implemented" },
        { control: "Bearer token auth", implementation: "All Edge Functions require valid JWT", status: "Implemented" },
        { control: "MIME sniffing prevention", implementation: "X-Content-Type-Options: nosniff", status: "Implemented" },
      ],
      issues: [
        { id: "API-1", severity: "High", issue: "Access-Control-Allow-Origin: \"*\"", justification: "Wildcard CORS allows any website to make requests to Edge Functions" },
        { id: "API-2", severity: "Medium", issue: "No IP-based rate limiting", justification: "Rate limiting is user-ID-based only; brute-force login not limited by IP" },
        { id: "API-3", severity: "Medium", issue: "No request size limits on Edge Functions", justification: "No Content-Length validation before parsing; large payloads could cause resource exhaustion" },
        { id: "API-4", severity: "Low", issue: "Missing security headers", justification: "No HSTS, X-Frame-Options, or Referrer-Policy on Edge Functions" },
      ],
      deductionJustification: [
        "-2 for wildcard CORS (API-1)",
        "-1 for no IP-based rate limiting (API-2)",
        "-1 for missing HSTS and security headers (API-4)",
      ],
    },
    {
      number: 6, title: "File Upload & Storage Security", score: 9, maxScore: 10,
      positiveFindings: [
        { control: "Extension whitelist", implementation: "Only .xlsx, .docx, .pdf allowed", status: "Implemented" },
        { control: "Magic bytes verification", implementation: "Reads first 4 bytes to verify file headers", status: "Implemented" },
        { control: "Path traversal prevention", implementation: "CHECK constraint enforces org/user/file path format", status: "Implemented" },
        { control: "Download rate limiting", implementation: "30 requests/hour (fail-closed)", status: "Implemented" },
      ],
      issues: [
        { id: "FILE-1", severity: "Low", issue: "No server-side magic bytes validation", justification: "Magic bytes check runs client-side only; crafted request could bypass" },
      ],
      deductionJustification: ["-1 for client-side-only magic bytes validation (FILE-1)"],
    },
    {
      number: 7, title: "Client-Side Security (XSS/CSP/DOM)", score: 8, maxScore: 10,
      positiveFindings: [
        { control: "Comprehensive CSP", implementation: "default-src 'self', object-src 'none', base-uri 'self'", status: "Implemented" },
        { control: "No dangerouslySetInnerHTML", implementation: "Zero instances in codebase", status: "Confirmed" },
        { control: "No innerHTML", implementation: "Zero instances in codebase", status: "Confirmed" },
        { control: "React auto-escaping", implementation: "JSX auto-escapes interpolated values", status: "Inherent" },
      ],
      issues: [
        { id: "XSS-1", severity: "Medium", issue: "'unsafe-inline' in script-src", justification: "Weakens XSS protection; should use nonces in production" },
        { id: "XSS-2", severity: "Low", issue: "'unsafe-inline' in style-src", justification: "Lower risk but still weakens CSP; driven by Tailwind CSS" },
      ],
      deductionJustification: [
        "-1 for unsafe-inline in script-src (XSS-1)",
        "-1 for unsafe-inline in style-src (XSS-2)",
      ],
    },
    {
      number: 8, title: "Dependency & Supply Chain Security", score: 7, maxScore: 10,
      positiveFindings: [
        { control: "TypeScript strict mode", implementation: "Type safety reduces runtime errors", status: "Implemented" },
        { control: "Lockfile present", implementation: "bun.lock ensures reproducible builds", status: "Implemented" },
        { control: "ESLint configured", implementation: "React hooks and refresh plugins", status: "Implemented" },
      ],
      issues: [
        { id: "DEP-1", severity: "Medium", issue: "xlsx package (SheetJS community edition)", justification: "Past CVEs; users upload .xlsx files making this an attack vector" },
        { id: "DEP-2", severity: "Medium", issue: "All dependencies use caret (^) ranges", justification: "Could introduce vulnerabilities through compromised packages" },
        { id: "DEP-3", severity: "Low", issue: "No automated dependency scanning", justification: "No npm audit, Snyk, or Dependabot configured" },
      ],
      deductionJustification: [
        "-1 for xlsx library risk (DEP-1)",
        "-1 for no automated vulnerability scanning (DEP-3)",
        "-1 for permissive version ranges (DEP-2)",
      ],
    },
    {
      number: 9, title: "Error Handling & Information Disclosure", score: 7, maxScore: 10,
      positiveFindings: [
        { control: "Generic user-facing errors", implementation: "Most errors shown as 'An unexpected error occurred'", status: "Implemented" },
        { control: "Structured validation errors", implementation: "ValidationError class with safe messages", status: "Implemented" },
        { control: "Rate limit messages", implementation: "Generic 'Rate limit exceeded' with 429 status", status: "Implemented" },
      ],
      issues: [
        { id: "ERR-1", severity: "Medium", issue: "77+ console.log/error statements in source", justification: "Dev logging may leak sensitive data in browser console" },
        { id: "ERR-2", severity: "Medium", issue: "Supabase error messages forwarded to UI", justification: "Auth error messages may reveal infrastructure details" },
        { id: "ERR-3", severity: "Low", issue: "Edge Function error logging includes endpoint names", justification: "May leak endpoint names in server logs" },
      ],
      deductionJustification: [
        "-1 for excessive client-side console logging (ERR-1)",
        "-1 for forwarding raw Supabase auth errors (ERR-2)",
        "-1 for verbose server-side logging (ERR-3)",
      ],
    },
    {
      number: 10, title: "Infrastructure & Configuration Security", score: 6, maxScore: 10,
      positiveFindings: [
        { control: "Edge Functions use env vars for secrets", implementation: "Deno.env.get() — never in client code", status: "Implemented" },
        { control: "Private package", implementation: "\"private\": true prevents accidental npm publish", status: "Implemented" },
        { control: "Vite build optimization", implementation: "Production builds are minified and tree-shaken", status: "Inherent" },
      ],
      issues: [
        { id: "CFG-1", severity: "High", issue: "Supabase URL and anon key hardcoded in source", justification: "Prevents per-environment config; key rotation requires code change" },
        { id: "CFG-2", severity: "Medium", issue: "No .env.example file", justification: "No documentation of required environment variables" },
        { id: "CFG-3", severity: "Medium", issue: "No .gitignore audit for secrets", justification: "No verification that .env files are excluded" },
        { id: "CFG-4", severity: "Medium", issue: "Supabase anon key visible in CSP and source", justification: "Project reference exposed in multiple places" },
      ],
      deductionJustification: [
        "-2 for hardcoded Supabase credentials (CFG-1)",
        "-1 for missing .env.example (CFG-2)",
        "-1 for infrastructure exposure via hardcoded refs (CFG-4)",
      ],
    },
  ];

  return {
    systemVersion: "0.0.0 (vite_react_shadcn_ts)",
    assessmentDate: "2026-03-12",
    classification: "Internal — Confidential",
    overallScore: 77,
    riskRating: "MODERATE",
    executiveSummary: "EXOS is an AI-powered procurement analysis platform built with React 18, TypeScript, Vite, and Supabase. The system has strong fundamentals with a few areas requiring remediation before production hardening.",
    sections,
    priority1: [
      { id: "API-1", issue: "Wildcard CORS origin", remediation: "Replace \"*\" with explicit allowed origins using environment variable" },
      { id: "CFG-1", issue: "Hardcoded Supabase credentials", remediation: "Use import.meta.env.VITE_SUPABASE_URL and .env file" },
    ],
    priority2: [
      { id: "AUTH-1", issue: "localStorage for sessions", remediation: "Evaluate Supabase cookieOptions for httpOnly cookies" },
      { id: "AUTH-2", issue: "No MFA for admins", remediation: "Enable Supabase MFA for admin/super_admin roles" },
      { id: "DEP-1", issue: "xlsx library risk", remediation: "Audit SheetJS usage; consider Web Worker sandboxing" },
      { id: "ERR-2", issue: "Raw Supabase errors in UI", remediation: "Map Supabase errors to generic user-facing messages" },
      { id: "API-3", issue: "No request size limits", remediation: "Add Content-Length check (reject > 1MB)" },
    ],
    priority3: [
      { id: "API-4", issue: "Missing HSTS/security headers", remediation: "Add Strict-Transport-Security, X-Frame-Options, Referrer-Policy" },
      { id: "XSS-1", issue: "unsafe-inline scripts", remediation: "Configure Vite CSP nonces in production builds" },
      { id: "DEP-3", issue: "No dependency scanning", remediation: "Add GitHub Dependabot or npm audit to CI" },
      { id: "DATA-3", issue: "No data retention policy", remediation: "Implement automated purge of audit logs (e.g., 90 days)" },
    ],
    filesReviewed: [
      "src/integrations/supabase/client.ts",
      "src/pages/Auth.tsx",
      "src/components/ProtectedRoute.tsx",
      "src/hooks/useUser.ts",
      "src/hooks/useAdminAuth.ts",
      "src/lib/file-validation.ts",
      "supabase/functions/_shared/cors.ts",
      "supabase/functions/_shared/auth.ts",
      "supabase/functions/_shared/validate.ts",
      "supabase/functions/_shared/rate-limit.ts",
      "supabase/functions/_shared/anonymizer.ts",
      "supabase/migrations/ (10 migration files)",
      "index.html",
      "package.json",
    ],
    methodology: "This assessment was performed through static analysis of the source code, configuration files, database migrations, and Edge Function implementations. No dynamic testing (penetration testing, fuzzing) was performed. Findings are based on code review patterns and known vulnerability classes from OWASP Top 10 (2021) and CWE/SANS Top 25.",
  };
}

// ── Props ──

interface SecurityReportPDFDocumentProps {
  pdfTheme?: PdfThemeMode;
}

// ── Document ──

const SecurityReportPDFDocument = ({ pdfTheme = "dark" }: SecurityReportPDFDocumentProps) => {
  const data = buildSecurityReportData();
  const s = getStyles(pdfTheme);
  const c = getDocColors(pdfTheme);
  const logo = getDocLogo(pdfTheme);

  return (
    <Document>
      {/* ── Cover Page ── */}
      <Page size="A4" style={s.page}>
        <View style={s.gradientLayer1} />
        <View style={s.gradientLayer2} />
        <View style={s.gradientLayer3} />
        <View style={s.accentBar} />

        <View style={s.header}>
          <View style={s.logoSection}>
            <Image src={logo} style={s.logoImage} />
            <View>
              <Text style={s.brandName}>EXOS</Text>
              <Text style={s.brandTagline}>SECURITY ASSESSMENT REPORT</Text>
            </View>
          </View>
          <View style={s.reportMeta}>
            <View style={s.reportBadge}>
              <Text style={s.reportBadgeText}>{data.classification.toUpperCase()}</Text>
            </View>
            <Text style={s.reportDate}>{data.assessmentDate}</Text>
          </View>
        </View>

        <View style={s.titleSection}>
          <Text style={s.reportTitle}>Security Assessment Report</Text>
          <Text style={s.reportSubtitle}>System Version: {data.systemVersion}</Text>
        </View>

        {/* Executive Summary */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionDot} />
            <Text style={s.sectionTitle}>Executive Summary</Text>
          </View>
          <View style={s.sectionContent}>
            <Text style={{ fontSize: 10, color: c.text, lineHeight: 1.5, marginBottom: 12 }}>
              {data.executiveSummary}
            </Text>

            {/* Overall score */}
            <View style={s.overallScoreBox}>
              <Text style={s.overallScoreLabel}>Overall Security Score</Text>
              <View style={{ ...s.overallScoreBadge, backgroundColor: scoreColor(data.overallScore / 10, c) + "20", borderWidth: 1, borderColor: scoreColor(data.overallScore / 10, c) }}>
                <Text style={{ ...s.overallScoreValue, color: scoreColor(data.overallScore / 10, c) }}>
                  {data.overallScore} / 100
                </Text>
              </View>
            </View>
            <View style={s.scoreBarTrack}>
              <View style={{ ...s.scoreBarFill, width: `${data.overallScore}%`, backgroundColor: scoreColor(data.overallScore / 10, c) }} />
            </View>
            <Text style={{ fontSize: 10, color: c.textMuted, marginTop: 6 }}>
              Risk Rating: {data.riskRating}
            </Text>
          </View>
        </View>

        {/* Score Summary Table */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionDot} />
            <Text style={s.sectionTitle}>Domain Scores</Text>
          </View>
          <View style={s.sectionContent}>
            <View style={s.scoreRowHeader}>
              <Text style={s.scoreCellHeader}>#</Text>
              <Text style={{ ...s.scoreCellHeader, flex: 6 }}>Security Domain</Text>
              <Text style={s.scoreCellNumHeader}>Score</Text>
            </View>
            {data.sections.map((sec) => (
              <View key={sec.number} style={s.scoreRow}>
                <Text style={s.scoreCellNum}>{sec.number}</Text>
                <Text style={{ ...s.scoreCell, flex: 6 }}>{sec.title}</Text>
                <Text style={{ ...s.scoreCellNum, color: scoreColor(sec.score, c), fontFamily: "Courier-Bold", fontWeight: 700 }}>
                  {sec.score}/{sec.maxScore}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <ReportFooter s={s} />
      </Page>

      {/* ── Section Detail Pages ── */}
      {data.sections.map((sec) => (
        <Page key={sec.number} size="A4" style={s.pageWithHeader} wrap>
          <View style={s.gradientLayer1} />
          <View style={s.gradientLayer2} />
          <View style={s.gradientLayer3} />
          <View style={s.accentBar} />
          <RunningHeader dateStr={data.assessmentDate} s={s} />

          {/* Section header */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionDot} />
              <Text style={s.sectionTitle}>
                {sec.number}. {sec.title}
              </Text>
            </View>

            {/* Score */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ ...s.overallScoreBadge, backgroundColor: scoreColor(sec.score, c) + "20", borderWidth: 1, borderColor: scoreColor(sec.score, c) }}>
                <Text style={{ fontSize: 14, fontFamily: "Courier-Bold", fontWeight: 700, color: scoreColor(sec.score, c) }}>
                  {sec.score} / {sec.maxScore}
                </Text>
              </View>
            </View>

            {/* Positive findings */}
            <View style={s.sectionContent}>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: c.text, marginBottom: 8 }}>
                Positive Findings
              </Text>
              <View style={{ ...s.findingRow, backgroundColor: c.surfaceLight, borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                <Text style={{ ...s.findingControl, fontSize: 8, color: c.textMuted, fontFamily: "Helvetica-Bold" }}>Control</Text>
                <Text style={{ ...s.findingImpl, fontSize: 8, color: c.textMuted, fontFamily: "Helvetica-Bold" }}>Implementation</Text>
                <Text style={{ ...s.findingStatus, fontSize: 8, color: c.textMuted, fontFamily: "Helvetica-Bold" }}>Status</Text>
              </View>
              {sec.positiveFindings.map((f, i) => (
                <View key={i} style={s.findingRow}>
                  <Text style={s.findingControl}>{f.control}</Text>
                  <Text style={s.findingImpl}>{f.implementation}</Text>
                  <Text style={s.findingStatus}>{f.status}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Issues */}
          {sec.issues.length > 0 && (
            <View style={s.section}>
              <View style={{ ...s.sectionContent, borderLeftWidth: 3, borderLeftColor: c.destructive }}>
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: c.text, marginBottom: 8 }}>
                  Issues Found
                </Text>
                {sec.issues.map((iss, i) => (
                  <View key={i} style={s.issueRow}>
                    <Text style={s.issueId}>{iss.id}</Text>
                    <Text style={{ ...s.issueSeverity, color: severityColor(iss.severity, c) }}>
                      {iss.severity}
                    </Text>
                    <Text style={s.issueText}>{iss.issue}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Deduction justification */}
          {sec.deductionJustification.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: c.textMuted, marginBottom: 4 }}>
                Deduction Justification
              </Text>
              {sec.deductionJustification.map((d, i) => (
                <Text key={i} style={s.deductionText}>{d}</Text>
              ))}
            </View>
          )}

          <ReportFooter s={s} />
        </Page>
      ))}

      {/* ── Remediation Priorities Page ── */}
      <Page size="A4" style={s.pageWithHeader} wrap>
        <View style={s.gradientLayer1} />
        <View style={s.gradientLayer2} />
        <View style={s.gradientLayer3} />
        <View style={s.accentBar} />
        <RunningHeader dateStr={data.assessmentDate} s={s} />

        {/* Priority 1 */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={{ ...s.sectionDot, backgroundColor: c.destructive }} />
            <Text style={s.sectionTitle}>Priority 1 — Must Fix (High Severity)</Text>
          </View>
          <View style={{ ...s.sectionContent, borderLeftWidth: 3, borderLeftColor: c.destructive }}>
            {data.priority1.map((r, i) => (
              <View key={i} style={s.remRow}>
                <Text style={s.remId}>{r.id}</Text>
                <Text style={s.remIssue}>{r.issue}</Text>
                <Text style={s.remAction}>{r.remediation}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Priority 2 */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={{ ...s.sectionDot, backgroundColor: c.warning }} />
            <Text style={s.sectionTitle}>Priority 2 — Should Fix (Medium Severity)</Text>
          </View>
          <View style={{ ...s.sectionContent, borderLeftWidth: 3, borderLeftColor: c.warning }}>
            {data.priority2.map((r, i) => (
              <View key={i} style={s.remRow}>
                <Text style={s.remId}>{r.id}</Text>
                <Text style={s.remIssue}>{r.issue}</Text>
                <Text style={s.remAction}>{r.remediation}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Priority 3 */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={{ ...s.sectionDot, backgroundColor: c.success }} />
            <Text style={s.sectionTitle}>Priority 3 — Good Practice (Low Severity)</Text>
          </View>
          <View style={{ ...s.sectionContent, borderLeftWidth: 3, borderLeftColor: c.success }}>
            {data.priority3.map((r, i) => (
              <View key={i} style={s.remRow}>
                <Text style={s.remId}>{r.id}</Text>
                <Text style={s.remIssue}>{r.issue}</Text>
                <Text style={s.remAction}>{r.remediation}</Text>
              </View>
            ))}
          </View>
        </View>

        <ReportFooter s={s} />
      </Page>

      {/* ── Methodology & Appendix Page ── */}
      <Page size="A4" style={s.pageWithHeader} wrap>
        <View style={s.gradientLayer1} />
        <View style={s.gradientLayer2} />
        <View style={s.gradientLayer3} />
        <View style={s.accentBar} />
        <RunningHeader dateStr={data.assessmentDate} s={s} />

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionDot} />
            <Text style={s.sectionTitle}>Methodology</Text>
          </View>
          <View style={s.sectionContent}>
            <View style={s.methodBox}>
              <Text style={s.methodLabel}>Scoring</Text>
              <Text style={s.methodText}>
                Each section scored 0-10. High severity: -2 pts, Medium: -1 pt, Low: -0.5 pts (rounded). Maximum deduction per section: -5 points.
              </Text>
            </View>
            <View style={s.methodBox}>
              <Text style={s.methodLabel}>Approach</Text>
              <Text style={s.methodText}>{data.methodology}</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionDot} />
            <Text style={s.sectionTitle}>Files Reviewed</Text>
          </View>
          <View style={s.sectionContent}>
            {data.filesReviewed.map((f, i) => (
              <Text key={i} style={s.fileText}>{f}</Text>
            ))}
          </View>
        </View>

        <ReportFooter s={s} />
      </Page>
    </Document>
  );
};

export default SecurityReportPDFDocument;
