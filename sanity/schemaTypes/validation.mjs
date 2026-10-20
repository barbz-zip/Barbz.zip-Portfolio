export const reservedSlugs = ['index', 'about', 'dump', 'read', 'studio', 'admin', '404'];
export function validateProjectSlug(value) {
  const slug = value?.current;
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return 'Use lowercase letters, numbers and hyphens.';
  return !reservedSlugs.includes(slug) || 'This URL is reserved for a site page.';
}
export function validateGalleryRow(value) {
  if (!value || !['single', 'pair'].includes(value.layout)) return 'Choose one or two media items.';
  if (!['landscape', 'portrait', 'original'].includes(value.orientation)) return 'Choose the media orientation.';
  const count = value.layout === 'single' ? 1 : 2;
  return Array.isArray(value.images) && value.images.length === count
    ? true : `This row needs exactly ${count} media item(s).`;
}
