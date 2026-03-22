

# Chatbot Analytics Metrics — Proposal

## Current State

There are **two chatbot systems** with no database-level usage logging:

1. **EXOS Guide** (`chat-copilot`) — floating widget on all pages, helps users navigate
2. **Scenario Data Assistant** (`scenario-chat-assistant`) — inline panel that helps fill scenario form fields

Both currently trace to LangSmith only. The `chat_feedback` table exists but only captures thumbs up/down ratings, not usage volume or session data.

## Proposed Metrics

### Category A: Volume & Engagement
| Metric | Description | Why it matters |
|--------|-------------|----------------|
| **Total chat sessions** | Count of unique conversations started (Guide + Scenario separately) | Basic adoption signal |
| **Messages per session** | Average user messages before session ends or goal is reached | Measures conversation depth / friction |
| **Daily active chatbot users** | Unique users who sent at least 1 message per day | Engagement trend |
| **Peak usage hours** | Histogram of messages by hour-of-day | Capacity planning |

### Category B: Scenario Assistant Effectiveness
| Metric | Description | Why it matters |
|--------|-------------|----------------|
| **Field extraction rate** | % of sessions where at least 1 field was extracted | Core success metric |
| **Fields per session** | Average fields extracted per conversation | Efficiency of the assistant |
| **Apply-to-form rate** | % of sessions where user clicked "Apply to form" | Measures trust in extractions |
| **Scenario coverage** | Breakdown by scenario type showing which scenarios use the assistant most | Product focus |

### Category C: EXOS Guide Navigation
| Metric | Description | Why it matters |
|--------|-------------|----------------|
| **Navigation action rate** | % of sessions that triggered a NAVIGATE action | Measures Guide's ability to route users |
| **Navigation destinations** | Top destinations users were sent to | Content demand signal |
| **Bounce-after-chat rate** | Users who left within 30s of a navigation suggestion | Quality of routing |

### Category D: Quality & Errors
| Metric | Description | Why it matters |
|--------|-------------|----------------|
| **Error rate** | % of messages that returned an error | Reliability |
| **Rate limit hits** | Count of rate-limited requests | Capacity signal |
| **Avg response time** | Time from user send to assistant reply | UX quality |
| **Feedback score** | Thumbs up/down ratio from existing `chat_feedback` | Already partially available |

## Implementation Approach

### Step 1: New `chatbot_sessions` table
Stores one row per conversation session with aggregated metrics:

```text
chatbot_sessions
├── id (uuid)
├── user_id (uuid, nullable)
├── organization_id (uuid)
├── bot_type ('guide' | 'scenario_assistant')
├── scenario_id (text, nullable — for scenario assistant)
├── message_count (int)
├── fields_extracted (int, default 0)
├── fields_applied (boolean, default false)
├── navigation_action (text, nullable — path if NAVIGATE fired)
├── error_count (int, default 0)
├── rate_limited (boolean, default false)
├── duration_seconds (int, nullable)
├── created_at (timestamptz)
├── ended_at (timestamptz, nullable)
```

RLS: insert for authenticated users (own), select for super_admin and org_admin.

### Step 2: Frontend logging
- In `useExosChat` and `useScenarioChatAssistant`: create a session row on first message, update on each reply (increment message_count, track fields_extracted, log errors).
- On `applyToForm()`: set `fields_applied = true`.
- On chat close / unmount: set `ended_at` and compute `duration_seconds`.

### Step 3: Dashboard integration
Add a new **"Chatbot"** tab in `/admin/analytics` with:
- StatCards: Total sessions, avg messages/session, field extraction rate, error rate
- Line chart: sessions over time (Guide vs Scenario Assistant)
- Bar chart: scenario assistant usage by scenario type
- Table: recent 20 chatbot sessions with details

### Files to create/modify
1. **New migration**: `chatbot_sessions` table + RLS policies
2. `src/hooks/use-exos-chat.tsx` — add session logging
3. `src/hooks/useScenarioChatAssistant.ts` — add session logging
4. `src/hooks/useAnalyticsDashboard.ts` — add chatbot queries
5. `src/pages/admin/AnalyticsDashboard.tsx` — add Chatbot tab

