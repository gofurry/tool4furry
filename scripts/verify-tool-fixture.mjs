// Isolated production-mode integration test. Never mutates the on-disk registry/config.
import { build } from 'astro';
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const region = process.argv[2] ?? 'cn';
assert(['cn', 'global'].includes(region));
process.env.SITE_REGION = region;
process.env.NODE_ENV = 'production';
const root = process.cwd();
const outDir = resolve(root, '../.validation/platform-v04a', region);
const normalize = (path) => path.replaceAll('\\', '/');
const registryPath = normalize(resolve('src/tools/registry.ts'));
const contentPath = normalize(resolve('src/site/tool-content.ts'));
const loadersPath = normalize(resolve('src/tools/loaders.ts'));
const publicationPath = normalize(resolve('tests/fixtures/publication.ts'));
const contentFixturePath = normalize(resolve('tests/fixtures/content.ts'));
const fixtureToolPath = normalize(resolve('tests/fixtures/FixtureTool.tsx'));
const before = await readFile(registryPath, 'utf8');
await build({
  root: pathToFileURL(root + '/'),
  outDir: `../.validation/platform-v04a/${region}`,
  vite: {
    plugins: [
      {
        name: 'test-only-publication-fixtures',
        enforce: 'pre',
        async load(id) {
          const path = normalize(id.split('?')[0]);
          if (path === registryPath) {
            const original = await readFile(path, 'utf8');
            const target =
              /export const tools: readonly ToolDefinition\[\] = [\s\S]*?;\r?\n/;
            assert(target.test(original), 'Registry test seam changed');
            return (
              `import { publicationFixtures } from ${JSON.stringify(publicationPath)};\n` +
              original.replace(
                target,
                'export const tools: readonly ToolDefinition[] = publicationFixtures;\n',
              )
            );
          }
          if (path === contentPath) {
            const original = await readFile(path, 'utf8');
            const target =
              /export const toolPageContents: ToolContentMap = [\s\S]*?;\r?\n/;
            assert(target.test(original), 'Content test seam changed');
            return (
              `import { fixtureContents } from ${JSON.stringify(contentFixturePath)};\n` +
              original.replace(
                target,
                'export const toolPageContents: ToolContentMap = fixtureContents;\n',
              )
            );
          }
          if (path === loadersPath)
            return `import { publicationFixtures } from ${JSON.stringify(publicationPath)}; export const toolLoaders = Object.fromEntries(publicationFixtures.map(tool => [tool.id, () => import(${JSON.stringify(fixtureToolPath)})]));`;
        },
      },
    ],
  },
});
assert.equal(
  await readFile(registryPath, 'utf8'),
  before,
  'Registry must remain untouched',
);
const files = (await readdir(outDir, { recursive: true })).map(normalize);
for (const file of files.filter((file) => file.endsWith('.js'))) {
  const source = await readFile(resolve(outDir, file), 'utf8');
  assert(
    !source.includes('STATIC_GUIDE_ONLY_'),
    'Astro-only guide leaked into client JS',
  );
}
assert(
  files.includes(
    `tools/${region === 'cn' ? 'cn-only' : 'global-only'}/index.html`,
  ),
);
assert(
  !files.some(
    (file) =>
      file.includes('draft-only') ||
      file.includes(region === 'cn' ? 'tools/global-only/' : 'tools/cn-only/'),
  ),
);
const check = spawnSync(
  process.execPath,
  ['scripts/verify-build.mjs', region, outDir, '--fixture'],
  { stdio: 'inherit' },
);
assert.equal(check.status, 0, 'Fixture static contract failed');
await writeFile(
  resolve(outDir, 'FIXTURE-ONLY.txt'),
  'Test output only. Never deploy or copy into production dist.\n',
);
console.log(
  `Fixture integration passed: ${outDir}. Production registry is unchanged.`,
);
// All awaited checks are done; Astro's programmatic compiler workers may remain alive.
process.exit(0);
