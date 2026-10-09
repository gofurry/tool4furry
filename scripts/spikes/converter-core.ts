import {
  acceptImage,
  detectCapabilities,
  encodeImage,
  decodeChecked,
} from '../../src/tools/image/browser-codec';
import { ImageResources } from '../../src/tools/image/resources';
import { inspectImage } from '../../src/tools/image/inspect-image';
import { formats, mime } from '../../src/tools/image/types';
const button = document.querySelector<HTMLButtonElement>('#run')!;
const status = document.querySelector('#status')!;
button.disabled = false;
status.textContent = 'Ready';
const stress = document.querySelector<HTMLButtonElement>('#stress')!;
stress.disabled = false;
stress.onclick = async () => {
  stress.disabled = button.disabled = true;
  const resources = new ImageResources(),
    rows: unknown[] = [];
  let error = '';
  try {
    for (const name of [
      'wild-cherry.jpg',
      'budget-4000.png',
      'edge-8192.png',
      'noise-4000.jpg',
    ]) {
      const response = await fetch(`/external-samples/${name}`);
      if (!response.ok) throw new Error(`Missing optional sample ${name}`);
      const file = new File([await response.blob()], name);
      const started = performance.now();
      const source = await acceptImage(file, resources);
      const decodeMs = Math.round(performance.now() - started);
      for (const format of formats) {
        status.textContent = `${name} → ${format}`;
        const begin = performance.now();
        const blob = await encodeImage(
          source,
          {
            format,
            quality: format === 'png' ? null : format === 'jpeg' ? 88 : 85,
            jpegBackground: '#FFFFFF',
          },
          resources,
        );
        rows.push({
          name,
          inputBytes: file.size,
          dimensions: [source.width, source.height],
          format,
          mime: blob.type,
          outputBytes: blob.size,
          decodeMs,
          encodeAndVerifyMs: Math.round(performance.now() - begin),
        });
      }
    }
  } catch (err) {
    error =
      String(err) +
      (err && typeof err === 'object' && 'detail' in err
        ? `: ${err.detail}`
        : '');
  }
  document.querySelector('#stress-report')!.textContent = JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      rows,
      resources,
      error,
    },
    null,
    2,
  );
  document
    .querySelector('#stress-report')!
    .setAttribute('data-complete', 'true');
  status.textContent = error || 'Large sample checks complete';
  stress.disabled = button.disabled = false;
};
button.onclick = async () => {
  button.disabled = true;
  const resources = new ImageResources();
  const rows: unknown[] = [];
  const colors = [
    [240, 20, 20],
    [20, 220, 20],
    [137, 137, 247],
    [255, 255, 255],
  ];
  const orders = [
    [0, 1, 2, 3],
    [1, 0, 3, 2],
    [3, 2, 1, 0],
    [2, 3, 0, 1],
    [0, 2, 1, 3],
    [2, 0, 3, 1],
    [3, 1, 2, 0],
    [1, 3, 0, 2],
  ];
  const load = async (name: string) => {
    const response = await fetch(`/tests/fixtures/images/${name}`);
    if (!response.ok) throw new Error(`Missing fixture: ${name}`);
    return new File([await response.blob()], name);
  };
  const pixels = async (blob: Blob) => {
    const info = await inspectImage(blob, 81_048_576);
    const bitmap = await decodeChecked(blob, info, resources);
    const c = resources.canvas(bitmap.width, bitmap.height);
    try {
      const ctx = c.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      return [
        [10, 10],
        [c.width - 11, 10],
        [10, c.height - 11],
        [c.width - 11, c.height - 11],
      ].map(([x, y]) => [...ctx.getImageData(x, y, 1, 1).data]);
    } finally {
      resources.close(bitmap);
      resources.release(c);
    }
  };
  let error = '';
  try {
    const capabilities = await detectCapabilities(resources);
    rows.push({ capabilities });
    for (const name of [
      'transparent.png',
      'static.jpg',
      'progressive.jpg',
      'static.webp',
      'wrong-extension.jpg',
    ]) {
      status.textContent = name;
      const source = await acceptImage(await load(name), resources);
      for (const format of formats) {
        if (!capabilities[format].supported) {
          rows.push({ name, format, skipped: 'unsupported' });
          continue;
        }
        const start = performance.now();
        const blob = await encodeImage(
          source,
          {
            format,
            quality: format === 'png' ? null : format === 'jpeg' ? 88 : 85,
            jpegBackground: '#FFFFFF',
          },
          resources,
        );
        rows.push({
          name,
          format,
          mime: blob.type,
          bytes: blob.size,
          ms: Math.round(performance.now() - start),
          dimensions: [source.width, source.height],
          pixels: await pixels(blob),
        });
      }
    }
    for (let orientation = 1; orientation <= 8; orientation++) {
      const source = await acceptImage(
        await load(`orientation-${orientation}.jpg`),
        resources,
      );
      const blob = await encodeImage(
        source,
        { format: 'png', quality: null, jpegBackground: '#FFFFFF' },
        resources,
      );
      const values = await pixels(blob);
      const passed = values.every((pixel, i) =>
        pixel
          .slice(0, 3)
          .every(
            (value, c) =>
              Math.abs(value - colors[orders[orientation - 1][i]][c]) <= 18,
          ),
      );
      rows.push({
        orientation,
        dimensions: [source.width, source.height],
        pixels: values,
        passed,
      });
      if (!passed) throw new Error(`Orientation ${orientation} failed`);
    }
    for (const name of [
      'animated.png',
      'animated.webp',
      'truncated.png',
      'unsupported.gif',
      'empty.png',
      'over-edge.png',
      'over-pixels.png',
    ]) {
      try {
        await acceptImage(await load(name), resources);
        throw new Error(`Unexpected acceptance: ${name}`);
      } catch (err) {
        if (!(err && typeof err === 'object' && 'code' in err)) throw err;
        rows.push({ name, rejected: err.code });
      }
    }
    // Unknown requested MIME must never be treated as successful WebP.
    const c = resources.canvas(2, 2);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        c.toBlob(resolve, 'image/x-unsupported'),
      );
      rows.push({
        fallback: {
          requested: 'image/x-unsupported',
          actual: blob?.type,
          bytes: blob?.size,
        },
      });
      if (blob?.type !== mime.png)
        throw new Error('Unexpected fallback result');
    } finally {
      resources.release(c);
    }
  } catch (err) {
    error = String(err);
  }
  const report = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    rows,
    resources,
    error,
  };
  document.querySelector('#report')!.textContent = JSON.stringify(
    report,
    null,
    2,
  );
  document.querySelector('#report')!.setAttribute('data-complete', 'true');
  status.textContent = error || 'Checks complete';
  button.disabled = false;
};
