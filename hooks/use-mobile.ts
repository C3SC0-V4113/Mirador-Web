import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

// Server snapshot: assume desktop so SSR markup matches the non-mobile layout.
function getServerSnapshot() {
  return false;
}

/**
 * Subscribes to the mobile media query via `useSyncExternalStore` — the
 * recommended pattern for reading external (non-React) state without effects.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
