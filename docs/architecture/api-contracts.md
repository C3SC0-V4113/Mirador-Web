# API Contracts (frontend ↔ mirador-core)

The endpoints `mirador-web` consumes from `mirador-core`, through the Web API Gateway. These shapes
mirror the upstream architecture proposal; treat `mirador-core`'s OpenAPI/handlers as the
authoritative source once it exists. This document is the frontend's working reference.

> The frontend consumes only `/api/auth/*`, `/api/chat/*`, and `/api/schema/*`. The internal API
> (`/internal/core/*`) and the MCP endpoint (`/mcp`) are **not** reachable from the browser and must
> never be called by the frontend.

## Authentication

| Method | Path                | Purpose                                  |
| ------ | ------------------- | ---------------------------------------- |
| POST   | `/api/auth/login`   | Exchange credentials for a session/JWT.  |
| POST   | `/api/auth/logout`  | Invalidate the current session.          |
| GET    | `/api/auth/session` | Return the current session/role, if any. |

`POST /api/auth/login` (request):

```json
{
  "email": "ceo@example.com",
  "password": "••••••••"
}
```

Response (shape; the access token may be delivered as an httpOnly cookie rather than in the body —
see [ADR-0004](../adr/0004-handle-jwt-session-in-the-frontend.md)):

```json
{
  "access_token": "jwt...",
  "user": { "id": "user_uuid", "role": "CEO" }
}
```

The JWT carries at least `sub` (user id), `role` (`CEO`), and `exp`. The backend validates it on
every protected request; the frontend does not enforce authorization.

## Chat

| Method | Path                                           | Purpose                                          |
| ------ | ---------------------------------------------- | ------------------------------------------------ |
| POST   | `/api/chat/messages`                           | Send a message; receive a synthesized response.  |
| GET    | `/api/chat/conversations`                      | List conversations.                              |
| GET    | `/api/chat/conversations/:conversation_id`     | Retrieve a conversation's history and artifacts. |
| POST   | `/api/chat/artifacts/:artifact_id/chart-edits` | Edit an existing chart's visualization.          |

### `POST /api/chat/messages`

Request:

```json
{
  "conversation_id": "conversation_uuid",
  "content": "Analiza la caida de MRR e incluye una grafica",
  "intent_mode": "analizar",
  "context_artifact_id": "artifact_uuid",
  "dynamic_charts_enabled": false
}
```

- `intent_mode` is one of `responder` (default), `analizar`, `reporte_visual`, `plan`. It sets the
  base priority of the answer; it is **not** a filter — explicit requirements written in `content`
  are honored as well.
- `context_artifact_id` is optional; it links the message to a prior artifact for follow-ups.
- `dynamic_charts_enabled` defaults to `false`, comes from a browser-local
  preference, and is forwarded only to the public chat endpoint.

Response:

```json
{
  "answer": "Resumen ejecutivo en lenguaje natural.",
  "sql": "SELECT ...",
  "data": [],
  "artifacts": [],
  "citations": [
    {
      "document_id": "doc_uuid",
      "title": "Manifiesto de la empresa 2026",
      "locator": "pag. 2",
      "snippet": "Nuestra mision es..."
    }
  ],
  "chart": { "type": "line", "x": "month", "y": "mrr" },
  "warnings": [],
  "suggested_questions": [],
  "metadata": {
    "client_type": "web",
    "rows": 12,
    "execution_plan": ["metric_query", "knowledge_lookup"]
  },
  "trace_id": "uuid"
}
```

Frontend rendering notes:

- `answer` is the executive narrative to render as the primary message body.
- `artifacts` is the list of structured outputs to render inline (see the artifact model below).
- `citations` is populated only when the `execution_plan` included `knowledge_lookup`; render each
  as a reference (title + locator + snippet). It is empty for metric-only answers.
- `warnings`, `freshness` (per artifact), and `trace_id` must be surfaced — never hide them.
- `suggested_questions` feeds the guided-analytics affordance shown before/after a response.
- `sql` / `data` are returned for transparency; rendering raw SQL to the CEO is optional.

### Chat artifact model

Each entry in `artifacts` extends the response with:

```json
{
  "artifact_id": "artifact_uuid",
  "conversation_id": "conversation_uuid",
  "artifact_type": "chart",
  "question": "Mostrar MRR y crecimiento de los ultimos 6 meses",
  "period": "last_6_months",
  "source_views": ["ceo_revenue_summary"],
  "freshness": { "generated_at": "2026-06-01T08:00:00Z", "status": "fresh" },
  "summary": "MRR crecio 8% en los ultimos 6 meses.",
  "data": [],
  "chart_spec": { "type": "line", "x": "month", "y": "mrr" },
  "warnings": [],
  "trace_id": "uuid"
}
```

Allowed `artifact_type` values (MVP):

| Value           | Frontend renders as                                                      |
| --------------- | ------------------------------------------------------------------------ |
| `text`          | Narrative block.                                                         |
| `table`         | Data table (for detailed records).                                       |
| `kpi`           | KPI card / metric callout.                                               |
| `chart`         | Chart rendered from `chart_spec`; supports the inline mini-chart editor. |
| `dynamic_chart` | Governed Vega-Lite v6 chart; historical artifacts always render.         |
| `report`        | Composite on-demand report (narrative + chart/table).                    |
| `action_plan`   | Structured list of actions/risks/next steps.                             |
| `knowledge`     | Document-grounded narrative accompanied by `citations`.                  |

`payload.labels` maps raw field keys to readable business labels. Tables and
both chart renderers use those labels without renaming the underlying row keys.

### `POST /api/chat/artifacts/:artifact_id/chart-edits`

Request:

```json
{
  "instruction": "Cambiar a barras y resaltar marzo",
  "current_chart_spec": { "type": "line", "x": "month", "y": "mrr" }
}
```

Response:

```json
{
  "updated_chart_spec": {
    "type": "bar",
    "x": "month",
    "y": "mrr",
    "annotations": [{ "x": "2026-03", "label": "Caida relevante" }]
  },
  "change_summary": "Se cambio la grafica a barras y se anoto marzo.",
  "warnings": [],
  "requires_new_query": false
}
```

- Visual-only edits return an `updated_chart_spec` and `requires_new_query: false`.
- If the instruction would change data, period, metric, or source, the backend returns
  `requires_new_query: true`; the frontend must route the request back into the main chat as a new
  `POST /api/chat/messages` rather than mutating the artifact locally.

## Schema, history, and health

| Method | Path                  | Purpose                                                              |
| ------ | --------------------- | -------------------------------------------------------------------- |
| GET    | `/api/schema/catalog` | Allowed metric catalog / business schema for the role (not raw DDL). |
| GET    | `/api/query/history`  | Past queries (audit-friendly view).                                  |
| GET    | `/api/health`         | Service health probe.                                                |

## Not consumed by the frontend

- `POST /internal/core/ask`, `GET /internal/core/schema-catalog` — internal service-to-service API,
  not routed through the Web API Gateway.
- `POST /mcp` — served by the standalone `mirador-mcp` service for external clients only.

See [ADR-0003](../adr/0003-consume-backend-via-web-api-gateway-http-client.md) for the rationale.
