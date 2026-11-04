const base = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');
export const PROJECT_INDEX_PATH = '/projects/';

export function sitePath(path: string) {
  return `${base}/${path.replace(/^\//, '')}`;
}

export function localPath(path: string) {
  if (base && (path === base || path.startsWith(`${base}/`))) return path.slice(base.length) || '/';
  return path;
}

export function isProjectIndexPath(path: string) {
  const local = localPath(path).replace(/\/$/, '');
  return local === '/projects' || local === '/index';
}

export function projectReturnPath(path: unknown) {
  return sitePath(typeof path === 'string' && isProjectIndexPath(path) ? PROJECT_INDEX_PATH : '/');
}
