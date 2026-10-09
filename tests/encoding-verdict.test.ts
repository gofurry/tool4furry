import { expect, it } from 'vitest';
import { encodingVerdict } from '../scripts/spikes/encoding-verdict.js';

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
it('does not advertise PNG fallback as WebP, even with a misleading MIME', () => {
  expect(encodingVerdict('image/webp', 'image/png', png).matches).toBe(false);
  expect(encodingVerdict('image/webp', 'image/webp', png).matches).toBe(false);
  expect(encodingVerdict('image/png', 'image/png', png).matches).toBe(true);
});
it('identifies JPEG/WebP headers and rejects unknown or empty bytes', () => {
  expect(
    encodingVerdict('image/jpeg', 'image/jpeg', new Uint8Array([255, 216, 255]))
      .matches,
  ).toBe(true);
  const webp = new TextEncoder().encode('RIFF0000WEBP');
  expect(encodingVerdict('image/webp', 'image/webp', webp).matches).toBe(true);
  expect(
    encodingVerdict('image/png', 'image/png', new Uint8Array()).matches,
  ).toBe(false);
});
