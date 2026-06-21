import { auth } from '@/auth';
import { backendAuthHeaders } from '@/lib/auth/backend-session';
import { toFrontendConversationDetail } from '@/lib/chat/backend-mapper';

/**
 * BFF proxy that returns a past conversation's messages and artifacts so the UI
 * can rehydrate the thread. Maps the backend `ChatArtifactView` artifacts into
 * the snake_case contract the chat client normalizes (same path as live chat).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const apiUrl = process.env.MIRADOR_API_URL;

  if (!apiUrl) {
    return Response.json({ conversation_id: id, messages: [] });
  }

  try {
    const upstream = await fetch(`${apiUrl}/api/chat/conversations/${encodeURIComponent(id)}`, {
      cache: 'no-store',
      headers: backendAuthHeaders(session),
    });

    if (!upstream.ok) {
      return Response.json(
        { error: 'No se pudo cargar la conversación.' },
        { status: upstream.status }
      );
    }

    const raw = (await upstream.json()) as unknown;
    return Response.json(toFrontendConversationDetail(raw));
  } catch {
    return Response.json({ error: 'No se pudo contactar el servicio de chat.' }, { status: 502 });
  }
}
