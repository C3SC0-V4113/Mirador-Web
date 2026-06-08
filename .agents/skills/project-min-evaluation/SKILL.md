---
name: project-min-evaluation
description: Run the minimum local quality checks before marking implementation work complete.
---

# Project Minimum Evaluation

Run these commands from the repository root before reporting completion:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test
npm run doctor
npm run check
```

If E2E behavior changed, also run `npm run test:e2e`.

If a check fails or cannot run, report the exact command, exact error, and unverified scope.
