

## EXOS Automated Testing Pipeline Flowchart

### Overview
Create a new diagram component and page visualizing the 3-phase automated testing pipeline, using the exact same component primitives as the Dev Workflow diagram (`ArchitectureNode`, `ArchitectureContainer`, `ArchitectureArrow`).

### Files to Create

#### 1. `src/components/architecture/TestingPipelineDiagram.tsx`

The main diagram component. Vertical flex layout matching `DevWorkflowDiagram` conventions.

**Structure (top to bottom):**

**Trigger Node** -- "Admin / CI-CD" with Play icon, orange color.

**Phase 1: Synthesis Engine** -- Dashed container, orange tint.
- 3 persona nodes in a row: `executive_sponsor` (Dump & Go), `solo_procurement_hero` (Mixed), `tactical_category_manager` (Over-detailed)
- Arrow down to central node: "AI Data Generator (Gemini 3.1)" with Bot icon
- Arrow out labeled "Raw Messy Prompts" to a Database icon node (`test_prompts` table)

**Phase 2: Execution Pipeline** -- Dashed container, blue tint.
- "Test Runner" node fetches from `test_prompts`
- Arrow to "sentinel-analysis (Edge Function)" node with Shield icon
- Red dashed retry badge on the sentinel node: "Retry on 503 / Fallback to Lovable Gateway"
- Arrow out labeled "Extracted JSON" to Database icon node (`test_reports` table)
- Dashed line to "LangSmith" observability node (green/purple)

**Phase 3: LLM Auditor** -- Dashed container, purple tint.
- "AI Judge (Deep Reasoning)" node receiving Extracted JSON + Target Success Criteria
- 3 parallel outcome boxes:
  - Green: `REDUNDANT_HIDE` (AI always gets this right)
  - Yellow/amber: `OPTIONAL_KEEP` (Mixed results)
  - Red border: `CRITICAL_REQUIRE` (AI fails to extract/hallucinates)

**Final Action** -- "UI Refactoring Backlog" node (GenericScenarioWizard Update) with Wrench icon, green color.

**Legend bar** at the bottom matching Dev Workflow style: Blue = Production Systems, Orange = Simulated Data, Purple = Evaluation Logic, Dashed Red = Fail/Retry.

All colors follow the existing `COLORS` constant pattern. Icons from `lucide-react`: `Play`, `UserCircle`, `Bot`, `Database`, `Shield`, `Eye`, `Scale`, `Wrench`, `RefreshCw`, `CheckCircle`, `AlertTriangle`, `XCircle`, `BarChart3`.

#### 2. `src/pages/TestingPipeline.tsx`

Page wrapper following the exact pattern of `src/pages/DevWorkflow.tsx`:
- Header + NavLink back to "/features"
- Title: "EXOS Automated Testing Pipeline"
- Subtitle: "Entropy-based test synthesis, production execution, and LLM-as-a-Judge evaluation."
- PNG/SVG download buttons using `html-to-image`
- Diagram rendered inside `card-elevated` container with `ref`
- 3 explanation cards at the bottom for each phase

#### 3. `src/App.tsx` -- Add route

Add route: `<Route path="/testing-pipeline" element={<TestingPipeline />} />`

### Technical Details

- No new dependencies -- uses existing `ArchitectureNode`, `ArchitectureContainer`, `ArchitectureArrow` components plus `html-to-image` (already installed)
- Color palette: `orange: "#f59e0b"`, `blue: "#3b82f6"`, `green: "#10b981"`, `purple: "#8b5cf6"`, `red: "#ef4444"`, `gray: "#64748b"`, `amber: "#f59e0b"` (same as DevWorkflow)
- Vertical flex layout with `min-w-[700px]` for horizontal scroll on small screens
- All nodes use the same 16x16 rounded icon style from `ArchitectureNode`
- Containers use `ArchitectureContainer` with `variant="dashed"` and colored titles
- The retry badge on the sentinel node uses a `rounded-full bg-red-50 border border-red-200` pill (same pattern as the "Risk Blocked" badge in DevWorkflow)
- The 3 outcome boxes in Phase 3 are simple bordered divs with colored left borders (green/amber/red) -- not full `ArchitectureNode` components, to visually differentiate evaluation results from system nodes

### No database or edge function changes required.

