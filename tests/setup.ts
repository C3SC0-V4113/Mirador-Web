import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// React Testing Library does not auto-clean when Vitest globals are disabled,
// so unmount and reset the DOM between tests to prevent rendered output leaking
// across test cases.
afterEach(() => {
  cleanup();
});
