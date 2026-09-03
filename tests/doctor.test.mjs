import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnose } from '../scripts/doctor.mjs';

const fake = (map) => (cmd) => {
  for (const [k, v] of Object.entries(map)) if (cmd.startsWith(k)) { if (v instanceof Error) throw v; return v; }
  throw new Error('not found: ' + cmd);
};

test('diagnose reports tools and live providers', () => {
  const r = diagnose(fake({
    'ffmpeg -version': 'ffmpeg version 8.1.2',
    'ffprobe -version': 'ffprobe version 8.1.2',
    'cwebp -version': 'cwebp 1.5.0',
    'claude mcp list': 'plugin:exa:exa: ... Connected\nfal-ai: https://mcp.fal.ai/mcp (HTTP) - ✔ Connected\nrunway: https://mcp.runwayml.com/mcp - ✘ Failed',
    'higgsfield account status': new Error('no'),
    'node -e': 'ok',
  }));
  assert.equal(r.ffmpeg, true);
  assert.equal(r.cwebp, true);
  assert.equal(r.providers.fal, true);
  assert.equal(r.providers.runway, false);
  assert.equal(r.providers.higgsfield, false);
  assert.equal(r.ok, true);
});

test('diagnose flags missing ffmpeg', () => {
  const r = diagnose(fake({ 'ffmpeg -version': new Error('x'), 'ffprobe -version': new Error('x'), 'cwebp -version': new Error('x'), 'claude mcp list': '', 'higgsfield account status': new Error('x'), 'node -e': new Error('x') }));
  assert.equal(r.ffmpeg, false);
  assert.equal(r.ok, false);
});

test('diagnose does not match a provider name inside another tool name', () => {
  const r = diagnose(fake({
    'ffmpeg -version': 'v', 'ffprobe -version': 'v', 'cwebp -version': 'v', 'node -e': 'ok',
    'higgsfield account status': new Error('no'),
    'claude mcp list': 'my-default-tools: http://x (HTTP) - \u2714 Connected\nfalcon-x: http://y - \u2714 Connected',
  }));
  assert.equal(r.providers.fal, false);
  assert.equal(r.providers.runway, false);
  assert.equal(r.providers.replicate, false);
  assert.equal(r.providers.blender, false);
});
