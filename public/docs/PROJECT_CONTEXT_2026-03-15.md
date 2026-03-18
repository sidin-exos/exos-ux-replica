# EXOS Procurement — Project Context Snapshot
**Date:** 2026-03-15

---

## 1. Product Overview

EXOS is an AI-powered procurement intelligence platform built with React + Vite + TypeScript + Tailwind CSS, backed by Supabase (project `qczblwoaiuxgesjzxjvu`). It provides scenario-based procurement analysis, market intelligence, enterprise risk/inflation tracking, and automated report generation.

**Published URL:** https://exos-procurement.lovable.app

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| UI Library | shadcn/ui (Radix primitives) |
| State | TanStack React Query, React Context |
| Animation | Framer Motion |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Edge Functions | Deno (Supabase Edge Functions) |
| AI Models | Google AI Studio (Gemini), Perplexity |
| Observability | LangSmith |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| Exports | ExcelJS, docx |

---

## 3. Architecture

### 3.1 Frontend Pages (19 routes)

| Route | Page | Access |
|-------|------|--------|
| `/` | Landing / Index | Public |
| `/features` | Feature showcase | Public |
| `/reports` | Scenario wizard + analysis | Public |
| `/pricing` | Pricing tiers | Public |
| `/faq` | FAQ | Public |
| `/report` | Generated report viewer | Public |
| `/market-intelligence` | Market Intel queries | Public |
| `/auth` | Sign in / Sign up | Public |
| `/reset-password` | Password reset | Public |
| `/account` | User account settings | Auth required |
| `/enterprise/risk` | Risk Assessment platform | Public (auth for data) |
| `/enterprise/inflation` | Inflation Analysis platform | Public (auth for data) |
| `/pdf-test` | PDF rendering test | Public |
| `/dashboards` | Dashboard showcase | Super Admin |
| `/architecture` | Architecture diagram | Super Admin |
| `/dev-workflow` | Dev workflow diagram | Super Admin |
| `/testing-pipeline` | Testing pipeline | Super Admin |
| `/org-chart` | Org chart | Super Admin |
| `/admin/dashboard` | Founder metrics dashboard | Super Admin |

### 3.2 Supabase Edge Functions (11)

| Function | Purpose |
|----------|---------|
| `chat-copilot` | AI chat assistant for procurement Q&A |
| `file-download` | Secure signed-URL file downloads with org-scoped access |
| `generate-market-insights` | AI-generated market insights by industry/category |
| `generate-pdf` | Server-side PDF generation |
| `generate-test-data` | AI test data generation for scenario testing pipeline |
| `market-intelligence` | Perplexity-powered market research queries |
| `market-snapshot` | Quick market snapshot summaries |
| `scenario-chat-assistant` | In-scenario AI chat for form field assistance |
| `scenario-tutorial` | AI-generated scenario tutorials |
| `sentinel-analysis` | Full analysis pipeline (anonymize → analyze → validate → deanonymize) |

### 3.3 Database Tables (17)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with org membership and roles |
| `organizations` | Multi-tenant organization entities |
| `user_files` | File metadata for uploaded documents |
| `file_access_audit` | Audit log for file downloads |
| `enterprise_trackers` | Risk/inflation tracker configurations |
| `scenario_file_attachments` | Files attached to scenario runs |
| `scenario_feedback` | User feedback on analysis results |
| `test_prompts` | Stored prompts for testing pipeline |
| `test_reports` | AI test execution results |
| `intel_queries` | Market intelligence query history |
| `saved_intel_configs` | Saved/scheduled intel configurations |
| `market_insights` | Knowledge base of market insights |
| `shared_reports` | Shareable report links with expiry |
| `contact_submissions` | Contact form submissions |
| `chat_feedback` | Chat message ratings |
| `industry_contexts` | Industry constraint/KPI definitions |
| `procurement_categories` | Category characteristics/KPIs |
| `rate_limits` | Rate limiting records |
| `validation_rules` | Configurable validation rules |
| `founder_metrics` | Founder dashboard metrics |

### 3.4 Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `user-files` | No | User-uploaded documents (org-scoped) |

### 3.5 Database Functions

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Trigger: creates org + profile on signup |
| `auto_set_organization_id()` | Trigger: auto-fills org_id on insert |
| `guard_profile_update()` | Trigger: prevents unauthorized role/org changes |
| `get_user_org_id()` | Returns user's organization ID |
| `get_user_org_role()` | Returns user's org role |
| `is_org_admin()` | Checks if user is org admin |
| `is_super_admin()` | Checks if user is super admin |
| `create_shared_report()` | Creates shareable report with crypto ID |
| `get_shared_report()` | Retrieves shared report (auto-cleans expired) |
| `save_intel_to_knowledge_base()` | Saves intel query results to market_insights |
| `get_evolutionary_directives()` | Extracts field optimization suggestions from test data |
| `cleanup_rate_limits()` | Purges old rate limit records |

---

## 4. Key Subsystems

### 4.1 Sentinel Pipeline
Full AI analysis pipeline: Input → Anonymize PII → AI Analysis (Gemini) → Validate response → Deanonymize → Output. Includes grounding with industry/category context XML templates.

