# Glossary (frontend-relevant)

The ubiquitous language of the Mirador system, scoped to what matters for `mirador-web` and
translated to English. Each entry is tagged:

- **[UI]** — a surface or affordance the frontend renders or owns.
- **[Backend]** — a concept owned by `mirador-core`; the frontend only sends to or displays results
  from it, and must not reimplement it.

For the full domain language, see the upstream Mirador architecture glossary.

## Terms

### Mirador

The product: an executive chatbot that gives a CEO a panoramic view of the business by combining
metrics (governed Text-to-SQL) and document knowledge (RAG). Its services follow the `mirador-*`
scheme. **[Backend + UI]**

### Executive Chatbot — _Chatbot Ejecutivo_

The main, and only, authenticated surface after login. The CEO asks in natural language and
receives executive answers with evidence, tables, charts, or KPIs generated on demand. **[UI]**

### Chat Artifact — _Artefacto de Chat_

A structured result generated inside a conversation: table, chart, KPI, summary, report, action
plan, or knowledge narrative. Carries context, data, `warnings`, `freshness`, and `trace_id`. See
the artifact model in [API Contracts](../architecture/api-contracts.md). **[UI]**

### Composer

The natural-language input. It stays deliberately simple — its options are not filters or forms but
modes that complement the prompt. **[UI]**

### Intent Mode — _Modo de Composer_

A composer option that sets the base priority of the answer without restricting what the prompt can
ask. MVP modes: `responder` (default executive answer), `analizar` (causes/evidence/comparisons),
`reporte_visual` (visual report priority), `plan` (actions/risks/next steps). The mode and the
prompt's explicit requirements are combined, never one discarded for the other. **[UI]**

### Chart Spec

A structured object describing how to render a chart: type, axes, series, format, labels, legend,
colors, and annotations. Can be edited without a new query when only the visualization changes.
**[UI]** (rendered) / **[Backend]** (produced & edited).

### Mini Chart Chat — _Mini Chat de Grafica_

A contextual panel bound to a `chart` artifact's `artifact_id` for requesting visual changes. If the
user asks to change data, period, metric, or source, the request returns to the main chat and
re-enters the backend's SQL safety path. **[UI]**

### Citation — _Cita_

A reference to the document source backing a claim in an answer: document + locator (page/section) +
snippet. Provided by the knowledge layer; if there is insufficient evidence, the answer says so
rather than inventing. Rendered alongside `knowledge` artifacts. **[UI]** (rendered) /
**[Backend]** (produced).

### Freshness

A per-artifact signal of data recency/status (e.g. `{ generated_at, status }`). The frontend must
surface it so executive answers are not mistaken for guaranteed real-time truth. **[UI]**

### Warnings

Per-response data-quality notices the frontend must display rather than hide. **[UI]**

### Trace ID — _trace_id_

A unique identifier returned per response, correlating a UI answer with backend audit logs. Surface
it visibly or retrievably. **[UI]** (surfaced) / **[Backend]** (generated).

### Suggested Questions — _Preguntas Sugeridas_

Questions the system proposes (before/after a response) to reduce prompt engineering and guide the
CEO. Delivered in the chat response. **[UI]**

### Quick Actions — _Acciones Rapidas_

In-chat actions tied to the current context (Compare, Explain, Forecast, See detail, Change period,
Change metric, and — if approved later — Download). **[UI]**

### Conversation

A thread of messages and artifacts. Conversation state (selected period, active metric, filtered
client/project/area, last artifact, role, warnings) is owned by the backend; the frontend is
effectively stateless and renders what the backend returns. **[Backend]**

### Web API Gateway

The Cloudflare edge in front of `mirador-core` for the frontend's traffic: TLS, rate limiting,
throttling, quotas, WAF/IP rules, request-size limits, routing, plus coarse auth (JWT presence) and
observability. Fine-grained authorization stays in the backend. **[Backend]**

### Execution Plan

A typed list of sub-tasks (`metric_query`, `knowledge_lookup`, `direct_answer`) the backend planner
produces to handle a possibly multi-intent prompt in a single response. Returned in
`metadata.execution_plan`; the frontend uses it only to understand/explain a response, not to drive
behavior. **[Backend]**

### Semantic Layer (Metric Layer)

The backend's governed definition of metrics that compiles a `MetricQuery` into deterministic SQL
over `ceo_*` views. The frontend never sees raw SQL generation; it sends natural language and
renders results. **[Backend]**

### Knowledge Layer (RAG)

The backend's sibling to the semantic layer for non-metric document questions (vision, mission,
policies, processes). Retrieves document chunks and returns them with citations. Surfaces in the UI
as `knowledge` artifacts with citations. **[Backend]**

### MCP — Model Context Protocol

A protocol for exposing tools/context to external model clients (Claude, Cursor/Codex), served by
the standalone `mirador-mcp` service. **The browser never uses MCP**; it is listed here only to mark
the boundary. **[Backend]**
