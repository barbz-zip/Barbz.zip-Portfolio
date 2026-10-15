import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { initDump } from '../src/lib/dump.ts';

function setup(t: TestContext, native = false) {
  const window = Object.assign(new EventTarget(), { scrollY: 0 });
  const html = Object.assign(new EventTarget(), { clientWidth: 390, scrollHeight: 3000 });
  const reduced = Object.assign(new EventTarget(), { matches: false });
  const source = new EventTarget();
  const overlay = { replaceChildren() {} };
  const wordmark = Object.assign(new EventTarget(), {
    dataset: {}, toggleAttribute() {}, querySelector: (selector: string) => selector === 'img' ? source : overlay,
  });
  const image = { style: { transform: '', filter: '' } };
  let layoutReads = 0;
  const item = {
    querySelector: () => image, toggleAttribute() {},
    getBoundingClientRect: () => { layoutReads++; return { top: 600 - window.scrollY, height: 460 }; },
  };
  const cursor = { dataset: {} };
  const document = Object.assign(new EventTarget(), { documentElement: html, querySelector: () => cursor });
  const page = {
    style: { setProperty() {} },
    querySelector: (selector: string) => selector === '[data-dump-description]' ? null : selector === '[data-pixel-wordmark]' ? wordmark : { getBoundingClientRect: () => ({ height: 844 }) },
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
  return { window, html, image, frames, reduced, tick, settle, reads: () => layoutReads };
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
  assert.equal(s.frames.size, 0);
  assert.equal(s.image.style.transform, '');
  assert.equal(s.image.style.filter, '');
});
