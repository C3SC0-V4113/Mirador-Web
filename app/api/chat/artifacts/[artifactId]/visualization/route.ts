import { auth } from '@/auth';
import { backendAuthHeaders } from '@/lib/auth/backend-session';

/**
 * BFF proxy for the visualization mini-edit endpoint. Forwards the body
 * verbatim — the backend accepts `{ message }` (natural language) or
 * `{ chart_spec }` (structured, no LLM) for charts, and
 * `{ message, sandbox_dashboards_enabled }` for sandbox dashboards — with the
 * session cookie (ADR-0003). Upstream errors are forwarded with their real
 * message so the client can surface the actual reason.
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
        { error: await upstreamErrorMessage(upstream) },
        { status: upstream.status }
      );
    }

    return Response.json(await upstream.json());
  } catch {
    return Response.json({ error: 'No se pudo contactar el servicio de chat.' }, { status: 502 });
  }
}

/**
 * Extracts the real error message from the mirador-core error contract
 * (`{ error: { code, message } }`), falling back to a generic message when the
 * body is not JSON or has an unexpected shape.
 */
async function upstreamErrorMessage(upstream: Response): Promise<string> {
  try {
    const data = (await upstream.json()) as { error?: { code?: unknown; message?: unknown } };
    if (typeof data.error?.message === 'string' && data.error.message) {
      return data.error.message;
    }
  } catch {
    // fall through to the generic message
  }

  return 'No se pudo actualizar la visualización.';
}
