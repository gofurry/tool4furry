// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  inspectImage,
  exifOrientation,
} from '../src/tools/image/inspect-image';
import { orientedSize, validateOutput } from '../src/tools/image/browser-codec';
import { imageBudget, ImageFailure } from '../src/tools/image/types';
import { ImageResources } from '../src/tools/image/resources';
const sample = async (name: string) =>
  new Blob([
    await readFile(new URL(`./fixtures/images/${name}`, import.meta.url)),
  ]);
describe('bounded static image inspection', () => {
  it.each([
    ['transparent.png', 'png'],
    ['static.jpg', 'jpeg'],
    ['progressive.jpg', 'jpeg'],
    ['static.webp', 'webp'],
    ['wrong-extension.jpg', 'png'],
    ['text-marker.png', 'png'],
  ])('identifies %s by structure, not MIME/name', async (name, format) => {
    expect(await inspectImage(await sample(name))).toMatchObject({
      format,
      width: 80,
      height: 48,
      orientation: 1,
    });
  });
  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    'reads EXIF %i without transforming twice',
    async (orientation) => {
      const info = await inspectImage(
        await sample(`orientation-${orientation}.jpg`),
      );
      expect(info.orientation).toBe(orientation);
      expect(orientedSize(info)).toEqual(
        orientation >= 5
          ? { width: 48, height: 80 }
          : { width: 80, height: 48 },
      );
    },
  );
  it.each([
    ['animated.png', 'animated'],
    ['animated.webp', 'animated'],
    ['truncated.png', 'corrupt'],
    ['empty.png', 'empty'],
    ['unsupported.gif', 'unsupported'],
    ['over-edge.png', 'dimensions'],
    ['over-pixels.png', 'dimensions'],
  ])('rejects %s before decode', async (name, code) => {
    await expect(inspectImage(await sample(name))).rejects.toMatchObject({
      code,
    });
  });
  it('rejects byte limit, PNG CRC corruption and RIFF size mismatch', async () => {
    await expect(
      inspectImage(new Blob([new Uint8Array(imageBudget.bytes + 1)])),
    ).rejects.toMatchObject({ code: 'bytes' });
    const png = new Uint8Array(
      await (await sample('transparent.png')).arrayBuffer(),
    );
    png[29] ^= 1;
    await expect(inspectImage(new Blob([png]))).rejects.toMatchObject({
      code: 'corrupt',
    });
    const webp = new Uint8Array(
      await (await sample('static.webp')).arrayBuffer(),
    );
    webp[4] ^= 1;
    await expect(inspectImage(new Blob([webp]))).rejects.toMatchObject({
      code: 'corrupt',
    });
  });
  it('bounds every read and refuses malformed TIFF offsets', async () => {
    expect(() =>
      exifOrientation(new Uint8Array([73, 73, 42, 0, 255, 255, 255, 127])),
    ).toThrow(ImageFailure);
    const source = await sample('static.jpg'),
      sizes: number[] = [];
    const blob = {
      size: source.size,
      slice: (start: number, end: number) => {
        sizes.push(end - start);
        return source.slice(start, end);
      },
    } as Blob;
    await inspectImage(blob);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(65536);
  });
  it('accepts a large valid chunk stream but bounds empty-chunk abuse', async () => {
    const png = new Uint8Array(
      await (await sample('transparent.png')).arrayBuffer(),
    );
    // Empty IDAT with its published CRC. The original compressed stream is intact.
    const emptyIDAT = new Uint8Array([
      0, 0, 0, 0, 73, 68, 65, 84, 53, 175, 6, 30,
    ]);
    const padded = (count: number) =>
      new Blob([
        png.slice(0, 33),
        ...Array.from({ length: count }, () => emptyIDAT),
        png.slice(33),
      ]);
    expect(await inspectImage(padded(4100))).toMatchObject({
      format: 'png',
      width: 80,
      height: 48,
    });
    await expect(inspectImage(padded(5000))).rejects.toMatchObject({
      code: 'corrupt',
    });
  });
  it('does not reread a scan buffer for every stuffed JPEG marker', async () => {
    const jpeg = new Uint8Array(
      await (await sample('static.jpg')).arrayBuffer(),
    );
    const stuffed = new Uint8Array(200000).fill(255);
    for (let i = 1; i < stuffed.length; i += 2) stuffed[i] = 0;
    const source = new Blob([jpeg.slice(0, -2), stuffed, jpeg.slice(-2)]);
    let readBytes = 0;
    const counted = {
      size: source.size,
      slice: (start: number, end: number) => {
        readBytes += end - start;
        return source.slice(start, end);
      },
    } as Blob;
    await inspectImage(counted);
    expect(readBytes).toBeLessThan(source.size * 2);
  });
  it('rejects PNG fallback even if the output claims a WebP MIME', async () => {
    const png = await sample('transparent.png');
    await expect(
      validateOutput(
        png.slice(0, png.size, 'image/png'),
        'webp',
        80,
        48,
        new ImageResources(),
      ),
    ).rejects.toMatchObject({ code: 'output' });
    await expect(
      validateOutput(
        png.slice(0, png.size, 'image/webp'),
        'webp',
        80,
        48,
        new ImageResources(),
      ),
    ).rejects.toMatchObject({ code: 'output' });
  });
});
