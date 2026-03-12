# EXOS UX Replica — Security Assessment Report

**System Version:** 0.0.0 (vite_react_shadcn_ts)
**Assessment Date:** 2026-03-12
**Assessor:** Automated Security Audit
**Classification:** Internal — Confidential

---

## Executive Summary

EXOS is an AI-powered procurement analysis platform built with React 18, TypeScript, Vite, and Supabase (PostgreSQL + Auth + Edge Functions + Storage). The application handles sensitive procurement data including supplier contracts, pricing, financial identifiers (IBANs, credit cards), and PII.

This report evaluates 10 security domains on a **0–10 point scale** (10 = best possible). The overall weighted score reflects the system's current security posture.

| #  | Security Domain                          | Score | Max |
|----|------------------------------------------|-------|-----|
| 1  | Authentication & Session Management      | 8     | 10  |
| 2  | Authorization & Access Control           | 9     | 10  |
| 3  | Input Validation & Injection Prevention  | 9     | 10  |
| 4  | Data Protection & Privacy (PII/GDPR)     | 8     | 10  |
| 5  | API & Network Security                   | 6     | 10  |
| 6  | File Upload & Storage Security           | 9     | 10  |
| 7  | Client-Side Security (XSS/CSP/DOM)       | 8     | 10  |
| 8  | Dependency & Supply Chain Security       | 7     | 10  |
| 9  | Error Handling & Information Disclosure   | 7     | 10  |
| 10 | Infrastructure & Configuration Security  | 6     | 10  |
|    | **Overall Score**                        | **77** | **100** |

**Risk Rating: MODERATE** — The system has strong fundamentals with a few areas requiring remediation before production hardening.

---

## Section 1: Authentication & Session Management

**Score: 8 / 10**

### What Was Evaluated
- Login/signup flows (`src/pages/Auth.tsx`)
- Session persistence and token refresh (`src/integrations/supabase/client.ts`)
- Password reset flow
- OAuth integration (Google)
- Admin authentication (`src/hooks/useAdminAuth.ts`)

### Positive Findings

| Control | Implementation | Status |
|---------|---------------|--------|
| Password authentication | Supabase Auth with email/password | Implemented |
| OAuth | Google OAuth provider configured | Implemented |
| Session auto-refresh | `autoRefreshToken: true` in Supabase client | Implemented |
| Session persistence | `persistSession: true` with `localStorage` | Implemented |
| Password reset | Email-based secure token flow | Implemented |
| Auth state listener | `onAuthStateChange` subscription with cleanup | Implemented |
| Form validation | Zod schema validates email format and password confirmation | Implemented |
| Server-side JWT validation | `auth.getUser(token)` used in Edge Functions (not just `getSession`) | Implemented |

### Issues Found

| ID | Severity | Issue | Justification |
|----|----------|-------|---------------|
| AUTH-1 | **Medium** | `localStorage` used for session tokens | Tokens in `localStorage` are accessible to any JavaScript running on the page. If an XSS vulnerability exists, session tokens can be exfiltrated. `httpOnly` cookies are more secure but require Supabase custom configuration. |
| AUTH-2 | **Low** | No multi-factor authentication (MFA) | For a system handling financial procurement data (IBANs, contracts, pricing), MFA should be enforced for admin/super-admin accounts at minimum. |
| AUTH-3 | **Low** | No session idle timeout | Sessions persist indefinitely until token expiry. No client-side inactivity detection to force re-authentication. |

### Deduction Justification
- −1 for `localStorage` session storage (AUTH-1) — industry standard recommends `httpOnly` cookies for sensitive applications.
- −1 for missing MFA on privileged accounts (AUTH-2) — critical gap for financial data handling.

---

## Section 2: Authorization & Access Control

**Score: 9 / 10**

### What Was Evaluated
- Route protection (`src/components/ProtectedRoute.tsx`)
- Row Level Security policies (all migrations)
- Role-based access (admin, super_admin, org-scoped)
- Edge Function authorization (`supabase/functions/_shared/auth.ts`)

### Positive Findings

