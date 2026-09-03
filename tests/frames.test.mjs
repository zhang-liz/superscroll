import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const tmp = `${root}tests/tmp/frames`;

test('frames.sh makes lg, sm, poster and manifest within budgets', () => {
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  execFileSync(`${root}tests/fixtures/make-clip.sh`, [`${tmp}/clip.mp4`, '5']);
  execFileSync(`${root}scripts/frames.sh`, [`${tmp}/clip.mp4`, `${tmp}/site`], { stdio: 'pipe' });
  const m = JSON.parse(readFileSync(`${tmp}/site/manifest.json`, 'utf8'));
  assert.ok(m.count >= 100 && m.count <= 160, `count ${m.count}`);
  assert.equal(readdirSync(`${tmp}/site/frames/lg`).length, m.count);
  assert.equal(readdirSync(`${tmp}/site/frames/sm`).length, m.count);
  assert.ok(existsSync(`${tmp}/site/frames/lg/frame-0001.webp`));
  assert.ok(existsSync(`${tmp}/site/frames/poster.webp`));
  assert.equal(m.lg.w, 1600);
  assert.equal(m.sm.w, 850);
  assert.ok(m.lg.bytes < 6 * 1024 * 1024);
  assert.ok(m.sm.bytes < 3 * 1024 * 1024);
});

test('frames.sh exits 3 with a hint when SS_FRAMES is out of range', () => {
  let code = 0, err = '';
  try {
    execFileSync(`${root}scripts/frames.sh`, [`${tmp}/clip.mp4`, `${tmp}/site2`], { env: { ...process.env, SS_FRAMES: '40' }, stdio: 'pipe' });
  } catch (e) { code = e.status; err = String(e.stderr); }
  assert.equal(code, 3);
  assert.match(err, /hint:/);
});
