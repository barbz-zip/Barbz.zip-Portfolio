import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { wrap, copiesFor } from '../src/lib/gallery-math.ts';

test('loop stays seamless across either edge and large wheel gestures', () => {
  for (const cycle of [326, 1630, 2608]) {
    for (const value of [-100000, -cycle - 1, -1, 0, cycle - 1, cycle, 100000]) {
      const result = wrap(value, cycle);
      assert.ok(result >= 0 && result < cycle);
      assert.equal(wrap(value + cycle * 20, cycle), result);
    }
  }
  assert.equal(wrap(20, 0), 0);
});

test('enough copies cover wide screens even with just one project', () => {
  for (const viewport of [320, 390, 1512, 2560, 5120]) {
    for (const cycle of [326, 1630, 2608]) {
      assert.ok((copiesFor(viewport, cycle) - 2) * cycle >= viewport);
    }
  }
});