| Control | Implementation | Status |
|---------|---------------|--------|
| Client-side route guards | `ProtectedRoute` component with `requireAdmin` / `requireSuperAdmin` flags | Implemented |
| Server-side role verification | RPC calls to `is_super_admin()` and `get_user_org_role()` | Implemented |
| Row Level Security (RLS) | Enabled on ALL tables with org-scoped policies | Implemented |
| Organization-scoped multi-tenancy | Users can only access data within their organization | Implemented |
| Super admin bypass | Explicit `is_super_admin()` check in policies (not a blanket bypass) | Implemented |
| File access scoping | Storage policies enforce `{org_uuid}/{user_uuid}/` path matching | Implemented |
| Admin role verification in Edge Functions | `requireAdmin()` and `requireSuperAdmin()` functions using `SERVICE_ROLE_KEY` | Implemented |
| Catch-all route | `*` maps to NotFound page — no accidental route exposure | Implemented |

### Issues Found

| ID | Severity | Issue | Justification |
|----|----------|-------|---------------|
| AUTHZ-1 | **Low** | Client-side loading flash | `ProtectedRoute` returns `null` during loading state. Brief content flash is possible before redirect. Not a security bypass — server-side RLS prevents data access regardless. |

### Deduction Justification
- −1 for reliance on client-side guards as the primary UX layer (AUTHZ-1). While RLS provides the true security boundary, a server-side middleware layer (e.g., Supabase Auth Helpers for SSR) would add defense-in-depth.

---

## Section 3: Input Validation & Injection Prevention

**Score: 9 / 10**

### What Was Evaluated
- Client-side form validation (Zod schemas)
- Server-side Edge Function validation (`supabase/functions/_shared/validate.ts`)
- SQL injection vectors
- Prompt injection filtering
- Request body parsing

### Positive Findings

| Control | Implementation | Status |
|---------|---------------|--------|
| Zod schema validation | All user-facing forms validated with Zod (auth, contact, file upload) | Implemented |
| Server-side string validation | `requireString()` with max length 50,000 chars | Implemented |
| Server-side array validation | `requireArray()` with max 100 items | Implemented |
| String enum validation | `requireStringEnum()` restricts to allowed values | Implemented |
| JSON body parsing | `parseBody()` rejects non-object bodies | Implemented |
| SQL injection prevention | Supabase SDK uses parameterized queries exclusively — no raw SQL in client code | Implemented |
| Prompt injection detection | 12 regex patterns detect jailbreak attempts (e.g., "ignore previous instructions", "DAN mode") | Implemented |
| Prompt injection response | Flagged segments replaced with `[FILTERED]` before processing | Implemented |
| Object size limiting | `optionalRecord()` limits to 100 keys max | Implemented |

### Issues Found

| ID | Severity | Issue | Justification |
|----|----------|-------|---------------|
| INJ-1 | **Low** | Prompt injection patterns are regex-based | Sophisticated prompt injection attacks may bypass static regex patterns. Consider integrating an AI-based content classifier for higher assurance. However, the current implementation blocks common known patterns effectively. |

### Deduction Justification
- −1 for regex-only prompt injection detection (INJ-1). While comprehensive for known patterns, an adaptive/AI-based filter would provide stronger defense against novel prompt injection techniques relevant to AI-powered procurement analysis.

---

## Section 4: Data Protection & Privacy (PII/GDPR)

**Score: 8 / 10**

### What Was Evaluated
- PII anonymization (`supabase/functions/_shared/anonymizer.ts`)
- Data handling in AI pipelines
- GDPR compliance features
- Audit logging (`file_access_audit` table)

### Positive Findings

| Control | Implementation | Status |
|---------|---------------|--------|
| Two-mode PII anonymization | One-way masking (chat) + reversible anonymization (sentinel analysis) | Implemented |
| Comprehensive PII detection | Email, IBAN, credit card, phone, tax ID, company, person, price, contract, location | Implemented |
| False-positive protection | `COMMON_BUSINESS_TERMS` set prevents masking of benign terms | Implemented |
| Deterministic tokenization | Same value always gets same token within a session | Implemented |
| Confidence scoring | Dynamic confidence calculation penalizes missing detections | Implemented |
| File access audit | `file_access_audit` table logs upload/download/delete/denied events | Implemented |
| GDPR Article 32 compliance | Audit table explicitly commented as GDPR Article 32 compliance measure | Implemented |
| Context extraction | Surrounding context captured for debugging entity extraction | Implemented |

### Issues Found

