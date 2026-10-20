# barbz-zip

## Development

Built with Astro, TypeScript and CSS. Runtime: Node.js 24 and pnpm 11.25.0.

```sh
pnpm install
cp .env.example .env # Published Sanity content
pnpm dev
pnpm dev:mobile # Local network preview on port 4322
```

Local server: http://127.0.0.1:4321.

```sh
pnpm check   # Type checking
pnpm test    # Tests
pnpm build   # Production build
pnpm preview # Local build preview
pnpm studio  # Local Studio at localhost:3333
pnpm studio:check
pnpm studio:build
pnpm studio:deploy
```

`pnpm-lock.yaml` keeps dependency versions reproducible. Local previews, mobile previews and builds use separate Vite caches so they can run simultaneously.

To validate the build with the GitHub Pages path prefix:

```sh
GITHUB_PAGES=true pnpm build
GITHUB_PAGES=true pnpm preview
```

## Structure

- `src/pages/`: Home, Index, About, Dump and project routes in `[slug].astro`.
- `src/layouts/Layout.astro`: shared layout, metadata, typography and page transitions.
- `src/components/`: header, gallery, covers, cards and project dialog.
- `src/components/PortfolioImage.astro`: local image variants generated at build time and responsive images served by the Sanity CDN.
- `src/data/`: content and settings contracts and adapters; `SANITY_CONTENT=sanity` reads the CMS and `local` uses fixtures.
- `src/components/BouncingWordmark.astro` and `src/lib/bouncing-wordmark.ts`: Home background text, diagonal motion, collisions and dynamic typography.
- `src/data/home-fonts.mjs` and `src/data/home-typography.ts`: initial catalog of 160 Google Fonts URLs and the CMS typography contract.
- `src/lib/wordmark-fonts.ts`: on-demand loading with character subsetting, next-font preparation and a bounded cache.
- `src/lib/gallery.ts`: infinite slider, 50 px/s autoplay, dragging and scrolling; autoplay resumes without an additional delay after hover or scrolling.
- `src/lib/gallery-math.ts`: loop normalization and gallery copy calculations.
- `src/pages/dump.astro` and `src/lib/dump.ts`: image feed, scroll depth and centered-image description; native CSS animation with a JavaScript fallback.
- `src/lib/project-dialog.ts`: popup opening/closing and the cursor-following label.
- `src/lib/project-index.ts`: list interactions and cover previews next to the cursor.
- `src/lib/project-return.ts`: returns to Home or Index according to the navigation origin.
- `src/lib/case-study.ts`: project-page media expansion.
- `src/lib/menu.ts`: menu indicator motion.
- `src/lib/site.ts`: interaction initialization and cleanup with Astro ClientRouter.
- `src/lib/paths.ts`: route and image paths compatible with the deployment prefix.
- `src/styles/global.css`: styles, responsive layouts and transitions.
- `src/assets/`: fonts processed by Astro.
- `public/images/`: local images.
- `sanity/schemaTypes/index.ts`: Studio schemas for HOME, PROJECTS, ABOUT, DUMP and SETTINGS, including rows of one or two images/videos.
- `src/lib/cms/`: public client, queries and image/video adapters for the BARBARA project (`uc4d6vam`).
- `sanity/sanity.config.ts`: Studio structure; instructions in `sanity/README.md`.
- `tests/`: gallery, CMS, media and project-page tests.
- `astro.config.mjs`: Astro configuration and deployment prefix.
- `.github/workflows/deploy.yml`: validation, tests, build and deployment of `main` to GitHub Pages.

GitHub Pages uses static generation. After publishing content in the Studio, rerun the deployment workflow to update the public site. The CMS integration does not require tokens in the browser.
