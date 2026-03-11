

# Fix PDF Preview & Download

## Root Cause
`@react-pdf/renderer` (and its dependencies) reference `process.env.NODE_ENV` at runtime, which is undefined in the browser with Vite. Vite only replaces `import.meta.env` by default — it does not define the global `process` object. This causes a silent crash when generating the PDF blob, making both preview and download fail.

## Fix

### `vite.config.ts`
Add a `define` block to polyfill `process.env`:

```ts
define: {
  'process.env': JSON.stringify({}),
},
```

This is the standard fix for libraries that expect Node globals in a Vite browser build.

### No other files changed.