| ID | Severity | Issue | Justification |
|----|----------|-------|---------------|
| DATA-1 | **Medium** | No data-at-rest encryption beyond Supabase defaults | Supabase provides encryption at rest for PostgreSQL, but no application-level encryption for highly sensitive fields (IBANs, contract values). |
| DATA-2 | **Low** | Reversible anonymization stores entity map in memory | The `entityMap` containing original PII values exists in Edge Function memory during processing. If logged or cached incorrectly, this could expose PII. |
| DATA-3 | **Low** | No data retention/purge policy visible in code | No automated purge of audit logs or expired user data. GDPR Article 17 (right to erasure) compliance unclear. |

### Deduction Justification
- −1 for missing application-level encryption for financial identifiers (DATA-1).
- −1 for no visible data retention policy (DATA-3) — important for GDPR compliance in EU procurement contexts.

---

## Section 5: API & Network Security

**Score: 6 / 10**

### What Was Evaluated
- CORS configuration (`supabase/functions/_shared/cors.ts`)
- Rate limiting (`supabase/functions/_shared/rate-limit.ts`)
- API authentication
- Transport security

### Positive Findings

| Control | Implementation | Status |
|---------|---------------|--------|
| Database-backed rate limiting | Per-user, per-endpoint limits with configurable windows | Implemented |
| Fail-closed mode | High-value endpoints deny on DB error | Implemented |
| Fail-open mode | Low-risk endpoints allow on DB error (pragmatic) | Implemented |
| Rate limit headers | `X-RateLimit-Remaining` and `X-RateLimit-Reset` in 429 responses | Implemented |
| Opportunistic cleanup | 1% chance per request to clean expired rate limit records | Implemented |
| Bearer token auth | All Edge Functions require valid JWT in Authorization header | Implemented |
| CSP on Edge Functions | `default-src 'none'; frame-ancestors 'none'` | Implemented |
| MIME sniffing prevention | `X-Content-Type-Options: nosniff` | Implemented |

### Issues Found

| ID | Severity | Issue | Justification |
|----|----------|-------|---------------|
| API-1 | **High** | `Access-Control-Allow-Origin: "*"` | The wildcard CORS origin allows any website to make credentialed requests to Edge Functions. This should be restricted to the application's domain(s) in production. An attacker's website could make API calls using a victim's session if combined with other vulnerabilities. |
| API-2 | **Medium** | No IP-based rate limiting | Rate limiting is user-ID-based only. Unauthenticated endpoints (if any exist) or brute-force login attempts are not rate-limited by IP. |
| API-3 | **Medium** | No request size limits on Edge Functions | No `Content-Length` validation before parsing. Large payloads could cause resource exhaustion in Edge Functions. The `requireString()` max of 50,000 chars helps but doesn't cover nested structures. |
| API-4 | **Low** | Missing security headers | No `Strict-Transport-Security` (HSTS), `X-Frame-Options`, or `Referrer-Policy` headers on Edge Function responses. |

### Deduction Justification
- −2 for wildcard CORS (API-1) — this is a significant production risk for an application handling financial data.
- −1 for no IP-based rate limiting (API-2).
- −1 for missing HSTS and other security headers (API-4).

---

## Section 6: File Upload & Storage Security

**Score: 9 / 10**

### What Was Evaluated
- Client-side file validation (`src/lib/file-validation.ts`)
- Magic bytes verification
- Storage path validation
- Server-side constraints
- File access audit

### Positive Findings

| Control | Implementation | Status |
|---------|---------------|--------|
| Extension whitelist | Only `.xlsx`, `.docx`, `.pdf` allowed | Implemented |
| MIME type validation | Validates `file.type` matches expected MIME for extension | Implemented |
| Magic bytes verification | Reads first 4 bytes to verify `%PDF` / `PK..` headers | Implemented |
| File size limit | 10MB maximum | Implemented |
| Empty file rejection | `file.size === 0` check | Implemented |
| Filename sanitization | `sanitizeFilename()` strips non-alphanumeric chars, limits to 100 chars | Implemented |
| Path traversal prevention | Database CHECK constraint enforces `{org_uuid}/{user_uuid}/{file_uuid}-{filename}` format via regex | Implemented |
| Storage cleanup on failure | If metadata insert fails, uploaded file is deleted from storage | Implemented |
| Org-scoped storage policies | RLS on `storage.objects` enforces org/user path matching | Implemented |
| File access audit logging | All upload/download/delete events logged to `file_access_audit` | Implemented |
| Download rate limiting | File downloads limited to 30 requests/hour (fail-closed) | Implemented |

