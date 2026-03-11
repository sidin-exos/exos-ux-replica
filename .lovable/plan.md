

# Upgrade AI Analysis Results to Structured Markdown

## New File: `src/components/ui/MarkdownRenderer.tsx`

Create a reusable Markdown renderer using `react-markdown` + `remark-gfm`:

- Accept `content: string` and optional `className` props
- Custom `components` prop styling with Tailwind:
  - `h1/h2/h3`: Enterprise typography (`text-2xl/xl/lg font-bold mt-6 mb-4`)
  - `table`: Wrapped in `overflow-x-auto` div, `w-full border-collapse my-6 text-sm`
  - `th`: `bg-muted/50 border border-border p-3 text-left font-semibold`
  - `td`: `border border-border p-3`
  - `ul/ol`: `list-disc/decimal pl-6 mb-4 space-y-2`
  - `strong`: `font-semibold text-foreground`
  - `p`: `mb-4 leading-relaxed`

## New Dependencies

Install `react-markdown` and `remark-gfm`.

## Edit: `src/components/scenarios/GenericScenarioWizard.tsx`

Replace lines 929-934:
```tsx
{analysisResult ? (
  <div className="bg-card rounded-lg p-4 border border-border max-h-[500px] overflow-y-auto">
    <MarkdownRenderer content={analysisResult} />
  </div>
) : (
```

Import `MarkdownRenderer` at top of file.

