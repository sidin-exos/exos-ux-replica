

## Enterprise Platforms — Phase 1 Implementation Plan

### Overview

Build the UI scaffolding, routing, database tables, storage bucket, and Supabase integration for persistent Risk Assessment and Inflation Analysis trackers. No AI processing or Edge Functions in this sprint.

### 1. Database Migration

Create `enterprise_trackers` table and `tracker-files` storage bucket in a single migration:

```sql
CREATE TABLE public.enterprise_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tracker_type text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'setup',
  parameters jsonb NOT NULL DEFAULT '{}',
  file_references jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_trackers ENABLE ROW LEVEL SECURITY;

-- User CRUD on own trackers
CREATE POLICY "Users can select own trackers" ON public.enterprise_trackers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trackers" ON public.enterprise_trackers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trackers" ON public.enterprise_trackers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trackers" ON public.enterprise_trackers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Admin read-all
CREATE POLICY "Admins can read all trackers" ON public.enterprise_trackers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('tracker-files', 'tracker-files', false);

-- Storage RLS: users can upload/read/delete own files (path starts with user_id)
CREATE POLICY "Users can upload own tracker files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tracker-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can read own tracker files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'tracker-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own tracker files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'tracker-files' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 2. New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/enterprise/RiskPlatform.tsx` | Risk Assessment platform page with Tabs (Monitor / Setup / Reports) |
| `src/pages/enterprise/InflationPlatform.tsx` | Inflation Analysis platform page, same structure |
| `src/components/enterprise/TrackerSetupWizard.tsx` | 3-step wizard: Parameters → Files & Context (with GDPR checkbox) → Review & Activate |
| `src/components/enterprise/TrackerList.tsx` | Grid of Card components showing active trackers with status badges |
| `src/components/enterprise/FileUploadZone.tsx` | Drag-and-drop file upload area for Step 2 |
| `src/hooks/useEnterpriseTrackers.ts` | Hook for CRUD operations on `enterprise_trackers` table + file upload to `tracker-files` bucket |

### 3. Files to Edit

| File | Change |
|------|--------|
| `src/App.tsx` | Add routes `/enterprise/risk` and `/enterprise/inflation` |
| `src/components/layout/Header.tsx` | Add "Enterprise" dropdown with Risk Assessment and Inflation Analysis links (same split-button pattern as existing nav items) |
| `src/components/layout/MobileBottomNav.tsx` | Not modified — 5 items is already tight. Enterprise is accessed via Header hamburger menu mobile sheet instead. |

### 4. Component Design Details

**Platform Pages** (Risk & Inflation share identical layout, differ by `trackerType` prop and icon):
- Header with icon (`ShieldAlert` for Risk, `TrendingUp` for Inflation), title, description
- Shadcn `<Tabs>` with 3 tabs: Monitor (default), Setup New Tracker, Reports
- Monitor tab renders `<TrackerList>`; Setup tab renders `<TrackerSetupWizard>`; Reports tab shows placeholder

**TrackerSetupWizard** (3 steps):
- Step 1 — Parameters: name field, category/goods/services inputs (varies by tracker type), risk appetite or inflation baseline
- Step 2 — Files & Context: `<FileUploadZone>` (drag-drop + click), optional context textarea, **mandatory GDPR checkbox** before proceeding
- Step 3 — Review & Activate: summary card, "Activate" button that uploads files to storage, inserts tracker row, shows toast, switches to Monitor tab

**TrackerList**: queries `enterprise_trackers` filtered by `tracker_type` and `user_id`, renders a responsive grid of Cards with name, status Badge, created_at formatted date, and a "View" button (placeholder for Phase 2 detail view).

**useEnterpriseTrackers hook**:
- `trackers` state via `useQuery` from `@tanstack/react-query`
- `createTracker(data)` — uploads files to `tracker-files/${user_id}/${uuid}-${filename}`, then inserts row
- Uses `supabase` client from `@/integrations/supabase/client`

### 5. Mobile Navigation

The existing mobile Sheet menu in `Header.tsx` will get the Enterprise links added below the existing nav items (before the separator). No changes to `MobileBottomNav.tsx` to avoid overcrowding.

### 6. Security Notes

- All tracker data user-scoped via RLS (`auth.uid() = user_id`)
- Storage paths enforce user isolation via `(storage.foldername(name))[1] = auth.uid()::text`
- GDPR checkbox required before file upload proceeds
- No PII stored in parameters — UI guidance enforced

