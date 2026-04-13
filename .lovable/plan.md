

## Move Market Intelligence tabs into URL

### What changes
Replace React state-driven tab switching with URL-driven routing so each tab has a stable, bookmarkable address that survives refresh.

### URL structure
- `/market-intelligence` → redirects to `/market-intelligence/queries`
- `/market-intelligence/queries` → Ad-hoc Queries tab (with adhoc/regular sub-mode preserved as `?mode=regular` query param)
- `/market-intelligence/insights` → Knowledge Base tab

### File 1: `src/App.tsx`
Replace the single `/market-intelligence` route (line 93) with three routes:
```
/market-intelligence        → ProtectedRoute → Navigate to /market-intelligence/queries
/market-intelligence/queries  → ProtectedRoute → MarketIntelligence
/market-intelligence/insights → ProtectedRoute → MarketIntelligence
```

### File 2: `src/pages/MarketIntelligence.tsx`
- Replace `useSearchParams`-based tab derivation with `useLocation` path segment derivation
- Derive `activeTab` from the last path segment (`queries` or `insights`)
- Replace `<Tabs defaultValue={...}>` with `<Tabs value={activeTab}>` (controlled)
- Wire `onValueChange` on `Tabs` to `navigate(\`/market-intelligence/${tab}\`)`
- Keep the `?mode=adhoc|regular` query param logic for the sub-selector within the queries tab (no change to IntelScenarioSelector)

### What does NOT change
- Tab UI, query interface, results display, save-to-KB, citation display
- IntelScenarioSelector adhoc/regular sub-mode (stays as query param)
- Supabase queries, edge functions, RLS policies
- ProtectedRoute wrapping (all sub-routes remain auth-gated)
- No other files modified

### Verification
- `/market-intelligence` redirects to `/market-intelligence/queries`
- Refreshing `/market-intelligence/insights` stays on Knowledge Base
- Browser back/forward navigates between tabs
- `?mode=regular` on queries tab still works
- Auth gate enforced on all sub-routes

