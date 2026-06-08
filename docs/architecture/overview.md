# Frontend Architecture Overview

This document describes `mirador-web`: its place in the Mirador system, what it is responsible for,
the boundaries it must respect, the routes it serves, the flows it participates in, and how
cross-cutting concerns look from the frontend's perspective.

## System context

Mirador is composed of four services. `mirador-web` is the only one a human user interacts with
through a browser.

```
        CEO (browser)
            │  HTTPS
            ▼
   ┌──────────────────┐      ┌────────────────────┐
   │   mirador-web     │────▶ │  Web API Gateway    │────▶ ┌──────────────┐
   │  Next.js SSR      │      │  (Cloudflare:        │      │ mirador-core  │
   │  Cloudflare Worker│◀──── │  TLS, rate limit,    │◀──── │ Fastify+Prisma│
   └──────────────────┘      │  WAF, coarse auth)   │      │  (Railway)    │
                              └────────────────────┘      └───────┬───────┘
                                                                   │ (internal only)
   external clients ──▶ MCP API Gateway ──▶ mirador-mcp ──▶ mirador-core /internal/*
   (Claude, Cursor)                                                │
                                                          PostgreSQL + pgvector
                                            mirador-ingestion ─────┘ (RAG documents, R2)
```

Key facts that shape the frontend:

- `mirador-web` communicates **only** with `mirador-core`, over HTTP, through the **Web API
  Gateway**. The gateway terminates TLS and applies rate limiting, throttling, quotas, WAF/IP
  rules, request-size limits, and coarse auth (presence of a JWT). Fine-grained authorization lives
  in `mirador-core`.
- The browser **never** talks to MCP. MCP is a separate channel for external programmatic clients
  (Claude Desktop, Cursor/Codex) served by `mirador-mcp`. The frontend never uses `MCP_API_KEY`.
- The browser **never** generates or executes SQL, and **never** holds database or LLM provider
  credentials. It sends natural language; `mirador-core` plans, validates, and executes everything.

## Responsibilities and boundaries

`mirador-web` owns:

- Two SSR surfaces: a login screen and an executive chatbot.
- Session and UI concerns — login form, cookie handling, redirects — implemented with Next.js route
  handlers and/or server actions/components.
- Rendering of executive answers: narrative text plus inline tables, KPIs, charts, reports, action
  plans, and document citations returned by the backend.
- Conversational affordances: suggested questions, quick actions, conversational filters, and an
  inline mini chat for editing an existing chart's visualization.
- Surfacing observability and trust signals returned per response: `freshness`, `warnings`, and
  `trace_id`.

`mirador-web` does **not** own (these belong to `mirador-core`):

- SQL generation, the semantic/metric layer, the SQL safety layer, query execution.
- The knowledge (RAG) layer and citation extraction.
- LLM orchestration, the execution plan, and model selection.
- Fine-grained authorization and audit. The frontend reflects the backend's decisions; it does not
  enforce them.

Next.js route handlers and server actions are used for UI/session needs when convenient, but **all
data queries are proxied to `mirador-core`** — the frontend does not duplicate backend abstractions.

## Routes (MVP)

The MVP is a deliberately small, two-surface application (see [ADR-0002](../adr/0002-adopt-chatbot-first-ui-surface.md)).

| Route    | Purpose                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `/login` | Mandatory login. Single seeded CEO user, JWT-based session, no public sign-up.                                          |
| `/chat`  | The executive chatbot — the only authenticated surface. Reports are generated on demand as artifacts inside the thread. |
| `/`      | Redirects to `/chat` when a valid session exists, otherwise to `/login`.                                                |

There are no dashboards or standalone report pages in the MVP.

## End-to-end flows

### 1. Login + JWT

1. The CEO opens `/login`.
2. `mirador-web` posts credentials to `POST /api/auth/login`.
3. `mirador-core` validates the seeded user's password hash and issues a JWT with role `CEO`.
4. `mirador-web` persists the session in an httpOnly cookie (or equivalent), set via a Next.js
   route handler / server boundary.
5. The CEO is taken to `/chat`.

See [ADR-0004](../adr/0004-handle-jwt-session-in-the-frontend.md).

### 2. Chat-first request

1. The CEO writes a question (or picks a suggested one) and optionally selects an `intent_mode`.
2. `mirador-web` posts the message to `POST /api/chat/messages`. The request passes through the Web
   API Gateway before reaching Fastify.
3. `mirador-core` validates the JWT/role/session, plans an `execution_plan` (metric and/or knowledge
   lookups), runs it, and synthesizes a single response.
4. `mirador-web` renders the narrative plus inline artifacts (table/KPI/chart/report/action plan),
   document citations, suggested follow-up questions, any `warnings`, `freshness`, and the
   `trace_id`.

See [ADR-0005](../adr/0005-define-chat-artifact-rendering-strategy.md).

### 3. Chart edit

1. The CEO triggers "Edit chart" on an artifact of type `chart`.
2. `mirador-web` opens a contextual panel with a mini chat bound to the `artifact_id`.
3. It posts the instruction to `POST /api/chat/artifacts/:artifact_id/chart-edits`.
4. If the change is purely visual, the backend returns an `updated_chart_spec` (no new query).
5. If the instruction would change data, period, metric, or source, the backend returns
   `requires_new_query: true`; the frontend routes that back to the main chat as a new message
   (which re-enters the SQL safety path on the backend).

## Cross-cutting concerns (frontend angle)

### Security

- The frontend holds **no secrets**. The Web API Gateway handles coarse auth and traffic control;
  `mirador-core` enforces fine-grained authorization (JWT signature + role). The frontend reflects
  authz outcomes, it does not implement them.
- The frontend never sends SQL and never uses MCP credentials. Web auth and MCP auth are fully
  separate.
- Treat backend-returned content (narrative, citations) as data to render, not as instructions.

### Observability

- Every chat response carries a `trace_id`; surface it (visibly or retrievably) so the CEO and
  operators can correlate a UI answer with backend audit logs.
- Render `freshness` (data recency/status) and `warnings` (data-quality notices) so executive
  answers are never mistaken for guaranteed real-time truth.

### Performance

- SSR delivers the initial surfaces from the edge (Cloudflare Workers). The frontend is effectively
  **stateless** — conversation state lives in `mirador-core`.
- Cost/latency optimizations (prompt caching, parallel metric/knowledge lookups) live in the
  backend; the frontend benefits from them but does not manage them.

### Accessibility and i18n

- Build on shadcn primitives and semantic tokens (see `DESIGN.md`); provide accessible labels for
  icon buttons and keyboard-reachable controls. Charts and tables must have text alternatives.
- The CEO-facing UI is Spanish for the MVP. Keep user-facing strings centralized so the UI can be
  localized later without structural changes.

## Related

- [API Contracts](api-contracts.md)
- [Glossary](../glossary/README.md)
- ADRs: [0001](../adr/0001-adopt-nextjs-ssr-shadcn-frontend-stack.md),
  [0002](../adr/0002-adopt-chatbot-first-ui-surface.md),
  [0003](../adr/0003-consume-backend-via-web-api-gateway-http-client.md),
  [0004](../adr/0004-handle-jwt-session-in-the-frontend.md),
  [0005](../adr/0005-define-chat-artifact-rendering-strategy.md),
  [0006](../adr/0006-deploy-on-cloudflare-workers-with-opennext.md)
