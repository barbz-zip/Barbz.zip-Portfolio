import { googleFontFamily } from './google-fonts.mjs';
import { advanceAxis, pickFont } from './wordmark-motion.ts';
import { createWordmarkFontLoader, type LoadedWordmarkFont } from './wordmark-fonts';

const INITIAL_FONT = 'IBM Plex Mono';
const SPEED = 150; // Constant diagonal speed in CSS pixels per second.

export function initBouncingWordmark(stage: HTMLElement) {
  const controller = new AbortController();
  const { signal } = controller;
  const wordmark = stage.querySelector<SVGSVGElement>('[data-wordmark]')!;
  const text = stage.querySelector<SVGTextElement>('[data-wordmark-text]')!;
  const metricsContext = document.createElement('canvas').getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const links: unknown = JSON.parse(stage.dataset.fonts || '[]');
  const families = [...new Set((Array.isArray(links) ? links : []).map(googleFontFamily).filter((family): family is string => Boolean(family)))];
  const loader = createWordmarkFontLoader(text.textContent || 'barbz.zip', signal);
  const failed = new Set<string>();
  let current = INITIAL_FONT;
  let ready: LoadedWordmarkFont | null = null;
  let preparing = false;
  let x = 0, y = 0, maxX = 0, maxY = 0;
  let vx = SPEED / Math.SQRT2, vy = -SPEED / Math.SQRT2;
  let initialized = false;
  let frame = 0, lastTime = 0;

  function paint() { wordmark.style.transform = `translate3d(${x}px, ${y}px, 0)`; }

  function measure() {
    let bounds = text.getBBox();
    // Use visible glyph bounds, not the font's line box: the letters themselves
    // should reach the wall even in scripts with unusually tall ascenders.
    if (metricsContext) {
      const style = getComputedStyle(text);
      metricsContext.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const metrics = metricsContext.measureText(text.textContent || 'barbz.zip');
      const width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
      const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      if (width > 0 && height > 0) bounds = new DOMRect(-metrics.actualBoundingBoxLeft, 80 - metrics.actualBoundingBoxAscent, width, height);
    }
    if (!bounds.width || !bounds.height) return;
    const width = stage.clientWidth, height = stage.clientHeight;
    const scale = Math.min(1, Math.max(1, width - 16) / bounds.width, Math.max(1, height - 16) / bounds.height);
    wordmark.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
    wordmark.setAttribute('width', String(bounds.width * scale));
    wordmark.setAttribute('height', String(bounds.height * scale));
    maxX = Math.max(0, width - bounds.width * scale);
    maxY = Math.max(0, height - bounds.height * scale);
    if (!initialized) {
      x = Math.min(maxX, width * 0.115); y = Math.min(maxY, height * 0.755);
      initialized = true;
    } else {
      x = Math.max(0, Math.min(maxX, x)); y = Math.max(0, Math.min(maxY, y));
    }
    if (x === 0) vx = Math.abs(vx); else if (x === maxX) vx = -Math.abs(vx);
    if (y === 0) vy = Math.abs(vy); else if (y === maxY) vy = -Math.abs(vy);
    paint();
  }

  async function prepareNext() {
    if (preparing || ready || reduced.matches || document.hidden || signal.aborted) return;
    preparing = true;
    // Bound retries so a broken/offline catalog never produces a request storm.
    for (let attempt = 0; attempt < 3 && !signal.aborted; attempt++) {
      const family = pickFont(families.filter(value => !failed.has(value)), current);
      if (!family) break;
      const font = await loader.load(family);
      if (signal.aborted) break;
      if (font) {
        if (family === current) continue;
        ready = font; loader.trim([current, family]); break;
      }
      failed.add(family);
    }
    preparing = false;
  }

  function changeFont(hitX: boolean, hitY: boolean) {
    // Near a corner two walls can be reached before a network request finishes.
    // Reuse a different loaded font in that case, without pausing the motion.
    const next = ready ?? loader.alternate(current, families);
    if (next) {
      current = next.family;
      text.style.fontFamily = `"${next.cssFamily}"`;
      stage.dataset.font = current;
      ready = null;
      measure();
      // Keep the newly measured word anchored to the wall that was touched.
      if (hitX) x = vx > 0 ? 0 : maxX;
      if (hitY) y = vy > 0 ? 0 : maxY;
      paint();
    }
    void prepareNext();
  }

  function animate(time: number) {
    const dt = Math.min((time - (lastTime || time)) / 1000, 0.05);
    lastTime = time;
    const horizontal = advanceAxis(x, vx, dt, maxX);
    const vertical = advanceAxis(y, vy, dt, maxY);
    x = horizontal.position; vx = horizontal.velocity;
    y = vertical.position; vy = vertical.velocity;
    if (horizontal.hit || vertical.hit) changeFont(horizontal.hit, vertical.hit);
    paint();
    frame = requestAnimationFrame(animate);
  }

  function resume() {
    cancelAnimationFrame(frame); lastTime = 0;
    if (!document.hidden && !reduced.matches) { frame = requestAnimationFrame(animate); void prepareNext(); }
  }

  const observer = new ResizeObserver(measure);
  observer.observe(stage);
  window.addEventListener('resize', measure, { signal });
  reduced.addEventListener('change', resume, { signal });
  document.addEventListener('visibilitychange', resume, { signal });
  measure();
  // Use the Figma typeface initially; the catalog takes over only on collision.
  void loader.load(INITIAL_FONT).then(font => {
    if (signal.aborted) return;
    if (font && current === INITIAL_FONT) {
      text.style.fontFamily = `"${font.cssFamily}"`; stage.dataset.font = INITIAL_FONT; measure();
    }
  });
  resume();
  return () => { controller.abort(); cancelAnimationFrame(frame); observer.disconnect(); loader.dispose(); };
}
