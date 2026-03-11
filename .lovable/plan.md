

# Redesign 404 Not Found Page

## Edit: `src/pages/NotFound.tsx`

Rewrite to include Header/Footer, hero-style background with glow effect, large "404" text, friendly copy, and 3 recovery navigation buttons.

- Import `Header`, `Footer`, `Link`, `Button`, `Home`, `BarChart3`, `TrendingUp` icons
- Keep the `useLocation` + `console.error` logging
- Structure: `Header` → hero section (`min-h-[70vh]` with gradient glow bg) → `Footer`
- Large "404" in `text-8xl md:text-9xl font-bold text-primary/20 tracking-tighter`
- Heading: "Page not found" in `text-3xl font-semibold`
- Subtitle in `text-muted-foreground`
- 3 buttons: "Back to Home" (default), "Explore Scenarios" (outline), "Market Intelligence" (outline)

Single file change: `src/pages/NotFound.tsx`

