import { auth } from '@/auth';

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
  contextArtifactId?: unknown;
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
  const contextArtifactId =
    typeof body.contextArtifactId === 'string' ? body.contextArtifactId : undefined;

  const apiUrl = process.env.MIRADOR_API_URL;

  if (apiUrl) {
    try {
      const upstream = await fetch(`${apiUrl}/api/chat/messages`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({
          content,
          intent_mode: intentMode,
          conversation_id: conversationId,
          context_artifact_id: contextArtifactId,
        }),
      });

      if (!upstream.ok) {
        return Response.json({ error: 'El servicio de chat no está disponible.' }, { status: 502 });
      }

      const data = (await upstream.json()) as BackendChatResponse;
      return Response.json(data);
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
    artifacts: buildStubArtifacts(intentMode),
    warnings: ['Respuesta de demostración: el backend aún no está conectado.'],
    trace_id: crypto.randomUUID(),
  };

  return Response.json(stub);
}

function buildStubArtifacts(intentMode: string): BackendArtifact[] {
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
