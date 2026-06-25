import type { Session } from 'next-auth';

/**
 * Cookie name the backend (`mirador-core`) issues and validates. Must match
 * `SESSION_COOKIE_NAME` there. The frontend never reads this cookie in the
 * browser — it carries the value inside the NextAuth session and replays it as
 * a `Cookie` header on server-to-server proxy calls (BFF pattern, ADR-0003).
 */
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'mirador_session';

/**
 * Shared secret header proving the request comes from the trusted frontend
 * origin (gateway). Required by `mirador-core` in production on every
 * server-to-server call — including unauthenticated ones like login. The secret
 * lives only server-side (`MIRADOR_ORIGIN_SECRET`), never in the client bundle.
 */
export function backendOriginHeaders(): Record<string, string> {
  const secret = process.env.MIRADOR_ORIGIN_SECRET;

  return secret ? { 'x-mirador-origin': secret } : {};
}

/**
 * Builds the headers a BFF route handler / server component must send to the
 * backend on behalf of the signed-in user: the origin secret (always) plus the
 * session cookie when present. No `Cookie` is added in the dev fallback (no
 * session token), so callers gating on `'Cookie' in headers` still behave.
 */
export function backendAuthHeaders(session: Session | null): Record<string, string> {
  const headers = backendOriginHeaders();
  const token = session?.sessionCookie;

  if (typeof token === 'string' && token.length > 0) {
    headers.Cookie = `${SESSION_COOKIE_NAME}=${token}`;
  }

  return headers;
}
