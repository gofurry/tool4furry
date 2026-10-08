# Tool4Furry

Foundation V0.1: a static site shell and three development workbench demos.

- Read [docs/foundation.md](docs/foundation.md) for boundaries and verified integration decisions.
- `src/pages` + `src/layouts`: Astro SSG, site copy and published routes.
- `src/workbench`: optional slots, responsive layout and panel visibility only.
- `src/tools/registry.ts`: metadata only; `loaders.ts`: separate lazy implementations.
- `src/lab`: development demos; never register them as published tools.
- `src/config/region.ts`: region/domain contract; `src/i18n/messages.ts`: CN/English copy.
- Preserve LICENSE. Work on dev; do not merge main or deploy without a request.
- Use StyleX, with global CSS limited to reset and HTML basics. No old React Babel configuration.
- No backend, database, SSR adapter, global business store, universal canvas engine or monorepo.
- Keep tool state outside WorkbenchShell; panel visibility and resizing must preserve it.
- Hydrate only directly imported fixed React roots in Astro.
- Verify sequentially: `pnpm check`, `pnpm test`, `pnpm build:cn`, `pnpm build:global`.
- Stop the dev server before production builds: Vite shares its dependency cache.
- See README for browser acceptance paths. Do not claim real-device testing from jsdom.
