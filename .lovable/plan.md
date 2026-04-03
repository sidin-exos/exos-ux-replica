

## Add "Your Workspace" Section Separator on Risk Platform

**What**: Insert a labeled separator between the informational section (Methodology + Use Cases) and the operational section (Setup Wizard, Usage Stats, Active Monitors) on the Risk Platform page.

**Design**: A flex row with bold text "Your Workspace" on the left and a horizontal `Separator` line extending to fill the remaining width. Subtle spacing above and below.

```text
──── Your Workspace ──────────────────────────────
```

**Changes — single file: `src/pages/enterprise/RiskPlatform.tsx`**

1. Import `Separator` from `@/components/ui/separator`
2. After the Methodology + Use Cases grid (line 146), insert:
   - A `div` with `flex items-center gap-4 my-2`
   - An `h2` with "Your Workspace" styled as `text-sm font-semibold text-muted-foreground whitespace-nowrap uppercase tracking-wide`
   - A `Separator` with `className="flex-1"` to fill the remaining width

Same separator should also be added to the Inflation Platform page at the equivalent boundary for consistency.

