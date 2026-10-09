// Per-workspace ownership counters, also used by the development acceptance view.
// This object does not store image data or act as a global store.
export class ImageResources {
  bitmapsCreated = 0;
  bitmapsClosed = 0;
  canvasesCreated = 0;
  canvasesReleased = 0;
  urlsCreated = 0;
  urlsRevoked = 0;
  async bitmap(blob: Blob) {
    try {
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: 'from-image',
      });
      this.bitmapsCreated++;
      return bitmap;
    } catch {
      throw new Error('decode');
    }
  }
  close(bitmap: ImageBitmap) {
    bitmap.close();
    this.bitmapsClosed++;
  }
  canvas(width: number, height: number) {
    const canvas = document.createElement('canvas');
    this.canvasesCreated++;
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  release(canvas: HTMLCanvasElement) {
    canvas.width = 0;
    canvas.height = 0;
    this.canvasesReleased++;
  }
  url(blob: Blob) {
    const url = URL.createObjectURL(blob);
    this.urlsCreated++;
    return url;
  }
  revoke(url: string) {
    URL.revokeObjectURL(url);
    this.urlsRevoked++;
  }
}
