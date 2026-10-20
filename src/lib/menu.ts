import { localPath, sitePath } from './paths';

export function initMenu(menu: HTMLElement) {
  const controller = new AbortController();
  const { signal } = controller;
  // Prevent native link/image ghosts without interfering with clicks or focus.
  menu.closest('header')?.addEventListener('dragstart', event => event.preventDefault(), { signal });
  const indicator = menu.querySelector<HTMLElement>('.menu-indicator')!;
  const items = [...menu.querySelectorAll<HTMLElement>('.menu-item, .contact-button')];
  let current = items.find(item => item.hasAttribute('aria-current')) ?? null;
  let pending: HTMLElement | null = null;
  let navigation: AbortSignal | null = null;
  let hovered: HTMLElement | null = null;
  let focused: HTMLElement | null = null;

  function positionIndicator() {
    const item = navigation ? pending : hovered ?? focused ?? current;
    items.forEach(candidate => candidate.toggleAttribute('data-indicated', candidate === item));
    indicator.style.opacity = item ? '1' : '0';
    if (!item) return;
    indicator.style.width = `${item.offsetWidth}px`;
    indicator.style.height = `${item.offsetHeight}px`;
    indicator.style.transform = `translate(${item.offsetLeft}px, ${item.offsetTop}px)`;
  }

  items.forEach(item => {
    item.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      hovered = item;
      positionIndicator();
    }, { signal });
    item.addEventListener('focus', () => {
      focused = item.matches(':focus-visible') ? item : null;
      positionIndicator();
    }, { signal });
    item.addEventListener('blur', () => {
      focused = null;
      positionIndicator();
    }, { signal });
  });
  menu.addEventListener('pointerleave', () => {
    hovered = null;
    positionIndicator();
  }, { signal });

  function itemForPath(path: string) {
    const normalize = (value: string) => value.replace(/\/$/, '') || '/';
    return items.find(item => {
      const href = item.getAttribute('href');
      return href && new URL(href, location.href).origin === location.origin && normalize(new URL(href, location.href).pathname) === normalize(path);
    }) ?? null;
  }

  function syncRoute() {
    navigation = null;
    pending = hovered = focused = null;
    current = itemForPath(location.pathname);
    const zip = menu.closest('header')?.querySelector<HTMLAnchorElement>('.zip-mark');
    if (zip) {
      const isDump = localPath(location.pathname).replace(/\/$/, '') === '/dump';
      zip.href = sitePath(isDump ? '/' : '/dump/');
      zip.setAttribute('aria-label', isDump ? 'barbz.zip — home' : 'barbz.zip — dump');
    }
    items.forEach(item => {
      if (item === current) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    positionIndicator();
  }

  // Move on navigation intent, before fetching/swapping the page. Touch does
  // not use hover, which would reset the indicator as the finger lifts.
  document.addEventListener('astro:before-preparation', event => {
    if (event.defaultPrevented) return;
    navigation = event.signal;
    pending = itemForPath(event.to.pathname);
    hovered = focused = null;
    positionIndicator();
    event.signal.addEventListener('abort', () => {
      if (navigation === event.signal) syncRoute();
    }, { once: true, signal });
  }, { signal });
  document.addEventListener('astro:after-swap', syncRoute, { signal });

  const observer = new ResizeObserver(positionIndicator);
  observer.observe(menu);
  items.forEach(item => observer.observe(item));
  positionIndicator();
  menu.dataset.enhanced = 'true';
  const frame = requestAnimationFrame(() => { menu.dataset.animated = 'true'; });
  document.fonts.ready.then(() => { if (!signal.aborted) positionIndicator(); });

  return () => {
    controller.abort();
    observer.disconnect();
    cancelAnimationFrame(frame);
  };
}
