// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  decodeChecked,
  encodeImage,
  toBlob,
} from '../src/tools/image/browser-codec';
import { ImageResources } from '../src/tools/image/resources';
import type { ImageSource } from '../src/tools/image/types';

describe('native codec failure ownership (mocked native boundaries)', () => {
  it('closes a bitmap whose actual dimensions disagree with metadata', async () => {
    const resources = new ImageResources();
    const bitmap = {
      width: 4,
      height: 5,
      close: vi.fn(),
    } as unknown as ImageBitmap;
    vi.spyOn(resources, 'bitmap').mockResolvedValue(bitmap);
    await expect(
      decodeChecked(
        new Blob(['bad']),
        { format: 'png', width: 80, height: 48, orientation: 1 },
        resources,
      ),
    ).rejects.toMatchObject({ code: 'decode' });
    expect(bitmap.close).toHaveBeenCalledOnce();
  });
  it.each(['context', 'draw', 'empty-output', 'throw-output'])(
    'releases its bitmap and canvas on %s failure',
    async (failure) => {
      const resources = new ImageResources();
      const bitmap = {
        width: 80,
        height: 48,
        close: vi.fn(),
      } as unknown as ImageBitmap;
      vi.spyOn(resources, 'bitmap').mockResolvedValue(bitmap);
      const canvas = {
        width: 80,
        height: 48,
        getContext: () =>
          failure === 'context'
            ? null
            : {
                drawImage: () => {
                  if (failure === 'draw') throw new Error('draw failed');
                },
              },
        toBlob: (callback: BlobCallback) => {
          if (failure === 'throw-output') throw new Error('native failed');
          callback(null);
        },
      } as unknown as HTMLCanvasElement;
      vi.spyOn(resources, 'canvas').mockReturnValue(canvas);
      const source = {
        file: new File(['x'], 'source.png'),
        blob: new Blob(['x']),
        info: { format: 'png', width: 80, height: 48, orientation: 1 },
        width: 80,
        height: 48,
      } satisfies ImageSource;
      await expect(
        encodeImage(
          source,
          { format: 'png', quality: null, jpegBackground: '#FFFFFF' },
          resources,
        ),
      ).rejects.toBeDefined();
      expect(bitmap.close).toHaveBeenCalledOnce();
      expect(resources.canvasesReleased).toBe(1);
      expect([canvas.width, canvas.height]).toEqual([0, 0]);
    },
  );
  it('rejects a zero-byte native export', async () => {
    const canvas = {
      toBlob: (callback: BlobCallback) => callback(new Blob([])),
    } as HTMLCanvasElement;
    await expect(toBlob(canvas, 'image/png')).rejects.toMatchObject({
      code: 'encode',
    });
  });
});