### Issues Found

| ID | Severity | Issue | Justification |
|----|----------|-------|---------------|
| FILE-1 | **Low** | No server-side magic bytes validation | Magic bytes check runs client-side only. A crafted request bypassing the UI could upload a file with spoofed headers. The Supabase bucket MIME restrictions provide partial server-side coverage. |

### Deduction Justification
- −1 for client-side-only magic bytes validation (FILE-1). Adding server-side content inspection in the Edge Function would provide full defense-in-depth.

---

## Section 7: Client-Side Security (XSS / CSP / DOM)

**Score: 8 / 10**

### What Was Evaluated
- Content Security Policy (`index.html` meta tag)
- XSS vectors (`dangerouslySetInnerHTML`, `innerHTML`)
- Markdown rendering safety
- DOM manipulation patterns

### Positive Findings

| Control | Implementation | Status |
|---------|---------------|--------|
| Comprehensive CSP | `default-src 'self'`, `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`, `object-src 'none'`, `base-uri 'self'` | Implemented |
| Connect-src restriction | Limited to `self` and Supabase domain only | Implemented |
| Frame-src restriction | Only Supabase domain allowed | Implemented |
| Font source restriction | Only Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | Implemented |
| No `dangerouslySetInnerHTML` | Zero instances found in entire codebase | Confirmed |
| No `innerHTML` | Zero instances found in entire codebase | Confirmed |
| Safe markdown rendering | `react-markdown` with `remarkGfm` (does not render raw HTML by default) | Implemented |
| React auto-escaping | React's JSX auto-escapes interpolated values by default | Inherent |

### Issues Found

| ID | Severity | Issue | Justification |
|----|----------|-------|---------------|
| XSS-1 | **Medium** | `'unsafe-inline'` in `script-src` | CSP allows inline scripts, which weakens XSS protection. This is common in Vite/React apps due to build tooling but should be replaced with nonces or hashes in production. |
| XSS-2 | **Low** | `'unsafe-inline'` in `style-src` | Inline styles are allowed. Lower risk than inline scripts but still weakens CSP. Driven by Tailwind CSS and component library requirements. |

### Deduction Justification
- −1 for `unsafe-inline` in `script-src` (XSS-1) — a production deployment should use nonce-based CSP.
- −1 for `unsafe-inline` in `style-src` (XSS-2) — acceptable tradeoff for Tailwind but still a deviation from strict CSP.

---

## Section 8: Dependency & Supply Chain Security

**Score: 7 / 10**

### What Was Evaluated
- `package.json` dependencies (43 production, 14 dev)
- Known vulnerability patterns
- Dependency pinning strategy
- Build toolchain security

### Positive Findings

| Control | Implementation | Status |
|---------|---------------|--------|
| TypeScript strict mode | Type safety reduces class of runtime errors | Implemented |
| Lockfile present | `bun.lock` ensures reproducible builds | Implemented |
| Well-maintained dependencies | React 18, Vite 5, major Radix UI components | Current |
| ESLint configured | Code quality checks with React hooks and refresh plugins | Implemented |
| Vitest testing | Test framework configured with jsdom environment | Implemented |

### Issues Found

| ID | Severity | Issue | Justification |
|----|----------|-------|---------------|
| DEP-1 | **Medium** | `xlsx` package (v0.18.5) — SheetJS community edition | The SheetJS community edition (`xlsx`) has had past CVEs related to prototype pollution and arbitrary code execution via crafted spreadsheets. Users upload `.xlsx` files to EXOS, making this a relevant attack vector. Consider using the pro edition or implementing strict sandboxing. |
| DEP-2 | **Medium** | All dependencies use caret (`^`) ranges | Caret ranges allow automatic minor/patch updates which could introduce vulnerabilities through compromised packages. Consider using exact versions for production. |
| DEP-3 | **Low** | No automated dependency scanning visible | No `npm audit`, Snyk, Dependabot, or similar tool configuration found in the repository. |
| DEP-4 | **Low** | `html-to-image` (v1.11.13) | DOM-to-image libraries can have XSS vectors if rendering untrusted content. Usage should be reviewed for input sanitization. |

