import { copiesFor, wrap } from './gallery-math';

const AUTO_SPEED = 50; // Pixels per second, independent of display refresh rate.
const RESUME_DELAY = 1400;

export function initGallery(root: HTMLElement) {
  const controller = new AbortController();
  const { signal } = controller;
  const viewport = root.querySelector<HTMLElement>('[data-viewport]')!;
  const track = root.querySelector<HTMLElement>('[data-track]')!;
  const group = root.querySelector<HTMLElement>('[data-group]')!;
  if (!group.children.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cycle = 0;
  let position = 0;
  let target = 0;
  let velocity = 0;
  let lastTime = 0;
  let resumeAt = 0;
  let hovering = false;
  let focused = false;
  let pointer: number | null = null;
  let lastX = 0;
  let lastPointerTime = 0;
  let frame = 0;
  let modalOpen = false;
  let startX = 0;
  let startY = 0;
  let dragged = false;
  let suppressClickUntil = 0;

  function openProject(card: HTMLElement) {
    const id = card.dataset.projectId;
    if (id) document.dispatchEvent(new CustomEvent('project:open', { detail: { id } }));
  }

  function paint() {
    track.style.transform = `translate3d(${-cycle - wrap(position, cycle)}px, 0, 0)`;
  }

  function measure() {
    const oldCycle = cycle;
    cycle = group.getBoundingClientRect().width;
    if (!cycle) return;
    const progress = oldCycle ? wrap(position, oldCycle) / oldCycle : 0;
    root.querySelectorAll('[data-copy]').forEach(copy => copy.remove());
    const count = copiesFor(viewport.clientWidth, cycle);
    for (let i = 1; i < count; i++) {
      const copy = group.cloneNode(true) as HTMLElement;
      copy.removeAttribute('data-group');
      copy.setAttribute('data-copy', '');
      copy.setAttribute('aria-hidden', 'true');
      // Visual copies never enter the accessibility tree or keyboard order.
      copy.querySelectorAll<HTMLElement>('a, button, [tabindex]').forEach(item => item.tabIndex = -1);
      track.append(copy);
    }
    const card = group.firstElementChild!.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(group).gap) || 0;
    const initialInset = viewport.clientWidth > 700 ? (viewport.clientWidth - (card * 4 + gap * 3)) / 2 : (viewport.clientWidth - card) / 2;
    position = oldCycle ? progress * cycle : wrap(-initialInset, cycle);
    target = position;
    velocity = 0;
    root.dataset.enhanced = 'true';
    paint();
  }

  function animate(time: number) {
    const dt = Math.min((time - (lastTime || time)) / 1000, 0.05);
    lastTime = time;
    if (pointer === null && !modalOpen) {
      if (Math.abs(velocity) > 1) {
        target += velocity * dt;
        velocity *= Math.exp(-5.5 * dt);
      } else velocity = 0;
      if (!reduced.matches && !hovering && !focused && time > resumeAt) target += AUTO_SPEED * dt;
      position += (target - position) * (reduced.matches ? 1 : 1 - Math.exp(-18 * dt));
      // Rebase both values together to avoid precision loss over long sessions.
      if (cycle && (position >= cycle || position < 0)) {
        const shift = Math.floor(position / cycle) * cycle;
        position -= shift;
        target -= shift;
      }
      paint();
    }
    frame = requestAnimationFrame(animate);
  }

  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || modalOpen) return;
    // Keep presentation copies out of focus; native click still fires on release.
    event.preventDefault();
    suppressClickUntil = 0;
    pointer = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dragged = false;
    focused = false;
    lastX = event.clientX;
    lastPointerTime = event.timeStamp;
    target = position;
    velocity = 0;
  }, { signal });
  viewport.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer) return;
    if (!dragged) {
      if (Math.hypot(event.clientX - startX, event.clientY - startY) < 6) return;
      dragged = true;
      viewport.setPointerCapture(event.pointerId);
      root.dataset.dragging = 'true';
    }
    const delta = lastX - event.clientX;
    const dt = Math.max(8, event.timeStamp - lastPointerTime) / 1000;
    velocity = Math.max(-2000, Math.min(2000, delta / dt));
    position += delta;
    target = position;
    lastX = event.clientX;
    lastPointerTime = event.timeStamp;
    paint();
  }, { signal });
  function release(event: PointerEvent) {
    if (event.pointerId !== pointer) return;
    if (dragged || event.type === 'pointercancel') suppressClickUntil = performance.now() + 400;
    if (event.type === 'pointercancel' || event.timeStamp - lastPointerTime > 100 || reduced.matches) velocity = 0;
    pointer = null;
    delete root.dataset.dragging;
    resumeAt = performance.now() + RESUME_DELAY;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  }
  window.addEventListener('pointerup', release, { signal });
  window.addEventListener('pointercancel', release, { signal });
  viewport.addEventListener('lostpointercapture', release, { signal });
  viewport.addEventListener('dragstart', event => event.preventDefault(), { signal });
  viewport.addEventListener('click', event => {
    if (event.detail !== 0 && performance.now() < suppressClickUntil) { event.preventDefault(); return; }
    const card = (event.target as Element).closest<HTMLElement>('[data-project-id]');
    if (card) openProject(card);
  }, { signal });
  document.addEventListener('project:modal-state', event => {
    modalOpen = (event as CustomEvent<{ open: boolean }>).detail.open;
    velocity = 0;
    target = position;
    focused = false;
    hovering = Boolean(root.querySelector('.project-image:hover'));
    resumeAt = performance.now() + RESUME_DELAY;
  }, { signal });
  window.addEventListener('wheel', event => {
    if (modalOpen || event.ctrlKey || event.metaKey || event.defaultPrevented || pointer !== null) return;
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    // Either wheel axis drives the gallery, including over the page whitespace.
    // Use the dominant axis so diagonal trackpad gestures are not counted twice.
    event.preventDefault();
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1;
    target += (horizontal ? event.deltaX : event.deltaY) * scale;
    velocity = 0;
    resumeAt = performance.now() + RESUME_DELAY;
  }, { passive: false, signal });
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    focused = false;
    const image = (event.target as Element).closest('.project-image');
    const overImage = Boolean(image && root.contains(image));
    if (hovering && !overImage) resumeAt = 0;
    hovering = overImage;
  }, { signal });
  viewport.addEventListener('pointerleave', () => { hovering = false; resumeAt = 0; }, { signal });
  viewport.addEventListener('focus', () => focused = viewport.matches(':focus-visible'), { signal });
  viewport.addEventListener('blur', () => { focused = false; resumeAt = 0; }, { signal });
  viewport.addEventListener('keydown', event => {
    focused = true;
    if (event.target === viewport && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const center = viewport.getBoundingClientRect().width / 2;
      const cards = [...track.querySelectorAll<HTMLElement>('[data-project-id]')];
      const closest = cards.reduce((best, card) => {
        const rect = card.getBoundingClientRect();
        const bestRect = best.getBoundingClientRect();
        return Math.abs(rect.left + rect.width / 2 - center) < Math.abs(bestRect.left + bestRect.width / 2 - center) ? card : best;
      });
      openProject(closest);
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const step = group.firstElementChild!.getBoundingClientRect().width + (parseFloat(getComputedStyle(group).gap) || 0);
    if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = cycle - step;
    else target += event.key === 'ArrowRight' ? step : -step;
    velocity = 0;
    resumeAt = performance.now() + RESUME_DELAY;
  }, { signal });
  reduced.addEventListener('change', () => { velocity = 0; }, { signal });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    lastTime = 0;
    if (!document.hidden) frame = requestAnimationFrame(animate);
  }, { signal });
  const observer = new ResizeObserver(measure);
  observer.observe(viewport);
  measure();
  frame = requestAnimationFrame(animate);
  return () => { controller.abort(); observer.disconnect(); cancelAnimationFrame(frame); };
}
