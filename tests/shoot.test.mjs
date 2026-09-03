import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { safePath } from '../scripts/shoot.mjs';

const root = new URL('..', import.meta.url).pathname;
const tmp = `${root}tests/tmp/shoot`;

test('shoot.mjs screenshots a filled site and passes canvas checks', { timeout: 180000 }, () => {
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  execFileSync(`${root}tests/fixtures/make-clip.sh`, [`${tmp}/clip.mp4`, '5']);
  execFileSync(`${root}scripts/frames.sh`, [`${tmp}/clip.mp4`, `${tmp}/site`], { stdio: 'pipe' });
  writeFileSync(`${tmp}/brief.json`, JSON.stringify({ look: 'neon-signal', name: 'Volt', tagline: 'Sneakers for night runs', type: 'product', hook: 'Built for the dark.', context: 'Made in small runs.', peakText: 'Every pair is hand checked.', items: [{ title: 'Volt One', text: 'Reflective knit.', href: '#' }], cta: { label: 'Buy', href: '#' }, contact: 'hello@volt.run' }));
  execFileSync('node', [`${root}scripts/fill.mjs`, `${tmp}/brief.json`, `${tmp}/site`]);
  execFileSync('node', [`${root}scripts/shoot.mjs`, `${tmp}/site`], { stdio: 'pipe' });
  for (const f of ['desktop-pre', 'desktop-0', 'desktop-50', 'desktop-100', 'section-work', 'mobile-50', 'reduced']) assert.ok(existsSync(`${tmp}/site/shots/${f}.png`), f);
  const v = readFileSync(`${tmp}/site/VERIFY.md`, 'utf8');
  assert.match(v, /canvas non-blank: pass/);
  assert.match(v, /frame advances: pass/);
  assert.match(v, /404s: 0/);
  assert.match(v, /reduced motion: pass/);
  assert.match(v, /poster before frames: pass/);
});

test('shoot.mjs cleans up and reports on a crash instead of a hard failure', { timeout: 120000 }, () => {
  const bad = `${root}tests/tmp/shoot-bad`;
  rmSync(bad, { recursive: true, force: true }); mkdirSync(`${bad}/site`, { recursive: true });
  writeFileSync(`${bad}/site/index.html`, '<!doctype html><html><body><p>no hero</p></body></html>');
  let status = 0;
  try { execFileSync('node', [`${root}scripts/shoot.mjs`, `${bad}/site`], { stdio: 'pipe' }); }
  catch (e) { status = e.status; }
  assert.equal(status, 1);
  assert.ok(existsSync(`${bad}/site/VERIFY.md`));
  const v = readFileSync(`${bad}/site/VERIFY.md`, 'utf8');
  assert.match(v, /hero present: FAIL|crash:/);
});

test('safePath refuses to serve anything outside the site root', () => {
  assert.equal(safePath('/a/site', '/../../etc/passwd'), null);
  assert.equal(safePath('/a/site', '/%2e%2e/%2e%2e/etc/passwd'), null);
  assert.equal(safePath('/a/site', '/index.html'), '/a/site/index.html');
});
