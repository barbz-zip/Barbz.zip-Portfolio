export function initProjectIndex(root: HTMLElement) {
  const controller = new AbortController();
  const { signal } = controller;
  const list = root.querySelector<HTMLElement>('.index-list')!;
  const preview = root.querySelector<HTMLElement>('[data-index-preview]')!;
  const covers = [...preview.querySelectorAll<HTMLElement>('[data-preview-project]')];
  const hover = window.matchMedia('(any-hover: hover)');
  let activeId: string | undefined;
  let frame = 0;
  let cursorX = 0;
  let cursorY = 0;

  function position() {
    frame = 0;
    const { width, height } = preview.getBoundingClientRect();
    const x = cursorX + 18 + width <= innerWidth - 12 ? cursorX + 18 : cursorX - width - 18;
    const y = cursorY + 18 + height <= innerHeight - 12 ? cursorY + 18 : cursorY - height - 18;
    preview.style.transform = `translate3d(${Math.max(12, x)}px, ${Math.max(12, y)}px, 0)`;
  }
  function show(row: HTMLElement, x: number, y: number) {
    const id = row.dataset.indexProject;
    if (id !== activeId) {
      covers.forEach(cover => { cover.hidden = cover.dataset.previewProject !== id; });
      activeId = id;
    }
    cursorX = x;
    cursorY = y;
    if (!preview.dataset.visible) position();
    preview.dataset.visible = 'true';
    if (!frame) frame = requestAnimationFrame(position);
  }
  function hide() {
    delete preview.dataset.visible;
    cancelAnimationFrame(frame);
    frame = 0;
  }
  list.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !hover.matches) { hide(); return; }
    const row = (event.target as Element).closest<HTMLElement>('[data-index-project]');
    if (row) show(row, event.clientX, event.clientY);
    else hide();
  }, { signal });
  list.addEventListener('pointerleave', hide, { signal });
  list.addEventListener('focusin', event => {
    const row = (event.target as Element).closest<HTMLElement>('[data-index-project]');
    if (!row?.matches(':focus-visible') || !hover.matches) return;
    const rect = row.getBoundingClientRect();
    show(row, rect.left + rect.width / 2, rect.bottom);
  }, { signal });
  list.addEventListener('focusout', hide, { signal });
  list.addEventListener('click', hide, { signal });
  window.addEventListener('scroll', hide, { passive: true, signal });
  window.addEventListener('resize', hide, { signal });
  return () => { controller.abort(); cancelAnimationFrame(frame); };
}
