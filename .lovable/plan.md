

# Smoke Test Block 1 — Route Access Control: Code Audit Results

## ST-01 — Public Routes (12 routes) — PASS (code verified)

These routes have **no `ProtectedRoute` wrapper** in App.tsx:

| Route | Wrapper | Verdict |
|-------|---------|---------|
| `/` | None | Public |
| `/welcome` | None | Public |
| `/features` | None | Public |
| `/pricing` | None | Public |
| `/auth` | None | Public |
| `/reset-password` | None | Public |
| `/unsubscribe` | None | Public |
| `/scenarios/tco-analysis` | None | Public |
| `/scenarios/supplier-risk-assessment` | None | Public |
| `/scenarios/negotiation-preparation` | None | Public |
| `/scenarios/make-or-buy-analysis` | None | Public |
| `/scenarios/black-swan-simulation` | None | Public |

All 12 will load without auth. No code-level issues.

## ST-02 — Auth-Required Routes (6 routes) — PASS (code verified)

These routes use `<ProtectedRoute>` (no admin flags), which redirects to `/auth` when unauthenticated (line 48 of ProtectedRoute.tsx):

| Route | Wrapper | Verdict |
|-------|---------|---------|
| `/faq` | `<ProtectedRoute>` | Redirects to `/auth` |
| `/report` | `<ProtectedRoute>` | Redirects to `/auth` |
| `/market-intelligence` | `<ProtectedRoute>` | Redirects to `/auth` |
| `/account` | `<ProtectedRoute>` | Redirects to `/auth` |
| `/enterprise/risk` | `<ProtectedRoute>` | Redirects to `/auth` |
| `/enterprise/inflation` | `<ProtectedRoute>` | Redirects to `/auth` |

All 6 correctly protected.

## ST-03 — Super Admin Routes (5 routes) — PASS (code verified)

These use `<ProtectedRoute requireSuperAdmin>`:

| Route | Wrapper | Redirect (unauth) | Redirect (non-super-admin) |
|-------|---------|-------------------|---------------------------|
| `/admin/dashboard` | `requireSuperAdmin` | → `/auth` | → `/` |
| `/admin/methodology` | `requireSuperAdmin` | → `/auth` | → `/` |
| `/testing-pipeline` | `requireSuperAdmin` | → `/auth` | → `/` |
| `/dashboards` | `requireSuperAdmin` | → `/auth` | → `/` |
| `/architecture` | `requireSuperAdmin` | → `/auth` | → `/` |

All 5 correctly gated. The ProtectedRoute logic:
- Line 48: No session → redirect `/auth`
- Line 49: Not super admin → redirect `/`

## Security Note

The `ProtectedRoute` uses server-validated RPCs (`is_super_admin`, `get_user_org_role`) defined as `SECURITY DEFINER` functions in the database — not client-side storage. This is the correct pattern.

## Summary

All 3 sub-tests pass at the code level. No regressions detected. To confirm runtime behavior, use the browser tools to navigate each route in incognito.

