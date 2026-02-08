

# RLS Hardening Migration

## Summary

Replace overly permissive RLS policies on `test_prompts`, `test_reports`, `market_insights`, and `intel_queries` with least-privilege policies. Edge Functions use the **service role key** which bypasses RLS entirely, so we only need to restrict direct client (anon/authenticated) access.

---

## Current State vs Target

```text
Table               Current                         Target
-----------------   ----------------------------    ----------------------------
test_prompts        ALL for everyone                SELECT public, INSERT auth only, no UPDATE/DELETE
test_reports        ALL for everyone                SELECT public, INSERT auth only, no UPDATE/DELETE
market_insights     SELECT/INSERT/UPDATE public     SELECT public only (edge fn handles writes)
intel_queries       SELECT/INSERT/UPDATE public     SELECT public only (edge fn handles writes)
industry_contexts   SELECT only                     No change (already correct)
procurement_cats    SELECT only                     No change (already correct)
```

**Key insight**: Service role bypasses RLS, so we do NOT need explicit policies for edge functions. We just remove write access from anon/authenticated roles.

---

## SQL Migration

The migration will:

1. **Drop** all existing overly-permissive policies on the 4 target tables
2. **Create** new restrictive policies:
   - `test_prompts` / `test_reports`: SELECT for `public` (anon + auth), INSERT for `authenticated` only
   - `market_insights` / `intel_queries`: SELECT only for `public`
3. No UPDATE or DELETE policies = denied by default for non-service-role clients

### Detailed SQL

**test_prompts:**
- Drop: "Test prompts are publicly accessible" (ALL)
- Add: SELECT policy for `public` role
- Add: INSERT policy for `authenticated` role

**test_reports:**
- Drop: "Test reports are publicly accessible" (ALL)
- Add: SELECT policy for `public` role
- Add: INSERT policy for `authenticated` role

**market_insights:**
- Drop: "Allow service role insert on market_insights" (INSERT)
- Drop: "Allow service role update on market_insights" (UPDATE)
- Keep: "Market insights are publicly readable" (SELECT) -- already correct

**intel_queries:**
- Drop: "Allow public insert access to intel_queries" (INSERT)
- Drop: "Allow public update access to intel_queries" (UPDATE)
- Keep: "Allow public read access to intel_queries" (SELECT) -- already correct

### No Code Changes Required

Edge Functions (`sentinel-analysis`, `market-intelligence`, `generate-market-insights`) all use `SUPABASE_SERVICE_ROLE_KEY` via `createClient(url, serviceKey)`, which bypasses RLS. No code changes needed.

### industry_contexts and procurement_categories

Already locked to SELECT-only. Confirmed no INSERT/UPDATE/DELETE policies exist. No changes needed.

---

## Risk Assessment

- **Zero downtime**: Dropping + recreating policies is instantaneous
- **No data loss**: Only policy changes, no schema changes
- **Edge Functions unaffected**: Service role bypasses RLS
- **Client reads unaffected**: SELECT policies remain public
- **Client writes to test tables**: INSERT still allowed for authenticated users (needed for the Sentinel pipeline UI flow)

