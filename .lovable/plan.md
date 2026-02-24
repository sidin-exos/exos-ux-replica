

# Update Architecture Diagram for Feb 24 Changes

## What Needs Updating

The `ExosArchitectureDiagram` currently reflects the pre-Feb-20 state. Key gaps:

| Area | Current | Should Be |
|---|---|---|
| Market Intel node (#6) | "Perplexity Integration" (single mode) | 3 modes: Ad-hoc, Scheduled, Triggered |
| Output — Reports node (#12) | "PDF with Citations" | "PDF · Excel · Jira" |
| Knowledge Base loop | Missing entirely | Feedback arrow: Market Intel → Knowledge Base → Grounding Engine |
| Database layer | Not shown | `saved_intel_configs` persistence for scheduled/triggered configs |
| Models badge | "Gemini 3 Flash · Gemini 2.5 Pro · GPT-5" | Add "GPT-5.2" (newly supported) |
| Deep Analysis | Not shown | Multi-cycle Chain-of-Experts (Auditor → Synthesizer) for 6 scenario types |

## Implementation

### Single file: `src/components/architecture/ExosArchitectureDiagram.tsx`

**1. Market Intel node (#6):** Change sublabel from `"Perplexity Integration"` to `"Ad-hoc · Scheduled · Triggered"`. Add a small sub-badge below showing "Perplexity Sonar Pro".

**2. Add Knowledge Base feedback loop:** After the Context Preparation container, add a dashed arrow looping from Market Intel back into Grounding Engine with label "Knowledge Base Feedback". Add a small `Database` icon node labeled "saved_intel_configs" and "market_insights" to represent the persistence layer.

**3. Output node updates:**
- Node #12 sublabel: `"PDF with Citations"` → `"PDF · Excel · Jira"`
- Add a `Share2` icon node for "Shareable Links" with sublabel "128-bit · 5-day expiry"

**4. Models badge:** Update text to `"Gemini 3 Flash · Gemini 2.5 Pro · GPT-5 · GPT-5.2"`

**5. Deep Analysis indicator:** Add a small badge/annotation inside the AI Gateway container showing "Chain-of-Experts: Auditor → Synthesizer (multi-cycle)" for deep analytics scenarios.

**6. Add new icons to imports:** `Database`, `Share2`, `CalendarClock` (for scheduled), `Zap` (for triggered).

### No changes to:
- `ArchitectureDiagram.tsx` (page wrapper) — the info cards at the bottom are fine as-is
- `ArchitectureNode.tsx`, `ArchitectureContainer.tsx`, `ArchitectureArrow.tsx` — primitives unchanged

## Files Changed

| # | File | Action | Summary |
|---|---|---|---|
| 1 | `src/components/architecture/ExosArchitectureDiagram.tsx` | Edit | Update Market Intel to 3 modes, add KB feedback loop, update output formats, add deep analysis badge, update models |

## Visual Result

The diagram gains:
- A richer Market Intel section showing the 3 intelligence modes
- A visible feedback loop (Market Intel → Knowledge Base → Grounding)
- Updated output section reflecting actual export capabilities
- Deep analysis multi-cycle annotation in the Cloud section
- Current model lineup

