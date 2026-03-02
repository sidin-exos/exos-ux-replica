

## Plan: Context-Aware Preview Panel + Inline Chat Input

### Change 1: ScenarioPreviewPanel — show category context instead of empty state

**Current**: When no scenario is hovered, the panel shows a generic "Hover over a scenario" placeholder with an eye icon.

**New**: The panel receives the currently visible category (determined by which category section the user is scrolled near) and displays:
- Category name as title (e.g. "Analysis & Optimization")
- Category description
- Count of available scenarios in that category
- A prompt like "Hover a scenario to see details"

**Implementation**:
- `ScenarioPreviewPanel` gets a new prop: `activeCategory: Scenario["category"] | null`
- When `scenario` is null but `activeCategory` is set, render category info (name, description, scenario count) instead of the empty placeholder
- `Index.tsx` tracks which category section is in view using an `IntersectionObserver` on each `category-${category}` section, updating an `activeCategory` state
- Pass `activeCategory` to `ScenarioPreviewPanel`

### Change 2: ChatWidget — always-visible input bar (Lovable-style)

**Current**: The default (closed) state shows a "Not sure where to start?" card with suggestion chips. The user must click a chip or "Ask anything" to open the chat panel with an input field.

**New**: The default state is an inline input bar with the text field always visible, plus compact suggestion chips above or beside it. Similar to how Lovable and other AI tools present a single input field with placeholder text and optional quick-action chips. Clicking a chip or typing and pressing Enter opens the full chat panel with the message sent.

**Implementation**:
- Replace the closed-state render in `ChatWidget` with a compact bar containing:
  - Small row of suggestion chips (compact, horizontal)
  - An input field + send button always visible at the bottom
- When user types and sends, call `toggleChat()` and `sendMessage()` to open the full panel with the conversation
- Remove the intermediate "Not sure where to start?" card layout

### Technical details

**Files modified**:
- `src/pages/Index.tsx` — Add `activeCategory` state + `IntersectionObserver` logic, pass to `ScenarioPreviewPanel`
- `src/components/scenarios/ScenarioPreviewPanel.tsx` — Add `activeCategory` prop, render category summary in default state
- `src/components/chat/ChatWidget.tsx` — Redesign closed state to show inline input bar with suggestions