### 4.2 Input Evaluator
Client-side input quality scoring system that evaluates scenario form data before submission. Runs universal checks, scenario-specific checks, and group checks.

### 4.3 Testing Pipeline
Automated AI output quality testing: Draft test cases → Generate test data → Run against AI models → Compare results → Shadow logging for field redundancy analysis.

### 4.4 Market Intelligence
Perplexity-powered research queries with domain/recency filters, citation tracking, and save-to-knowledge-base functionality. Supports scheduled reports and enterprise trigger gates.

### 4.5 Report Export System
Multi-format export: PDF (with dashboard visualizations), Excel (ExcelJS), Word (docx), Jira (clipboard), shareable links (5-day expiry). Notion/Confluence/Slack/Trello planned.

### 4.6 Enterprise Platforms
Risk Assessment and Inflation Analysis tracker modules with setup wizards, file upload zones, and GDPR compliance checkboxes.

---

## 5. Security Model

- **Multi-tenant isolation:** All data scoped to `organization_id` via RLS policies
- **Role system:** `org_role` enum (`admin`, `manager`, `user`) on profiles table
- **Super admin:** `is_super_admin` flag on profiles for platform-level access
- **File downloads:** Org-membership verified, signed URLs (60s expiry), access audit logged
- **Rate limiting:** Per-user, per-endpoint, fail-closed mode available
- **PII protection:** Sentinel anonymizer strips sensitive data before AI processing
- **Profile guards:** Trigger prevents org transfers and unauthorized role changes

---

## 6. Secrets Configuration

| Secret | Purpose |
|--------|---------|
| `GOOGLE_AI_STUDIO_KEY` | Gemini AI model access |
| `PERPLEXITY_API_KEY` | Market intelligence queries |
| `LANGCHAIN_API_KEY` | LangSmith tracing |
| `LANGCHAIN_ENDPOINT` | LangSmith endpoint |
| `LANGCHAIN_PROJECT` | LangSmith project name |
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_DB_URL` | Direct database connection |
| `SUPABASE_PUBLISHABLE_KEY` | Alias for anon key |
| ~~`LOVABLE_API_KEY`~~ | Legacy — remove from secrets |

---

## 7. AI Context Grounding

XML template system (`src/lib/ai-context-templates.ts`) structures industry constraints, KPIs, and category characteristics into AI prompts for context-aware analysis. Templates include:
- `generateIndustryContextXML()` — regulatory constraints + performance KPIs
- `generateCategoryContextXML()` — category characteristics + benchmarks
- `generateFullContextXML()` — combined context with cross-reference instructions
- `generateGroundedSystemPrompt()` — wraps context into system prompts

---

## 8. Recent Changes (March 2026)

- Fixed `generate-test-data` edge function: migrated from hardcoded schemas to dynamic field derivation from `SCENARIO_BLOCK_GUIDANCE`
- Added auth gating for Draft Test Case / Approve & Generate flows
- Fixed `[object Object]` display bug in drafted test case fields (nested JSON stringification)
- Ongoing: Dashboard visualization system with 14+ dashboard types
- Ongoing: PDF export with server-side rendering via edge function

---

## 9. Team Structure

AI-first organization (see `docs/ORG_CHART.md`):
- **CEO & Pilot:** Human founder
- **CTO Scope:** Gemini Architect + Gemini Auditor + Cloud infra
- **Head of AI:** Gemini Tech Lead + LangSmith + Prompt Factory
- **Delivery:** AI-assisted development + Human QA
- **Growth:** Future hire (currently founder-led)

---

## 10. File Structure Summary

```
src/
├── components/        # 100+ components organized by domain
│   ├── analysis/      # Deep analysis pipeline
│   ├── architecture/  # System diagrams
│   ├── auth/          # Auth prompts
│   ├── chat/          # Chat widget
│   ├── consolidation/ # Supplier consolidation wizard
│   ├── context/       # Industry/category context editors
│   ├── dashboard/     # Dashboard cards
│   ├── enterprise/    # Enterprise tracker modules
│   ├── features/      # Feature showcase components
│   ├── feedback/      # Output feedback
│   ├── files/         # File management
│   ├── insights/      # Market insights
│   ├── intelligence/  # Market intelligence
│   ├── layout/        # Header, Footer, Nav
│   ├── reports/       # Report dashboards (14+ types) + PDF + export
│   ├── scenarios/     # Scenario wizard + chat assistant
│   ├── sentinel/      # Sentinel pipeline UI
│   ├── settings/      # Model config
│   ├── testing/       # Test pipeline UI
│   └── ui/            # shadcn/ui primitives
├── hooks/             # 20+ custom hooks
├── lib/               # Business logic, AI templates, sentinel, exports
├── pages/             # 19 route pages
├── contexts/          # React contexts
└── integrations/      # Supabase client + types

supabase/
├── functions/         # 11 edge functions
│   ├── _shared/       # Shared utilities (auth, cors, rate-limit, validate)
│   └── [function]/    # Individual function directories
└── migrations/        # Database migrations (read-only)
```
