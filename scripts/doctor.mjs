#!/usr/bin/env node
// Environment and provider check. Usage: node scripts/doctor.mjs
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const has = (run, cmd) => { try { run(cmd); return true; } catch { return false; } };
const connected = (list, name) => list.split('\n').some(l => l.toLowerCase().includes(name) && /connected/i.test(l) && !/failed/i.test(l));

export function diagnose(run) {
  const node = process.versions.node;
  const ffmpeg = has(run, 'ffmpeg -version');
  const ffprobe = has(run, 'ffprobe -version');
  const cwebp = has(run, 'cwebp -version');
  const playwright = has(run, "node -e \"require.resolve('playwright')\"");
  let list = ''; try { list = run('claude mcp list'); } catch { list = ''; }
  const providers = {
    fal: connected(list, 'fal'),
    runway: connected(list, 'runway'),
    replicate: connected(list, 'replicate'),
    blender: connected(list, 'blender'),
    higgsfield: has(run, 'higgsfield account status'),
  };
  return { node, ffmpeg, ffprobe, cwebp, playwright, providers, ok: ffmpeg && ffprobe && cwebp };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = cmd => execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 }).toString();
  const r = diagnose(run);
  const yn = b => (b ? 'yes' : 'no');
  console.log(`node ${r.node}`);
  console.log(`ffmpeg ${yn(r.ffmpeg)}  ffprobe ${yn(r.ffprobe)}  cwebp ${yn(r.cwebp)}  playwright ${yn(r.playwright)} (installed on first verify if no)`);
  if (!r.cwebp) console.log('hint: brew install webp');
  const live = Object.entries(r.providers).filter(([, v]) => v).map(([k]) => k);
  console.log(`video providers live: ${live.length ? live.join(', ') : 'none'}`);
  if (!live.length) console.log('hint: cheapest setup is fal: claude mcp add --transport http fal-ai https://mcp.fal.ai/mcp --header "Authorization: Bearer $FAL_KEY"');
  console.log('json:' + JSON.stringify(r));
  process.exit(r.ok ? 0 : 1);
}
