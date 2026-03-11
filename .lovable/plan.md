

# Fix Logo Scaling in Header

## Problem
The logo uses `w-28 h-28` image inside a `w-16 h-16` container with `scale-[1.8]` — a visual hack causing cropping and blur.

## Changes (Header.tsx only, lines 61-63)

**Before:**
```html
<div class="flex items-center justify-center w-16 h-16 rounded-xl overflow-hidden ring-2 ring-primary/20 shadow-md shadow-primary/10">
  <img src={exosLogo} alt="EXOS Logo" class="w-28 h-28 object-contain scale-[1.8]" />
</div>
```

**After:**
```html
<div class="flex items-center justify-center h-10 w-10 rounded-xl overflow-hidden ring-2 ring-primary/20 shadow-md shadow-primary/10">
  <img src={exosLogo} alt="EXOS Logo" class="w-full h-full object-contain" />
</div>
```

- Container: `w-16 h-16` → `h-10 w-10` (proportional to h-16 header)
- Image: remove `w-28 h-28 scale-[1.8]`, replace with `w-full h-full object-contain`
- No dark mode filter needed — the app already uses `useThemedLogo()` which swaps between dark/light logo variants
- No changes to nav links or other header logic

