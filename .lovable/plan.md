## Goal
Create a disco-ball / mirror-tile style hero image based on the EXOS logo mark (three stacked triangles), matching the aesthetic of the uploaded reference: rounded-square icon, mirrored mosaic tiles, sparkle highlights, prismatic light flares, deep black background.

## Approach
Use `imagegen--generate_image` (premium tier for fidelity) with a detailed prompt referencing:
- EXOS mark shape: three stacked/overlapping triangular arrows forming a stylized lightning/play mark (per `src/assets/exos-mark.svg`)
- EXOS teal-to-emerald gradient (`#47DDD4` → `#19A49C` / `#0A5550`) for the foreground mark
- Mirrored disco-ball mosaic tiles on the icon background (silver/chrome squares with prismatic rainbow refraction)
- Rounded-square iOS-icon shape with glossy bevelled edge
- Sparkle/lens-flare highlights, deep black backdrop
- 1024×1024, square

## Output
- `/mnt/documents/exos-disco-icon.png`
- Delivered via `<presentation-artifact>` for download

## Notes
- No code changes to the project; this is a one-off artifact generation.
- If the first render misses the EXOS three-triangle geometry, iterate with `imagegen--edit_image` using `src/assets/exos-mark.svg` as a shape reference.
