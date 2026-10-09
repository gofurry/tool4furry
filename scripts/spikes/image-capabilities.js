import { encodingVerdict } from './encoding-verdict.js';

const encode = (canvas, mime, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
const source = document.querySelector('#source');
const sourceContext = source.getContext('2d');
sourceContext.fillStyle = '#e03030';
sourceContext.fillRect(16, 0, 16, 16);
sourceContext.fillStyle = 'rgba(0,0,255,0.5)';
sourceContext.fillRect(0, 16, 16, 16);
sourceContext.fillStyle = '#30a050';
sourceContext.fillRect(16, 16, 16, 16);
const run = document.querySelector('#run');
const status = document.querySelector('#status');
const output = document.querySelector('#report');
run.addEventListener('click', async () => {
  run.disabled = true;
  status.textContent = 'Running';
  output.removeAttribute('data-complete');
  const report = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    timestamp: new Date().toISOString(),
    source: '32x32 synthetic quadrants: transparent/red/half-alpha blue/green',
    exports: [],
    imports: [],
    exceptions: {},
    boundedSize: null,
    createdBitmaps: 0,
    closedBitmaps: 0,
  };
  const decode = async (blob) => {
    const bitmap = await createImageBitmap(blob);
    report.createdBitmaps++;
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    try {
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, 0, 0);
      const pixel = (x, y) => [...context.getImageData(x, y, 1, 1).data];
      return {
        width: bitmap.width,
        height: bitmap.height,
        transparentPixel: pixel(4, 4),
        halfAlphaPixel: pixel(4, 20),
        redPixel: pixel(20, 4),
      };
    } finally {
      bitmap.close();
      report.closedBitmaps++;
      canvas.width = canvas.height = 0;
    }
  };
  try {
    for (const mime of [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/x-tool4furry-unsupported',
    ]) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      const context = canvas.getContext('2d');
      if (mime === 'image/jpeg') {
        context.fillStyle = '#fff';
        context.fillRect(0, 0, 32, 32);
      }
      context.drawImage(source, 0, 0);
      const blob = await encode(
        canvas,
        mime,
        mime === 'image/jpeg' ? 0.88 : 0.85,
      );
      canvas.width = canvas.height = 0;
      if (!blob) {
        report.exports.push({
          requested: mime,
          supported: false,
          error: 'null Blob',
        });
        continue;
      }
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const verdict = encodingVerdict(mime, blob.type, bytes);
      try {
        const decoded = await decode(blob);
        report.exports.push({
          ...verdict,
          bytes: blob.size,
          header: [...bytes.slice(0, 16)]
            .map((v) => v.toString(16).padStart(2, '0'))
            .join(' '),
          decoded,
          supported:
            verdict.matches && decoded.width === 32 && decoded.height === 32,
          ...(mime !== 'image/x-tool4furry-unsupported'
            ? { fixtureBase64: btoa(String.fromCharCode(...bytes)) }
            : {}),
        });
      } catch (error) {
        report.exports.push({
          ...verdict,
          bytes: blob.size,
          supported: false,
          error: `${error.name}: ${error.message}`,
        });
      }
    }
    // Separate import test from encoder support: fixed reference files, not the current outputs.
    for (const [extension, mime] of [
      ['png', 'image/png'],
      ['jpg', 'image/jpeg'],
      ['webp', 'image/webp'],
    ]) {
      try {
        const response = await fetch(`./fixtures/reference.${extension}`);
        if (!response.ok)
          throw new Error(
            `Reference fixture HTTP ${response.status}; generate reference files first`,
          );
        const blob = await response.blob();
        const verdict = encodingVerdict(
          mime,
          blob.type,
          new Uint8Array(await blob.arrayBuffer()),
        );
        const decoded = await decode(blob);
        report.imports.push({
          ...verdict,
          bytes: blob.size,
          decoded,
          decodeSupported:
            verdict.signature === mime &&
            decoded.width === 32 &&
            decoded.height === 32,
        });
      } catch (error) {
        report.imports.push({
          requested: mime,
          error: `${error.name}: ${error.message}`,
        });
      }
    }
    const empty = document.createElement('canvas');
    empty.width = empty.height = 0;
    report.exceptions.zeroDimensions =
      (await encode(empty, 'image/png')) === null
        ? 'null Blob (rejected)'
        : 'unexpected Blob';
    try {
      await decode(
        new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], {
          type: 'image/png',
        }),
      );
      report.exceptions.corruptPng = 'unexpected success';
    } catch (error) {
      report.exceptions.corruptPng = `${error.name}: ${error.message}`;
    }
    const large = document.createElement('canvas');
    large.width = large.height = 2048;
    try {
      const context = large.getContext('2d');
      context.fillStyle = '#c97849';
      context.fillRect(0, 0, large.width, large.height);
      const blob = await encode(large, 'image/png');
      report.boundedSize = blob
        ? {
            attempted: '2048x2048 (4,194,304 pixels)',
            blobType: blob.type,
            bytes: blob.size,
            decoded: await decode(blob),
            maximumTested: false,
          }
        : { error: 'null Blob' };
    } finally {
      large.width = large.height = 0;
    }
    status.textContent =
      'Complete — inspect actual MIME, decoded pixels and unverified limits';
  } catch (error) {
    report.error = `${error.name}: ${error.message}`;
    status.textContent = 'Probe failed — inspect report';
  } finally {
    output.textContent = JSON.stringify(report, null, 2);
    output.dataset.complete = 'true';
    run.disabled = false;
  }
});
run.disabled = false;
