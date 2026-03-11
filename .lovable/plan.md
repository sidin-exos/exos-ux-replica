

# Loading Skeletons & Empty States

## Components to Update

### 1. TrackerList.tsx — Upgrade loading skeletons + rich empty state
- **Loading**: Replace `animate-pulse` divs with proper `Skeleton` components matching card shape (title line, badge, date line, button)
- **Empty**: Add centered empty state with `FolderPlus` icon, descriptive text, no CTA needed (already directs to setup tab)

### 2. RecentQueries.tsx — Skeleton list + rich empty state  
- **Loading**: Replace `Loader2` spinner with 3 skeleton rows matching the query item shape (icon + text line + badge row)
- **Empty** (after load): Add `Search` icon, descriptive text, keep existing message

### 3. MarketInsightsAdmin.tsx — Skeleton table rows + rich empty state
- **Loading**: Replace `Loader2` spinner with 5 skeleton table rows matching the 5-column layout
- **Empty**: Add `Database` icon, descriptive text, keep existing CTA message

### 4. TestStatsCards.tsx — Already good (uses `Skeleton`), no changes needed

## Skeleton Patterns

Each skeleton mimics the real content shape:
- **Card skeleton**: `Skeleton` for title (h-5 w-32), badge (h-5 w-16), date (h-4 w-24), button (h-8 w-16)
- **Query row skeleton**: rounded-lg border container with `Skeleton` lines for icon+text and badges
- **Table row skeleton**: `Skeleton` cells matching column widths

## Empty State Pattern (reusable structure)

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="w-12 h-12 text-muted-foreground/40 mb-4" />
  <h3 className="text-lg font-semibold text-foreground mb-1">Title</h3>
  <p className="text-sm text-muted-foreground max-w-sm mb-4">Description</p>
  <Button variant="outline" onClick={...}>CTA</Button> {/* where appropriate */}
</div>
```

## Files Changed
- `src/components/enterprise/TrackerList.tsx`
- `src/components/intelligence/RecentQueries.tsx`  
- `src/components/insights/MarketInsightsAdmin.tsx`

No data-fetching logic modified. No routing changes.

