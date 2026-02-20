

## Update Testing Pipeline Diagram

Reflect all recent workflow changes in `TestingPipelineDiagram.tsx`. No new files needed -- single file update.

### Changes to the Diagram

**1. Trigger Node -- Add Scenario Focus**
- Change label from "Admin / CI-CD (Iterative Run)" to "Admin / CI-CD"
- Add sublabel: "One Scenario at a Time"
- This reflects the new workflow where testing is scoped per scenario

**2. Phase 1: Synthesis Engine -- Update Personas**
- Replace the 3 old persona nodes with 4 new ones:
  - `rushed-junior` / "Rushed Junior" / sublabel "Dump & Go"
  - `methodical-manager` / "Methodical Mgr" / sublabel "Over-detailed"
  - `cfo-finance` / "CFO / Finance" / sublabel "Financial precision"
  - `frustrated-stakeholder` / "Frustrated User" / sublabel "Messy narratives"

**3. Phase 1: Add Database-Backed Context**
- Add a small annotation/badge near the Entropy Controller or AI Generator showing "Industry & Category from DB" (replacing the old hardcoded matrix concept)
- This reflects the switch from `INDUSTRY_CATEGORY_COMPATIBILITY` to `useIndustryContexts` / `useProcurementCategories`

**4. After Phase 2: Add Session Log + Export Block**
- Add a new node between Phase 2 and Phase 3 (or alongside `test_reports`):
  - Icon: Calendar
  - Label: "Session Log"
  - Sublabel: "Groups by Date"
- Add an export node:
  - Icon: Download
  - Label: "Export Feedback"
  - Sublabel: "{scenario}_{date}.json"
  - Color: green (action output)

**5. Add External AI Consultation Step**
- After the Export Feedback node, add a new step before the Refactoring Backlog:
  - Icon: Bot or Sparkles
  - Label: "External AI Consultation"
  - Sublabel: "Field structure review"
  - Color: purple (evaluation)
- This represents step 3 of the user's workflow: consulting external AI on field adjustments

**6. Update Final Action Node**
- Change sublabel from "Update GenericScenarioWizard OR Supabase DB Schema" to "Gradual: Required -> Optional -> Raw"
- This reflects the strategic goal of increasing input flexibility

**7. Update Legend**
- Add a green legend entry for "Feedback Export" alongside existing entries

**8. Update Description Cards (TestingPipeline.tsx)**
- Update the Synthesis Engine card text from "3 buyer personas" to "4 strategic buyer personas"
- These are the glass-effect cards below the diagram on the Diagram tab

### Technical Details
- All changes are in `src/components/architecture/TestingPipelineDiagram.tsx` and `src/pages/TestingPipeline.tsx`
- Uses existing `ArchitectureNode`, `ArchitectureContainer`, and `ArchitectureArrow` primitives
- New icons needed: `Calendar`, `Download` (both already available from lucide-react)
- No database or backend changes
