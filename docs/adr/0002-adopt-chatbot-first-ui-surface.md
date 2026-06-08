# ADR-0002: Adopt a chatbot-first UI surface (login + chat only)

## Status

Proposed

## Date

2026-06-08

## Context

Earlier framing of the product was report-first / dashboard-first. The upstream system decision
(parent ADR-0005) replaced that with a chat-first experience: after login, the CEO works in a single
chatbot view where reports are generated on demand inside the conversation. This ADR records what
that means for `mirador-web`'s information architecture.

## Decision Drivers

- Reduce prompt engineering and cognitive load for a single executive user.
- Avoid building and maintaining dashboards/report pages for an MVP.
- Keep all output generation inside one guided conversational flow.
- Keep the surface small so the team ships and iterates quickly.

## Considered Options

### Option 1: Two surfaces — `/login` and `/chat`

- Pros: Minimal surface, all reporting happens as in-thread artifacts, guidance via suggested
  questions and quick actions, aligns with the upstream decision.
- Cons: Power users lose a persistent at-a-glance dashboard; discoverability depends on good
  suggestions.

### Option 2: Dashboard-first with contextual chat

- Pros: Familiar executive at-a-glance view.
- Cons: Larger build, persistent snapshots/report pages to maintain, contradicts the upstream
  decision; explicitly out of scope for the MVP.

## Decision

Ship **two surfaces only**: `/login` (mandatory) and `/chat` (the single authenticated view). `/`
redirects to `/chat` when authenticated, else `/login`. Reports, charts, tables, KPIs, and action
plans are produced **on demand as artifacts inside the chat thread**. No dashboards, standalone
report pages, persistent snapshots, or scheduled reports in the MVP.

## Rationale

A two-surface app is the smallest thing that delivers the product's value and matches the upstream
chat-first decision. Guidance lives inside the chat (suggested questions, quick actions,
clarifications, conversational filters), so the CEO gets direction without separate screens.

## Consequences

### Positive

- Much smaller build and surface to maintain.
- One consistent place for every answer and follow-up.
- Conversation context drives follow-ups naturally.

### Negative

- No persistent dashboard for at-a-glance monitoring.
- An empty chat can intimidate without strong initial suggestions.

### Risks and Mitigations

- Risk: Empty-state intimidation. Mitigation: Always show strong suggested questions and quick
  actions; make empty/loading/error states explicit (`DESIGN.md`).
- Risk: Artifacts read as formal reports despite limited freshness/seed data. Mitigation: Always
  render `freshness` and `warnings` (see [ADR-0005](0005-define-chat-artifact-rendering-strategy.md)).

## Implementation Notes

- Composer supports intent modes `responder`, `analizar`, `reporte_visual`, `plan` (see
  [ADR-0005](0005-define-chat-artifact-rendering-strategy.md)).
- Maintain minimal conversational continuity in the UI; authoritative conversation state lives in
  the backend.
- Future dashboards/persistent reports require a new ADR.

## Related Decisions

- [ADR-0001](0001-adopt-nextjs-ssr-shadcn-frontend-stack.md) — the stack that renders these surfaces.
- [ADR-0005](0005-define-chat-artifact-rendering-strategy.md) — how in-thread artifacts render.
- Upstream Mirador architecture **ADR-0005** (chatbot-first guided analytics) — parent decision.

## References

- Upstream `docs/strategy/guided-analytics-experience.md`
- Upstream `docs/architecture/proposal.md` (Next.js SSR component, proposed routes).
