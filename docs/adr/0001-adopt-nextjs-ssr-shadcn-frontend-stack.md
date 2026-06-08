# ADR-0001: Adopt Next.js SSR + shadcn/ui as the frontend stack

## Status

Proposed

## Date

2026-06-08

## Context

`mirador-web` is the web frontend of Mirador, an executive chatbot for a single CEO user. It must
deliver a fast, accessible, minimalist surface (login + chat), render rich answers (narrative,
tables, KPIs, charts, citations), and run entirely without database or LLM credentials — all data
flows through the `mirador-core` backend. The upstream system decision (parent ADR-0002) selected
Next.js SSR + shadcn/ui for the frontend; this ADR records and scopes that choice for this
repository.

## Decision Drivers

- Fast first render and good SEO-irrelevant-but-low-TTFB delivery from the edge.
- A small, accessible component surface for an operational tool, not a marketing site.
- TypeScript end-to-end for safety against the backend's typed contracts.
- Consistency with the broader Mirador stack and deployment target (Cloudflare Workers).
- Keep client-side surface minimal; the frontend holds no secrets and no data logic.

## Considered Options

### Option 1: Next.js (App Router) with SSR + shadcn/ui + Tailwind v4

- Pros: Server-first rendering, route handlers/server actions for session/UI, mature ecosystem,
  shadcn primitives are accessible and themeable via semantic tokens, deploys to Cloudflare Workers
  via OpenNext, aligns with the upstream stack decision.
- Cons: SSR adds server runtime considerations on Workers; App Router conventions differ from older
  Next.js knowledge.

### Option 2: Client-only SPA (e.g. Vite + React Router)

- Pros: Simpler mental model, no server runtime.
- Cons: Slower first paint, weaker server-side session handling, diverges from the upstream stack
  and the Workers SSR target, more bespoke tooling.

### Option 3: Next.js with a custom design system (no shadcn)

- Pros: Full control over markup.
- Cons: Re-implements accessible primitives the team would otherwise get for free; slower to build;
  contradicts `DESIGN.md`, which mandates shadcn primitives before custom markup.

## Decision

Build `mirador-web` on **Next.js (App Router) with server-side rendering**, **TypeScript**,
**shadcn/ui** primitives, and **Tailwind CSS v4** with semantic tokens. Prefer server components by
default; introduce client components only where interactivity requires it.

## Rationale

This matches the upstream stack decision, gives a server-first architecture that fits the Cloudflare
Workers SSR target ([ADR-0006](0006-deploy-on-cloudflare-workers-with-opennext.md)), and provides
accessible, themeable components out of the box per `DESIGN.md`. It keeps the client surface small,
which is important because the frontend must not embed data or auth logic.

## Consequences

### Positive

- Accessible, consistent UI with minimal custom markup.
- Server-first rendering keeps secrets and data access off the client.
- Strong typing against backend contracts reduces integration bugs.

### Negative

- SSR on Workers requires care around runtime APIs and bundling.
- Team must follow current Next.js 16+ conventions, not model memory.

### Risks and Mitigations

- Risk: Drifting into unnecessary client-side state. Mitigation: Default to server components; gate
  client islands behind real interactivity needs (per the `project-architecture` skill).
- Risk: Using outdated Next.js APIs. Mitigation: Read `node_modules/next/dist/docs/` before changing
  framework code (per `AGENTS.md`).

## Implementation Notes

- App Router under `app/`; shadcn primitives under `components/ui/`; utilities in `lib/`.
- Use semantic tokens from `app/globals.css`; do not nest cards inside cards (`DESIGN.md`).
- Charts only when they answer a clear comparison question.

## Related Decisions

- [ADR-0002](0002-adopt-chatbot-first-ui-surface.md) — the surfaces this stack renders.
- [ADR-0006](0006-deploy-on-cloudflare-workers-with-opennext.md) — the deployment target.
- Upstream Mirador architecture **ADR-0002** (Next.js SSR, Fastify, Prisma, remote MCP) — parent
  decision this derives from.

## References

- `DESIGN.md`, `AGENTS.md`
- `.agents/skills/project-architecture/SKILL.md`
- Upstream `docs/architecture/proposal.md` (Stack and Components sections).
