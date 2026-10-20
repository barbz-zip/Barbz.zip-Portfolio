import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import fonts from '../src/data/home-fonts.mjs';
import { googleFontFamily, googleFontStylesheet, validateFontLinks } from '../src/lib/google-fonts.mjs';
import { advanceAxis, pickFont } from '../src/lib/wordmark-motion.ts';
import {localHome} from '../src/data/home.ts';

test('the supplied catalog has 160 valid unique families and seeds the CMS', () => {
  assert.equal(fonts.length, 160);
  assert.equal(validateFontLinks(fonts), true);
  assert.deepEqual(localHome.fonts, fonts);
});

test('Google Fonts URLs are normalized and only the displayed text is requested', () => {
  assert.equal(googleFontFamily('https://fonts.google.com/specimen/IBM+Plex+Mono?preview.text=test'), 'IBM Plex Mono');
  assert.equal(googleFontFamily('https://fonts.google.com/specimen/Playwrite+England+SemiJoined'), 'Playwrite GB S');
  assert.equal(googleFontFamily('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap'), 'DM Sans');
  for (const value of ['javascript:alert(1)', 'https://fonts.google.com.evil.test/specimen/Anton', 'https://fonts.google.com/specimen/%22%3B', 'https://example.com/a', 'https://fonts.googleapis.com/css2?family=Anton&family=Roboto', 'https://fonts.google.com/selection']) {
    assert.equal(googleFontFamily(value), null);
  }
  assert.notEqual(validateFontLinks([]), true);
  assert.notEqual(validateFontLinks([fonts[0], fonts[0]]), true);
  const request = new URL(googleFontStylesheet('IBM Plex Mono', 'barbz.zip'));
  assert.equal(request.searchParams.get('family'), 'IBM Plex Mono');
  assert.equal(request.searchParams.get('text'), 'barbz.zip');
});

test('motion is linear between walls and reflects either edge without losing distance', () => {
  assert.deepEqual(advanceAxis(20, 50, 0.2, 100), { position: 30, velocity: 50, hit: false });
  assert.deepEqual(advanceAxis(99, 50, 0.1, 100), { position: 96, velocity: -50, hit: true });
  assert.deepEqual(advanceAxis(1, -50, 0.1, 100), { position: 4, velocity: 50, hit: true });
  assert.deepEqual(advanceAxis(95, 50, 0.1, 100), { position: 100, velocity: -50, hit: true });
  assert.deepEqual(advanceAxis(5, -50, 0.1, 100), { position: 0, velocity: 50, hit: true });
  assert.equal(advanceAxis(0, 50, 0, 100).hit, false);
  for (const limit of [0, 1, 320, 1400]) {
    for (const velocity of [-100, 100]) {
      const result = advanceAxis(5, velocity, 30, limit);
      assert.ok(result.position >= 0 && result.position <= limit);
      assert.equal(Math.abs(result.velocity), 100);
    }
  }
});

test('font selection excludes the active family and handles short or empty lists', () => {
  assert.equal(pickFont(['A', 'B', 'C'], 'A', () => 0), 'B');
  assert.equal(pickFont(['A', 'B', 'C'], 'A', () => .99), 'C');
  assert.equal(pickFont(['A'], 'A'), null);
  assert.equal(pickFont([], 'A'), null);
  assert.equal(pickFont(['B'], 'A'), 'B');
});
