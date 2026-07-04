# ADR-0009: Render sandboxed HTML dashboards in an isolated iframe

## Status

Accepted

## Date

2026-07-01

## Context

Some CEO requests are best answered with a small, ad hoc HTML dashboard (KPI
blocks plus a canvas chart) rather than a Recharts `chart` or a Vega-Lite
`dynamic_chart`. The backend can generate this HTML with an LLM, but AI-authored
HTML is untrusted content: it must never run with access to this app's cookies,
local storage, DOM, or same-origin network calls.

`mirador-core` sanitizes the HTML server-side (parse5 allowlist, CSP `sha256`
meta injected into the document) before it reaches the frontend. The frontend's
job is isolation and warning UX — not sanitization. Rendering untrusted HTML
therefore needs a containment boundary the frontend fully controls, independent
of whatever the backend already stripped.

## Decision

- Add `sandbox_dashboard`, rendered in a sandboxed `<iframe>` via `srcDoc`,
  loaded through a client-only dynamic component (same lazy pattern as
  `dynamic_chart`).
- Set `sandbox="allow-scripts"` only. Never add `allow-same-origin`,
  `allow-forms`, `allow-popups`, or `allow-downloads`. The iframe's opaque
  origin (guaranteed by omitting `allow-same-origin`) is the isolation
  boundary; `allow-scripts` alone lets the dashboard's own inline script run
  against its own opaque, unprivileged document.
- Set `referrerPolicy="no-referrer"` so the iframe never leaks the parent URL.
- Add a belt-and-suspenders client-side tripwire: before rendering, scan
  `sandboxHtml` for obviously unsafe patterns (`<iframe`, `<form`, `<object`,
  `<embed`, inline event handlers, `javascript:`). On a match, render an error
  state instead of the iframe and log a console warning. This is defense in
  depth, not a sanitizer — the backend's parse5 allowlist is the real
  sanitization boundary.
- Render a permanent warning banner (amber tone, `TriangleAlert` icon) on every
  `sandbox_dashboard` artifact, always visible regardless of the preference
  state, because AI-generated dashboards can contain visual or calculation
  errors that must be verified against source data.
- Persist the browser preference (`mirador-sandbox-dashboards` in
  localStorage), defaulting to `false`, mirroring `dynamic_charts_enabled`.
- Require a confirmation dialog the first time the user flips the preference
  from off to on (an `alert-dialog` built on `@base-ui/react`'s
  `AlertDialog` primitive, following this repo's shadcn "base-nova" style).
  Disabling the preference flips immediately, no confirmation needed.
- Always render historical `sandbox_dashboard` artifacts; block editing while
  the preference is off, matching the `dynamic_chart` precedent.
- Guarantee `chartSpec` and `dynamicChartSpec` stay `undefined` on
  `sandbox_dashboard` artifacts regardless of what the backend sends, so the
  three chart-shaped renderers never collide.

## Compatibility Matrix

| Artifact/request                 | Preference off                  | Preference on                |
| -------------------------------- | ------------------------------- | ---------------------------- |
| New `sandbox_dashboard` request  | Not requested (flag is `false`) | Rendered in sandboxed iframe |
| Historical `sandbox_dashboard`   | Rendered; editing disabled      | Rendered; editing enabled    |
| Invalid dashboard edit           | Previous HTML remains           | Previous HTML remains        |
| `sandboxHtml` fails the tripwire | Error state, no iframe          | Error state, no iframe       |

## Cost

Creation and natural-language editing each add one backend LLM call, same cost
model as `dynamic_chart` (ADR-0008). The frontend cost is a single iframe
render; no additional client bundle beyond the lazy-loaded wrapper.

## Consequences

### Positive

- Untrusted AI-authored HTML never executes with access to this app's origin.
- The warning banner and confirmation dialog make the experimental,
  verify-your-numbers nature of the feature explicit to the CEO.
- The client-side tripwire catches a misconfigured or regressed backend before
  the browser ever parses the HTML as a same-context document.

### Negative

- The frontend maintains a third renderer and editing control, alongside
  `chart` and `dynamic_chart`.
- The tripwire is a blunt regex; it does not replace, and must never be relied
  on as, the actual sanitizer.

## Related Decisions

- [ADR-0005](0005-define-chat-artifact-rendering-strategy.md)
- [ADR-0008](0008-render-governed-dynamic-charts-with-vega-lite.md)
