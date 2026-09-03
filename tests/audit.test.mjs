import { test } from 'node:test';
import assert from 'node:assert/strict';
import { audit } from '../scripts/audit.mjs';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;

test('audit flags every rule in the bad fixture', () => {
  const { findings, ok } = audit(`${root}tests/fixtures/audit-bad`, { skillDir: root });
  const rules = new Set(findings.map(f => f.rule));
  for (const r of ['font-inter', 'font-system-display', 'color-black', 'color-purple', 'color-cream-brass', 'css-transition-all', 'css-ease-in', 'css-scale-zero', 'css-transition-prop', 'html-poster-attrs', 'html-canvas-hidden', 'html-icon-button', 'html-kicker', 'html-three-cards', 'copy-banned-word', 'copy-todo', 'budget-count', 'a11y-contrast', 'a11y-reduced-motion', 'engine-hash']) {
    assert.ok(rules.has(r), `missing rule ${r}: ${[...rules].join(',')}`);
  }
  assert.equal(ok, false);
  assert.ok(findings.every(f => typeof f.line === 'number' && f.file));
});

test('audit passes on a filled site with frames', () => {
  const tmp = `${root}tests/tmp/audit-good`;
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  execFileSync(`${root}tests/fixtures/make-clip.sh`, [`${tmp}/clip.mp4`, '5']);
  execFileSync(`${root}scripts/frames.sh`, [`${tmp}/clip.mp4`, `${tmp}/site`], { stdio: 'pipe' });
  writeFileSync(`${tmp}/brief.json`, JSON.stringify({ look: 'noir-editorial', name: 'Volt', tagline: 'Sneakers for night runs', type: 'product', hook: 'Built for the dark.', context: 'Made in small runs.', peakText: 'Every pair is hand checked.', items: [{ title: 'Volt One', text: 'Reflective knit.', href: '#' }], cta: { label: 'Buy', href: '#' }, contact: 'hello@volt.run', pin: '400vh' }));
  execFileSync('node', [`${root}scripts/fill.mjs`, `${tmp}/brief.json`, `${tmp}/site`]);
  const { findings, ok } = audit(`${tmp}/site`, { skillDir: root });
  assert.deepEqual(findings, []);
  assert.equal(ok, true);
});
