

# New Page: EXOS Org Chart (Team Structure)

## Overview

Create a new `/org-chart` page with a dedicated `OrgChartDiagram.tsx` component that visualizes the EXOS team structure. This diagram shows the CEO at the top with three scope branches (CTO, Head of AI, Delivery), each containing functional roles filled by AI today with notes on future human hires.

---

## Layout Structure

```text
                    ┌──────────────────────────┐
                    │  YOU (CEO & Product Owner)│
                    └──────────┬───────────────┘
                               │
              ┌────────────────┼────────────────┐
              ↓                ↓                ↓
 ┌────────────────────┐ ┌─────────────────┐ ┌──────────────────┐
 │ CTO SCOPE          │ │ HEAD OF AI SCOPE│ │ DELIVERY SCOPE   │
 │ (Eng & Security)   │ │ (R&D & Prompts) │ │ (Execution)      │
 │                    │ │                 │ │                  │
 │ Role: CTO          │ │ Role: Head of AI│ │ Frontend Dev     │
 │ Backend & DB       │ │ Prompt Eng      │ │ QA & Testing     │
 │ InfoSec            │ │ EvalOps         │ │                  │
 │ DevOps & CI/CD     │ │ Knowledge (RAG) │ │                  │
 └────────────────────┘ └─────────────────┘ └──────────────────┘
         │                      │
         └──────────┬───────────┘
                    ↓
            Delivery Scope
```

---

## Visual Design

Each function node will show three lines of info using a custom card-style layout:
- **Function name** (bold)
- **CURRENT**: What AI/tool fills this role today
- **FOCUS**: Key responsibilities

Color scheme:
| Element | Color | Meaning |
|---------|-------|---------|
| CEO | `#e65100` (deep orange, thick border) | Human / current |
| CTO Scope | `#1565c0` (blue) | Engineering |
| Head of AI Scope | `#8b5cf6` (purple) | AI R&D |
| Delivery Scope | `#f59e0b` (amber) | Factory |
| "Future Hire" tags | `#2e7d32` (green badge) | Growth indicator |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/architecture/OrgChartDiagram.tsx` | Diagram component using ArchitectureNode, ArchitectureContainer, ArchitectureArrow |
| `src/pages/OrgChart.tsx` | Page wrapper with PNG/SVG export (same pattern as DevWorkflow.tsx) |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add route: `/org-chart` |

---

## Component Details: OrgChartDiagram.tsx

### Row 1: CEO Node
- Icon: `Crown` from lucide-react
- Label: "YOU"
- Sublabel: "CEO & Product Owner"
- Color: deep orange, scaled up (scale-125)

### Row 2: Three-column branch
- Three down arrows from CEO, one to each scope container

### Row 3: Three Scope Containers side-by-side

**CTO Scope** (blue dashed container):
- Role card: "CTO / Lead Architect" with sublabel "CURRENT: Gemini Architect + Auditor" and green "FUTURE HIRE" badge
- Three function nodes stacked:
  - Backend & DB (Database icon) -- "Supabase + Lovable SQL"
  - InfoSec & Compliance (ShieldCheck icon) -- "PII Masking, GDPR"
  - DevOps & CI/CD (Server icon) -- "Lovable Cloud"

**Head of AI Scope** (purple dashed container):
- Role card: "Head of AI" with sublabel "CURRENT: Gemini Tech Lead + LangSmith" and green "FUTURE HIRE" badge
- Three function nodes stacked:
  - Prompt Engineering (MessageSquare icon) -- "System Prompts, Chains"
  - Evaluation / EvalOps (LineChart icon) -- "Quality Metrics, Golden Datasets"
  - Knowledge Base / RAG (Search icon) -- "Perplexity Integration"

**Delivery Scope** (amber dashed container):
- Two function nodes stacked:
  - Frontend Dev (Bot icon) -- "Lovable (Fully Automated)"
  - QA & Testing (CheckCircle icon) -- "Manual + Auto-Unit"

### Row 4: Dashed arrows
- CTO Scope and Head of AI Scope both connect down to Delivery Scope with dashed arrows labeled "Specs & Requirements"

### Legend
- Deep Orange: Human (You)
- Blue: Engineering & Security
- Purple: AI R&D & Prompts
- Amber: Delivery / Factory
- Green badge: Future Human Hire

---

## Page: OrgChart.tsx

Same structure as DevWorkflow.tsx:
- Header with back link to `/features`
- Title: "EXOS Team Structure"
- Subtitle: "AI-first organization with clear scope boundaries and future hire roadmap"
- PNG/SVG download buttons
- Diagram in `card-elevated` container
- Three info cards:
  1. "CTO Scope" - Engineering, Security, and Infrastructure
  2. "Head of AI" - Prompt Engineering, Evaluation, and Knowledge Management
  3. "Delivery" - Automated code generation with human QA oversight

