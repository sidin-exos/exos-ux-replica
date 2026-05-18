# Backend Security Audit — Phase 1 (Database, RLS & RPCs) — Verification

**Date:** 2026-05-17
**Mode:** STRICT READ-ONLY.
**Scope:** `supabase/migrations/` (58 files) + `supabase/functions/_shared/auth.ts`.

---

## Task 1 — System Function Privilege Escalation (Audit Issues #5 & #6)

### 1.1 `cleanup_rate_limits()` — CONFIRMED OPEN (Critical)

**File:** `supabase/migrations/20260310124845_create_rate_limits.sql:20-27`

```sql
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '2 hours';
$$;
```

Verification:
- **No `auth.uid()` check** inside the function body (`LANGUAGE sql`, not `plpgsql`, so no procedural guards possible — bare DELETE).
- **No `REVOKE EXECUTE FROM PUBLIC`** anywhere. Confirmed via grep across all 58 migrations:
  ```
  grep -E "REVOKE.*\bcleanup_rate_limits\b" supabase/migrations/*.sql  →  ZERO matches
  ```
- PostgreSQL default: `EXECUTE` granted to `PUBLIC` for every new function. Combined with `SECURITY DEFINER`, the function runs with the table owner's privileges, bypassing the table's empty RLS policy set.
- Comparable PR-#34 fix exists for `enqueue_email` (`20260512222924_lockdown_enqueue_email.sql` — 4 REVOKEs + 1 GRANT). The identical pattern was **not** applied to `cleanup_rate_limits`.

**Net status:** Any authenticated (or anonymous) caller can `SELECT public.cleanup_rate_limits();` and wipe all rate-limit history older than 2 hours, defeating per-user rate limits on every AI-spending edge function. Audit issue #5 from 2026-05-17 — bytewise unchanged.

### 1.2 `save_intel_to_knowledge_base()` — CONFIRMED OPEN (Critical)

**File:** `supabase/migrations/20260305185732_baseline_schema.sql:322-363`

```sql
CREATE OR REPLACE FUNCTION public.save_intel_to_knowledge_base(
  p_content text, p_citations jsonb DEFAULT '[]'::jsonb,
  p_industry_slug text DEFAULT NULL::text, …
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_industry_slug IS NULL OR p_category_slug IS NULL THEN
    RAISE EXCEPTION 'Industry and category are required';
  END IF;
  INSERT INTO public.market_insights ( … ) VALUES ( … )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;
```

Verification:
- **Internal check is `auth.uid() IS NOT NULL` only** (line 345-347) — any authenticated user passes. No `is_super_admin` / `is_org_admin` / org-scope check.
- **No `REVOKE EXECUTE FROM PUBLIC`** anywhere.
- Target table `market_insights` has a SELECT policy `TO public USING (true)` — globally readable. Any authenticated user can write attacker-controlled content (stored prompt-injection payloads, fake regulatory claims) under any `industry_slug`/`category_slug`. That content then flows into LLM grounding prompts served to every other tenant.

Audit issue #6 from 2026-05-17 — bytewise unchanged.

---

## Task 2 — IDOR via Helper Functions (Audit Issue #13)

### Finding: CONFIRMED OPEN (High) — all 4 helpers accept arbitrary `_user_id`

**Files:**
- `supabase/migrations/20260305195130_helper_functions.sql:31-84` — `get_user_org_id`, `get_user_org_role`, `is_org_admin`
- `supabase/migrations/20260310130000_add_super_admin.sql:25-36` — `is_super_admin`

```sql
-- helper_functions.sql:31-41
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT organization_id FROM public.profiles WHERE id = _user_id;
$$;

-- helper_functions.sql:51-61
CREATE OR REPLACE FUNCTION public.get_user_org_role(_user_id UUID)
RETURNS public.org_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- helper_functions.sql:71-84
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'admin');
$$;

-- add_super_admin.sql:25-36
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT COALESCE((SELECT is_super_admin FROM public.profiles WHERE id = _user_id), false);
$$;
```

Verification:
- All four functions are `LANGUAGE sql` + `SECURITY DEFINER` — they bypass RLS on `profiles` to read directly. `LANGUAGE sql` makes procedural safeguards impossible without rewriting to `plpgsql`.
- All four accept a `_user_id UUID` parameter and use it directly in `WHERE id = _user_id`. None compares against `auth.uid()`.
- **None has `REVOKE EXECUTE FROM PUBLIC`** anywhere in the migration history. Confirmed:
  ```
  grep -E "REVOKE.*\b(is_super_admin|get_user_org_id|get_user_org_role|is_org_admin)\b" \
       supabase/migrations/*.sql  →  ZERO matches
  ```
