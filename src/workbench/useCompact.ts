import { useSyncExternalStore } from 'react';
// Keep this breakpoint aligned with the shell's StyleX media queries.
const query = '(max-width: 900px)';
function subscribe(notify: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}
export function useCompact() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
