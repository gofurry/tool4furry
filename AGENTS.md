# Tool4Furry

V0.3-A: Creative Studio visual foundations over the static site shell, workbench demos and UI/file galleries.

- Read [docs/foundation.md](docs/foundation.md) for boundaries and verified integration decisions.
- `src/pages` + `src/layouts`: Astro SSG, site copy and published routes.
- `src/workbench`: optional slots, responsive layout and panel visibility only.
- `src/ui`: controlled primitives; read [docs/ui-primitives.md](docs/ui-primitives.md). Providers belong in fixed Lab/Tool React roots, never the static SiteLayout.
- FileDropzone delivers File references and metadata validation only; no reads, uploads, object URLs or persistence. Queues belong to callers. See [docs/file-interactions.md](docs/file-interactions.md).
- ScrollDock is opt-in document scrolling, currently only in FilesLab. Never mount it globally or control Canvas/internal panels. Preserve native scrolling.
- `src/tools/registry.ts`: metadata only; `loaders.ts`: separate lazy implementations.
- `src/lab`: development demos; never register them as published tools.
- `src/config/region.ts`: region/domain contract; `src/i18n/messages.ts`: CN/English copy.
- Preserve LICENSE. Work on dev; do not merge main or deploy without a request.
- Use StyleX, with global CSS limited to reset and HTML basics. No old React Babel configuration.
- Read [docs/visual-foundation.md](docs/visual-foundation.md) for font delivery and visual tokens. Use action for primary controls, brand/sage for decoration, independent feedback colors; preserve component APIs and shell layout. Font stacks have one owner in global.css; only normal Fontsource wght.css is loaded.
- No backend, database, SSR adapter, global business store, universal canvas engine or monorepo.
- Keep tool state outside WorkbenchShell; panel visibility and resizing must preserve it.
- Hydrate only directly imported fixed React roots in Astro.
- Verify sequentially: `pnpm check`, `pnpm test`, `pnpm build:cn`, `pnpm build:global`.
- Stop the dev server before production builds: Vite shares its dependency cache.
- See README for browser acceptance paths. Do not claim real-device testing from jsdom.
