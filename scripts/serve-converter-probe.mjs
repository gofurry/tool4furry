// Isolated browser verification server; never a production route or dependency.
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve('astro/package.json'));
const { createServer } = await import(
  pathToFileURL(astroRequire.resolve('vite'))
);
const server = await createServer({
  configFile: false,
  root: process.cwd(),
  cacheDir: '../.validation/converter-v04b/core-cache',
  server: {
    host: '127.0.0.1',
    port: 4388,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] },
  },
  plugins: [
    {
      name: 'local-optional-samples',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const name = req.url?.replace('/external-samples/', '');
          if (
            !req.url?.startsWith('/external-samples/') ||
            ![
              'budget-4000.png',
              'edge-8192.png',
              'noise-4000.jpg',
              'wild-cherry.jpg',
            ].includes(name)
          )
            return next();
          try {
            res.setHeader(
              'Content-Type',
              name.endsWith('.png') ? 'image/png' : 'image/jpeg',
            );
            res.end(
              await readFile(
                resolve('../.validation/converter-v04b/samples', name),
              ),
            );
          } catch {
            res.statusCode = 404;
            res.end('Generate/download optional local samples first.');
          }
        });
      },
    },
  ],
});
await server.listen();
console.log(
  'Test-only core probe: http://127.0.0.1:4388/scripts/spikes/converter-core.html',
);
