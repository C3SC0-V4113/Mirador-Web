# ADR-0003: Consume the backend via the Web API Gateway; no MCP in the browser

## Status

Proposed

## Date

2026-06-08

## Context

Mirador exposes two front doors: a web app (this repo) and a remote MCP service for external clients
(Claude Desktop, Cursor/Codex). The upstream decision (parent ADR-0007) split MCP into its own
service behind its own gateway, and placed a **Web API Gateway** in front of the Fastify backend for
the web's interactive traffic. The backend also exposes an internal API (`/internal/core/*`) for
service-to-service calls. This ADR records how `mirador-web` talks to the backend.

## Decision Drivers

- Avoid exposing an unnecessary surface (MCP abstractions) in the browser.
- Avoid duplicating backend abstractions in the frontend.
- Keep web auth and MCP auth strictly separate; the frontend must never hold `MCP_API_KEY`.
- Let the edge handle TLS, rate limiting, WAF, and coarse auth before requests reach the backend.

## Considered Options

### Option 1: Frontend calls Fastify HTTP APIs through the Web API Gateway

- Pros: Single, purpose-built interactive API for the web; gateway handles traffic control and
  coarse auth; clean separation from MCP; no duplicated abstractions.
- Cons: The frontend depends on the gateway and backend being reachable; contract must be kept in
  sync with the backend.

### Option 2: Frontend speaks MCP directly

- Pros: Reuses the MCP tool surface.
- Cons: Exposes a programmatic protocol and its credentials to the browser, duplicates abstractions,
  conflates web and MCP auth, larger attack surface. Explicitly rejected upstream.

### Option 3: Frontend calls the internal core API (`/internal/core/*`)

- Pros: Direct access to the pipeline.
- Cons: That API is service-to-service only, not routed through the Web API Gateway, and is rejected
  on public interfaces. Not available to the browser by design.

## Decision

`mirador-web` consumes **only** the public web APIs — `/api/auth/*`, `/api/chat/*`, `/api/schema/*`
— through the **Web API Gateway**. It does **not** speak MCP, does **not** call `/internal/core/*`,
and does **not** carry MCP credentials. Use a small typed HTTP client wrapper for these calls.

## Rationale

This keeps the browser surface minimal and secure, reuses the single interactive API the backend
already provides, and respects the upstream separation of web vs MCP channels. The gateway absorbs
traffic-control and coarse-auth concerns so the frontend stays thin.

## Consequences

### Positive

- Minimal, well-defined client surface; no leaked credentials or protocols.
- Edge-level protection (TLS, rate limiting, WAF) before the backend.
- Web and MCP channels evolve independently.

### Negative

- The frontend must track the backend's HTTP contract (see
  [API Contracts](../architecture/api-contracts.md)).

### Risks and Mitigations

- Risk: Contract drift between frontend and backend. Mitigation: Keep `api-contracts.md` current and
  prefer generated/shared types once the backend publishes them.
- Risk: Accidentally importing MCP concerns into the web. Mitigation: No MCP client code in this
  repo; document the boundary in the glossary and overview.

## Implementation Notes

- Centralize backend calls in a typed client (base URL from an env var pointing at the Web API
  Gateway). Do not scatter `fetch` calls with hardcoded hosts.
- Server-side calls (route handlers / server actions) attach the session; never expose the gateway
  to credentialed direct browser calls that bypass session handling
  (see [ADR-0004](0004-handle-jwt-session-in-the-frontend.md)).

## Related Decisions

- [ADR-0004](0004-handle-jwt-session-in-the-frontend.md) — how the session token rides these calls.
- [ADR-0006](0006-deploy-on-cloudflare-workers-with-opennext.md) — where these requests originate.
- Upstream Mirador architecture **ADR-0007** (API gateways + standalone MCP service) — parent.

## References

- Upstream `docs/architecture/proposal.md` (API Gateway, Fastify endpoints, Security sections).
