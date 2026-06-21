import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { verifyCredentials } from '@/lib/auth/credentials';

// `signIn`/`signOut` are intentionally not re-exported: the client surfaces use
// the ones from `next-auth/react`. Add them here if server-side auth actions are
// introduced later.
// Keep the NextAuth session no longer-lived than the backend session token it
// carries, so an expired `mirador_session` can't outlive its NextAuth wrapper
// and surface as a silent 401 on proxied requests.
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS ?? '86400');

export const { handlers, auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: SESSION_TTL_SECONDS },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const user = await verifyCredentials(
          String(credentials?.email ?? ''),
          String(credentials?.password ?? '')
        );

        return user ?? null;
      },
    }),
  ],
  callbacks: {
    // Route protection for the proxy (Next.js 16 middleware). The frontend
    // does not enforce fine-grained authorization — `mirador-core` does.
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = Boolean(auth?.user);
      const isOnChat = nextUrl.pathname.startsWith('/chat');

      if (isOnChat) {
        return isLoggedIn;
      }

      return true;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.sessionCookie = user.sessionCookie;
      }

      return token;
    },
    session: ({ session, token }) => {
      session.sessionCookie = token.sessionCookie as string | undefined;

      if (session.user) {
        session.user.role = token.role as string | undefined;
      }

      return session;
    },
  },
});
