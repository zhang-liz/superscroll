import { test } from 'node:test';
import assert from 'node:assert/strict';

await import('../engine/scrub-core.js');
const core = globalThis.SuperscrollCore;

test('coverRect fills and centers', () => {
  const r = core.coverRect(1600, 900, 800, 800);
  assert.equal(r.h, 800);
  assert.ok(Math.abs(r.w - 1422.22) < 0.1);
  assert.ok(Math.abs(r.x - (800 - r.w) / 2) < 0.001);
  assert.equal(r.y, 0);
});

test('stagedOrder puts every 8th plus last first, rest fills the gaps', () => {
  const { first, rest } = core.stagedOrder(20, 8);
  assert.deepEqual(first, [0, 8, 16, 19]);
  assert.equal(first.length + rest.length, 20);
  assert.ok(!rest.includes(19));
  assert.deepEqual(new Set([...first, ...rest]).size, 20);
});

test('frameForProgress clamps and rounds', () => {
  assert.equal(core.frameForProgress(-1, 140), 0);
  assert.equal(core.frameForProgress(2, 140), 139);
  assert.equal(core.frameForProgress(0.5, 141), 70);
});

test('lerpIndex snaps when within one frame, eases otherwise', () => {
  assert.equal(core.lerpIndex(10, 10.6), 10.6);
  assert.equal(core.lerpIndex(0, 100, 0.2), 20);
});

test('pickSet', () => {
  assert.equal(core.pickSet(1440, false), 'lg');
  assert.equal(core.pickSet(390, false), 'sm');
  assert.equal(core.pickSet(1440, true), 'sm');
});

test('padFrame is 1-based and zero padded', () => {
  assert.equal(core.padFrame(0), '0001');
  assert.equal(core.padFrame(139), '0140');
});
