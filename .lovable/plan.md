

# Fix PDF Generation — CSP Blocks WebAssembly

## Root Cause
The error is clear from the screenshot: `@react-pdf/renderer` v4 uses WebAssembly internally, but the Content Security Policy in `index.html` blocks it. The `script-src` directive needs `'wasm-unsafe-eval'` to allow WebAssembly compilation.

## Fix

### `index.html`
Update the CSP `script-src` directive from:
```
script-src 'self' 'unsafe-inline'
```
to:
```
script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'
```

`'wasm-unsafe-eval'` is the modern, narrow permission that only allows WebAssembly compilation without enabling full `eval()`. Single file change.