- The helper file's own comment at `helper_functions.sql:12-13` explicitly says "DEFINER bypasses RLS to read profiles directly" — by design for RLS-callable usage, but the missing REVOKE turns this into a directory-harvest primitive.

Exploit shape (any authenticated user, or anonymous if `anon` retains the default `PUBLIC` EXECUTE):
```sql
SELECT public.is_super_admin('<arbitrary-uuid>');     -- enumerates super-admins
SELECT public.get_user_org_id('<arbitrary-uuid>');    -- maps users → orgs
SELECT public.get_user_org_role('<arbitrary-uuid>');  -- reveals roles
SELECT public.is_org_admin('<arbitrary-uuid>');       -- enumerates org admins
```

This **confirms the Phase 2 frontend finding** that `ProtectedRoute.tsx:27-28` passes a client-controlled `_user_id` to these RPCs — the SQL layer has zero defense, so the call is fully exploitable as written. Backend audit issue H3 / #13 — bytewise unchanged.

---

## Task 3 — Organization Enforcement on Writes (Audit Issues #15 & #17)

### 3.1 `inflation_trackers` / `inflation_drivers` INSERT — CONFIRMED OPEN (Medium → #17)

**Original creation:** `supabase/migrations/20260328075346_55969893-b76c-4fe0-ac18-bcf3064f1319.sql:23-25, 66-68`

```sql
-- inflation_trackers
CREATE POLICY "insert_in_org" ON public.inflation_trackers
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

-- inflation_drivers
CREATE POLICY "insert_in_org" ON public.inflation_drivers
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));
```

**Hardening migration 2026-05-14:** `supabase/migrations/20260514061559_c3ddce9b-057d-4ef6-ace3-7e6084da37b1.sql`

This migration **drops and re-creates** the SELECT, UPDATE, and DELETE policies to require `created_by = auth.uid()` (lines 2-23 for `inflation_trackers`, lines 26-69 for `inflation_drivers`). UPDATE WITH CHECK now reads:
```sql
USING (auth.uid() = created_by AND organization_id = get_user_org_id(auth.uid()))
WITH CHECK (auth.uid() = created_by AND organization_id = get_user_org_id(auth.uid()));
```

BUT — the migration **does NOT touch the INSERT policies**. Grep confirms:
```
grep -nE "(DROP POLICY|CREATE POLICY).*insert" \
     supabase/migrations/20260514061559_*.sql  →  ZERO matches
```

So the `insert_in_org` policies from the 2026-03-28 migration are still active. The table's `created_by` column is `NOT NULL` (line 10 of the original migration) but client-supplied; no DEFAULT, no trigger to overwrite with `auth.uid()`.

**Net effect:** an authenticated user can plant a tracker row tagged with **another org-member's `created_by` UUID**, after which the post-2026-05-14 SELECT/UPDATE/DELETE policies will treat that other member as the row owner. `inflation_drivers` has the same gap and additionally lets a user attach a driver to **any tracker in their org** — driver INSERT doesn't even require parent-tracker ownership.

Audit issue #17 (M1 in 2026-05-17 backend report) — bytewise unchanged.

### 3.2 `auto_set_organization_id` — CONFIRMED OPEN (#15 / H2)

**File:** `supabase/migrations/20260305204137_new_org_scoped_policies.sql:42-72`

```sql
CREATE OR REPLACE FUNCTION public.auto_set_organization_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    _org_id UUID;
BEGIN
    IF NEW.organization_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    IF auth.uid() IS NOT NULL THEN
        SELECT organization_id INTO _org_id FROM public.profiles WHERE id = auth.uid();
        IF _org_id IS NOT NULL THEN
            NEW.organization_id := _org_id;
            RETURN NEW;
        END IF;
    END IF;

    -- Fallback: Default Organization (anonymous or no profile yet)
    NEW.organization_id := '00000000-0000-0000-0000-000000000001';   -- ← line 71
    RETURN NEW;
END;
$$;
```

Verification:
- The default-org UUID `00000000-0000-0000-0000-000000000001` is **silently assigned** when both branches above fail.
- The Default Organization row is created in `supabase/migrations/20260305195208_backfill_default_org.sql` and is a real, queryable row.
- Trigger is applied to ≥ 10 tables (verified via grep on `auto_set_organization_id`):
  - `saved_intel_configs`, `enterprise_trackers`, etc. (`20260305204137`)
  - `user_files`, `scenario_file_attachments` (`20260311203102_create_user_files.sql:84,88`)
  - `chatbot_sessions` (`20260322121114_*.sql:48`)
  - `inflation_trackers`, `inflation_drivers` (`20260328075346_*.sql:38,81`)
- Backfill migrations `20260305195704_add_org_id_to_tables.sql` and `20260305203927_add_org_id_remaining_tables.sql` already planted pre-multi-tenancy rows into default org by direct assignment.
- `20260310130000_add_super_admin.sql:282-286` seeds two named emails as super_admins. Combined with the default-org-for-first-user pattern, default-org is the de-facto platform-staff org. Any data sunk into it is reachable by them.

