// Production-shaped test assembly only. Does not promote the on-disk draft.
import assert from 'node:assert/strict';
import { build } from 'astro';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const region = process.argv[2] ?? 'cn';
assert(['cn', 'global'].includes(region));
process.env.SITE_REGION = region;
process.env.NODE_ENV = 'production';
const root = process.cwd();
const output = `../.validation/converter-v04b/ssg/${region}`;
const normalize = (path) => path.replaceAll('\\', '/');
const definition = normalize(
  resolve('src/tools/image-converter/definition.ts'),
);
const loaders = normalize(resolve('src/tools/loaders.ts'));
const implementation = normalize(
  resolve('src/tools/image-converter/ImageConverter.tsx'),
);
const before = await Promise.all(
  [definition, loaders].map((path) => readFile(path, 'utf8')),
);
await build({
  root: pathToFileURL(root + '/'),
  outDir: output,
  vite: {
    plugins: [
      {
        name: 'test-only-converter-publication',
        enforce: 'pre',
        async load(id) {
          const path = normalize(id.split('?')[0]);
          if (path === definition) {
            const original = await readFile(path, 'utf8');
            assert(/status:\s*'draft'/.test(original));
            return original.replace(/status:\s*'draft'/, "status: 'published'");
          }
          if (path === loaders)
            return `export const toolLoaders = {'image-converter': () => import(${JSON.stringify(implementation)})};`;
        },
      },
    ],
  },
});
assert.deepEqual(
  await Promise.all(
    [definition, loaders].map((path) => readFile(path, 'utf8')),
  ),
  before,
);
const outDir = resolve(root, output);
const files = (await readdir(outDir, { recursive: true })).map(normalize);
assert(files.includes('tools/image-converter/index.html'));
for (const file of files.filter((file) => file.endsWith('.js'))) {
  const js = await readFile(resolve(outDir, file), 'utf8');
  assert(
    !js.includes('PNG 转 JPEG 后透明背景去哪了？') &&
      !js.includes('What happens to transparency when converting PNG to JPEG?'),
    'Long Astro FAQ leaked into JS',
  );
}
const check = spawnSync(
  process.execPath,
  ['scripts/verify-build.mjs', region, outDir],
  { stdio: 'inherit' },
);
assert.equal(check.status, 0, 'Converter static contract failed');
await writeFile(
  resolve(outDir, 'FIXTURE-ONLY.txt'),
  'Isolated test assembly. Draft release gates have NOT passed. Never deploy.\n',
);
console.log(
  `Converter SSG assembly passed: ${outDir}; on-disk draft unchanged.`,
);
process.exit(0);
