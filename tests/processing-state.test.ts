import { describe, expect, it } from 'vitest';
import {
  createProcessingState,
  setToolMode,
  isCustomSettings,
  replaceSource,
  clearSource,
  updateSettings,
  restoreRecommended,
  beginRequest,
  completeRequest,
  failRequest,
  cancelRequest,
  downloadableResult,
  shouldAutoProcess,
} from '../src/tools/processing-state';

type Settings = { quality: number; format: string };
const preset = {
  id: 'test-recommendation',
  version: 1,
  settings: { quality: 85, format: 'webp' },
};
const equal = (a: Readonly<Settings>, b: Readonly<Settings>) =>
  a.quality === b.quality && a.format === b.format;
const initial = () => createProcessingState<Settings, string>(preset);
const running = () => beginRequest(replaceSource(initial()));
const ready = () => {
  const state = running();
  return completeRequest(state, state.active!, 'current blob');
};

describe('Quick/Advanced and output validity', () => {
  it('changes only the view across Quick → Advanced → Quick, retaining custom settings and versions', () => {
    const changed = updateSettings(
      ready(),
      { quality: 90, format: 'png' },
      equal,
    );
    const toggled = setToolMode(setToolMode(changed, 'advanced'), 'quick');
    expect(toggled).toEqual(changed);
    expect(isCustomSettings(toggled, equal)).toBe(true);
    expect(toggled.status).toBe('stale');
    expect(downloadableResult(toggled)).toBeUndefined();
    const restored = restoreRecommended(toggled, equal);
    expect(restored.settings).toEqual(preset.settings);
    expect(isCustomSettings(restored, equal)).toBe(false);
    expect(restored.settingsRevision).toBe(changed.settingsRevision + 1);
  });
  it('does not invalidate an identical parameter update or mode change', () => {
    const state = ready();
    expect(updateSettings(state, { ...state.settings }, equal)).toBe(state);
    expect(downloadableResult(setToolMode(state, 'advanced'))).toBe(
      'current blob',
    );
  });
  it('replacing a source preserves visible settings and invalidates download and the old task', () => {
    const old = running();
    const next = replaceSource(old);
    expect(next.settings).toEqual(old.settings);
    expect(next.sourceRevision).toBe(2);
    expect(completeRequest(next, old.active!, 'old blob')).toBe(next);
    expect(downloadableResult(replaceSource(ready()))).toBeUndefined();
  });
  it('rejects an earlier request even when source and settings have not changed', () => {
    const first = running();
    const second = beginRequest(first);
    const result = completeRequest(second, second.active!, 'latest');
    expect(completeRequest(result, first.active!, 'old')).toBe(result);
    expect(downloadableResult(result)).toBe('latest');
    expect(failRequest(result, first.active!, 'late error')).toBe(result);
  });
  it('rejects an old result after settings change back to the same values', () => {
    const first = running();
    const changed = updateSettings(
      first,
      { quality: 90, format: 'webp' },
      equal,
    );
    const restored = restoreRecommended(changed, equal);
    expect(restored.settings).toEqual(first.settings);
    expect(completeRequest(restored, first.active!, 'old')).toBe(restored);
  });
  it('blocks invalid settings and missing sources without silently repairing values', () => {
    expect(() => beginRequest(initial())).toThrow();
    const invalid = updateSettings(
      ready(),
      { quality: -1, format: 'webp' },
      equal,
      false,
    );
    expect(invalid.settings.quality).toBe(-1);
    expect(() => beginRequest(invalid)).toThrow();
    expect(downloadableResult(invalid)).toBeUndefined();
    expect(downloadableResult(clearSource(ready()))).toBeUndefined();
  });
  it('handles cancellation, errors and retry without allowing an obsolete download', () => {
    const task = running();
    const cancelled = cancelRequest(task);
    expect(completeRequest(cancelled, task.active!, 'late')).toBe(cancelled);
    const failed = failRequest(task, task.active!, 'encoding failed');
    expect(failed.status).toBe('error');
    expect(downloadableResult(failed)).toBeUndefined();
    const retry = beginRequest(failed);
    expect(
      downloadableResult(completeRequest(retry, retry.active!, 'retried')),
    ).toBe('retried');
  });
  it('snapshots settings independently of caller objects', () => {
    const supplied = { quality: 70, format: 'jpeg' };
    const task = beginRequest(
      updateSettings(replaceSource(initial()), supplied, equal),
    );
    supplied.quality = 1;
    expect(task.active!.settings.quality).toBe(70);
    expect(task.settings.quality).toBe(70);
  });
  it('does not invalidate an active request on view changes', () => {
    const task = running();
    const view = setToolMode(task, 'advanced');
    expect(view.active).toBe(task.active);
    expect(
      downloadableResult(completeRequest(view, task.active!, 'same request')),
    ).toBe('same request');
  });
  it('keeps each quick trigger distinct and never generates just because a view changed', () => {
    for (const tool of ['converter', 'resizer', 'cropper'] as const) {
      expect(shouldAutoProcess(tool, 'quick', 'mode-changed', true)).toBe(
        false,
      );
      expect(shouldAutoProcess(tool, 'advanced', 'source-ready', true)).toBe(
        false,
      );
      expect(shouldAutoProcess(tool, 'quick', 'source-ready', false)).toBe(
        false,
      );
    }
    expect(shouldAutoProcess('converter', 'quick', 'source-ready', true)).toBe(
      true,
    );
    expect(shouldAutoProcess('converter', 'quick', 'preset-selected', true)).toBe(true);
    expect(shouldAutoProcess('converter', 'advanced', 'preset-selected', true)).toBe(false);
    expect(shouldAutoProcess('converter', 'quick', 'preset-selected', false)).toBe(false);
    expect(shouldAutoProcess('resizer', 'quick', 'source-ready', true)).toBe(
      false,
    );
    expect(shouldAutoProcess('resizer', 'quick', 'preset-selected', true)).toBe(
      true,
    );
    expect(shouldAutoProcess('cropper', 'quick', 'source-ready', true)).toBe(
      false,
    );
    expect(shouldAutoProcess('cropper', 'quick', 'preset-selected', true)).toBe(
      false,
    );
    expect(shouldAutoProcess('cropper', 'quick', 'crop-confirmed', true)).toBe(
      true,
    );
  });
});
