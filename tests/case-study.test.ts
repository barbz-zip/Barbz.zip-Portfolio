import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getProjects } from '../src/data/projects.ts';
import { validateGalleryRow } from '../sanity/schemaTypes/index.mjs';

test('CMS supports every image count and orientation combination', () => {
  for (const orientation of ['portrait', 'landscape', 'original']) {
    assert.equal(validateGalleryRow({ layout: 'single', orientation, images: [{}] }), true);
    assert.equal(validateGalleryRow({ layout: 'pair', orientation, images: [{}, {}] }), true);
    assert.notEqual(validateGalleryRow({ layout: 'single', orientation, images: [{}, {}] }), true);
    assert.notEqual(validateGalleryRow({ layout: 'pair', orientation, images: [{}] }), true);
  }
  assert.notEqual(validateGalleryRow(undefined), true);
  assert.notEqual(validateGalleryRow({ layout: 'pair', orientation: 'square', images: [{}, {}] }), true);
});

test('every modal destination has a unique valid project route and valid image blocks', async () => {
  const projects = await getProjects();
  assert.equal(new Set(projects.map(project => project.slug)).size, projects.length);
  for (const project of projects) {
    assert.match(project.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(project.caseStudy.gallery.length > 0);
    for (const row of project.caseStudy.gallery) {
      assert.equal(validateGalleryRow(row), true);
      for (const image of row.images) assert.ok(image.src && image.alt);
    }
  }
});
