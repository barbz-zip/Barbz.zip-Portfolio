/** Contact feedback follows the mouse, with a button anchor for touch/keyboard. */
export function initContact() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let feedback: HTMLElement | null = null;
  let followsMouse = false;
  let x = 0;
  let y = 0;
  let request = 0;

  function position() {
    if (!feedback) return;
    const left = Math.max(12, Math.min(x + 16, innerWidth - feedback.offsetWidth - 12));
    const top = Math.max(12, Math.min(y + 16, innerHeight - feedback.offsetHeight - 12));
    feedback.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }

  function reset() {
    request++;
    clearTimeout(timer);
    if (feedback) feedback.textContent = '';
    feedback = null;
    followsMouse = false;
  }

  document.addEventListener('pointermove', event => {
    if (!followsMouse || event.pointerType !== 'mouse') return;
    x = event.clientX;
    y = event.clientY;
    position();
  }, { passive: true });

  document.addEventListener('click', async event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-copy-email]');
    const email = button?.dataset.copyEmail;
    if (!button || !email) return;
    reset();
    const currentRequest = request;
    feedback = document.querySelector<HTMLElement>('[data-contact-feedback]');
    followsMouse = event.detail > 0 && (event as PointerEvent).pointerType !== 'touch' && matchMedia('(hover: hover)').matches;
    const bounds = button.getBoundingClientRect();
    x = followsMouse ? event.clientX : bounds.right;
    y = followsMouse ? event.clientY : bounds.bottom;
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
        copied = true;
      } else {
        // Local mobile previews over HTTP do not expose the Clipboard API.
        const input = document.createElement('textarea');
        input.value = email;
        input.className = 'sr-only';
        input.setAttribute('readonly', '');
        document.body.append(input);
        try {
          input.select();
          copied = document.execCommand('copy');
        } finally {
          input.remove();
          button.focus({ preventScroll: true });
        }
      }
    } catch {
      copied = false;
    }
    // Ignore a clipboard response after navigation or a newer click.
    if (currentRequest !== request || !feedback) return;
    feedback.textContent = copied ? 'Copied' : 'Unable to copy';
    position();
    timer = setTimeout(reset, 2000);
  });

  document.addEventListener('astro:before-preparation', reset);
  window.addEventListener('pagehide', reset);
}
