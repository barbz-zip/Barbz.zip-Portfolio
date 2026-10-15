import test from 'node:test';
import assert from 'node:assert/strict';
import { dumpImagePresence } from '../src/lib/dump-motion.ts';

test('dump images reach full presence at the viewport center and recede symmetrically', () => {
  const center = dumpImagePresence(450, 900, 700);
  assert.equal(center.scale, 1.12);
  assert.equal(center.brightness, 1);
  assert.deepEqual(dumpImagePresence(100, 900, 700), dumpImagePresence(800, 900, 700));
  const near = dumpImagePresence(600, 900, 700);
  const far = dumpImagePresence(1000, 900, 700);
  assert.ok(near.scale > far.scale && near.brightness > far.brightness);
  for (const position of [-10000, 10000]) {
    assert.deepEqual(dumpImagePresence(position, 900, 700), { scale: .55, brightness: .35 });
  }
});
