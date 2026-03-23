

## Update Risk Assessment Platform to Dynamic Monitoring Module Methodology

### Context
The attached methodology document defines a comprehensive "Dynamic Monitoring Module" with 3 foundational principles, 5 monitoring types (DM-1 through DM-5), a Delta-First scoring framework (DRS 0-100), and specific UI requirements. The current Risk Platform page uses generic language and a simple tracker model that doesn't reflect these principles.

This plan covers **Phase 1 UI alignment** -- updating the page content, structure, and setup wizard to reflect the methodology. Backend (database tables, edge functions) will be a separate follow-up.

### Changes

#### 1. Update `src/pages/enterprise/RiskPlatform.tsx`
- **Rename heading**: "Risk Assessment Platform" → "Dynamic Monitoring Module"
- **Update subtitle**: Reference the Δ-First principle and zones of attention
- **Replace CAPABILITIES array** with the 3 foundational principles:
  1. Human-in-the-Loop by Design (decision-support, not decision-making)
  2. Dynamics over Absolutes (Δ arrow as dominant signal, trajectories not positions)
  3. Continuous Modelling, Not Ready-Made Advice (monitors and models, does not prescribe)
- **Replace "How it works" content** with methodology-aligned explanation: DRS scoring (0-100, 100 = most stable), 5 monitoring types (DM-1 Hypothesis Testing, DM-2 Risk Assessment, DM-3 Risk Dynamics, DM-4 Country/Region, DM-5 Industry), comparison periods (WoW/MoM/QoQ/YoY)
- **Add monitoring types overview**: A grid showing all 5 DM types with their purpose, whether DRS applies, and phase availability (Phase 1: DM-1 & DM-2 active; Phase 2: DM-3/4/5 marked "Coming Soon")
- **Update tabs**: Keep Monitor/Setup/Reports structure but label Setup as "New Monitor"
- **Add DRS band legend**: Small reference showing bands A-E (Resilient → Critical) with color coding

#### 2. Update `src/components/enterprise/TrackerSetupWizard.tsx`
- **Add monitoring type selector** as Step 0: User picks DM-1 (Hypothesis Testing) or DM-2 (Risk Assessment) — the two Phase 1 types. DM-3/4/5 shown as disabled with "Coming Soon" badges
- **Adapt input fields per type**:
  - DM-1: Block 1 (Hypothesis Statement), Block 2 (Context & Constraints), Block 3 (Evidence Already Held - optional)
  - DM-2: Block 1 (Entity & Context with entity type selector: supplier/category/contract/project), Block 2 (Risk Data per dimension), Block 3 (Assessment Parameters: risk appetite, dimension weight overrides, comparison period default)
- **Update terminology**: "Tracker" → "Monitor" throughout
- **Add comparison period selector** (WoW/MoM/QoQ/YoY, default MoM)
- Steps become: Type Selection → Input Blocks → Files & Context → Review & Activate

#### 3. Update `src/components/enterprise/TrackerList.tsx`
- **Rename**: Conceptually from "tracker cards" to "monitor cards"
- **Add DRS display**: Show DRS score with band color (A=green, B=blue, C=amber, D=orange, E=red)
- **Add Δ arrow rendering**: The primary visual element per the spec — direction arrow (up/down), magnitude (single/double), color-coded, with Δ value and period label
- **Add monitoring type badge**: DM-1 through DM-5 badge on each card
- **Sort default**: By Δ magnitude (most changed first), not by creation date
- **Show**: Entity type, last assessment date, next recommended date, unacknowledged alert count

#### 4. Update `src/hooks/useEnterpriseTrackers.ts`
- **Extend types**: Add `monitor_type` (DM-1 through DM-5), `entity_type`, `default_period`, `dimension_weights`, `alert_thresholds` to the tracker interface
- **Rename type exports**: `TrackerType` → keep but add `MonitorType` union for DM-1..DM-5

### Technical Details
- No database migrations in this phase — the existing `enterprise_trackers` table's `parameters` JSONB column can store the new fields (monitor_type, entity_type, dimension_weights, etc.) until dedicated `dm_monitors` / `dm_snapshots` / `dm_alerts` tables are created
- DRS scores and Δ values will be placeholder/skeleton UI until the backend scoring edge functions are built
- All language in the UI will follow Principle I constraints: no "you should", "we recommend" — only "this area warrants attention", "the