# barbz-zip — technical review

Historical local review dated October 15, 2026. Scope: routes, components, interaction scripts, styles, local content, CMS schemas, tests, configuration and deployment. No commit or deployment was performed during this review. The findings below describe the project at that date.

## Applied fixes

### Images oversized for their display dimensions

The five Home covers totaled 8.85 MB. The dark Dump icon was 3550 × 4096 px and 8.21 MB despite appearing inside a 34 px button. Browsers can also request images hidden by CSS.

`src/components/PortfolioImage.astro` now generates WebP images and `srcset` at build time for covers, popups, project pages, the portrait and the Dump icon. Original files and CSS crops were preserved. Available resolution never exceeds the original. Elements receive intrinsic width and height, including future original-proportion blocks, reducing layout shifts during loading.

Comparison of generated files for five covers at 960 px and the icon at 160 px — variants selected on a desktop with 2× pixel density:

| Assets | Before | After |
| --- | ---: | ---: |
| Five covers | 8,850,050 bytes | 336,708 bytes |
| Dump icon | 8,214,498 bytes | 2,776 bytes |
| Total | 17,064,548 bytes | 339,484 bytes |

Approximately 98% smaller for this asset set. This is not a full page-load measurement: HTML, CSS, JavaScript, fonts, other images and browser caching are excluded. Some source formats do not match their `.png` extensions; the processor reads the actual metadata.

### Gallery scheduling frames while idle

`src/lib/gallery.ts` previously kept a continuous `requestAnimationFrame` loop during hover pauses, open dialogs and reduced-motion preferences. It now schedules frames only during autoplay or while motion settles. Scrolling, dragging, keyboard input, leaving hover and closing the dialog resume processing. The resume timer is cancelled when leaving the page or hiding the tab.

Three regression tests cover dialog pauses, reduced motion with manual scrolling and immediate resume after hover. Existing touch tests continue to pass.

### Development environment

The earlier cache-conflict fix was preserved: local preview, mobile preview and builds have separate Vite directories. The README documents `pnpm dev:mobile` and image processing.

## Priority follow-ups

### 1. Dependencies with security advisories — high priority

`pnpm audit --json` reported 10 advisories: 1 critical, 4 high, 3 moderate and 2 low. Installed dependencies: Astro 6.4.8, Sharp 0.34.5, esbuild 0.27.7 and http-cache-semantics 4.2.0.

| Package | Finding and fixed version reported by the audit |
| --- | --- |
| Astro | [Malicious AVIF processing](https://github.com/advisories/GHSA-26w7-cxv4-gfx2): fixed in 7.2.8. Additional advisories concern attribute interpolation/transitions and base-path boundaries. |
| Sharp | [librsvg](https://github.com/advisories/GHSA-wq5f-xc86-pv6w): fixed in 0.35.5; other advisories concern libvips/libheif. |
| esbuild | [File reads through the Windows development server](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr): fixed in 0.28.1. |
| http-cache-semantics | [Cached responses shared between users](https://github.com/advisories/GHSA-ch52-4w7c-c8xp): fixed in 4.3.0. |

Context at the time of review: deployment was static, with no Astro server processing production uploads. Images were local, with no upload form or active CMS integration. According to the maintainer, the critical advisory depends on processing untrusted AVIF files. This limits the exposure at that stage but does not remove the need to update the development/build environment before accepting new image workflows.

Versions were not upgraded in this review. Resolving every advisory requires migrating Astro 6 to 7 and validating transitive dependencies, the image pipeline and ClientRouter. Next steps: follow the [official migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/), update the lockfile, rerun the audit and test routes and transitions in Safari on a physical device.

### 2. Large primary font

`src/assets/abc-diatype-mono-trial.ttf` is 799,908 bytes and preloaded on every route. After cover optimization, it becomes a significant initial-load resource. Prepare the final WOFF2 version and consider subsetting required characters while preserving interface symbols. The current file identifies itself as a trial; confirm the final font file before the final release.

### 3. Incomplete CMS integration

At the time of review, Sanity had project and typography schemas but no connected client, dataset, webhook or adapter. About and Dump still used local content; Dump intentionally duplicated four entries for navigation testing. CMS work should add the Dump model and descriptions, About content, reserved-slug validation (`index`, `about`, `dump`) and asset dimensions. The image component accepts local files; the remote adapter will need responsive URLs and dimensions from the Sanity CDN.

### 4. Publication content and metadata

The About placeholder copy still referred to another professional. Some case studies had temporary text and empty credits; Contact, Read and Grid View were unavailable at that stage. The layout shared a generic SEO description without project-specific social metadata. Replace placeholders with final content without inventing personal details or destinations.

### 5. Monitor Dump interaction costs

The Dump cursor queries controls and measures their bounds on every `pointermove`; pixelation updates SVG attributes on multiple cells. At the time of review, the feed had eight entries, and the pixel effect was prepared only after mouse hover, reducing mobile impact. If the feed grows or controls are added, batch cursor measurements per frame and update only changed cells. No FPS measurement on a physical device was performed during this review; this is a code-level optimization opportunity, not a demonstrated regression.

## Verification

- 22 tests passed, including dragging, touch, looping, fonts, descriptions and the Dump scroll fallback.
- `pnpm check`: no errors, warnings or hints.
- Static build with `GITHUB_PAGES=true`: nine routes generated.
- Build image paths and `srcset` checked with the GitHub Pages prefix: no missing files.
- Local browser: moving gallery, loaded covers, keyboard opening, case navigation, media expansion, Index → project → Index return flow and Home at 390 × 844.
- Mobile validation used a browser viewport; it does not replace testing on a physical iPhone 15 with Safari.
- `git diff --check`: no whitespace errors.

Earlier local work was preserved. This review did not connect services, publish content or change the requested visual behavior.
