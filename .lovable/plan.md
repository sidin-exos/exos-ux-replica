
# Architecture Diagram Update: Enterprise Local Deployment with Security Gate

## Overview

Update the EXOS Architecture Diagram to show that the EXOS Intelligence layer can be deployed on-premises for enterprise customers, with a security checkpoint that allows the InfoSec team to audit all external API traffic and ensure no sensitive commercial data leaves the organization.

## Visual Changes

### 1. Customer Premises Boundary Box (New Layer)

Wrap the entire EXOS Intelligence section in a new **"Customer Premises"** boundary container:

```text
+------------------------------------------+
|  CUSTOMER PREMISES (Enterprise)          |
|  ┌────────────────────────────────────┐  |
|  │  EXOS Intelligence                 │  |
|  │  [Anonymizer] → [Grounding] → ...  │  |
|  └────────────────────────────────────┘  |
|                                          |
|  [InfoSec Checkpoint] ← Security Gate    |
+------------------------------------------+
            │
            ▼ "Anonymized Only"
    [Cloud AI Agents]
```

- Use a **solid red/dark border** to emphasize the security perimeter
- Add a small badge/label: **"On-Premises Deployment"** or **"Enterprise Edition"**
- Include a lock/shield icon in the corner to reinforce security

### 2. Security Checkpoint Node (Between EXOS and Cloud AI)

Add a new **InfoSec Checkpoint** node positioned between the EXOS Intelligence layer and the Cloud AI Agents:

- **Icon**: Shield with eye or lock with magnifying glass
- **Label**: "InfoSec Gate"
- **Sublabel**: "API Audit & Approval"
- **Color**: Red (#ef4444) to draw attention
- **Purpose**: Visual confirmation that security team controls what goes out

### 3. Data Flow Annotations on Arrows

Add text labels on the arrows crossing the security boundary:

| Arrow Location | Annotation |
|----------------|------------|
| EXOS Intelligence → InfoSec Gate | "Masked Request" |
| InfoSec Gate → Cloud AI | "Anonymized Only" |
| Cloud AI → InfoSec Gate | "AI Response" |
| InfoSec Gate → EXOS Intelligence | "Verified Response" |

### 4. Updated Legend

Add new legend entries:
- **Red**: Security Perimeter / InfoSec
- **Dashed line**: Enterprise boundary

---

## Technical Implementation

### Component Changes

**File: `src/components/architecture/ExosArchitectureDiagram.tsx`**

1. Add new color to palette:
   - `security: "#dc2626"` (darker red for security emphasis)

2. Create new "Customer Premises" container wrapping:
   - User Input section
   - EXOS Intelligence section
   - InfoSec Checkpoint node
   - Use `variant="solid"` with thicker border

3. Add new InfoSec Checkpoint node:
   - Position between EXOS and Cloud AI
   - Use `ShieldCheck` or `Eye` icon from Lucide

4. Update arrow components to include labels:
   - Modify existing arrows between layers
   - Add text annotations showing data state

**File: `src/components/architecture/ArchitectureArrow.tsx`**

- Already supports `label` prop
- May need styling adjustments for better label visibility

**File: `src/components/architecture/ArchitectureContainer.tsx`**

- Add support for thicker/solid borders for security perimeter
- Consider adding optional corner badge/icon

### New Layout Structure

```text
┌─────────────────────────────────────────────────────────┐
│  CUSTOMER PREMISES                                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │ User Input                                        │  │
│  │ [Wizard] [Industry] [Supplier] [Context]          │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ EXOS Intelligence (Local)                         │  │
│  │ [Anonymizer] → [Grounding] → [Market Intel]       │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌─────────────────┐                                    │
│  │ InfoSec Gate    │  "Masked Request"                  │
│  │ [API Audit]     │ ─────────────────────────→         │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
                                                    ↓
                    ┌─────────────────────────────────────┐
                    │ Cloud AI Agents (External)          │
                    │ [Auditor] [Optimizer] [Strategist]  │
                    └─────────────────────────────────────┘
```

### Files to Modify

| File | Changes |
|------|---------|
| `ExosArchitectureDiagram.tsx` | Add Customer Premises wrapper, InfoSec node, arrow labels |
| `ArchitectureContainer.tsx` | Add variant for security perimeter styling |
| `ArchitectureArrow.tsx` | Improve label positioning and visibility |

### Estimated Effort

- Moderate complexity
- No new dependencies required
- All changes within existing architecture component system
