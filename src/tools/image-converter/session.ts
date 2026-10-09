import {
  createProcessingState,
  setToolMode,
  setRecommendedPreset,
  restoreRecommended,
  updateSettings,
  replaceSource,
  clearSource,
  beginRequest,
  completeRequest,
  failRequest,
  cancelRequest,
  downloadableResult,
  type ProcessingState,
  type ProcessingSnapshot,
  type ToolMode,
} from '../processing-state';
import {
  acceptImage,
  encodeImage,
  detectCapabilities,
  type Capabilities,
} from '../image/browser-codec';
import { ImageResources } from '../image/resources';
import {
  failureCode,
  ImageFailure,
  mime,
  type ImageFormat,
  type ImageSource,
  type ImageResult,
  type ImageErrorCode,
} from '../image/types';
import {
  recommendations,
  sameSettings,
  validSettings,
  type EncodeSettings,
} from './presets';
import { downloadName } from './filename';
import { SerialJobs } from './serial-jobs';

export type ConverterServices = {
  accept: typeof acceptImage;
  encode: typeof encodeImage;
  capabilities: typeof detectCapabilities;
};
export type ConverterView = Readonly<{
  processing: ProcessingState<EncodeSettings, ImageResult>;
  source?: ImageSource;
  candidate?: string;
  inputError?: ImageErrorCode;
  errorDetail?: string;
  capabilities?: Capabilities;
  checkingCapabilities: boolean;
  capabilityError?: ImageErrorCode;
  filename: string;
}>;
const defaults: ConverterServices = {
  accept: acceptImage,
  encode: encodeImage,
  capabilities: detectCapabilities,
};
export class ConverterSession {
  readonly resources = new ImageResources();
  readonly jobs = new SerialJobs();
  private live = true;
  private selection = 0;
  private capabilityRevision = 0;
  private autoSource?: number;
  private preferences = {
    webp: recommendations.webp.settings,
    jpeg: recommendations.jpeg.settings,
    png: recommendations.png.settings,
  };
  private view: ConverterView = {
    processing: createProcessingState(recommendations.webp),
    checkingCapabilities: true,
    filename: '',
  };
  constructor(
    private emit: (view: ConverterView) => void,
    private services: ConverterServices = defaults,
  ) {}
  get snapshot() {
    return this.view;
  }
  private patch(patch: Partial<ConverterView>) {
    if (this.live) {
      this.view = { ...this.view, ...patch };
      this.emit(this.view);
    }
  }
  private state(processing: ConverterView['processing']) {
    this.patch({ processing });
  }
  start() {
    this.retryCapabilities();
  }
  retryCapabilities() {
    const token = ++this.capabilityRevision;
    this.patch({ checkingCapabilities: true, capabilityError: undefined });
    if (this.view.source && this.view.processing.mode === 'quick')
      this.autoSource = this.view.processing.sourceRevision;
    this.jobs.schedule(
      'capabilities',
      async () => {
        try {
          const capabilities = await this.services.capabilities(this.resources);
          if (!this.live || token !== this.capabilityRevision) return;
          let processing = this.view.processing;
          if (
            !capabilities[processing.settings.format].supported &&
            capabilities.png.supported
          ) {
            processing = restoreRecommended(
              setRecommendedPreset(processing, recommendations.png),
              sameSettings,
            );
          }
          this.patch({ capabilities, processing, checkingCapabilities: false });
          this.consumeAuto();
        } catch (error) {
          if (token === this.capabilityRevision)
            this.patch({
              checkingCapabilities: false,
              capabilityError: failureCode(error),
            });
        }
      },
      () => {
        if (token === this.capabilityRevision) {
          ++this.capabilityRevision;
          this.patch({
            checkingCapabilities: false,
            capabilityError: 'timeout',
          });
        }
      },
    );
  }
  select(file: File) {
    const token = ++this.selection;
    this.patch({
      candidate: file.name,
      inputError: undefined,
      errorDetail: undefined,
    });
    this.jobs.schedule(
      'candidate',
      async () => {
        try {
          const source = await this.services.accept(file, this.resources);
          if (!this.live || token !== this.selection) return;
          const processing = {
            ...replaceSource(this.view.processing),
            result: undefined,
          };
          this.patch({
            source,
            processing,
            candidate: undefined,
            filename: '',
          });
          if (processing.mode === 'quick')
            this.autoSource = processing.sourceRevision;
          this.consumeAuto();
        } catch (error) {
          if (token === this.selection) {
            this.patch({
              candidate: undefined,
              inputError: failureCode(error),
              errorDetail: error instanceof ImageFailure ? error.detail : '',
            });
            // If an old encode was queued (not active), cancellation must not leave a spinner.
            if (this.view.processing.status === 'processing')
              this.state(cancelRequest(this.view.processing));
          }
        }
      },
      () => {
        if (token === this.selection) {
          ++this.selection;
          this.patch({ candidate: undefined, inputError: 'timeout' });
          this.state(cancelRequest(this.view.processing));
        }
      },
    );
  }
  private consumeAuto() {
    if (
      this.view.checkingCapabilities ||
      !this.view.capabilities ||
      this.view.candidate
    )
      return;
    const revision = this.autoSource;
    this.autoSource = undefined;
    if (
      revision === this.view.processing.sourceRevision &&
      this.view.processing.mode === 'quick' &&
      this.view.capabilities[this.view.processing.settings.format].supported
    )
      this.generate();
  }
  mode(mode: ToolMode) {
    this.autoSource = undefined;
    this.state(setToolMode(this.view.processing, mode));
  }
  format(format: ImageFormat) {
    if (
      this.view.checkingCapabilities ||
      !this.view.capabilities?.[format].supported
    )
      return;
    let processing = setRecommendedPreset(
      this.view.processing,
      recommendations[format],
    );
    const settings =
      processing.mode === 'quick'
        ? recommendations[format].settings
        : this.preferences[format];
    const changed = !sameSettings(processing.settings, settings);
    processing = updateSettings(
      processing,
      settings,
      sameSettings,
      validSettings(settings),
    );
    this.state(processing);
    if (
      processing.mode === 'quick' &&
      (changed || ['idle', 'stale', 'error'].includes(processing.status))
    )
      this.generate();
  }
  settings(settings: EncodeSettings) {
    this.preferences[settings.format] = settings;
    const before = this.view.processing;
    const next = updateSettings(
      before,
      settings,
      sameSettings,
      validSettings(settings),
    );
    this.state(next);
    if (next !== before) this.jobs.cancel('encode');
  }
  restore() {
    const changed = !sameSettings(
      this.view.processing.settings,
      this.view.processing.preset.settings,
    );
    const processing = restoreRecommended(this.view.processing, sameSettings);
    this.preferences[processing.settings.format] = processing.settings;
    this.state(processing);
    if (
      processing.mode === 'quick' &&
      (changed || ['idle', 'stale', 'error'].includes(processing.status))
    )
      this.generate();
  }
  name(filename: string) {
    this.patch({ filename });
  }
  generate() {
    const before = this.view.processing,
      source = this.view.source;
    if (
      !source ||
      this.view.candidate ||
      this.view.checkingCapabilities ||
      !this.view.capabilities?.[before.settings.format].supported ||
      !validSettings(before.settings)
    )
      return;
    const processing = beginRequest(before),
      snapshot = processing.active!;
    const passthrough =
      before.mode === 'quick' &&
      source.info.format === snapshot.settings.format;
    this.state(processing);
    this.jobs.schedule(
      'encode',
      async () => {
        if (!this.current(snapshot)) return;
        try {
          const blob = passthrough
            ? source.blob
            : await this.services.encode(
                source,
                snapshot.settings,
                this.resources,
              );
          const kind = passthrough ? 'passthrough' : 'encoded';
          const result: ImageResult = {
            kind,
            blob,
            mime: mime[snapshot.settings.format],
            width: source.width,
            height: source.height,
            bytes: blob.size,
            suggestedFilename: downloadName(
              source.file.name,
              snapshot.settings.format,
              kind,
            ).name,
          };
          if (this.current(snapshot))
            this.state(completeRequest(this.view.processing, snapshot, result));
        } catch (error) {
          if (this.current(snapshot))
            this.state(
              failRequest(this.view.processing, snapshot, failureCode(error)),
            );
        }
      },
      () => {
        if (this.current(snapshot))
          this.state(failRequest(this.view.processing, snapshot, 'timeout'));
      },
    );
  }
  private current(snapshot: ProcessingSnapshot<EncodeSettings>) {
    const s = this.view.processing;
    return (
      this.live &&
      s.status === 'processing' &&
      s.sourceRevision === snapshot.sourceRevision &&
      s.settingsRevision === snapshot.settingsRevision &&
      s.requestId === snapshot.requestId
    );
  }
  download() {
    return this.view.candidate
      ? undefined
      : downloadableResult(this.view.processing);
  }
  rejectSelection(code: ImageErrorCode) {
    ++this.selection;
    this.jobs.cancel('candidate');
    this.patch({ candidate: undefined, inputError: code });
  }
  remove() {
    ++this.selection;
    this.autoSource = undefined;
    this.jobs.cancel('candidate');
    this.jobs.cancel('encode');
    this.patch({
      source: undefined,
      candidate: undefined,
      inputError: undefined,
      errorDetail: undefined,
      filename: '',
      processing: clearSource(this.view.processing),
    });
  }
  dispose() {
    this.live = false;
    ++this.selection;
    ++this.capabilityRevision;
    this.jobs.dispose();
    this.view = {
      ...this.view,
      source: undefined,
      candidate: undefined,
      processing: clearSource(this.view.processing),
    };
  }
}
