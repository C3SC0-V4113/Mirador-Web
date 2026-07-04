import { auth } from '@/auth';
import { backendAuthHeaders } from '@/lib/auth/backend-session';
import { toFrontendChatResponse } from '@/lib/chat/backend-mapper';

import type { BackendArtifact, BackendChatResponse } from '@/lib/chat/types';

/**
 * BFF route handler for chat. The browser never calls `mirador-core` directly
 * (ADR-0003): it posts here, this handler attaches the session, and either
 * proxies to the Web API Gateway (`MIRADOR_API_URL`) or — when the backend is
 * not yet available — returns a dev stub. Mirrors the login fallback in
 * `lib/auth/credentials.ts`.
 */

interface IncomingBody {
  content?: unknown;
  intentMode?: unknown;
  conversationId?: unknown;
  dynamicChartsEnabled?: unknown;
  sandboxDashboardsEnabled?: unknown;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 });
  }

  let body: IncomingBody;
  try {
    body = (await request.json()) as IncomingBody;
  } catch {
    return Response.json({ error: 'Cuerpo de solicitud inválido.' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) {
    return Response.json({ error: 'El mensaje no puede estar vacío.' }, { status: 400 });
  }

  const intentMode = typeof body.intentMode === 'string' ? body.intentMode : 'responder';
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId : undefined;
  const dynamicChartsEnabled = body.dynamicChartsEnabled === true;
  const sandboxDashboardsEnabled = body.sandboxDashboardsEnabled === true;

  const apiUrl = process.env.MIRADOR_API_URL;

  if (apiUrl) {
    try {
      const upstream = await fetch(`${apiUrl}/api/chat/messages`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...backendAuthHeaders(session),
        },
        // The backend contract is `message` (not `content`); `conversation_id`
        // is omitted when absent so the backend opens a fresh conversation.
        body: JSON.stringify({
          message: content,
          intent_mode: intentMode,
          dynamic_charts_enabled: dynamicChartsEnabled,
          sandbox_dashboards_enabled: sandboxDashboardsEnabled,
          ...(conversationId ? { conversation_id: conversationId } : {}),
        }),
      });

      if (!upstream.ok) {
        return Response.json(
          { error: await extractBackendError(upstream) },
          {
            status: upstream.status,
          }
        );
      }

      const raw = (await upstream.json()) as unknown;
      return Response.json(toFrontendChatResponse(raw));
    } catch {
      return Response.json({ error: 'No se pudo contactar el servicio de chat.' }, { status: 502 });
    }
  }

  // Dev stub: echoes the question until `mirador-core` is available.
  const stub: BackendChatResponse = {
    answer: buildStubAnswer(content, intentMode),
    citations: [
      {
        document_id: 'doc-demo',
        title: 'Manifiesto de la empresa 2026',
        locator: 'pág. 2',
        snippet: 'Nuestra misión es darle al CEO respuestas claras y accionables.',
      },
    ],
    suggested_questions: [
      '¿Cómo evolucionó el MRR en los últimos 6 meses?',
      '¿Qué riesgos detectas en la operación actual?',
      'Dame un plan de acción para mejorar la retención.',
    ],
    artifacts: buildStubArtifacts(intentMode, sandboxDashboardsEnabled),
    warnings: ['Respuesta de demostración: el backend aún no está conectado.'],
    trace_id: crypto.randomUUID(),
  };

  return Response.json(stub);
}

/**
 * Flattens the backend error envelope (`{ error: { code, message } }`) into the
 * `{ error: string }` shape the chat client expects, so the real backend message
 * reaches the UI instead of a generic fallback.
 */
async function extractBackendError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: unknown } | string };

    if (typeof data.error === 'string' && data.error) {
      return data.error;
    }

    if (data.error && typeof data.error === 'object' && typeof data.error.message === 'string') {
      return data.error.message;
    }
  } catch {
    // fall through to the generic message
  }

  return 'El servicio de chat no está disponible.';
}

