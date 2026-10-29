import {strict as assert} from 'node:assert';
import {test, type TestContext} from 'node:test';
import {projectSlides} from '../src/lib/project-slides.ts';
import {initProjectSlideshow} from '../src/lib/project-slideshow.ts';
import {getLocalProjects} from '../src/data/projects.ts';

test('preview follows internal image order, removes duplicates and falls back to cover', async () => {
  const project = (await getLocalProjects()).find(project => project.slug === 'nursegrid')!;
  assert.equal(projectSlides(project).length, 2);
  assert.deepEqual(projectSlides(project).map(image => image.src), [project.caseStudy.gallery[0].images[0].src, project.caseStudy.gallery[1].images[0].src]);
  assert.deepEqual(projectSlides({...project, caseStudy: {...project.caseStudy, gallery: []}}), [project.cover]);
  assert.deepEqual(projectSlides({...project, caseStudy: {...project.caseStudy, gallery: [{key: 'video', layout: 'single', orientation: 'original', images: [{kind: 'video', src: '/movie.mp4', alt: 'Movie'}]}]}}), [project.cover]);
});

function slideshow(t: TestContext, count = 3) {
  t.mock.timers.enable({apis: ['setTimeout']});
  const document = Object.assign(new EventTarget(), {hidden: false});
  const mounted: Array<{id: number; style: {opacity: string}}> = [];
  function slide(id: number) {
    const element = {id, style: {opacity: ''}, querySelector: () => ({decode: () => Promise.resolve()}), remove() { const at = mounted.indexOf(element); if (at >= 0) mounted.splice(at, 1); }};
    return element;
  }
  const root = {append: (element: ReturnType<typeof slide>) => mounted.push(element), querySelectorAll: () => Array.from({length: count}, (_, id) => ({content: {firstElementChild: {cloneNode: () => slide(id)}}}))};
  for (const [key, value] of Object.entries({document, matchMedia: () => ({matches: true})})) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, {value, configurable: true});
    t.after(() => {if (original) Object.defineProperty(globalThis, key, original); else Reflect.deleteProperty(globalThis, key);});
  }
  const stop = initProjectSlideshow(root as unknown as HTMLElement);
  t.after(stop);
  return {document, mounted, stop, active: () => mounted.find(element => element.style.opacity === '1')?.id};
}
const flush = async () => {for (let i = 0; i < 5; i++) await Promise.resolve();};

test('slideshow changes every four seconds, loops and only prepares the next image', async t => {
  const s = slideshow(t);
  await flush();
  assert.equal(s.active(), 0);
  assert.equal(s.mounted.length, 2);
  t.mock.timers.tick(3999); await flush();
  assert.equal(s.active(), 0);
  t.mock.timers.tick(1); await flush();
  assert.equal(s.active(), 1);
  assert.equal(s.mounted.length, 2);
  t.mock.timers.tick(4000); await flush();
  assert.equal(s.active(), 2);
  t.mock.timers.tick(4000); await flush();
  assert.equal(s.active(), 0);
  s.stop();
  t.mock.timers.tick(8000); await flush();
  assert.equal(s.active(), 0);
  assert.equal(s.mounted.length, 1);
});

test('hidden tab pauses the slideshow and returning starts a fresh viewing interval', async t => {
  const s = slideshow(t);
  await flush();
  s.document.hidden = true;
  s.document.dispatchEvent(new Event('visibilitychange'));
  t.mock.timers.tick(12000); await flush();
  assert.equal(s.active(), 0);
  s.document.hidden = false;
  s.document.dispatchEvent(new Event('visibilitychange'));
  t.mock.timers.tick(3999); await flush();
  assert.equal(s.active(), 0);
  t.mock.timers.tick(1); await flush();
  assert.equal(s.active(), 1);
});

test('a single image stays static and closing before decoding does not start playback', async t => {
  const s = slideshow(t, 1);
  s.stop();
  await flush();
  t.mock.timers.tick(12000); await flush();
  assert.equal(s.active(), 0);
  assert.equal(s.mounted.length, 1);
});
