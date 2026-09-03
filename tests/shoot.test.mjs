import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const tmp = `${root}tests/tmp/shoot`;

test('shoot.mjs screenshots a filled site and passes canvas checks', { timeout: 180000 }, () => {
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  execFileSync(`${root}tests/fixtures/make-clip.sh`, [`${tmp}/clip.mp4`, '5']);
  execFileSync(`${root}scripts/frames.sh`, [`${tmp}/clip.mp4`, `${tmp}/site`], { stdio: 'pipe' });
  writeFileSync(`${tmp}/brief.json`, JSON.stringify({ look: 'neon-signal', name: 'Volt', tagline: 'Sneakers for night runs', type: 'product', hook: 'Built for the dark.', context: 'Made in small runs.', peakText: 'Every pair is hand checked.', items: [{ title: 'Volt One', text: 'Reflective knit.', href: '#' }], cta: { label: 'Buy', href: '#' }, contact: 'hello@volt.run' }));
  execFileSync('node', [`${root}scripts/fill.mjs`, `${tmp}/brief.json`, `${tmp}/site`]);
  execFileSync('node', [`${root}scripts/shoot.mjs`, `${tmp}/site`], { stdio: 'pipe' });
  for (const f of ['desktop-0', 'desktop-50', 'desktop-100', 'section-work', 'mobile-50', 'reduced']) assert.ok(existsSync(`${tmp}/site/shots/${f}.png`), f);
  const v = readFileSync(`${tmp}/site/VERIFY.md`, 'utf8');
  assert.match(v, /canvas non-blank: pass/);
  assert.match(v, /frame advances: pass/);
  assert.match(v, /404s: 0/);
  assert.match(v, /reduced motion: pass/);
});
