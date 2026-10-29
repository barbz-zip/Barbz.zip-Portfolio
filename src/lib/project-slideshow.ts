const INTERVAL = 4000;

export function initProjectSlideshow(root: HTMLElement) {
  const templates = [...root.querySelectorAll<HTMLTemplateElement>('[data-project-slide]')];
  const controller = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let current: HTMLElement | undefined;
  let upcoming: { element: HTMLElement; ready: Promise<boolean>; index: number } | undefined;
  let index = 0;
  let animations: Animation[] = [];

  function mount(at: number) {
    const element = templates[at].content.firstElementChild!.cloneNode(true) as HTMLElement;
    element.style.opacity = '0';
    root.append(element);
    const image = element.querySelector('img')!;
    const ready = image.decode().then(() => true, () => false);
    return { element, ready, index: at };
  }

  function schedule() {
    clearTimeout(timer);
    if (!controller.signal.aborted && !document.hidden && templates.length > 1) {
      timer = setTimeout(advance, INTERVAL);
    }
  }

  function preload() {
    if (templates.length > 1 && !controller.signal.aborted) upcoming = mount((index + 1) % templates.length);
  }

  async function advance() {
    const next = upcoming;
    if (!next) return;
    const loaded = await next.ready;
    if (controller.signal.aborted || document.hidden || upcoming !== next) return;
    upcoming = undefined;
    index = next.index;
    if (!loaded) {
      next.element.remove();
      preload();
      schedule();
      return;
    }
    const previous = current;
    current = next.element;
    current.style.opacity = '1';
    schedule();
    if (reduced.matches) previous?.remove();
    else {
      const options: KeyframeAnimationOptions = {duration: 1000, easing: 'cubic-bezier(.45, 0, .55, 1)', fill: 'both'};
      const enter = current.animate([{opacity: 0}, {opacity: 1}], options);
      const leave = previous?.animate([{opacity: 1}, {opacity: 0}], options);
      animations = leave ? [enter, leave] : [enter];
      await enter.finished.catch(() => {});
      previous?.remove();
      animations.forEach(animation => animation.cancel());
      animations = [];
    }
    if (controller.signal.aborted) return;
    preload();
  }

  if (templates.length) {
    const first = mount(0);
    current = first.element;
    current.style.opacity = '1';
    first.ready.then(() => {
      if (controller.signal.aborted) return;
      preload();
      schedule();
    });
  }

  // Restart the viewing interval after returning to the tab; never catch up.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else schedule();
  }, {signal: controller.signal});

  return () => {
    controller.abort();
    clearTimeout(timer);
    animations.forEach(animation => animation.cancel());
    upcoming?.element.remove();
  };
}
