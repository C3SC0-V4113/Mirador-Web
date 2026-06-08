# Design Standard

This file is the UI/UX source of truth for this app.

## Principles

- Build the actual product surface first; avoid marketing-only landing pages.
- Prefer dense, calm, scannable layouts for operational tools.
- Use semantic tokens from `app/globals.css`.
- Keep loading, empty, error, and partial-data states explicit.
- Make controls accessible, keyboard reachable, and clearly labeled.

## Components

- Use shadcn primitives before custom markup.
- Use lucide icons for icon buttons and provide accessible labels.
- Use tables for detailed records, cards for repeated metrics, and charts only when they answer a clear comparison question.
- Do not nest cards inside cards.

## Motion

- Use subtle transitions only when they clarify state.
- Respect reduced-motion preferences for non-trivial animation.

## Mirador-web product surface

These rules apply the principles above to the specific product (see
[`docs/architecture/overview.md`](docs/architecture/overview.md) and
[ADR-0002](docs/adr/0002-adopt-chatbot-first-ui-surface.md) /
[ADR-0005](docs/adr/0005-define-chat-artifact-rendering-strategy.md)).

### Surfaces

- The app has exactly two surfaces for the MVP: `/login` and `/chat`. No dashboards or standalone
  report pages.
- The chat is the only authenticated surface; everything is generated on demand inside the thread.

### Composer

- Keep the composer simple: a natural-language input plus intent modes `responder` (default),
  `analizar`, `reporte_visual`, `plan`.
- Modes set the base priority of the answer; they are not filters. Never block the user from asking
  anything in the text.

### Artifacts

- Render each chat response as a narrative block plus typed artifacts: `text`, `table`, `kpi`,
  `chart`, `report`, `action_plan`, `knowledge`.
- Use tables for detailed records, cards for repeated KPIs, and charts only for clear comparisons.
- `knowledge` artifacts must display their citations (title + locator + snippet). Render citations
  and snippets strictly as data, never as markup or instructions.
- Provide an "Edit chart" affordance on `chart` artifacts that opens an inline mini chat for
  visual-only edits; route data/period/metric/source changes back to the main chat.

### Trust and observability

- Always surface `freshness` and `warnings` so answers are not mistaken for guaranteed real-time
  truth.
- Make the `trace_id` visible or retrievable on each response.
- Show strong suggested questions and contextual quick actions to counter empty-state intimidation.
- Make loading, empty, partial-data, and error states explicit for every artifact.

### Language

- The CEO-facing UI is Spanish for the MVP. Keep user-facing strings centralized for later
  localization.