function buildStubArtifacts(
  intentMode: string,
  sandboxDashboardsEnabled: boolean
): BackendArtifact[] {
  const freshness = { generated_at: new Date().toISOString(), status: 'fresh' };
  const monthly = [
    { month: 'Ene', mrr: 42000, clientes: 120 },
    { month: 'Feb', mrr: 45000, clientes: 128 },
    { month: 'Mar', mrr: 47000, clientes: 134 },
    { month: 'Abr', mrr: 51000, clientes: 141 },
    { month: 'May', mrr: 54000, clientes: 149 },
    { month: 'Jun', mrr: 58000, clientes: 158 },
  ];

  const artifacts: BackendArtifact[] = [
    {
      artifact_id: crypto.randomUUID(),
      artifact_type: 'kpi',
      question: 'MRR actual',
      period: 'junio 2026',
      freshness,
      summary: 'Crecimiento sostenido (+8% intermensual).',
      data: [{ mrr: 58000 }],
      trace_id: crypto.randomUUID(),
    },
    {
      artifact_id: crypto.randomUUID(),
      artifact_type: 'chart',
      question: 'Evolución del MRR',
      period: 'últimos 6 meses',
      freshness,
      chart_spec: { type: 'line', x: 'month', y: ['mrr'] },
      data: monthly,
      trace_id: crypto.randomUUID(),
    },
    {
      artifact_id: crypto.randomUUID(),
      artifact_type: 'table',
      question: 'Detalle mensual',
      period: 'últimos 6 meses',
      freshness,
      data: monthly,
      warnings: ['Datos de demostración.'],
      trace_id: crypto.randomUUID(),
    },
  ];

  if (intentMode === 'plan') {
    artifacts.push({
      artifact_id: crypto.randomUUID(),
      artifact_type: 'action_plan',
      question: 'Plan para mejorar la retención',
      freshness,
      summary: 'Tres frentes para reducir la fuga de clientes.',
      actions: [
        {
          title: 'Activar onboarding guiado',
          detail: 'Reduce la fricción inicial en las primeras dos semanas.',
          kind: 'action',
        },
        {
          title: 'Concentración de ingresos en pocas cuentas',
          detail: 'El 40% del MRR depende de 3 clientes.',
          kind: 'risk',
        },
        {
          title: 'Definir métricas de salud de cuenta',
          detail: 'Medir uso semanal y alertas de churn.',
          kind: 'next_step',
        },
      ],
      trace_id: crypto.randomUUID(),
    });
  }

  if (sandboxDashboardsEnabled) {
    artifacts.push({
      artifact_id: crypto.randomUUID(),
      artifact_type: 'sandbox_dashboard',
      question: 'Panel interactivo de demostración',
      period: 'junio 2026',
      freshness,
      summary: 'Panel HTML aislado generado como demostración del flujo (sin backend real).',
      sandbox_html: buildStubSandboxHtml(),
      sandbox_metadata: { external_resources: [], blocked_items: [] },
      warnings: ['Datos de demostración.'],
      trace_id: crypto.randomUUID(),
    });
  }

  if (intentMode === 'analizar') {
    artifacts.push({
      artifact_id: crypto.randomUUID(),
      artifact_type: 'knowledge',
      question: 'Contexto del manifiesto',
      freshness,
      summary: 'La estrategia prioriza retención sobre adquisición este año.',
      citations: [
        {
          document_id: 'doc-demo',
          title: 'Manifiesto de la empresa 2026',
          locator: 'pág. 5',
          snippet: 'Crecer de forma rentable cuidando a los clientes actuales.',
        },
      ],
      trace_id: crypto.randomUUID(),
    });
  }

  return artifacts;
}

/**
 * Small, self-contained demo dashboard for the dev stub: two KPI blocks and a
 * canvas bar chart drawn from an inline `const DATA` — no external resources,
 * no forms, no `postMessage`. Mirrors what the real backend would send after
 * server-side sanitization (parse5 allowlist + CSP sha256 meta), so this is
 * only a fixture for the frontend flow, not a sanitization exercise.
 */
function buildStubSandboxHtml(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; color: #1f2937; }
  .kpis { display: flex; gap: 12px; margin-bottom: 16px; }
  .kpi { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
  .kpi h3 { margin: 0 0 4px; font-size: 12px; color: #6b7280; font-weight: 500; }
  .kpi p { margin: 0; font-size: 20px; font-weight: 600; }
  canvas { width: 100%; height: 220px; }
</style>
</head>
<body>
  <div class="kpis">
    <div class="kpi"><h3>MRR</h3><p>USD 58.000</p></div>
    <div class="kpi"><h3>Clientes activos</h3><p>158</p></div>
  </div>
  <canvas id="chart" width="600" height="220"></canvas>
  <script>
    const DATA = [42000, 45000, 47000, 51000, 54000, 58000];
    const canvas = document.getElementById('chart');
    const ctx = canvas.getContext('2d');
    const max = Math.max(...DATA);
    const barWidth = canvas.width / DATA.length;
    ctx.fillStyle = '#2563eb';
    DATA.forEach((value, index) => {
      const height = (value / max) * (canvas.height - 20);
      ctx.fillRect(index * barWidth + 8, canvas.height - height, barWidth - 16, height);
    });
  </script>
</body>
</html>`;
}

function buildStubAnswer(content: string, intentMode: string): string {
  const intro: Record<string, string> = {
    responder: 'Respuesta directa',
    analizar: 'Análisis',
    plan: 'Plan de acción',
  };
  const heading = intro[intentMode] ?? intro.responder;

  return [
    `**${heading} (demo)**`,
    '',
    `Recibí tu pregunta: _"${content}"_.`,
    '',
    'Cuando `mirador-core` esté conectado, aquí verás el resumen ejecutivo real con sus métricas, tablas y gráficos.',
  ].join('\n');
}
