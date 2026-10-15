import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createWordmarkFontLoader } from '../src/lib/wordmark-fonts.ts';

test('font loading is lazy, reuses cached faces, bounds memory and cleans up', async t => {
  const faces = new Set();
  const requests: string[] = [];
  let fail = false;
  const replacements = {
    document: { fonts: faces },
    window: { setTimeout },
    FontFace: class {
      family: string;
      constructor(family: string, _data: ArrayBuffer) { this.family = family; }
      async load() { return this; }
    },
    fetch: async (input: string | URL) => {
      const url = String(input);
      requests.push(url);
      if (fail) return new Response('', { status: 503 });
      return url.includes('fonts.googleapis.com')
        ? new Response('@font-face { src: url(https://fonts.gstatic.com/test.woff2) format("woff2"); }')
        : new Response(new Uint8Array([1, 2, 3]));
    },
  };
  for (const [name, value] of Object.entries(replacements)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  const controller = new AbortController();
  const loader = createWordmarkFontLoader('barbz.zip', controller.signal);
  assert.equal(requests.length, 0, 'creating a loader must not fetch the catalog');
  const first = await loader.load('IBM Plex Mono');
  assert.ok(first);
  assert.equal(requests.length, 2, 'one stylesheet and one subset font');
  assert.equal(new URL(requests[0]).searchParams.get('text'), 'barbz.zip');
  assert.equal(await loader.load('IBM Plex Mono'), first);
  assert.equal(requests.length, 2, 'a cached font does not trigger another request');
  assert.equal(loader.alternate('IBM Plex Mono', ['Anton']), null);
  await loader.load('Anton');
  assert.equal(loader.alternate('IBM Plex Mono', ['Anton'])?.family, 'Anton');
  assert.equal(loader.alternate('Anton', ['Anton']), null, 'do not repeat or select outside the catalog');
  for (let i = 0; i < 12; i++) {
    await loader.load(`Font ${i}`);
    loader.trim(['Anton', `Font ${i}`]);
    assert.ok(faces.size <= 8);
  }
  assert.equal(loader.alternate('Font 11', ['Anton'])?.family, 'Anton');
  fail = true;
  assert.equal(await loader.load('Unavailable'), null);
  const requestCount = requests.length;
  controller.abort();
  assert.equal(await loader.load('Aborted'), null);
  assert.equal(requests.length, requestCount);
  loader.dispose();
  assert.equal(faces.size, 0, 'navigation releases all of this component’s fonts');
});
