import { auth } from '@/auth';
import { backendAuthHeaders } from '@/lib/auth/backend-session';

/**
 * BFF proxy that lists the signed-in user's past conversations. Forwards the
 * backend session cookie (ADR-0003). Returns an empty list when the backend is
 * not configured so the history surface degrades gracefully in dev.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const apiUrl = process.env.MIRADOR_API_URL;

  if (!apiUrl) {
    return Response.json({ conversations: [] });
  }

  try {
    const upstream = await fetch(`${apiUrl}/api/chat/conversations`, {
      cache: 'no-store',
      headers: backendAuthHeaders(session),
    });

    if (!upstream.ok) {
      return Response.json(
        { error: 'No se pudieron cargar las conversaciones.' },
        { status: upstream.status }
      );
    }

    const data = (await upstream.json()) as unknown;
    return Response.json(data);
  } catch {
    return Response.json({ error: 'No se pudo contactar el servicio de chat.' }, { status: 502 });
  }
}
