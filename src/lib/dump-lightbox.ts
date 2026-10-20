import { initDumpDescription } from './dump-description.ts';

export function initDumpLightbox(page: HTMLElement) {
  const element = page.querySelector<HTMLDialogElement>('[data-dump-lightbox]');
  if (!element) return () => {};
  const dialog = element;
  const controller = new AbortController();
  const { signal } = controller;
  const media = dialog.querySelector<HTMLElement>('[data-dump-lightbox-media]')!;
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-dump-lightbox-close]')!;
  const description = initDumpDescription(dialog.querySelector<HTMLElement>('[data-dump-description]')!, { closeOnEscape: false });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let opener: HTMLButtonElement | null = null;
  let outsidePress = false;
  let closing = false;
  let frame = 0;
  let timer = 0;

  function finishClose() {
    dialog.close();
    media.replaceChildren();
    description.update([], 0, 0);
    document.body.classList.remove('dump-lightbox-open');
    closing = false;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  }

  function close() {
    if (!dialog.open || closing) return;
    closing = true;
    cancelAnimationFrame(frame);
    delete dialog.dataset.visible;
    timer = window.setTimeout(finishClose, reduced.matches ? 0 : 180);
  }

  page.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-dump-open]');
    if (!button || !page.hasAttribute('data-grid') || dialog.open || closing) return;
    const item = button.closest<HTMLElement>('[data-dump-item]')!;
    const source = item.querySelector<HTMLElement>('[data-dump-image]')!;
    const image = source.cloneNode(true) as HTMLElement;
    image.removeAttribute('style');
    image.removeAttribute('data-dump-image');
    // Reuse the same responsive asset and crop without copying grid controls.
    const photo = image.querySelector('img')!;
    photo.loading = 'eager';
    photo.sizes = '(max-width: 800px) 100vw, 960px';
    media.className = `dump-lightbox-media ${[...item.classList].filter(name => name.startsWith('dump-item--')).join(' ')}`;
    media.style.setProperty('--image-ratio', item.style.getPropertyValue('--image-ratio'));
    media.replaceChildren(image);
    opener = button;
    outsidePress = false;
    document.body.classList.add('dump-lightbox-open');
    dialog.showModal();
    description.show(Number(button.dataset.dumpOpen));
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => { dialog.dataset.visible = 'true'; });
    });
  }, { signal });
  closeButton.addEventListener('click', close, { signal });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); }, { signal });
  dialog.addEventListener('pointerdown', event => { outsidePress = event.target === dialog; }, { signal });
  dialog.addEventListener('click', event => {
    if (outsidePress && event.target === dialog) close();
    outsidePress = false;
  }, { signal });

  return () => {
    controller.abort();
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    description.destroy();
    dialog.close();
    document.body.classList.remove('dump-lightbox-open');
    media.replaceChildren();
  };
}
