// Shared by the front-end loader and the Sanity URL validation.
export function googleFontFamily(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    let family;
    if (url.hostname === 'fonts.google.com' && /^\/specimen\/[^/]+\/?$/.test(url.pathname)) {
      family = decodeURIComponent(url.pathname.split('/')[2].replaceAll('+', ' '));
    } else if (url.hostname === 'fonts.googleapis.com' && ['/css', '/css2'].includes(url.pathname)) {
      if (url.searchParams.getAll('family').length !== 1) return null;
      family = url.searchParams.get('family')?.split(':')[0];
    }
    if (!family || !/^[\p{L}\p{N}][\p{L}\p{N} -]*$/u.test(family)) return null;
    // Google's specimen display name differs from its CSS API family name.
    // https://github.com/google/fonts/issues/6449
    return family.trim() === 'Playwrite England SemiJoined' ? 'Playwrite GB S' : family.trim();
  } catch { return null; }
}

export function googleFontStylesheet(family, text) {
  const url = new URL('https://fonts.googleapis.com/css2');
  url.searchParams.set('family', family);
  url.searchParams.set('text', text);
  url.searchParams.set('display', 'swap');
  return url.href;
}

export function validateFontLinks(values) {
  if (!Array.isArray(values) || !values.length) return 'Add at least one Google Fonts link.';
  const families = values.map(googleFontFamily);
  if (families.some(family => !family)) return 'Use a Google Fonts specimen link or a CSS link containing one family.';
  if (new Set(families).size !== families.length) return 'Each font family should appear only once.';
  return true;
}
