# ADR-0006: Deploy on Cloudflare Workers via OpenNext

## Status

Proposed

## Date

2026-06-08

## Context

The upstream stack decision places the Next.js SSR frontend on **Cloudflare Workers** (parent
ADR-0002), with the backend on Railway behind a Cloudflare Web API Gateway. This ADR records the
deployment target and the constraints it puts on `mirador-web`.

## Decision Drivers

- Low-latency SSR at the edge, close to the user.
- Consistency with the Cloudflare edge already used for the Web API Gateway.
- Secrets must stay server-side (Workers Secrets), never in the client bundle.
- Cost: the frontend should sit comfortably in/near Cloudflare's free tier for the MVP.

## Considered Options

### Option 1: Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`)

- Pros: Edge SSR, integrates with the existing Cloudflare edge and gateways, Workers Secrets for
  config, aligns with the upstream decision and the rest of the platform.
- Cons: Workers runtime is not full Node.js; some APIs/libraries need adapters; build/deploy via
  OpenNext + Wrangler must be configured and validated.

### Option 2: Vercel

- Pros: First-class Next.js hosting, minimal config.
- Cons: Diverges from the Cloudflare-centric platform (gateways, R2); splits the edge across
  providers. Not chosen for the MVP.

### Option 3: Node server on Railway (alongside the backend)

- Pros: Full Node runtime, co-located with the backend.
- Cons: Loses edge SSR benefits, adds a long-running server to operate; the frontend is meant to be
  stateless and edge-served.

## Decision

Deploy `mirador-web` to **Cloudflare Workers using OpenNext** (`@opennextjs/cloudflare`) for SSR.
Manage configuration via **Workers Secrets / environment variables** — notably the base URL of the
**Web API Gateway** the frontend calls. Keep all secrets server-side; the client bundle contains no
credentials.

## Rationale

This keeps the whole user-facing edge on Cloudflare (consistent with the Web API Gateway and R2),
gives low-latency SSR, and fits the upstream stack decision. OpenNext is the supported path for
running Next.js SSR on Workers.

## Consequences

### Positive

- Edge SSR with low latency and simple scaling.
- One platform for the frontend edge and the API gateway.
- Secrets stay in Workers Secrets, off the client.

### Negative

- The Workers runtime constrains library/API choices; some need adapters.
- Build/deploy pipeline (OpenNext + Wrangler) must be set up and validated.

### Risks and Mitigations

- Risk: A dependency relies on Node-only APIs unavailable on Workers. Mitigation: Prefer
  edge-compatible libraries; validate with a deploy smoke test early.
- Risk: Misconfigured env/secrets (e.g. gateway URL) breaking SSR data calls. Mitigation: Validate
  required env vars at startup; document them in `README.md`.

## Implementation Notes

- Use `@opennextjs/cloudflare` + Wrangler for build and deploy; this requires wiring not present in
  the current scaffold and will be added when deployment work begins.
- Required runtime config includes the Web API Gateway base URL (see
  [ADR-0003](0003-consume-backend-via-web-api-gateway-http-client.md)).
- Do not expose secrets to the client; only safe public values may use `NEXT_PUBLIC_*`.

## Related Decisions

- [ADR-0001](0001-adopt-nextjs-ssr-shadcn-frontend-stack.md) — the SSR stack being deployed.
- [ADR-0003](0003-consume-backend-via-web-api-gateway-http-client.md) — the gateway this frontend
  calls.
- Upstream Mirador architecture **ADR-0002** (stack) and **ADR-0007** (API gateways) — parents.

## References

- Upstream `docs/architecture/proposal.md` (Stack, deployment notes),
  `docs/cost/architecture-cost.md` (frontend cost on Workers).
