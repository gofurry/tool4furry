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
for (const page of htmlFiles) {
  const content = await readFile(resolve(root, page), 'utf8');
  assert(!content.includes('virtual:stylex'), `Dev StyleX runtime in ${page}`);
  const dom = new JSDOM(content).window.document;
  const stylesheets = [...dom.querySelectorAll('link[rel="stylesheet"]')];
  assert(stylesheets.length > 0, `Missing extracted CSS in ${page}`);
  for (const link of stylesheets) {
    const path = link.getAttribute('href');
    assert(
      path?.startsWith('/_astro/'),
      'CSS must use portable static asset paths',
    );
    const css = await readFile(resolve(root, path.slice(1)), 'utf8');
    assert(
      css.includes('@layer priority') && css.includes('--'),
      'StyleX styles and tokens must be extracted',
    );
  }
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
  `Verified ${region}: ${htmlFiles.length} static pages, extracted StyleX CSS, correct locale/canonical, no Lab routes or demo implementation.`,
);
