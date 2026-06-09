import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * The shape returned by the Credentials `authorize` callback and exposed via `auth()`.
   * `mirador-core` owns authorization; the frontend only carries these claims for display.
   */
  interface User {
    role?: string;
    accessToken?: string;
  }

  interface Session {
    accessToken?: string;
    user: {
      role?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    accessToken?: string;
  }
}
