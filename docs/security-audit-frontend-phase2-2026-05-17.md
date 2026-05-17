# Frontend Security Audit — Phase 2 (Auth, Sessions & PII) — Verification

**Date:** 2026-05-17
**Mode:** READ-ONLY verification.
**Scope:** Authentication, session management, role mutations, PII handling under `src/`.

---

## Task 1 — Sentry PII Leakage (Audit Issue #9)

### Finding: CONFIRMED OPEN — bytewise unchanged

**File:** `src/components/SentryUserSync.tsx:10`

```tsx
useEffect(() => {
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });   // ← line 10
  } else {
    Sentry.setUser(null);
  }
}, [user]);
```

`Sentry.setUser` is invoked exactly once. The only other `setUser` references in `src/` are unrelated React state setters (`useUser.ts`, `Account.tsx`). Every error event, breadcrumb, and trace dispatched after sign-in carries the user's real email as a top-level Sentry tag.

Logout correctly clears via `Sentry.setUser(null)`.

No `beforeSend` PII scrub elsewhere and no consent gating. The product positions itself as "GDPR-native" — this is a compliance gap, not just a privacy hygiene one.

---

## Task 2 — Client-Side ID / Role Spoofing (Audit Issues #7 & #8)

### 2.1 `ProtectedRoute.tsx` — `_user_id` parameter still client-controlled (Issue #7)

**Finding: CONFIRMED OPEN — bytewise unchanged**

**File:** `src/components/ProtectedRoute.tsx:27-28`

```tsx
if (requireAdmin || requireSuperAdmin) {
  const { data: roleData } = await supabase.rpc("is_super_admin", { _user_id: session.user.id });
  const { data: orgRole  } = await supabase.rpc("get_user_org_role", { _user_id: session.user.id });

  const superAdmin = roleData === true;
  setIsSuperAdmin(superAdmin);
  setIsAdmin(orgRole === "admin" || superAdmin);
}
```

Observations:
- `session.user.id` is read from the client-side session and sent as the `_user_id` argument to two `SECURITY DEFINER` SQL functions. The functions receive the parameter, not `auth.uid()`.
- Any authenticated user can replay or modify this RPC call (DevTools network panel) and pass an arbitrary UUID.
- The route gate is purely cosmetic; the real protection is RLS / SECURITY DEFINER RPCs on the database side.
- Exploitability is conditional on the SQL bodies. The 2026-05-17 backend audit confirmed that `is_super_admin(_user_id)` (`supabase/migrations/20260305195130_helper_functions.sql:31-84`) and `get_user_org_role(_user_id)` (`supabase/migrations/20260310130000_add_super_admin.sql:25-36`) use the parameter directly against `profiles`. Combined, this means:
  - the UI gate can be bypassed (low impact, cosmetic only);
  - any authenticated user can enumerate "is user X a super-admin?" or "what is user X's role in org Y?" by calling the SQL functions directly — the directory-harvest primitive flagged as backend H3 / #13.

Pairs with the open backend item; the frontend side is unchanged.

### 2.2 `useTeamMembers.updateRole` — direct unfiltered `profiles.role` UPDATE (Issue #8)

**Finding: CONFIRMED OPEN — bytewise unchanged**

**File:** `src/hooks/useTeamMembers.ts:33-40`

```ts
const updateRole = useMutation({
  mutationFn: async ({ memberId, role }: { memberId: string; role: "user" | "manager" | "admin" }) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role })            // ← line 37
      .eq("id", memberId);
    if (error) throw error;
  },
  ...
});
```

Observations:
- The mutation accepts any `memberId` (UUID) and any `role` value (`"user" | "manager" | "admin"`).
- No client-side check that:
  - `memberId` belongs to the caller's organization,
  - the caller is themselves admin / super-admin,
  - the target row is not the only remaining admin in its org.
- Server-side protection: `guard_profile_update` (`supabase/migrations/20260512225106_secure_admin_rpc.sql`, Block 2) blocks `role` edits unless the caller is `is_org_admin(auth.uid())`. So **today** the server stops self-promotion — but the frontend hook has zero defense-in-depth and no orphan-org-admin check.

---

## Task 3 — Password Strength Policy (Audit Issue #15)

### Finding: PARTIALLY CONFIRMED — inconsistent across flows

| Flow | File:line | Minimum length | Verdict |
|---|---|---|---|
| Reset password | `src/pages/ResetPassword.tsx:17` | `z.string().min(6, "Password must be at least 6 characters")` | **STILL 6 — below baseline** |
| Sign-up (form A) | `src/components/auth/SignUpForm.tsx:36` | `z.string().min(10, "Password must be at least 10 characters")` | OK (10) |
| Sign-up (form B) | `src/components/auth/SignUpForm.tsx:46` | `z.string().min(10, "Password must be at least 10 characters")` | OK (10) |
| Sign-in | `src/pages/Auth.tsx:21` | `z.string().min(1, "Password is required")` | OK by design — sign-in only confirms presence |

`ResetPassword.tsx` is inconsistent with `SignUpForm.tsx`. A user who signed up with a ≥ 10-char password can reset down to 6. The reset-flow placeholder text (`Input placeholder="At least 6 characters"` at line 88) reinforces the weaker policy in the UI.

No HIBP / breached-password check. No complexity requirements. No `PasswordStrength` component (which exists in `src/components/auth/` per the architecture doc) wired into `ResetPassword.tsx`.

Issue #15 from 2026-05-17 — still open.

---

## Task 4 — Data Remnants on Sign-Out (Audit Issue #5)

