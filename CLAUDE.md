# CLAUDE.md — EXOS UX Replica

## Project Overview

EXOS is an AI-powered procurement intelligence platform. It helps procurement teams analyze scenarios, run market intelligence research, and generate structured reports with actionable recommendations. The product is built as a React SPA backed by Supabase (database + edge functions).

**Status (as of 2026-03-10):** Production-ready backend, Beta frontend. Multi-tenant architecture live.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite (SWC) |
| Styling | Tailwind CSS + shadcn/ui (Radix UI primitives) |
| Routing | React Router v6 |
| State / Data Fetching | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PDF Export | @react-pdf/renderer |
| Backend | Supabase (Postgres + Edge Functions on Deno) |
| Auth | Supabase Auth (email/password) |
| AI Gateway | Google AI Studio (Gemini) via Lovable Cloud gateway |
| Observability | LangSmith (server-side only, fire-and-forget) |
| Animation | Framer Motion |
| Fonts | Inter (body), Space Grotesk (display) |

---

## Repository Structure

```
exos-ux-replica/
├── src/
│   ├── App.tsx                  # Route definitions and provider tree
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Global styles + CSS custom properties
│   ├── pages/                   # Top-level route components
│   │   ├── Index.tsx            # Homepage with scenario cards
│   │   ├── Reports.tsx          # Reports hub
│   │   ├── GeneratedReport.tsx  # AI report viewer + export
│   │   ├── MarketIntelligence.tsx
│   │   ├── DashboardShowcase.tsx
│   │   ├── Auth.tsx / ResetPassword.tsx / Account.tsx
│   │   ├── admin/FounderDashboard.tsx   # Super-admin only
│   │   └── enterprise/
│   │       ├── RiskPlatform.tsx
│   │       └── InflationPlatform.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (DO NOT edit directly)
│   │   ├── layout/              # Header, MobileBottomNav, ThemeToggle
│   │   ├── scenarios/           # Scenario wizard and related components
│   │   ├── reports/             # Dashboard renderers and export buttons
│   │   │   └── pdf/             # React-PDF report document + visuals
│   │   ├── intelligence/        # Market intelligence components
│   │   ├── enterprise/          # TrackerSetupWizard, TrackerList, FileUploadZone
│   │   ├── sentinel/            # Pipeline visualization components
│   │   ├── analysis/            # Deep analysis pipeline UI
│   │   ├── consolidation/       # Consolidation wizard
│   │   ├── context/             # Industry/category context editors
│   │   ├── chat/                # ChatWidget and ChatMessage
│   │   ├── insights/            # Market insights banner + admin
│   │   ├── architecture/        # Internal architecture diagrams
│   │   ├── testing/             # Internal testing dashboard components
│   │   ├── dashboard/           # StatCard, ScenarioCard
│   │   └── feedback/            # OutputFeedback
│   ├── hooks/                   # Custom React hooks
│   ├── contexts/
│   │   └── ModelConfigContext.tsx  # Gemini model selection (persisted to localStorage)
│   ├── lib/
│   │   ├── scenarios.ts         # All 29 scenario definitions
│   │   ├── sentinel/            # Client-side AI pipeline utilities
│   │   │   ├── anonymizer.ts    # PII anonymization
│   │   │   ├── deanonymizer.ts  # PII restoration (with HTML escaping)
│   │   │   ├── validator.ts     # Response validation
│   │   │   ├── orchestrator.ts  # Pipeline orchestrator
│   │   │   ├── grounding.ts     # Context grounding
│   │   │   └── types.ts         # All Sentinel types
│   │   ├── ai/
│   │   │   ├── graph.ts         # Lightweight pipeline orchestrator
│   │   │   ├── langsmith-client.ts  # Browser-compatible LangSmith REST client
│   │   │   └── trace-utils.ts   # Tracing helpers
│   │   ├── dashboard-mappings.ts     # Maps scenario types to dashboard components
│   │   ├── dashboard-data-parser.ts  # Parses AI output into dashboard data
│   │   ├── scenarios.ts         # Scenario registry with fields/tags/icons
│   │   ├── chat-service.ts      # Chat copilot service
│   │   ├── scenario-chat-service.ts
│   │   ├── report-export-excel.ts
│   │   ├── report-export-jira.ts
│   │   └── utils.ts             # cn() and other utilities
│   ├── integrations/supabase/
│   │   ├── client.ts            # Supabase client (auto-generated, do not edit)
│   │   └── types.ts             # Database type definitions (auto-generated)
│   └── test/                    # Vitest test files
│       ├── setup.ts
│       ├── example.test.ts
│       └── dashboard-mappings.test.ts
├── supabase/
│   ├── config.toml              # Supabase project config
│   ├── functions/               # Deno edge functions
│   │   ├── _shared/             # Shared utilities across functions
│   │   │   ├── auth.ts          # JWT validation, role checks
│   │   │   ├── validate.ts      # Input validation helpers
│   │   │   ├── langsmith.ts     # Fire-and-forget LangSmith tracer
│   │   │   ├── chatbot-instructions.ts  # Centralized chatbot intelligence
│   │   │   ├── anonymizer.ts    # PII anonymization
│   │   │   └── google-ai.ts     # Google AI Studio client
│   │   ├── sentinel-analysis/   # Core AI inference (authenticated)
│   │   ├── chat-copilot/        # Onboarding chatbot (public)
│   │   ├── scenario-chat-assistant/  # Per-scenario coaching (public)
│   │   ├── scenario-tutorial/   # Contextual tips (public)
│   │   ├── market-intelligence/ # Perplexity Sonar Pro (authenticated)
│   │   ├── market-snapshot/     # Perplexity + quality gate (authenticated)
│   │   ├── generate-market-insights/  # Admin only
│   │   └── generate-test-data/  # Admin only
│   └── migrations/              # Ordered SQL migration files
├── docs/                        # Project documentation snapshots
│   ├── AI_WORKFLOW.md           # Chain-of-Experts workflow constitution
│   ├── TESTING_PLAN.md          # Comprehensive manual test plan
│   ├── ORG_CHART.md             # Team/agent org chart
│   ├── RLS_POLICIES_*.md        # RLS policy documentation
│   └── PROJECT_CONTEXT_*.md     # Dated architecture snapshots
├── public/                      # Static assets
├── tailwind.config.ts
├── vite.config.ts               # Dev server on port 8080
├── vitest.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── components.json              # shadcn/ui configuration
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (port 8080)
npm run dev

# Production build
npm run build

# Development build (with source maps)
npm run build:dev

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests (single pass)
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Routes

| Path | Component | Auth |
|------|-----------|------|
| `/` | Index | Public |
| `/features` | Features | Public |
| `/reports` | Reports | Public |
| `/pricing` | Pricing | Public |
| `/faq` | FAQ | Public |
| `/report` | GeneratedReport | Public |
| `/dashboards` | DashboardShowcase | Public |
| `/market-intelligence` | MarketIntelligence | Authenticated |
| `/architecture` | ArchitectureDiagram | Public |
| `/dev-workflow` | DevWorkflow | Public |
| `/testing-pipeline` | TestingPipeline | Public |
| `/org-chart` | OrgChart | Public |
| `/auth` | Auth | Public |
| `/reset-password` | ResetPassword | Public |
| `/account` | Account | Authenticated |
| `/admin/dashboard` | FounderDashboard | Super-admin only |
| `/enterprise/risk` | RiskPlatform | Authenticated |
| `/enterprise/inflation` | InflationPlatform | Authenticated |

**Important:** All new routes must be added **above** the catch-all `<Route path="*" />` in `App.tsx`.

---

## Key Architectural Patterns

### 1. Provider Tree (App.tsx)

```
ThemeProvider (next-themes, defaultTheme="light")
  └── ModelConfigProvider (Gemini model selection)
        └── QueryClientProvider (TanStack React Query)
              └── TooltipProvider
                    └── BrowserRouter
                          └── Routes + MobileBottomNav
