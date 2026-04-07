

# Add Descriptive Alt Text & Accessibility Attributes to Public Pages

## Analysis

After inspecting all public page components, the codebase has very few `<img>` tags — most visuals are Lucide icon components (inline SVGs) and CSS-rendered elements. The SEO audit's count of "28 out of 30 images" likely includes inline SVGs rendered by Lucide icons and decorative SVG arrows.

### Current `<img>` tags (all have `alt` already, but some need better text):
- `Header.tsx:97` — `alt="EXOS"` (every page)
- `Features.tsx:238` — `alt="EXOS"` (EXOS mark)
- `Pricing.tsx:145` — `alt="EXOS"` (EXOS logo)
- `InflationPlatform.tsx:110-111` — `alt="Signal radar illustration"` (already good)

### Inline SVGs needing `aria-hidden="true"`:
- Welcome.tsx hero diagram: ~8 decorative SVG arrows/connectors (lines 220-246)
- DataFlowDiagram.tsx: decorative connectors and arrows

### Lucide icons used as meaningful content (not purely decorative):
- Welcome.tsx pillar icons (BarChart3, Radar, Building2) represent feature categories
- Features.tsx value prop icons
- SentinelCapabilities.tsx step icons

## Changes (6 files, attribute-only — no layout/logic changes)

### 1. `src/components/layout/Header.tsx` (line 97)
- Change `alt="EXOS"` → `alt="EXOS procurement platform logo"`

### 2. `src/pages/Features.tsx` (line 238)
- Change `alt="EXOS"` → `alt="EXOS procurement platform logo"`

### 3. `src/pages/Pricing.tsx` (line 145)
- Change `alt="EXOS"` → `alt="EXOS procurement platform logo"`

### 4. `src/pages/Welcome.tsx`
- Add `aria-hidden="true"` to all decorative inline `<svg>` elements in the hero diagram (lines 220, 236, 241)
- Add `role="img"` and `aria-label` to the hero diagram container div (line 159): `aria-label="EXOS agentic AI orchestration pipeline diagram"`

### 5. `src/components/features/DataFlowDiagram.tsx`
- Add `aria-hidden="true"` to all decorative connector SVGs (VerticalConnector, VerticalBidirectionalConnector, MobileConnector, AnimatedConnector)
- Add `role="img"` and `aria-label="EXOS privacy-first data flow diagram"` to the root container div

### 6. `src/components/features/SentinelCapabilities.tsx`
- Add `role="img"` and `aria-label="EXOS Sentinel Pipeline capabilities"` to the root container div

## What does NOT change
- No layout, styling, or component logic
- No Supabase, auth, or admin files
- No routing changes
- InflationPlatform.tsx already has good alt text — no changes needed
- RiskPlatform.tsx has no `<img>` tags — no changes needed

