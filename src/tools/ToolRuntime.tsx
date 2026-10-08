import { Component, lazy, Suspense, useMemo, type ReactNode } from 'react';
import type { Region } from '../config/region';
import { messages } from '../i18n/messages';
import { toolLoaders } from './loaders';
class LoadBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function ToolRuntime({
  toolId,
  region,
}: {
  toolId: string;
  region: Region;
}) {
  const t = messages[region];
  const Tool = useMemo(() => {
    const loader = toolLoaders[toolId];
    return loader ? lazy(loader) : null;
  }, [toolId]);
  const fallback = <p role="alert">{t.unavailable}</p>;
  return (
    <LoadBoundary key={toolId} fallback={fallback}>
      <Suspense fallback={<p role="status">{t.loading}</p>}>
        {Tool ? <Tool region={region} /> : fallback}
      </Suspense>
    </LoadBoundary>
  );
}
