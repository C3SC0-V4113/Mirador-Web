# Architecture

Architecture documentation for `mirador-web`, the Next.js frontend of the Mirador system.

- [Overview](overview.md) — where the frontend sits in the larger system, its responsibilities and
  boundaries, the routes it serves, the end-to-end flows it participates in, and how cross-cutting
  concerns (security, observability, performance, accessibility, i18n) look from the frontend's
  angle.
- [API Contracts](api-contracts.md) — the `mirador-core` HTTP endpoints the frontend consumes, with
  request/response shapes, the chat artifact model, and the boundaries the frontend must respect.

For the decisions behind this architecture, see the [ADRs](../adr/README.md). For terminology, see
the [Glossary](../glossary/README.md).
