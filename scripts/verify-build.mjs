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
    /LabRuntime|WorkbenchLab|LabMenu|CanvasDemo|FormDemo|BatchDemo|UILab|FilesLab/.test(
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
const expectedTitle =
  region === 'cn'
    ? 'Tool4Furry — Furry 创作者的浏览器工具箱'
    : 'Tool4Furry — Browser Tools for Furry Creators';
const expectedDescription =
  region === 'cn'
    ? 'Tool4Furry 正在为 Furry 创作者打造轻巧的浏览器工具箱，涵盖创作、素材处理与日常效率。首批工具开发中。'
    : 'Tool4Furry is building browser-based tools for furry creators, focused on creative tasks, assets and everyday productivity. Tools are on the way.';
assert.equal(
  document.title,
  expectedTitle,
  'Homepage title must not repeat the brand',
);
assert.equal(
  document.querySelector('meta[name="description"]')?.content,
  expectedDescription,
);
for (const [property, expected] of Object.entries({
  'og:title': expectedTitle,
  'og:description': expectedDescription,
  'og:url': site,
  'og:type': 'website',
  'og:site_name': 'Tool4Furry',
})) {
  const tags = document.querySelectorAll(`meta[property="${property}"]`);
  assert.equal(tags.length, 1, `Exactly one ${property}`);
  assert.equal(tags[0].content, expected);
}
assert.equal(
  document.querySelectorAll('meta[property="og:image"]').length,
  0,
  'No invented share image',
);
assert.equal(document.querySelectorAll('h1').length, 1);
assert.equal(
  document.querySelector('h1')?.textContent.trim().replace(/\s+/g, ' '),
  region === 'cn'
    ? '灵感尽情发挥。繁琐留给工具。'
    : 'More room for imagination. Less time on the tedious bits.',
);
assert(document.querySelector('main#main-content'), 'Missing skip-link target');
assert.equal(
  document.querySelector('a[href="#main-content"]')?.textContent.trim(),
  region === 'cn' ? '跳到主要内容' : 'Skip to content',
);
const catalog = document.querySelector(
  'section#tools[aria-labelledby="tools-heading"]',
);
assert(
  catalog?.querySelector('h2#tools-heading'),
  'The toolbox anchor and heading must always exist',
);
assert.equal(
  document.querySelectorAll('input[type="search"], [role="search"]').length,
  0,
  'No empty search UI',
);
const github = 'https://github.com/gofurry/tool4furry';
const mark = '/brand/tool4furry-mark.svg';
for (const tag of ['header', 'footer']) {
  const shell = document.querySelector(tag);
  assert(
    shell?.querySelector('a[href="/#tools"]'),
    `${tag}: missing cross-page toolbox link`,
  );
  assert(
    shell.querySelector(`a[href="${github}"]`),
    `${tag}: missing real GitHub link`,
  );
  const brand = shell.querySelector('a[href="/"]');
  assert.equal(brand?.textContent.trim(), 'Tool4Furry');
  assert.equal(brand.querySelector('img')?.getAttribute('src'), mark);
  assert.equal(brand.querySelector('img')?.getAttribute('alt'), '');
}
assert(
  document.querySelector(`footer a[href="${github}/blob/main/LICENSE"]`),
  'Missing real license link',
);
assert(
  document
    .querySelector('footer')
    ?.textContent.includes(
      region === 'cn'
        ? '前端开源 · 浏览器本地处理优先'
        : 'Open-source frontend · Local processing first',
    ),
);
assert.equal(
  document
    .querySelector('link[rel="icon"][type="image/svg+xml"]')
    ?.getAttribute('href'),
  mark,
);
for (const path of [mark, '/brand/creative-fragments.svg']) {
  const svg = await readFile(resolve(root, path.slice(1)), 'utf8');
  const asset = new JSDOM(svg, { contentType: 'image/svg+xml' }).window
    .document;
  assert(
    asset.documentElement.hasAttribute('viewBox'),
    `${path}: missing viewBox`,
  );
  assert.equal(
    asset.querySelectorAll(
      'script, foreignObject, image, animate, animateTransform',
    ).length,
    0,
    `${path}: must be a static local vector`,
  );
  assert(
    !/\son\w+\s*=|(?:href|url)\s*[(=]/i.test(svg),
    `${path}: external resources or event handlers`,
  );
}
for (const image of document.querySelectorAll('img')) {
  assert(
    image.getAttribute('src')?.startsWith('/brand/'),
    'Homepage images must be local brand assets',
  );
  assert.equal(
    image.getAttribute('alt'),
    '',
    'Decorative art must have empty alt',
  );
  assert(
    image.hasAttribute('width') && image.hasAttribute('height'),
    'Reserve image geometry',
  );
}
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
assert.equal(
  catalog.querySelectorAll('[data-catalog-empty]').length,
  toolLinks.size === 0 ? 1 : 0,
);
assert.equal(
  document.querySelectorAll('a[href="#tools"]').length,
  toolLinks.size === 0 ? 0 : 1,
  'Only published tools may enable the hero CTA',
);
const cards = [...catalog.querySelectorAll('ul > li > a[data-tool-card]')];
assert.equal(
  cards.length,
  toolLinks.size,
  'Every tool link must be a whole catalog card',
);
assert.equal(
  new Set(cards.map((card) => card.dataset.toolCard)).size,
  cards.length,
  'Duplicate catalog tool IDs',
);
for (const card of cards) {
  const href = card.getAttribute('href');
  assert(
    /^\/tools\/[a-z0-9-]+\/$/.test(href),
    `Invalid real tool route: ${href}`,
  );
  assert(
    htmlFiles.includes(`${href.slice(1)}index.html`),
    `Catalog link has no generated tool page: ${href}`,
  );
  assert(card.querySelector('h3')?.textContent.trim(), 'Missing tool title');
  assert(
    card.querySelector('p')?.textContent.trim(),
    'Missing tool description',
  );
  assert.equal(
    card.querySelectorAll('a, button, input').length,
    0,
    'No nested interactive card controls',
  );
}
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
  assert.equal(
    dom.querySelector('link[rel="icon"]')?.getAttribute('href'),
    mark,
    `Shared favicon missing: ${page}`,
  );
  if (page === '404.html') {
    assert.equal(
      dom.querySelector('meta[name="robots"]')?.content,
      'noindex, nofollow',
    );
    assert.equal(dom.querySelectorAll('link[rel="canonical"]').length, 0);
    assert.equal(
      dom.title,
      '404 · Tool4Furry',
      'Preserve the default title API',
    );
    assert(
      dom.querySelector('header a[href="/#tools"]'),
      '404 toolbox navigation must return to the home catalog',
    );
  }
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
    !/data-workbench|data-ui-lab|data-files-lab|simulateText|advanceTasks|canvasAction|DEV ONLY/.test(
      js,
    ),
    `Demo implementation leaked: ${file}`,
  );
}
assert((await stat(root)).isDirectory());
console.log(
  `Verified ${region}: ${htmlFiles.length} static pages, zero-script homepage, SEO/OG/favicon, ${cards.length} real catalog cards, extracted StyleX CSS, ${fontAssets.size} local WOFF2 assets + ${inlineFonts.size} embedded subsets, correct locale/canonical, no Lab routes or demo implementation.`,
);
