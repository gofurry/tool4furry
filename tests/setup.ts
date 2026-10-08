import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// jsdom has no responsive layout engine. The shell subscribes to this media source.
export function setViewport(compact = false) {
  let matches = compact;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return query.includes('900px') && matches;
    },
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
    addListener: () => {},
    removeListener: () => {},
  }));
  return (next: boolean) => {
    matches = next;
    listeners.forEach((listener) => listener());
  };
}
