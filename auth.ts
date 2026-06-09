import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { verifyCredentials } from '@/lib/auth/credentials';

// `signIn`/`signOut` are intentionally not re-exported: the client surfaces use
// the ones from `next-auth/react`. Add them here if server-side auth actions are
// introduced later.
export const { handlers, auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
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
        token.accessToken = user.accessToken;
      }

      return token;
    },
    session: ({ session, token }) => {
      session.accessToken = token.accessToken as string | undefined;

      if (session.user) {
        session.user.role = token.role as string | undefined;
      }

      return session;
    },
  },
});
