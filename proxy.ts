import { auth } from '@/auth';

// Next.js 16 renamed Middleware to Proxy. Auth.js route protection (the
// `authorized` callback in auth.ts) is applied automatically by the `auth`
// wrapper; no extra per-request logic is needed here.
export default auth(() => {
  return undefined;
});

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};
