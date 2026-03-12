/**
 * Standalone script to generate the Security Assessment Report PDF.
 * Usage: node scripts/generate-security-pdf.mjs [output-path]
 */

import ReactPDF from "@react-pdf/renderer";
import React from "react";
import fs from "fs";
import path from "path";

const { Document, Page, Text, View, StyleSheet, Image } = ReactPDF;
const h = React.createElement;

// ── Colors ──

const colors = {
  primary: "#6b9e8a",
  background: "#1e1e2e",
  surface: "#262637",
  surfaceLight: "#2f2f42",
  text: "#d4d4dc",
  textMuted: "#8b8b9e",
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

const c = colors;

// ── Styles ──

const s = StyleSheet.create({
  page: { backgroundColor: c.background, padding: 40, fontFamily: "Helvetica", color: c.text },
  pageH: { backgroundColor: c.background, paddingTop: 50, paddingLeft: 40, paddingRight: 40, paddingBottom: 60, fontFamily: "Helvetica", color: c.text },
  accentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: c.primary },
  gl1: { position: "absolute", top: 0, left: 0, right: 0, bottom: "50%", backgroundColor: c.gradientLayer1 },
  gl2: { position: "absolute", top: "30%", left: 0, right: 0, bottom: "30%", backgroundColor: c.gradientLayer2 },
  gl3: { position: "absolute", top: "50%", left: 0, right: 0, bottom: 0, backgroundColor: c.gradientLayer3 },
  runH: { position: "absolute", top: 0, left: 40, right: 40, paddingTop: 10, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  runHT: { fontSize: 8, color: c.textMuted },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 20 },
  logoSec: { flexDirection: "row", alignItems: "center" },
  brandName: { fontSize: 23, fontFamily: "Helvetica-Bold", fontWeight: 700, color: c.text, letterSpacing: 1 },
  brandTag: { fontSize: 9, color: c.textMuted, marginTop: 2 },
  rMeta: { textAlign: "right" },
  rBadge: { backgroundColor: c.surfaceLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 4 },
  rBadgeT: { fontSize: 8, color: c.primary, fontWeight: 600 },
  rDate: { fontSize: 9, color: c.textMuted },
  titleSec: { marginBottom: 24 },
  rTitle: { fontSize: 26, fontFamily: "Helvetica-Bold", fontWeight: 700, color: c.primary, marginBottom: 6, letterSpacing: 0.5 },
  rSub: { fontSize: 11, color: c.textMuted },
  sec: { marginBottom: 18 },
  secH: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  secDot: { width: 8, height: 8, backgroundColor: c.primary, borderRadius: 2, marginRight: 8 },
  secT: { fontSize: 15, fontFamily: "Helvetica-Bold", fontWeight: 600, color: c.text, letterSpacing: 0.5 },
  secC: { backgroundColor: c.surface, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: c.border },
  scoreRowH: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 5, backgroundColor: c.surfaceLight, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  scoreRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: c.border, paddingVertical: 5 },
  sCell: { flex: 3, fontSize: 10, color: c.text, paddingHorizontal: 6 },
  sCellN: { flex: 1, fontSize: 10, color: c.text, textAlign: "center", fontFamily: "Courier" },
  sCellHdr: { flex: 3, fontSize: 9, color: c.textMuted, fontFamily: "Helvetica-Bold", paddingHorizontal: 6 },
  sCellNHdr: { flex: 1, fontSize: 9, color: c.textMuted, fontFamily: "Helvetica-Bold", textAlign: "center" },
  overallBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border },
  overallLabel: { fontSize: 13, fontFamily: "Helvetica-Bold", color: c.text },
  overallBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  overallVal: { fontSize: 18, fontFamily: "Courier-Bold", fontWeight: 700 },
  barTrack: { height: 8, backgroundColor: c.surfaceLight, borderRadius: 4, marginTop: 8, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  fRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: c.border, paddingVertical: 4 },
  fCtrl: { flex: 2, fontSize: 9, color: c.text, paddingHorizontal: 4 },
  fImpl: { flex: 3, fontSize: 9, color: c.textMuted, paddingHorizontal: 4 },
  fStat: { width: 70, fontSize: 9, color: c.success, fontFamily: "Helvetica-Bold", paddingHorizontal: 4, textAlign: "center" },
  iRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: c.border, paddingVertical: 5 },
  iId: { width: 60, fontSize: 9, fontFamily: "Courier", color: c.textMuted, paddingHorizontal: 4 },
  iSev: { width: 55, fontSize: 9, fontFamily: "Helvetica-Bold", paddingHorizontal: 4 },
  iTxt: { flex: 1, fontSize: 9, color: c.text, paddingHorizontal: 4 },
  dTxt: { fontSize: 9, color: c.textMuted, marginTop: 4, lineHeight: 1.4 },
  remRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: c.border, paddingVertical: 5 },
  remId: { width: 50, fontSize: 9, fontFamily: "Courier", color: c.textMuted, paddingHorizontal: 4 },
  remIss: { flex: 2, fontSize: 9, color: c.text, paddingHorizontal: 4 },
  remAct: { flex: 3, fontSize: 9, color: c.text, paddingHorizontal: 4 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "column", alignItems: "center", borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10 },
  footerBrand: { fontSize: 9, color: c.footerBrand, marginBottom: 4 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
  footerTxt: { fontSize: 8, color: c.textMuted },
  pageNum: { fontSize: 8, color: c.textMuted },
  methBox: { borderWidth: 1, borderColor: c.border, borderRadius: 6, padding: 10, marginBottom: 10 },
  methLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: c.text, marginBottom: 4 },
  methTxt: { fontSize: 9, color: c.textMuted, lineHeight: 1.5 },
  fileT: { fontSize: 8, fontFamily: "Courier", color: c.textMuted, marginBottom: 1 },
});

