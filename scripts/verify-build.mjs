import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const region = process.argv[2];
assert(['cn', 'global'].includes(region), 'Specify cn or global');
const root = resolve('dist', region);
const files = (await readdir(root, { recursive: true })).map((file) =>
  file.replaceAll('\\', '/'),
);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
assert(
  !files.some((file) => /(^|\/)lab(\/|$)/i.test(file)),
  'Lab paths leaked into production',
);
assert(
  !files.some((file) =>
    /LabRuntime|WorkbenchLab|CanvasDemo|FormDemo|BatchDemo|UILab|FilesLab/.test(
      file,
    ),
  ),
  'Lab entry assets leaked into production',
);
assert(htmlFiles.includes('404.html'), 'Missing static 404');
const home = await readFile(resolve(root, 'index.html'), 'utf8');
const document = new JSDOM(home).window.document;
const site =
  region === 'cn' ? 'https://tool4furry.cn/' : 'https://tool4furry.com/';
assert.equal(document.documentElement.lang, region === 'cn' ? 'zh-CN' : 'en');
assert.equal(
  document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
  site,
);
assert.equal(
  document.querySelectorAll('astro-island, script').length,
  0,
  'Homepage must remain static',
);
assert(!home.includes('/lab/'), 'Lab navigation leaked into homepage');
assert.equal(
  document.querySelectorAll('link[rel="modulepreload"], link[as="script"]')
    .length,
  0,
  'Homepage must not preload JavaScript',
);
if (region === 'global')
  assert(
    !/[\u4e00-\u9fff]/u.test(document.body.textContent),
    'Chinese copy in global homepage',
  );
const toolLinks = new Set(
  [...document.querySelectorAll('a[href^="/tools/"]')].map((link) =>
    link.getAttribute('href'),
  ),
);
if (toolLinks.size === 0)
  assert(
    home.includes(region === 'cn' ? '工具正在准备中' : 'Tools are on the way'),
    'Wrong empty state copy',
  );
for (const page of htmlFiles.filter((file) => file.startsWith('tools/'))) {
  assert(
    toolLinks.has('/' + page.replace(/index\.html$/, '')),
    `Unlisted tool page: ${page}`,
  );
}
const fontAssets = new Set();
const inlineFonts = new Set();
for (const page of htmlFiles) {
  const content = await readFile(resolve(root, page), 'utf8');
  assert(!content.includes('virtual:stylex'), `Dev StyleX runtime in ${page}`);
  const dom = new JSDOM(content).window.document;
  const stylesheets = [...dom.querySelectorAll('link[rel="stylesheet"]')];
  assert(stylesheets.length > 0, `Missing extracted CSS in ${page}`);
  const linkedCSS = [];
  for (const link of stylesheets) {
    const path = link.getAttribute('href');
    assert(
      path?.startsWith('/_astro/'),
      'CSS must use portable static asset paths',
    );
    const css = await readFile(resolve(root, path.slice(1)), 'utf8');
    linkedCSS.push(css);
    assert(!/@import\b/.test(css), `Unbundled CSS import in ${path}`);
    for (const [, , asset] of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)) {
      // Vite embeds a few tiny Unicode subsets in the locally served CSS.
      if (asset.startsWith('data:font/woff2;base64,')) {
        const bytes = Buffer.from(
          asset.slice('data:font/woff2;base64,'.length),
          'base64',
        );
        assert.equal(
          bytes.toString('ascii', 0, 4),
          'wOF2',
          'Invalid embedded WOFF2',
        );
        inlineFonts.add(asset);
        continue;
      }
      const url = new URL(asset, `https://static.invalid${path}`);
      assert(
        url.origin === 'https://static.invalid' &&
          url.pathname.startsWith('/_astro/'),
        `Non-local CSS asset: ${asset.slice(0, 100)}`,
      );
      const bytes = await readFile(resolve(root, url.pathname.slice(1)));
      assert(bytes.length > 0, `Empty CSS asset: ${asset}`);
      if (url.pathname.endsWith('.woff2')) {
        assert.equal(
          bytes.toString('ascii', 0, 4),
          'wOF2',
          `Invalid WOFF2: ${asset}`,
        );
        fontAssets.add(url.pathname);
      }
    }
  }
  const css = linkedCSS.join('\n');
  assert(
    css.includes('@layer priority') && css.includes('--'),
    'Linked CSS must include extracted StyleX styles and tokens',
  );
  for (const family of ['DM Sans Variable', 'Noto Sans SC Variable'])
    assert(css.includes(family), `Missing self-hosted font: ${family}`);
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(
    (match) => match[1],
  );
  assert(faces.length > 0, 'Missing bundled font faces');
  for (const face of faces) {
    assert(
      /font-style:\s*normal/.test(face) && /font-display:\s*swap/.test(face),
      'Only normal swap fonts are expected',
    );
    assert(
      /font-weight:\s*100 (900|1000)/.test(face) &&
        /unicode-range:/i.test(face),
      'Variable weight and Unicode subsets must be preserved',
    );
  }
  assert.equal(
    dom.querySelectorAll('link[rel="preload"][as="font"]').length,
    0,
    'Do not preload all font subsets',
  );
}
assert(fontAssets.size > 0, 'Missing self-hosted WOFF2 assets');
for (const font of ['dm-sans', 'noto-sans-sc']) {
  assert.equal(
    (
      await readFile(resolve(root, 'licenses', `${font}-OFL.txt`), 'utf8')
    ).replaceAll('\r\n', '\n'),
    (
      await readFile(
        resolve('node_modules/@fontsource-variable', font, 'LICENSE'),
        'utf8',
      )
    ).replaceAll('\r\n', '\n'),
    `Font license must accompany the static assets: ${font}`,
  );
}
for (const file of files.filter((file) => file.endsWith('.js'))) {
  const js = await readFile(resolve(root, file), 'utf8');
  assert(
    !/data-workbench|data-ui-lab|data-files-lab|simulateText|advanceTasks|canvasAction/.test(
      js,
    ),
    `Demo implementation leaked: ${file}`,
  );
}
assert((await stat(root)).isDirectory());
console.log(
  `Verified ${region}: ${htmlFiles.length} static pages, extracted StyleX CSS, ${fontAssets.size} local WOFF2 assets + ${inlineFonts.size} embedded subsets, correct locale/canonical, no Lab routes or demo implementation.`,
);
