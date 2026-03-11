

# Group Dashboard Tabs into Categorized Sidebar Layout

## Problem
14 dashboard tabs in a single horizontal `ScrollArea` causes cognitive overload and blind scrolling.

## Approach
Replace the horizontal tab strip with a master-detail layout: a vertical category-grouped sidebar on the left and the active dashboard on the right. On mobile, keep the existing `Select` dropdown but group items with category labels.

## Changes

### 1. `src/pages/Reports.tsx` — Full layout redesign

**Sidebar navigation (left column, `md:col-span-1`):**
- 4 category groups with headings (`text-xs font-semibold uppercase tracking-wider text-muted-foreground`)
- Each dashboard as a clickable button with `border-l-2 border-primary` active state and `bg-muted` highlight
- Show dashboard name + short subtitle from config description
- Categories reuse the existing `guideCategories` structure, expanded to cover all 14 dashboards

**Category grouping:**
- **Decision Support**: Decision Matrix, Scenario Comparison, Kraljic Matrix, Negotiation Prep
- **Cost Analysis**: Cost Breakdown, TCO Comparison, License Distribution, Sensitivity Analysis
- **Risk & Compliance**: Risk Matrix, SOW Analysis, Data Quality
- **Planning & Performance**: Action Checklist, Timeline Roadmap, Supplier Scorecard

**Content area (right column, `md:col-span-3`):**
- Renders the active `DashboardContextCard` + dashboard component (same as current `TabsContent` bodies)
- No more `Tabs` wrapper needed — use plain state-driven rendering

**Mobile:**
- Update the `Select` dropdown to use `SelectGroup` + `SelectLabel` for category grouping

**Guide Me section:**
- Update to use the new 4-category grouping with card descriptions

### 2. No other files changed
All dashboard components, mappings, and sample data remain untouched.

