import { auth } from '@/auth';
import { backendAuthHeaders } from '@/lib/auth/backend-session';

/**
 * Revokes the backend (`mirador-core`) session server-side. NextAuth's
 * `signOut` only clears the frontend cookie; the backend session stays valid
 * until its TTL unless we explicitly revoke it here. Best-effort: a backend
 * failure must not block the user from signing out locally.
 */
export async function POST() {
  const session = await auth();
  const apiUrl = process.env.MIRADOR_API_URL;
  const headers = backendAuthHeaders(session);

  if (apiUrl && 'Cookie' in headers) {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        cache: 'no-store',
        headers,
      });
    } catch {
      // Best-effort: ignore backend revocation failures.
    }
  }

  return Response.json({ status: 'ok' });
}
