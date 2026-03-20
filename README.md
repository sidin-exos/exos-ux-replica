# EXOS — AI-Powered Procurement Intelligence

B2B procurement analytics platform built with React, TypeScript, and Supabase.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI
- **Backend:** Supabase (PostgreSQL + Edge Functions in Deno)
- **AI:** Google AI Studio (Gemini), Perplexity sonar-pro
- **Observability:** LangSmith (server-side tracing)

## Local Development

Requires Node.js 20+ and npm.

```sh
# Install dependencies
npm install

# Start dev server (http://localhost:8080)
npm run dev

# Production build
npm run build

# Type check
npx tsc --noEmit

# Run tests
npm run test
```

## Environment Variables

### Frontend (`VITE_*` in `.env`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |

### Edge Functions (Supabase Dashboard → Secrets)

| Variable | Description |
|---|---|
| `GOOGLE_AI_STUDIO_KEY` | Google AI Studio API key |
| `PERPLEXITY_API_KEY` | Perplexity API key (market intelligence) |
| `LANGCHAIN_API_KEY` | LangSmith tracing API key |
| `LANGCHAIN_PROJECT` | LangSmith project name (default: `EXOS`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (set automatically) |

## Project Structure

```
src/
├── components/   # React components organized by feature
├── hooks/        # Custom React hooks
├── lib/          # Utilities, AI pipeline, sentinel privacy layer
├── pages/        # Route-level page components
├── contexts/     # React contexts (model config, etc.)
└── integrations/ # Supabase client & auto-generated types

supabase/
├── functions/    # Deno edge functions
├── migrations/   # PostgreSQL migrations
└── config.toml   # Supabase project config
```
