# barbz-zip — Sanity Studio

Standalone Studio for **BARBARA → Barbz.zip Portfolio** only.

- Project: `uc4d6vam`
- Dataset: `production` (public portfolio content)
- Studio: https://barbz-zip.sanity.studio/
- Local Studio: `pnpm studio` → http://localhost:3333

## Content structure

- **HOME**: site title / animated text, bottom-center text, Google Fonts URLs, contact email and external Read link. The contact button copies the email. Empty contact/Read fields disable those actions. The font loader fetches only the text glyphs, prepares the next font and keeps a bounded cache.
- **PROJECTS**: shared Home/Index list, title, URL, year, attributes and cover. Projects are sorted by year, newest first, then alphabetically within each year. Project pages contain services, paragraphs, credits and reorderable gallery rows. Each row accepts one media item or two side by side, in original, portrait or landscape proportions. Images and MP4/WebM files can be combined; videos autoplay muted, loop, play inline and have no controls. Posters are supported.
- **ABOUT**: portrait with alternative text, name, caption, biography paragraphs, editable section headings, recognitions and press links.
- **DUMP**: independently editable images, alternative text, title, description and display order. Scroll and Grid views use the same documents. New images retain their dimensions and transparency.

HOME, ABOUT and SETTINGS are singletons. Their documents cannot be duplicated or deleted from the Studio. Projects sort by four-digit year descending, then title and document ID. The legacy project order field is hidden and no longer used; Dump keeps its numeric order field. Project slugs are unique and cannot overlap site routes. Upload multiple files into a gallery row, then choose its one/two arrangement; publishing validates the number of files. Reorder rows and media by dragging.

- **SETTINGS**: favicon, sharing title/text/image, optional Home SEO title, site description, public URL for canonical links and site-wide noindex. Open Graph and Twitter metadata are rendered in the HTML. The share image is exported as 1200 × 630 JPEG and the favicon as 64 × 64 PNG. Empty sharing fields use the page title and SEO description.

## Development

From the repository root:

```sh
pnpm install
pnpm studio
pnpm studio:check
pnpm studio:build
pnpm studio:deploy
```

The Studio has its own TypeScript configuration and dependencies. Its bundle is deployed independently of the Astro site. The CLI configuration pins the BARBARA project/dataset and deployed Studio app ID. No write token belongs in the frontend or repository.

## Initial import

`pnpm --dir sanity seed` uses the logged-in Sanity CLI account. It uploads the existing local portfolio assets and creates only missing documents, refusing any project/dataset other than BARBARA. It never overwrites existing documents. The eight Dump entries preserve the duplicated navigation examples and can now be edited or deleted independently. Initial About copy and incomplete case studies remain the prototype content and should be revised editorially in the Studio.

## Frontend data flow

Copy `.env.example` to `.env`. `SANITY_CONTENT=sanity` fetches published content from the public Content Lake API using the official Sanity client. No token is required. `SANITY_CONTENT=local` uses the original fixtures for offline development. Drafts are not exposed to the public frontend.

Local Astro requests read the latest published content when the page is refreshed. GitHub Pages is static: a CMS publication is included in the next site build, not in an already-deployed HTML file. The workflow reads Sanity content; run **Actions → barbz-zip — GitHub Pages → Run workflow** after publishing. Automatic rebuilds from a Sanity webhook are not configured. Do not send a GitHub token from the browser or put one in a Sanity document.

## Validation

`pnpm check`, `pnpm test` and `pnpm build` validate the frontend. `pnpm studio:check`, `pnpm studio:build` and `pnpm --dir sanity exec sanity schemas validate` validate the Studio. Use `pnpm --dir sanity exec sanity documents validate --workspace barbz-zip --yes` to validate remote documents before deployment.
