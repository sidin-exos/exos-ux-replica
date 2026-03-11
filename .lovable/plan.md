

# Color-Coded Scenario Card Grouping

## Changes

### 1. ScenarioCard.tsx — Add category left border + risk background

Add a `CATEGORY_BORDER` mapping and a `CATEGORY_BG` mapping, then apply them to the card's `<button>`:

```
CATEGORY_BORDER = {
  analysis: "border-l-4 border-l-blue-500",
  planning: "border-l-4 border-l-amber-500",
  risk: "border-l-4 border-l-destructive",
  documentation: "border-l-4 border-l-purple-500",
}

CATEGORY_BG = {
  risk: "bg-destructive/5",
}
```

Apply `CATEGORY_BORDER[category]` and optionally `CATEGORY_BG[category]` to the button className. All existing hover/shadow/active styles stay intact.

### 2. Index.tsx — Enhanced category headers with icons

- Import `LineChart`, `CalendarDays`, `ShieldAlert`, `FileText` from lucide-react
- Create a mapping: `{ analysis: LineChart, planning: CalendarDays, risk: ShieldAlert, documentation: FileText }`
- Create a color mapping for the icon: `{ analysis: "text-blue-500", planning: "text-amber-500", risk: "text-destructive", documentation: "text-purple-500" }`
- Update the `<h2>` on line 212: change `text-xl` → `text-2xl`, add the category icon before the label
- Update the count badge to use category-specific colors instead of all `bg-iris/15 text-iris`

No changes to routing, data structures, or scenario content.

