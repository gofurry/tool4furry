// Probe helper, not a production decoder or a claim that signatures prove validity.
export function encodingVerdict(requested, blobType, bytes) {
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  const signature =
    bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
      ? 'image/png'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? 'image/jpeg'
        : ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
          ? 'image/webp'
          : 'unknown';
  return {
    requested,
    blobType,
    signature,
    matches: requested === blobType && blobType === signature,
  };
}
