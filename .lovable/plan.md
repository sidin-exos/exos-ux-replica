

# EXOS Account Page Redesign

## Summary
Rebuild `/account` from scratch per the uploaded spec: branded 6-section layout with profile display/edit, Copper-accented billing card, usage metrics, redesigned file manager, and proper pricing tiers.

## Prerequisites — Database Migration

The `profiles` table currently only has `display_name`, `role`, `organization_id`, `is_super_admin`. The spec requires 6 additional columns populated by the registration form.

**Migration** adds to `profiles`:
- `full_name` (text)
- `job_title` (text)
- `company_name` (text)
- `company_size` (text)
- `country` (text, ISO alpha-2)
- `industry` (text)
- `primary_challenge` (text)

Also update `handle_new_user()` trigger to populate these from `raw_user_meta_data`.

## Architecture

```text
src/pages/Account.tsx              ← Full rewrite (6 sections)
src/hooks/useAccountData.ts        ← NEW: TanStack Query hook for profile + usage stats
src/components/account/
  ProfileCard.tsx                  ← NEW: Display + inline edit mode
  PlanUsageCard.tsx                ← NEW: Copper-accented plan banner + 3 usage metrics
  UpgradePlansCard.tsx             ← NEW: 3 tier cards (SMB/Pro/Enterprise)
  BillingHistoryCard.tsx           ← NEW: Empty state + invoice row layout
src/components/files/UserFilesManager.tsx ← Restyle only (accent bars, colour-coded chips, empty state)
```

## Step-by-step

**1. Database migration**
- Add 7 columns to `profiles` (all nullable text, no breaking changes)
- Update `handle_new_user()` to read `full_name`, `job_title`, `company_name`, `company_size`, `country`, `industry`, `primary_challenge` from `NEW.raw_user_meta_data` and write them into the profile row

**2. Create `useAccountData` hook**
- Fetch profile (single row by user ID) via TanStack Query
- Fetch organization name as fallback for company
- Count reports from `user_funnel_events` where `event_name = 'report_generated'`
- Count files from `user_files` by org
- Expose `updateProfile` mutation with optimistic update + toast

**3. Build `ProfileCard`**
- Avatar with initials (56px teal circle, Space Grotesk)
- Name + email + "Verified" badge
- 2-column data grid (7 rows from profile)
- Country ISO → full name lookup
- "Complete your profile" warning when 3+ fields empty
- Edit mode: fields become inputs/selects (reuse registration options from SignUpForm), Save/Cancel buttons, update via Supabase

**4. Build `PlanUsageCard`**
- Copper accent bar + CreditCard icon
- Current plan banner with copper border/bg tint + "CURRENT PLAN" badge
- "Upgrade Plan" button scrolls to upgrade section
- 3 usage metric cards: Reports (teal), Scenarios/Analyses (iris), Files (accent)

**5. Build `UpgradePlansCard`**
- Only rendered on Free plan
- 3 plan cards: SMB (--info accent), Professional (--primary, "Recommended" badge, glow CTA), Enterprise (--iris, "Coming Soon", disabled)
- Feature lists per spec with "Show more" toggle on Professional
- Trust bar below: GDPR, SOC2-Ready, Cancel Anytime

**6. Build `BillingHistoryCard`**
- Copper accent bar + Receipt icon
- Empty state with "Browse plans ↓" link
- Invoice row layout built (for future use): date, amount, status badge (Paid/Pending/Failed), download icon

**7. Restyle `UserFilesManager`**
- Add accent bar header pattern
- Colour-coded filter chips: Excel (highlight/green), Word (info/blue), PDF (copper)
- Redesigned empty state with icon + descriptive text + "Upload Your First File" CTA
- Upload zone restyle: dashed border, hover state with teal tint

**8. Rewrite `Account.tsx`**
- Page header: "My Account" + last sign-in timestamp + Sign Out button
- Render all 6 sections with independent loading skeletons
- max-width 860px, gap-24px layout
- Mobile responsive at 640px breakpoint

## Colour assignments (v1 Brandbook tokens)
- Profile: `--primary` (#2E7B74)
- Billing/Plan: `--copper` (#BB6E38)
- AI usage: `--iris` (#6A63B5)
- Files: `--accent` (#4B9393)
- SMB tier: `--info` (#3484A8)
- Enterprise: `--iris`

## What stays unchanged
- Route `/account`, auth guard
- Global header/nav
- File upload/download/delete logic (restyle only)
- No Stripe integration (Subscribe → existing toast/link)
- Dark mode via existing CSS variables

