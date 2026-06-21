import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// `next/navigation` hooks need the App Router context, which isn't mounted in
// unit tests. Stub them so components using `useRouter`/`usePathname` (e.g. the
// chat controller and sidebar) render in isolation.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/chat',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

// React Testing Library does not auto-clean when Vitest globals are disabled,
// so unmount and reset the DOM between tests to prevent rendered output leaking
// across test cases.
afterEach(() => {
  cleanup();
});