### Deduction Justification
- −1 for `xlsx` library risk with user-uploaded spreadsheets (DEP-1).
- −1 for no automated vulnerability scanning (DEP-3).
- −1 for permissive version ranges (DEP-2).

---

## Section 9: Error Handling & Information Disclosure

**Score: 7 / 10**

### What Was Evaluated
- User-facing error messages
- Console logging patterns
- Edge Function error responses
- Stack trace exposure

### Positive Findings

| Control | Implementation | Status |
|---------|---------------|--------|
| Generic user-facing errors | Most errors shown as "An unexpected error occurred" | Implemented |
| Structured validation errors | `ValidationError` class with safe messages (no stack traces) | Implemented |
| Generic file access errors | "Access denied" without path/user details | Implemented |
| Rate limit messages | Generic "Rate limit exceeded. Please try again later." | Implemented |
| 429 status codes | Proper HTTP status for rate limiting | Implemented |

### Issues Found

| ID | Severity | Issue | Justification |
|----|----------|-------|---------------|
| ERR-1 | **Medium** | 77+ `console.log`/`console.error` statements in source | Development logging may leak sensitive data in browser console. While not visible to end users in production builds, it could expose internal state during debugging sessions or if DevTools are open. |
| ERR-2 | **Medium** | Supabase error messages forwarded to UI | Auth error messages (e.g., `error.message` from Supabase) are displayed via toast notifications. These may reveal auth infrastructure details (e.g., "Email rate limit exceeded" reveals rate limiting configuration). |
| ERR-3 | **Low** | Edge Function error logging includes endpoint names | `console.error("Rate limit check failed:", countError)` and `console.warn("Rate limit fail-closed triggered for endpoint: ${endpoint}")` may leak endpoint names in server logs accessible to platform operators. |

### Deduction Justification
- −1 for excessive client-side console logging (ERR-1).
- −1 for forwarding raw Supabase auth errors to UI (ERR-2).
- −1 for verbose server-side logging (ERR-3).

---

## Section 10: Infrastructure & Configuration Security

**Score: 6 / 10**

### What Was Evaluated
- Supabase client configuration (`src/integrations/supabase/client.ts`)
- Environment variable management
- Build configuration
- Deployment security

### Positive Findings

| Control | Implementation | Status |
|---------|---------------|--------|
| Edge Functions use env vars for secrets | `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` — never in client code | Implemented |
| Private package | `"private": true` in `package.json` prevents accidental npm publish | Implemented |
| TypeScript compilation | Catches type errors at build time | Implemented |
| Vite build optimization | Production builds are minified and tree-shaken | Inherent |

### Issues Found

