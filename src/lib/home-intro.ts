// Animate the visible slider cards in place, including copies at the loop seam.
export function initHomeIntro(gallery: HTMLElement) {
  const page = document.body;
  if (page.dataset.homeIntro !== 'zip') return;

  const controller = new AbortController();
  const { signal } = controller;
  const animations: Animation[] = [];
  const timers: number[] = [];
  function finish() {
    controller.abort();
    timers.forEach(clearTimeout);
    animations.forEach(animation => animation.cancel());
    delete page.dataset.homeIntro;
    delete page.dataset.introStart;
  }
  function delay(ms: number) {
    return new Promise<void>(resolve => timers.push(window.setTimeout(resolve, ms)));
  }
  function visibleCards() {
    return [...gallery.querySelectorAll<HTMLElement>('.project-card')].filter(card => {
      const bounds = card.getBoundingClientRect();
      return bounds.right > 0 && bounds.left < document.documentElement.clientWidth;
    });
  }

  async function play() {
    const covers = visibleCards().map(card => card.querySelector('img'));
    const ready = Promise.allSettled(covers.map(image => image?.decode()));
    const elapsed = performance.now() - Number(page.dataset.introStart);
    await Promise.all([delay(Math.max(0, 1000 - elapsed)), Promise.race([ready, delay(1250)])]);
    if (signal.aborted || page.dataset.homeIntro !== 'zip') return;

    const center = document.documentElement.clientWidth / 2;
    for (const card of visibleCards()) {
      const rect = card.getBoundingClientRect();
      const offset = center - rect.left - rect.width / 2;
      animations.push(card.animate([
        { transform: `translateX(${offset}px)` },
        { transform: 'translateX(0)' },
      ], { duration: 400, easing: 'cubic-bezier(0.22, 0.75, 0.25, 1)' }));
    }
    page.dataset.homeIntro = 'open';
    const fades = Array.from(
      page.querySelectorAll('.home-intro-file, .site-header, .site-footer, .wordmark-stage'),
      element => element.getAnimations(),
    ).flat();
    await Promise.allSettled([...animations, ...fades].map(animation => animation.finished));
  }
  window.addEventListener('resize', finish, { signal });
  window.addEventListener('keydown', finish, { once: true, signal });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', finish, { signal });
  void play().catch(() => {}).finally(finish);
  return finish;
}
