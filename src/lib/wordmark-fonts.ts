import { googleFontStylesheet } from './google-fonts.mjs';

export interface LoadedWordmarkFont { family: string; cssFamily: string; face: FontFace }

/** Only called for the current font and the next collision candidate. */
export function createWordmarkFontLoader(text: string, signal: AbortSignal) {
  const cache = new Map<string, LoadedWordmarkFont>();
  let serial = 0;

  async function load(family: string): Promise<LoadedWordmarkFont | null> {
    const cached = cache.get(family);
    if (cached) { cache.delete(family); cache.set(family, cached); return cached; }
    const request = new AbortController();
    const abort = () => request.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timeout = window.setTimeout(abort, 8000);
    try {
      if (signal.aborted) return null;
      const css = await fetch(googleFontStylesheet(family, text), { signal: request.signal });
      if (!css.ok) return null;
      const source = (await css.text()).match(/src:\s*url\(\s*['"]?([^)'"\s]+)/)?.[1];
      if (!source) return null;
      const url = new URL(source);
      if (url.protocol !== 'https:' || url.hostname !== 'fonts.gstatic.com') return null;
      const response = await fetch(url, { signal: request.signal });
      if (!response.ok) return null;
      const cssFamily = `barbz-zip-wordmark-${serial++}`;
      const face = new FontFace(cssFamily, await response.arrayBuffer(), { weight: '400', style: 'normal' });
      await face.load();
      if (signal.aborted || request.signal.aborted) return null;
      document.fonts.add(face);
      const font = { family, cssFamily, face };
      cache.set(family, font);
      return font;
    } catch { return null; }
    finally { clearTimeout(timeout); signal.removeEventListener('abort', abort); }
  }

  function trim(protectedFamilies: string[]) {
    for (const [family, font] of cache) {
      if (cache.size <= 8) break;
      if (!protectedFamilies.includes(family)) { document.fonts.delete(font.face); cache.delete(family); }
    }
  }

  function dispose() {
    cache.forEach(font => document.fonts.delete(font.face));
    cache.clear();
  }

  function alternate(current: string, allowed: string[]) {
    const choices = [...cache.values()].filter(font => font.family !== current && allowed.includes(font.family));
    return choices.length ? choices[Math.floor(Math.random() * choices.length)] : null;
  }

  return { load, trim, alternate, dispose };
}