| ID | Severity | Issue | Justification |
|----|----------|-------|---------------|
| CFG-1 | **High** | Supabase URL and anon key hardcoded in source | `client.ts` contains hardcoded `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. While the anon key is designed to be public, hardcoding prevents per-environment configuration and makes key rotation require a code change + redeployment. The environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are declared in types but not used. |
| CFG-2 | **Medium** | No `.env.example` file | No documentation of required environment variables. New developers may miss configuring secrets, leading to misconfiguration. |
| CFG-3 | **Medium** | No `.gitignore` audit for secrets | No verification that `.env` files are excluded from version control. If a `.env` file were accidentally created, it might be committed. |
| CFG-4 | **Medium** | Supabase anon key visible in CSP `connect-src` and source | The Supabase project reference (`qczblwoaiuxgesjzxjvu`) is exposed in multiple places: CSP meta tag, client.ts, and potentially in network requests. This enables targeted attacks against the Supabase project. |

### Deduction Justification
- −2 for hardcoded Supabase credentials instead of using environment variables (CFG-1).
- −1 for missing `.env.example` (CFG-2).
- −1 for infrastructure exposure via hardcoded project references (CFG-4).

---

## Critical Remediation Priorities

### Priority 1 — Must Fix (High Severity)

| ID | Issue | Remediation |
|----|-------|-------------|
| API-1 | Wildcard CORS origin | Replace `"*"` with explicit allowed origins: `"Access-Control-Allow-Origin": "https://your-production-domain.com"`. Use environment variable for configurability. |
| CFG-1 | Hardcoded Supabase credentials | Replace hardcoded values with `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`. Add `.env` file with values. |

### Priority 2 — Should Fix (Medium Severity)

| ID | Issue | Remediation |
|----|-------|-------------|
| AUTH-1 | localStorage for sessions | Evaluate Supabase `cookieOptions` for `httpOnly` cookie-based session storage. Requires server-side middleware. |
| AUTH-2 | No MFA for admins | Enable Supabase MFA and enforce for `admin` / `super_admin` roles. |
| DEP-1 | `xlsx` library risk | Audit SheetJS usage, consider sandboxing spreadsheet parsing in a Web Worker, or evaluate alternative libraries. |
| ERR-2 | Raw Supabase errors in UI | Wrap Supabase error messages in a mapper that returns generic user-facing messages. |
| API-3 | No request size limits | Add `Content-Length` check in Edge Functions before parsing (e.g., reject bodies > 1MB). |

### Priority 3 — Good Practice (Low Severity)

| ID | Issue | Remediation |
|----|-------|-------------|
| API-4 | Missing HSTS/security headers | Add `Strict-Transport-Security`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` to Edge Function responses. |
| XSS-1 | `unsafe-inline` scripts | Configure Vite to use CSP nonces in production builds. |
| DEP-3 | No dependency scanning | Add GitHub Dependabot or `npm audit` to CI pipeline. |
| DATA-3 | No data retention policy | Implement automated purge of audit logs older than retention period (e.g., 90 days). |

---

## Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 18.3.1 |
| Language | TypeScript | 5.8.3 |
| Build Tool | Vite | 5.4.19 |
| Styling | Tailwind CSS | 3.4.17 |
| UI Components | Radix UI / shadcn/ui | Latest |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) | 2.99.0 |
| State Management | TanStack React Query | 5.83.0 |
| Form Validation | Zod + React Hook Form | 3.25.76 / 7.61.1 |
| PDF Generation | @react-pdf/renderer | 4.3.2 |
| Charts | Recharts | 2.15.4 |
| Routing | React Router DOM | 6.30.1 |
| Testing | Vitest + Testing Library | 3.2.4 / 16.0.0 |

---

## Scoring Methodology

Each section is scored on a **0–10 scale** using the following criteria:

| Score Range | Interpretation |
|-------------|---------------|
| 9–10 | Excellent — industry best practices fully implemented |
| 7–8 | Good — solid implementation with minor improvements needed |
| 5–6 | Adequate — functional but significant gaps exist |
| 3–4 | Poor — multiple critical issues require immediate attention |
| 0–2 | Critical — fundamental security controls missing |

**Deduction rules:**
- **High severity issue:** −2 points
- **Medium severity issue:** −1 point
- **Low severity issue:** −0.5 points (rounded)
- **Maximum deduction per section:** −5 points (floor at 5/10 for any section with working controls)

---

## Appendix A: Files Reviewed

```
src/integrations/supabase/client.ts
src/pages/Auth.tsx
src/components/ProtectedRoute.tsx
src/components/auth/AuthPrompt.tsx
src/hooks/useUser.ts
src/hooks/useAdminAuth.ts
src/hooks/useUserFiles.ts
src/lib/file-validation.ts
src/lib/input-evaluator/
src/components/enterprise/FileUploadZone.tsx
src/components/ui/MarkdownRenderer.tsx
src/App.tsx
index.html
package.json
vite.config.ts
supabase/functions/_shared/cors.ts
supabase/functions/_shared/auth.ts
supabase/functions/_shared/validate.ts
supabase/functions/_shared/rate-limit.ts
supabase/functions/_shared/anonymizer.ts
supabase/migrations/20260311205527_file_security_hardening.sql
supabase/migrations/20260305185732_baseline_schema.sql
supabase/migrations/20260310124845_create_rate_limits.sql
supabase/migrations/20260310130000_add_super_admin.sql
```

## Appendix B: Methodology

This assessment was performed through static analysis of the source code, configuration files, database migrations, and Edge Function implementations. No dynamic testing (penetration testing, fuzzing) was performed. Findings are based on code review patterns and known vulnerability classes from OWASP Top 10 (2021) and CWE/SANS Top 25.

---

*End of Report*
