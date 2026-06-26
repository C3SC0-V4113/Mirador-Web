# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for **mirador-web**, the frontend of
the Mirador system. These records capture the decisions this repository owns. Where a decision
derives from a system-wide decision made in the upstream Mirador architecture project, the ADR cites
that parent ADR for provenance.

## Index

| ADR                                                             | Title                                                                        | Status   | Date       |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- | ---------- |
| [0001](0001-adopt-nextjs-ssr-shadcn-frontend-stack.md)          | Adopt Next.js SSR + shadcn/ui as the frontend stack                          | Proposed | 2026-06-08 |
| [0002](0002-adopt-chatbot-first-ui-surface.md)                  | Adopt a chatbot-first UI surface (login + chat only)                         | Proposed | 2026-06-08 |
| [0003](0003-consume-backend-via-web-api-gateway-http-client.md) | Consume the backend via the Web API Gateway; no MCP in the browser           | Proposed | 2026-06-08 |
| [0004](0004-handle-jwt-session-in-the-frontend.md)              | Handle the JWT session in the frontend                                       | Proposed | 2026-06-08 |
| [0005](0005-define-chat-artifact-rendering-strategy.md)         | Define the chat artifact rendering strategy                                  | Proposed | 2026-06-08 |
| [0006](0006-deploy-on-cloudflare-workers-with-opennext.md)      | Deploy on Cloudflare Workers via OpenNext                                    | Proposed | 2026-06-08 |
| [0007](0007-adopt-authjs-credentials-jwt-and-next-proxy.md)     | Adopt Auth.js (NextAuth v5) with Credentials + JWT session and Next.js Proxy | Accepted | 2026-06-09 |
| [0008](0008-render-governed-dynamic-charts-with-vega-lite.md)   | Render governed dynamic charts with Vega-Lite                                | Accepted | 2026-06-25 |

## Creating a New ADR

1. Copy `template.md` to `NNNN-title-with-dashes.md`.
2. Fill in context, drivers, options, decision, and consequences.
3. Keep the status `Proposed` until the decision is accepted.
4. Update this index.
5. If the decision derives from an upstream Mirador architecture decision, cite the parent ADR under
   **Related Decisions**.

## Statuses

- `Proposed`: under discussion.
- `Accepted`: approved decision.
- `Rejected`: evaluated and discarded.
- `Deprecated`: no longer recommended.
- `Superseded`: replaced by another ADR.
