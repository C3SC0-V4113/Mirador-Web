import type { Session } from 'next-auth';

/**
 * Cookie name the backend (`mirador-core`) issues and validates. Must match
 * `SESSION_COOKIE_NAME` there. The frontend never reads this cookie in the
 * browser — it carries the value inside the NextAuth session and replays it as
 * a `Cookie` header on server-to-server proxy calls (BFF pattern, ADR-0003).
 */
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'mirador_session';

/**
 * Builds the headers a BFF route handler must send to authenticate against the
 * backend on behalf of the signed-in user. Returns an empty object when there
 * is no backend session token (e.g. dev fallback without `MIRADOR_API_URL`).
 */
export function backendAuthHeaders(session: Session | null): Record<string, string> {
  const token = session?.sessionCookie;

  if (typeof token !== 'string' || token.length === 0) {
    return {};
  }

  return { Cookie: `${SESSION_COOKIE_NAME}=${token}` };
}
