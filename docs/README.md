# mirador-web Documentation

`mirador-web` is the **frontend** of **Mirador**, an executive chatbot (governed Text-to-SQL +
RAG) that gives a CEO a panoramic view of the business by combining metrics and document
knowledge. Mirador is split into four services that follow the `mirador-*` naming scheme:

| Service                | Role                                                         | Tech                    | Deploy                        |
| ---------------------- | ------------------------------------------------------------ | ----------------------- | ----------------------------- |
| **mirador-web** (this) | Web frontend: login + executive chatbot                      | Next.js SSR + shadcn/ui | Cloudflare Workers (OpenNext) |
| mirador-core           | Backend: LLM orchestrator, semantic layer, SQL safety, RAG   | Fastify + Prisma        | Railway                       |
| mirador-mcp            | Standalone MCP adapter for external clients (Claude, Cursor) | Node MCP SDK            | Railway                       |
| mirador-ingestion      | RAG document ingestion pipeline                              | Node (async)            | Railway                       |

This repository owns only the frontend. It talks to `mirador-core` over HTTP through a Cloudflare
**Web API Gateway**. It never talks to MCP, never generates SQL, and never holds database or LLM
credentials.

## Contents

- [Architecture](architecture/README.md)
  - [Overview](architecture/overview.md) — system context, frontend boundaries, end-to-end flows,
    cross-cutting concerns.
  - [API Contracts](architecture/api-contracts.md) — the backend endpoints `mirador-web` consumes.
- [Glossary](glossary/README.md) — ubiquitous language relevant to the frontend.
- [Architecture Decision Records](adr/README.md) — frontend-owned decisions.

## Provenance

These documents are derived from the Mirador architecture project (currently a separate
documentation repository). The source material is in Spanish; this repository keeps its docs in
English to match the existing `README.md`, `DESIGN.md`, and `AGENTS.md`. Each ADR cites the
upstream ADR it derives from. When the upstream architecture changes, revisit the affected
documents here (see the `decision-doc-sync` skill).
