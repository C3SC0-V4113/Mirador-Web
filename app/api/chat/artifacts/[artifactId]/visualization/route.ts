import { auth } from '@/auth';
import { backendAuthHeaders } from '@/lib/auth/backend-session';

/**
 * BFF proxy for the chart mini-edit endpoint. Forwards the body verbatim — the
 * backend accepts either `{ message }` (natural language) or `{ chart_spec }`
 * (structured, no LLM) — with the session cookie (ADR-0003).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const { artifactId } = await params;
  const apiUrl = process.env.MIRADOR_API_URL;

  if (!apiUrl) {
    return Response.json({ error: 'El backend no está configurado.' }, { status: 502 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Cuerpo de solicitud inválido.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${apiUrl}/api/chat/artifacts/${encodeURIComponent(artifactId)}/visualization`,
      {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', ...backendAuthHeaders(session) },
        body: JSON.stringify(body),
      }
    );

    if (!upstream.ok) {
      return Response.json(
        { error: 'No se pudo actualizar la visualización.' },
        { status: upstream.status }
      );
    }

    return Response.json(await upstream.json());
  } catch {
    return Response.json({ error: 'No se pudo contactar el servicio de chat.' }, { status: 502 });
  }
}
