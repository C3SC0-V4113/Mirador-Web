# mirador-web

The web frontend of **Mirador**, an executive chatbot (governed Text-to-SQL + RAG) for a CEO.
`mirador-web` is one of four `mirador-*` services; it is the only one a user interacts with through a
browser, and it talks to the `mirador-core` backend over HTTP through a Cloudflare Web API Gateway.
See [docs/](docs/README.md) for architecture, API contracts, the glossary, and decision records.

Built as a Next.js app with strict quality tooling, shadcn, React Doctor, React Scan, agent docs, and Claude hooks.

## Development

```bash
npm run dev
```

Then open `/login`. The app has two surfaces: `/login` and `/chat` (see
[docs/architecture/overview.md](docs/architecture/overview.md)). `/` redirects based on session.

## Environment

Copy `.env.example` to `.env.local` and fill it in. Auth uses Auth.js (NextAuth v5) with a JWT
session (no database), kept OpenNext/Cloudflare-compatible.

| Variable              | Purpose                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `AUTH_SECRET`         | Signs the session cookie. Generate with `openssl rand -base64 32`.                                     |
| `AUTH_TRUST_HOST`     | Set `true` behind a proxy / on Cloudflare Workers.                                                     |
| `MIRADOR_API_URL`     | `mirador-core` base URL. When set, login POSTs to `${MIRADOR_API_URL}/api/auth/login`.                 |
| `SESSION_COOKIE_NAME` | Backend session cookie name forwarded by the BFF. Must match mirador-core (default `mirador_session`). |
| `SESSION_TTL_SECONDS` | Optional. Aligns the NextAuth session `maxAge` with the backend token TTL (default `86400`).           |
| `DEV_CEO_EMAIL`       | Dev-only single CEO email, used when `MIRADOR_API_URL` is empty.                                       |
| `DEV_CEO_PASSWORD`    | Dev-only single CEO password, used when `MIRADOR_API_URL` is empty.                                    |

Until `mirador-core` exists, leave `MIRADOR_API_URL` empty and log in with the dev CEO credentials.

## Deploy (Cloudflare Workers via OpenNext)

Per [ADR-0006](docs/adr/0006-deploy-on-cloudflare-workers-with-opennext.md), the frontend deploys to
Cloudflare Workers using [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). The backend
(`mirador-core`) is **not** on Workers — it runs on Railway behind the Web API Gateway.

1. `npx wrangler login` (one-time).
2. Set non-secret config in `wrangler.jsonc` → `vars` (notably `MIRADOR_API_URL`). Keep the real
   secret out of the repo: `npx wrangler secret put AUTH_SECRET`.
3. Smoke test locally in the Workers runtime: `npm run preview`.
4. Deploy: `npm run deploy`.

Notes: the app uses no Next.js Proxy/Middleware (route protection lives in server components, which
is edge-friendly) and no `runtime = "edge"` route exports — both required for OpenNext. `.dev.vars`
holds local secrets for `npm run preview` and is gitignored.

## Quality

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test
npm run doctor
npm run check
```

## Tooling

- Next.js App Router with TypeScript and Tailwind.
- shadcn UI initialized through the shadcn CLI.
- ESLint flat config with strict Next.js, React, import ordering, and Prettier integration.
- React Doctor and React Scan.
- Vitest and React Testing Library.
- Playwright E2E testing.
- Conventional commit linting.

## Documentation

- [`docs/`](docs/README.md): documentation index for mirador-web.
- [`docs/architecture/overview.md`](docs/architecture/overview.md): system context, frontend
  boundaries, and end-to-end flows.
- [`docs/architecture/api-contracts.md`](docs/architecture/api-contracts.md): backend endpoints the
  frontend consumes.
- [`docs/glossary/README.md`](docs/glossary/README.md): ubiquitous language.
- [`docs/adr/`](docs/adr/README.md): architecture decision records.

## Agent Docs

- `AGENTS.md`: agent workflow and quality gates.
- `DESIGN.md`: generic UI/UX guardrails.
- `.agents/skills`: local and installed skills.
- `CLAUDE.md`: Claude Code pointer to `AGENTS.md`.
