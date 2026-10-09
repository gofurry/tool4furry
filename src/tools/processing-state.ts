// Session-local pure state contract. No files, effects, encoding, storage or scheduling.
export type ToolMode = 'quick' | 'advanced';
export type ResultStatus = 'idle' | 'processing' | 'ready' | 'stale' | 'error';
export type Preset<S> = Readonly<{
  id: string;
  version: number;
  settings: Readonly<S>;
}>;
export type ProcessingSnapshot<S> = Readonly<{
  sourceRevision: number;
  settingsRevision: number;
  requestId: number;
  settings: Readonly<S>;
}>;
export type ProcessingState<S, R> = Readonly<{
  mode: ToolMode;
  preset: Preset<S>;
  settings: Readonly<S>;
  validSettings: boolean;
  hasSource: boolean;
  sourceRevision: number;
  settingsRevision: number;
  requestId: number;
  status: ResultStatus;
  active?: ProcessingSnapshot<S>;
  result?: Readonly<{ snapshot: ProcessingSnapshot<S>; value: R }>;
  error?: string;
}>;
export type SettingsEqual<S> = (a: Readonly<S>, b: Readonly<S>) => boolean;

export function createProcessingState<S, R>(
  preset: Preset<S>,
): ProcessingState<S, R> {
  return {
    mode: 'quick',
    preset: structuredClone(preset),
    settings: structuredClone(preset.settings),
    validSettings: true,
    hasSource: false,
    sourceRevision: 0,
    settingsRevision: 0,
    requestId: 0,
    status: 'idle',
  };
}
export function setToolMode<S, R>(
  state: ProcessingState<S, R>,
  mode: ToolMode,
): ProcessingState<S, R> {
  return state.mode === mode ? state : { ...state, mode };
}
export function isCustomSettings<S, R>(
  state: ProcessingState<S, R>,
  equal: SettingsEqual<S>,
) {
  return !equal(state.settings, state.preset.settings);
}
function invalidate<S, R>(state: ProcessingState<S, R>): ProcessingState<S, R> {
  return {
    ...state,
    status: state.result ? 'stale' : 'idle',
    active: undefined,
    error: undefined,
  };
}
export function replaceSource<S, R>(
  state: ProcessingState<S, R>,
): ProcessingState<S, R> {
  return invalidate({
    ...state,
    hasSource: true,
    sourceRevision: state.sourceRevision + 1,
  });
}
export function clearSource<S, R>(
  state: ProcessingState<S, R>,
): ProcessingState<S, R> {
  return {
    ...invalidate(state),
    hasSource: false,
    sourceRevision: state.sourceRevision + (state.hasSource ? 1 : 0),
    result: undefined,
    status: 'idle',
  };
}
export function updateSettings<S, R>(
  state: ProcessingState<S, R>,
  settings: Readonly<S>,
  equal: SettingsEqual<S>,
  valid = true,
): ProcessingState<S, R> {
  const changed = !equal(state.settings, settings);
  if (!changed && valid === state.validSettings) return state;
  return invalidate({
    ...state,
    settings: structuredClone(settings),
    validSettings: valid,
    settingsRevision: state.settingsRevision + (changed ? 1 : 0),
  });
}
export function restoreRecommended<S, R>(
  state: ProcessingState<S, R>,
  equal: SettingsEqual<S>,
) {
  return updateSettings(state, state.preset.settings, equal);
}
export function beginRequest<S, R>(
  state: ProcessingState<S, R>,
): ProcessingState<S, R> {
  if (!state.hasSource || !state.validSettings)
    throw new Error('A validated source and settings are required');
  const requestId = state.requestId + 1;
  return {
    ...state,
    requestId,
    status: 'processing',
    error: undefined,
    active: {
      sourceRevision: state.sourceRevision,
      settingsRevision: state.settingsRevision,
      requestId,
      settings: structuredClone(state.settings),
    },
  };
}
function matches<S, R>(
  state: ProcessingState<S, R>,
  snapshot: ProcessingSnapshot<S>,
) {
  return (
    snapshot.sourceRevision === state.sourceRevision &&
    snapshot.settingsRevision === state.settingsRevision &&
    snapshot.requestId === state.requestId
  );
}
export function completeRequest<S, R>(
  state: ProcessingState<S, R>,
  snapshot: ProcessingSnapshot<S>,
  value: R,
): ProcessingState<S, R> {
  if (
    state.status !== 'processing' ||
    !state.active ||
    !matches(state, snapshot)
  )
    return state;
  return {
    ...state,
    active: undefined,
    status: 'ready',
    result: { snapshot, value },
    error: undefined,
  };
}
export function failRequest<S, R>(
  state: ProcessingState<S, R>,
  snapshot: ProcessingSnapshot<S>,
  error: string,
): ProcessingState<S, R> {
  if (
    state.status !== 'processing' ||
    !state.active ||
    !matches(state, snapshot)
  )
    return state;
  return { ...state, active: undefined, status: 'error', error };
}
export function cancelRequest<S, R>(
  state: ProcessingState<S, R>,
): ProcessingState<S, R> {
  return state.status === 'processing' ? invalidate(state) : state;
}
export function downloadableResult<S, R>(
  state: ProcessingState<S, R>,
): R | undefined {
  return state.status === 'ready' &&
    state.hasSource &&
    state.validSettings &&
    state.result &&
    matches(state, state.result.snapshot)
    ? state.result.value
    : undefined;
}

// Eligibility only. Actual validation/decoding and scheduling belong to each tool.
export function shouldAutoProcess(
  tool: 'converter' | 'resizer' | 'cropper',
  mode: ToolMode,
  event: 'source-ready' | 'preset-selected' | 'crop-confirmed' | 'mode-changed',
  validated: boolean,
) {
  return (
    mode === 'quick' &&
    validated &&
    event ===
      (
        {
          converter: 'source-ready',
          resizer: 'preset-selected',
          cropper: 'crop-confirmed',
        } as const
      )[tool]
  );
}