// ── Helpers ──

function sevColor(sev) {
  const sv = sev.toLowerCase();
  if (sv.includes("high")) return c.high;
  if (sv.includes("medium")) return c.medium;
  return c.low;
}

function scoColor(score) {
  if (score >= 9) return c.success;
  if (score >= 7) return c.warning;
  return c.destructive;
}

// ── Data ──

const sections = [
  {
    n: 1, title: "Authentication & Session Management", score: 8, max: 10,
    pos: [
      { ctrl: "Password authentication", impl: "Supabase Auth with email/password", stat: "Implemented" },
      { ctrl: "OAuth", impl: "Google OAuth provider configured", stat: "Implemented" },
      { ctrl: "Session auto-refresh", impl: "autoRefreshToken: true in Supabase client", stat: "Implemented" },
      { ctrl: "Server-side JWT validation", impl: "auth.getUser(token) in Edge Functions", stat: "Implemented" },
      { ctrl: "Form validation", impl: "Zod schema validates email and password", stat: "Implemented" },
    ],
    issues: [
      { id: "AUTH-1", sev: "Medium", issue: "localStorage used for session tokens" },
      { id: "AUTH-2", sev: "Low", issue: "No multi-factor authentication (MFA)" },
      { id: "AUTH-3", sev: "Low", issue: "No session idle timeout" },
    ],
    ded: ["-1 for localStorage session storage (AUTH-1)", "-1 for missing MFA on privileged accounts (AUTH-2)"],
  },
  {
    n: 2, title: "Authorization & Access Control", score: 9, max: 10,
    pos: [
      { ctrl: "Client-side route guards", impl: "ProtectedRoute with requireAdmin/requireSuperAdmin", stat: "Implemented" },
      { ctrl: "Row Level Security (RLS)", impl: "Enabled on ALL tables with org-scoped policies", stat: "Implemented" },
      { ctrl: "Org-scoped multi-tenancy", impl: "Users access data within their org only", stat: "Implemented" },
      { ctrl: "Admin role verification", impl: "requireAdmin()/requireSuperAdmin() in Edge Fns", stat: "Implemented" },
    ],
    issues: [
      { id: "AUTHZ-1", sev: "Low", issue: "Client-side loading flash before redirect" },
    ],
    ded: ["-1 for reliance on client-side guards (AUTHZ-1)"],
  },
  {
    n: 3, title: "Input Validation & Injection Prevention", score: 9, max: 10,
    pos: [
      { ctrl: "Zod schema validation", impl: "All user-facing forms validated with Zod", stat: "Implemented" },
      { ctrl: "Server-side string validation", impl: "requireString() with max 50,000 chars", stat: "Implemented" },
      { ctrl: "SQL injection prevention", impl: "Supabase SDK parameterized queries", stat: "Implemented" },
      { ctrl: "Prompt injection detection", impl: "12 regex patterns detect jailbreak attempts", stat: "Implemented" },
    ],
    issues: [
      { id: "INJ-1", sev: "Low", issue: "Prompt injection patterns are regex-based only" },
    ],
    ded: ["-1 for regex-only prompt injection detection (INJ-1)"],
  },
  {
    n: 4, title: "Data Protection & Privacy (PII/GDPR)", score: 8, max: 10,
    pos: [
      { ctrl: "Two-mode PII anonymization", impl: "One-way masking + reversible anonymization", stat: "Implemented" },
      { ctrl: "Comprehensive PII detection", impl: "Email, IBAN, credit card, phone, tax ID", stat: "Implemented" },
      { ctrl: "File access audit", impl: "file_access_audit table logs all events", stat: "Implemented" },
      { ctrl: "GDPR Article 32", impl: "Audit table for compliance", stat: "Implemented" },
    ],
    issues: [
      { id: "DATA-1", sev: "Medium", issue: "No data-at-rest encryption beyond Supabase defaults" },
      { id: "DATA-2", sev: "Low", issue: "Reversible anonymization stores entity map in memory" },
      { id: "DATA-3", sev: "Low", issue: "No data retention/purge policy visible" },
    ],
    ded: ["-1 for missing application-level encryption (DATA-1)", "-1 for no data retention policy (DATA-3)"],
  },
  {
    n: 5, title: "API & Network Security", score: 6, max: 10,
    pos: [
      { ctrl: "Database-backed rate limiting", impl: "Per-user, per-endpoint with configurable windows", stat: "Implemented" },
      { ctrl: "Fail-closed mode", impl: "High-value endpoints deny on DB error", stat: "Implemented" },
      { ctrl: "Bearer token auth", impl: "All Edge Functions require valid JWT", stat: "Implemented" },
      { ctrl: "MIME sniffing prevention", impl: "X-Content-Type-Options: nosniff", stat: "Implemented" },
    ],
    issues: [
      { id: "API-1", sev: "High", issue: "Access-Control-Allow-Origin: \"*\" (wildcard CORS)" },
      { id: "API-2", sev: "Medium", issue: "No IP-based rate limiting" },
      { id: "API-3", sev: "Medium", issue: "No request size limits on Edge Functions" },
      { id: "API-4", sev: "Low", issue: "Missing HSTS/security headers" },
    ],
    ded: ["-2 for wildcard CORS (API-1)", "-1 for no IP-based rate limiting (API-2)", "-1 for missing HSTS (API-4)"],
  },
  {
    n: 6, title: "File Upload & Storage Security", score: 9, max: 10,
    pos: [
      { ctrl: "Extension whitelist", impl: "Only .xlsx, .docx, .pdf allowed", stat: "Implemented" },
      { ctrl: "Magic bytes verification", impl: "Reads first 4 bytes to verify headers", stat: "Implemented" },
      { ctrl: "Path traversal prevention", impl: "CHECK constraint enforces path format", stat: "Implemented" },
      { ctrl: "Download rate limiting", impl: "30 requests/hour (fail-closed)", stat: "Implemented" },
    ],
    issues: [
      { id: "FILE-1", sev: "Low", issue: "No server-side magic bytes validation" },
    ],
    ded: ["-1 for client-side-only magic bytes validation (FILE-1)"],
  },
  {
    n: 7, title: "Client-Side Security (XSS/CSP/DOM)", score: 8, max: 10,
    pos: [
      { ctrl: "Comprehensive CSP", impl: "default-src 'self', object-src 'none', base-uri 'self'", stat: "Implemented" },
      { ctrl: "No dangerouslySetInnerHTML", impl: "Zero instances in codebase", stat: "Confirmed" },
      { ctrl: "No innerHTML", impl: "Zero instances in codebase", stat: "Confirmed" },
      { ctrl: "React auto-escaping", impl: "JSX auto-escapes interpolated values", stat: "Inherent" },
    ],
    issues: [
      { id: "XSS-1", sev: "Medium", issue: "'unsafe-inline' in script-src" },
      { id: "XSS-2", sev: "Low", issue: "'unsafe-inline' in style-src" },
    ],
    ded: ["-1 for unsafe-inline in script-src (XSS-1)", "-1 for unsafe-inline in style-src (XSS-2)"],
  },
  {
    n: 8, title: "Dependency & Supply Chain Security", score: 7, max: 10,
    pos: [
      { ctrl: "TypeScript strict mode", impl: "Type safety reduces runtime errors", stat: "Implemented" },
      { ctrl: "Lockfile present", impl: "bun.lock ensures reproducible builds", stat: "Implemented" },
      { ctrl: "ESLint configured", impl: "React hooks and refresh plugins", stat: "Implemented" },
    ],
    issues: [
      { id: "DEP-1", sev: "Medium", issue: "xlsx package (SheetJS) has past CVEs" },
      { id: "DEP-2", sev: "Medium", issue: "All dependencies use caret (^) ranges" },
      { id: "DEP-3", sev: "Low", issue: "No automated dependency scanning" },
    ],
    ded: ["-1 for xlsx library risk (DEP-1)", "-1 for no vulnerability scanning (DEP-3)", "-1 for permissive version ranges (DEP-2)"],
  },
  {
    n: 9, title: "Error Handling & Information Disclosure", score: 7, max: 10,
    pos: [
      { ctrl: "Generic user-facing errors", impl: "'An unexpected error occurred' shown", stat: "Implemented" },
      { ctrl: "Structured validation errors", impl: "ValidationError class with safe messages", stat: "Implemented" },
      { ctrl: "Rate limit messages", impl: "Generic 'Rate limit exceeded' with 429", stat: "Implemented" },
    ],
    issues: [
      { id: "ERR-1", sev: "Medium", issue: "77+ console.log/error statements in source" },
      { id: "ERR-2", sev: "Medium", issue: "Supabase error messages forwarded to UI" },
      { id: "ERR-3", sev: "Low", issue: "Edge Function logging includes endpoint names" },
    ],
    ded: ["-1 for console logging (ERR-1)", "-1 for raw Supabase errors (ERR-2)", "-1 for verbose server logs (ERR-3)"],
  },
  {
    n: 10, title: "Infrastructure & Configuration Security", score: 6, max: 10,
    pos: [
      { ctrl: "Edge Functions use env vars", impl: "Deno.env.get() — never in client code", stat: "Implemented" },
      { ctrl: "Private package", impl: "\"private\": true prevents npm publish", stat: "Implemented" },
      { ctrl: "Vite build optimization", impl: "Production builds minified/tree-shaken", stat: "Inherent" },
    ],
    issues: [
      { id: "CFG-1", sev: "High", issue: "Supabase URL and anon key hardcoded in source" },
      { id: "CFG-2", sev: "Medium", issue: "No .env.example file" },
      { id: "CFG-3", sev: "Medium", issue: "No .gitignore audit for secrets" },
      { id: "CFG-4", sev: "Medium", issue: "Supabase project ref exposed in CSP and source" },
    ],
    ded: ["-2 for hardcoded credentials (CFG-1)", "-1 for missing .env.example (CFG-2)", "-1 for exposed project refs (CFG-4)"],
  },
];

