---
name: project-architecture
description: Generic project architecture and design guardrails. Use when changing UI, layout, component architecture, state flow, theming, or Next.js server/client boundaries.
---

# Project Architecture Guardrails

Use this skill when a change touches UI, component structure, app behavior, theming, or data display.

## Rules

1. Keep the app server-first unless interactivity requires a client island.
2. Read relevant Next.js docs in `node_modules/next/dist/docs/` before changing framework APIs.
3. Respect `DESIGN.md` for visual and UX decisions.
4. Use shadcn primitives and semantic tokens before custom styling.
5. Add tests proportional to risk.

## Pre-Close Checklist

- Did the change add unnecessary client-side surface?
- Does it follow `DESIGN.md`?
- Are loading, empty, and error states explicit?
- Did you run `.agents/skills/project-min-evaluation/SKILL.md` before claiming completion?
