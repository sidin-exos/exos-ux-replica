

# Create Enterprise Layout Wrapper + Fix Build Error

## Pre-existing build error
`react-markdown` is imported in `MarkdownRenderer.tsx` but not in `package.json`. This must be fixed by adding the dependency.

## New files

### 1. `src/components/layout/EnterpriseLayout.tsx`
- Wraps `{children}` with a telemetry bar above
- **Telemetry Bar**: Full-width `h-7` bar with `bg-slate-950 text-[10px] font-mono text-slate-400 uppercase tracking-widest`
  - Left: Pulsing green dot + "SYSTEM.STATUS: ONLINE"
  - Center: "MODULE: COMMAND_CENTER // EXOS_V2"
  - Right: "LLM.LATENCY: 142ms | NODES: 4"
- Hidden on mobile (`hidden md:flex`) to avoid clutter on small screens

### 2. `src/components/enterprise/EnterpriseModuleCard.tsx`
- A styled card component with control-panel aesthetic
- Props: `sysId`, `title`, `description`, `children`, optional `icon`
- Classes: `bg-card border border-border/50 border-t-2 border-t-primary shadow-sm rounded-sm`
- Header includes a mono ID pill: `font-mono text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground`

## Dependency fix
- Add `react-markdown` to `package.json` to resolve the build error

## Files changed
- `package.json` — add `react-markdown`
- `src/components/layout/EnterpriseLayout.tsx` — new
- `src/components/enterprise/EnterpriseModuleCard.tsx` — new

