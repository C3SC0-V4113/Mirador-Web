/**
 * Verifies CEO credentials against the Mirador backend (`mirador-core`).
 *
 * When `MIRADOR_API_URL` is set, this POSTs to the backend's `/api/auth/login`
 * (the authoritative auth owner per ADR-0004). When it is not set — the backend
 * does not exist yet — it falls back to a single dev CEO defined via
 * `DEV_CEO_EMAIL` / `DEV_CEO_PASSWORD` so the app is runnable locally.
 *
 * Uses the web-standard `fetch` only, so it stays edge/OpenNext-compatible.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  accessToken?: string;
}

interface BackendLoginResponse {
  access_token?: string;
  user?: { id?: string; email?: string; role?: string };
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
        accessToken: data.access_token,
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
