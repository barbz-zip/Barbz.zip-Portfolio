const base = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');

export function sitePath(path: string) {
  return `${base}/${path.replace(/^\//, '')}`;
}

export function localPath(path: string) {
  if (base && (path === base || path.startsWith(`${base}/`))) return path.slice(base.length) || '/';
  return path;
}
