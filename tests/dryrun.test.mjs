import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const tmp = `${root}tests/tmp/dryrun`;

test('dryrun.sh passes end to end on a synthetic clip', { timeout: 240000 }, () => {
  rmSync(tmp, { recursive: true, force: true });
  const out = execFileSync(`${root}scripts/dryrun.sh`, [tmp], { stdio: 'pipe' }).toString();
  assert.match(out, /dryrun: PASS/);
  assert.ok(existsSync(`${tmp}/site/VERIFY.md`));
  assert.ok(existsSync(`${tmp}/site/shots/desktop-50.png`));
});
