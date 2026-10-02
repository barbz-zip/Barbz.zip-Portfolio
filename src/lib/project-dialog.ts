export function initProjectDialog() {
  const controller = new AbortController();
  const { signal } = controller;
  const dialog = document.querySelector<HTMLDialogElement>('[data-project-dialog]')!;
  const content = dialog.querySelector<HTMLElement>('[data-project-content]')!;
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-project-close]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cursor = dialog.querySelector<HTMLElement>('[data-case-cursor]')!;
  let closing = false;
  let outsidePress = false;
  let openFrame = 0;
  let closeTimer = 0;

  function notify(open: boolean) {
    document.dispatchEvent(new CustomEvent('project:modal-state', { detail: { open } }));
  }

  document.addEventListener('project:open', event => {
    if (dialog.open || closing) return;
    const { id } = (event as CustomEvent<{ id: string }>).detail;
    const template = [...document.querySelectorAll<HTMLTemplateElement>('[data-project-template]')].find(item => item.dataset.projectTemplate === id);
    if (!template) return;
    content.replaceChildren(template.content.cloneNode(true));
    document.body.classList.add('project-open');
    notify(true);
    dialog.showModal();
    dialog.scrollTop = 0;
    // Establish the initial opacity/position before starting the entrance.
    openFrame = requestAnimationFrame(() => {
      openFrame = requestAnimationFrame(() => dialog.dataset.visible = 'true');
    });
  }, { signal });

  function close() {
    if (!dialog.open || closing) return;
    closing = true;
    delete cursor.dataset.visible;
    cancelAnimationFrame(openFrame);
    delete dialog.dataset.visible;
    document.body.classList.remove('project-open');
    closeTimer = window.setTimeout(() => {
      dialog.close();
      content.replaceChildren();
      closing = false;
      document.querySelector<HTMLElement>('[data-viewport]')?.focus({ preventScroll: true });
      notify(false);
    }, reduced.matches ? 0 : 240);
  }

  closeButton.addEventListener('click', close, { signal });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); }, { signal });
  dialog.addEventListener('pointerdown', event => outsidePress = event.target === dialog, { signal });
  dialog.addEventListener('click', event => { if (outsidePress && event.target === dialog) close(); }, { signal });
  dialog.addEventListener('pointermove', event => {
    const overImage = (event.target as Element).closest('[data-open-case]');
    if (event.pointerType !== 'mouse' || !overImage || closing) { delete cursor.dataset.visible; return; }
    cursor.dataset.visible = 'true';
    const x = Math.max(10, Math.min(event.clientX + 16, innerWidth - cursor.offsetWidth - 12));
    const y = Math.max(10, Math.min(event.clientY + 16, innerHeight - cursor.offsetHeight - 12));
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, { signal });
  dialog.addEventListener('pointerleave', () => delete cursor.dataset.visible, { signal });
  return () => {
    controller.abort();
    cancelAnimationFrame(openFrame);
    clearTimeout(closeTimer);
    dialog.close();
    document.body.classList.remove('project-open');
  };
}
