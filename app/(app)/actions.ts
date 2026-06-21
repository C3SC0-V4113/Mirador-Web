'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { backendAuthHeaders } from '@/lib/auth/backend-session';

export interface RenameResult {
  ok: boolean;
  error?: string;
}

/**
 * Server Action: renames a conversation via `mirador-core` and revalidates the
 * layout so the server-rendered sidebar reflects the new title. No client fetch.
 */
export async function renameConversationAction(
  conversationId: string,
  title: string
): Promise<RenameResult> {
  const trimmed = title.trim();

  if (!trimmed) {
    return { ok: false, error: 'El título no puede estar vacío.' };
  }

  const apiUrl = process.env.MIRADOR_API_URL;

  if (!apiUrl) {
    return { ok: false, error: 'El backend no está configurado.' };
  }

  const session = await auth();
  const headers = backendAuthHeaders(session);

  if (!('Cookie' in headers)) {
    return { ok: false, error: 'No autorizado.' };
  }

  try {
    const response = await fetch(
      `${apiUrl}/api/chat/conversations/${encodeURIComponent(conversationId)}`,
      {
        method: 'PATCH',
        cache: 'no-store',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      }
    );

    if (!response.ok) {
      return { ok: false, error: 'No se pudo renombrar la conversación.' };
    }

    revalidatePath('/chat', 'layout');
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo contactar el servicio.' };
  }
}
