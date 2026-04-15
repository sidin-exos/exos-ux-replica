# EXOS Procurement — Project Context Snapshot
**Date:** 2026-04-08

---

## 1. Product Overview

EXOS is an AI-powered procurement intelligence platform built with React + Vite + TypeScript + Tailwind CSS, backed by Supabase (project `qczblwoaiuxgesjzxjvu`). It provides scenario-based procurement analysis, market intelligence, enterprise risk/inflation tracking, and automated report generation.

**Published URL:** https://exos-procurement.lovable.app

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TypeScript 5, Tailwind CSS 3 |
| UI Library | shadcn/ui (Radix primitives) |
| State | TanStack React Query, React Context |
| Animation | Framer Motion |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Edge Functions | Deno (Supabase Edge Functions) |
| AI Models | Google AI Studio (Gemini), Perplexity |
| Observability | LangSmith, Sentry |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| Exports | ExcelJS, docx |

---

## 3. Architecture

### 3.1 Frontend Pages (29 routes)

| Route | Page | Access |
|-------|------|--------|
| `/` | Landing / Index | Public |
| `/welcome` | Welcome / Onboarding | Public |
| `/features` | Feature showcase | Public |
| `/reports` | → Features (redirected) | Public |
| `/pricing` | Pricing tiers | Public |
| `/faq` | FAQ | Auth required |
| `/report` | Generated report viewer | Auth required |
| `/market-intelligence` | Market Intel queries | Auth required |
| `/auth` | Sign in / Sign up | Public |
| `/reset-password` | Password reset | Public |
| `/unsubscribe` | Email unsubscribe | Public |
| `/account` | User account settings | Auth required |
| `/enterprise/risk` | Risk Assessment Platform | Auth required |
| `/enterprise/inflation` | Inflation Analysis Platform | Auth required |
| `/pdf-test` | PDF rendering test | Super Admin |
| `/dashboards` | Dashboard showcase | Super Admin |
| `/architecture` | Architecture diagram | Super Admin |
| `/dev-workflow` | Dev workflow diagram | Super Admin |
| `/testing-pipeline` | Testing pipeline | Super Admin |
| `/org-chart` | Org chart | Super Admin |
| `/admin/dashboard` | Founder metrics dashboard | Super Admin |
| `/admin/analytics` | Analytics dashboard | Super Admin |
| `/admin/methodology` | Methodology dashboard | Super Admin |
| `/admin/methodology/config` | Methodology config | Super Admin |
| `/admin/methodology/history` | Methodology history | Super Admin |
| `/admin/methodology/:slug` | Methodology scenario edit | Super Admin |
| `/scenarios/tco-analysis` | TCO Analysis landing | Public |
| `/scenarios/supplier-risk-assessment` | Supplier Risk landing | Public |
| `/scenarios/negotiation-preparation` | Negotiation Prep landing | Public |
| `/scenarios/make-or-buy-analysis` | Make or Buy landing | Public |
| `/scenarios/black-swan-simulation` | Black Swan landing | Public |

### 3.2 Supabase Edge Functions (18)

| Function | Purpose |
|----------|---------|
| `chat-copilot` | AI chat assistant for procurement Q&A |
| `file-download` | Secure signed-URL file downloads with org-scoped access |
| `generate-excel` | Server-side Excel report generation |
| `generate-market-insights` | AI-generated market insights by industry/category |
| `generate-pdf` | Server-side PDF generation |
| `generate-test-data` | AI test data generation for scenario testing pipeline (Engine 2) |
| `handle-email-suppression` | Webhook handler for email suppression events |
| `handle-email-unsubscribe` | Email unsubscribe token handler |
| `im-driver-propose` | AI-powered inflation driver proposal |
| `market-intelligence` | Perplexity-powered market research queries |
| `market-snapshot` | Quick market snapshot summaries |
| `preview-transactional-email` | Transactional email template preview |
| `run-inflation-scan` | Scheduled inflation event scanning |
| `run-monitor-scan` | Scheduled enterprise tracker monitoring |
| `scenario-chat-assistant` | In-scenario AI chat for form field assistance |
| `scenario-tutorial` | AI-generated scenario tutorials |
| `send-transactional-email` | Transactional email dispatch via Resend |
| `sentinel-analysis` | Full analysis pipeline (anonymize → analyze → validate → deanonymize) |