const priority1 = [
  { id: "API-1", issue: "Wildcard CORS origin", rem: "Replace \"*\" with explicit allowed origins via env var" },
  { id: "CFG-1", issue: "Hardcoded Supabase credentials", rem: "Use import.meta.env.VITE_SUPABASE_URL and .env file" },
];

const priority2 = [
  { id: "AUTH-1", issue: "localStorage for sessions", rem: "Evaluate Supabase cookieOptions for httpOnly cookies" },
  { id: "AUTH-2", issue: "No MFA for admins", rem: "Enable Supabase MFA for admin/super_admin roles" },
  { id: "DEP-1", issue: "xlsx library risk", rem: "Audit SheetJS usage; consider Web Worker sandboxing" },
  { id: "ERR-2", issue: "Raw Supabase errors in UI", rem: "Map Supabase errors to generic messages" },
  { id: "API-3", issue: "No request size limits", rem: "Add Content-Length check (reject > 1MB)" },
];

const priority3 = [
  { id: "API-4", issue: "Missing HSTS/security headers", rem: "Add Strict-Transport-Security, X-Frame-Options, Referrer-Policy" },
  { id: "XSS-1", issue: "unsafe-inline scripts", rem: "Configure Vite CSP nonces in production" },
  { id: "DEP-3", issue: "No dependency scanning", rem: "Add Dependabot or npm audit to CI" },
  { id: "DATA-3", issue: "No data retention policy", rem: "Implement automated purge (e.g., 90 days)" },
];

