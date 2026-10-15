import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://barbz-zip.github.io',
  base: process.env.GITHUB_PAGES === 'true' ? '/Barbz.zip-Portfolio' : '/',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  // Separate previews and builds so one process cannot invalidate another's modules.
  vite: { cacheDir: `node_modules/.vite/barbz-zip-${process.env.BARBZ_ZIP_PREVIEW || 'build'}` },
});