### 3.3 Database Tables (30)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with org membership and roles |
| `organizations` | Multi-tenant organization entities |
| `user_files` | File metadata for uploaded documents |
| `file_access_audit` | Audit log for file downloads |
| `enterprise_trackers` | Risk/inflation tracker configurations |
| `scenario_file_attachments` | Files attached to scenario runs |
| `scenario_feedback` | User feedback on analysis results |
| `scenario_field_config` | Per-scenario field definitions with block guidance |
| `coaching_cards` | Scenario coaching metadata and trigger phrases |
| `test_prompts` | Stored prompts for testing pipeline |
| `test_reports` | AI test execution results |
| `intel_queries` | Market intelligence query history |
| `saved_intel_configs` | Saved/scheduled intel configurations |
| `market_insights` | Knowledge base of market insights |
| `shared_reports` | Shareable report links with expiry |
| `contact_submissions` | Contact form submissions |
| `chat_feedback` | Chat message ratings |
| `chatbot_sessions` | Chatbot session tracking and analytics |
| `industry_contexts` | Industry constraint/KPI definitions |
| `procurement_categories` | Category characteristics/KPIs (enriched with Kraljic, cost drivers, etc.) |
| `rate_limits` | Rate limiting records |
| `validation_rules` | Configurable validation rules |
| `founder_metrics` | Founder dashboard metrics |
| `inflation_trackers` | Inflation tracker configurations |
| `inflation_drivers` | Inflation driver definitions per tracker |
| `inflation_event_scans` | Inflation event scan results |
| `inflation_alerts` | Inflation alert notifications |
| `monitor_reports` | Enterprise monitor scan reports |
| `methodology_config` | Methodology configuration key-value pairs |
| `methodology_change_log` | Audit log for methodology changes |
| `email_send_log` | Email dispatch audit log |
| `email_send_state` | Email sending configuration and rate control |
| `email_unsubscribe_tokens` | Unsubscribe token storage |
| `suppressed_emails` | Suppressed email addresses |
| `user_funnel_events` | User funnel tracking events |

### 3.4 Database Views (5)

| View | Purpose |
|------|---------|
| `pipeline_iq_stats` | Testing pipeline accuracy and performance stats |
| `v_checkpoint_dropoff` | Funnel checkpoint drop-off analysis |
| `v_funnel_overview` | Funnel conversion overview by cohort |
| `v_user_journey` | Individual user journey tracking |
| `v_weekly_cohort_health` | Weekly cohort health metrics |

### 3.5 Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `user-files` | No | User-uploaded documents (org-scoped) |

### 3.6 Database Functions

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
| `enqueue_email()` | Enqueues transactional email for sending |

---

## 4. Key Subsystems

### 4.1 Sentinel Pipeline
Full AI analysis pipeline: Input → Anonymize PII → AI Analysis (Gemini) → Validate response → Deanonymize → Output. Includes grounding with industry/category context XML templates. Data gap resolutions use actionable format ("Add [field] to unlock [benefit]").

### 4.2 Input Evaluator
Client-side input quality scoring system that evaluates scenario form data before submission. Runs universal checks, scenario-specific checks, and group checks.

### 4.3 Testing Pipeline (Engine 1 + Engine 2)
Dual-engine test data generation:
- **Engine 1** (client-side): Static factory using `trick-library.ts` for instant generation, all 29 scenarios.
- **Engine 2** (edge function): AI-powered generation via `generate-test-data`. Reads `scenario_field_config` for block definitions, fetches methodology context from `procurement_categories` and `industry_contexts`, generates content for all 3 blocks per scenario. Supports quality tiers (OPTIMAL/MINIMUM/DEGRADED/GIBBERISH) and persona styles (rushed-junior, methodical-manager, cfo-finance, frustrated-stakeholder, lost-user).
- Fallback: Engine 2 → Engine 1 on failure.

### 4.4 Market Intelligence
Perplexity-powered research queries with domain/recency filters, citation tracking, and save-to-knowledge-base functionality. Supports scheduled reports and enterprise trigger gates.

### 4.5 Report Export System
Multi-format export: PDF (with dashboard visualizations), Excel (ExcelJS), Word (docx), Jira (clipboard), shareable links (5-day expiry). PDF includes scenario-aware KPI footers (e.g., BATNA score for Negotiation Prep, Input Quality for others).

### 4.6 Enterprise Platforms
Risk Assessment and Inflation Analysis tracker modules with setup wizards, file upload zones, AI-powered driver proposals, event scanning, and GDPR compliance checkboxes.

### 4.7 Methodology Admin
Super-admin methodology management: per-scenario field configuration (`scenario_field_config`), coaching cards, configuration key-value pairs, and change history audit log.

