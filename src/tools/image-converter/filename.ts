import { extension, type ImageFormat } from '../image/types';
const strip = (value: string) =>
  value.replace(/(?:\.(?:png|jpe?g|webp))+$/i, '');
const forbidden = /[<>:"/\\|?*\x00-\x1f\x7f]/;
const reserved = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
export function downloadName(
  source: string,
  format: ImageFormat,
  kind: 'encoded' | 'passthrough',
  custom = '',
) {
  const extensionName = extension[format];
  if (custom !== '') {
    const stem = strip(custom.trim());
    if (
      !stem ||
      stem.length > 120 ||
      forbidden.test(stem) ||
      /[. ]$/.test(stem) ||
      reserved.test(stem) ||
      custom !== custom.trim()
    )
      return { name: '', error: true };
    return { name: `${stem}.${extensionName}`, error: false };
  }
  let stem = strip(source)
    .replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g, '-')
    .replace(/[. ]+$/g, '')
    .trim();
  stem = [...stem].slice(0, 100).join('');
  if (!stem || reserved.test(stem)) stem = 'image';
  return {
    name: `${stem}${kind === 'encoded' ? '-converted' : ''}.${extensionName}`,
    error: false,
  };
}