```

### 2. Sentinel Pipeline (AI Inference)

Every AI analysis request flows through the Sentinel pipeline:

1. **Client-side anonymization** — PII stripped and replaced with tokens (`src/lib/sentinel/anonymizer.ts`)
2. **Edge function call** — `sentinel-analysis` Supabase function handles server-side grounding (fetches industry/category context from DB), assembles the prompt, calls the AI gateway, and traces to LangSmith
3. **Client-side validation** — Response checked for quality (`src/lib/sentinel/validator.ts`)
4. **De-anonymization** — Tokens replaced with original values (`src/lib/sentinel/deanonymizer.ts`)
5. **Self-correction loop** — Up to 3 retries on validation failure

**Security note:** LangSmith tracing is server-side only. Never expose LangSmith API keys to the client.

### 3. Model Configuration

- Available models: Gemini 3/2.5 variants (see `ModelConfigContext.tsx`)
- Default: `gemini-3-flash-preview`
- Stored in `localStorage` under key `exos_model_config`
- Configurable via `src/components/settings/ModelConfigPanel.tsx`

### 4. Multi-Tenant Architecture

All user-owned database tables are scoped to `organization_id`. Key RPC functions:
- `get_user_org_id()` — Returns user's org ID
- `get_user_org_role()` — Returns `admin | manager | user`
- `is_org_admin()` — Boolean org admin check

Org roles (`org_role` enum): `admin`, `manager`, `user`
App roles (`app_role` enum): `admin`, `user` (legacy `user_roles` table)

### 5. Dashboard System

- 29 procurement scenarios defined in `src/lib/scenarios.ts`
- Each scenario maps to a dashboard type via `src/lib/dashboard-mappings.ts`
- Dashboard components live in `src/components/reports/`
- PDF versions of dashboards are in `src/components/reports/pdf/`
- `DashboardRenderer.tsx` selects the correct dashboard component at runtime

### 6. Scenario 3-Block Meta-Pattern

All scenarios follow a universal input pattern:
1. **`industryContext`** (textarea, required) — Industry & business context
2. **2-3 scenario-specific textareas** (required) — Core data
3. **1-2 optional textareas** — Additional context/benchmarks/constraints

### 7. Path Alias

The `@` alias maps to `./src`. Use it for all imports:
```typescript
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
```

---

## Edge Functions

All backend logic runs through Supabase Edge Functions (Deno runtime). Never add server-side logic to the React frontend.

| Function | Auth Required | Purpose |
|----------|--------------|---------|
| `sentinel-analysis` | Yes (JWT) | Core AI inference with grounding + LangSmith |
| `market-intelligence` | Yes (JWT) | Perplexity Sonar Pro market research |
| `market-snapshot` | Yes (JWT) | Market snapshot with quality gate |
| `chat-copilot` | No | Public onboarding chatbot |
| `scenario-chat-assistant` | No | Per-scenario coaching assistant |
| `scenario-tutorial` | No | Contextual scenario tips |
| `generate-market-insights` | Admin only | Batch market insights generation |
| `generate-test-data` | Admin only | Test data factory |

**Shared utilities** (`supabase/functions/_shared/`):
- `auth.ts` — JWT validation via `getClaims()`, admin role check
- `validate.ts` — Input validation, size limits
- `langsmith.ts` — Fire-and-forget tracer (exponential backoff, never disrupts main pipeline)
- `chatbot-instructions.ts` — Centralized chatbot intelligence (identity, coaching cards, GDPR, escalation)
- `anonymizer.ts` — PII anonymization
- `google-ai.ts` — Google AI Studio client

All API keys (Perplexity, Google, LangSmith) are stored in Supabase Edge Secrets. Never hardcode them.

---

## Database & Security Rules

### Non-Negotiable Constraints

- **RLS is mandatory on all tables.** No exceptions.
- Never expose PII in AI pipeline traces.
- TypeScript strict mode — no `any` types.
- All AI calls use temperature 0.2 with anti-hallucination protocols.
- All LangSmith tracing is server-side only.

### RLS Pattern

```sql
-- Standard org-scoped policy pattern
USING (organization_id = get_user_org_id())
WITH CHECK (organization_id = get_user_org_id());
```

### Key Tables

- `organizations` — Org records
- `profiles` — User profiles with `org_role` and `organization_id`
- `enterprise_trackers` — Enterprise platform trackers (org-scoped)
- `market_insights` — Knowledge base (service role write only; client read-only)
- `intel_queries` — Market intelligence query history
- `saved_intel_configs` — Scheduled report configurations
- `shared_reports` — Shareable report links (128-bit ID, 5-day expiry, 1MB limit)
- `chat_feedback` — Anonymous feedback inserts
- `scenario_feedback` — Anonymous scenario feedback
- `contact_submissions` — Public contact form
- `validation_rules` — Public read-only AI validation rules
- `founder_metrics` — Super-admin only

### Shared Reports

Access only via Security Definer RPCs:
- `create_shared_report` — Server-side ID generation (`gen_random_bytes(16)`)
- `get_shared_report` — Authenticated access only

---

## Component Conventions

### UI Components

- Use shadcn/ui components from `src/components/ui/` — do not modify them directly
- Add new shadcn components via `npx shadcn-ui@latest add <component>`
- Use `lucide-react` for icons
- Use `cn()` from `@/lib/utils` for conditional class merging

### Styling Conventions

- Dark mode via `class` strategy (`darkMode: ["class"]` in Tailwind config)
- Theme toggle controlled by `next-themes`
- Color tokens: use CSS custom properties (`hsl(var(--primary))`, etc.)
- Font: `font-sans` = Inter, `font-display` = Space Grotesk
- Custom semantic colors: `success`, `warning`, `highlight` (in addition to standard shadcn tokens)
- Mobile bottom navigation: `<div className="pb-14 md:pb-0">` wrapper required around page content

### New Components

- Keep components small and focused (shadcn/ui philosophy)
- Co-locate component-specific hooks when possible
- Hooks that fetch Supabase data should use `useQuery` from TanStack React Query
- Follow the existing domain folder structure: `analysis/`, `intelligence/`, `enterprise/`, etc.

### Protected Routes

Wrap with `<ProtectedRoute>` for authenticated routes:
```tsx
<Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
// Super-admin:
<Route path="/admin/dashboard" element={<ProtectedRoute requireSuperAdmin><FounderDashboard /></ProtectedRoute>} />
```

---

## Testing

Tests use **Vitest** with jsdom environment and `@testing-library/react`.

- Test files: `src/**/*.{test,spec}.{ts,tsx}` and `supabase/functions/_shared/**/*.{test,spec}.ts`
- Setup file: `src/test/setup.ts`

```bash
npm test           # Run all tests once
npm run test:watch # Watch mode
```

Existing tests:
- `src/test/dashboard-mappings.test.ts` — Dashboard scenario mapping validation
- `src/test/example.test.ts` — Smoke test

---

## Export Capabilities

Reports can be exported in three formats:
- **Excel (.xlsx)** — Via `xlsx` library (`src/lib/report-export-excel.ts`)
- **Jira** — Copy-to-clipboard in Jira markdown (`src/lib/report-export-jira.ts`)
- **PDF** — React-PDF renderer (`src/components/reports/pdf/`)

---

## Known Mocks (Not Yet Wired)

| Priority | Item | Description |
|----------|------|-------------|
| P0 | Stripe Integration | Pricing page has no real payment flow |
| P0 | Consolidation Wizard AI | `mockResults` hardcoded in `ConsolidationWizard.tsx` |
| P1 | Chat Persistence | Chat history lost on page reload |
| P2 | PDF Export Stubs | Some PDF dashboard visuals use placeholder data |
| P2 | pgvector Search | Knowledge base uses basic text match, not embeddings |
| P2 | Scheduled Reports Cron | Configs saved but not auto-executed |
| P3 | Enterprise Trigger Gate | UI-only gate, no real subscription tier check |
| P3 | Deep Analysis Pipeline | Animation only, stages not wired to separate edge calls |

---

## AI Development Workflow

EXOS uses a **Chain-of-Experts** workflow (see `docs/AI_WORKFLOW.md`):

1. **Architect (Gemini)** — System design, DB schema, API contracts
2. **Auditor (Gemini)** — Security review, RLS validation. Pipeline halts on risk blocks.
3. **Tech Lead (Gemini)** — Implementation spec → Lovable-ready prompt
4. **Pilot (Human)** — Reviews spec before it reaches the builder
5. **Builder (Lovable/Claude)** — Code generation
6. **Pilot (Human)** — Visual QA → deploy or iterate

**Core Principles:**
- Human-in-the-loop always. AI proposes; the Pilot decides.
- No autonomous deployments.
- Challenge instructions that conflict with technical constraints.
- Every decision is logged.

---

## Performance Notes

- **Surgical Context Injection:** Grounding fetches only specific industry/category rows by slug — reduces input tokens ~60% per request
- **Chatbot Token Budgets:** `chat-copilot` ~3,000 tokens; `scenario-chat-assistant` ~1,500 tokens
- **Lazy Loading:** `RecentQueries` uses pull model (load on click only) — no ghost API calls on page load
- **LangSmith Mode:** "Production Quiet" — only errors and critical metrics, no verbose logs

---

## Environment Variables

Required for local development (`.env`):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

Edge function secrets (configured in Supabase project, not in `.env`):
- `PERPLEXITY_API_KEY`
- `GOOGLE_AI_API_KEY`
- `LANGSMITH_API_KEY`
- `LOVABLE_API_KEY`

**Never commit API keys.** The `supabase/functions/` code accesses them via `Deno.env.get("KEY_NAME")`.
