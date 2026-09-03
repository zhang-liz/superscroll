import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('../engine/scrub.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../engine/scrub.css', import.meta.url), 'utf8');

test('engine follows the smoothness rules', () => {
  assert.match(js, /autoRaf:\s*false/);
  assert.match(js, /lagSmoothing\(0\)/);
  assert.match(js, /createImageBitmap/);
  assert.match(js, /requestIdleCallback/);
  assert.match(js, /Math\.min\(.*devicePixelRatio.*,\s*2\)/);
  assert.match(js, /prefers-reduced-motion/);
  assert.match(js, /visibilitychange/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /window\.__ss/);
});

test('engine bounds memory and guards bad input', () => {
  assert.match(js, /Number\.isInteger\(count\)/);
  assert.match(js, /revokeObjectURL/);
  assert.match(js, /lgW|dataset\[set \+ 'W'\]/);
  assert.match(js, /\b48\b/);
});

test('engine css has no banned patterns', () => {
  assert.doesNotMatch(css, /transition:\s*all/);
  assert.doesNotMatch(css, /ease-in[^-]/);
  assert.doesNotMatch(css, /scale\(0\)/);
  assert.match(css, /prefers-reduced-motion/);
});
