export function initMenu(menu: HTMLElement) {
  const controller = new AbortController();
  const { signal } = controller;
  const indicator = menu.querySelector<HTMLElement>('.menu-indicator')!;
  const items = [...menu.querySelectorAll<HTMLElement>('.menu-item')];
  const current = items.find(item => item.hasAttribute('aria-current')) ?? items[0];
  let hovered: HTMLElement | null = null;
  let focused: HTMLElement | null = null;

  function positionIndicator() {
    const item = hovered ?? focused ?? current;
    indicator.style.width = `${item.offsetWidth}px`;
    indicator.style.height = `${item.offsetHeight}px`;
    indicator.style.transform = `translate(${item.offsetLeft}px, ${item.offsetTop}px)`;
  }

  items.forEach(item => {
    item.addEventListener('pointerenter', () => {
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
