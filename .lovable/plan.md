

# Refactor Header Navigation: Mega-Menu + Accordion Mobile

## Overview

Replace the 6 separate `DropdownMenu` instances + flat mobile links with a unified Radix `NavigationMenu` (already installed) for desktop and `Accordion` (already installed) for mobile. Consolidate into 4 top-level groups.

## Navigation Structure

```text
Scenarios          Market Intelligence    Enterprise           Resources
├─ Analysis        ├─ Generate Report     ├─ Risk Assessment   ├─ Dashboards & Analytics
├─ Planning        ├─ Scheduled Reports   ├─ Inflation         ├─ Technology & AI
├─ Risk            └─ Knowledge Base      │  Analysis          ├─ Customer Success
└─ Documentation                          │                    ├─ Pricing
                                          │                    └─ Help & FAQ
```

## Changes (single file: `src/components/layout/Header.tsx`)

### Desktop (lines 74-217)

Replace the `<nav>` block containing 4 `DropdownMenu` components + 2 `NavLink` items with a single `NavigationMenu` from `@/components/ui/navigation-menu`:

- 4 `NavigationMenuItem` items, each with a `NavigationMenuTrigger` and `NavigationMenuContent`
- Content panels use `grid grid-cols-2 gap-3 p-4 w-[400px]` (or `w-[500px]` for Scenarios with 4 items)
- Each sub-link is a `<button>` calling `navigate()`, styled with hover states matching `muted-foreground`/`primary` scheme
- Icons retained for Enterprise sub-items (`ShieldAlert`, `TrendingUp`)

### Mobile (lines 235-277)

Replace flat button list with `Accordion` from `@/components/ui/accordion`:

- 4 `AccordionItem` entries matching the desktop groups
- `AccordionTrigger` for each group label
- `AccordionContent` containing the sub-link buttons (same `mobileNavigate` calls)
- Keeps existing styling: `text-sm font-medium`, `py-2.5 px-3`, `hover:bg-muted`

### Imports

- Add: `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink` from `@/components/ui/navigation-menu`
- Add: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` from `@/components/ui/accordion`
- Remove: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` (still needed for user avatar menu — keep import)
- Keep: `DropdownMenuSeparator` and user menu `DropdownMenu` (lines 331-397) untouched

### Untouched

- Logo block (lines 60-72) — no changes
- Auth state logic (lines 35-55) — no changes  
- User avatar dropdown (lines 331-397) — no changes
- ThemeToggle, Sheet wrapper — no changes
- Mobile user section below Separator (lines 280-326) — no changes

