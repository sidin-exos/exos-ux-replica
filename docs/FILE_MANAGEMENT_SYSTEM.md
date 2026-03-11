# EXOS File Management System — Technical & Business Documentation

> Last updated: 2026-03-11
> Status: Production-ready
> Author: Engineering Team

---

## Table of Contents

1. [Business Context](#1-business-context)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Schema](#3-database-schema)
4. [Storage Layer](#4-storage-layer)
5. [Upload Flow — End to End](#5-upload-flow--end-to-end)
6. [Download Flow — End to End](#6-download-flow--end-to-end)
7. [Scenario File Attachment Flow](#7-scenario-file-attachment-flow)
8. [Search, Filter & Pagination](#8-search-filter--pagination)
9. [Security Architecture (Defense in Depth)](#9-security-architecture-defense-in-depth)
10. [File Inventory](#10-file-inventory)
11. [Decision Log](#11-decision-log)
12. [Known Limitations & Future Work](#12-known-limitations--future-work)

---

## 1. Business Context

### Problem

EXOS is a B2B procurement analytics SaaS. Enterprise users run scenario analyses (tariff simulations, supply-chain disruptions, market snapshots). These analyses are more accurate when enriched with the customer's own data — supplier contracts (PDF), price lists (Excel), internal reports (Word).

Without a file management system, users would need to manually copy-paste data into text fields, losing formatting, tables, and the ability to reference original documents.

### Solution

A complete file import, storage, and scenario attachment system that allows users to:

1. **Upload** Excel (.xlsx), Word (.docx), and PDF (.pdf) documents up to 10MB
2. **Manage** uploaded files — view, search, filter by type, paginate, download, delete (single and bulk)
3. **Attach** files to scenario analysis runs as supporting context
4. **Download** files securely via time-limited signed URLs with full audit logging

### Business Requirements Met

| Requirement | Implementation |
|---|---|
| Multi-tenant isolation | Organization-scoped RLS on every table and storage bucket |
| Compliance/audit trail | `file_access_audit` table logs every download with user, IP, user-agent (GDPR Art. 32) |
| Admin visibility | Org admins see all files in their org; super admins see all orgs |
| Enterprise file types | Excel, Word, PDF — the three most common B2B document formats |
| Usability at scale | Server-side search, type filtering, pagination (10 files/page) |
| Data integrity | Files are immutable (no UPDATE policy); cascade deletes clean up attachments |

---

## 2. Architecture Overview

```
                    +-----------------------+
                    |   React Frontend      |
                    |   (Account Page /     |
                    |    Scenario Wizard)   |
                    +-----------+-----------+
                                |
            +-------------------+-------------------+
            |                   |                   |
     Upload (direct)    Download (Edge Fn)    Query (RLS)
            |                   |                   |
    +-------v-------+  +-------v--------+  +-------v-------+
    | Supabase       |  | file-download  |  | user_files    |
    | Storage Bucket |  | Edge Function  |  | table (RLS)   |
    | "user-files"   |  | (Deno)         |  +-------+-------+
    | (private)      |  +-------+--------+          |
    +-------+--------+         |            +-------v-----------+
            |                  |            | scenario_file_    |
            |           +------v------+     | attachments (RLS) |
            |           | file_access |     +-------------------+
            |           | _audit      |
            |           +-------------+
            |
    +-------v------------------------+
    | Storage Policies (RLS)         |
    | org_id/user_id path isolation  |
    +--------------------------------+
```

### Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + TypeScript + TanStack Query | Type safety, optimistic updates, cache invalidation |
| UI | shadcn/ui + Tailwind CSS | Consistent design system, responsive |
| Backend | Supabase (PostgreSQL + Storage + Edge Functions) | RLS for multi-tenancy, S3-compatible storage, serverless functions |
| Edge Function Runtime | Deno | Supabase native, secure sandbox |
| State Management | React Query (`useQuery`/`useMutation`) | Server state with caching, `keepPreviousData` for smooth pagination |

---

## 3. Database Schema

### 3.1 `user_files` — File Metadata

**Migration:** `20260311203102_create_user_files.sql`

```sql
CREATE TABLE public.user_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    file_type       TEXT NOT NULL CHECK (file_type IN ('xlsx', 'docx', 'pdf')),
    mime_type       TEXT NOT NULL CHECK (mime_type IN (
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
    )),
    file_size       INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
    storage_path    TEXT NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Design decisions:**

- **No UPDATE policy.** Files are immutable — users upload a new version rather than overwriting. This prevents race conditions and simplifies audit trails.
- **`file_size` CHECK constraint (1 byte — 10MB).** Enforced at DB level as a final safety net even though client and storage bucket also validate.
- **`mime_type` CHECK constraint.** Whitelist of exactly 3 MIME types. Any other MIME type is rejected at the database level, even if client validation is bypassed.
- **`storage_path` UNIQUE.** Prevents duplicate file entries pointing to the same storage object.
- **`ON DELETE CASCADE` on `user_id`.** When a user is deleted from auth, all their file metadata is automatically cleaned up.
- **`ON DELETE CASCADE` on `organization_id`.** When an org is deleted, all files belonging to that org are removed.
- **`auto_set_organization_id` trigger.** On INSERT, automatically sets `organization_id` from the user's profile. The client doesn't need to (and can't) specify which org the file belongs to.

**Indexes:**

| Index | Purpose |
|---|---|
| `idx_user_files_org` | Fast org-scoped queries (RLS uses this on every SELECT) |
| `idx_user_files_user` | Fast user-specific queries |

**RLS Policies (3):**

| Policy | Operation | Rule |
|---|---|---|
| `select_own_or_admin_in_org` | SELECT | Super admin bypasses all; otherwise: same org AND (own files OR org admin) |
| `insert_own_in_org` | INSERT | `auth.uid() = user_id` AND `organization_id = get_user_org_id(auth.uid())` |
| `delete_own_in_org` | DELETE | Same as INSERT — users can only delete their own files |

### 3.2 `scenario_file_attachments` — Junction Table

```sql
CREATE TABLE public.scenario_file_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    file_id         UUID NOT NULL REFERENCES public.user_files(id) ON DELETE CASCADE,
    scenario_type   TEXT NOT NULL,
    scenario_run_id TEXT NOT NULL,
    attached_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(file_id, scenario_run_id)
);
```

**Design decisions:**

- **`UNIQUE(file_id, scenario_run_id)`.** Prevents attaching the same file to the same scenario run twice.
- **`ON DELETE CASCADE` on `file_id`.** When a file is deleted from `user_files`, all its scenario attachments are automatically removed. No orphaned references.
- **`scenario_type` column.** Stores the type of scenario (tariff, disruption, etc.) — useful for analytics and filtering.
- **`scenario_run_id` is TEXT, not UUID.** Scenario runs may use external IDs or composite keys that aren't UUIDs.

**RLS Policies:** Mirror `user_files` — same org isolation, own files + admin visibility, insert/delete own only.

### 3.3 `file_access_audit` — Compliance Logging

**Migration:** `20260311205527_file_security_hardening.sql`

```sql
CREATE TABLE public.file_access_audit (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id         UUID REFERENCES public.user_files(id) ON DELETE SET NULL,
    accessed_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('upload', 'download', 'delete', 'denied')),
    status          TEXT NOT NULL CHECK (status IN ('success', 'denied', 'error')),
    error_message   TEXT,
    ip_address      TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Design decisions:**

- **`ON DELETE SET NULL` on `file_id`.** When a file is deleted, audit records are preserved (with `file_id = NULL`). This is critical for compliance — you can't lose audit history when files are removed.
- **`organization_id` is TEXT, not UUID FK.** The audit table needs to record the org even if the user typed "unknown" — it's for forensic logging, not referential integrity.
- **`ip_address` and `user_agent` columns.** Captured from request headers in the Edge Function. Essential for incident investigation.
- **No INSERT policy for `authenticated` role.** Only `service_role` (Edge Functions) can write audit records. Regular users cannot fabricate or tamper with audit logs.
- **SELECT policy:** Only `super_admin` or `org_admin` within the org can read audit logs.

**Indexes:**

| Index | Purpose |
|---|---|
| `idx_file_audit_org_time` | Org-scoped time-ordered audit queries (admin dashboard) |
| `idx_file_audit_file` | Find all access events for a specific file |
| `idx_file_audit_user` | Find all access events by a specific user |

### 3.4 `storage_path` Format Constraint

```sql
ALTER TABLE public.user_files
    ADD CONSTRAINT chk_storage_path_format
    CHECK (storage_path ~ '^[0-9a-f]{8}-...-[0-9a-f]{12}/[0-9a-f]{8}-...-[0-9a-f]{12}/[0-9a-f]{8}-...-[0-9a-f]{12}-[a-zA-Z0-9._-]+$');
```

**Why:** This regex enforces the exact `{org_uuid}/{user_uuid}/{file_uuid}-{filename}` format at the database level. Even if a client somehow crafts a malicious path like `../../etc/passwd`, the CHECK constraint will reject it. This is the deepest layer of path traversal prevention.

---

## 4. Storage Layer

### Bucket Configuration

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-files',
    'user-files',
    false,                -- Private: no public URLs
    10485760,             -- 10MB hard limit
    ARRAY[
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
    ]
);
```

**Why private:** Files are never served via public URLs. Every download goes through the `file-download` Edge Function, which verifies org membership, applies rate limiting, and logs the access. This prevents URL guessing/sharing attacks.

### Storage Path Structure

```
user-files/
  {org_uuid}/
    {user_uuid}/
      {file_uuid}-{sanitized_filename}
```

**Example:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890/f9e8d7c6-b5a4-3210-fedc-ba0987654321/c1d2e3f4-a5b6-7890-cdef-012345678901-Q1_Supplier_Pricing.xlsx`

**Why this structure:**

1. **Org isolation (folder 1).** Even at the filesystem level, org A's files are physically separated from org B's files.
2. **User isolation (folder 2).** Within an org, each user has their own folder.
3. **UUID prefix (folder 3).** Prevents filename collisions — two users uploading `report.pdf` get different storage paths.
4. **Sanitized filename.** Human-readable in storage browser, but safe — special characters replaced with `_`, truncated to 100 chars.

### Storage Policies (3)

| Policy | Operation | Rule |
|---|---|---|
| `user_upload_own_folder` | INSERT | Bucket = `user-files` AND folder[1] = user's org AND folder[2] = user's ID |
| `user_select_own_org` | SELECT | Super admin bypasses; otherwise: folder[1] = user's org AND (folder[2] = user's ID OR org admin) |
| `user_delete_own_files` | DELETE | folder[1] = user's org AND folder[2] = user's ID |

These use `storage.foldername(name)` to extract path segments and `get_user_org_id(auth.uid())` to check org membership — the same helper functions used by table-level RLS.

---

## 5. Upload Flow — End to End

```
User selects file(s) → FileUploadZone → UserFilesManager.handleUpload()
                                              |
                        +---------------------+---------------------+
                        |                     |                     |
                   Layer 1:              Layer 2:              Layer 3:
                   Extension +           Magic Bytes           Supabase
                   MIME + Size           Validation            Bucket
                   (client)              (client)              (server)
                        |                     |                     |
                        +---------------------+---------------------+
                                              |
                                    Build storage path
                                    {org_id}/{user_id}/{uuid}-{name}
                                              |
                                    Path traversal check (client)
                                              |
                                    supabase.storage.upload()
                                              |
                                    INSERT into user_files
                                    (trigger sets org_id)
                                              |
                                    CHECK constraints validate
                                    (file_type, mime_type, file_size, storage_path format)
                                              |
                                    Storage policy validates
                                    (path matches org/user)
                                              |
                                       SUCCESS → toast + cache invalidate
                                       FAILURE → storage.remove() cleanup
```

### Validation Layers (5 deep)

| Layer | Where | What | Why |
|---|---|---|---|
| 1. Extension check | Client (`validateFile`) | `.xlsx`, `.docx`, `.pdf` only | Fast reject of wrong file types |
| 2. MIME type check | Client (`validateFile`) | Matches extension to browser-reported MIME | Catches renamed files (e.g., `.exe` renamed to `.pdf`) |
| 3. Magic bytes check | Client (`validateMagicBytes`) | First 4 bytes match expected signature: `%PDF` (0x25504446) for PDF, `PK..` (0x504B0304) for XLSX/DOCX | Catches MIME spoofing — even if you rename a malicious file to `.pdf` and fake the MIME type, the actual file content won't start with `%PDF` |
| 4. Bucket MIME restriction | Server (Supabase Storage) | `allowed_mime_types` on bucket config | Server-side enforcement — client validation can be bypassed |
| 5. DB CHECK constraints | Server (PostgreSQL) | `file_type IN (...)`, `mime_type IN (...)`, `file_size <= 10MB`, `storage_path ~ regex` | Final safety net — even if storage and client are both bypassed |

### Filename Sanitization

```typescript
// src/lib/file-validation.ts
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")  // Replace special chars with underscore
    .replace(/_{2,}/g, "_")             // Collapse consecutive underscores
    .slice(0, 100);                     // Truncate to 100 characters
}
```

**Why:** Prevents path injection via filenames (e.g., `../../etc/passwd`), null byte injection (`file%00.pdf`), and excessively long names that could cause storage issues.

### Path Traversal Prevention (Client-Side)

```typescript
// src/hooks/useUserFiles.ts — upload mutation
const pathParts = storagePath.split("/");
if (
  pathParts.length !== 3 ||
  pathParts[0] !== profile.organization_id ||
  pathParts[1] !== currentUser.id ||
  storagePath.includes("..") ||
  storagePath.includes("//") ||
  storagePath.includes("\x00")
) {
  throw new Error("Invalid storage path");
}
```

This is defense-in-depth. Even though `sanitizeFilename` already strips `..` and `/`, this explicit check ensures the constructed path has exactly the expected structure before uploading.

### Upload Atomicity

```typescript
// If metadata INSERT fails, clean up the uploaded file
const { data, error } = await supabase.from("user_files").insert(row).select().single();
if (error) {
  await supabase.storage.from("user-files").remove([storagePath]);
  throw error;
}
```

**Why:** Without this, a failed metadata insert would leave an orphaned file in storage that no database record points to. The cleanup ensures we never have storage without metadata.

---

## 6. Download Flow — End to End

```
User clicks Download → handleDownload(file)
                            |
                    getDownloadUrl(fileId)
                            |
                    supabase.auth.getSession()
                    → extract access_token
                            |
                    fetch(POST /functions/v1/file-download)
                    Headers: Authorization: Bearer {jwt}
                             apikey: {anon_key}
                    Body: { file_id: uuid }
                            |
                +-----------v-----------+
                |   Edge Function       |
                |   file-download       |
                +-----------+-----------+
                            |
              1. auth.getUser(token) → validate JWT
              2. checkRateLimit(userId, 30/hour, fail-closed)
              3. Validate file_id is UUID format
              4. Lookup file metadata (service_role, bypasses RLS)
              5. getUserOrgId(userId) → verify org membership
              6. Generate signed URL (60s expiry, Content-Disposition: attachment)
              7. Log to file_access_audit (success or denied)
                            |
                    Return { signedUrl: "..." }
                            |
                    Browser creates <a> element
                    a.href = signedUrl
                    a.download = file_name
                    a.click() → triggers download
```

### Why an Edge Function for Downloads (Not Direct Storage Access)

| Direct Storage URL | Edge Function |
|---|---|
| No audit logging | Every download logged with user, IP, user-agent |
| No rate limiting | 30 downloads/hour per user |
| URL can be shared (valid for duration) | URL expires in 60 seconds |
| Only checks storage RLS | Double-checks org membership at application level |
| No denied-access logging | Failed attempts logged for security monitoring |

**Business decision:** For a B2B SaaS handling procurement data, audit logging is non-negotiable. The slight latency overhead (~200ms for the Edge Function) is acceptable for the security and compliance benefits.

### Why `fetch()` Instead of `supabase.functions.invoke()`

```typescript
// This is what we use (works reliably):
const res = await fetch(`${supabaseUrl}/functions/v1/file-download`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
    apikey: supabaseKey,
  },
  body: JSON.stringify({ file_id: fileId }),
});
```

**Why not `supabase.functions.invoke()`:** During implementation, we discovered that `supabase.functions.invoke()` in `@supabase/supabase-js` v2 does not reliably send the `Authorization` header. This was confirmed by checking the Supabase Invocations tab — requests showed no Authorization header even though a valid session existed. Direct `fetch` with explicit headers is the workaround.

### Why `auth.getUser(token)` Instead of `createClient` with Headers

Inside the Edge Function:

```typescript
// WORKS — validates token server-side:
const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data: { user } } = await authClient.auth.getUser(token);

// DOES NOT WORK in Edge Functions:
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${token}` } }
});
const { data: { user } } = await client.auth.getUser(); // "Auth session missing!"
```

**Why:** `getUser()` without a token argument tries to read from a session that doesn't exist in the Deno Edge Function runtime. Passing the token directly to `getUser(token)` performs server-side JWT validation without needing a session.

### Signed URL Security

```typescript
const { data: signedUrlData } = await serviceClient.storage
  .from("user-files")
  .createSignedUrl(file.storage_path, 60, {
    download: file.file_name,  // Sets Content-Disposition: attachment
  });
```

| Property | Value | Why |
|---|---|---|
| Expiry | 60 seconds | Minimal window — just enough for download to start |
| `download` option | Forces `Content-Disposition: attachment` | Prevents browser from rendering the file inline (XSS vector for PDFs/HTML) |
| Single use? | No (Supabase limitation) | Mitigated by 60s expiry + rate limiting |

### Rate Limiting

```typescript
// 30 downloads per hour, fail-closed
const rateCheck = await checkRateLimit(userId, "file-download", 30, 60, { failClosed: true });
```

**Fail-closed:** If the rate limit database query fails (network issue, table missing), the download is **denied**. For a high-value endpoint that provides access to customer documents, it's safer to temporarily block access than to allow unlimited downloads during an infrastructure issue.

**Implementation:** Database-backed (`rate_limits` table), per-user per-endpoint. Counts requests in a sliding window. Includes opportunistic cleanup (1% chance per request to purge old records).

---

## 7. Scenario File Attachment Flow

```
ScenarioFileAttachment component (in wizard)
    |
    User checks files from paginated list
    → selectedFileIds state (string[])
    |
    Wizard submits → useScenarioFileAttachments.attachFiles({
        runId: "scenario-run-uuid",
        scenarioType: "tariff_impact",
        fileIds: ["file-1-uuid", "file-2-uuid"]
    })
    |
    1. Verify file ownership (SELECT from user_files with RLS)
       → If any file not found or unauthorized → throw
    2. Bulk INSERT into scenario_file_attachments
    3. auto_set_organization_id trigger fires
    4. RLS WITH CHECK validates user_id + org_id
    |
    SUCCESS → cache invalidate
```

### Ownership Verification Before Attachment

```typescript
// src/hooks/useScenarioFileAttachments.ts
const { data: ownedFiles } = await supabase
  .from("user_files")
  .select("id")
  .in("id", fileIds);

const ownedIds = new Set(ownedFiles.map(f => f.id));
const unauthorized = fileIds.filter(id => !ownedIds.has(id));
if (unauthorized.length > 0) {
  throw new Error("One or more files not found or unauthorized");
}
```

**Why:** RLS on `user_files` already restricts SELECT to the user's org. By querying `user_files` with the file IDs, any file that doesn't exist or belongs to another org will simply not appear in results. This is a clean way to verify ownership without exposing which files exist globally.

### Cascade Delete Behavior

When a file is deleted from `user_files`:
- `scenario_file_attachments` rows with that `file_id` are automatically deleted (`ON DELETE CASCADE`)
- Storage object is deleted explicitly in the `deleteFile` mutation
- No orphaned attachments can exist

---

## 8. Search, Filter & Pagination

### Architecture

```
                     searchInput (raw)
                          |
                   useDebounce(300ms)
                          |
                   debouncedSearch
                          |
            +-------------+-------------+
            |                           |
     useUserFiles({                useUserFiles({
       search: "...",                search: "...",
       fileType: "xlsx",             fileType: null,
       page: 2,                      paginate: false
       pageSize: 10,             })
       paginate: true            |
     })                      ScenarioFileAttachment
            |                (collapsible, max 50)
     UserFilesManager
     (table + pagination)
```

### Server-Side Filtering (Why Not Client-Side)

```typescript
let query = supabase.from("user_files").select("*", { count: "exact" });

if (search) {
  query = query.ilike("file_name", `%${search}%`);  // Case-insensitive LIKE
}
if (fileType) {
  query = query.eq("file_type", fileType);            // Exact match
}
if (paginate) {
  query = query.range(from, to);                      // Offset pagination
} else {
  query = query.limit(50);                            // Capped for non-paginated views
}
```

**Why server-side:**
1. **Data volume.** An enterprise user might have 100+ files. Fetching all to filter client-side wastes bandwidth and memory.
2. **Accurate counts.** `.select('*', { count: 'exact' })` returns `totalCount` for pagination without fetching all rows.
3. **RLS still applies.** Server-side filtering works within the user's org-scoped view.
4. **Consistent between views.** Both `UserFilesManager` (paginated) and `ScenarioFileAttachment` (capped at 50) use the same hook with different options.

### Query Key Design

```typescript
queryKey: [...QUERY_KEY, { search, fileType, page, pageSize, paginate }]
// Example: ["user_files", { search: "report", fileType: "xlsx", page: 0, pageSize: 10, paginate: true }]
```

**Why:** React Query uses the query key for caching and invalidation. By including all filter parameters in the key:
- Different filter combinations are cached independently
- `invalidateQueries({ queryKey: ["user_files"] })` invalidates ALL sub-keys (used after upload/delete)
- `keepPreviousData` shows the old page while the new one loads

### Debounce (300ms)

```typescript
// src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

**Why 300ms:** Standard UX tradeoff — fast enough to feel responsive, slow enough to avoid firing a database query on every keystroke. At 60 WPM, a user types ~5 characters/second, so 300ms batches 1-2 keystrokes.

### UI States

| State | UserFilesManager | ScenarioFileAttachment |
|---|---|---|
| Loading | Centered spinner | Component hidden (returns null) |
| No files, no filters | "No files uploaded yet" + upload prompt | Component hidden (returns null) |
| No results, active filters | "No files match your search" + Clear Filters button | "No matching files" text |
| Results | Table with checkboxes + pagination | Checkbox list + pagination |

### Page/Selection Reset Logic

```typescript
// Reset page and selection when filters change
useEffect(() => {
  setPage(0);
  setSelectedIds(new Set());
}, [debouncedSearch, fileType]);

// Clear selection when page changes
onPageChange={(p) => {
  setPage(p);
  setSelectedIds(new Set());
}}
```

**Why:** If a user is on page 3, selects 2 files, then changes the search query — the selected file IDs may no longer exist in the new result set. Resetting prevents invisible phantom selections.

---

## 9. Security Architecture (Defense in Depth)

### Threat Model

| Threat | Layer(s) | Mitigation |
|---|---|---|
| **Malicious file upload** (malware disguised as PDF) | Client (magic bytes), Server (MIME whitelist) | 3-layer validation: extension → MIME type → magic bytes. Storage bucket enforces MIME whitelist. |
| **Path traversal** (`../../etc/passwd`) | Client (sanitize + check), Server (regex constraint) | `sanitizeFilename` strips special chars. Path structure check validates 3 segments. DB `chk_storage_path_format` regex rejects invalid paths. |
| **Cross-org data access** | RLS (tables + storage), Edge Function (org check) | Every query filters by `organization_id`. Storage policies check folder structure. Edge Function verifies org membership before generating signed URL. |
| **Brute force downloads** | Edge Function (rate limit) | 30 requests/hour per user, fail-closed. |
| **URL sharing/leaking** | Signed URL (60s expiry) | URLs expire in 60 seconds. `Content-Disposition: attachment` prevents inline rendering. |
| **XSS via file rendering** | Download flow (forced download) | `download` option on signed URL forces browser to save file, not render it. CSP headers block inline content. |
| **Audit log tampering** | RLS (no INSERT for authenticated) | Only `service_role` can write to `file_access_audit`. Regular users have SELECT-only access (admins only). |
| **MIME type spoofing** | Client (magic bytes validation) | Even if browser reports wrong MIME, actual file bytes are checked against known signatures. |
| **Null byte injection** | Client (path check) | Explicit `storagePath.includes("\x00")` check rejects null bytes. |
| **Prompt injection** (in AI context) | Edge Function (filter) | `filterPromptInjection()` in `_shared/validate.ts` scans text for injection patterns. |
| **Formula injection** (in exports) | Export layer | `sanitizeTableCell()` in `report-export-word.ts` prefixes `=+\-@` cells with apostrophe. |
| **Unauthorized scenario attachment** | Application (ownership check) | `attachFiles` mutation queries `user_files` with RLS to verify all files belong to user's org before attachment. |

### CORS & Security Headers

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ...",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
};
```

| Header | Purpose |
|---|---|
| `Content-Security-Policy: default-src 'none'` | Edge Function responses can't load any resources — prevents XSS even if response is somehow rendered |
| `frame-ancestors 'none'` | Prevents clickjacking via iframes |
| `X-Content-Type-Options: nosniff` | Prevents browser from MIME-sniffing response as HTML |
| `Cache-Control: no-store` | Signed URLs are never cached |

### Role Hierarchy

```
super_admin  →  Can see ALL orgs' files, audit logs
    |
org_admin    →  Can see all files within own org
    |
regular user →  Can see only own files
```

This hierarchy is enforced consistently across:
- Table RLS policies (`is_super_admin()`, `is_org_admin()`)
- Storage policies (same helper functions)
- Audit log visibility (super_admin + org_admin only)

### Input Validation (Edge Function)

```typescript
// supabase/functions/_shared/validate.ts
fileId = requireString(body.file_id, "file_id", { maxLength: 36, minLength: 36 });
if (!UUID_REGEX.test(fileId)) {
  throw new ValidationError("file_id must be a valid UUID");
}
```

Every Edge Function input is:
1. **Type-checked** — must be a string, not object/array/null
2. **Length-bounded** — min/max lengths prevent resource exhaustion
3. **Format-validated** — UUID regex, enum checks
4. **JSON-parsed safely** — `parseBody()` rejects non-object bodies

---

## 10. File Inventory

### Frontend Components

| File | Lines | Purpose |
|---|---|---|
| `src/components/files/UserFilesManager.tsx` | ~430 | Main file manager — upload, table, search, filter, pagination, bulk/single delete, download |
| `src/components/files/FileSearchFilterBar.tsx` | ~50 | Reusable search input + type filter pills (All/Excel/Word/PDF) |
| `src/components/files/FilePagination.tsx` | ~45 | Reusable prev/next pagination with "Showing X-Y of Z" |
| `src/components/enterprise/FileUploadZone.tsx` | ~108 | Drag-and-drop upload zone with file preview list |
| `src/components/scenarios/ScenarioFileAttachment.tsx` | ~124 | Collapsible file picker for scenario wizard with search/filter/pagination |

### Hooks

| File | Lines | Purpose |
|---|---|---|
| `src/hooks/useUserFiles.ts` | ~293 | Core hook: query (with search/filter/pagination), upload mutation, delete mutation, download URL |
| `src/hooks/useScenarioFileAttachments.ts` | ~114 | Scenario attachment CRUD: fetch, bulk attach, detach |
| `src/hooks/useDebounce.ts` | ~12 | Generic debounce hook for search input |

### Libraries

| File | Lines | Purpose |
|---|---|---|
| `src/lib/file-validation.ts` | ~114 | Extension, MIME, size, magic bytes validation + filename sanitization + display helpers |

### Edge Functions

| File | Lines | Purpose |
|---|---|---|
| `supabase/functions/file-download/index.ts` | ~180 | Secure download: auth, rate limit, org check, signed URL, audit log |
| `supabase/functions/_shared/auth.ts` | ~113 | JWT validation, admin checks, org ID lookup |
| `supabase/functions/_shared/cors.ts` | ~11 | CORS + security headers |
| `supabase/functions/_shared/rate-limit.ts` | ~98 | Database-backed per-user rate limiting |
| `supabase/functions/_shared/validate.ts` | ~178 | Input validation, prompt injection filtering |

### Migrations

| File | Purpose |
|---|---|
| `supabase/migrations/20260311203102_create_user_files.sql` | Tables, triggers, RLS, storage bucket, storage policies |
| `supabase/migrations/20260311205527_file_security_hardening.sql` | Audit table, super admin bypass, path format constraint |

---

## 11. Decision Log

| # | Decision | Alternatives Considered | Why This Choice |
|---|---|---|---|
| 1 | Private storage bucket + Edge Function for downloads | Public bucket with signed URLs directly | Audit logging, rate limiting, org membership verification — all impossible with direct signed URLs |
| 2 | 3 file types only (xlsx, docx, pdf) | Allow CSV, images, ZIP | Minimize attack surface. CSV has formula injection risks. Images/ZIP have complex MIME types. These 3 cover 95% of B2B procurement documents. |
| 3 | 10MB limit | 50MB or unlimited | Supabase free tier limitation + most procurement docs are under 5MB. Can increase later. |
| 4 | Magic bytes validation on client | Server-side magic bytes in Edge Function | Client-side is faster feedback. Server-side would require reading the file in the Edge Function, adding latency and memory pressure. |
| 5 | `fetch()` for Edge Function calls | `supabase.functions.invoke()` | `invoke()` has a confirmed bug where Authorization headers are not sent reliably in v2. Direct `fetch` works. |
| 6 | `auth.getUser(token)` in Edge Functions | `createClient` with global Authorization header | The header approach causes "Auth session missing!" in Deno runtime. Passing token directly works. |
| 7 | Fail-closed rate limiting for downloads | Fail-open | Downloads provide access to sensitive B2B data. Better to temporarily block downloads during an infrastructure issue than to allow unlimited access. |
| 8 | Server-side search/filter/pagination | Client-side filtering | Data volume (100+ files per user possible), accurate counts for pagination, consistent behavior across components. |
| 9 | `keepPreviousData` for pagination | Loading spinner on page change | Smoother UX — old data stays visible while new page loads. Prevents layout shift. |
| 10 | Files are immutable (no UPDATE) | Allow file replacement | Simpler audit trail, no race conditions, no partial-update states. Users upload a new version instead. |
| 11 | `ON DELETE SET NULL` on audit `file_id` | CASCADE or restrict | Audit records must survive file deletion for compliance. |
| 12 | Anchor element click for download | `window.open(url, "_blank")` | `window.open` opens a new tab that immediately closes (because Content-Disposition: attachment). Anchor click downloads directly. |
| 13 | Debounce at 300ms | 150ms or 500ms | 300ms is the standard sweet spot — responsive but doesn't fire on every keystroke. |
| 14 | Sequential bulk delete (not parallel) | `Promise.all()` for parallel deletes | Sequential is safer — if the 3rd of 10 deletes fails, we stop and report. Parallel could have cascading failures. Also avoids overwhelming the database with concurrent deletes. |

---

## 12. Known Limitations & Future Work

| Item | Status | Notes |
|---|---|---|
| Supabase generated types don't include `user_files`, `scenario_file_attachments`, `file_access_audit` | Known | Types need regeneration with `supabase gen types`. Currently using `as unknown as UserFile[]` casts. |
| `_shared/auth.ts` `authenticateRequest()` uses old header-based pattern | Known | The `file-download` function uses `getUser(token)` directly. Other edge functions still use `authenticateRequest` which may fail under certain conditions. Should be updated to match. |
| No file preview | Future | Could add PDF thumbnail generation, Excel sheet preview. |
| No file versioning | Future | Currently immutable — new upload creates new file. Could add versioning with `parent_file_id` column. |
| No virus scanning | Future | Could integrate ClamAV or a cloud scanning API as a pre-upload step. |
| Signed URLs are not single-use | Supabase limitation | Mitigated by 60s expiry. True single-use would require a token-based proxy. |
| No file content indexing | Future | Could extract text from PDFs/DOCX for full-text search via `tsvector`. |
| Rate limit cleanup is probabilistic | By design | 1% chance per request to purge old records. Could add a scheduled cron job for deterministic cleanup. |
| Bulk delete is sequential | By design | Could be parallelized with `Promise.allSettled()` for better performance, but sequential is safer. |
