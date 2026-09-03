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

test('fill.mjs escapes special characters in top-level vars but not in styles.css tokens', () => {
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const brief = { look: 'studio-white', name: 'Ann & "Bo" <Co>', tagline: 'a<b', type: 'product', hook: 'Built for the dark.', context: 'Made in small runs.', items: [{ title: 'Volt One', text: 'Reflective knit.', href: '#' }], cta: { label: 'Buy', href: '#' }, frames: 140, pin: '400vh', signature: 'spec labels pin to the shoe' };
  writeFileSync(`${tmp}/brief.json`, JSON.stringify(brief));
  execFileSync('node', [`${root}scripts/fill.mjs`, `${tmp}/brief.json`, `${tmp}/site`]);
  const html = readFileSync(`${tmp}/site/index.html`, 'utf8');
  assert.match(html, /Ann &amp; &quot;Bo&quot; &lt;Co&gt;/);
  assert.doesNotMatch(html, /<Co>/);
  const css = readFileSync(`${tmp}/site/styles.css`, 'utf8');
  assert.doesNotMatch(css, /&amp;/);
  assert.match(css, /#[0-9A-Fa-f]{6}/);
});

test('fill.mjs rejects unsafe href schemes and writes brief.json', () => {
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const brief = { look: 'studio-white', name: 'Volt', tagline: 'Sneakers', type: 'product', hook: 'Dark.', context: 'Porto.', peakText: 'By hand.', contact: 'hi@volt.run', items: [{ title: 'A', text: 'B', href: 'javascript:alert(2)' }], cta: { label: 'x', href: 'javascript:alert(1)' }, frames: 140 };
  writeFileSync(`${tmp}/in.json`, JSON.stringify(brief));
  const out = execFileSync('node', [`${root}scripts/fill.mjs`, `${tmp}/in.json`, `${tmp}/site`]).toString();
  const html = readFileSync(`${tmp}/site/index.html`, 'utf8');
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /class="cta" href="#"/);
  assert.match(out, /todo: href/);
  assert.ok(existsSync(`${tmp}/site/brief.json`));
  assert.deepEqual(JSON.parse(readFileSync(`${tmp}/site/brief.json`, 'utf8')).look, 'studio-white');
});

test('fill.mjs keeps safe hrefs and stamps the source widths', () => {
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const brief = { look: 'studio-white', name: 'Volt', tagline: 'Sneakers', type: 'product', hook: 'Dark.', context: 'Porto.', peakText: 'By hand.', contact: 'hi@volt.run', items: [{ title: 'A', text: 'B', href: 'https://volt.run/a' }, { title: 'C', text: 'D', href: 'mailto:hi@volt.run' }], cta: { label: 'x', href: '#contact' }, frames: 140 };
  writeFileSync(`${tmp}/in.json`, JSON.stringify(brief));
  const out = execFileSync('node', [`${root}scripts/fill.mjs`, `${tmp}/in.json`, `${tmp}/site`]).toString();
  const html = readFileSync(`${tmp}/site/index.html`, 'utf8');
  assert.match(html, /href="https:\/\/volt.run\/a"/);
  assert.match(html, /href="mailto:hi@volt.run"/);
  assert.match(html, /data-lg-w="1600"/);
  assert.match(html, /data-sm-w="850"/);
  assert.doesNotMatch(out, /todo: href/);
});
