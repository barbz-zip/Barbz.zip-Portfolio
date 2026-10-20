export interface DumpImagePosition { top: number; height: number }

/** The intro ends only when the first image's center reaches the viewport center. */
export function centeredDumpImage(images: DumpImagePosition[], scroll: number, viewportHeight: number) {
  if (!images.length) return -1;
  const center = scroll + viewportHeight / 2;
  if (center < images[0].top + images[0].height / 2) return -1;
  let selected = 0;
  let nearest = Infinity;
  images.forEach((image, index) => {
    const distance = Math.abs(image.top + image.height / 2 - center);
    if (distance < nearest) { nearest = distance; selected = index; }
  });
  return selected;
}

export function initDumpDescription(root: HTMLElement, { closeOnEscape = true } = {}) {
  const controller = new AbortController();
  const { signal } = controller;
  const descriptions = JSON.parse(root.dataset.descriptions ?? '[]') as Array<{ title: string; description: string }>;
  const toggle = root.querySelector<HTMLButtonElement>('[data-description-toggle]')!;
  const panel = root.querySelector<HTMLElement>('[data-description-panel]')!;
  const close = root.querySelector<HTMLButtonElement>('[data-description-close]')!;
  const title = root.querySelector<HTMLElement>('[data-description-title]')!;
  const text = root.querySelector<HTMLElement>('[data-description-text]')!;
  let selected = -1;
  let open = false;
  let focusFrame = 0;

  function setOpen(next: boolean, restoreFocus = false) {
    open = next;
    root.toggleAttribute('data-open', next);
    toggle.setAttribute('aria-expanded', String(next));
    toggle.inert = next;
    panel.inert = !next;
    panel.setAttribute('aria-hidden', String(!next));
    cancelAnimationFrame(focusFrame);
    if (next || restoreFocus) {
      // Allow the visibility transition to start before moving keyboard focus.
      focusFrame = requestAnimationFrame(() => {
        focusFrame = requestAnimationFrame(() => {
          focusFrame = 0;
          if (!root.inert) (next ? close : toggle).focus({ preventScroll: true });
        });
      });
    }
  }
  toggle.addEventListener('click', () => { if (selected !== -1) setOpen(true); }, { signal });
  close.addEventListener('click', () => setOpen(false, true), { signal });
  document.addEventListener('keydown', event => {
    if (closeOnEscape && event.key === 'Escape' && open) { event.preventDefault(); setOpen(false, true); }
  }, { signal });

  function select(index: number) {
    if (index === selected) return;
    selected = index;
    const content = descriptions[index];
    const visible = Boolean(content);
    if (!visible) {
      if (root.contains(document.activeElement)) (document.activeElement as HTMLElement)?.blur();
      setOpen(false);
    }
    root.toggleAttribute('data-visible', visible);
    root.inert = !visible;
    root.setAttribute('aria-hidden', String(!visible));
    if (content) {
      title.textContent = content.title;
      text.textContent = content.description;
      panel.scrollTop = 0;
    }
  }

  return {
    update(images: DumpImagePosition[], scroll: number, viewportHeight: number) {
      select(centeredDumpImage(images, scroll, viewportHeight));
    },
    show(index: number) {
      select(index);
      if (descriptions[index]) setOpen(true);
    },
    destroy() { controller.abort(); cancelAnimationFrame(focusFrame); },
  };
}
