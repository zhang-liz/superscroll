import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('..', import.meta.url).pathname;
const tmp = `${root}tests/tmp/fill`;
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');

test('fill.mjs builds a site from a brief and copies engine verbatim', () => {
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const brief = { look: 'studio-white', name: 'Volt', tagline: 'Sneakers for night runs', type: 'product', hook: 'Built for the dark.', context: 'Made in small runs.', items: [{ title: 'Volt One', text: 'Reflective knit.', href: '#' }], cta: { label: 'Buy', href: '#' }, frames: 140, pin: '400vh', signature: 'spec labels pin to the shoe' };
  writeFileSync(`${tmp}/brief.json`, JSON.stringify(brief));
  const out = execFileSync('node', [`${root}scripts/fill.mjs`, `${tmp}/brief.json`, `${tmp}/site`]).toString();
  const html = readFileSync(`${tmp}/site/index.html`, 'utf8');
  assert.match(html, /Volt/);
  assert.match(html, /data-frames="140"/);
  assert.doesNotMatch(html, /\{\{NAME\}\}/);
  assert.match(html, /\{\{TODO contact\}\}/);
  assert.match(out, /todo: contact/);
  const css = readFileSync(`${tmp}/site/styles.css`, 'utf8');
  assert.match(css, /--ss-font-display:\s*"Manrope"/);
  assert.equal(sha(`${tmp}/site/scrub.js`), sha(`${root}engine/scrub.js`));
  assert.ok(existsSync(`${tmp}/site/scrub-core.js`));
});
