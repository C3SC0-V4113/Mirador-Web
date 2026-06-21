/**
 * Verifies CEO credentials against the Mirador backend (`mirador-core`).
 *
 * When `MIRADOR_API_URL` is set, this POSTs to the backend's `/api/auth/login`
 * (the authoritative auth owner per ADR-0004). The backend does not return a
 * bearer token: it issues an HttpOnly session cookie (`mirador_session`) and a
 * `{ user, expires_at }` body. Since the browser never talks to the backend
 * directly (BFF pattern), we capture that cookie's opaque value here and carry
 * it in the NextAuth session, then replay it as a `Cookie` header on every
 * proxied request (`sessionCookie`). When `MIRADOR_API_URL` is not set — the
 * backend is not available — it falls back to a single dev CEO defined via
 * `DEV_CEO_EMAIL` / `DEV_CEO_PASSWORD` so the app is runnable locally.
 *
 * Uses the web-standard `fetch` only, so it stays edge/OpenNext-compatible.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  /** Opaque backend session token captured from the login `Set-Cookie`. */
  sessionCookie?: string;
}

interface BackendLoginResponse {
  user?: { id?: string; email?: string; role?: string };
  expires_at?: string;
}

/** Cookie name the backend issues; must match `SESSION_COOKIE_NAME` in mirador-core. */
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'mirador_session';

/**
 * Extracts the backend session cookie value from a login response. Prefers the
 * undici `getSetCookie()` accessor (one entry per `Set-Cookie` header) and falls
 * back to the combined `set-cookie` header for runtimes that lack it.
 */
function extractSessionCookie(response: Response): string | undefined {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const cookies =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : splitSetCookie(headers.get('set-cookie'));

  for (const cookie of cookies) {
    const [pair] = cookie.split(';');
    const [name, ...valueParts] = pair.split('=');

    if (valueParts.length === 0) {
      continue;
    }

    if (name.trim() === SESSION_COOKIE_NAME) {
      return valueParts.join('=').trim();
    }
  }

  return undefined;
}

/**
 * Splits a combined `set-cookie` header into individual cookies. Commas inside a
 * cookie only appear in `Expires` dates (`..., DD Mon ...`), so we split on
 * commas that are followed by a `name=` token.
 */
function splitSetCookie(header: string | null): string[] {
  if (!header) {
    return [];
  }

  return header.split(/,(?=\s*[^=;,\s]+=)/);
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  if (!email || !password) {
    return null;
  }

  const apiUrl = process.env.MIRADOR_API_URL;

  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as BackendLoginResponse;

      return {
        id: data.user?.id ?? email,
        email: data.user?.email ?? email,
        role: data.user?.role ?? 'CEO',
        sessionCookie: extractSessionCookie(response),
      };
    } catch {
      return null;
    }
  }

  // Dev fallback: single seeded CEO until `mirador-core` is available.
  const devEmail = process.env.DEV_CEO_EMAIL;
  const devPassword = process.env.DEV_CEO_PASSWORD;

  if (devEmail && devPassword && email === devEmail && password === devPassword) {
    return { id: 'dev-ceo', email, role: 'CEO' };
  }

  return null;
}
