import test from 'node:test';
import assert from 'node:assert/strict';
import { centeredDumpImage } from '../src/lib/dump-description.ts';

const images = [
  { top: 650, height: 700 },
  { top: 1360, height: 500 },
  { top: 1870, height: 400 },
  { top: 2280, height: 700 },
];

test('description remains hidden until the first image center arrives, including scroll back to intro', () => {
  assert.equal(centeredDumpImage(images, 0, 900), -1);
  assert.equal(centeredDumpImage(images, 549, 900), -1);
  assert.equal(centeredDumpImage(images, 550, 900), 0);
  assert.equal(centeredDumpImage(images, 0, 900), -1);
  assert.equal(centeredDumpImage([], 800, 900), -1);
});

test('description follows the closest center in either direction and across repeated images', () => {
  assert.equal(centeredDumpImage(images, 1160, 900), 1);
  assert.equal(centeredDumpImage(images, 1620, 900), 2);
  assert.equal(centeredDumpImage(images, 2180, 900), 3);
  assert.equal(centeredDumpImage(images, 1160, 900), 1);
  assert.equal(centeredDumpImage(images, 855, 900), 0, 'ties keep the earlier image');
  assert.equal(centeredDumpImage(images, 856, 900), 1);
});
