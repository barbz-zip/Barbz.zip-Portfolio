import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://barbz-zip.github.io',
  base: process.env.GITHUB_PAGES === 'true' ? '/Barbz.zip-Portfolio' : '/',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
