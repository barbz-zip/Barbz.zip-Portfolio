import { dumpImagePresence } from './dump-motion.ts';
import { initPixelWordmark } from './pixel-wordmark.ts';
import { initDumpDescription } from './dump-description.ts';
import { initDumpLightbox } from './dump-lightbox.ts';

export function initDump(page: HTMLElement) {
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const descriptionRoot = page.querySelector<HTMLElement>('[data-dump-description]');
  const description = descriptionRoot ? initDumpDescription(descriptionRoot) : null;
  const cleanupLightbox = initDumpLightbox(page);
  const wordmark = page.querySelector<HTMLElement>('[data-pixel-wordmark]')!;
  const cleanupWordmark = initPixelWordmark(wordmark);
  const cursor = document.querySelector<HTMLElement>('[data-dump-cursor]')!;
  const gridButton = document.querySelector<HTMLButtonElement>('[data-dump-grid]');
  const feed = page.querySelector<HTMLElement>('.dump-feed');
  const nativeTimeline = CSS.supports('animation-timeline: view()') && CSS.supports('view-timeline-name: --dump-image');
  const viewportMetric = page.querySelector<HTMLElement>('.dump-viewport-metric')!;
  const items = [...page.querySelectorAll<HTMLElement>('[data-dump-item]')].map(item => ({
    item, image: item.querySelector<HTMLElement>('[data-dump-image]')!,
    top: 0, height: 0, near: false, initialized: false, scale: .55, brightness: .35,
  }));
  let frame = 0;
  let measureFrame = 0;
  let lastTime = 0;
  let viewportHeight = 0;
  let viewportWidth = 0;
  let maxScroll = 0;
  let grid = false;
  let streamScroll = 0;
  let viewAnimation: Animation | undefined;

  function measure() {
    measureFrame = 0;
    viewportHeight = viewportMetric.getBoundingClientRect().height;
    viewportWidth = document.documentElement.clientWidth;
    maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    const scroll = window.scrollY;
    // Cache layout outside the scroll loop. Image wrappers keep their aspect ratio.
    items.forEach(entry => {
      const rect = entry.item.getBoundingClientRect();
      entry.top = rect.top + scroll;
      entry.height = rect.height;
    });
    page.style.setProperty('--wordmark-scale', `${viewportWidth / 1512}`);
    schedule();
  }

  function render(time: number) {
    frame = 0;
    if (grid) return;
    const scroll = Math.max(0, Math.min(maxScroll, window.scrollY));
    const first = items[0];
    // Fade from the top of the page until the first image reaches the center.
    const fadeDistance = first ? Math.max(1, first.top + first.height / 2 - viewportHeight / 2) : 1;
    const opacity = first ? Math.max(0, 1 - scroll / fadeDistance) : 1;
    wordmark.style.opacity = String(opacity);
    wordmark.style.visibility = opacity === 0 ? 'hidden' : '';
    description?.update(items, scroll, viewportHeight);
    if (nativeTimeline) return;
    const elapsed = lastTime ? Math.min(time - lastTime, 50) : 16;
    lastTime = time;
    const blend = 1 - Math.exp(-elapsed / 45);
    let settling = false;
    for (const entry of items) {
      if (!entry.near && entry.initialized && !reduced.matches) continue;
      const target = reduced.matches ? { scale: 1, brightness: 1 }
        : dumpImagePresence(entry.top - scroll + entry.height / 2, viewportHeight, entry.height);
      if (!entry.initialized || reduced.matches) {
        entry.scale = target.scale;
        entry.brightness = target.brightness;
      } else {
        entry.scale += (target.scale - entry.scale) * blend;
        entry.brightness += (target.brightness - entry.brightness) * blend;
      }
      const moving = Math.abs(target.scale - entry.scale) + Math.abs(target.brightness - entry.brightness) > .001;
      if (!moving) { entry.scale = target.scale; entry.brightness = target.brightness; }
      settling ||= moving;
      entry.image.style.transform = `scale(${entry.scale.toFixed(4)})`;
      entry.image.style.filter = `brightness(${entry.brightness.toFixed(4)})`;
      entry.initialized = true;
    }
    if (settling) frame = requestAnimationFrame(render);
    else lastTime = 0;
  }
  function schedule() {
    if (!grid && !frame) frame = requestAnimationFrame(render);
  }
  gridButton?.addEventListener('click', () => {
    if (!grid) streamScroll = window.scrollY;
    grid = !grid;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(measureFrame);
    frame = measureFrame = lastTime = 0;
    viewAnimation?.cancel();
    hideCursor();
    page.toggleAttribute('data-grid', grid);
    gridButton.setAttribute('aria-pressed', String(grid));
    gridButton.textContent = grid ? 'Scroll View' : 'Grid View';
    // A grid has several images per row, so there is no single centered description.
    description?.update([], 0, viewportHeight);
    items.forEach(entry => {
      entry.initialized = false;
      entry.image.style.transform = '';
      entry.image.style.filter = '';
    });
    measure();
    window.scrollTo({ top: grid ? 0 : Math.min(streamScroll, maxScroll), behavior: 'instant' });
    if (!grid) {
      cancelAnimationFrame(frame);
      render(0);
    }
    if (!reduced.matches) viewAnimation = feed?.animate(
      [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 240, easing: 'ease-out' },
    );
  }, { signal });
  const observer = new IntersectionObserver(entries => {
    for (const observed of entries) {
      const entry = items.find(entry => entry.item === observed.target)!;
      entry.near = observed.isIntersecting;
      entry.item.toggleAttribute('data-near-viewport', entry.near);
    }
    schedule();
  }, { rootMargin: '200px 0px' });
  items.forEach(({ item }) => observer.observe(item));
  // Ignore toolbar-only changes; rotation and real viewport resizes update layout.
  function resize() {
    if (!measureFrame && (document.documentElement.clientWidth !== viewportWidth
      || viewportMetric.getBoundingClientRect().height !== viewportHeight)) {
      measureFrame = requestAnimationFrame(measure);
    }
  }
  function hideCursor() { delete cursor.dataset.visible; }
  document.addEventListener('pointermove', event => {
    if (grid || event.pointerType !== 'mouse' || (event.target as Element).closest('a, button, [data-dump-description]')) { hideCursor(); return; }
    const x = Math.max(8, Math.min(event.clientX + 16, innerWidth - cursor.offsetWidth - 12));
    const y = Math.max(8, Math.min(event.clientY + 16, innerHeight - cursor.offsetHeight - 12));
    const clearance = 32;
    // Keep both the pointer and its label clear of navigation controls.
    const nearControl = [...document.querySelectorAll<HTMLElement>('.menu, a, button, [data-dump-description]')].some(control => {
      if (control.closest('[inert]')) return false;
      const rect = control.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > innerHeight) return false;
      const pointerNear = event.clientX >= rect.left - clearance && event.clientX <= rect.right + clearance
        && event.clientY >= rect.top - clearance && event.clientY <= rect.bottom + clearance;
      const labelNear = x + cursor.offsetWidth >= rect.left - clearance && x <= rect.right + clearance
        && y + cursor.offsetHeight >= rect.top - clearance && y <= rect.bottom + clearance;
      return pointerNear || labelNear;
    });
    if (nearControl) { hideCursor(); return; }
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    cursor.dataset.visible = 'true';
  }, { signal });
  document.documentElement.addEventListener('pointerleave', hideCursor, { signal });
  window.addEventListener('blur', hideCursor, { signal });
  document.addEventListener('visibilitychange', hideCursor, { signal });
  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', resize, { passive: true, signal });
  reduced.addEventListener('change', schedule, { signal });
  measure();
  return () => {
    controller.abort();
    cancelAnimationFrame(frame);
    cancelAnimationFrame(measureFrame);
    viewAnimation?.cancel();
    observer.disconnect();
    cleanupWordmark();
    description?.destroy();
    cleanupLightbox();
  };
}
