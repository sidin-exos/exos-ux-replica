

# New Diagram: EXOS Development Workflow

## Overview

Create a new visual diagram component that renders the **Development Workflow** (Gemini Virtual Committee + Lovable AI Factory + System Memory) using the same Miro-style visual components (`ArchitectureNode`, `ArchitectureContainer`, `ArchitectureArrow`) as the existing System Architecture diagram. Accessible at `/dev-workflow` with PNG/SVG export.

---

## What We're Building

A visual representation of the 6-phase development process:

```text
Phase 1: Ideation          Phase 2: Validation       Phase 3: Specification
YOU ──► Architect ──► Auditor ──► Tech Lead ──► YOU

Phase 4: Execution         Phase 5: Feedback          Phase 6: Observability
YOU ──► Coder ──► Builder ──► YOU ──► Linear ──► Metrics
                                        LangSmith ──┘
```

---

## Color Palette (Matching Existing COLORS)

| Subgraph | Color | Existing COLORS key |
|----------|-------|---------------------|
| YOU (Product Owner) | `#f59e0b` (orange) | `orange` |
| Gemini Virtual Committee | `#3b82f6` (blue) | `blue` |
| Lovable AI Factory | `#f59e0b` (yellow-orange) | `orange` |
| System Memory & Ops | `#10b981` (green) | `green` |
| DevEx Metrics | `#8b5cf6` (purple dashed) | `purple` |

---

## Layout Structure

### Section 1: Central Actor
- **YOU** node at top center (orange, large, with pilot icon)

### Section 2: Gemini Virtual Committee (Blue container)
- Three nodes in a row: Architect, Auditor, Tech Lead
- Arrow from Architect to Auditor, Auditor to Tech Lead
- "Risk Blocked" reject arrow from Auditor back to Architect

### Section 3: Lovable AI Factory (Orange/Yellow container)
- Two nodes: Coder, Builder
- Arrow: Coder to Builder

### Section 4: System Memory & Ops (Green container)
- Three nodes: Linear, LangSmith, DevEx Metrics
- Linear to Metrics arrow
- LangSmith to Metrics dashed arrow

### Flow Connections (Between Sections)
1. YOU --> Architect ("Feature Request")
2. Tech Lead --> YOU ("Final Lovable Prompt")
3. YOU --> Coder ("Paste Spec")
4. Builder --> YOU ("Instant Preview")
5. YOU --> Linear ("Approve & Deploy") / YOU --> Tech Lead ("Reject & Iterate")
6. Builder --> LangSmith (dashed, "Runtime Logs")

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/architecture/DevWorkflowDiagram.tsx` | Main diagram component using existing ArchitectureNode/Container/Arrow |
| `src/pages/DevWorkflow.tsx` | Page wrapper with download buttons (same pattern as ArchitectureDiagram page) |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add route: `/dev-workflow` |

---

## Component Structure: DevWorkflowDiagram.tsx

### Phase Flow Layout (Top to Bottom)

**Row 1: YOU** (Central actor node, orange, prominent)

**Row 2: Gemini Virtual Committee** (Blue dashed container)
- Horizontal: Architect --> Auditor --> Tech Lead
- Reject arrow: Auditor --x--> Architect (red dashed)
- Labels on arrows: "High-Level Design", "Security Review", "Risk Blocked"

**Row 3: Human-in-the-Loop** (Back to YOU)
- Arrow up from Tech Lead to YOU: "Final Lovable Prompt (Ready-to-Paste)"

**Row 4: Lovable AI Factory** (Yellow/orange container)
- Horizontal: Coder --> Builder
- Arrow from YOU down to Coder: "Paste Spec"
- Arrow from Builder back to YOU: "Instant Preview"

**Row 5: Feedback Loop**
- YOU --> Tech Lead: "Reject & Iterate" (red dashed)
- YOU --> Linear: "Approve & Deploy" (green)

**Row 6: System Memory & Ops** (Green container)
- Linear --> DevEx Metrics
- LangSmith --> DevEx Metrics (dashed)
- Builder --> LangSmith (dashed, "Runtime Logs")

### Legend
- Blue: Gemini AI Roles
- Orange: Human / Lovable Factory
- Green: System Memory
- Purple dashed: Metrics & Observability
- Red dashed: Rejection / Risk paths

---

## Icons (from lucide-react)

| Node | Icon |
|------|------|
| YOU | `UserCircle` |
| Architect | `Building2` |
| Auditor | `ShieldCheck` |
| Tech Lead | `Wrench` |
| Coder | `Bot` |
| Builder | `Hammer` |
| Linear | `ListTodo` |
| LangSmith | `LineChart` |
| DevEx Metrics | `BarChart3` |

---

## Page: DevWorkflow.tsx

Follows the exact same pattern as `ArchitectureDiagram.tsx`:
- Header with back link to `/features`
- Title: "EXOS Development Workflow"
- Subtitle: "AI-augmented development pipeline with Gemini Virtual Committee and human-in-the-loop quality gates"
- PNG/SVG download buttons
- Diagram rendered inside `card-elevated` container
- 3 info cards below:
  1. "Gemini Committee" - Strategy, Security, and Specification via Chain-of-Experts
  2. "Lovable Factory" - Code generation with instant preview
  3. "System Memory" - Linear decisions, LangSmith traces, DevEx metrics

---

## Route Addition

```
/dev-workflow --> DevWorkflow page
```

