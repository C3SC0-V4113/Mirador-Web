# Next Quality App

Next.js app scaffolded with strict quality tooling, shadcn, React Doctor, React Scan, agent docs, and Claude hooks.

## Development

```bash
npm run dev
```

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

## Agent Docs

- `AGENTS.md`: agent workflow and quality gates.
- `DESIGN.md`: generic UI/UX guardrails.
- `.agents/skills`: local and installed skills.
- `CLAUDE.md`: Claude Code pointer to `AGENTS.md`.
