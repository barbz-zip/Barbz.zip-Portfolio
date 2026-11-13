const INTERVAL = 1500;

export function initProjectSlideshow(root: HTMLElement) {
  const templates = [...root.querySelectorAll<HTMLTemplateElement>('[data-project-slide]')];
  const fallback = root.querySelector<HTMLTemplateElement>('[data-project-fallback]');
  const controller = new AbortController();
  const {signal} = controller;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let current: HTMLElement | undefined;
  let pending: HTMLElement | undefined;
  let index = -1;
  let animations: Animation[] = [];
  let next: Promise<HTMLElement | undefined> | undefined;
  const skipped = new Set<number>();

  function videoReady(video: HTMLVideoElement) {
    return new Promise<boolean>(resolve => {
      const listeners = new AbortController();
      const options = {signal: listeners.signal};
      const timeout = setTimeout(() => finish(false), 10000);
      function finish(valid: boolean) {
        clearTimeout(timeout);
        listeners.abort();
        resolve(valid);
      }
      signal.addEventListener('abort', () => finish(false), options);
      video.addEventListener('error', () => finish(false), options);
      video.addEventListener('loadedmetadata', () => {
        if (video.videoWidth <= video.videoHeight) finish(false);
      }, options);
      video.addEventListener('loadeddata', () => finish(video.videoWidth > video.videoHeight), options);
      video.preload = 'auto';
      video.load();
    });
  }

  async function prepareNext() {
    for (let step = 1; step <= templates.length; step++) {
      const at = (index + step) % templates.length;
      if (at === index || skipped.has(at)) continue;
      const element = templates[at].content.firstElementChild!.cloneNode(true) as HTMLElement;
      pending = element;
      element.style.opacity = '0';
      root.append(element);
      const video = element.querySelector('video');
      const ready = video ? await videoReady(video) : await element.querySelector('img')!.decode().then(() => true, () => false);
      if (signal.aborted) return;
      if (ready) {
        index = at;
        return element;
      }
      skipped.add(at);
      element.remove();
      pending = undefined;
    }
  }

  function schedule() {
    clearTimeout(timer);
    if (!signal.aborted && !document.hidden && next) timer = setTimeout(advance, INTERVAL);
  }

  function playCurrent() {
    if (!document.hidden) current?.querySelector('video')?.play().catch(() => {});
  }

  async function advance() {
    const prepared = next;
    const slide = await prepared;
    if (signal.aborted || prepared !== next || document.hidden) return;
    next = undefined;
    if (!slide) {
      if (!current && fallback) root.append(fallback.content.cloneNode(true));
      return;
    }
    const previous = current;
    current = slide;
    pending = undefined;
    current.style.opacity = '1';
    playCurrent();
    // Prepare the following file during the fade, including its first decoded video frame.
    if (templates.length - skipped.size > 1) next = prepareNext();
    schedule();
    if (previous && !reduced.matches) {
      const options: KeyframeAnimationOptions = {duration: 600, easing: 'cubic-bezier(.45, 0, .55, 1)', fill: 'both'};
      animations = [
        slide.animate([{opacity: 0}, {opacity: 1}], options),
        previous.animate([{opacity: 1}, {opacity: 0}], options),
      ];
      await animations[0].finished.catch(() => {});
      animations.forEach(animation => animation.cancel());
      animations = [];
    }
    previous?.querySelector('video')?.pause();
    previous?.remove();
  }

  next = prepareNext();
  void advance();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(timer);
      current?.querySelector('video')?.pause();
    } else {
      playCurrent();
      if (current) schedule();
      else if (next) void advance();
    }
  }, {signal});

  return () => {
    controller.abort();
    clearTimeout(timer);
    animations.forEach(animation => animation.cancel());
    current?.querySelector('video')?.pause();
    pending?.remove();
  };
}
