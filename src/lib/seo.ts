/** Resolve a route relative to the configured public site root, including subfolder hosting. */
export function canonicalUrl(siteUrl: string, route: string) {
  const base = new URL(siteUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('Invalid public site URL.');
  base.pathname = `${base.pathname.replace(/\/$/, '')}/`;
  return new URL(route.replace(/^\/+/, ''), base).href;
}
