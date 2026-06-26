# ADR-0008: Render governed dynamic charts with Vega-Lite

## Status

Accepted

## Date

2026-06-25

## Context

The Recharts renderer covers simple line, bar, real stacked bar, area, and pie
charts. Heatmap, scatter, layered, faceted, or combined requests need richer
visual semantics without replacing the default path.

## Decision

- Keep `chart` on Recharts by default.
- Add `dynamic_chart`, rendered by direct `vega-embed` in a client-only dynamic
  component.
- Install `vega`, `vega-lite`, and `vega-embed` from npm; no CDN or `react-vega`.
- Use `actions: false`, SVG, inline data only, and `finalize()` cleanup.
- Persist the browser preference in localStorage, defaulting to `false`.
- Always render historical dynamic artifacts; block editing while disabled.
- Preserve the previous specification when regeneration fails.
- Use backend semantic labels without renaming raw row keys.

## Compatibility Matrix

| Artifact/request           | Preference off             | Preference on             |
| -------------------------- | -------------------------- | ------------------------- |
| Existing `chart`           | Recharts                   | Recharts                  |
| New incompatible request   | Backend table fallback     | Vega-Lite `dynamic_chart` |
| Historical `dynamic_chart` | Rendered; editing disabled | Rendered; editing enabled |
| Invalid dynamic edit       | Previous spec remains      | Previous spec remains     |

## Cost

Vega, Vega-Lite, and vega-embed are BSD-3-Clause and have no per-render fee.
Indirect costs are bundle transfer and browser CPU; the libraries load only when
a dynamic artifact renders.

Creation and natural-language editing each add one backend `LIGHT_MODEL` call.

```text
estimated_cost_usd =
  (input_tokens / 1_000_000 × 0.25) +
  (output_tokens / 1_000_000 × 2.00)
```

At the current `gpt-5-mini` rates, 4,000 input tokens plus 800 output tokens is
approximately USD 0.0026. This is illustrative, not a guaranteed bill.

## Consequences

### Positive

- Complex visuals preserve their intended semantics.
- No runtime CDN dependency or external data fetch is needed.
- Historical artifacts remain stable.

### Negative

- The first dynamic chart adds a client chunk and browser work.
- The frontend maintains a second renderer and editing control.

## Related Decisions

- [ADR-0005](0005-define-chat-artifact-rendering-strategy.md)
- Backend `mirador-core` ADR 0013.
