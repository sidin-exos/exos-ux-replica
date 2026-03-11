

# Fix PDF Generation — Comprehensive Polyfill

## Investigation
The `process.env` polyfill in `vite.config.ts` is already present, but `@react-pdf/renderer` v4 and its dependencies also reference the bare `process` global (e.g., `process.browser`, `typeof process`), which is still undefined. This causes a silent runtime crash during `pdf(doc).toBlob()`.

## Fix

### `vite.config.ts`
Expand the `define` block to cover all `process` references:

```ts
define: {
  'process.env.NODE_ENV': JSON.stringify(mode),
  'process.env': '{}',
  'process.browser': 'true',
},
```

- `process.env.NODE_ENV` — explicitly set to the current Vite mode (longest match wins, so this takes priority over `process.env`)
- `process.env` — catches all other `process.env.X` references
- `process.browser` — some bundler-aware libs branch on this flag

### `src/components/reports/pdf/PDFPreviewModal.tsx`
Add visible error logging in `generatePdfBlob` catch block so failures are no longer silent — surface the actual error via `toast.error` with the message, and also `console.error` the full stack. This helps debug if the polyfill alone doesn't resolve it.

## Files changed
- `vite.config.ts`
- `src/components/reports/pdf/PDFPreviewModal.tsx`

