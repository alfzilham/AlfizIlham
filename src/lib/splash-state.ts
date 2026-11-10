import { useSyncExternalStore } from 'react';

/** Tiny store so the hero knows when the splash screen has finished and disappeared. */
let done = false;
const listeners = new Set<() => void>();

export function markSplashDone() {
  if (done) return;
  done = true;
  listeners.forEach((l) => l());
}

// Safety net: never leave the hero hidden if the splash fails to report.
if (typeof window !== 'undefined') setTimeout(markSplashDone, 20000);

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function useSplashDone() {
  return useSyncExternalStore(subscribe, () => done, () => false);
}
