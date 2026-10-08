import { describe, expect, it } from 'vitest';
import { matchesAccept, validateFiles } from '../src/ui/file-constraints';

const file = (name: string, type = '', size = 1) =>
  new File(['x'.repeat(size)], name, { type });
describe('file metadata constraints', () => {
  it.each([
    ['portrait.PNG', 'image/png', undefined, true],
    ['portrait.PNG', '', ' , ', true],
    ['portrait.PNG', '', '.PnG', true],
    ['portrait.jpg', 'IMAGE/JPEG', 'IMAGE/JPEG', true],
    ['portrait.webp', 'image/webp', 'image/*', true],
    ['voice.ogg', 'audio/ogg', 'audio/*', true],
    ['clip.mp4', 'video/mp4', 'video/*', true],
    ['portrait.png', '', 'image/*', false],
    ['portrait.png', '', 'image/png,.PNG', true],
    ['portrait.png.exe', '', '.png', false],
    ['notes.txt', 'text/plain', 'image/*', false],
    ['notes.txt', '', 'nonsense', false],
  ])('matches %s (%s) against %s → %s', (name, type, accept, expected) => {
    expect(matchesAccept({ name, type }, accept)).toBe(expected);
  });
  it('accepts a stable ordered subset and reports every rejected file', () => {
    const batch = [
      file('bad.txt', 'text/plain'),
      file('big.png', 'image/png', 11),
      file('first.png', '', 10),
      file('second.png'),
      file('extra.png'),
    ];
    const before = [...batch];
    const result = validateFiles(batch, {
      accept: '.png',
      multiple: true,
      maxSizeBytes: 10,
      maxFiles: 2,
    });
    expect(result.accepted).toEqual([batch[2], batch[3]]);
    expect(result.accepted[0]).toBe(batch[2]);
    expect(result.rejected).toEqual([
      { name: 'bad.txt', reason: 'type' },
      { name: 'big.png', reason: 'size' },
      { name: 'extra.png', reason: 'count' },
    ]);
    expect(batch).toEqual(before);
  });
  it('defaults to one file and combines multiple/maxFiles without a cumulative queue', () => {
    const batch = [file('a'), file('b'), file('c')];
    expect(validateFiles(batch).accepted).toEqual([batch[0]]);
    expect(validateFiles(batch, { maxFiles: 5 }).rejected).toHaveLength(2);
    expect(validateFiles(batch, { multiple: true }).accepted).toEqual(batch);
    expect(
      validateFiles(batch, { multiple: true, maxFiles: 2 }).accepted,
    ).toEqual(batch.slice(0, 2));
    expect(
      validateFiles(batch, { multiple: true, maxFiles: 0 }).rejected.map(
        (issue) => issue.reason,
      ),
    ).toEqual(['count', 'count', 'count']);
    expect(validateFiles([batch[2]], { maxFiles: 1 }).accepted).toEqual([
      batch[2],
    ]);
  });
  it('allows exact size boundaries, zero-byte files and empty batches', () => {
    const empty = file('empty', '', 0);
    expect(validateFiles([empty], { maxSizeBytes: 0 }).accepted).toEqual([
      empty,
    ]);
    expect(
      validateFiles([file('one')], { maxSizeBytes: 0 }).rejected[0].reason,
    ).toBe('size');
    expect(validateFiles([])).toEqual({ accepted: [], rejected: [] });
  });
  it('rejects malformed numeric limits instead of silently ignoring them', () => {
    for (const invalid of [-1, 0.5, NaN, Infinity]) {
      expect(() => validateFiles([], { maxFiles: invalid })).toThrow(
        RangeError,
      );
      expect(() => validateFiles([], { maxSizeBytes: invalid })).toThrow(
        RangeError,
      );
    }
  });
});