### 4.8 Email System
Transactional email pipeline: template registry, Resend integration, suppression handling, unsubscribe tokens, send state management with rate limiting.

### 4.9 Analytics & Funnel
User funnel event tracking with cohort analysis, checkpoint drop-off views, weekly health metrics, and individual user journey tracking.

---

## 5. Security Model

- **Multi-tenant isolation:** All data scoped to `organization_id` via RLS policies
- **Role system:** `org_role` enum (`admin`, `manager`, `user`) on profiles table
- **Super admin:** `is_super_admin` flag on profiles for platform-level access
- **File downloads:** Org-membership verified, signed URLs (60s expiry), access audit logged
- **Rate limiting:** Per-user, per-endpoint, fail-closed mode available
- **PII protection:** Sentinel anonymizer strips sensitive data before AI processing
- **Profile guards:** Trigger prevents org transfers and unauthorized role changes
- **Edge function auth:** All sensitive endpoints require authenticated admin/super-admin

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
| `SENTRY_DSN` | Sentry error tracking |
| `RESEND_API_KEY` | Transactional email service |

---

## 7. AI Context Grounding

XML template system (`src/lib/ai-context-templates.ts`) structures industry constraints, KPIs, and category characteristics into AI prompts for context-aware analysis. Templates include:
- `generateIndustryContextXML()` — regulatory constraints + performance KPIs
- `generateCategoryContextXML()` — category characteristics + benchmarks
- `generateFullContextXML()` — combined context with cross-reference instructions
- `generateGroundedSystemPrompt()` — wraps context into system prompts

Shared modules (`supabase/functions/_shared/`):
- `trick-library.ts` — scenario definitions and field mappings
- `industry-matrix.ts` — industry/category slug matrix for test data generation

---

## 8. Recent Changes (March–April 2026)

- Rebuilt `generate-test-data` edge function: 3-block generation (Engine 2), methodology enrichment from DB, quality tier differentiation, persona styles
- Added `scenario_field_config` table with `sort_order` column for deterministic block mapping
- Deduplicated shared modules (`trick-library.ts`, `industry-matrix.ts`) from edge function to `_shared/`
- Fixed BATNA score inconsistency in PDF reports — scenario-aware KPI footer
- Updated data gap resolutions to use actionable format (removed redundant "To strengthen this analysis" prefix)
- Added methodology admin pages (dashboard, config, history, scenario edit)
- Added analytics dashboard and funnel tracking views
- Added transactional email system with suppression/unsubscribe handling
- Added chatbot session tracking table
- Enriched `procurement_categories` with Kraljic position, cost drivers, market structure, negotiation dynamics
- Added scenario SEO landing pages (TCO, Supplier Risk, Negotiation Prep, Make/Buy, Black Swan)

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
├── components/        # 120+ components organized by 27 domain directories
│   ├── analysis/      # Deep analysis pipeline
│   ├── architecture/  # System diagrams
│   ├── auth/          # Auth forms (sign up, consent, password strength)
│   ├── chat/          # Chat widget
│   ├── consolidation/ # Supplier consolidation wizard
│   ├── contact/       # Contact form
│   ├── context/       # Industry/category context editors
│   ├── dashboard/     # Dashboard cards
│   ├── enterprise/    # Enterprise tracker modules
│   ├── features/      # Feature showcase components
│   ├── feedback/      # Output and site feedback
│   ├── files/         # File management
│   ├── insights/      # Market insights
│   ├── intelligence/  # Market intelligence
│   ├── layout/        # Header, Footer, Nav, Theme
│   ├── reports/       # Report dashboards (14+ types) + PDF + export
│   ├── scenarios/     # Scenario wizard + chat assistant
│   ├── sentinel/      # Sentinel pipeline UI
│   ├── settings/      # Model config
│   ├── testing/       # Test pipeline UI
│   ├── ui/            # shadcn/ui primitives
│   └── welcome/       # Welcome/onboarding components
├── hooks/             # 28 custom hooks
├── lib/               # Business logic, AI templates, sentinel, exports
├── pages/             # 29 route pages (incl. admin, enterprise, scenarios)
├── contexts/          # React contexts
└── integrations/      # Supabase client + types

supabase/
├── functions/         # 18 edge functions
│   ├── _shared/       # Shared utilities (auth, cors, rate-limit, validate, trick-library, industry-matrix)
│   └── [function]/    # Individual function directories
└── migrations/        # Database migrations (read-only)
```
