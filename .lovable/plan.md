

# Increase Logo Size in Header

Change the logo container from `h-10 w-10` to `h-12 w-12` on line 61. The `<img>` stays `w-full h-full object-contain` so it scales naturally. No other changes needed — `useThemedLogo()` logic is untouched.

**Line 61 edit:**
```
- <div className="flex items-center justify-center h-10 w-10 rounded-xl overflow-hidden ring-2 ring-primary/20 shadow-md shadow-primary/10">
+ <div className="flex items-center justify-center h-12 w-12 rounded-xl overflow-hidden ring-2 ring-primary/20 shadow-md shadow-primary/10">
```

One class change, everything else stays the same.

