# ADR-0004: Handle the JWT session in the frontend

## Status

Proposed

## Date

2026-06-08

## Context

The Mirador MVP has a mandatory login and a single seeded CEO user — no public sign-up, no
self-service. The session uses a JWT (short-lived access token, role `CEO`) that the backend
validates on every protected request (parent ADR-0004 and the proposal's auth section). This ADR
records how `mirador-web` handles that session without becoming the security boundary.

## Decision Drivers

- Keep tokens out of JavaScript-readable storage (mitigate XSS token theft).
- The frontend must not enforce authorization — the backend does.
- Support route protection and redirects (`/` → `/chat` or `/login`).
- Work within Next.js SSR on Cloudflare Workers.

## Considered Options

### Option 1: httpOnly cookie set via a Next.js route handler / server boundary

- Pros: Token not readable by client JS; server components/route handlers attach it to backend
  calls; clean SSR redirect logic; aligns with the upstream "cookie httpOnly or equivalent" note.
- Cons: Requires CSRF consideration; cookie handling on Workers must be correct.

### Option 2: Access token in `localStorage`, attached by a client fetch wrapper

- Pros: Simple to implement client-side.
- Cons: Readable by any script (XSS risk), harder to use during SSR, encourages credentialed calls
  straight from the browser. Rejected.

## Decision

Store the session as an **httpOnly cookie**, set and cleared via Next.js **route handlers / server
boundary** after `POST /api/auth/login` and `POST /api/auth/logout`. Backend calls that need the
session are made server-side (route handlers / server actions / server components) so the token is
attached without exposing it to client JS. Protect routes with a server-side check using
`GET /api/auth/session`; redirect `/` to `/chat` when authenticated, else `/login`.

The frontend treats authentication as a **UX/session concern only**. It does **not** enforce
authorization; `mirador-core` validates the JWT signature and role on every request and remains the
single source of truth.

## Rationale

httpOnly cookies plus server-side attachment keep the token out of reach of page scripts and fit
Next.js SSR. Because the backend is authoritative, the frontend can keep redirects/guards as UX
affordances rather than security controls — failing closed at the backend regardless.

## Consequences

### Positive

- Tokens are not exposed to client-side scripts.
- SSR can render the correct surface per session on first request.
- Security posture does not depend on frontend correctness.

### Negative

- Requires CSRF protection for state-changing requests.
- Cookie attributes (Secure, SameSite, path, domain) must be set correctly on Workers.

### Risks and Mitigations

- Risk: CSRF on cookie-authenticated POSTs. Mitigation: SameSite cookies and/or CSRF tokens; prefer
  same-origin server-side calls.
- Risk: Stale UI after token expiry. Mitigation: Handle 401s from the backend by redirecting to
  `/login`; support refresh if the backend issues a refresh token.
- Risk: Treating frontend guards as security. Mitigation: Document that authz is backend-only;
  guards are UX only.

## Implementation Notes

- Set/clear the cookie in route handlers; never write the raw token into client-rendered HTML or
  `localStorage`.
- JWT claims to expect: `sub`, `role` (`CEO`), `exp` (and optionally `session_id`).
- Credentials are seeded via backend setup (`CEO_EMAIL`, `CEO_PASSWORD_HASH`); never hardcode them
  in this repo.

## Related Decisions

- [ADR-0003](0003-consume-backend-via-web-api-gateway-http-client.md) — how authenticated calls
  reach the backend.
- Upstream Mirador architecture **ADR-0004** (single CEO login + Railway backend for MVP) — parent.

## References

- Upstream `docs/architecture/proposal.md` (Authentication and Authorization, Login + JWT flow,
  Security sections).
