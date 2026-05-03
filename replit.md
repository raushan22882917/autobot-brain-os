# Decision Brain — Personal Decision Intelligence OS

## Overview

Full-stack executive decision intelligence platform. pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (deep space navy / electric indigo theme)
- **Auth**: Clerk (via Replit integration, white-label proxy)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Build**: esbuild (ESM bundle)
- **Routing**: wouter (client-side)
- **Charts**: Recharts

## Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| `decision-brain` | `/` | React+Vite frontend |
| `api-server` | `/api` | Express 5 REST API |
| `mockup-sandbox` | `/__mockup` | Component preview server (canvas) |

## DB Tables (PostgreSQL via Drizzle)

- `users` — Clerk userId (text PK), email
- `decisions` — userId FK, title, description, stakes (low/medium/high/critical), status, sourcePlatform, tags, rawContext
- `outcomes` — userId FK, decisionId FK, score (0-100), checkInterval (30d/90d/180d), notes, trackedAt
- `alerts` — userId FK, decisionId FK, alertType, severity, title, description, isRead
- `integrations` — userId FK, platform (unique+userId), status, lastSyncedAt, accessToken, refreshToken
- `reports` — userId FK, reportType (board_briefing/weekly/pattern_analysis), title, content

## API Routes (all under `/api`)

- `GET /api/healthz`
- `GET/POST /api/auth/me`
- `GET/POST /api/decisions` — list (search, filter, pagination) + create
- `GET/PUT/DELETE /api/decisions/:id` — detail with outcomes+alerts, update, delete
- `GET /api/decisions/:id/similar` — keyword-based similar decisions
- `POST /api/outcomes` — log outcome score
- `GET /api/outcomes/pending` — decisions awaiting review
- `PUT /api/outcomes/:id` — update outcome
- `GET /api/alerts` — list (filter unread)
- `PATCH /api/alerts/:id/read` — mark read
- `GET /api/integrations` — all platforms (incl virtual disconnected entries)
- `POST /api/integrations/:platform/connect` — connect platform
- `DELETE /api/integrations/:platform/disconnect` — disconnect platform
- `GET/POST /api/reports` — list + generate AI report
- `GET /api/reports/:id` — single report
- `GET /api/analytics/overview` — dashboard KPIs + velocity + stakes distribution
- `GET /api/analytics/outcomes` — outcome analytics
- `GET /api/analytics/patterns` — pattern analytics (uses alerts table)
- `GET /api/analytics/blindspots` — blindspot analysis by tag category
- `POST /api/chat` — keyword-based decision graph Q&A

## Frontend Pages

- `/` — Landing (signed-out) or redirect to `/dashboard` (signed-in)
- `/sign-in`, `/sign-up` — Clerk auth pages (dark themed)
- `/dashboard` — KPI cards + Decision Velocity chart + Stakes donut chart
- `/decisions` — Decision Log with search, filter, stakes badges + create dialog
- `/decisions/:id` — Decision Detail (context, outcomes, alerts, similar decisions)
- `/outcomes` — Pending outcome reviews
- `/alerts` — Active alerts (unread/all toggle, mark-read)
- `/integrations` — Platform connection grid (Gmail, Zoom, Slack, Meet, Teams, Notion, Outlook, DocuSign)
- `/patterns` — Pattern analytics (bar chart, recent discoveries list)
- `/blindspots` — Blind spot analysis by category
- `/reports` — Intelligence reports (generate + list)
- `/chat` — AI chat interface (keyword-search based, Gemini-ready)
- `/settings` — Executive profile (Clerk user data)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Important Notes

- Clerk proxy URL: `/api/__clerk` (hardcoded in backend app.ts)
- AI chat uses keyword fallback (no Gemini key required). Add `GEMINI_API_KEY` env secret to enable LLM responses.
- `integrationsTable` has a `(userId, platform)` unique constraint
- `lib/api-zod/src/index.ts` must only contain: `export * from "./generated/api";` (codegen script enforces this)
- Do NOT add leaf workspace packages to root tsconfig.json references

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
