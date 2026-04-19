

## Goal
Make the "EXOS" wordmark in the header render with the exact same font (Space Grotesk via `font-display`) as the rest of the platform's headings, eliminating the visual mismatch.

## Root cause
`src/assets/exos-logo-light.svg` and `exos-logo-dark.svg` embed the wordmark as `<text>` inside the SVG with a `@import url(...Space Grotesk)` rule. Browsers often render this with the system fallback (the webfont in an SVG `<image>` tag is unreliable), producing a heavier/wider look that doesn't match the live DOM Space Grotesk used in headings.

## Approach
Replace the single combined SVG with: **diamond mark SVG + live HTML wordmark**. The HTML text inherits the platform's loaded Space Grotesk, guaranteeing consistency.

### Changes

1. **Use existing mark-only assets** — `src/assets/exos-mark.svg` and `src/assets/exos-mark-dark.svg` already exist (diamond only, no text). Use these instead of the full logo SVGs.

2. **Update `useThemedLogo.ts`** — return the mark-only SVG path based on theme.

3. **Update `Header.tsx` logo block** — render:
   ```tsx
   <NavLink to="/welcome" className="flex items-center gap-3">
     <img src={exosMark} alt="EXOS" className="h-8 md:h-9 w-auto" />
     <div className="h-7 w-px bg-border/60" />
     <span className="font-display font-bold text-2xl md:text-[28px] tracking-[0.15em] text-foreground">
       EXOS
     </span>
   </NavLink>
   ```
   - `font-display` = Space Grotesk (matches headings)
   - `tracking-[0.15em]` mimics the wide letter-spacing from the SVG
   - Divider line preserves current visual rhythm

4. **Mobile sheet title** (line 194) already uses `font-display` — no change needed.

### Files touched
- `src/hooks/useThemedLogo.ts` — point to mark-only SVGs
- `src/components/layout/Header.tsx` — split logo into mark + live text

### Out of scope
- Footer logo, PDF report logos, and `/og-image.svg` keep the current full SVG (they're outside the running React app where webfont may not be loaded).

