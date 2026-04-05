

## Redesign Knowledge Base Interface

Based on the screenshots, the "Generate Market Insights" section needs to shift from a stacked layout to a **3-column card grid** where Industry, Countries & Regions, and Procurement Categories each occupy their own card at equal height.

### Changes (single file: `src/components/insights/MarketInsightsAdmin.tsx`)

1. **Remove the description card** at the top (the one with the preview image) — the screenshot shows the generate section as the primary content directly under the tab.

2. **Replace the "Generate Market Insights" Card internals** with a 3-column grid layout:
   - **Column 1 — Industry**: A standalone card containing the industry dropdown selector, vertically centered.
   - **Column 2 — Countries & Regions**: A standalone card with the grouped checkbox list (taller, scrollable).
   - **Column 3 — Procurement Categories**: A standalone card with the category checkbox list (matching height).

3. **Section header**: Plain bold text "Generate Market Insights" with subtitle, no card wrapper — matching the clean look in the screenshot.

4. **Generate button**: Remains at the bottom-right, outside the 3 cards, same styling as current.

5. **Increase list heights**: Bump `max-h-48` to `max-h-64` or similar to show more items without scrolling, matching the taller cards in the screenshot.

6. **Keep existing**: Browse/filter table, batch progress, generation results — all remain unchanged below.

### Layout sketch
```text
Generate Market Insights
Select one industry, then choose countries and categories...

┌──────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  Industry    │ │ Countries & Regions  │ │ Procurement Categories│
│              │ │                      │ │                      │
│ [Dropdown v] │ │ ○ Global             │ │ ○ Chemicals          │
│              │ │ ○ European Union     │ │ ○ Construction       │
│              │ │ ○ Asia-Pacific       │ │ ○ Electronic         │
│              │ │ ...                  │ │ ...                  │
└──────────────┘ └──────────────────────┘ └──────────────────────┘

                        [summary text]    [Generate Market Insights]
```