Audit issue #15 (H2 from prior backend report) — bytewise unchanged.

---

## Task 4 — Invite Acceptance Race Condition (Audit Issue #14)

### Finding: CONFIRMED OPEN — invite-accept does not check `email_confirmed_at`

**File:** `supabase/migrations/20260419143532_update_handle_new_user_for_invites.sql:34-65`

```sql
IF _invite_token IS NOT NULL THEN
  SELECT * INTO _invitation
  FROM public.org_invitations
  WHERE token = _invite_token
    AND status = 'pending'
    AND expires_at > NOW()
    AND lower(invitee_email) = lower(NEW.email)        -- ← line 40
  FOR UPDATE;

  IF FOUND THEN
    INSERT INTO public.profiles ( id, email, …, role, … )
    VALUES ( NEW.id, NEW.email, …, _invitation.role, … );

    UPDATE public.org_invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = _invitation.id;

    RETURN NEW;
  END IF;
END IF;
```

Verification:
- Match criteria: `token` + `status='pending'` + `expires_at > NOW()` + `lower(invitee_email) = lower(NEW.email)`.
- **No `NEW.email_confirmed_at IS NOT NULL` guard.** Grep across the migration confirms zero references to `email_confirmed_at`.
- Trigger is `AFTER INSERT ON auth.users`. Supabase creates the `auth.users` row at sign-up time, **before** the user clicks the confirmation link. If the Supabase Auth project setting `Confirm email` is disabled (or any sign-up path skips it), the trigger fires immediately on sign-up and assigns the new user to the inviter's org.

Attack scenario (conditional on Supabase Auth project settings — not visible from migration files):
1. Attacker learns or guesses the invitee email + invitation token (UUID — 122 bits entropy — typically delivered in the invitation email).
2. Attacker signs up with the invitee's email and the token in `raw_user_meta_data.invite_token`.
3. Trigger fires before any confirmation, matches token+email, inserts the profile into the inviter's org with the invited role.

The schema layer cannot tell whether `Confirm email` is enabled at the project level — the migration provides no defense regardless.

Additional: the lookup is `FOR UPDATE` (line 41) which correctly serialises concurrent invite acceptance, but that race is orthogonal to the email-confirmation gap.

Audit issue #14 (H4) — bytewise unchanged.

---

## Status Matrix — Phase 1 (Backend)

| Audit ID | Finding | Status |
|---|---|---|
| **#5** | `cleanup_rate_limits()` SECURITY DEFINER, no auth check, EXECUTE granted to PUBLIC by default | **CONFIRMED OPEN — Critical** |
| **#6** | `save_intel_to_knowledge_base()` SECURITY DEFINER, only `auth.uid() IS NOT NULL` check, EXECUTE granted to PUBLIC by default; target `market_insights` table is globally readable → AI knowledge-base poisoning | **CONFIRMED OPEN — Critical** |
| **#13** | All 4 helper functions (`is_super_admin`, `get_user_org_id`, `get_user_org_role`, `is_org_admin`) accept arbitrary `_user_id` parameter, are `SECURITY DEFINER`, and have no REVOKE — directory-harvest primitive | **CONFIRMED OPEN — High** |
| **#17** | `inflation_trackers` / `inflation_drivers` INSERT WITH CHECK only requires `organization_id = get_user_org_id(auth.uid())`; `created_by` can be set to any org-member's UUID | **CONFIRMED OPEN — Medium** |
| **#15** | `auto_set_organization_id` silently assigns Default Organization on lookup failure — cross-tenant data sink reachable by any default-org member (incl. seeded super-admins) | **CONFIRMED OPEN — High** |
| **#14** | `handle_new_user` invite-accept branch matches on `lower(invitee_email) = lower(NEW.email)` without any `email_confirmed_at IS NOT NULL` gate | **CONFIRMED OPEN — High (conditional on Auth project setting)** |

---

## Notes on `supabase/functions/_shared/auth.ts` (in scope, no issue)

The shared Deno helper is the post-PR-#34 implementation:
- `authenticateRequest(req)` uses `supabase.auth.getUser(token)` — verifies signature **and** calls the auth server (no `getClaims` shortcut) — line 41.
- `getUserOrgId(userId)` returns the discriminated union `{ orgId } | { superAdmin: true } | { error }` (line 121-151) — no null-as-bypass.
- `requireSuperAdmin(userId)` is a separate function that explicitly checks `is_super_admin` (line 83-97).

The helper itself is consistent with the post-PR-#34 audit baseline. Phase 1 findings sit purely at the SQL layer and are not mitigated by anything in this file.