### Finding: CONFIRMED OPEN — no logout-side cleanup

### 4.1 All sign-out call sites (4 found, exhaustive)

| File | Line | Code |
|---|---|---|
| `src/components/layout/Header.tsx` | 470 | `await supabase.auth.signOut(); mobileNavigate("/");` (mobile nav) |
| `src/components/layout/Header.tsx` | 541 | `await supabase.auth.signOut(); navigate("/");` (desktop dropdown) |
| `src/pages/Account.tsx` | 97 | `await supabase.auth.signOut(); navigate("/auth");` |
| `src/pages/ResetPassword.tsx` | 46 | `await supabase.auth.signOut();` (after password change) |

None of the four call sites do anything beyond `supabase.auth.signOut()` + navigation. None:
- clear `localStorage` keys written by the app,
- call any centralised `clearUserScopedStorage()` helper (none exists — verified via grep),
- listen for `onAuthStateChange("SIGNED_OUT")` to perform cleanup.

### 4.2 `onAuthStateChange` listeners do not perform cleanup either

6 `onAuthStateChange` registrations exist (`src/hooks/useUser.ts:15`, `src/hooks/useScenarioDraft.ts:170`, `src/components/ProtectedRoute.tsx:39`, `src/hooks/useAdminAuth.ts:10`, `src/pages/Auth.tsx:67`, `src/pages/Account.tsx:79`). All of them only read the new session state to update React state — none branch on `event === "SIGNED_OUT"` to wipe storage.

### 4.3 Persistent localStorage keys that survive sign-out

| Key | Owner | Contents | Cross-user risk |
|---|---|---|---|
| `exos_saved_business_contexts` | `src/hooks/useSavedBusinessContexts.ts:11` | `[{ id, name, content, createdAt, updatedAt }]`. `content` is free-text business context the user pasted (supplier names, pricing notes, contract terms) | HIGH — not scoped to user id, persists indefinitely |
| `exos_draft_<scenarioId>_<userId\|anon>` | `src/hooks/useScenarioDraft.ts:23-24` | `{ blocks: {…}, savedAt }` — full draft of a scenario form including all answers | Per-user key, but value remains after sign-out; anon-suffix entries leak across all anonymous users on the device |
| `exos_model_config` | `src/contexts/ModelConfigContext.tsx:13` | `{ model, lastTested }` — chosen Gemini variant | LOW — preference data |
| `exos_model_25pro_opt_in` | `src/contexts/ModelConfigContext.tsx:17` | `"1"` flag | LOW |
| `exos-orchestrator-results-<scenarioId>` | `src/components/testing/TestPlanOrchestrator.tsx:40-43, 214` | Cached test pipeline run results | Super-admin-only feature; cached run results aren't cleared on sign-out either |

`useScenarioDraft` has a `clearFromLocal` helper at line 48 — but it is only called from `clearDraft()` (when the user explicitly discards a draft). Not wired into any sign-out path.

`ModelConfigContext.tsx:102` calls `localStorage.removeItem(EXPLICIT_25PRO_OPT_IN_KEY)` — but only on model switch in Settings, not on sign-out.

### 4.4 Confirmation of the audit hypothesis

> "On shared machines or admin-impersonation flows, the next user sees the previous user's supplier names, pricing notes, drafts."

Confirmed:
- `exos_saved_business_contexts` has **no user-id segmentation in the key**, so after user A signs out and user B signs in on the same browser profile, user B's `useSavedBusinessContexts()` hook reads the same key and **sees user A's saved supplier contexts in full**.
- Scenario drafts are keyed per user, so cross-account leakage requires the second sign-in to use the same user id (won't happen for different real users) — but anonymous drafts (`exos_draft_<scenarioId>_anon`) persist across all anonymous sessions on the device.
- Test orchestrator results survive across super-admin handoffs on shared devices.

---

## Status Matrix — Phase 2 Findings

| Audit ID | Finding | Status |
|---|---|---|
| #9 | `Sentry.setUser` ships `email` PII | **CONFIRMED OPEN** — `SentryUserSync.tsx:10`, bytewise unchanged |
| #7 | `ProtectedRoute` passes client-controlled `_user_id` to admin-check RPCs | **CONFIRMED OPEN** — `ProtectedRoute.tsx:27-28`; pairs with backend item that the SQL functions trust the parameter |
| #8 | `useTeamMembers.updateRole` direct `profiles.role` UPDATE with no client-side checks | **CONFIRMED OPEN** — `useTeamMembers.ts:33-40`; server-side trigger currently blocks self-promotion but frontend has zero defense-in-depth |
| #15 | Weak 6-char password policy on reset | **CONFIRMED OPEN** — `ResetPassword.tsx:17`; inconsistent with `SignUpForm.tsx` which requires 10 |
| #5 | localStorage business context / drafts not cleared on sign-out | **CONFIRMED OPEN** — all 4 sign-out call sites only call `supabase.auth.signOut()`; no `onAuthStateChange("SIGNED_OUT")` handler clears anything; `exos_saved_business_contexts` is not user-scoped and leaks across users on shared browsers |

---

## Items deferred to Phase 3 (out of Phase 2 scope)

- Stripe redirect hostname allowlisting (#3).
- LLM citation `javascript:` URI XSS (#4).
- PDF preview iframes lacking `sandbox` (#10).
- Anonymous public-form abuse / captchas (#11).
- `FileUploadZone` validation (#12).
- `SharedReport` canonical link (#16).
- `target="_blank"` without `rel` (#17).
- `console.error` payload-stripping (#25).
