

# Founder's Commercial Dashboard + RBAC System

## Overview

Create a private admin dashboard at `/admin/dashboard` with role-based access control, North Star metric cards with manual editing, and an editable strategic hypothesis. Section 3 (Recent Signups) is deferred.

## Database Changes

### Migration 1: RBAC Foundation

Creates the role system that will gate all admin features going forward.

- `app_role` enum with values `admin` and `user`
- `user_roles` table (`id`, `user_id` FK to `auth.users`, `role`)
- RLS enabled -- only admins can SELECT (using `has_role()` security definer function)
- Seed: user `5e31324d-ae8d-4abc-91dd-dd493138bc25` gets `admin` role
- Skip recreating `update_updated_at_column` (already exists)

### Migration 2: Founder Metrics Table

- `founder_metrics` table with columns: `id`, `mrr` (numeric), `active_users` (int), `burn_rate` (numeric), `runway_months` (int), `strategic_hypothesis` (text), `updated_at`, `created_at`
- RLS: admin-only SELECT, INSERT, UPDATE (all using `has_role()`)
- Trigger: auto-update `updated_at` using existing function
- Seed: one row with defaults (0, 0, 0, 12, placeholder hypothesis text)

## New Files

### `src/hooks/useAdminAuth.ts`

- Uses `supabase.auth.getSession()` to get current user ID
- Queries `user_roles` table filtering by `user_id` and `role = 'admin'`
- Returns `{ isAdmin: boolean, isLoading: boolean }`
- Uses TanStack Query with `enabled: !!userId`
- No redirect logic inside the hook (handled by the page component)

### `src/hooks/useFounderMetrics.ts`

- `useFounderMetrics()` -- `useQuery` fetching the single row from `founder_metrics` (`.single()`)
- `useUpdateMetrics()` -- `useMutation` accepting `{ mrr, active_users, burn_rate, runway_months }`
- `useUpdateHypothesis()` -- `useMutation` accepting `{ strategic_hypothesis: string }`
- Both mutations invalidate the `founder-metrics` query key on success
- Toast notifications on success/error

### `src/pages/admin/FounderDashboard.tsx`

**Auth Guard:**
- Calls `useAdminAuth()`
- While loading: full-screen spinner (matches existing `gradient-hero` + `Loader2` pattern from Auth.tsx)
- If not admin after loading: `useEffect` redirects to `/` via `useNavigate()`

**Layout:**
- `gradient-hero` background with `Header` component (same pattern as Account.tsx)
- Page title: "Command Center" with `font-display`
- `container` with `max-w-6xl`

**Section 1 -- North Star Metrics:**
- 4 cards in a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` layout
- Each card uses the existing `card-elevated` class pattern
- Card details:

| Metric | Icon | Format |
|--------|------|--------|
| MRR | `TrendingUp` | EUR {mrr} |
| Active Users | `Users` | {active_users} |
| Burn Rate | `AlertTriangle` | EUR {burn_rate}/mo |
| Runway | `Clock` | {runway_months} months |

- "Edit Metrics" button opens a Shadcn `Dialog` with 4 `Input` fields (type="number") and a Save button
- Dialog submit calls `useUpdateMetrics` mutation

**Section 2 -- Strategic Hypothesis:**
- `Card` with `card-elevated` class
- View mode: displays hypothesis text with a small "Edit" button (pencil icon)
- Edit mode: `Textarea` replaces the text, with "Save" and "Cancel" buttons
- Save calls `useUpdateHypothesis` mutation

## Modified Files

### `src/App.tsx`

Add one route before the catch-all:

```
<Route path="/admin/dashboard" element={<FounderDashboard />} />
```

## Security Model

- All data queries are gated by RLS (`has_role(auth.uid(), 'admin')`)
- Even if someone navigates to `/admin/dashboard` without admin role, queries return empty/error
- Frontend guard provides UX-level protection (redirect), but RLS is the real security layer
- `has_role()` is `SECURITY DEFINER` to avoid recursive RLS on `user_roles`
- No client-side role caching or localStorage

## Patterns Reused from Existing Code

- Auth check pattern from `Account.tsx` (onAuthStateChange + getSession)
- `gradient-hero` + `Header` layout from Auth.tsx / Account.tsx
- `card-elevated` styling class
- `font-display` for headings
- TanStack Query patterns from existing hooks (e.g., `useMarketInsights.ts`)
- Lucide icons throughout

## Not Included (Deferred)

- Section 3: Recent Signups (needs profiles table)
- Stripe MRR automation
- PostHog deep links
- Nav link to admin dashboard in Header (admin-only nav item can be added later)

