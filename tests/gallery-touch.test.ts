import { strict as assert } from 'node:assert';
import { test, type TestContext } from 'node:test';
import { initGallery } from '../src/lib/gallery.ts';
import { wrap } from '../src/lib/gallery-math.ts';

// Exercise the real gesture handlers with the event order used by touch browsers.
function gallery(t: TestContext) {
  const viewport = new EventTarget();
  const document = new EventTarget();
  const window = new EventTarget();
  const reduced = Object.assign(new EventTarget(), { matches: false });
  const track = { style: { transform: '' }, append() {} };
  const card = { dataset: { projectId: 'nursegrid' }, getBoundingClientRect: () => ({ width: 280 }) };
  const image = { closest: () => card };
  const group = {
    children: [card], firstElementChild: card,
    getBoundingClientRect: () => ({ width: 1430 }),
    cloneNode: () => ({ removeAttribute() {}, setAttribute() {}, querySelectorAll: () => [] }),
  };
  let captured: number | null = null;
  let now = 100;
  let frame: FrameRequestCallback;
  const root = {
    dataset: {} as Record<string, string>,
    querySelector: (selector: string) => ({ '[data-viewport]': viewport, '[data-track]': track, '[data-group]': group, '.project-image:hover': image })[selector],
    querySelectorAll: () => [], contains: () => true,
  };
  Object.assign(viewport, {
    clientWidth: 390,
    setPointerCapture: (id: number) => { captured = id; },
    hasPointerCapture: (id: number) => captured === id,
    releasePointerCapture: () => { captured = null; },
    matches: () => false,
  });
  Object.assign(window, { matchMedia: (query: string) => query.includes('reduced-motion') ? reduced : { matches: false } });
  const globals = {
    window, document,
    getComputedStyle: () => ({ gap: '6' }),
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: (callback: FrameRequestCallback) => { frame = callback; return 1; },
    cancelAnimationFrame() {},
  };
  const restoreGlobals: Array<() => void> = [];
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    restoreGlobals.push(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  t.mock.method(performance, 'now', () => now);
  const cleanup = initGallery(root as unknown as HTMLElement);
  t.after(() => { cleanup?.(); restoreGlobals.forEach(restore => restore()); });
  function pointer(type: string, x: number, y = 100, origin: unknown = viewport) {
    const event = new Event(type, { cancelable: true, bubbles: true });
    Object.defineProperties(event, Object.fromEntries(Object.entries({
      pointerId: 1, isPrimary: true, button: 0, pointerType: 'touch',
      clientX: x, clientY: y, timeStamp: now, target: origin,
    }).map(([key, value]) => [key, { value }])));
    (type === 'pointerup' || type === 'pointercancel' ? window : viewport).dispatchEvent(event);
  }
  return {
    root, card, image, document, viewport, reduced, pointer,
    position: () => Number(track.style.transform.match(/translate3d\(([-.\d]+)px/)![1]),
    tick(ms = 16) { now += ms; frame!(now); },
    click() {
      const event = new Event('click', { cancelable: true });
      Object.defineProperties(event, { target: { value: image }, detail: { value: 1 } });
      viewport.dispatchEvent(event);
    },
  };
}

test('touch drag continues when implicit image capture transfers to the gallery', t => {
  const g = gallery(t);
  g.pointer('pointerdown', 300, 100, g.image);
  g.pointer('pointermove', 270);
  const first = g.position();
  // Touch starts with implicit capture on the image. Transferring it fires a
  // bubbling lostpointercapture from that image before the next pointermove.
  g.pointer('lostpointercapture', 270, 100, g.image);
  g.pointer('pointermove', 150);
  assert.equal(wrap(first - g.position(), 1430), 120);
  assert.equal(g.root.dataset.dragging, 'true');
  g.pointer('pointermove', 210);
  assert.equal(wrap(first - g.position(), 1430), 60);
  let opened = 0;
  g.document.addEventListener('project:open', () => opened++);
  g.pointer('pointerup', 210);
  g.click();
  assert.equal(opened, 0, 'a swipe must not open the project');
});

test('a simple touch still opens the project', t => {
  const g = gallery(t);
  let opened = 0;
  g.document.addEventListener('project:open', () => opened++);
  g.pointer('pointerdown', 200, 100, g.image);
  g.pointer('pointerup', 200);
  g.click();
  assert.equal(opened, 1);
});

test('vertical movement does not drag the gallery and cancellation releases autoplay', t => {
  const g = gallery(t);
  const before = g.position();
  g.pointer('pointerdown', 200);
  g.pointer('pointermove', 203, 150);
  assert.equal(g.position(), before);
  assert.equal(g.root.dataset.dragging, undefined);
  g.pointer('pointercancel', 203, 150);
  g.tick(); g.tick(1500); g.tick();
  assert.notEqual(g.position(), before, 'autoplay is not stuck after cancellation');
});

test('losing the gallery capture itself ends the drag', t => {
  const g = gallery(t);
  g.pointer('pointerdown', 300);
  g.pointer('pointermove', 270);
  g.pointer('lostpointercapture', 270);
  assert.equal(g.root.dataset.dragging, undefined);
  const before = g.position();
  g.pointer('pointermove', 100);
  assert.equal(g.position(), before);
});

test('touch hover left after closing a dialog cannot stop autoplay', t => {
  const g = gallery(t);
  g.document.dispatchEvent(new CustomEvent('project:modal-state', { detail: { open: false } }));
  const before = g.position();
  g.tick(); g.tick(1500); g.tick();
  assert.notEqual(g.position(), before);
});
