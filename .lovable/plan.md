

## Implement URL-driven routing for /enterprise/inflation

Two files modified. No other files touched.

### File 1: `src/App.tsx`

Replace the single `/enterprise/inflation` route (line 107) with 5 routes:

```
<Route path="/enterprise/inflation" element={<ProtectedRoute><Navigate to="/enterprise/inflation/dashboard" replace /></ProtectedRoute>} />
<Route path="/enterprise/inflation/dashboard" element={<ProtectedRoute><InflationPlatform /></ProtectedRoute>} />
<Route path="/enterprise/inflation/setup" element={<ProtectedRoute><InflationPlatform /></ProtectedRoute>} />
<Route path="/enterprise/inflation/events" element={<ProtectedRoute><InflationPlatform /></ProtectedRoute>} />
<Route path="/enterprise/inflation/tracker/:id" element={<ProtectedRoute><InflationPlatform /></ProtectedRoute>} />
```

`Navigate` is already imported from `react-router-dom`.

### File 2: `src/pages/enterprise/InflationPlatform.tsx`

**Imports**: Add `useParams`, `useNavigate`, `useLocation`, `Navigate` from `react-router-dom`

**Replace state with URL derivation**:
- Delete `useState("dashboard")` (line 30) → derive `activeTab` from `location.pathname.split('/').pop()` (map `setup`/`events`/`dashboard`, default to `dashboard`)
- Delete `useState<InflationTracker | null>(null)` (line 31) → derive `selectedTracker` from `useParams` `:id` matched against `trackers` array
- Add `trackerNotFound` guard → `<Navigate to="/enterprise/inflation" replace />`
- Add loading spinner when `id && isLoading`

**Replace setter calls** (4 occurrences):
1. Line 35: `handleSelectTracker` → `navigate(\`/enterprise/inflation/tracker/\${tracker.id}\`)`
2. Line 77: `onBack={() => setSelectedTracker(null)}` → `onBack={() => navigate('/enterprise/inflation/dashboard')}`
3. Line 148: `setActiveTab("setup")` → `navigate('/enterprise/inflation/setup')`
4. Line 198: `onComplete={() => setActiveTab("dashboard")}` → `onComplete={() => navigate('/enterprise/inflation/dashboard')}`

**Wire Tabs**: Line 127 `onValueChange={setActiveTab}` → `onValueChange={(tab) => navigate(\`/enterprise/inflation/\${tab}\`)}`

Remove `useState` from imports if no longer used (check: `useMemo` and `useCallback` still needed).

### What does NOT change
- InflationSetupWizard internal wizard steps (local state)
- InflationDetailView, InflationTrackerCard, InflationDriverCard interfaces
- useInflationTrackers hook, Supabase queries, edge functions, RLS
- News feed sidebar, market signals, footer
- No database migrations

