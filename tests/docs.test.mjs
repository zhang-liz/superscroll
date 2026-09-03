import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const skill = readFileSync(`${root}SKILL.md`, 'utf8');

test('SKILL.md has frontmatter and links that resolve', () => {
  assert.match(skill, /^---\nname: superscroll\ndescription: .+\n---/);
  for (const m of skill.matchAll(/\b(references\/[a-z-]+\.md|scripts\/[a-z-]+\.(sh|mjs)|engine\/[a-z-]+\.(js|css)|templates\/[a-z]+\.(html|css))/g)) {
    assert.ok(existsSync(`${root}${m[1]}`), `missing ${m[1]}`);
  }
  for (const s of ['frames.sh', 'kenburns.sh', 'concat.sh']) assert.ok(statSync(`${root}scripts/${s}`).mode & 0o111, `${s} not executable`);
  for (const f of ['taste', 'story', 'engine', 'adapters', 'prompts', 'verify', 'interview', 'looks']) assert.ok(existsSync(`${root}references/${f}.md`), f);
  assert.ok(existsSync(`${root}FINGERPRINTS.md`));
  assert.ok(existsSync(`${root}README.md`));
});

test('SKILL.md carries the ten steps and the one-question rule', () => {
  for (let i = 1; i <= 10; i++) assert.match(skill, new RegExp(`\\n${i}\\. `), `step ${i}`);
  assert.match(skill, /one message/i);
  assert.match(skill, /never deploy/i);
});
