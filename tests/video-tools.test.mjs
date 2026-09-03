import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const tmp = `${root}tests/tmp/video`;
const dur = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

test('kenburns.sh joins 3 photos into one clip about 14 s long', () => {
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  for (const [i, c] of ['red', 'green', 'blue'].entries()) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${c}:s=2400x1600`, '-frames:v', '1', `${tmp}/p${i}.jpg`]);
  }
  execFileSync(`${root}scripts/kenburns.sh`, [`${tmp}/kb.mp4`, `${tmp}/p0.jpg`, `${tmp}/p1.jpg`, `${tmp}/p2.jpg`], { stdio: 'pipe' });
  const d = dur(`${tmp}/kb.mp4`);
  assert.ok(Math.abs(d - 14) < 0.6, `duration ${d}`);
});

test('concat.sh joins two clips', () => {
  execFileSync(`${root}tests/fixtures/make-clip.sh`, [`${tmp}/a.mp4`, '2']);
  execFileSync(`${root}tests/fixtures/make-clip.sh`, [`${tmp}/b.mp4`, '3']);
  execFileSync(`${root}scripts/concat.sh`, [`${tmp}/ab.mp4`, `${tmp}/a.mp4`, `${tmp}/b.mp4`], { stdio: 'pipe' });
  const d = dur(`${tmp}/ab.mp4`);
  assert.ok(Math.abs(d - 5) < 0.3, `duration ${d}`);
});
