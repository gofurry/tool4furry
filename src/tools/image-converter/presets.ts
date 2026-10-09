import type { Preset } from '../processing-state';
import type { ImageFormat } from '../image/types';
export type EncodeSettings = Readonly<{
  format: ImageFormat;
  quality: number | null;
  jpegBackground: string;
}>;
export const recommendations: Record<ImageFormat, Preset<EncodeSettings>> = {
  webp: {
    id: 'webp',
    version: 1,
    settings: { format: 'webp', quality: 85, jpegBackground: '#FFFFFF' },
  },
  jpeg: {
    id: 'jpeg',
    version: 1,
    settings: { format: 'jpeg', quality: 88, jpegBackground: '#FFFFFF' },
  },
  png: {
    id: 'png',
    version: 1,
    settings: { format: 'png', quality: null, jpegBackground: '#FFFFFF' },
  },
};
export function sameSettings(
  a: Readonly<EncodeSettings>,
  b: Readonly<EncodeSettings>,
) {
  return (
    a.format === b.format &&
    (a.format === 'png' || Object.is(a.quality, b.quality)) &&
    (a.format !== 'jpeg' ||
      a.jpegBackground.toUpperCase() === b.jpegBackground.toUpperCase())
  );
}
export function validSettings(s: EncodeSettings) {
  return (
    (s.format === 'png' ||
      (Number.isInteger(s.quality) && s.quality! >= 1 && s.quality! <= 100)) &&
    (s.format !== 'jpeg' || /^#[0-9a-f]{6}$/i.test(s.jpegBackground))
  );
}
