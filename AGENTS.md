<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This project uses Next.js 16 or newer. APIs and conventions may differ from model memory. Read relevant guides in `node_modules/next/dist/docs/` before changing Next.js code.

<!-- END:nextjs-agent-rules -->

## Quality Gates

Run these before claiming implementation complete:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run format:check`
4. `npm run test`

- Run `npm run test:e2e` when E2E behavior changed.
- `npm run doctor`
- `npm run check`

Do not use `next lint`; use the ESLint CLI.

## References

- Architecture and scripts: `README.md`
- System context, frontend boundaries, and flows: `docs/architecture/overview.md`
- Backend endpoints the frontend consumes: `docs/architecture/api-contracts.md`
- Ubiquitous language: `docs/glossary/README.md`
- Architecture decision records: `docs/adr/`
- Design rules: `DESIGN.md`
- Next.js guidance: `.agents/skills/next-best-practices/SKILL.md`
- Minimum evaluation: `.agents/skills/project-min-evaluation/SKILL.md`
- Vitest guidance: `.agents/skills/vitest/SKILL.md`
- Playwright guidance: `.agents/skills/playwright-best-practices/SKILL.md`
- Commit messages are checked with commitlint.

## Claude Code

`CLAUDE.md` points to this file. `.claude/skills` should link to `.agents/skills`.
