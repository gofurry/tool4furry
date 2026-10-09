# Tool4Furry

V0.3-C: static branded homepage, honest tool discovery and regional SEO; V0.3-B workbench boundaries remain intact.

- Read [docs/foundation.md](docs/foundation.md) for boundaries and verified integration decisions.
- `src/pages` + `src/layouts`: Astro SSG, site copy and published routes.
- Read [docs/site-homepage.md](docs/site-homepage.md) for the V0.3-C contract and acceptance. Keep the homepage script/Island/JS-preload free. `section#tools` always exists; only current-region published registry entries enable cards and the hero CTA. No placeholder tools in the production registry.
- Site header/footer and ToolPageFrame share `public/brand/tool4furry-mark.svg`; it is a replaceable geometric placeholder and the SVG favicon. Static decorative artwork stays local. `SiteLayout.fullTitle` overrides the default brand suffix only when supplied.
- `src/workbench`: optional slots, responsive layout and panel visibility only.
- Read [docs/workbench-appearance.md](docs/workbench-appearance.md) for the V0.3-B contract and verification. `ToolPageFrame` owns product entry/identity; Shell header is tool-local. Registry stays metadata-only and empty until real tools are published.
- Canvas viewport geometry is independent of overlays; empty overlay layers use pointer-events:none. Inspector defaults closed; keep one stable Portal/parameter tree across the shared <=900px breakpoint. Form/Batch remain in document flow.
- `src/ui`: controlled primitives; read [docs/ui-primitives.md](docs/ui-primitives.md). Providers belong in fixed Lab/Tool React roots, never the static SiteLayout.
- FileDropzone delivers File references and metadata validation only; no reads, uploads, object URLs or persistence. Queues belong to callers. See [docs/file-interactions.md](docs/file-interactions.md).
- ScrollDock is opt-in document scrolling, currently only in FilesLab. Never mount it globally or control Canvas/internal panels. Preserve native scrolling.
- `src/tools/registry.ts`: metadata only; `loaders.ts`: separate lazy implementations.
- `src/lab`: development demos; never register them as published tools.
- `src/config/region.ts`: region/domain contract; `src/i18n/messages.ts`: CN/English copy.
- Preserve LICENSE. Work on dev; do not merge main or deploy without a request.
- Use StyleX, with global CSS limited to reset and HTML basics. No old React Babel configuration.
- Read [docs/visual-foundation.md](docs/visual-foundation.md) for font delivery and visual tokens. Use action for primary controls, brand/sage for decoration, independent feedback colors; preserve primitive APIs. Font stacks have one owner in global.css; only normal Fontsource wght.css is loaded.
- No backend, database, SSR adapter, global business store, universal canvas engine or monorepo.
- Keep tool state outside WorkbenchShell; panel visibility and resizing must preserve it.
- Hydrate only directly imported fixed React roots in Astro.
- Verify sequentially: `pnpm check`, `pnpm test`, `pnpm build:cn`, `pnpm build:global`.
- Stop the dev server before production builds: Vite shares its dependency cache.
- See README for browser acceptance paths. Do not claim real-device testing from jsdom.
