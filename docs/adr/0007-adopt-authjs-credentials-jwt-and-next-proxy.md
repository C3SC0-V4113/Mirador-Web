# ADR-0007: Adopt Auth.js (NextAuth v5) with Credentials + JWT session and Next.js Proxy

## Status

Accepted

## Date

2026-06-09

## Context

[ADR-0004](0004-handle-jwt-session-in-the-frontend.md) proposed that the frontend manage a JWT
session in an httpOnly cookie while `mirador-core` remains the authoritative auth owner. That ADR
left the concrete library and route-protection mechanism open. This ADR records the implementation
choice made while scaffolding the login + chat surfaces.

Two constraints shaped the decision:

- The backend (`mirador-core`) does not exist yet as a running service, but the app must be runnable
  now with a single CEO user.
- The app targets Cloudflare Workers via OpenNext ([ADR-0006](0006-deploy-on-cloudflare-workers-with-opennext.md)),
  so the auth flow must avoid Node-only APIs in any edge path, avoid a frontend database, and use
  web-standard `fetch`.

A relevant framework change surfaced during implementation: **Next.js 16 renamed Middleware to
Proxy**. Route protection now lives in `proxy.ts` (not `middleware.ts`) and runs on the Node.js
runtime.

## Decision Drivers

- The frontend should wrap a session, not own a user store — the backend owns auth (ADR-0004).
- No frontend database; the frontend stays effectively stateless.
- Tokens must not be readable by client-side JavaScript (httpOnly cookie).
- OpenNext/Cloudflare compatibility: web-standard `fetch`, no Node-only edge dependencies.
- `/chat` must be protected; unauthenticated users are redirected to `/login`.
- The app must work today, before `mirador-core` is available.

## Considered Options

### Option 1: Auth.js (NextAuth v5) — Credentials provider + JWT session, no database

- Pros: Purpose-built for Next.js; JWT (`strategy: 'jwt'`) keeps sessions in a signed httpOnly
  cookie with no database; Credentials `authorize` delegates to the backend (or a dev fallback);
  integrates with the Next.js Proxy for route protection; works on the Workers/Node runtime.
- Cons: v5 is a beta line; documentation assumes `middleware.ts` (pre-Next-16 naming); the proxy
  export must be a statically detectable function.

### Option 2: better-auth

- Pros: Full-featured, modern.
- Cons: Its model assumes it owns the user/session store (needs a database, e.g. D1/SQLite). Since
  `mirador-core` owns auth, this adds a database and complexity that contradict the stateless
  frontend. Rejected (also weighed in the scaffolding decision).

### Option 3: Custom auth with `jose` + `cookies()`

- Pros: Minimal dependencies; full control; the Next.js docs describe this pattern.
- Cons: Re-implements session signing/refresh/CSRF handling the team would otherwise get for free;
  not the "specialized auth library" the task called for. Kept only as a fallback if Auth.js proved
  incompatible with Next 16.

## Decision

Use **Auth.js (NextAuth v5)** with a **Credentials provider** and **`session.strategy: 'jwt'`** (no
database). The session is stored in Auth.js's signed **httpOnly cookie**; the backend `access_token`
and `role` are carried inside the token via the `jwt`/`session` callbacks for display only.

Credential verification lives in `lib/auth/credentials.ts`: it POSTs to
`${MIRADOR_API_URL}/api/auth/login` when configured, and otherwise validates a single dev CEO
(`DEV_CEO_EMAIL` / `DEV_CEO_PASSWORD`) so the app runs before `mirador-core` exists. It uses only
web-standard `fetch`.

Route protection uses the **Next.js 16 Proxy** (`proxy.ts`) wired to Auth.js's `authorized`
callback, which redirects unauthenticated requests to `/chat` to `/login`. Authenticated users on
`/login` and the `/` entry are redirected by the server components via `auth()`.

`auth.ts` exports only `handlers` and `auth`; the client surfaces use `signIn`/`signOut` from
`next-auth/react`. The frontend does **not** enforce fine-grained authorization — `mirador-core`
does (ADR-0004).

## Rationale

Auth.js with a Credentials provider and JWT strategy is the lightest option that satisfies all
drivers: it gives an httpOnly cookie session with no database, delegates the actual credential check
to the backend (or the dev fallback), and plugs into the Next.js Proxy for protection. better-auth's
strength is owning the user store, which is redundant and contradictory here. A fully custom `jose`
implementation would re-build session/CSRF mechanics for no benefit. Because Next 16's Proxy runs on
the Node runtime, no edge-split config is required.

## Consequences

### Positive

- No frontend database; sessions are a signed httpOnly cookie.
- The backend stays the single source of truth for auth; the frontend is a thin session wrapper.
- One switch (`MIRADOR_API_URL`) moves from the dev fallback to the real backend.
- Edge/OpenNext-compatible: web-standard `fetch`, Node-runtime proxy, no DB.

### Negative

- Depends on the NextAuth v5 beta line.
- Carries a dev-only credential path that must never reach production untouched.

### Risks and Mitigations

- Risk: NextAuth v5 / Next 16 incompatibility. Mitigation: validated `npm run build` and chromium
  E2E; the `jose` + `cookies()` approach remains a documented fallback.
- Risk: The Next 16 Proxy rejects a non-detectable default export. Mitigation: export the Auth.js
  wrapper as a local function (`export default auth(() => undefined)`), which the build detects.
- Risk: Dev credentials shipping to production. Mitigation: the dev path is used only when
  `MIRADOR_API_URL` is empty; document this and require the backend URL in deployed environments.
- Risk: CSRF on cookie-authenticated requests. Mitigation: Auth.js applies CSRF protection for its
  endpoints; prefer same-origin server-side calls for backend requests.

## Implementation Notes

- Files: `auth.ts` (config), `proxy.ts` (route protection), `app/api/auth/[...nextauth]/route.ts`
  (handlers), `lib/auth/credentials.ts` (verification), `types/next-auth.d.ts` (session/JWT
  augmentation).
- Env: `AUTH_SECRET`, `AUTH_TRUST_HOST`, `MIRADOR_API_URL`, `DEV_CEO_EMAIL`, `DEV_CEO_PASSWORD`
  (see `.env.example`).
- The `jwt` callback persists `role` and `accessToken`; the `session` callback exposes them. JWT
  module augmentation does not merge through `next-auth/jwt` in v5, so token fields are cast at the
  read site.
- The login form uses `signIn('credentials', { redirect: false })` then client-side navigation;
  logout uses `signOut({ redirectTo: '/login' })`.

## Related Decisions

- [ADR-0004](0004-handle-jwt-session-in-the-frontend.md) — this ADR implements that proposal.
- [ADR-0003](0003-consume-backend-via-web-api-gateway-http-client.md) — backend is consumed via the
  gateway; auth follows the same boundary.
- [ADR-0001](0001-adopt-nextjs-ssr-shadcn-frontend-stack.md) and
  [ADR-0006](0006-deploy-on-cloudflare-workers-with-opennext.md) — stack and deployment target.
- Upstream Mirador architecture **ADR-0002** (stack) and **ADR-0004** (single CEO login) — parents.

## References

- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` (Middleware → Proxy rename).
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md`.
- Auth.js (NextAuth v5) documentation.
