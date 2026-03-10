

# Create Project Context Snapshot (2026-03-10)

Single file only: `docs/PROJECT_CONTEXT_2026-03-10.md` (no public folder copy).

## What Changed Since Mar 4

1. **Multi-Tenant Architecture:** New `organizations` table, `profiles` table with `org_role` enum (`admin | manager | user`). Most tables now have `organization_id` FK to `organizations`. New RPCs: `get_user_org_id`, `get_user_org_role`, `is_org_admin`.
2. **Enterprise Platform Pages:** Two new routes — `/enterprise/risk` (RiskPlatform) and `/enterprise/inflation` (InflationPlatform) with `TrackerSetupWizard` and `TrackerList` components. New `enterprise_trackers` table.
3. **Scenario Card Tags:** Descriptions replaced with 2-3 keyword tags per scenario. `tags: string[]` added to `Scenario` interface. Icons reduced from `w-12 h-12` to `w-10 h-10`.
4. **Mobile Bottom Navigation:** New `MobileBottomNav` component with `pb-14 md:pb-0` body padding.
5. **Database expanded to 17 tables** (up from 14): added `organizations`, `profiles`, `enterprise_trackers`.
6. **18 routes** (up from 16).
7. **Two new enums:** `app_role` (`admin | user`), `org_role` (`admin | manager | user`).
8. **View added:** `pipeline_iq_stats` for aggregated pipeline metrics.

## File to Create

`docs/PROJECT_CONTEXT_2026-03-10.md` — follows the exact structure of `docs/PROJECT_CONTEXT_2026-03-04.md` with all sections updated to reflect the changes above. Key updates:
- Milestone: "Multi-Tenant Architecture & Enterprise Platforms"
- Security section: 17 tables, org-scoped RLS, new RPCs
- Database Tables section: add `organizations`, `profiles`, `enterprise_trackers`
- Frontend section: 29 scenarios (with tags), 18 routes, mobile bottom nav
- Active Components: add Enterprise Platforms subsection
- Key Files: add enterprise platform files, `useEnterpriseTrackers.ts`, `MobileBottomNav.tsx`
- Documentation: add this file to the list
- Remove public download URL reference

