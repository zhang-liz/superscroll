#!/usr/bin/env node
// Playwright verification. Usage: node scripts/shoot.mjs sitedir
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execSync } from 'node:child_process';

const site = process.argv[2]; if (!site) { console.error('usage: shoot.mjs sitedir'); process.exit(2); }
const shots = join(site, 'shots'); mkdirSync(shots, { recursive: true });

async function getPlaywright() {
  try { return await import('playwright'); }
  catch {
    console.log('installing playwright chromium (one time)');
    execSync('npm i -g playwright@1.55.0 && npx -y playwright@1.55.0 install chromium', { stdio: 'inherit' });
    const g = execSync('npm root -g').toString().trim();
    return await import(join(g, 'playwright', 'index.mjs'));
  }
}
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' };
const server = createServer((req, res) => {
  const p = join(site, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const { chromium } = await getPlaywright();
const browser = await chromium.launch();
const results = []; const fails = [];
const note = (k, ok, extra = '') => { results.push(`${k}: ${ok ? 'pass' : 'FAIL'}${extra ? ' ' + extra : ''}`); if (!ok) fails.push(k); };

async function run(viewport, prefix, reduced) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const bad = [];
  page.on('response', r => { if (r.status() >= 400) bad.push(r.url()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ss && window.__ss.ready, null, { timeout: 20000 }).catch(() => {});
  const ready = await page.evaluate(() => !!(window.__ss && window.__ss.ready));
  note(`${prefix} engine ready`, ready);
  const settle = async () => { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await page.waitForTimeout(250); };

  if (reduced) {
    await settle();
    await page.screenshot({ path: join(shots, 'reduced.png') });
    const ok = await page.evaluate(() => { const p = document.querySelector('.ss-poster'), c = document.querySelector('.ss-canvas'); return getComputedStyle(p).opacity === '1' && getComputedStyle(c).display === 'none'; });
    note('reduced motion', ok);
    await ctx.close(); return;
  }

  const heroH = await page.evaluate(() => document.querySelector('.ss-hero')?.getBoundingClientRect().height ?? 0);
  if (heroH === 0) { note(`${prefix} hero present`, false); await ctx.close(); return; }
  const vh = viewport.height;
  const drawnAt = [];
  let blankFails = 0;
  for (const p of [0, 25, 50, 75, 100]) {
    const y = Math.round((heroH - vh) * (p / 100));
    await page.evaluate(y => { if (window.__ss.lenis) window.__ss.lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); }, y);
    await page.waitForTimeout(600); await settle();
    await page.screenshot({ path: join(shots, `${prefix}-${p}.png`) });
    const s = await page.evaluate(() => {
      const c = document.querySelector('.ss-canvas'); if (!c) return { drawn: -1, allBg: true };
      const g = c.getContext('2d');
      const bg = getComputedStyle(document.body).backgroundColor;
      const pts = [[0.2, 0.2], [0.5, 0.5], [0.8, 0.8], [0.8, 0.2], [0.2, 0.8]].map(([x, y]) => { const d = g.getImageData(Math.floor(c.width * x), Math.floor(c.height * y), 1, 1).data; return `rgb(${d[0]}, ${d[1]}, ${d[2]})`; });
      return { drawn: window.__ss.drawn, allBg: pts.every(v => v === bg) };
    });
    drawnAt.push(s.drawn);
    if (p > 0 && s.allBg) blankFails++;
  }
  if (prefix === 'desktop') {
    note('canvas non-blank', blankFails === 0, `(${5 - blankFails - 1}/4 positions)`);
    note('frame advances', drawnAt[4] > drawnAt[0] && drawnAt[2] > drawnAt[0], `(${drawnAt.join(' -> ')})`);
    for (const id of ['context', 'work', 'about', 'contact']) {
      await page.evaluate(id => { const el = document.getElementById(id); const y = el.getBoundingClientRect().top + window.scrollY - 40; if (window.__ss.lenis) window.__ss.lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); }, id);
      await page.waitForTimeout(500); await settle();
      await page.screenshot({ path: join(shots, `section-${id}.png`) });
    }
  }
  results.push(`${prefix} 404s: ${bad.length}${bad.length ? ' ' + bad.slice(0, 3).join(' ') : ''}`);
  if (bad.length) fails.push(`${prefix} 404s`);
  await ctx.close();
}

try {
  await run({ width: 1440, height: 900 }, 'desktop', false);
  await run({ width: 390, height: 844 }, 'mobile', false);
  await run({ width: 1440, height: 900 }, 'desktop', true);
} catch (e) {
  results.push('crash: ' + (e && e.message ? e.message : String(e)));
  fails.push('crash');
} finally {
  await browser.close().catch(() => {});
  server.close();
}

const md = `# VERIFY\n\n${results.map(r => '- ' + r).join('\n')}\n\nShots in shots/. Result: ${fails.length ? 'FAIL ' + fails.join(', ') : 'PASS'}\n`;
writeFileSync(join(site, 'VERIFY.md'), md);
console.log(md);
process.exit(fails.length ? 1 : 0);
