import { lazy, Suspense } from 'react';
import { messages } from '../i18n/messages';
import type { Region } from '../config/region';
import type { LabMode } from './routes';
// Build cannot reach demo implementations, even when Astro scans island entries.
const Lab = import.meta.env.DEV ? lazy(() => import('./WorkbenchLab')) : null;
export default function LabRuntime({
  mode,
  region,
}: {
  mode: LabMode;
  region: Region;
}) {
  return Lab ? (
    <Suspense fallback={<p role="status">{messages[region].loading}</p>}>
      <Lab mode={mode} region={region} />
    </Suspense>
  ) : null;
}
