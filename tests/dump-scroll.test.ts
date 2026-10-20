import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { initDump } from '../src/lib/dump.ts';

function setup(t: TestContext, native = false) {
  const window = Object.assign(new EventTarget(), { scrollY: 0 });
  Object.assign(window, { scrollTo: ({ top }: { top: number }) => { window.scrollY = top; } });
  const html = Object.assign(new EventTarget(), { clientWidth: 390, scrollHeight: 3000 });
  const reduced = Object.assign(new EventTarget(), { matches: false });
  const source = new EventTarget();
  const overlay = { replaceChildren() {} };
  const wordmark = Object.assign(new EventTarget(), {
    style: { opacity: '', visibility: '' },
    dataset: {}, toggleAttribute() {}, querySelector: (selector: string) => selector === 'img' ? source : overlay,
  });
  const image = { style: { transform: '', filter: '' } };
  let layoutReads = 0;
  const item = {
    querySelector: () => image, toggleAttribute() {},
    getBoundingClientRect: () => { layoutReads++; return { top: 600 - window.scrollY, height: 460 }; },
  };
  const cursor = { dataset: {} };
  const gridAttributes = new Map<string, string>();
  const gridButton = Object.assign(new EventTarget(), { textContent: 'Grid View', setAttribute: (name: string, value: string) => gridAttributes.set(name, value) });
  let grid = false;
  let transitions = 0;
  const feed = { animate: () => { transitions++; return { cancel() {} }; } };
  const document = Object.assign(new EventTarget(), { documentElement: html, querySelector: (selector: string) => selector === '[data-dump-grid]' ? gridButton : cursor });
  const page = {
    style: { setProperty() {} },
    toggleAttribute: (_name: string, value: boolean) => { grid = value; },
    querySelector: (selector: string) => selector === '.dump-feed' ? feed : ['[data-dump-description]', '[data-dump-lightbox]'].includes(selector) ? null : selector === '[data-pixel-wordmark]' ? wordmark : { getBoundingClientRect: () => ({ height: 844 }) },
    querySelectorAll: () => [item],
  };
  let serial = 0;
  let time = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const globals = {
    window, document, innerWidth: 390, innerHeight: 844,
    CSS: { supports: () => native }, matchMedia: () => reduced,
    IntersectionObserver: class {
      callback: (entries: unknown[]) => void;
      constructor(callback: (entries: unknown[]) => void) { this.callback = callback; }
      observe(target: unknown) { this.callback([{ target, isIntersecting: true }]); }
      disconnect() {}
    },
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++serial, callback); return serial; },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  };
  const restore: Array<() => void> = [];
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    restore.push(() => original ? Object.defineProperty(globalThis, key, original) : Reflect.deleteProperty(globalThis, key));
  }
  const cleanup = initDump(page as unknown as HTMLElement);
  t.after(() => { cleanup(); restore.forEach(fn => fn()); });
  function tick() {
    time += 16;
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach(callback => callback(time));
  }
  function settle() { for (let count = 0; frames.size && count < 100; count++) tick(); }
  return { window, html, image, wordmark, frames, reduced, tick, settle, reads: () => layoutReads, gridButton, gridAttributes, grid: () => grid, transitions: () => transitions };
}

test('fallback scroll does not measure layout or jump when the Safari toolbar resizes', t => {
  const s = setup(t);
  s.settle();
  const initial = s.image.style.transform;
  const reads = s.reads();
  s.window.scrollY = 300;
  s.window.dispatchEvent(new Event('scroll'));
  s.tick();
  assert.notEqual(s.image.style.transform, initial);
  s.settle();
  assert.equal(s.reads(), reads, 'scroll uses cached layout');
  const settled = s.image.style.transform;
  globalThis.innerHeight = 760;
  s.window.dispatchEvent(new Event('resize'));
  s.settle();
  assert.equal(s.image.style.transform, settled);
  assert.equal(s.reads(), reads, 'height-only toolbar changes do not remeasure');
  s.html.clientWidth = 844;
  s.window.dispatchEvent(new Event('resize'));
  s.settle();
  assert.ok(s.reads() > reads, 'rotation updates layout');
  s.reduced.matches = true;
  s.reduced.dispatchEvent(new Event('change'));
  s.settle();
  assert.equal(s.image.style.transform, 'scale(1.0000)');
  assert.equal(s.image.style.filter, 'brightness(1.0000)');
});

test('native timeline does not run a competing JavaScript scroll animation', t => {
  const s = setup(t, true);
  s.window.scrollY = 300;
  s.window.dispatchEvent(new Event('scroll'));
  s.tick();
  assert.equal(s.frames.size, 0);
  assert.equal(s.image.style.transform, '');
  assert.equal(s.image.style.filter, '');
});

for (const native of [false, true]) {
  test(`wordmark fades until the first image is centered with ${native ? 'native' : 'fallback'} motion`, t => {
    const s = setup(t, native);
    s.settle();
    const reads = s.reads();
    assert.equal(s.wordmark.style.opacity, '1');
    // First image center: 600 + 460 / 2; viewport center: 844 / 2.
    for (const [scroll, opacity] of [[204, .5], [408, 0], [800, 0], [0, 1]]) {
      s.window.scrollY = scroll;
      s.window.dispatchEvent(new Event('scroll'));
      s.settle();
      assert.equal(Number(s.wordmark.style.opacity), opacity);
      assert.equal(s.wordmark.style.visibility, opacity === 0 ? 'hidden' : '');
    }
    assert.equal(s.reads(), reads, 'fade uses cached geometry without layout reads');
  });

  test(`grid toggles and restores stream position with ${native ? 'native' : 'fallback'} motion`, t => {
    const s = setup(t, native);
    s.window.scrollY = 800;
    s.window.dispatchEvent(new Event('scroll'));
    s.settle();
    s.gridButton.dispatchEvent(new Event('click'));
    assert.equal(s.grid(), true);
    assert.equal(s.gridAttributes.get('aria-pressed'), 'true');
    assert.equal(s.gridButton.textContent, 'Scroll View');
    assert.equal(s.window.scrollY, 0);
    assert.equal(s.image.style.transform, '');
    assert.equal(s.image.style.filter, '');
    s.window.scrollY = 120;
    s.window.dispatchEvent(new Event('scroll'));
    assert.equal(s.frames.size, 0, 'no depth animation loop in grid view');
    s.gridButton.dispatchEvent(new Event('click'));
    s.settle();
    assert.equal(s.grid(), false);
    assert.equal(s.gridAttributes.get('aria-pressed'), 'false');
    assert.equal(s.gridButton.textContent, 'Grid View');
    assert.equal(s.window.scrollY, 800);
    assert.equal(s.transitions(), 2);
    if (!native) assert.match(s.image.style.transform, /^scale\(/);
  });
}

test('grid switches without an entrance animation when reduced motion is enabled', t => {
  const s = setup(t);
  s.reduced.matches = true;
  s.gridButton.dispatchEvent(new Event('click'));
  assert.equal(s.grid(), true);
  assert.equal(s.transitions(), 0);
});