const filesReviewed = [
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
];

// ── Components ──

const BG = () => [h(View, { key: "g1", style: s.gl1 }), h(View, { key: "g2", style: s.gl2 }), h(View, { key: "g3", style: s.gl3 }), h(View, { key: "ab", style: s.accentBar })];

const RunH = ({ date }) => h(View, { style: s.runH, fixed: true },
  h(Text, { style: s.runHT }, "EXOS | Security Assessment Report"),
  h(Text, { style: s.runHT }, date),
);

const Footer = () => h(View, { style: s.footer, fixed: true },
  h(Text, { style: s.footerBrand }, "Powered by EXOS Procurement Intelligence"),
  h(View, { style: s.footerRow },
    h(Text, { style: s.footerTxt }, "Internal — Confidential"),
    h(Text, { style: s.pageNum, render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}` }),
  ),
);

// ── Build Document ──

const doc = h(Document, {},
  // Cover page
  h(Page, { size: "A4", style: s.page },
    ...BG(),
    h(View, { style: s.header },
      h(View, { style: s.logoSec },
        h(View, {},
          h(Text, { style: s.brandName }, "EXOS"),
          h(Text, { style: s.brandTag }, "SECURITY ASSESSMENT REPORT"),
        ),
      ),
      h(View, { style: s.rMeta },
        h(View, { style: s.rBadge }, h(Text, { style: s.rBadgeT }, "INTERNAL — CONFIDENTIAL")),
        h(Text, { style: s.rDate }, "2026-03-12"),
      ),
    ),
    h(View, { style: s.titleSec },
      h(Text, { style: s.rTitle }, "Security Assessment Report"),
      h(Text, { style: s.rSub }, "System Version: 0.0.0 (vite_react_shadcn_ts)"),
    ),
    // Executive Summary
    h(View, { style: s.sec },
      h(View, { style: s.secH },
        h(View, { style: s.secDot }),
        h(Text, { style: s.secT }, "Executive Summary"),
      ),
      h(View, { style: s.secC },
        h(Text, { style: { fontSize: 10, color: c.text, lineHeight: 1.5, marginBottom: 12 } },
          "EXOS is an AI-powered procurement analysis platform built with React 18, TypeScript, Vite, and Supabase. The system has strong fundamentals with a few areas requiring remediation before production hardening.",
        ),
        h(View, { style: s.overallBox },
          h(Text, { style: s.overallLabel }, "Overall Security Score"),
          h(View, { style: { ...s.overallBadge, backgroundColor: scoColor(7.7) + "20", borderWidth: 1, borderColor: scoColor(7.7) } },
            h(Text, { style: { ...s.overallVal, color: scoColor(7.7) } }, "77 / 100"),
          ),
        ),
        h(View, { style: s.barTrack },
          h(View, { style: { ...s.barFill, width: "77%", backgroundColor: scoColor(7.7) } }),
        ),
        h(Text, { style: { fontSize: 10, color: c.textMuted, marginTop: 6 } }, "Risk Rating: MODERATE"),
      ),
    ),
    // Domain Scores
    h(View, { style: s.sec },
      h(View, { style: s.secH },
        h(View, { style: s.secDot }),
        h(Text, { style: s.secT }, "Domain Scores"),
      ),
      h(View, { style: s.secC },
        h(View, { style: s.scoreRowH },
          h(Text, { style: s.sCellHdr }, "#"),
          h(Text, { style: { ...s.sCellHdr, flex: 6 } }, "Security Domain"),
          h(Text, { style: s.sCellNHdr }, "Score"),
        ),
        ...sections.map((sec) =>
          h(View, { key: `sr-${sec.n}`, style: s.scoreRow },
            h(Text, { style: s.sCellN }, String(sec.n)),
            h(Text, { style: { ...s.sCell, flex: 6 } }, sec.title),
            h(Text, { style: { ...s.sCellN, color: scoColor(sec.score), fontFamily: "Courier-Bold", fontWeight: 700 } }, `${sec.score}/${sec.max}`),
          ),
        ),
      ),
    ),
    h(Footer),
  ),

  // Section detail pages
  ...sections.map((sec) =>
    h(Page, { key: `sec-${sec.n}`, size: "A4", style: s.pageH, wrap: true },
      ...BG(),
      h(RunH, { date: "2026-03-12" }),
      // Header
      h(View, { style: s.sec },
        h(View, { style: s.secH },
          h(View, { style: s.secDot }),
          h(Text, { style: s.secT }, `${sec.n}. ${sec.title}`),
        ),
        // Score badge
        h(View, { style: { flexDirection: "row", alignItems: "center", marginBottom: 10 } },
          h(View, { style: { ...s.overallBadge, backgroundColor: scoColor(sec.score) + "20", borderWidth: 1, borderColor: scoColor(sec.score) } },
            h(Text, { style: { fontSize: 14, fontFamily: "Courier-Bold", fontWeight: 700, color: scoColor(sec.score) } }, `${sec.score} / ${sec.max}`),
          ),
        ),
        // Positive findings
        h(View, { style: s.secC },
          h(Text, { style: { fontSize: 11, fontFamily: "Helvetica-Bold", color: c.text, marginBottom: 8 } }, "Positive Findings"),
          h(View, { style: { ...s.fRow, backgroundColor: c.surfaceLight, borderTopLeftRadius: 4, borderTopRightRadius: 4 } },
            h(Text, { style: { ...s.fCtrl, fontSize: 8, color: c.textMuted, fontFamily: "Helvetica-Bold" } }, "Control"),
            h(Text, { style: { ...s.fImpl, fontSize: 8, color: c.textMuted, fontFamily: "Helvetica-Bold" } }, "Implementation"),
            h(Text, { style: { ...s.fStat, fontSize: 8, color: c.textMuted, fontFamily: "Helvetica-Bold" } }, "Status"),
          ),
          ...sec.pos.map((f, i) =>
            h(View, { key: `f-${i}`, style: s.fRow },
              h(Text, { style: s.fCtrl }, f.ctrl),
              h(Text, { style: s.fImpl }, f.impl),
              h(Text, { style: s.fStat }, f.stat),
            ),
          ),
        ),
      ),
      // Issues
      sec.issues.length > 0 && h(View, { style: s.sec },
        h(View, { style: { ...s.secC, borderLeftWidth: 3, borderLeftColor: c.destructive } },
          h(Text, { style: { fontSize: 11, fontFamily: "Helvetica-Bold", color: c.text, marginBottom: 8 } }, "Issues Found"),
          ...sec.issues.map((iss, i) =>
            h(View, { key: `i-${i}`, style: s.iRow },
              h(Text, { style: s.iId }, iss.id),
              h(Text, { style: { ...s.iSev, color: sevColor(iss.sev) } }, iss.sev),
              h(Text, { style: s.iTxt }, iss.issue),
            ),
          ),
        ),
      ),
      // Deductions
      sec.ded.length > 0 && h(View, { style: { marginBottom: 12 } },
        h(Text, { style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: c.textMuted, marginBottom: 4 } }, "Deduction Justification"),
        ...sec.ded.map((d, i) => h(Text, { key: `d-${i}`, style: s.dTxt }, d)),
      ),
      h(Footer),
    ),
  ),

  // Remediation page
  h(Page, { size: "A4", style: s.pageH, wrap: true },
    ...BG(),
    h(RunH, { date: "2026-03-12" }),
    // Priority 1
    h(View, { style: s.sec },
      h(View, { style: s.secH },
        h(View, { style: { ...s.secDot, backgroundColor: c.destructive } }),
        h(Text, { style: s.secT }, "Priority 1 — Must Fix (High Severity)"),
      ),
      h(View, { style: { ...s.secC, borderLeftWidth: 3, borderLeftColor: c.destructive } },
        ...priority1.map((r, i) =>
          h(View, { key: `p1-${i}`, style: s.remRow },
            h(Text, { style: s.remId }, r.id),
            h(Text, { style: s.remIss }, r.issue),
            h(Text, { style: s.remAct }, r.rem),
          ),
        ),
      ),
    ),
    // Priority 2
    h(View, { style: s.sec },
      h(View, { style: s.secH },
        h(View, { style: { ...s.secDot, backgroundColor: c.warning } }),
        h(Text, { style: s.secT }, "Priority 2 — Should Fix (Medium Severity)"),
      ),
      h(View, { style: { ...s.secC, borderLeftWidth: 3, borderLeftColor: c.warning } },
        ...priority2.map((r, i) =>
          h(View, { key: `p2-${i}`, style: s.remRow },
            h(Text, { style: s.remId }, r.id),
            h(Text, { style: s.remIss }, r.issue),
            h(Text, { style: s.remAct }, r.rem),
          ),
        ),
      ),
    ),
    // Priority 3
    h(View, { style: s.sec },
      h(View, { style: s.secH },
        h(View, { style: { ...s.secDot, backgroundColor: c.success } }),
        h(Text, { style: s.secT }, "Priority 3 — Good Practice (Low Severity)"),
      ),
      h(View, { style: { ...s.secC, borderLeftWidth: 3, borderLeftColor: c.success } },
        ...priority3.map((r, i) =>
          h(View, { key: `p3-${i}`, style: s.remRow },
            h(Text, { style: s.remId }, r.id),
            h(Text, { style: s.remIss }, r.issue),
            h(Text, { style: s.remAct }, r.rem),
          ),
        ),
      ),
    ),
    h(Footer),
  ),

  // Methodology & Files page
  h(Page, { size: "A4", style: s.pageH, wrap: true },
    ...BG(),
    h(RunH, { date: "2026-03-12" }),
    h(View, { style: s.sec },
      h(View, { style: s.secH },
        h(View, { style: s.secDot }),
        h(Text, { style: s.secT }, "Methodology"),
      ),
      h(View, { style: s.secC },
        h(View, { style: s.methBox },
          h(Text, { style: s.methLabel }, "Scoring"),
          h(Text, { style: s.methTxt }, "Each section scored 0-10. High severity: -2 pts, Medium: -1 pt, Low: -0.5 pts (rounded). Maximum deduction per section: -5 points."),
        ),
        h(View, { style: s.methBox },
          h(Text, { style: s.methLabel }, "Approach"),
          h(Text, { style: s.methTxt }, "This assessment was performed through static analysis of source code, configuration files, database migrations, and Edge Function implementations. No dynamic testing was performed. Findings based on OWASP Top 10 (2021) and CWE/SANS Top 25."),
        ),
      ),
    ),
    h(View, { style: s.sec },
      h(View, { style: s.secH },
        h(View, { style: s.secDot }),
        h(Text, { style: s.secT }, "Files Reviewed"),
      ),
      h(View, { style: s.secC },
        ...filesReviewed.map((f, i) => h(Text, { key: `f-${i}`, style: s.fileT }, f)),
      ),
    ),
    h(Footer),
  ),
);

// ── Render ──

const outputPath = process.argv[2] || path.join(process.cwd(), "EXOS_Security_Report_2026-03-12.pdf");

console.log("Generating Security Assessment Report PDF...");
await ReactPDF.renderToFile(doc, outputPath);
console.log(`PDF saved to: ${outputPath}`);
