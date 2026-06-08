# ADR-0005: Define the chat artifact rendering strategy

## Status

Proposed

## Date

2026-06-08

## Context

In the chat-first product ([ADR-0002](0002-adopt-chatbot-first-ui-surface.md)), every report,
chart, table, and KPI is produced on demand by the backend as a **chat artifact** inside the thread.
The backend returns a synthesized response (narrative, artifacts, citations, warnings, freshness,
and `trace_id`) per `POST /api/chat/messages`. This ADR records how `mirador-web` renders those
responses, including the inline chart editor and the multi-intent (metric plus knowledge) case. It
derives from upstream ADR-0005 (chat-first) and ADR-0008 (RAG knowledge layer).

## Decision Drivers

- Render heterogeneous artifact types consistently and accessibly.
- Always surface trust/observability signals (`freshness`, `warnings`, `trace_id`).
- Support visual chart edits without re-querying data, and route data changes back through the
  backend's safety path.
- Keep the frontend free of data logic — it renders backend output as data, not instructions.

## Considered Options

### Option 1: A typed artifact renderer keyed on `artifact_type`

- Pros: One narrative + a list of typed artifacts; a renderer per type; predictable, accessible,
  extensible; matches the backend response shape.
- Cons: Requires a renderer for each type and graceful handling of unknown types.

### Option 2: Render whatever HTML/markdown the backend returns

- Pros: Minimal frontend work.
- Cons: Weak accessibility, inconsistent styling, conflates backend content with presentation, risky
  if content is treated as markup. Rejected.

## Decision

Render each chat response as a **narrative block plus a list of typed artifacts**, dispatching on
`artifact_type`:

| `artifact_type` | Rendering                                                     |
| --------------- | ------------------------------------------------------------- |
| `text`          | Narrative block.                                              |
| `table`         | Accessible data table for detailed records.                   |
| `kpi`           | KPI card / metric callout (use cards for repeated metrics).   |
| `chart`         | Chart from `chart_spec`; offers the inline mini-chart editor. |
| `report`        | Composite report (narrative + chart/table).                   |
| `action_plan`   | Structured list of actions/risks/next steps.                  |
| `knowledge`     | Document-grounded narrative rendered with its `citations`.    |

Always render, per response/artifact: `freshness`, `warnings`, and a visible-or-retrievable
`trace_id`. Render `suggested_questions` and contextual quick actions to guide the CEO. For
multi-intent responses (`execution_plan` includes both `metric_query` and `knowledge_lookup`), render
the metric artifact(s) and the cited knowledge narrative together in one message.

**Mini chart editor:** the "Edit chart" action opens a contextual panel (mini chat) bound to the
artifact's `artifact_id` and calls `POST /api/chat/artifacts/:artifact_id/chart-edits`. Visual-only
edits (type, axes, series, order, format, labels, legend, colors, annotations) update the
`chart_spec` in place. If the backend returns `requires_new_query: true` (data, period, metric, or
source change), the frontend routes the request back into the main chat as a new message — it never
mutates data locally.

Treat all backend-returned content (narrative, snippets, citations) as **data to display**, not as
instructions or trusted markup.

## Rationale

A typed renderer keyed on `artifact_type` gives consistent, accessible output and matches the
backend contract exactly. Separating visual edits from data changes preserves the backend's SQL
safety guarantees while keeping chart tweaking fast and local.

## Consequences

### Positive

- Consistent, accessible rendering across artifact types.
- Trust signals are always visible; answers aren't mistaken for guaranteed truth.
- Chart tweaks are fast; data changes stay governed by the backend.

### Negative

- A renderer must be maintained per artifact type.
- Unknown/future artifact types need a graceful fallback.

### Risks and Mitigations

- Risk: Treating retrieved document content as instructions (prompt-injection surface). Mitigation:
  Render citations/snippets strictly as data; never execute or interpret them.
- Risk: Local chart edits drifting from backend truth. Mitigation: Always apply the backend's
  `updated_chart_spec`; route `requires_new_query` back to the main chat.
- Risk: Unknown `artifact_type`. Mitigation: Fall back to rendering `summary`/`text` with a notice.

## Implementation Notes

- Charts only when they answer a clear comparison question; tables for detailed records; cards for
  repeated metrics; do not nest cards inside cards (`DESIGN.md`).
- Provide text alternatives and keyboard access for charts and tables.
- Make loading, empty, partial-data, and error states explicit for every artifact.

## Related Decisions

- [ADR-0002](0002-adopt-chatbot-first-ui-surface.md) — why artifacts live in the chat.
- [ADR-0003](0003-consume-backend-via-web-api-gateway-http-client.md) — the endpoints used.
- Upstream Mirador architecture **ADR-0005** (chat-first) and **ADR-0008** (RAG knowledge layer) —
  parents.

## References

- [API Contracts](../architecture/api-contracts.md)
- Upstream `docs/strategy/guided-analytics-experience.md`,
  `docs/architecture/proposal.md` (Common Response, chart-edit flow), `DESIGN.md`.
