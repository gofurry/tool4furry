export const formats = ['webp', 'jpeg', 'png'] as const;
export type ImageFormat = (typeof formats)[number];
export const mime = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
} as const;
export const extension = { png: 'png', jpeg: 'jpg', webp: 'webp' } as const;
// Development guardrails, NOT validated limits for every device. Publication stays blocked.
export const imageBudget = {
  bytes: 20 * 1024 * 1024,
  pixels: 16_000_000,
  edge: 8192,
} as const;
export type ImageErrorCode =
  | 'empty'
  | 'bytes'
  | 'dimensions'
  | 'unsupported'
  | 'corrupt'
  | 'animated'
  | 'decode'
  | 'encode'
  | 'output'
  | 'timeout'
  | 'cancelled';
export class ImageFailure extends Error {
  constructor(
    public code: ImageErrorCode,
    public detail = '',
  ) {
    super(code);
  }
}
export const failureCode = (error: unknown): ImageErrorCode =>
  error instanceof ImageFailure ? error.code : 'decode';
export type ImageInfo = Readonly<{
  format: ImageFormat;
  width: number;
  height: number;
  orientation: number;
}>;
export type ImageSource = Readonly<{
  file: File;
  info: ImageInfo;
  width: number;
  height: number;
  blob: Blob;
}>;
export type ImageResult = Readonly<{
  kind: 'encoded' | 'passthrough';
  blob: Blob;
  mime: string;
  width: number;
  height: number;
  bytes: number;
  suggestedFilename: string;
}>;
export function checkDimensions(width: number, height: number) {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1
  )
    throw new ImageFailure('corrupt');
  if (
    width > imageBudget.edge ||
    height > imageBudget.edge ||
    width * height > imageBudget.pixels
  )
    throw new ImageFailure('dimensions', `${width}×${height}`);
}
